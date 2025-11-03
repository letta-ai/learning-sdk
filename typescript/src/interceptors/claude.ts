/**
 * Claude Interceptor
 *
 * Interceptor for Claude Agent SDK (ClaudeSDKClient).
 *
 * This interceptor patches the SubprocessCLITransport layer to capture messages
 * going in/out of the Claude subprocess.
 */

import { BaseAPIInterceptor } from './base';
import type { Provider } from '../types';
import { getCurrentConfig } from '../core';
import { saveConversationTurn } from './utils';

interface TransportMessage {
  type: string;
  message?: any;
  [key: string]: any;
}

export class ClaudeInterceptor extends BaseAPIInterceptor {
  readonly PROVIDER: Provider = 'claude';

  /**
   * Check if claude-agent-sdk is available
   */
  isAvailable(): boolean {
    try {
      require('claude-agent-sdk');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Install interceptor by patching SubprocessCLITransport methods
   */
  install(): void {
    try {
      const claudeAgentSdk = require('claude-agent-sdk');
      // Access the internal transport class
      const SubprocessCLITransport =
        claudeAgentSdk._internal?.transport?.subprocess_cli?.SubprocessCLITransport ||
        claudeAgentSdk.SubprocessCLITransport;

      if (!SubprocessCLITransport) {
        return; // Transport not available
      }

      // Store original methods (only once)
      if (!this.originalMethods.has('init')) {
        this.originalMethods.set('init', SubprocessCLITransport.prototype.constructor);
        this.originalMethods.set('write', SubprocessCLITransport.prototype.write);
        this.originalMethods.set('read_messages', SubprocessCLITransport.prototype.readMessages);
      }

      const interceptor = this;

      // Store original constructor
      const OriginalConstructor = SubprocessCLITransport;

      // Patch constructor to inject memory into system prompt
      const PatchedConstructor = function (this: any, ...args: any[]) {
        // Call original constructor
        OriginalConstructor.apply(this, args);

        // Inject memory into system prompt if enabled
        const config = getCurrentConfig();
        if (config) {
          interceptor.injectMemoryIntoOptions(this._options || this.options, config);
        }
      };

      // Copy prototype
      PatchedConstructor.prototype = OriginalConstructor.prototype;

      // Patch write() to capture outgoing messages
      const originalWrite = SubprocessCLITransport.prototype.write;
      SubprocessCLITransport.prototype.write = async function (this: any, data: string) {
        const config = getCurrentConfig();

        // Capture user message
        if (config) {
          await interceptor.captureOutgoingMessage(data, config);
        }

        // Call original write
        return originalWrite.call(this, data);
      };

      // Patch readMessages() to capture incoming messages
      const originalReadMessages = SubprocessCLITransport.prototype.readMessages;
      SubprocessCLITransport.prototype.readMessages = function (this: any) {
        const config = getCurrentConfig();

        // Get original message iterator
        const originalIterator = originalReadMessages.call(this);

        // Wrap it if memory is enabled
        if (config) {
          return interceptor.wrapMessageIterator(originalIterator, config);
        } else {
          return originalIterator;
        }
      };
    } catch (error) {
      // Silently fail if patching doesn't work
      if (process.env.DEBUG_AGENTIC_LEARNING) {
        console.error('[Claude] Install failed:', error);
      }
    }
  }

  /**
   * Uninstall interceptor and restore original methods
   */
  uninstall(): void {
    try {
      const claudeAgentSdk = require('claude-agent-sdk');
      const SubprocessCLITransport =
        claudeAgentSdk._internal?.transport?.subprocess_cli?.SubprocessCLITransport ||
        claudeAgentSdk.SubprocessCLITransport;

      if (!SubprocessCLITransport) {
        return;
      }

      // Restore original methods
      if (this.originalMethods.has('write')) {
        SubprocessCLITransport.prototype.write = this.originalMethods.get('write');
      }
      if (this.originalMethods.has('read_messages')) {
        SubprocessCLITransport.prototype.readMessages = this.originalMethods.get('read_messages');
      }
    } catch {
      // SDK not available
    }
  }

  /**
   * Extract user messages - not used for Claude (captured at transport layer)
   */
  extractUserMessages(): string {
    return '';
  }

  /**
   * Extract assistant message - not used for Claude (captured at transport layer)
   */
  extractAssistantMessage(): string {
    return '';
  }

  /**
   * Build request messages array for Letta
   */
  buildRequestMessages(userMessage: string): Array<{ role: string; content: string }> {
    return [{ role: 'user', content: userMessage }];
  }

  /**
   * Build response dict for Letta
   */
  buildResponseDict(response: any): { role: string; content: string } {
    return {
      role: 'assistant',
      content: response?.content || '',
    };
  }

  /**
   * Extract model name from response
   */
  extractModelName(): string {
    return 'claude'; // Claude Agent SDK doesn't expose model name
  }

  /**
   * Inject memory context into Claude Agent options
   */
  injectMemoryContext(options: Record<string, any>, context: string): Record<string, any> {
    if (!context) {
      return options;
    }

    // Inject into system prompt
    if (options.systemPrompt) {
      if (typeof options.systemPrompt === 'string') {
        options.systemPrompt = `${context}\n\n${options.systemPrompt}`;
      } else if (typeof options.systemPrompt === 'object' && 'append' in options.systemPrompt) {
        options.systemPrompt.append = `${context}\n\n${options.systemPrompt.append}`;
      }
    } else {
      options.systemPrompt = context;
    }

    return options;
  }

  /**
   * Inject memory into Claude Agent options system prompt
   */
  private injectMemoryIntoOptions(options: any, config: any): void {
    // Check if capture_only is enabled
    if (config.captureOnly) {
      return;
    }

    const client = config.client;
    const agentName = config.agentName;

    if (!client || !agentName) {
      return;
    }

    try {
      // Get memory context synchronously (Claude SDK init is sync)
      const memoryContext = client.memory.context.retrieve(agentName);

      if (!memoryContext) {
        return;
      }

      // Inject into system prompt
      if (options.systemPrompt) {
        if (typeof options.systemPrompt === 'string') {
          options.systemPrompt = `${memoryContext}\n\n${options.systemPrompt}`;
        } else if (typeof options.systemPrompt === 'object' && 'append' in options.systemPrompt) {
          options.systemPrompt.append = `${memoryContext}\n\n${options.systemPrompt.append}`;
        }
      } else {
        options.systemPrompt = memoryContext;
      }
    } catch (error) {
      // Don't crash if memory injection fails
      if (process.env.DEBUG_AGENTIC_LEARNING) {
        console.error('[Claude] Memory injection failed:', error);
      }
    }
  }

  /**
   * Capture user messages from outgoing transport data
   */
  private async captureOutgoingMessage(data: string, config: any): Promise<void> {
    try {
      // Parse the JSON message
      const message: TransportMessage = JSON.parse(data);
      const msgType = message.type;

      // Buffer user messages for batching
      if (msgType === 'user') {
        // Structure: {"type": "user", "message": {"role": "user", "content": "..."}}
        const userMessage = message.message || {};
        const content = userMessage.content || '';

        if (content) {
          // Buffer the user message instead of saving immediately
          config.pendingUserMessage = content;
        }
      }
    } catch (error) {
      // Silently ignore parsing errors
    }
  }

  /**
   * Wrap the message iterator to accumulate and save assistant responses
   */
  private async *wrapMessageIterator(
    originalIterator: AsyncIterableIterator<TransportMessage>,
    config: any
  ): AsyncIterableIterator<TransportMessage> {
    const accumulatedText: string[] = [];

    try {
      for await (const message of originalIterator) {
        const msgType = message.type || 'unknown';

        // Accumulate assistant text
        if (msgType === 'assistant') {
          // Structure: {"type": "assistant", "message": {"content": [{"type": "text", "text": "..."}]}}
          const assistantMessage = message.message || {};
          const contentBlocks = assistantMessage.content || [];

          for (const block of contentBlocks) {
            if (block.type === 'text' && block.text) {
              accumulatedText.push(block.text);
            }
          }
        }

        // Always yield immediately for streaming
        yield message;
      }
    } finally {
      // Save user message + assistant response to Letta
      const userMessage = config.pendingUserMessage;
      const assistantMessage = accumulatedText.length > 0 ? accumulatedText.join('') : null;

      // Only save if we have at least one message
      if (userMessage || assistantMessage) {
        try {
          // Save asynchronously (don't await)
          saveConversationTurn(
            this.PROVIDER,
            'claude',
            userMessage ? this.buildRequestMessages(userMessage) : [],
            {
              role: 'assistant',
              content: assistantMessage || '',
            }
          ).catch(() => {
            // Silently fail
          });
        } catch (error) {
          // Silently fail
        }

        // Clear the buffer
        config.pendingUserMessage = null;
      }
    }
  }

  /**
   * Build response from streaming chunks - not used for Claude
   */
  protected buildResponseFromChunks(): any {
    return { content: '' };
  }
}
