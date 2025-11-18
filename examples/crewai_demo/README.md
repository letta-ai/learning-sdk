# CrewAI Research Demo with Agentic Learning SDK

This demo shows how to add persistent memory to CrewAI agents using the Agentic Learning SDK. The crew consists of a researcher and writer that collaborate on research tasks, with their conversations and learnings persisted across sessions.

## What This Demo Shows

- **3-Line Integration**: Add memory to CrewAI with just a context manager
- **Multi-Agent Memory**: The entire crew's interactions are captured
- **Cross-Session Persistence**: Memory survives script restarts
- **Seamless Integration**: No changes needed to CrewAI agent definitions

## Setup

### 1. Install Dependencies

```bash
pip install agentic-learning crewai crewai-tools openai
```

### 2. Set API Keys

```bash
export OPENAI_API_KEY="your-openai-api-key"
export LETTA_API_KEY="your-letta-api-key"  # Get from https://app.letta.com
export SERPER_API_KEY="your-serper-api-key"  # Optional, for web search
```

### 3. Run the Demo

```bash
python3 crewai_research_demo.py
```

## How It Works

The integration is just 3 lines:

```python
from agentic_learning import learning

# Wrap your crew execution
with learning(agent="crewai-research-demo"):
    result = crew.kickoff()
```

That's it! The SDK automatically:
- Captures all agent conversations
- Stores research findings
- Makes memory available across sessions
- Enables the crew to learn from past interactions

## Demo Flow

1. **First Research Task**: The crew researches "AI agents"
   - Researcher gathers information
   - Writer creates an article
   - All interactions are captured in memory

2. **Second Research Task**: The crew researches "machine learning"
   - Crew can reference previous research
   - Memory persists throughout execution

3. **Cross-Session Memory**: Run the script again
   - Previous research is still accessible
   - The crew builds on past knowledge

## Architecture

```
┌─────────────────────────────────────┐
│  CrewAI Research Crew               │
│  ┌───────────┐    ┌──────────┐     │
│  │Researcher │ -> │  Writer  │     │
│  └───────────┘    └──────────┘     │
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
4. **Multi-Agent Support**: Works with any number of agents
5. **Search & Recall**: Query past interactions

## Next Steps

- Try modifying the research topics
- Add more agents to the crew
- Implement custom tools
- Query the memory using the SDK's search functionality

## Learn More

- [Agentic Learning SDK Docs](https://github.com/letta-ai/agentic-learning-sdk)
- [CrewAI Documentation](https://docs.crewai.com)
- [Integration Patterns](../../.skills/ai/agents/agentic-learning-sdk-integration/)
