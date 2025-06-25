import fs from 'fs';
import path from 'path';
import { 
  loadTestScenarios,
  cleanupDatabase,
  runSingleScenario
} from './agent-test-utils';

// Main test suite for Jest
describe('Agent Scenarios from YAML', () => {

  beforeAll(async () => {
    try {
      loadTestScenarios();
    } catch (error) {
      console.warn('Could not load test scenarios, skipping tests');
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