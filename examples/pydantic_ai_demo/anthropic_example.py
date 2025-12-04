"""
PydanticAI + Anthropic Example - Agentic Learning SDK

This example shows how to use the Agentic Learning SDK with PydanticAI and Anthropic.
The SDK automatically captures conversations and manages persistent memory.

Prerequisites:
    pip install agentic-learning pydantic-ai
    export ANTHROPIC_API_KEY="your-api-key"
    export LETTA_API_KEY="your-api-key"

Usage:
    python3 anthropic_example.py
"""

import time
from pydantic_ai import Agent
from agentic_learning import learning

agent = Agent(
    'anthropic:claude-sonnet-4-20250514',
    instructions='Be concise, reply with one sentence.',
)

def ask_agent(message: str):
    print(f"User: {message}\n")

    # That's it - wrap your API calls to enable persistent memory
    with learning(agent="pydantic-anthropic-demo"):
        result = agent.run_sync(message)
        print(f"Assistant: {result.output}\n")

# Memory automatically persists across LLM API calls
ask_agent("My name is Alice.")
ask_agent("What's my name?")
sleep-time

ask_agent("What's my name?")
