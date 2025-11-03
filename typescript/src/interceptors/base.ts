/**
 * Base Interceptor Classes
 *
 * Abstract base classes for implementing provider-specific interceptors.
 * Provides common functionality for capturing conversations and injecting memory.
 */

import type { Provider } from '../types';
import { saveConversationTurn } from './utils';

/**
 * Base interceptor interface
 */
export interface IBaseInterceptor {
  /** Provider name (e.g., 'openai', 'anthropic') */
  readonly PROVIDER: Provider;

  /** Check if this provider's SDK is available */
  isAvailable(): boolean;

  /** Install the interceptor (patch SDK methods) */
  install(): void;

  /** Uninstall the interceptor (restore original methods) */
  uninstall(): void;
}

/**
 * Base abstract class for API interceptors
 *
 * Provides common functionality for intercepting LLM SDK calls,
 * capturing conversations, and injecting memory context.
 */
export abstract class BaseAPIInterceptor implements IBaseInterceptor {
  abstract readonly PROVIDER: Provider;

  protected originalMethods: Map<string, any> = new Map();

  /**
   * Check if provider SDK is available
   */
  abstract isAvailable(): boolean;

  /**
   * Install interceptor by patching SDK methods
   */
  abstract install(): void;

  /**
   * Uninstall interceptor and restore original methods
   */
  abstract uninstall(): void;

  /**
   * Extract user messages from SDK call arguments
   */
  abstract extractUserMessages(...args: any[]): string;

  /**
   * Extract assistant message from non-streaming response
   */
  abstract extractAssistantMessage(response: any): string;

  /**
   * Build request messages array for Letta
   */
  abstract buildRequestMessages(userMessage: string): Array<{ role: string; content: string }>;

  /**
   * Build response dict for Letta from provider response
   */
  abstract buildResponseDict(response: any): { role: string; content: string };

  /**
   * Extract model name from response or model instance
   */
  abstract extractModelName(response?: any, modelSelf?: any): string;

  /**
   * Inject memory context into SDK kwargs
   */
  abstract injectMemoryContext(kwargs: Record<string, any>, context: string): Record<string, any>;

  /**
   * Build a complete response from streaming chunks
   */
  protected abstract buildResponseFromChunks(chunks: any[]): any;

  /**
   * Retrieve and inject memory context if enabled
   */
  protected async retrieveAndInjectMemory(
    config: any,
    kwargs: Record<string, any>
  ): Promise<Record<string, any>> {
    // Check if capture_only mode is enabled
    if (config.captureOnly) {
      return kwargs;
    }

    const client = config.client;
    const agentName = config.agentName;

    if (!client || !agentName) {
      return kwargs;
    }

    try {
      // Retrieve memory context
      const memoryContext = await client.memory.context.retrieve(agentName);

      if (process.env.DEBUG_AGENTIC_LEARNING) {
        console.log('[AgenticLearning] Memory context retrieved:', memoryContext ? `${memoryContext.substring(0, 200)}...` : 'null');
      }

      if (!memoryContext) {
        return kwargs;
      }

      // Inject memory context
      const injectedKwargs = this.injectMemoryContext(kwargs, memoryContext);

      if (process.env.DEBUG_AGENTIC_LEARNING) {
        console.log('[AgenticLearning] Memory context injected into request');
      }

      return injectedKwargs;
    } catch (error) {
      // Fail silently unless debug mode is enabled
      if (process.env.DEBUG_AGENTIC_LEARNING) {
        console.error('[AgenticLearning] Failed to retrieve/inject memory:', error);
      }
      return kwargs;
    }
  }

  /**
   * Save a streaming turn after collecting all chunks
   */
  protected async saveStreamingTurnBase(
    chunks: any[],
    userMessage: string | null,
    modelName: string
  ): Promise<void> {
    if (!chunks || chunks.length === 0) {
      return;
    }

    // Build complete response from chunks
    const response = this.buildResponseFromChunks(chunks);

    // Save the turn
    await saveConversationTurn(
      this.PROVIDER,
      modelName,
      this.buildRequestMessages(userMessage || ''),
      this.buildResponseDict(response)
    );
  }
}
