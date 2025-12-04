"""
PydanticAI + OpenAI Example - Agentic Learning SDK

This example shows how to use the Agentic Learning SDK with PydanticAI and OpenAI.
The SDK automatically captures conversations and manages persistent memory.

Prerequisites:
    pip install agentic-learning pydantic-ai
    export OPENAI_API_KEY="your-api-key"
    export LETTA_API_KEY="your-api-key"

Usage:
    python3 openai_example.py
"""

import time
from pydantic_ai import Agent
from agentic_learning import learning

agent = Agent(
    'openai:gpt-4o',
    instructions='Be concise, reply with one sentence.',
)

def ask_agent(message: str):
    print(f"User: {message}\n")

    # That's it - wrap your API calls to enable persistent memory
    with learning(agent="pydantic-openai-demo"):
        result = agent.run_sync(message)
        print(f"Assistant: {result.output}\n")

# Memory automatically persists across LLM API calls
ask_agent("My name is Alice.")

time.sleep(7)  # Memory persists during sleep-time

ask_agent("What's my name?")
