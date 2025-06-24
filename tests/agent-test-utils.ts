import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { processChatRequest } from '@/lib/chat/agent';
import { db, activities } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Types for our test scenarios
export interface TestScenario {
  name: string;
  user_input: string;
  current_state: {
    active_sessions: Array<{
      type: 'sleep' | 'feed' | 'diaper';
      id: string;
      started: string;
    }>;
  };
  expected: {
    action: string;
    type?: string;
    volume?: number;
    contents?: string;
    feed_type?: 'bottle' | 'nursing';
    activity_id?: string;
    duration?: number;
    
    // Diaper-specific fields
    diaper_volume?: 'little' | 'medium' | 'large';
    poo_color?: 'yellow' | 'brown' | 'green' | 'black' | 'other';
    
    // Time-related expectations
    time_parsing_required?: boolean;
    time_offset_minutes?: number;  // Offset from device time
    instant_activity?: boolean;    // Start and end time are the same
    
    // Validation flags
    no_conflicts?: boolean;
    completed?: boolean;
    message?: string;
    description?: string;
  };
  description?: string;
}

export interface TestSuite {
  scenarios: TestScenario[];
}

// Test constants
export const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
export const TEST_CHILD_ID = '550e8400-e29b-41d4-a716-446655440001';
export const TEST_DEVICE_TIME = '2025-01-03T15:30:00-05:00'; // 3:30 PM EST

// Setup active sessions in database for testing
export async function setupActiveSession(sessionData: { type: string; id: string; started: string }): Promise<string> {
  const startTime = parseTestTime(sessionData.started);
  
  // Don't pass id - let database auto-generate UUID
  const [activity] = await db.insert(activities).values({
    childId: TEST_CHILD_ID,
    createdBy: TEST_USER_ID,
    type: sessionData.type as 'sleep' | 'feed' | 'diaper',
    startTime,
    endTime: null
  }).returning();

  return activity.id;
}

// Parse test time strings like "30min_ago", "6hours_ago"
export function parseTestTime(timeStr: string): Date {
  const deviceTime = new Date(TEST_DEVICE_TIME);
  
  if (timeStr === 'now') return deviceTime;
  
  const match = timeStr.match(/(\d+)(min|hour)s?_ago/);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];
    const minutes = unit === 'hour' ? amount * 60 : amount;
    return new Date(deviceTime.getTime() - minutes * 60000);
  }
  
  throw new Error(`Unknown test time format: ${timeStr}`);
}

// Clean up database after each test
export async function cleanupDatabase() {
  await db.delete(activities).where(eq(activities.childId, TEST_CHILD_ID));
}

// Load test scenarios from YAML
export function loadTestScenarios(): TestSuite {
  const yamlPath = path.join(__dirname, 'chat-scenarios.yml');
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`Test scenarios file not found: ${yamlPath}`);
  }
  
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  return yaml.load(yamlContent) as TestSuite;
}

// Tool call validation protocol
export interface ToolCallValidation {
  name: string;
  parameters?: Record<string, any>;
  result?: Record<string, any>;
  required?: boolean;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: {
    expectedTools: ToolCallValidation[];
    actualTools: any[];
    finalMessage?: string;
  };
}

