/**
 * AgenticLearning Client
 *
 * Wrapper around Letta client providing simplified memory and agent management APIs.
 */

import { LettaClient } from '@letta-ai/letta-client';
import { AgentsClient } from './agents/client';
import { MemoryClient } from './memory/client';
import { MessagesClient } from './messages/client';

export interface AgenticLearningOptions {
  /** Base URL for Letta API (default: https://api.letta.com) */
  baseUrl?: string;
  /** API key for authentication */
  apiKey?: string;
}

/**
 * Main client for Agentic Learning SDK
 *
 * Provides access to agents, memory, and messages APIs.
 */
export class AgenticLearning {
  public readonly letta: LettaClient;
  public readonly baseUrl: string;

  public readonly agents: AgentsClient;
  public readonly memory: MemoryClient;
  public readonly messages: MessagesClient;

  constructor(options: AgenticLearningOptions = {}) {
    // Check for API key in environment if not provided
    const apiKey = options.apiKey || process.env.LETTA_API_KEY;

    // Default to cloud endpoint or use provided base URL
    this.baseUrl = options.baseUrl || 'https://api.letta.com';

    // Create underlying Letta client
    this.letta = new LettaClient({
      baseUrl: this.baseUrl,
      token: apiKey,
    });

    // Initialize sub-clients
    this.agents = new AgentsClient(this);
    this.memory = new MemoryClient(this);
    this.messages = new MessagesClient(this);
  }
}

export type { AgentsClient } from './agents/client';
export type { MemoryClient } from './memory/client';
export type { MessagesClient } from './messages/client';
