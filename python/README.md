# Agentic Learning SDK

Add persistent memory to any LLM agent with one line of code. This Agentic Learning SDK automatically captures conversations, manages context, and enables agents to remember information across sessions.

```python
with learning(agent="my_agent"):
    response = client.chat.completions.create(...)  # Memory handled automatically
```

[![PyPI Version](https://img.shields.io/pypi/v/agentic-learning.svg)](https://pypi.org/project/agentic-learning/)

## Get Started

### Installation

```bash
pip install agentic-learning
```

### Basic Usage

```bash
# Set your API keys
export OPENAI_API_KEY="your-openai-key"
export LETTA_API_KEY="your-letta-key"
```

```python
from openai import OpenAI
from agentic_learning import learning

client = OpenAI()

# Add memory to your agent with one line
with learning(agent="my-agent"):
    # Your LLM call - conversation is automatically captured
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "My name is Alice"}]
    )

    # Agent remembers prior context
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "What is my name?"}]
    )
    # Returns: "Your name is Alice"
```

That's it - this SDK automatically:
- ✅ Captures all conversations
- ✅ Injects relevant memory into prompts
- ✅ Saves to persistent storage (Letta)
- ✅ Recalls information across sessions

## Supported Providers

| Provider | Package | Status | Example |
|----------|---------|--------|---------|
| **Anthropic** | `anthropic` | ✅ Stable | [anthropic_example.py](../examples/anthropic_example.py) |
| **Claude Agent SDK** | `claude-agent-sdk` | ✅ Stable | [claude_example.py](../examples/claude_example.py) |
| **OpenAI Chat Completions** | `openai` | ✅ Stable | [openai_example.py](../examples/openai_example.py) |
| **OpenAI Responses API** | `openai` | ✅ Stable | [openai_responses_example.py](../examples/openai_responses_example.py) |
| **Gemini** | `google-generativeai` | ✅ Stable | [gemini_example.py](../examples/gemini_example.py) |

### Examples

See the top-level [`../examples/`](../examples/) directory for examples:

```bash
# Run from examples directory
cd ../examples
pip install -r requirements.txt
python openai_example.py
```

## Core concepts in Letta:

Letta is built on the [MemGPT](https://arxiv.org/abs/2310.08560) research paper, which introduced the concept of the "LLM Operating System" for memory management:

1. [**Memory Hierarchy**](https://docs.letta.com/guides/agents/memory): Agents have self-editing memory split between in-context and out-of-context memory
2. [**Memory Blocks**](https://docs.letta.com/guides/agents/memory-blocks): In-context memory is composed of persistent editable blocks
3. [**Agentic Context Engineering**](https://docs.letta.com/guides/agents/context-engineering): Agents control their context window using tools to edit, delete, or search memory
4. [**Perpetual Self-Improving Agents**](https://docs.letta.com/guides/agents/overview): Every agent has a perpetual (infinite) message history


## Local Development

Connect to a local Letta server instead of the cloud:

```python
from agentic_learning import AgenticLearning, learning

learning_client = AgenticLearning(base_url="http://localhost:8283")

with learning(agent="my-agent", client=learning_client):
    # Your LLM call - conversation is automatically captured
    response = client.chat.completions.create(...)
```

Run Letta locally with Docker:

```bash
docker run \
  -v ~/.letta/.persist/pgdata:/var/lib/postgresql/data \
  -p 8283:8283 \
  -e OPENAI_API_KEY="your_key" \
  letta/letta:latest
```

See the [self-hosting guide](https://docs.letta.com/guides/selfhosting) for more options.

### Development

```bash
# Install in development mode
pip install -e .

# Build
python -m build

# Run tests
pytest

# Run specific test
pytest tests/test_openai.py
```

## License

Apache-2.0