// Parse streaming response from AI SDK format
async function parseStreamingResponse(streamResponse: any, debugMode = false): Promise<{
  toolCalls: Array<{ name: string; parameters: any; result?: any }>;
  finalMessage: string;
}> {
  const toolCalls: Array<{ name: string; parameters: any; result?: any }> = [];
  const toolCallsMap = new Map<string, { name: string; parameters: any; result?: any }>();
  let finalMessage = '';
  
  try {
    if (debugMode) {
      console.log('\n🔍 DEBUG: Starting to parse AI SDK streaming response...');
    }
    
    // Get the readable stream
    let reader;
    if (streamResponse.getReader) {
      reader = streamResponse.getReader();
    } else if (streamResponse.body && streamResponse.body.getReader) {
      reader = streamResponse.body.getReader();
    } else {
      if (debugMode) console.log('❌ No getReader method found');
      return { toolCalls: [], finalMessage: 'No reader available' };
    }
    
    let chunkCount = 0;
    const allChunks: string[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      chunkCount++;
      
      if (done) {
        if (debugMode) console.log(`✅ Stream complete after ${chunkCount} chunks`);
        break;
      }
      
      const chunkText = new TextDecoder().decode(value);
      allChunks.push(chunkText);
      
      if (debugMode && chunkCount <= 3) { // Show first 3 chunks for debug
        console.log(`📦 Chunk ${chunkCount}:`, chunkText.substring(0, 100));
      }
    }
    
    // Combine all chunks and split by lines
    const fullResponse = allChunks.join('');
    const lines = fullResponse.split('\n').filter(line => line.trim().length > 0);
    
    if (debugMode) {
      console.log(`\n📝 Processing ${lines.length} non-empty lines...`);
    }
    
    let hasErrors = false;
    
    for (const line of lines) {
      try {
        // AI SDK format: prefixed chunks like "9:{json}", "a:{json}", etc.
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const prefix = line.substring(0, colonIndex);
        const jsonStr = line.substring(colonIndex + 1);
        
        if (jsonStr.trim().length === 0) continue;
        
        const data = JSON.parse(jsonStr);
        
        // Handle different types of AI SDK chunks
        if (data.toolCallId && data.toolName && data.args !== undefined) {
          // Tool call chunk (prefix "9:")
          const toolCall = {
            name: data.toolName,
            parameters: data.args,
          };
          toolCallsMap.set(data.toolCallId, toolCall);
          if (debugMode) {
            console.log(`  → Tool call: ${data.toolName}(${Object.keys(data.args).join(', ')})`);
          }
        } else if (data.toolCallId && data.result !== undefined) {
          // Tool result chunk (prefix "a:")
          const existingCall = toolCallsMap.get(data.toolCallId);
          if (existingCall) {
            existingCall.result = data.result;
            if (data.result.error) {
              hasErrors = true;
              console.log(`  → Tool result for: ${existingCall.name} - ERROR: ${data.result.error}`);
            } else if (data.result.success === false) {
              hasErrors = true;
              console.log(`  → Tool result for: ${existingCall.name} - FAILED`);
            } else if (debugMode) {
              console.log(`  → Tool result for: ${existingCall.name} - OK`);
            }
          }
        } else if (data.type === 'text-delta' && data.textDelta) {
          // Text delta chunk
          finalMessage += data.textDelta;
        } else if (typeof data === 'string') {
          // Sometimes final message comes as plain string
          finalMessage += data;
        } else {
          // Capture unknown chunk types
          if (debugMode) {
            console.log(`  → Unknown chunk type ${prefix}: ${JSON.stringify(data)}`);
          }
          
          // Check for error-like messages
          if (data.error || (typeof data === 'string' && data.includes('error'))) {
            hasErrors = true;
            console.log(`  → Unhandled error chunk ${prefix}: ${JSON.stringify(data)}`);
          }
        }
      } catch (e) {
        // Skip lines that aren't valid JSON
        if (debugMode) {
          console.log(`  → Skipping invalid JSON line: ${line.substring(0, 50)}...`);
        }
        continue;
      }
    }
    
    // Show all raw chunks if there were errors
    if (hasErrors && !debugMode) {
      console.log(`\n🔍 Raw stream chunks (due to errors):`);
      lines.slice(0, 20).forEach((line, i) => {
        console.log(`${i}: ${line}`);
      });
      if (lines.length > 20) {
        console.log(`... and ${lines.length - 20} more lines`);
      }
    }
    
    // Convert map to array in order they were added
    toolCalls.push(...Array.from(toolCallsMap.values()));
    
    if (debugMode || hasErrors) {
      console.log(`\n✅ Parsing complete:`);
      console.log(`   Tool calls found: ${toolCalls.length}`);
      console.log(`   Final message length: ${finalMessage.length}`);
      if (finalMessage) console.log(`   Final message: ${finalMessage}`);
      toolCalls.forEach((call, i) => {
        console.log(`   ${i + 1}. ${call.name}(${Object.keys(call.parameters).join(', ')})`);
      });
    }
    
    return { toolCalls, finalMessage };
    
  } catch (error) {
    console.error('❌ Stream parsing error:', error);
    return { toolCalls: [], finalMessage: '' };
  }
}

