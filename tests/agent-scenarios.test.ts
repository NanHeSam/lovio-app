import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { processChatRequest } from '@/lib/chat/agent';
import { db, activities, users, children, userChildren } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Load js-yaml if not available
const yamlParse = yaml.load;

// Types for our test scenarios
interface TestScenario {
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
    start_time?: string;
    end_time?: string;
    duration?: number;
    activity_id?: string;
    volume?: number;
    contents?: string;
    message?: string;
    no_conflicts?: boolean;
    completed?: boolean;
  };
  description?: string;
}

interface TestSuite {
  scenarios: TestScenario[];
}

// Test constants
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_CHILD_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_DEVICE_TIME = '2025-01-03T15:30:00-05:00'; // 3:30 PM EST

// Mock the processChatRequest function to capture tool calls
async function testAgentWithMocks(userInput: string, activeSessionIds: string[] = []): Promise<{
  toolCalls: Array<{ name: string; parameters: any; result?: any }>;
  finalMessage: string;
  success: boolean;
  error?: string;
}> {
  try {
    // Create a mock implementation that captures tool calls
    const toolCalls: Array<{ name: string; parameters: any; result?: any }> = [];
    
    // Mock the agent's decision making by calling it with our test setup
    const messages = [{ role: 'user' as const, content: userInput }];
    
    // For now, we'll simulate the agent behavior
    // In the real implementation, you'd want to mock the actual tool calls
    const result = await processChatRequest({
      messages,
      userId: TEST_USER_ID,
      childId: TEST_CHILD_ID,
      deviceTime: TEST_DEVICE_TIME
    });

    // Since we can't easily capture the streaming response, 
    // we'll need to implement a different approach
    return {
      toolCalls: [], // This would need to be extracted from the actual response
      finalMessage: 'Test response',
      success: true
    };
  } catch (error) {
    return {
      toolCalls: [],
      finalMessage: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Setup active sessions in database for testing
async function setupActiveSession(sessionData: { type: string; id: string; started: string }): Promise<string> {
  const startTime = parseTestTime(sessionData.started);
  
  const [activity] = await db.insert(activities).values({
    id: sessionData.id,
    childId: TEST_CHILD_ID,
    createdBy: TEST_USER_ID,
    type: sessionData.type as 'sleep' | 'feed' | 'diaper',
    startTime,
    endTime: null, // Active session
    details: { type: sessionData.type }
  }).returning();

  return activity.id;
}

// Parse test time strings like "30min_ago", "6hours_ago"
function parseTestTime(timeStr: string): Date {
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
async function cleanupDatabase() {
  await db.delete(activities).where(eq(activities.childId, TEST_CHILD_ID));
}

// Validate tool call against expected result
function validateExpectation(toolCalls: any[], expected: any, finalMessage: string): { 
  passed: boolean; 
  message: string; 
  details?: any;
} {
  // Find the main action (not checkActiveSessions or parseUserTime)
  const actionCall = toolCalls.find(call => 
    !['checkActiveSessions', 'parseUserTime'].includes(call.name)
  );

  if (expected.action === 'ask_clarification') {
    // For conflict scenarios, check that the message contains clarification language
    const hasQuestion = /should|would you|do you want|end|update/i.test(finalMessage);
    return {
      passed: hasQuestion,
      message: hasQuestion ? 'Contains clarification question' : 'Missing clarification question',
      details: { finalMessage, expectedAction: expected.action }
    };
  }

  if (!actionCall) {
    return {
      passed: false,
      message: `Expected action '${expected.action}' but no action tool was called`,
      details: { toolCalls, expected }
    };
  }

  if (actionCall.name !== expected.action) {
    return {
      passed: false,
      message: `Expected action '${expected.action}', got '${actionCall.name}'`,
      details: { actual: actionCall, expected }
    };
  }

  // Validate specific parameters based on action type
  const validations = [];

  if (expected.type && actionCall.parameters.type !== expected.type) {
    validations.push(`Expected type '${expected.type}', got '${actionCall.parameters.type}'`);
  }

  if (expected.volume && actionCall.parameters.volume !== expected.volume) {
    validations.push(`Expected volume ${expected.volume}, got ${actionCall.parameters.volume}`);
  }

  if (expected.activity_id && actionCall.parameters.activityId !== expected.activity_id) {
    validations.push(`Expected activity_id '${expected.activity_id}', got '${actionCall.parameters.activityId}'`);
  }

  // Check if time parsing happened when expected
  if (expected.start_time && expected.start_time.includes('ago')) {
    const parseTimeCall = toolCalls.find(call => call.name === 'parseUserTime');
    if (!parseTimeCall) {
      validations.push('Expected parseUserTime to be called for relative time');
    }
  }

  if (validations.length > 0) {
    return {
      passed: false,
      message: validations.join('; '),
      details: { actual: actionCall, expected }
    };
  }

  return { 
    passed: true, 
    message: 'All validations passed',
    details: { actual: actionCall, expected }
  };
}

// Load test scenarios from YAML
function loadTestScenarios(): TestSuite {
  const yamlPath = path.join(__dirname, 'chat-scenarios.yml');
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`Test scenarios file not found: ${yamlPath}`);
  }
  
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  return yamlParse(yamlContent) as TestSuite;
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

  console.log(`\n🧪 Running scenario: ${scenario.name}`);
  console.log(`📝 Input: "${scenario.user_input}"`);
  
  // Setup and run the test
  await cleanupDatabase();
  
  const activeSessionIds: string[] = [];
  for (const session of scenario.current_state.active_sessions || []) {
    const sessionId = await setupActiveSession(session);
    activeSessionIds.push(sessionId);
  }

  try {
    const response = await testAgentWithMocks(scenario.user_input, activeSessionIds);
    
    if (!response.success) {
      return {
        passed: false,
        message: `Test execution failed: ${response.error}`,
      };
    }

    const validation = validateExpectation(response.toolCalls, scenario.expected, response.finalMessage);
    
    console.log(validation.passed ? '✅ PASSED' : '❌ FAILED');
    if (!validation.passed) {
      console.log(`   Error: ${validation.message}`);
    }
    
    return validation;
  } finally {
    await cleanupDatabase();
  }
}

// Batch test runner for all scenarios
export async function runAllScenarios(): Promise<{
  totalTests: number;
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const testSuite = loadTestScenarios();
  const results: Array<{ name: string; passed: boolean; message: string }> = [];
  
  console.log(`\n🧪 Running ${testSuite.scenarios.length} test scenarios...\n`);
  
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
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log(`\n📊 Test Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\n❌ Failed tests:`);
    results.filter(r => !r.passed).forEach(result => {
      console.log(`   - ${result.name}: ${result.message}`);
    });
  }
  
  return {
    totalTests: results.length,
    passed,
    failed,
    results
  };
}

// Main test suite for Jest
describe('Agent Scenarios from YAML', () => {
  let testSuite: TestSuite;

  beforeAll(async () => {
    try {
      testSuite = loadTestScenarios();
    } catch (error) {
      console.warn('Could not load test scenarios, skipping tests');
      testSuite = { scenarios: [] };
    }
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  // Generate individual Jest tests for each scenario
  if (fs.existsSync(path.join(__dirname, 'chat-scenarios.yml'))) {
    const scenarios = loadTestScenarios().scenarios || [];
    
    scenarios.forEach((scenario) => {
      it(`should handle: ${scenario.name}`, async () => {
        const result = await runSingleScenario(scenario.name);
        expect(result.passed).toBe(true);
        if (!result.passed) {
          throw new Error(result.message);
        }
      }, 15000); // 15 second timeout per test
    });
  } else {
    it.skip('No test scenarios file found', () => {});
  }
});

// Note: Functions are already exported above