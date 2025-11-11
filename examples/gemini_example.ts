/**
 * Gemini Example - Agentic Learning SDK
 *
 * This example shows how to use the Agentic Learning SDK with Google's Gemini API.
 * The SDK automatically captures conversations and manages persistent memory.
 *
 * Prerequisites:
 *     npm install @letta/agentic-learning @google/generative-ai
 *     export GEMINI_API_KEY="your-api-key"
 *
 * Usage:
 *     npx ts-node examples/gemini_example.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgenticLearning, learning } from '../typescript/src';
import { printU, printA, printG, printR, printMessages } from './utils';

// Configure Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set');
  console.error("Please run: export GEMINI_API_KEY='your-api-key'");
  process.exit(1);
}
// TypeScript guard: apiKey is definitely a string after the check above
const geminiApiKey: string = apiKey;

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

  // Create a Gemini model
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Use the learning context - this is all you need!
  await learning({ agent: 'gemini-demo', client: learningClient }, async () => {
    printU('My name is Alice.');
    const response1 = await model.generateContent('My name is Alice.');
    printA(`${response1.response.text()}\n`);

    await sleep(5000); // wait for memory to persist

    printU("What's my name?");
    const response2 = await model.generateContent("What's my name?");
    printA(`${response2.response.text()}\n`);
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

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  await learning({ agent: 'gemini-demo', client: learningClient }, async () => {
    printU(
      'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?'
    );
    printA('');

    const result1 = await model.generateContentStream(
      'Letta is my favorite context management service. Can you send me a summary about the product Letta (fka MemGPT) offers?'
    );

    for await (const chunk of result1.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
    }

    console.log('\n');

    await sleep(5000); // wait for memory to persist

    printU("What's my favorite context management service?");
    printA('');

    const result2 = await model.generateContentStream(
      "What's my favorite context management service?"
    );

    for await (const chunk of result2.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
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

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  await learning({
    agent: 'gemini-demo',
    captureOnly: true,
    client: learningClient,
  }, async () => {
    printU('I am a software engineer.');
    const response1 = await model.generateContent('I am a software engineer.');
    printA(`${response1.response.text()}\n`);

    await sleep(5000); // Wait for memory to persist

    printR('Testing recall without default memory injection\n');
    printU("What's my professional background?");
    const response2 = await model.generateContent("What's my professional background?");
    printA(`${response2.response.text()}\n`);
  });

  printG('Testing memory recall via learning client\n');
  printU("What's my professional background?");
  const searchResults = await learningClient.memory.search(
    'gemini-demo',
    "What's my professional background?"
  );
  printMessages(searchResults);

  printG('\nListing stored message history\n');
  const messages = await learningClient.messages.list('gemini-demo', { limit: 12 });
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
