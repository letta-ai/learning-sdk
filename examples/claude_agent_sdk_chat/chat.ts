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
