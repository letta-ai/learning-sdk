/**
 * Agent Sleeptime Client
 *
 * Provides sleeptime management operations for agents.
 */

import type { AgenticLearning } from '../index';
import type { Agent } from './client';

export class SleeptimeClient {
  constructor(
    private parent: AgenticLearning,
    private letta: any
  ) {}

  /**
   * Retrieve the sleeptime agent for a primary agent
   */
  async retrieve(agent: string): Promise<Agent | null> {
    console.log('[SleeptimeClient] retrieve called for agent:', agent);

    const primaryAgent = await this.parent.agents.retrieve(agent);
    console.log('[SleeptimeClient] primaryAgent:', primaryAgent ? primaryAgent.id : 'null');
    console.log('[SleeptimeClient] primaryAgent.multiAgentGroup:', (primaryAgent as any)?.multiAgentGroup);

    // Note: TypeScript Letta client uses camelCase (multiAgentGroup), not snake_case
    const multiAgentGroup = (primaryAgent as any)?.multiAgentGroup;
    if (!primaryAgent || !multiAgentGroup) {
      console.log('[SleeptimeClient] No primary agent or no multiAgentGroup, returning null');
      return null;
    }

    const sleeptimeAgentId = multiAgentGroup.agentIds?.[0];
    console.log('[SleeptimeClient] sleeptimeAgentId:', sleeptimeAgentId);

    if (!sleeptimeAgentId) {
      console.log('[SleeptimeClient] No sleeptimeAgentId found, returning null');
      return null;
    }

    try {
      console.log('[SleeptimeClient] Retrieving sleeptime agent from Letta with ID:', sleeptimeAgentId);
      const sleeptimeAgent = await this.letta.agents.retrieve(sleeptimeAgentId, {
        includeRelationships: ['memory', 'multi_agent_group', 'tags'],
      });
      console.log('[SleeptimeClient] Sleeptime agent retrieved:', sleeptimeAgent ? sleeptimeAgent.id : 'null');
      return sleeptimeAgent as Agent;
    } catch (error) {
      console.error('[SleeptimeClient] Error retrieving sleeptime agent:', error);
      return null;
    }
  }
}