// Enhanced test function that captures tool calls
export async function testAgentWithScenario(userInput: string, debugMode = false): Promise<{
  success: boolean;
  message: string;
  toolCalls: any[];
  finalMessage: string;
  error?: string;
}> {
  try {
    const streamResult = await processChatRequest({
      messages: [{ role: 'user', content: userInput }],
      userId: TEST_USER_ID,
      childId: TEST_CHILD_ID,
      deviceTime: TEST_DEVICE_TIME
    });

    // Parse the streaming response
    const { toolCalls, finalMessage } = await parseStreamingResponse(streamResult.toDataStream(), debugMode);

    return {
      success: true,
      message: 'Agent executed successfully',
      toolCalls,
      finalMessage
    };
  } catch (error) {
    console.log(`\n❌ Test execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`Stack trace:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      toolCalls: [],
      finalMessage: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Validate tool calls against expected behavior
export function validateToolCalls(
  actualToolCalls: any[], 
  expectedAction: string,
  scenario: TestScenario,
  finalMessage: string
): ValidationResult {
  
  // Define expected tool call patterns based on action
  const expectedTools = getExpectedToolPattern(expectedAction, scenario);
  
  // Validate step by step
  const validations: string[] = [];
  
  // 1. Check if checkActiveSessions was called first
  if (actualToolCalls.length === 0) {
    return {
      passed: false,
      message: 'No tool calls were made',
      details: { expectedTools, actualTools: actualToolCalls }
    };
  }
  
  if (actualToolCalls[0].name !== 'checkActiveSessions') {
    validations.push('Expected checkActiveSessions to be called first');
  }
  
  // 2. Check for time parsing when needed
  if (scenario.expected.time_parsing_required) {
    const hasParseTime = actualToolCalls.some(call => call.name === 'parseUserTime');
    if (!hasParseTime) {
      validations.push('Expected parseUserTime to be called for time references');
    }
  }
  
  // 3. Check main action
  if (expectedAction === 'ask_clarification') {
    // For clarification, check the final message contains question words
    const hasQuestion = /should|would you|do you want|end|update|clarification/i.test(finalMessage);
    if (!hasQuestion) {
      validations.push('Expected clarification question in response');
    }
  } else {
    // For actions, check if the expected tool was called
    const actionCall = actualToolCalls.find(call => 
      !['checkActiveSessions', 'parseUserTime'].includes(call.name)
    );
    
    if (!actionCall) {
      validations.push(`Expected ${expectedAction} tool call`);
    } else if (actionCall.name !== expectedAction) {
      validations.push(`Expected ${expectedAction}, got ${actionCall.name}`);
    } else {
      // Validate parameters
      const paramValidation = validateActionParameters(actionCall, scenario);
      if (paramValidation) {
        validations.push(paramValidation);
      }
    }
  }
  
  if (validations.length === 0) {
    return {
      passed: true,
      message: 'All validations passed',
      details: { expectedTools, actualTools: actualToolCalls, finalMessage }
    };
  } else {
    return {
      passed: false,
      message: validations.join('; '),
      details: { expectedTools, actualTools: actualToolCalls, finalMessage }
    };
  }
}

// Get expected tool pattern for an action
function getExpectedToolPattern(action: string, scenario: TestScenario): ToolCallValidation[] {
  const tools: ToolCallValidation[] = [
    { name: 'checkActiveSessions', required: true }
  ];
  
  // Add time parsing if needed
  if (scenario.expected.time_parsing_required) {
    tools.push({ name: 'parseUserTime', required: true });
  }
  
  // Add main action
  if (action !== 'ask_clarification') {
    tools.push({ name: action, required: true });
  }
  
  return tools;
}

// Validate action-specific parameters
function validateActionParameters(actionCall: any, scenario: TestScenario): string | null {
  const { name, parameters } = actionCall;
  const expected = scenario.expected;
  
  switch (name) {
    case 'startActivity':
      if (expected.type && parameters.type !== expected.type) {
        return `Expected type '${expected.type}', got '${parameters.type}'`;
      }
      if (expected.time_offset_minutes && !parameters.startTimeUTC) {
        return 'Expected startTimeUTC for past start time';
      }
      break;
      
    case 'logActivity':
      if (expected.type && parameters.type !== expected.type) {
        return `Expected type '${expected.type}', got '${parameters.type}'`;
      }
      if (expected.volume && parameters.volume !== expected.volume) {
        return `Expected volume ${expected.volume}, got ${parameters.volume}`;
      }
      // For diaper contents, allow default 'pee' when not specified
      if (expected.contents && parameters.contents !== expected.contents) {
        // Special case: if expected is 'pee' and parameter is undefined, that's okay (default behavior)
        if (!(expected.contents === 'pee' && parameters.contents === undefined)) {
          return `Expected contents '${expected.contents}', got '${parameters.contents}'`;
        }
      }
      if (expected.duration && parameters.duration !== expected.duration) {
        return `Expected duration ${expected.duration}, got ${parameters.duration}`;
      }
      if (expected.diaper_volume && parameters.diaperVolume !== expected.diaper_volume) {
        return `Expected diaperVolume '${expected.diaper_volume}', got '${parameters.diaperVolume}'`;
      }
      if (expected.poo_color && parameters.pooColor !== expected.poo_color) {
        return `Expected pooColor '${expected.poo_color}', got '${parameters.pooColor}'`;
      }
      break;
      
    case 'endActivity':
      // For endActivity, don't validate specific activity IDs since they're auto-generated UUIDs
      // Just ensure an activityId is provided
      if (!parameters.activityId) {
        return 'Expected activityId parameter';
      }
      break;
  }
  
  return null;
}

// Create a visual story for the scenario
function printScenarioStory(scenario: TestScenario) {
  console.log(`\n📖 Story: ${scenario.name.replace(/_/g, ' ')}`);
  console.log('=' .repeat(60));
  
  // Timeline visualization
  const deviceTime = new Date(TEST_DEVICE_TIME);
  const timeStr = deviceTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZone: 'America/New_York'
  });
  
  console.log(`🕐 Current time: ${timeStr} EST`);
  
  // Show current state
  if (scenario.current_state.active_sessions.length > 0) {
    console.log(`📊 Baby's current state:`);
    scenario.current_state.active_sessions.forEach(session => {
      const startTime = parseTestTime(session.started);
      const duration = Math.round((deviceTime.getTime() - startTime.getTime()) / 60000);
      const emoji = session.type === 'sleep' ? '😴' : session.type === 'feed' ? '🍼' : '💩';
      console.log(`   ${emoji} ${session.type.toUpperCase()}: Started ${duration} min ago`);
    });
  } else {
    console.log(`📊 Baby's current state: No active sessions`);
  }
  
  console.log(`\n💬 Parent says: "${scenario.user_input}"`);
  
  // Show expected AI behavior
  console.log(`\n🤖 Expected AI behavior:`);
  const expected = scenario.expected;
  
  if (expected.time_parsing_required) {
    const offsetStr = expected.time_offset_minutes 
      ? `${Math.abs(expected.time_offset_minutes)} min ${expected.time_offset_minutes < 0 ? 'ago' : 'from now'}`
      : 'parse time';
    console.log(`   1️⃣ Parse time reference: ${offsetStr}`);
  }
  
  console.log(`   2️⃣ Check active sessions`);
  
  const actionEmoji = {
    'startActivity': '▶️ START',
    'endActivity': '⏹️ END', 
    'logActivity': '📝 LOG',
    'ask_clarification': '❓ ASK'
  }[expected.action] || '🔧';
  
  console.log(`   3️⃣ ${actionEmoji} ${expected.type || ''} activity`);
  
  if (expected.volume) console.log(`      📏 Volume: ${expected.volume}ml`);
  if (expected.duration) console.log(`      ⏱️ Duration: ${expected.duration} min`);
  if (expected.contents) console.log(`      📋 Contents: ${expected.contents}`);
  if (expected.diaper_volume) console.log(`      📏 Diaper amount: ${expected.diaper_volume}`);
  if (expected.poo_color) console.log(`      🎨 Poo color: ${expected.poo_color}`);
  
  console.log(`\n🧪 Running test...`);
}

// Create a visual result story
function printResultStory(
  scenario: TestScenario, 
  toolCalls: any[], 
  finalMessage: string, 
  validation: any
) {
  console.log(`\n📊 What Actually Happened:`);
  console.log('=' .repeat(60));
  
  // Show timeline of AI actions
  toolCalls.forEach((call, i) => {
    const stepEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] || `${i+1}️⃣`;
    const actionEmoji: Record<string, string> = {
      'checkActiveSessions': '🔍',
      'parseUserTime': '🕐',
      'startActivity': '▶️',
      'endActivity': '⏹️',
      'logActivity': '📝',
      'getDailySummary': '📈',
      'getRecentActivities': '📜'
    };
    const emoji = actionEmoji[call.name] || '🔧';
    
    console.log(`${stepEmoji} ${emoji} ${call.name}`);
    
    // Show key parameters
    if (call.name === 'parseUserTime' && call.parameters.targetTime) {
      const parsedTime = new Date(call.parameters.targetTime);
      const timeStr = parsedTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
      console.log(`      🎯 Calculated time: ${timeStr} EST`);
      console.log(`      💭 AI reasoning: ${call.parameters.reasoning}`);
    }
    
    if (call.name === 'startActivity' || call.name === 'logActivity') {
      console.log(`      📋 Type: ${call.parameters.type}`);
      if (call.parameters.volume) console.log(`      📏 Volume: ${call.parameters.volume}ml`);
      if (call.parameters.duration) console.log(`      ⏱️ Duration: ${call.parameters.duration} min`);
      if (call.parameters.contents) console.log(`      📋 Contents: ${call.parameters.contents}`);
      if (call.parameters.diaperVolume) console.log(`      📏 Diaper amount: ${call.parameters.diaperVolume}`);
      if (call.parameters.pooColor) console.log(`      🎨 Poo color: ${call.parameters.pooColor}`);
    }
    
    // Show tool results, especially errors
    if (call.result) {
      if (call.result.error) {
        console.log(`      ❌ Error: ${call.result.error}`);
      } else if (call.result.success === false) {
        console.log(`      ❌ Failed: ${JSON.stringify(call.result)}`);
      } else if (call.result.success) {
        console.log(`      ✅ Success`);
      }
    }
    
    if (call.name === 'endActivity') {
      console.log(`      🔗 Activity ID: ${call.parameters.activityId?.substring(0, 8)}...`);
    }
  });
  
  console.log(`\n💬 AI Response: "${finalMessage}"`);
  
  // Show validation result with story
  if (validation.passed) {
    console.log(`\n✅ SUCCESS! AI behavior matched expectations`);
  } else {
    console.log(`\n❌ MISMATCH! AI behavior differed from expectations`);
    console.log(`📍 Issue: ${validation.message}`);
    
    // Show detailed comparison
    console.log(`\n🔍 Expected vs Actual:`);
    const expected = scenario.expected;
    const actualAction = toolCalls.find(call => 
      !['checkActiveSessions', 'parseUserTime'].includes(call.name)
    );
    
    console.log(`   Action: Expected "${expected.action}" → Got "${actualAction?.name || 'none'}"`);
    
    if (expected.time_parsing_required) {
      const hasTimeParsing = toolCalls.some(call => call.name === 'parseUserTime');
      console.log(`   Time parsing: Expected ✅ → Got ${hasTimeParsing ? '✅' : '❌'}`);
    }
  }
}

