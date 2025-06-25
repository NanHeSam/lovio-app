#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { validateToolCalls, loadTestScenarios, type TestScenario } from './agent-test-utils';

type MockToolCall = {
  name: string;
  parameters: Record<string, any>;
  result: Record<string, any>;
};

type MockToolCallExamples = {
  [key: string]: MockToolCall[];
};

// Mock tool call examples for testing validation logic
const mockToolCallExamples: MockToolCallExamples = {
  sleep_no_active_started_past: [
    { name: 'checkActiveSessions', parameters: {}, result: { activeSessions: [], totalActiveSessions: 0 } },
    { name: 'parseUserTime', parameters: { targetTime: '2025-01-03T15:10:00-05:00', reasoning: '20 minutes before device time' }, result: { utcTime: '2025-01-03T20:10:00.000Z' } },
    { name: 'startActivity', parameters: { type: 'sleep', startTimeUTC: '2025-01-03T20:10:00.000Z' }, result: { success: true } }
  ],
  
  feed_no_active_volume_past: [
    { name: 'checkActiveSessions', parameters: {}, result: { activeSessions: [], totalActiveSessions: 0 } },
    { name: 'parseUserTime', parameters: { targetTime: '2025-01-03T15:10:00-05:00', reasoning: '20 minutes before device time' }, result: { utcTime: '2025-01-03T20:10:00.000Z' } },
    { name: 'logActivity', parameters: { type: 'feed', volume: 120, feedType: 'bottle', startTimeUTC: '2025-01-03T20:10:00.000Z' }, result: { success: true } }
  ],
  
  sleep_no_active_current: [
    { name: 'checkActiveSessions', parameters: {}, result: { activeSessions: [], totalActiveSessions: 0 } },
    { name: 'startActivity', parameters: { type: 'sleep' }, result: { success: true } }
  ],
  
  diaper_no_active: [
    { name: 'checkActiveSessions', parameters: {}, result: { activeSessions: [], totalActiveSessions: 0 } },
    { name: 'logActivity', parameters: { type: 'diaper', contents: 'pee' }, result: { success: true } }
  ],
  
  // Wrong examples for testing validation
  sleep_wrong_no_check: [
    { name: 'startActivity', parameters: { type: 'sleep' }, result: { success: true } }
  ],
  
  sleep_wrong_no_time_parsing: [
    { name: 'checkActiveSessions', parameters: {}, result: { activeSessions: [], totalActiveSessions: 0 } },
    { name: 'startActivity', parameters: { type: 'sleep' }, result: { success: true } }
  ],
  
  sleep_wrong_action: [
    { name: 'checkActiveSessions', parameters: {}, result: { activeSessions: [], totalActiveSessions: 0 } },
    { name: 'logActivity', parameters: { type: 'sleep' }, result: { success: true } }
  ]
};

async function testValidationLogic() {
  console.log('🧪 Testing Validation Logic\n');
  
  const testSuite = loadTestScenarios();
  const results: Array<{ name: string; passed: boolean; message: string }> = [];
  
  // Test correct examples
  const correctTests = [
    'sleep_no_active_started_past',
    'feed_no_active_volume_past', 
    'sleep_no_active_current',
    'diaper_no_active'
  ];
  
  for (const testName of correctTests) {
    const scenario = testSuite.scenarios.find(s => s.name === testName);
    if (!scenario) continue;
    
    const mockToolCalls = mockToolCallExamples[testName];
    if (!mockToolCalls) continue;
    
    console.log(`✅ Testing: ${scenario.name}`);
    console.log(`   Input: "${scenario.user_input}"`);
    console.log(`   Expected: ${scenario.expected.action}`);
    
    const validation = validateToolCalls(
      mockToolCalls,
      scenario.expected.action,
      scenario,
      'Mock response message'
    );
    
    console.log(`   Result: ${validation.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (!validation.passed) {
      console.log(`   Error: ${validation.message}`);
    } else {
      console.log(`   Tool sequence: ${mockToolCalls.map((t: any) => t.name).join(' → ')}`);
    }
    console.log('');
    
    results.push({
      name: testName,
      passed: validation.passed,
      message: validation.message
    });
  }
  
  // Test wrong examples
  console.log('🔍 Testing Validation Catches Errors\n');
  
  const wrongTests = [
    { name: 'sleep_wrong_no_check', scenario: 'sleep_no_active_current', error: 'Missing checkActiveSessions' },
    { name: 'sleep_wrong_no_time_parsing', scenario: 'sleep_no_active_started_past', error: 'Missing time parsing' },
    { name: 'sleep_wrong_action', scenario: 'sleep_no_active_current', error: 'Wrong action type' }
  ];
  
  for (const wrongTest of wrongTests) {
    const scenario = testSuite.scenarios.find(s => s.name === wrongTest.scenario);
    if (!scenario) continue;
    
    const mockToolCalls = mockToolCallExamples[wrongTest.name];
    if (!mockToolCalls) continue;
    
    console.log(`❌ Testing: ${wrongTest.name} (${wrongTest.error})`);
    
    const validation = validateToolCalls(
      mockToolCalls,
      scenario.expected.action,
      scenario,
      'Mock response message'
    );
    
    const shouldFail = !validation.passed;
    console.log(`   Result: ${shouldFail ? '✅ CORRECTLY FAILED' : '❌ INCORRECTLY PASSED'}`);
    if (validation.passed) {
      console.log(`   Error: Validation should have failed but passed`);
    } else {
      console.log(`   Caught: ${validation.message}`);
    }
    console.log('');
    
    results.push({
      name: wrongTest.name,
      passed: shouldFail, // We want these to fail
      message: shouldFail ? 'Correctly detected error' : 'Failed to detect error'
    });
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`📊 Validation Test Results:`);
  console.log(`   Total: ${total}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${total - passed}`);
  
  if (passed === total) {
    console.log('\n🎉 All validation tests passed! The validation logic is working correctly.');
  } else {
    console.log('\n💥 Some validation tests failed. Check the logic above.');
  }
}

if (require.main === module) {
  testValidationLogic().catch(console.error);
}