/**
 * Messages Context Client
 *
 * Provides context management operations for messages.
 */

import type { AgenticLearning } from '../index';

interface MessageDict {
  role: string;
  content: string;
}

/**
 * Convert a Letta message to a simple dict format
 */
function convertMessageToDict(message: any): MessageDict | null {
  let content: string;

  if (typeof message.content === 'string') {
    content = message.content;
  } else if (Array.isArray(message.content)) {
    content = message.content
      .filter((part: any) => part.text)
      .map((part: any) => part.text)
      .join('\n');
  } else {
    content = '';
  }

  if (
    content.trim() &&
    (message.messageType === 'user_message' || message.messageType === 'assistant_message')
  ) {
    return {
      role: message.messageType,
      content,
    };
  }

  return null;
}

/**
 * Collapse consecutive messages from the same role and order them
 */
function collapseAndOrderMessages(
  messages: (MessageDict | null)[],
  order: 'asc' | 'desc' = 'desc'
): MessageDict[] {
  // Filter out nulls
  const filtered = messages.filter((m): m is MessageDict => m !== null);

  // Collapse consecutive messages from same role
  const collapsed: MessageDict[] = [];
  for (const message of filtered) {
    if (collapsed.length > 0 && collapsed[collapsed.length - 1].role === message.role) {
      // Merge with previous message
      collapsed[collapsed.length - 1].content += '\n' + message.content;
    } else {
      collapsed.push(message);
    }
  }

  // Order
  if (order === 'desc') {
    return collapsed.reverse();
  }
  return collapsed;
}

export interface RetrieveContextOptions {
  before?: string;
  after?: string;
  limit?: number;
  order?: 'asc' | 'desc';
}

export class MessagesContextClient {
  constructor(private parent: AgenticLearning) {}

  /**
   * Retrieve the message context for the agent.
   *
   * @param agent - Name of the agent to retrieve message context for
   * @param options - Retrieval options
   * @param options.before - Optional message ID cursor for pagination
   * @param options.after - Optional message ID cursor for pagination
   * @param options.limit - Maximum number of messages to return (default: 50)
   * @param options.order - Order of messages ("asc" or "desc" - default: "desc")
   * @returns List of message dicts if found, empty list otherwise
   */
  async retrieve(agent: string, options: RetrieveContextOptions = {}): Promise<MessageDict[]> {
    const messages = await this.parent.messages.list(agent, {
      before: options.before,
      after: options.after,
      limit: options.limit,
    });

    const messageDicts = messages.map(convertMessageToDict);
    return collapseAndOrderMessages(messageDicts, options.order || 'desc');
  }
}
