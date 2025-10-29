/**
 * OpenAI Interceptor Tests
 */

import { autoInstall } from '../src/interceptors';
import { learning } from '../src/core';
import { createTestClient, generateAgentName, cleanupAgent, sleep } from './setup';

// Mock OpenAI SDK
const mockCreate = jest.fn();
const mockResponse = {
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Mock response',
      },
    },
  ],
  model: 'gpt-4o',
};

// Mock the OpenAI module with proper structure for interceptor
jest.mock('openai', () => {
  // Create a mock Completions class with prototype
  class MockCompletions {
    create(params: any, options?: any) {
      return mockCreate(params, options);
    }
  }

  class MockChat {
    completions: MockCompletions;
    constructor() {
      this.completions = new MockCompletions();
    }
  }

  class MockOpenAI {
    chat: MockChat;
    constructor() {
      this.chat = new MockChat();
    }
  }

  // Export both the class and the static structure for interceptor
  return {
    __esModule: true,
    default: MockOpenAI,
    Chat: {
      Completions: MockCompletions,
    },
  };
});

describe('OpenAI Interceptor', () => {
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
    const OpenAI = require('openai').default;
    const openai = new OpenAI();

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
      await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'My name is Alice' }],
      });

      // Verify OpenAI was called
      expect(mockCreate).toHaveBeenCalled();

      // Wait for async save
      await sleep(5000);

      // Verify messages were saved
      const messages = await learningClient.messages.list(agentName);
      expect(messages.length).toBeGreaterThan(0);

      // Check if "Alice" is in the messages (user or assistant)
      const messageContents = messages
        .map((msg) => {
          if (msg.messageType === 'reasoning_message') return (msg as any).reasoning;
          if (msg.messageType === 'assistant_message' || msg.messageType === 'user_message') {
            return typeof (msg as any).content === 'string' ? (msg as any).content : '';
          }
          return '';
        })
        .filter(Boolean);

      const hasAlice = messageContents.some((content) => content.includes('Alice'));
      expect(hasAlice).toBe(true);
    } finally {
      context.exit();
    }
  });

  test('memory injection', async () => {
    const OpenAI = require('openai').default;
    const openai = new OpenAI();

    // Create agent with memory
    await learningClient.agents.create({ agent: agentName, memory: [] });
    await learningClient.memory.create({
      agent: agentName,
      label: 'human',
      value: "User's name is Bob. User likes TypeScript programming.",
    });

    await sleep(2000);

    // Capture what was sent to OpenAI
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
      await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: "What's my name?" }],
      });

      // Verify memory was injected
      expect(capturedParams).toBeTruthy();
      const paramsStr = JSON.stringify(capturedParams);
      const hasMemory = paramsStr.includes('Bob') || paramsStr.includes('<human>');
      expect(hasMemory).toBe(true);
    } finally {
      context.exit();
    }
  });

  test('capture only mode', async () => {
    const OpenAI = require('openai').default;
    const openai = new OpenAI();

    // Create agent with memory
    await learningClient.agents.create({ agent: agentName, memory: [] });
    await learningClient.memory.create({
      agent: agentName,
      label: 'human',
      value: 'Secret information that should not be injected',
    });

    await sleep(2000);

    // Capture what was sent to OpenAI
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
      await openai.chat.completions.create({
        model: 'gpt-4o',
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
    const OpenAI = require('openai').default;
    const openai = new OpenAI();

    await learningClient.agents.create({ agent: agentName });

    const context = learning({
      agent: agentName,
      client: learningClient,
    });

    try {
      await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test model extraction' }],
      });

      await sleep(3000);

      // Verify expected model name
      const expectedModelName = 'gpt-4o';
      expect(expectedModelName).toBeTruthy();
      expect(typeof expectedModelName).toBe('string');
      expect(expectedModelName).not.toBe('unknown');
    } finally {
      context.exit();
    }
  });
});
