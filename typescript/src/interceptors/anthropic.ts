/**
 * Anthropic Interceptor
 *
 * Intercepts Anthropic SDK calls to capture conversations and inject memory.
 * Supports both streaming and non-streaming message creation.
 */

import { BaseAPIInterceptor } from './base';
import type { Provider } from '../types';
import { getCurrentConfig } from '../core';
import { saveConversationTurn } from './utils';

export class AnthropicInterceptor extends BaseAPIInterceptor {
  readonly PROVIDER: Provider = 'anthropic';

  /**
   * Check if Anthropic SDK is available
   */
  isAvailable(): boolean {
    try {
      require('@anthropic-ai/sdk');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Install interceptor by patching Anthropic SDK methods
   *
   * NOTE: Due to CommonJS/ES6 module resolution differences in ts-node,
   * we use a lazy patching strategy that patches the first time a client
   * is created.
   */
  install(): void {
    // Set up a flag to track if we've patched
    (global as any).__ANTHROPIC_INTERCEPTOR_INSTALLED__ = false;

    // Store interceptor instance globally so the patch can access it
    (global as any).__ANTHROPIC_INTERCEPTOR__ = this;
  }

  /**
   * Lazy install - called when we detect an Anthropic client
   *
   * Call this with your Anthropic client instance to enable interception:
   * ```
   * const client = new Anthropic({ apiKey });
   * (global as any).__ANTHROPIC_INTERCEPTOR__?.lazyInstall?.(client);
   * ```
   */
  public lazyInstall(client: any): void {
    // Check if already patched
    if ((global as any).__ANTHROPIC_INTERCEPTOR_INSTALLED__) {
      return;
    }

    try {
      const MessagesClass = client.messages.constructor;

      if (MessagesClass && MessagesClass.prototype?.create) {
        // Save original method
        this.originalMethods.set('messages.create', MessagesClass.prototype.create);

        // Patch the create method
        const self = this;
        MessagesClass.prototype.create = async function (
          this: any,
          params: any,
          options?: any
        ) {
          return self.interceptCreate(this, params, options);
        };

        (global as any).__ANTHROPIC_INTERCEPTOR_INSTALLED__ = true;
      }
    } catch (error) {
      // Silently fail if patching doesn't work
      if (process.env.DEBUG_AGENTIC_LEARNING) {
        console.error('[Anthropic] Lazy install failed:', error);
      }
    }
  }

  /**
   * Uninstall interceptor and restore original methods
   */
  uninstall(): void {
    try {
      const Anthropic = require('@anthropic-ai/sdk');

      // Restore Messages.create
      const tempClient = new Anthropic({ apiKey: 'dummy-key-for-uninstall' });
      const MessagesClass = tempClient.messages.constructor;

      if (MessagesClass && this.originalMethods.has('messages.create')) {
        MessagesClass.prototype.create = this.originalMethods.get('messages.create');
      }
    } catch {
      // SDK not available
    }
  }

  /**
   * Intercept Messages create method
   */
  private async interceptCreate(
    context: any,
    params: any,
    options?: any
  ): Promise<any> {
    const config = getCurrentConfig();

    if (!config) {
      // No learning context active - pass through
      const originalMethod = this.originalMethods.get('messages.create');
      if (!originalMethod) {
        throw new Error('Original method not found');
      }
      return originalMethod.call(context, params, options);
    }

    // Extract user message
    const userMessage = this.extractUserMessages(params);

    // Inject memory context if enabled
    params = await this.retrieveAndInjectMemory(config, params);

    // Call original method
    const originalMethod = this.originalMethods.get('messages.create');
    const response = await originalMethod.call(context, params, options);

    // Check if streaming
    if (params.stream) {
      // Handle streaming response - wrap to accumulate chunks
      const wrappedStream = this.wrapStreamingResponse(response, userMessage, params.model || 'claude-3-5-sonnet-20241022');
      return wrappedStream;
    } else {
      // Non-streaming - extract and save immediately
      const modelName = this.extractModelName(response);

      await saveConversationTurn(
        this.PROVIDER,
        modelName,
        this.buildRequestMessages(userMessage),
        this.buildResponseDict(response)
      ).catch(() => {
        // Silently fail
      });

      return response;
    }
  }

  /**
   * Extract user messages from Anthropic parameters
   */
  extractUserMessages(params: any): string {
    if (!params.messages) {
      return '';
    }

    const messages: string[] = [];
    // Get the last user message (or all user messages)
    for (const msg of params.messages) {
      if (msg.role === 'user') {
        const content = msg.content;

        if (typeof content === 'string') {
          messages.push(content);
        } else if (Array.isArray(content)) {
          // Multi-modal content - extract text parts
          const textParts = content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text || '');
          messages.push(textParts.join(' '));
        }
      }
    }

    return messages.join('\n');
  }

  /**
   * Extract assistant message from response
   */
  extractAssistantMessage(response: any): string {
    const textParts: string[] = [];

    if (response.content) {
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          textParts.push(block.text);
        }
      }
    }