// Individual test runner for a single scenario
export async function runSingleScenario(scenarioName: string): Promise<{
  passed: boolean;
  message: string;
  details?: any;
}> {
  const testSuite = loadTestScenarios();
  const scenario = testSuite.scenarios.find(s => s.name === scenarioName);
  
  if (!scenario) {
    throw new Error(`Scenario '${scenarioName}' not found`);
  }

  printScenarioStory(scenario);
  
  // Setup and run the test
  await cleanupDatabase();
  
  const activeSessionIds: string[] = [];
  for (const session of scenario.current_state.active_sessions || []) {
    const sessionId = await setupActiveSession(session);
    activeSessionIds.push(sessionId);
    console.log(`   🔄 Setup session: ${session.type} (${session.started})`);
  }

  try {
    const response = await testAgentWithScenario(scenario.user_input);
    
    if (!response.success) {
      // Retry with debug mode to get more details
      console.log(`\n🔍 Retrying with debug mode for more details...`);
      const debugResponse = await testAgentWithScenario(scenario.user_input, true);
      
      return {
        passed: false,
        message: `Test execution failed: ${response.error}`,
      };
    }

    // Validate tool calls against expected behavior
    const validation = validateToolCalls(
      response.toolCalls, 
      scenario.expected.action,
      scenario,
      response.finalMessage
    );
    
    // Print the visual result story
    printResultStory(scenario, response.toolCalls, response.finalMessage, validation);
    
    return {
      passed: validation.passed,
      message: validation.message,
      details: validation.details
    };
  } catch (error) {
    return {
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    await cleanupDatabase();
  }
}

// Test categorization for better overview
interface TestCategory {
  name: string;
  tests: string[];
  description: string;
}

const TEST_MATRIX = {
  'Sleep': {
    'Clean Start': [
      'sleep_no_active_started_past',
      'sleep_no_active_completed_duration', 
      'sleep_no_active_current'
    ],
    'Smart Update': [
      'sleep_recent_active_duration_update',
      'sleep_recent_active_woke_up'
    ],
    'Conflict Resolution': [
      'sleep_stale_active_new_start',
      'sleep_stale_active_duration',
      'sleep_vs_active_feed'
    ]
  },
  'Feed': {
    'Clean Start': [
      'feed_no_active_volume_past',
      'feed_no_active_started_past',
      'feed_no_active_current'
    ],
    'Smart Update': [
      'feed_recent_active_volume_complete',
      'feed_recent_active_finished'
    ],
    'Conflict Resolution': [
      'feed_stale_active_new_volume',
      'feed_vs_active_sleep'
    ]
  },
  'Diaper': {
    'Always Simple': [
      'diaper_no_active',
      'diaper_with_active_sessions',
      'diaper_with_details'
    ]
  },
  'Time Parsing': {
    'Edge Cases': [
      'time_relative_minutes',
      'time_specific_hour', 
      'time_duration',
      'feed_quick_snack',
      'test_error_case'
    ]
  }
};

// Batch test runner with categorized matrix view
export async function runAllScenarios(): Promise<{
  totalTests: number;
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const testSuite = loadTestScenarios();
  const results: Array<{ name: string; passed: boolean; message: string }> = [];
  
  console.log(`\n🧪 Running ${testSuite.scenarios.length} test scenarios...\n`);
  
  // Run all tests
  for (const scenario of testSuite.scenarios) {
    try {
      const result = await runSingleScenario(scenario.name);
      results.push({
        name: scenario.name,
        passed: result.passed,
        message: result.message
      });
    } catch (error) {
      results.push({
        name: scenario.name,
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Print matrix summary
  printTestMatrix(results);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  return {
    totalTests: results.length,
    passed,
    failed,
    results
  };
}

// Print a 2D matrix view of test results
function printTestMatrix(results: Array<{ name: string; passed: boolean; message: string }>) {
  console.log(`\n📊 Test Coverage Matrix`);
  console.log('='.repeat(80));
  
  // Create result lookup
  const resultMap = new Map<string, boolean>();
  results.forEach(r => resultMap.set(r.name, r.passed));
  
  // Print header
  const scenarios = ['Clean Start', 'Smart Update', 'Conflict Resolution', 'Always Simple', 'Edge Cases'];
  console.log(`${'Activity Type'.padEnd(15)} | ${scenarios.map(s => s.padEnd(12)).join(' | ')}`);
  console.log('-'.repeat(80));
  
  // Print each activity type row
  Object.entries(TEST_MATRIX).forEach(([activityType, scenarioGroups]) => {
    const row = [activityType.padEnd(15)];
    
    scenarios.forEach(scenarioType => {
      const tests = (scenarioGroups as any)[scenarioType] || [];
      if (tests.length === 0) {
        row.push('─'.padEnd(12));
        return;
      }
      
      const passCount = tests.filter((test: string) => resultMap.get(test) === true).length;
      const totalCount = tests.length;
      const allPassed = passCount === totalCount;
      
      if (totalCount === 1) {
        const status = allPassed ? '✅' : '❌';
        row.push(`${status}`.padEnd(12));
      } else {
        const status = allPassed ? '✅' : passCount > 0 ? '⚠️' : '❌';
        row.push(`${status} ${passCount}/${totalCount}`.padEnd(12));
      }
    });
    
    console.log(row.join(' | '));
  });
  
  console.log('\n📋 Legend:');
  console.log('   ✅ All tests passed');
  console.log('   ⚠️  Some tests failed'); 
  console.log('   ❌ All tests failed');
  console.log('   ─  No tests in this category');
  
  // Show failed tests by category
  const failedResults = results.filter(r => !r.passed);
  if (failedResults.length > 0) {
    console.log(`\n❌ Failed Tests by Category:`);
    
    Object.entries(TEST_MATRIX).forEach(([activityType, scenarioGroups]) => {
      Object.entries(scenarioGroups).forEach(([scenarioType, tests]) => {
        const failedInCategory = tests.filter(test => 
          failedResults.some(f => f.name === test)
        );
        
        if (failedInCategory.length > 0) {
          console.log(`\n   ${activityType} → ${scenarioType}:`);
          failedInCategory.forEach(testName => {
            const result = failedResults.find(f => f.name === testName);
            console.log(`     ❌ ${testName}: ${result?.message}`);
          });
        }
      });
    });
  }
  
  // Overall summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total: ${results.length} tests`);
  console.log(`   Passed: ${passed} (${Math.round(passed/results.length*100)}%)`);
  console.log(`   Failed: ${failed} (${Math.round(failed/results.length*100)}%)`);
}

// Run tests for a specific category
export async function runTestCategory(activityType: string, scenarioType?: string): Promise<void> {
  const categoryTests = TEST_MATRIX[activityType as keyof typeof TEST_MATRIX];
  
  if (!categoryTests) {
    console.log(`❌ Unknown activity type: ${activityType}`);
    console.log(`Available types: ${Object.keys(TEST_MATRIX).join(', ')}`);
    return;
  }
  
  let testsToRun: string[] = [];
  
  if (scenarioType) {
    const specificTests = categoryTests[scenarioType as keyof typeof categoryTests];
    if (!specificTests) {
      console.log(`❌ Unknown scenario type: ${scenarioType}`);
      console.log(`Available types for ${activityType}: ${Object.keys(categoryTests).join(', ')}`);
      return;
    }
    testsToRun = specificTests;
    console.log(`\n🎯 Running ${activityType} → ${scenarioType} tests (${testsToRun.length} tests)...\n`);
  } else {
    // Run all tests for this activity type
    testsToRun = Object.values(categoryTests).flat();
    console.log(`\n🎯 Running all ${activityType} tests (${testsToRun.length} tests)...\n`);
  }
  
  const results: Array<{ name: string; passed: boolean; message: string }> = [];
  
  for (const testName of testsToRun) {
    try {
      const result = await runSingleScenario(testName);
      results.push({
        name: testName,
        passed: result.passed,
        message: result.message
      });
    } catch (error) {
      results.push({
        name: testName,
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Print category results
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log(`\n📊 Category Results:`);
  console.log(`   Total: ${results.length} tests`);
  console.log(`   Passed: ${passed} (${Math.round(passed/results.length*100)}%)`);
  console.log(`   Failed: ${failed} (${Math.round(failed/results.length*100)}%)`);
  
  if (failed > 0) {
    console.log(`\n❌ Failed tests:`);
    results.filter(r => !r.passed).forEach(result => {
      console.log(`   - ${result.name}: ${result.message}`);
    });
  }
}
