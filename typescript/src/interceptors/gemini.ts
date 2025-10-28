/**
 * Gemini Interceptor
 *
 * Intercepts Google Generative AI SDK calls to capture conversations and inject memory.
 * Supports both streaming and non-streaming content generation.
 */

import { BaseAPIInterceptor } from './base';
import type { Provider } from './base';

export class GeminiInterceptor extends BaseAPIInterceptor {
  readonly PROVIDER: Provider = 'gemini';

  /**
   * Check if Google Generative AI SDK is available
   */
  isAvailable(): boolean {
    try {
      require('@google/generative-ai');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Install interceptor by patching Gemini SDK methods
   */
  install(): void {
    try {
      const { GoogleGenerativeAI, GenerativeModel } = require('@google/generative-ai');

      // Find the actual GenerativeModel class - it might be exported directly or via GoogleGenerativeAI
      let ModelClass = GenerativeModel;
      if (!ModelClass) {
        // Try to get it from a GoogleGenerativeAI instance
        const tempInstance = new GoogleGenerativeAI('dummy-key');
        if (tempInstance.getGenerativeModel) {
          const tempModel = tempInstance.getGenerativeModel({ model: 'gemini-pro' });
          ModelClass = tempModel.constructor;
        }
      }

      if (ModelClass && ModelClass.prototype?.generateContent) {
        this.originalMethods.set('generateContent', ModelClass.prototype.generateContent);

        // Patch the generateContent method
        const self = this;
        ModelClass.prototype.generateContent = async function (
          this: any,
          request: any
        ) {
          return self.interceptGenerateContent(this, request);
        };
      }

      // Also try to patch generateContentStream if it exists
      if (ModelClass && ModelClass.prototype?.generateContentStream) {
        this.originalMethods.set('generateContentStream', ModelClass.prototype.generateContentStream);

        const self = this;
        ModelClass.prototype.generateContentStream = async function (
          this: any,
          request: any
        ) {
          return self.interceptGenerateContentStream(this, request);
        };
      }
    } catch (error) {
      // SDK not available or incompatible version
    }
  }

  /**
   * Uninstall interceptor and restore original methods
   */
  uninstall(): void {
    try {
      const { GenerativeModel } = require('@google/generative-ai');

      if (GenerativeModel && this.originalMethods.has('generateContent')) {
        GenerativeModel.prototype.generateContent = this.originalMethods.get('generateContent');
      }

      if (GenerativeModel && this.originalMethods.has('generateContentStream')) {
        GenerativeModel.prototype.generateContentStream = this.originalMethods.get('generateContentStream');
      }
    } catch {
      // SDK not available
    }
  }

  /**
   * Intercept generateContent method (non-streaming)
   */
  private async interceptGenerateContent(
    modelInstance: any,
    request: any
  ): Promise<any> {
    const { getCurrentConfig } = require('../core');
    const config = getCurrentConfig();

    if (!config) {
      // No learning context active - pass through
      const originalMethod = this.originalMethods.get('generateContent');
      if (!originalMethod) {
        throw new Error('Original method not found');
      }
      return originalMethod.call(modelInstance, request);
    }

    // Extract user message
    const userMessage = this.extractUserMessages(request);

    // Inject memory context if enabled
    request = await this.retrieveAndInjectMemory(config, request);

    // Call original method
    const originalMethod = this.originalMethods.get('generateContent');
    const response = await originalMethod.call(modelInstance, request);

    // Extract model name from instance
    const modelName = this.extractModelName(response, modelInstance);

    // Save conversation
    const { saveConversationTurn } = require('../core');
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

  /**
   * Intercept generateContentStream method (streaming)
   */
  private async interceptGenerateContentStream(
    modelInstance: any,
    request: any
  ): Promise<any> {
    const { getCurrentConfig } = require('../core');
    const config = getCurrentConfig();

    if (!config) {
      // No learning context active - pass through
      const originalMethod = this.originalMethods.get('generateContentStream');
      if (!originalMethod) {
        throw new Error('Original method not found');
      }
      return originalMethod.call(modelInstance, request);
    }

    // Extract user message
    const userMessage = this.extractUserMessages(request);

    // Inject memory context if enabled
    request = await this.retrieveAndInjectMemory(config, request);

    // Call original method
    const originalMethod = this.originalMethods.get('generateContentStream');
    const streamResponse = await originalMethod.call(modelInstance, request);

    // Extract model name
    const modelName = this.extractModelName(null, modelInstance);

    // Wrap the stream to accumulate chunks
    const wrappedStream = this.wrapStreamingResponse(streamResponse, userMessage, modelName);
    return wrappedStream;
  }

  /**
   * Extract user messages from Gemini request
   */
  extractUserMessages(request: any): string {
    // Handle different request formats
    let contents = request;

    // If request is an object with contents property
    if (typeof request === 'object' && request.contents) {
      contents = request.contents;
    }

    // Handle different content formats
    if (typeof contents === 'string') {
      return contents;
    } else if (Array.isArray(contents)) {
      // List of parts or messages
      const messages: string[] = [];
      for (const item of contents) {
        if (typeof item === 'string') {
          messages.push(item);
        } else if (item.parts) {
          // Content object with parts
          for (const part of item.parts) {
            if (part.text) {
              messages.push(part.text);
            }
          }
        } else if (item.text) {
          messages.push(item.text);
        }
      }
      return messages.join('\n');
    }

    return '';
  }

  /**
   * Extract assistant message from response
   */
  extractAssistantMessage(response: any): string {
    // First try direct text property (from response.response)
    if (response?.response?.text) {
      return response.response.text();
    }

    // Try text method on response itself
    if (response?.text && typeof response.text === 'function') {
      return response.text();
    }

    // Try candidates structure
    if (response?.candidates?.[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text);
      return parts.join('\n');
    }

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
      content: this.extractAssistantMessage(response),
    };
  }

  /**
   * Extract model name from model instance
   */
  extractModelName(_response?: any, modelInstance?: any): string {
    let modelName = 'gemini-2.0-flash-exp'; // Fallback default

    if (modelInstance) {
      if (modelInstance.model) {
        modelName = modelInstance.model;
      } else if (modelInstance._modelParams?.model) {
        modelName = modelInstance._modelParams.model;
      }
    }

    // Handle model names with '/' prefix (e.g., 'models/gemini-2.0-flash-exp')
    if (typeof modelName === 'string' && modelName.includes('/')) {
      modelName = modelName.split('/').pop() || modelName;
    }

    return modelName;
  }

  /**
   * Inject memory context into Gemini request
   */
  injectMemoryContext(request: Record<string, any>, context: string): Record<string, any> {
    if (!context) {
      return request;
    }

    // Handle different request formats
    let contents = request.contents || request;

    // Convert to object with contents if it's not already
    const isRequestObject = request.contents !== undefined;

    // Handle different content formats
    if (typeof contents === 'string') {
      contents = `${context}\n\n${contents}`;
    } else if (Array.isArray(contents)) {
      contents = [context, ...contents];
    }

    // Return in the same format as input
    if (isRequestObject) {
      return {
        ...request,
        contents,
      };
    } else {
      return contents;
    }
  }

  /**
   * Build response from streaming chunks
   */
  protected buildResponseFromChunks(chunks: any[]): any {
    const texts: string[] = [];

    for (const chunk of chunks) {
      // Try different chunk structures
      if (chunk.text && typeof chunk.text === 'function') {
        texts.push(chunk.text());
      } else if (chunk.text && typeof chunk.text === 'string') {
        texts.push(chunk.text);
      } else if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.text) {
            texts.push(part.text);
          }
        }
      }
    }

    const combinedText = texts.join('');

    // Return a response-like object
    return {
      response: {
        text: () => combinedText,
      },
      candidates: chunks[0]?.candidates || [],
    };
  }

  /**
   * Wrap streaming response to accumulate chunks and save when done
   */
  private wrapStreamingResponse(streamResponse: any, userMessage: string, modelName: string): any {
    const chunks: any[] = [];
    const self = this;

    // Gemini streams have a stream property that's an async iterable
    const originalStream = streamResponse.stream;

    // Create wrapped stream
    const wrappedStream = async function* () {
      try {
        for await (const chunk of originalStream) {
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

    // Return wrapped response with the same structure
    return {
      ...streamResponse,
      stream: wrappedStream(),
    };
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
    const { saveConversationTurn } = require('../core');
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
