/**
 * Agents Client
 *
 * Manages agent creation, retrieval, and deletion.
 */

import type { AgenticLearning } from '../index';
import { SleeptimeClient } from './sleeptime';

export interface Agent {
  id: string;
  name: string;
  created_at?: string;
  multi_agent_group?: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CreateAgentOptions {
  agent: string;
  memory?: string[];
  model?: string;
}

function memoryPlaceholder(label: string): string {
  const subject = label !== 'human' ? label : 'them';
  return `This is my section of core memory devoted to information about the ${label}. ` +
         `I don't yet know anything about them. ` +
         `I should update this memory over time as I interact with the human ` +
         `and learn more about ${subject}.`;
}

export class AgentsClient {
  public readonly sleeptime: SleeptimeClient;

  constructor(private parent: AgenticLearning) {
    this.sleeptime = new SleeptimeClient(parent, parent.letta);
  }

  /**
   * Create a new agent
   */
  async create(options: CreateAgentOptions): Promise<Agent> {
    const memory = options.memory || ['human'];
    const model = options.model || 'anthropic/claude-sonnet-4-20250514';

    // Create memory blocks with placeholders
    const memoryBlocks = memory.map(label => ({
      label,
      value: memoryPlaceholder(label),
    }));

    const agent = await this.parent.letta.agents.create({
      name: options.agent,
      agentType: 'letta_v1_agent',
      memoryBlocks,
      model,
      embedding: 'openai/text-embedding-3-small',
      tags: ['agentic-learning-sdk'],
      enableSleeptime: true,
    });

    // Configure sleeptime manager
    if (agent.multiAgentGroup?.id) {
      try {
        await this.parent.letta.groups.modify(agent.multiAgentGroup.id, {
          managerConfig: {
            managerType: 'sleeptime' as const,
            sleeptimeAgentFrequency: 2,
          },
        });
      } catch (error) {
        // Silently fail if group modification fails
      }
    }

    return agent as Agent;
  }

  /**
   * Retrieve an agent by name
   */
  async retrieve(agent: string): Promise<Agent | null> {
    try {
      const agents = await this.parent.letta.agents.list({
        name: agent,
        tags: ['agentic-learning-sdk'],
        includeRelationships: ['memory', 'multi_agent_group', 'tags'],
      });
      return agents.length > 0 ? (agents[0] as Agent) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete an agent
   */
  async delete(agent: string): Promise<void> {
    const agentState = await this.retrieve(agent);
    if (agentState) {
      await this.parent.letta.agents.delete(agentState.id);
    }
  }

  /**
   * List all agents created by this SDK
   */
  async list(): Promise<Agent[]> {
    const agents = await this.parent.letta.agents.list({
      tags: ['agentic-learning-sdk'],
      includeRelationships: ['memory', 'multi_agent_group', 'tags'],
    });
    return agents as Agent[];
  }
}
