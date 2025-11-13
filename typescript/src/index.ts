/**
 * Agentic Learning SDK for TypeScript
 *
 * Automatic memory integration with Letta for LLM applications.
 */

// Export main client
export { AgenticLearning } from './client';
export type { AgenticLearningOptions } from './client';

// Export context managers
export { learning, getCurrentConfig } from './core';

// Export interceptors (this also triggers registration via side effects)
export { install, registerInterceptor, uninstallAll } from './interceptors';
export { BaseAPIInterceptor } from './interceptors';
export type { Provider, IBaseInterceptor } from './interceptors';

// Export client types
export type { Agent, CreateAgentOptions } from './client/agents/client';
export type { MemoryBlock, CreateMemoryOptions } from './client/memory/client';
export type { Message, ListMessagesOptions } from './client/messages/client';

