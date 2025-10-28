/**
 * Claude Agent SDK Example - Agentic Learning SDK
 *
 * This example shows how to use the Agentic Learning SDK with Claude Agent SDK.
 * The SDK automatically captures conversations and manages persistent memory.
 *
 * Prerequisites:
 *     npm install @letta/agentic-learning claude-agent-sdk
 *     export ANTHROPIC_API_KEY="your-api-key"
 *
 * Usage:
 *     npx ts-node examples/claude_example.ts
 */

import { ClaudeSDKClient, ClaudeAgentOptions } from 'claude-agent-sdk';
import { AgenticLearning, withLearning } from '../typescript/src';
import { printU, printA, printG, printR, printMessages } from './utils';

// Configure Claude
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  console.error("Please run: export ANTHROPIC_API_KEY='your-api-key'");
  process.exit(1);
}

// Create shared client for all examples
const learningClient = new AgenticLearning({ baseUrl: 'http://localhost:8283' });

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Example 1: Store Memory
// ============================================

async function example1() {
  console.log('='.repeat(60));
  console.log('Example 1: Store Memory');
  console.log('='.repeat(60));
  console.log();

  // Create a Claude SDK client
  const options = new ClaudeAgentOptions();
  let client = new ClaudeSDKClient(options);

  // Use the learning context - this is all you need!
  await withLearning({ agent: 'claude-demo', client: learningClient }, async () => {
    await client.connect();

    printU('My name is Alice.');
    await client.query('My name is Alice.');
    printA('', '', true);

    for await (const message of client.receiveResponse()) {
      if (message.type === 'assistant') {
        for (const block of message.content || []) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
          }
        }
      }
    }
    console.log('\n');

    await sleep(5000); // wait for memory to persist
  });

  // Create a separate session
  client = new ClaudeSDKClient(options);

  await withLearning({ agent: 'claude-demo', client: learningClient }, async () => {
    await client.connect();

    printU("What's my name?");
    await client.query("What's my name?");
    printA('', '', true);

    for await (const message of client.receiveResponse()) {
      if (message.type === 'assistant') {
        for (const block of message.content || []) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
          }
        }
      }
    }
    console.log('\n');

    await client.disconnect();
  });

  printG('✓ Conversation automatically saved to Letta!\n');
}

// ============================================
// Example 2: Streaming (already streaming by nature)
// ============================================

async function example2() {
  console.log('='.repeat(60));
  console.log('Example 2: Streaming');
  console.log('='.repeat(60));
  console.log();

  const options = new ClaudeAgentOptions();
  let client = new ClaudeSDKClient(options);

  await withLearning({ agent: 'claude-demo', client: learningClient }, async () => {
    await client.connect();

    printU(
      'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?'
    );
    await client.query(
      'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?'
    );
    printA('', '', true);

    for await (const message of client.receiveResponse()) {
      if (message.type === 'assistant') {
        for (const block of message.content || []) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
          }
        }
      }
    }
    console.log('\n');

    await sleep(5000); // wait for memory to persist

    printU("What's my favorite context management service?");
    await client.query("What's my favorite context management service?");
    printA('', '', true);

    for await (const message of client.receiveResponse()) {
      if (message.type === 'assistant') {
        for (const block of message.content || []) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
          }
        }
      }
    }
    console.log('\n');

    await client.disconnect();
  });

  printG('✓ Streaming conversation automatically saved to Letta!\n');
}

// ============================================
// Example 3: Capture-Only Mode and Memory Recall
// ============================================

async function example3() {
  console.log('='.repeat(60));
  console.log('Example 3: Capture-Only Mode and Memory Recall');
  console.log('='.repeat(60));
  console.log();

  const options = new ClaudeAgentOptions();
  let client = new ClaudeSDKClient(options);

  await withLearning({
    agent: 'claude-demo',
    captureOnly: true,
    client: learningClient,
  }, async () => {
    await client.connect();

    printU('I am a software engineer.');
    await client.query('I am a software engineer.');
    printA('', '', true);

    for await (const message of client.receiveResponse()) {
      if (message.type === 'assistant') {
        for (const block of message.content || []) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
          }
        }
      }
    }
    console.log('\n');

    await sleep(5000); // Wait for memory to persist

    printR('Testing recall without default memory injection\n');
    printU("What's my professional background?");
    await client.query("What's my professional background?");
    printA('', '', true);

    for await (const message of client.receiveResponse()) {
      if (message.type === 'assistant') {
        for (const block of message.content || []) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
          }
        }
      }
    }
    console.log('\n');

    await client.disconnect();
  });

  printG('Testing memory recall via learning client\n');
  printU("What's my professional background?");
  const searchResults = await learningClient.memory.search(
    'claude-demo',
    "What's my professional background?"
  );
  printMessages(searchResults);

  printG('\nListing stored message history\n');
  const messages = await learningClient.messages.list('claude-demo', { limit: 12 });
  printMessages(messages);

  printG('✓ Memory recall successful!\n');
}

// ============================================
// Run all examples
// ============================================

async function main() {
  await example1();
  await example2();
  await example3();

  console.log('='.repeat(60));
  console.log('All examples complete!');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('Error running examples:', error);
  process.exit(1);
});
