/**
 * Messages Client
 *
 * Manages conversation messages for agents.
 */

import type { AgenticLearning } from '../index';
import type { Letta } from '@letta-ai/letta-client';

// Use the Letta SDK's message type directly
export type Message = Letta.LettaMessageUnion;

export interface ListMessagesOptions {
  before?: string;
  after?: string;
  limit?: number;
}

export class MessagesClient {
  constructor(private parent: AgenticLearning) {}

  /**
   * List messages for an agent
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
   * Get a specific message by ID
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
