/**
 * OpenAI Example - Agentic Learning SDK
 *
 * This example shows how to use the Agentic Learning SDK with OpenAI's API.
 * The SDK automatically captures conversations and manages persistent memory.
 *
 * Prerequisites:
 *     npm install @letta/agentic-learning openai
 *     export OPENAI_API_KEY="your-api-key"
 *
 * Usage:
 *     npx ts-node examples/openai_example.ts
 */

import OpenAI from 'openai';
import { AgenticLearning, learning } from '../typescript/src';
import { printU, printA, printG, printR, printMessages } from './utils';

// Configure OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable not set');
  console.error("Please run: export OPENAI_API_KEY='your-api-key'");
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

  // Create an OpenAI client
  const client = new OpenAI({ apiKey });

  // Use the learning context - this is all you need!
  await learning({ agent: 'openai-demo', client: learningClient }, async () => {
    printU('My name is Alice.');
    const response1 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'My name is Alice.' }],
    });
    printA(`${response1.choices[0].message.content}\n`);

    await sleep(5000); // wait for memory to persist

    printU("What's my name?");
    const response2 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: "What's my name?" }],
    });
    printA(`${response2.choices[0].message.content}\n`);
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

  const client = new OpenAI({ apiKey });

  await learning({ agent: 'openai-demo', client: learningClient }, async () => {
    printU(
      'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?'
    );
    printA('', '', true);

    const stream1 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content:
            'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?',
        },
      ],
      stream: true,
    });

    for await (const chunk of stream1) {
      if (chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }

    console.log('\n');

    await sleep(5000); // wait for memory to persist

    printU("What's my favorite context management service?");
    printA('', '', true);

    const stream2 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: "What's my favorite context management service?",
        },
      ],
      stream: true,
    });

    for await (const chunk of stream2) {
      if (chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }

    console.log('\n');
  });

  printG('✓ Streaming conversation automatically saved to Letta!\n');
}

// ===============================================
// Example 3: Capture-Only Mode and Memory Recall
// ===============================================

async function example3() {
  console.log('='.repeat(60));
  console.log('Example 3: Capture-Only Mode and Memory Recall');
  console.log('='.repeat(60));
  console.log();

  const client = new OpenAI({ apiKey });

  await learning({
    agent: 'openai-demo',
    captureOnly: true,
    client: learningClient,
  }, async () => {
    printU('I am a software engineer.');
    const response1 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'I am a software engineer.' }],
    });
    printA(`${response1.choices[0].message.content}\n`);

    await sleep(5000); // Wait for memory to persist

    printR('Testing recall without default memory injection\n');
    printU("What's my professional background?");
    const response2 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: "What's my professional background?" }],
    });
    printA(`${response2.choices[0].message.content}\n`);
  });

  printG('Testing memory recall via learning client\n');
  printU("What's my professional background?");
  const searchResults = await learningClient.memory.search(
    'openai-demo',
    "What's my professional background?"
  );
  printMessages(searchResults);

  printG('\nListing stored message history\n');
  const messages = await learningClient.messages.list('openai-demo', { limit: 12 });
  printMessages(messages);

  printG('✓ Memory recall successful!\n');
}

// Run all examples
async function main() {
  await example1();
  await example2();
  await example3();

  console.log('='.repeat(60));
  console.log('All examples complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
