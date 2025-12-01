# Claude Agent SDK Chat with Agentic Learning

A simple REPL-style chat demonstrating how to use the Claude Agent SDK with the **Agentic Learning SDK** for persistent memory.

## Overview

This example shows how to add persistent memory to Claude Agent SDK applications. The agent remembers past conversations across sessions with zero architectural changes - just wrap your `query()` call with `learning()`.

## Installation

```bash
npm install @anthropic-ai/claude-agent-sdk @letta-ai/agentic-learning typescript @types/node tsx
```

## Setup

Set your API keys:
```bash
export ANTHROPIC_API_KEY="your-anthropic-key"
export LETTA_API_KEY="your-letta-key"  # Get one at letta.com
```

## Running

```bash
npx tsx chat.ts
```

Type messages to chat with Claude. Type "exit" to quit.

## How It Works

The key is wrapping each query in the `learning()` context:

```typescript
import * as readline from "readline";
import { learning } from '@letta-ai/agentic-learning';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('Chat with Claude (type "exit" to quit)\n');

(function ask() {
  rl.question('You: ', async (input) => {
    if (input.trim().toLowerCase() === 'exit') return rl.close();
    if (!input.trim()) return ask();

    // Wrap each query in learning() to enable persistent memory across messages.
    // The SDK automatically injects relevant context from previous conversations.
    await learning({ agent: 'claude-chat-demo' }, async () => {
      // Use require() inside learning() so the SDK can intercept and inject memory
      const { query } = require("@anthropic-ai/claude-agent-sdk");
      for await (const msg of query({ prompt: input, options: { model: "haiku" } })) {
        if (msg.type === 'assistant') {
          const text = msg.message?.content.find((c: any) => c.type === 'text');
          if (text?.text) console.log(`\nClaude: ${text.text}\n`);
        }
      }
    });
    ask();
  });
})();
```

**Key points:**
- `learning()` wraps each query to enable persistent memory
- Use `require()` inside the callback so the SDK can intercept and inject memory
- The agent identifier (`'claude-chat-demo'`) groups memories together

## Resources

- [Claude Agent SDK Documentation](https://docs.anthropic.com)
- [Agentic Learning SDK](https://github.com/letta-ai/agentic-learning-sdk)
- [Get Letta API Key](https://www.letta.com/)
