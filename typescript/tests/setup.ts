/**
 * Test Setup
 *
 * Common fixtures and utilities for tests.
 */

import { AgenticLearning } from '../src/client';

/**
 * Create a test learning client
 * Defaults to local Letta server (http://localhost:8283)
 */
export function createTestClient(): AgenticLearning {
  const testMode = process.env.LETTA_TEST_MODE?.toLowerCase() || 'local';

  if (testMode === 'cloud') {
    return new AgenticLearning();
  } else {
    return new AgenticLearning({ baseUrl: 'http://localhost:8283' });
  }
}

/**
 * Generate a unique agent name for testing
 */
export function generateAgentName(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-agent-${timestamp}-${random}`;
}

/**
 * Cleanup agent after test
 */
export async function cleanupAgent(
  client: AgenticLearning,
  agentName: string
): Promise<void> {
  try {
    await client.agents.delete(agentName);
  } catch (error) {
    console.warn(`Warning: Could not cleanup agent ${agentName}:`, error);
  }
}

/**
 * Sleep utility for tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