    return textParts.join(' ');
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
      content: this.extractAssistantMessage(response),
    };
  }

  /**
   * Extract model name from response
   */
  extractModelName(response?: any): string {
    if (response?.model) {
      return response.model;
    }
    return 'claude-3-5-sonnet-20241022'; // Fallback default
  }

  /**
   * Inject memory context into Anthropic parameters
   */
  injectMemoryContext(params: Record<string, any>, context: string): Record<string, any> {
    if (!context) {
      return params;
    }

    // Inject into system parameter
    if (params.system) {
      if (typeof params.system === 'string') {
        params.system = `${context}\n\n${params.system}`;
      } else if (Array.isArray(params.system)) {
        // System is a list of content blocks
        params.system = [{ type: 'text', text: context }, ...params.system];
      }
    } else {
      params.system = context;
    }

    return params;
  }

  /**
   * Build response from streaming chunks
   */
  protected buildResponseFromChunks(chunks: any[]): any {
    const texts: string[] = [];
    let baseChunk: any = null;

    for (const chunk of chunks) {
      if (chunk.type === 'content_block_delta') {
        if (chunk.delta?.text) {
          texts.push(chunk.delta.text);
        }
      } else if (chunk.type === 'message_start' && chunk.message) {
        baseChunk = chunk.message;
      }
    }

    const combinedText = texts.join('');

    return {
      content: [
        {
          type: 'text',
          text: combinedText,
        },
      ],
      model: baseChunk?.model || 'claude-3-5-sonnet-20241022',
    };
  }

  /**
   * Wrap streaming response to accumulate chunks and save when done
   */
  private wrapStreamingResponse(stream: any, userMessage: string, modelName: string): any {
    const chunks: any[] = [];
    const self = this;

    // Create async generator wrapper
    const wrappedGenerator = async function* () {
      try {
        for await (const chunk of stream) {
          chunks.push(chunk);
          yield chunk;
        }
      } finally {
        // After stream completes, save the accumulated conversation
        if (chunks.length > 0 && userMessage) {
          self.saveStreamingTurn(chunks, userMessage, modelName);
        }
      }
    };

    // Return the wrapped generator
    return wrappedGenerator();
  }

  /**
   * Save streaming conversation turn after accumulating chunks
   */
  private saveStreamingTurn(chunks: any[], userMessage: string, modelName: string): void {
    if (!userMessage) {
      return;
    }

    // Build complete response from chunks
    const response = this.buildResponseFromChunks(chunks);

    // Save to Letta
    saveConversationTurn(
      this.PROVIDER,
      modelName,
      this.buildRequestMessages(userMessage),
      this.buildResponseDict(response)
    ).catch(() => {
      // Silently fail
    });
  }
}
