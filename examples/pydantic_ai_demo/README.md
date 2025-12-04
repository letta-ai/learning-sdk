# PydanticAI Demo with Agentic Learning SDK

This demo shows how to add persistent memory to PydanticAI agents using the Agentic Learning SDK.

## What This Demo Shows

- **3-Line Integration**: Add memory to PydanticAI with just a context manager
- **Cross-Session Persistence**: Memory survives script restarts
- **Multiple Providers**: Works with Anthropic, OpenAI, and other PydanticAI-supported providers

## Setup

### 1. Install Dependencies

```bash
pip install agentic-learning pydantic-ai
```

### 2. Set API Keys

For Anthropic:
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export LETTA_API_KEY="your-letta-api-key"  # Get from https://app.letta.com
```

For OpenAI:
```bash
export OPENAI_API_KEY="your-openai-api-key"
export LETTA_API_KEY="your-letta-api-key"
```

### 3. Run the Demo

```bash
# Anthropic example
python3 anthropic_example.py

# OpenAI example
python3 openai_example.py
```

## How It Works

The integration is just 3 lines:

```python
from agentic_learning import learning

# Wrap your agent execution
with learning(agent="my-agent"):
    result = agent.run_sync("Hello!")
```

That's it! The SDK automatically:
- Captures all agent conversations
- Stores them in persistent memory
- Injects relevant context into future calls

## Architecture

```
┌─────────────────────────────────────┐
│  PydanticAI Agent                   │
│  (Anthropic, OpenAI, etc.)          │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Agentic Learning SDK               │
│  (Automatic Memory Management)      │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Letta Memory Service               │
│  (Persistent Storage)               │
└─────────────────────────────────────┘
```

## Key Benefits

1. **Zero Configuration**: No changes to agent definitions
2. **Automatic Capture**: All LLM calls are intercepted
3. **Persistent Storage**: Memory survives restarts
4. **Provider Agnostic**: Works with any PydanticAI-supported model

## Learn More

- [Agentic Learning SDK Docs](https://github.com/letta-ai/agentic-learning-sdk)
- [PydanticAI Documentation](https://ai.pydantic.dev)
