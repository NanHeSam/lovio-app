# AI Agent Testing Framework

## Quick Start

```bash
# See test categories overview
npm run test:agent matrix

# Run all tests with visual matrix
npm run test:agent all

# Test specific activity type
npm run test:agent category Sleep

# Test individual scenario
npm run test:agent run sleep_no_active_started_past
```

## Test Matrix Overview

| Activity Type | Clean Start | Smart Update | Conflict Resolution | Always Simple | Edge Cases |
|---------------|-------------|--------------|-------------------|---------------|------------|
| 🛌 **Sleep**     | ✅ 3/3      | ⚠️ 1/2       | ✅ 3/3            | ─             | ─          |
| 🍼 **Feed**      | ✅ 3/3      | ✅ 2/2       | ✅ 2/2            | ─             | ─          |
| 👶 **Diaper**    | ─           | ─            | ─                 | ✅ 3/3        | ─          |
| 🕐 **Time**      | ─           | ─            | ─                 | ─             | ⚠️ 4/5     |

**Legend**: ✅ All passed | ⚠️ Some failed | ❌ All failed | ─ No tests

## Adding New Test Scenarios

Edit `tests/chat-scenarios.yml`:

```yaml
- name: "my_new_scenario"
  user_input: "baby started eating 10 minutes ago"
  current_state: 
    active_sessions: []  # or setup active sessions
  expected:
    action: "startActivity"
    type: "feed"
    time_parsing_required: true
    time_offset_minutes: -10
    description: "Should start feed with past time"
```

## Test Categories

### Activity Types (What to test)
- **Sleep**: Sleep tracking scenarios
- **Feed**: Feeding scenarios
- **Diaper**: Diaper changes (always simple)
- **Time**: Time parsing edge cases

### Scenario Types (How they behave)
- **Clean Start**: No conflicts, straightforward
- **Smart Update**: Update recent active sessions
- **Conflict Resolution**: Handle conflicts between activities
- **Always Simple**: No conflicts possible (diaper)
- **Edge Cases**: Complex time parsing

## Test Validation

Each test checks the AI follows the **3-step protocol**:

1. **`checkActiveSessions`** - Understand current state
2. **`parseUserTime`** (if needed) - Parse time references  
3. **Main action** - `startActivity`, `logActivity`, `endActivity`, or `ask_clarification`

## Test Output Example

```text
📖 Story: sleep no active started past
🕐 Current time: 3:30 PM EST
📊 Baby's current state: No active sessions
💬 Parent says: "baby started sleeping 20 min ago"

🤖 Expected AI behavior:
   1️⃣ Parse time reference: 20 min ago
   2️⃣ Check active sessions
   3️⃣ ▶️ START sleep activity

📊 What Actually Happened:
1️⃣ 🔍 checkActiveSessions
2️⃣ 🕐 parseUserTime
      🎯 Calculated time: 3:10 PM EST
      💭 AI reasoning: User said 'started sleeping 20 min ago'...
3️⃣ ▶️ startActivity
      📋 Type: sleep
      ✅ Success

✅ SUCCESS! AI behavior matched expectations
```

## Debugging Failed Tests

When tests fail, the framework automatically:
- Shows detailed error messages
- Displays raw streaming chunks
- Highlights mismatched expectations
- Provides step-by-step AI reasoning

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run test:agent matrix` | Show categories overview |
| `npm run test:agent all` | Run all tests with matrix |
| `npm run test:agent list` | List all scenario names |
| `npm run test:agent run <name>` | Run specific scenario |
| `npm run test:agent category <type>` | Run activity type |
| `npm run test:agent category <type>:<scenario>` | Run specific subset |

## Test Files

- `tests/chat-scenarios.yml` - Test scenario definitions
- `tests/agent-test-utils.ts` - Testing framework code
- `scripts/test-agent.ts` - CLI test runner
- `scripts/seed-test-data.ts` - Test data setup

## Current Status

**Overall**: 91% pass rate (21/23 tests)

**Areas needing attention**:
- Sleep → Smart Update: 1 duration update issue
- Time Parsing → Edge Cases: 1 edge case failing

**Confident areas**:
- Feed scenarios: 100% (7/7)
- Diaper scenarios: 100% (3/3) 
- Sleep basics: Working well