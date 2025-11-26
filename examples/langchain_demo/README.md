# Langchain + Agentic Learning SDK Integration Example

This example demonstrates how to add persistent memory to Langchain agents using the Agentic Learning SDK.

## Overview

The Agentic Learning SDK works seamlessly with Langchain by intercepting the underlying LLM API calls (OpenAI, Anthropic, etc.) that Langchain makes. This means:

✅ **No changes to your Langchain code** - just wrap your agent calls with `learning()`
✅ **Automatic memory capture** - all conversations are stored and recalled
✅ **Works with any Langchain agent** - tool-using agents, ReAct, conversational, etc.
✅ **Cross-session memory** - agents can remember context across different runs or invocations

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Your Langchain Agent                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  with learning(agent=agent_name):                     |  |
|  |      return handler(request)                          │  │
│  └─────────────────────┬─────────────────────────────────│  │
│                        │                                    │
│                        ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Langchain calls OpenAI/Anthropic/etc under hood    │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Agentic Learning Interceptor  │
        │  • Captures user messages      │
        │  • Injects memory context      |
        |  • Captures responses          │  
        |  • Stores to Letta backend     │
        └────────────────┬───────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  LLM Provider  │
                │  (OpenAI, etc) │
                └────────────────┘
```

## Installation

```bash
# Install dependencies
uv add langchain langchain-openai agentic-learning

# Set API keys
export OPENAI_API_KEY="your-openai-key"
export LETTA_API_KEY="your-letta-key"
```

## Example
```python
@wrap_model_call
def add_letta_memory(request: ModelRequest, handler: Callable[[ModelRequest], ModelResponse]) -> ModelResponse:
    """Middleware that adds memory to all LLM calls."""
    with learning(agent=agent_name):
        return handler(request)

# Create agent with middleware
agent = create_agent(
    "gpt-4o-mini",
    middleware=[add_letta_memory],  # Memory added via middleware
)
```


## Understanding Message Capture

The SDK captures messages at the LLM API level, which means:

1. **User messages** - Extracted from the `messages` parameter Langchain passes to the LLM
2. **Assistant messages** - Extracted from the LLM response that Langchain receives
3. **Tool calls** - Currently captured as part of the assistant's response

### What Gets Captured

✅ All messages Langchain sends to the LLM  
✅ All responses from the LLM  
✅ Tool call results (as part of conversation flow)  
✅ Multi-turn conversations


## Support

For issues or questions:
- 🐛 [File an issue](https://github.com/letta-ai/agentic-learning-sdk/issues)
- 💬 [Join Discord](https://discord.gg/letta)
- 📖 [Read the docs](https://docs.letta.com/)
