#!/usr/bin/env npx tsx

// Load environment variables FIRST - before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(__dirname, '../.env.local'),
];

for (const envPath of envPaths) {
  config({ path: envPath });
}


import { runSingleScenario, runAllScenarios, runTestCategory, loadTestScenarios } from '../tests/agent-test-utils';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const scenarioName = args[1];
  const debugFlag = args.includes('--debug');

  try {
    if (command === 'list') {
      // List all available scenarios
      const testSuite = loadTestScenarios();
      console.log('\n📋 Available test scenarios:\n');
      testSuite.scenarios.forEach((scenario, index) => {
        console.log(`${index + 1}. ${scenario.name}`);
        console.log(`   Input: "${scenario.user_input}"`);
        console.log(`   Expected: ${scenario.expected.action}\n`);
      });
      
    } else if (command === 'run' && scenarioName) {
      // Run a specific scenario
      console.log(`\n🎯 Running single scenario: ${scenarioName}`);
      const result = await runSingleScenario(scenarioName);
      
      if (result.passed) {
        console.log('🎉 Test passed!');
        process.exit(0);
      } else {
        console.log('💥 Test failed!');
        process.exit(1);
      }
      
    } else if (command === 'all') {
      // Run all scenarios
      console.log('\n🚀 Running all test scenarios...');
      const results = await runAllScenarios();
      
      if (results.failed === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log(`\n💥 ${results.failed} tests failed!`);
        process.exit(1);
      }
      
    } else if (command === 'category' && scenarioName) {
      // Run tests by category
      const parts = scenarioName.split(':');
      const activityType = parts[0];
      const scenarioType = parts[1];
      
      await runTestCategory(activityType, scenarioType);
      
    } else if (command === 'matrix') {
      // Show test matrix overview
      console.log(`
📊 Test Coverage Categories

Activity Types (Rows):
  🛌 Sleep     - Sleep tracking scenarios
  🍼 Feed      - Feeding tracking scenarios  
  👶 Diaper    - Diaper change scenarios
  🕐 Time      - Time parsing edge cases

Scenario Types (Columns):
  🆕 Clean Start        - No conflicts, straightforward cases
  🔄 Smart Update       - Update recent active sessions
  ⚠️  Conflict Resolution - Handle stale/cross-type conflicts  
  📝 Always Simple      - Simple scenarios (diaper)
  🧪 Edge Cases         - Complex time parsing scenarios

Run 'npm run test:agent all' to see the full matrix with results!
      `);
      
    } else {
      // Show usage
      console.log(`
🧪 Agent Test Runner

Usage:
  npm run test:agent list                           # List all scenarios
  npm run test:agent run <scenario_name>            # Run specific scenario  
  npm run test:agent all                            # Run all scenarios (with matrix view)
  npm run test:agent matrix                         # Show test coverage categories
  npm run test:agent category <type>                # Run all tests for activity type
  npm run test:agent category <type>:<scenario>     # Run specific category

Activity Types: Sleep, Feed, Diaper, Time
Scenario Types: Clean Start, Smart Update, Conflict Resolution, Always Simple, Edge Cases

Examples:
  npm run test:agent list
  npm run test:agent run sleep_no_active_started_past
  npm run test:agent all
  npm run test:agent category Sleep
  npm run test:agent category Sleep:"Clean Start"
  npm run test:agent category Feed:"Smart Update"
      `);
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
