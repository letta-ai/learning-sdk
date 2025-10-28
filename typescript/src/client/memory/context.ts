/**
 * Memory Context Client
 *
 * Retrieves memory context for injection into LLM calls.
 */

import type { AgenticLearning } from '../index';

export interface MemoryBlock {
  id: string;
  label: string;
  value: string;
  description?: string;
}

/**
 * Format memory blocks into a readable context string.
 */
function formatMemoryBlocks(blocks: MemoryBlock[]): string | null {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const formattedLines: string[] = [];

  for (const block of blocks) {
    if (!block || !block.value) {
      continue;
    }

    formattedLines.push(`<${block.label}>`);
    if (block.description) {
      formattedLines.push(`<description>${block.description}</description>`);
    }
    formattedLines.push(`<value>${block.value}</value>`);
    formattedLines.push(`</${block.label}>`);
  }

  if (formattedLines.length === 0) {
    return null;
  }

  const memorySystemMessage = formattedLines.join('\n');
  return `<memory_blocks>\nThe following memory blocks are currently engaged:\n${memorySystemMessage}\n</memory_blocks>`;
}

/**
 * Fallback formatter for memory blocks that might be plain objects.
 */
function formatMemoryBlocksFallback(blocks: any[]): string | null {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const formattedLines: string[] = [];

  for (const block of blocks) {
    if (!block || !block['value']) {
      continue;
    }

    formattedLines.push(`<${block['label']}>`);
    if (block['description']) {
      formattedLines.push(`<description>${block['description']}</description>`);
    }
    formattedLines.push(`<value>${block['value']}</value>`);
    formattedLines.push(`</${block['label']}>`);
  }

  if (formattedLines.length === 0) {
    return null;
  }

  const memorySystemMessage = formattedLines.join('\n');
  return `<memory_blocks>\nThe following memory blocks are currently engaged:\n${memorySystemMessage}\n</memory_blocks>`;
}

export class MemoryContextClient {
  constructor(private parent: AgenticLearning) {}

  /**
   * Retrieve formatted memory context for an agent
   */
  async retrieve(agent: string): Promise<string | null> {
    console.log('[MemoryContextClient] retrieve called for agent:', agent);
    const blocks = await this.parent.memory.list(agent);
    console.log('[MemoryContextClient] blocks retrieved:', blocks?.length || 0);

    if (!blocks || blocks.length === 0) {
      console.log('[MemoryContextClient] No blocks found, returning null');
      return null;
    }

    try {
      const formatted = formatMemoryBlocks(blocks as MemoryBlock[]);
      console.log('[MemoryContextClient] Formatted context:', formatted ? formatted.substring(0, 200) + '...' : 'null');
      return formatted;
    } catch (error) {
      console.log('[MemoryContextClient] formatMemoryBlocks failed, trying fallback. Error:', error);
      const formatted = formatMemoryBlocksFallback(blocks);
      console.log('[MemoryContextClient] Fallback formatted context:', formatted ? formatted.substring(0, 200) + '...' : 'null');
      return formatted;
    }
  }
}
