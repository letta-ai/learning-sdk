"""
Langchain + Agentic Learning SDK Integration Example

This example demonstrates how to add persistent memory to Langchain agents.
The SDK automatically captures all conversations and enables agents to remember
context across different sessions.

Prerequisites:
    uv add langchain langchain-openai agentic-learning
    export OPENAI_API_KEY="your-openai-key"
    export LETTA_API_KEY="your-letta-key"

Usage:
    python main.py
"""

import os
from typing import Callable

from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse

from agentic_learning import learning


# Check environment variables
if not os.getenv("OPENAI_API_KEY"):
    print("❌ Error: OPENAI_API_KEY not set")
    print("   Please run: export OPENAI_API_KEY='your-key'")
    exit(1)

if not os.getenv("LETTA_API_KEY"):
    print("❌ Error: LETTA_API_KEY not set")
    print("   Please run: export LETTA_API_KEY='your-key'")
    exit(1)


print("Default behaviour without learning SDK:\n")

# state is not persisted by default
stateless_agent = create_agent(
    "gpt-4o-mini",
)
result = stateless_agent.invoke({
    "messages": [{"role": "user", "content": "My name is Alice."}]
})

print([message.content for message in result["messages"]])

result = stateless_agent.invoke({
    "messages": [{"role": "user", "content": "What's my name?"}]
})

print([message.content for message in result["messages"]])



print("With learning SDK:\n")

@wrap_model_call
def add_letta_memory(
    request: ModelRequest,
    handler: Callable[[ModelRequest], ModelResponse],
) -> ModelResponse:
    """Middleware that adds memory to all LLM calls."""
    with learning(agent="langchain-demo"):
        return handler(request)
# Create agent with learning middleware
stateful_agent = create_agent(
    "gpt-4o-mini",
    middleware=[add_letta_memory],  # Memory added via middleware
)

result = stateful_agent.invoke({
    "messages": [{"role": "user", "content": "My name is Alice."}]
})
print([message.content for message in result["messages"]])

result = stateful_agent.invoke({
    "messages": [{"role": "user", "content": "What's my name?"}]
})
print([message.content for message in result["messages"]])

