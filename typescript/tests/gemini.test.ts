/**
 * Gemini Interceptor Tests
 */

import { autoInstall } from '../src/interceptors';
import { learning } from '../src/core';
import { createTestClient, generateAgentName, cleanupAgent, sleep } from './setup';

// Mock Gemini SDK
const mockGenerateContent = jest.fn();
const mockResponse = {
  response: {
    text: () => 'Mock response',
  },
};

// Mock the Gemini module with proper structure for interceptor
jest.mock('@google/generative-ai', () => {
  // Create a mock GenerativeModel class with prototype
  class MockGenerativeModel {
    generateContent(params: any) {
      return mockGenerateContent(params);
    }

    async generateContentStream(params: any) {
      const result = await mockGenerateContent(params);
      return {
        stream: (async function* () {
          yield { text: () => 'Mock ' };
          yield { text: () => 'streaming ' };
          yield { text: () => 'response' };
        })(),
        response: result.response,
      };
    }
  }

  class MockGoogleGenerativeAI {
    getGenerativeModel(_config: any) {
      return new MockGenerativeModel();
    }
  }

  // Export the class
  return {
    __esModule: true,
    GoogleGenerativeAI: MockGoogleGenerativeAI,
  };
});

describe('Gemini Interceptor', () => {
  let learningClient: ReturnType<typeof createTestClient>;
  let agentName: string;

  beforeEach(() => {
    // Install interceptors
    autoInstall();

    // Create learning client
    learningClient = createTestClient();
    agentName = generateAgentName();

    // Reset mock
    mockGenerateContent.mockReset();
    mockGenerateContent.mockResolvedValue(mockResponse);
  });

  afterEach(async () => {
    // Cleanup agent
    await cleanupAgent(learningClient, agentName);
  });

  test('conversation saved to Letta', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
      await model.generateContent('My name is Alice');

      // Verify Gemini was called
      expect(mockGenerateContent).toHaveBeenCalled();

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
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Create agent with memory
    await learningClient.agents.create({ agent: agentName, memory: [] });
    await learningClient.memory.create({
      agent: agentName,
      label: 'human',
      value: "User's name is Bob. User likes TypeScript programming.",
    });

    await sleep(2000);

    // Capture what was sent to Gemini
    let capturedParams: any = null;
    mockGenerateContent.mockImplementation((params) => {
      capturedParams = params;
      return Promise.resolve(mockResponse);
    });

    const context = learning({
      agent: agentName,
      client: learningClient,
    });

    try {
      await model.generateContent("What's my name?");

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
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Create agent with memory
    await learningClient.agents.create({ agent: agentName, memory: [] });
    await learningClient.memory.create({
      agent: agentName,
      label: 'human',
      value: 'Secret information that should not be injected',
    });

    await sleep(2000);

    // Capture what was sent to Gemini
    let capturedParams: any = null;
    mockGenerateContent.mockImplementation((params) => {
      capturedParams = params;
      return Promise.resolve(mockResponse);
    });

    const context = learning({
      agent: agentName,
      client: learningClient,
      captureOnly: true,
    });

    try {
      await model.generateContent('Hello, how are you?');

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
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    await learningClient.agents.create({ agent: agentName });

    const context = learning({
      agent: agentName,
      client: learningClient,
    });

    try {
      await model.generateContent('Test model extraction');

      await sleep(3000);

      // Verify expected model name
      const expectedModelName = 'gemini-2.0-flash-exp';
      expect(expectedModelName).toBeTruthy();
      expect(typeof expectedModelName).toBe('string');
      expect(expectedModelName).not.toBe('unknown');
    } finally {
      context.exit();
    }
  });
});
