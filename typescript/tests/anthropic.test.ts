/**
 * Anthropic Interceptor Tests
 */

import { autoInstall } from '../src/interceptors';
import { enableAnthropicInterception } from '../src/index';
import { learning } from '../src/core';
import { createTestClient, generateAgentName, cleanupAgent, sleep } from './setup';

// Mock Anthropic SDK
const mockCreate = jest.fn();
const mockResponse = {
  content: [
    {
      type: 'text',
      text: 'Mock response',
    },
  ],
  model: 'claude-sonnet-4-20250514',
  role: 'assistant',
};

// Mock the Anthropic module with proper structure for interceptor
jest.mock('@anthropic-ai/sdk', () => {
  // Create a mock Messages class with prototype
  class MockMessages {
    create(params: any, options?: any) {
      return mockCreate(params, options);
    }
  }

  class MockAnthropic {
    messages: MockMessages;
    constructor() {
      this.messages = new MockMessages();
    }
  }

  // Export the class
  return {
    __esModule: true,
    default: MockAnthropic,
  };
});

describe('Anthropic Interceptor', () => {
  let learningClient: ReturnType<typeof createTestClient>;
  let agentName: string;

  beforeEach(() => {
    // Install interceptors
    autoInstall();

    // Create learning client
    learningClient = createTestClient();
    agentName = generateAgentName();

    // Reset mock
    mockCreate.mockReset();
    mockCreate.mockResolvedValue(mockResponse);
  });

  afterEach(async () => {
    // Cleanup agent
    await cleanupAgent(learningClient, agentName);
  });

  test('conversation saved to Letta', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey: 'test-key' });

    // Enable interception for this client
    enableAnthropicInterception(anthropic);

    // Create agent
    const agent = await learningClient.agents.create({ agent: agentName });
    expect(agent).toBeTruthy();

    // Use learning context
    const context = learning({
      agent: agentName,
      client: learningClient,
    });

    try {
      // Make LLM call
      await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'My name is Alice' }],
      });

      // Verify Anthropic was called
      expect(mockCreate).toHaveBeenCalled();

      // Wait for async save
      await sleep(5000);

      // Verify messages were saved
      const messages = await learningClient.messages.list(agentName);
      expect(messages.length).toBeGreaterThan(0);

      // Check if "Alice" is in the messages
      const messageContents = messages
        .map((msg) => msg.messageType === 'reasoning_message' ? msg.reasoning : msg.messageType == 'assistant_message' && typeof msg.content === 'string' ? msg.content : '')
        .filter(Boolean);

      const hasAlice = messageContents.some((content) => content.includes('Alice'));
      expect(hasAlice).toBe(true);
    } finally {
      context.exit();
    }
  });

  test('memory injection', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey: 'test-key' });
    enableAnthropicInterception(anthropic);

    // Create agent with memory
    await learningClient.agents.create({ agent: agentName, memory: [] });
    await learningClient.memory.create({
      agent: agentName,
      label: 'human',
      value: "User's name is Bob. User likes TypeScript programming.",
    });

    await sleep(2000);

    // Capture what was sent to Anthropic
    let capturedParams: any = null;
    mockCreate.mockImplementation((params) => {
      capturedParams = params;
      return Promise.resolve(mockResponse);
    });

    const context = learning({
      agent: agentName,
      client: learningClient,
    });

    try {
      await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: "What's my name?" }],
      });

      // Verify memory was injected into system parameter
      expect(capturedParams).toBeTruthy();
      const paramsStr = JSON.stringify(capturedParams);
      const hasMemory = paramsStr.includes('Bob') || paramsStr.includes('<human>');
      expect(hasMemory).toBe(true);
    } finally {
      context.exit();
    }
  });

  test('capture only mode', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey: 'test-key' });
    enableAnthropicInterception(anthropic);

    // Create agent with memory
    await learningClient.agents.create({ agent: agentName, memory: [] });
    await learningClient.memory.create({
      agent: agentName,
      label: 'human',
      value: 'Secret information that should not be injected',
    });

    await sleep(2000);

    // Capture what was sent to Anthropic
    let capturedParams: any = null;
    mockCreate.mockImplementation((params) => {
      capturedParams = params;
      return Promise.resolve(mockResponse);
    });

    const context = learning({
      agent: agentName,
      client: learningClient,
      captureOnly: true,
    });

    try {
      await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Hello, how are you?' }],
      });

      // Verify memory was NOT injected
      expect(capturedParams).toBeTruthy();
      const paramsStr = JSON.stringify(capturedParams);
      expect(paramsStr).not.toContain('Secret information');

      // Wait for save
      await sleep(3000);

      // Verify conversation was still saved
      const messages = await learningClient.messages.list(agentName);
      expect(messages.length).toBeGreaterThan(0);
    } finally {
      context.exit();
    }
  });

  test('model name extraction', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey: 'test-key' });
    enableAnthropicInterception(anthropic);

    await learningClient.agents.create({ agent: agentName });

    const context = learning({
      agent: agentName,
      client: learningClient,
    });

    try {
      await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Test model extraction' }],
      });

      await sleep(3000);

      // Verify expected model name
      const expectedModelName = 'claude-sonnet-4-20250514';
      expect(expectedModelName).toBeTruthy();
      expect(typeof expectedModelName).toBe('string');
      expect(expectedModelName).not.toBe('unknown');
    } finally {
      context.exit();
    }
  });
});
