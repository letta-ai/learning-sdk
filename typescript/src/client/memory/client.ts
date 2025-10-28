/**
 * Memory Client
 *
 * Manages memory blocks and context retrieval for agents.
 */

import type { AgenticLearning } from '../index';
import { MemoryContextClient } from './context';
import type { Message } from '../messages/client';

export interface MemoryBlock {
  id: string;
  label: string;
  value: string;
  description?: string;
}

export interface CreateMemoryOptions {
  agent: string;
  label: string;
  value: string;
  description?: string;
}

export class MemoryClient {
  public readonly context: MemoryContextClient;

  constructor(private parent: AgenticLearning) {
    this.context = new MemoryContextClient(parent);
  }

  /**
   * Create or update a memory block
   */
  async create(options: CreateMemoryOptions): Promise<MemoryBlock> {
    // First get the agent to get its ID
    const agentState = await this.parent.agents.retrieve(options.agent);
    if (!agentState) {
      throw new Error(`Agent '${options.agent}' not found`);
    }

    // Create the block
    const block = await this.parent.letta.blocks.create({
      label: options.label,
      value: options.value,
      description: options.description,
    });

    // Attach it to the agent
    if (!block.id) {
      throw new Error('Block created without ID');
    }
    await this.parent.letta.agents.blocks.attach(agentState.id, block.id);

    return block as MemoryBlock;
  }

  /**
   * List memory blocks for an agent
   */
  async list(agent: string): Promise<MemoryBlock[]> {
    console.log('[MemoryClient.list] Retrieving blocks for agent:', agent);
    const agentState = await this.parent.agents.retrieve(agent);
    console.log('[MemoryClient.list] agentState:', agentState ? agentState.id : 'null');
    console.log('[MemoryClient.list] agentState.memory:', (agentState as any)?.memory);
    console.log('[MemoryClient.list] agentState.blocks:', (agentState as any)?.blocks);

    if (!agentState) {
      return [];
    }

    // Return memory blocks from agent state (matches Python implementation)
    // Note: TypeScript Letta client might use camelCase
    const blocks = (agentState as any).memory?.blocks || (agentState as any).blocks || [];
    console.log('[MemoryClient.list] Returning blocks:', blocks.length);
    return blocks;
  }

  /**
   * Search memory using the sleeptime agent
   */
  async search(agent: string, prompt: string): Promise<Message[]> {
    console.log('[MemoryClient] search called for agent:', agent);

    const sleeptimeAgent = await this.parent.agents.sleeptime.retrieve(agent);
    console.log('[MemoryClient] sleeptimeAgent:', sleeptimeAgent ? sleeptimeAgent.id : 'null');

    if (!sleeptimeAgent) {
      console.log('[MemoryClient] No sleeptime agent found, returning empty array');
      return [];
    }

    console.log('[MemoryClient] Calling agents.messages.create with sleeptimeAgent.id:', sleeptimeAgent.id);

    try {
      const response = await this.parent.letta.agents.messages.create(sleeptimeAgent.id, {
        messages: [
          {
            role: 'user',
            content: `Search memory for the following: ${prompt}`,
          },
        ],
      });

      console.log('[MemoryClient] Response received:', response);
      console.log('[MemoryClient] Response.messages:', response.messages?.length || 0);

      // Return messages directly from Letta SDK - no remapping needed
      return response.messages || [];
    } catch (error) {
      console.error('[MemoryClient] Error calling sleeptime agent:', error);
      return [];
    }
  }
}
