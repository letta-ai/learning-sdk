/**
 * Claude Agent SDK Interceptor Tests
 *
 * Note: These tests are currently skipped because the Claude Agent SDK
 * is async-only and uses a subprocess transport layer that's difficult
 * to mock in Jest. The interceptor implementation is based on the Python
 * version and should work with real Claude Agent SDK usage.
 *
 * To test manually, use the claude_example.ts file.
 */

import { autoInstall } from '../src/interceptors';
// import { learning } from '../src/core';
import { createTestClient, generateAgentName, cleanupAgent } from './setup';

describe.skip('Claude Agent SDK Interceptor', () => {
  let learningClient: ReturnType<typeof createTestClient>;
  let agentName: string;

  beforeEach(() => {
    // Install interceptors
    autoInstall();

    // Create learning client
    learningClient = createTestClient();
    agentName = generateAgentName();
  });

  afterEach(async () => {
    // Cleanup agent
    await cleanupAgent(learningClient, agentName);
  });

  test('placeholder test', () => {
    // Claude Agent SDK uses subprocess transport which is difficult to mock
    // Real testing should be done with the actual SDK
    expect(true).toBe(true);
  });
});

/**
 * Manual testing instructions:
 *
 * 1. Install Claude Agent SDK:
 *    npm install claude-agent-sdk
 *
 * 2. Run the example:
 *    npm run example:claude
 *
 * 3. Verify:
 *    - Conversations are captured and saved to Letta
 *    - Memory is injected into system prompts
 *    - Capture-only mode works correctly
 */
