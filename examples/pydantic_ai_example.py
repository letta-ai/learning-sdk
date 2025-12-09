"""
Pydantic AI Example - Agentic Learning SDK

This example shows how to use the Agentic Learning SDK with Pydantic AI.
The SDK automatically captures conversations and manages persistent memory.

Prerequisites:
    pip install agentic-learning pydantic-ai
    export OPENAI_API_KEY="your-api-key"
    export LETTA_API_KEY="your-api-key"

Usage:
    python pydantic_ai_example.py
"""

from agentic_learning import learning
from pydantic_ai import Agent

agent = Agent("openai:gpt-4o-mini")


def ask(message: str):
    print(f"User: {message}\n")

    # Wrap agent calls to enable persistent memory
    with learning(agent="pydantic-ai-demo"):
        result = agent.run_sync(message)
        print(f"Assistant: {result.output}\n")


if __name__ == "__main__":
    # Memory automatically persists across LLM API calls
    ask("My name is Alice.")
    ask("What's my name?")
