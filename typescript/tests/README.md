# Agentic Learning SDK - TypeScript Tests

Lightweight integration tests that verify interceptors work correctly with real Letta server.

## Test Strategy

- **Mock**: LLM SDK calls (OpenAI, Anthropic, Gemini)
- **Real**: AgenticLearning client calls to Letta server (local or hosted)
- **Focus**: Interceptor mechanics, memory injection, conversation capture

## Setup

```bash
# Install dependencies (from typescript directory)
npm install

# Build the SDK
npm run build
```

### Local Server (Default)

```bash
# Start local Letta server in separate terminal
letta server

# Run tests against local server (default)
npm test
```

### Cloud Server

```bash
# Set environment variables for cloud testing
export LETTA_TEST_MODE="cloud"
export LETTA_API_KEY="your-letta-api-key"

# Run tests against cloud
npm test
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific provider
npm test -- openai.test.ts
npm test -- anthropic.test.ts
npm test -- gemini.test.ts

# Run with verbose output
npm test -- --verbose

# Run in watch mode during development
npm run test:watch
```

## Test Structure

Each provider test file includes the same test suite (where applicable):

```
tests/
├── setup.ts              # Shared fixtures (Letta client, cleanup, utilities)
├── openai.test.ts        # OpenAI Chat Completions tests
├── anthropic.test.ts     # Anthropic Messages API tests
├── gemini.test.ts        # Gemini GenerativeAI tests
└── claude.test.ts        # Claude Agent SDK tests (currently skipped - see note below)
```

**Note on Claude tests:** The Claude Agent SDK uses an async subprocess transport layer that's difficult to mock in Jest. The interceptor implementation matches the Python version and should work with real usage. Use the `claude_example.ts` file for manual testing.

## Test Cases

Each provider runs the same 4 tests:

1. **conversation saved to Letta** - Verify conversations captured and saved
2. **memory injection** - Verify memory retrieved and injected into LLM calls
3. **capture only mode** - Verify capture_only doesn't inject memory
4. **model name extraction** - Verify model names are correctly extracted

## Adding Tests for New Providers

To add tests for a new provider:

1. Create `tests/<provider>.test.ts`
2. Mock the provider's SDK using Jest
3. Create test suite with the standard 4 tests
4. Use shared utilities from `setup.ts`

See existing test files for examples.

## Notes

- Tests use real Letta server at `http://localhost:8283` (default)
- Each test uses a unique agent name to avoid conflicts
- Test agents are automatically cleaned up after tests
- LLM calls are mocked to avoid API costs and ensure determinism
- Test timeout is set to 30 seconds in `jest.config.js`
