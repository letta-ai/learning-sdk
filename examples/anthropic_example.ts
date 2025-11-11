/**
 * Anthropic Example - Agentic Learning SDK
 *
 * This example shows how to use the Agentic Learning SDK with Anthropic's Claude API.
 * The SDK automatically captures conversations and manages persistent memory.
 *
 * Prerequisites:
 *     npm install @letta/agentic-learning @anthropic-ai/sdk
 *     export ANTHROPIC_API_KEY="your-api-key"
 *
 * Usage:
 *     npx ts-node examples/anthropic_example.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import { AgenticLearning, learning, enableAnthropicInterception } from '../typescript/src';
import { printU, printA, printG, printR, printMessages } from './utils';

// Configure Anthropic
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

  // Create an Anthropic client
  const client = new Anthropic({ apiKey });

  // Enable interception for this client (required for ts-node)
  enableAnthropicInterception(client);

  // Use the learning context - this is all you need!
  await learning({ agent: 'anthropic-demo', client: learningClient }, async () => {
    printU('My name is Alice.');
    const response1 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'My name is Alice.' }],
    });
    const text1 = response1.content.find((block: any) => block.type === 'text');
    printA(`${text1 && 'text' in text1 ? text1.text : ''}\n`);

    await sleep(5000); // wait for memory to persist

    printU("What's my name?");
    const response2 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: "What's my name?" }],
    });
    const text2 = response2.content.find((block: any) => block.type === 'text');
    printA(`${text2 && 'text' in text2 ? text2.text : ''}\n`);
  });

  printG('✓ Conversation automatically saved to Letta!\n');
}

// ============================================
// Example 2: Streaming
// ============================================

async function example2() {
  console.log('='.repeat(60));
  console.log('Example 2: Streaming');
  console.log('='.repeat(60));
  console.log();

  const client = new Anthropic({ apiKey });
  enableAnthropicInterception(client);

  await learning({ agent: 'anthropic-demo', client: learningClient }, async () => {
    printU(
      'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?'
    );
    printA('');

    const stream1 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content:
            'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?',
        },
      ],
      stream: true,
    });

    for await (const event of stream1) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          process.stdout.write(event.delta.text);
        }
      }
    }

    console.log('\n');

    await sleep(5000); // wait for memory to persist

    printU("What's my favorite context management service?");
    printA('');

    const stream2 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: "What's my favorite context management service?" }],
      stream: true,
    });

    for await (const event of stream2) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          process.stdout.write(event.delta.text);
        }
      }
    }

    console.log('\n');
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

  const client = new Anthropic({ apiKey });
  enableAnthropicInterception(client);

  await learning({
    agent: 'anthropic-demo',
    captureOnly: true,
    client: learningClient,
  }, async () => {
    printU('I am a software engineer.');
    const response1 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'I am a software engineer.' }],
    });
    const text1 = response1.content.find((block: any) => block.type === 'text');
    printA(`${text1 && 'text' in text1 ? text1.text : ''}\n`);

    await sleep(5000); // Wait for memory to persist

    printR('Testing recall without default memory injection\n');
    printU("What's my professional background?");
    const response2 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: "What's my professional background?" }],
    });
    const text2 = response2.content.find((block: any) => block.type === 'text');
    printA(`${text2 && 'text' in text2 ? text2.text : ''}\n`);
  });

  printG('Testing memory recall via learning client\n');
  printU("What's my professional background?");
  const searchResults = await learningClient.memory.search(
    'anthropic-demo',
    "What's my professional background?"
  );
  printMessages(searchResults);

  printG('\nListing stored message history\n');
  const messages = await learningClient.messages.list('anthropic-demo', { limit: 12 });
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

main().catch(console.error);
