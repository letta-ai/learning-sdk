/**
 * Messages Client
 *
 * Manages conversation messages for agents.
 */

import type { AgenticLearning } from '../index';
import type { Letta } from '@letta-ai/letta-client';
import { MessagesContextClient } from './context';

// Use the Letta SDK's message type directly
export type Message = Letta.LettaMessageUnion;

export interface ListMessagesOptions {
  before?: string;
  after?: string;
  limit?: number;
}

export class MessagesClient {
  public readonly context: MessagesContextClient;

  constructor(private parent: AgenticLearning) {
    this.context = new MessagesContextClient(parent);
  }

  /**
   * List all messages for the agent.
   *
   * @param agent - Name of the agent to list messages for
   * @param options - Pagination options
   * @param options.before - Optional message ID cursor for pagination
   * @param options.after - Optional message ID cursor for pagination
   * @param options.limit - Maximum number of messages to return (default: 50)
   * @returns Paginated list of message objects
   */
  async list(agent: string, options: ListMessagesOptions = {}): Promise<Message[]> {
    // First get the agent to get its ID
    const agentState = await this.parent.agents.retrieve(agent);
    if (!agentState) {
      return [];
    }

    const messages = await this.parent.letta.agents.messages.list(agentState.id, {
      before: options.before,
      after: options.after,
      limit: options.limit,
    });

    // Return messages directly from Letta SDK - no remapping needed
    return messages as Message[];
  }

  /**
   * Create new messages for the agent.
   *
   * @param agentId - ID of the agent to create messages for
   * @param requestMessages - List of message dictionaries with 'role' and 'content'
   * @returns Response from Letta
   */
  async create(agentId: string, requestMessages: Array<{role: 'user' | 'assistant' | 'system'; content: string}>): Promise<any> {
    return await this.parent.letta.agents.messages.create(agentId, {
      messages: requestMessages as any,
    });
  }

  /**
   * Get a specific message by ID.
   *
   * @param agent - Name of the agent
   * @param messageId - ID of the message to retrieve
   * @returns Message object if found, null otherwise
   */
  async retrieve(agent: string, messageId: string): Promise<Message | null> {
    try {
      const agentState = await this.parent.agents.retrieve(agent);
      if (!agentState) {
        return null;
      }

      // For now, get all messages and find the one we want
      // since the Letta client doesn't expose a retrieve method
      const messages = await this.list(agent);
      return messages.find(m => m.id === messageId) || null;
    } catch (error) {
      return null;
    }
  }
}
