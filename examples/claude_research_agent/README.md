# Multi-Agent Research System with Agentic Learning

A multi-agent research system that coordinates specialized subagents to research any topic and generate comprehensive reports. Enhanced with **Agentic Learning SDK** for persistent memory across research sessions.

## What's Different with Agentic Learning

This enhanced version adds persistent memory to the multi-agent research system:

- ✅ **Remembers past research** - recalls topics and findings from previous sessions
- ✅ **Learns research patterns** - adapts to your research style and preferences
- ✅ **Contextual continuity** - can reference and build upon earlier research
- ✅ **Multi-agent memory** - tracks interactions across lead agent and all subagents
- ✅ **Automatic capture** - no changes needed to your agent coordination logic

## Quick Start

```bash
# Install dependencies
uv sync

# Set your API keys
export ANTHROPIC_API_KEY="your-api-key"
export LETTA_API_KEY="your-letta-api-key"

# Run the agent
uv run research_agent/agent.py
```

Then ask: "Research quantum computing developments in 2025"

## How It Works

1. **Lead agent** breaks your request into 2-4 subtopics
2. Spawns **researcher subagents in parallel** to search the web
3. Each researcher saves findings to `files/research_notes/`
4. Spawns **report-writer** to create final report in `files/reports/`

## Example Queries

- "Research quantum computing developments"
- "What are current trends in renewable energy?"
- "Research the Detroit Lions 2025 season"

## Agents

**Lead Agent** - Coordinates everything, only uses `Task` tool
**Researcher Agents** - Use `WebSearch` and `Write` to gather information
**Report-Writer Agent** - Uses `Read`, `Glob`, `Write` to synthesize findings

## Subagent Tracking with Hooks

The system includes comprehensive tracking of all tool calls using **SDK hooks**. Every time any agent uses a tool, it's automatically logged.

### What Gets Tracked

- **Who**: Which agent (RESEARCHER-1, RESEARCHER-2, etc.)
- **What**: Tool name (WebSearch, Write, Read, etc.)
- **When**: Timestamp of call
- **Input**: Parameters passed to the tool
- **Output**: Success/failure and result size

### How It Works

**Hooks** intercept every tool call before and after execution:

```python
hooks = {
    'PreToolUse': [HookMatcher(hooks=[tracker.pre_tool_use_hook])],
    'PostToolUse': [HookMatcher(hooks=[tracker.post_tool_use_hook])]
}
```

**parent_tool_use_id** links tool calls to their subagent:
- When lead agent spawns a researcher via `Task` tool → gets ID "task_123"
- All messages from that researcher include `parent_tool_use_id = "task_123"`
- Hooks use this ID to look up which subagent made the call

### Output Logs

Each session creates timestamped logs in `logs/session_YYYYMMDD_HHMMSS/`:

**transcript.txt** - Human-readable conversation with tool details:
```
[RESEARCHER-1] → WebSearch
    Input: query='quantum computing 2025'
[RESEARCHER-1] → Write
    Input: file='quantum_hardware.md' (1234 chars)
```

**tool_calls.jsonl** - Structured JSON for analysis:
```json
{"event":"tool_call_start","agent_id":"RESEARCHER-1","tool_name":"WebSearch",...}
{"event":"tool_call_complete","success":true,"output_size":15234}
```

### Key Files

- `agent.py` - Main entry point, registers hooks, learning integration
- `utils/subagent_tracker.py` - Hook implementation
- `utils/message_handler.py` - Extracts parent_tool_use_id
- `prompts/` - Agent instructions

## Agentic Learning Integration

The research system gains persistent memory with minimal code changes:

### In `research_agent/agent.py`:

```python
from agentic_learning import learning

async def chat():
    # ... setup code ...

    # Wrap the agent interaction in learning context
    async with learning(agent="claude-research-agent-demo"):
        async with ClaudeSDKClient(options=options) as client:
            while True:
                user_input = input("\nYou: ").strip()
                await client.query(prompt=user_input)

                async for msg in client.receive_response():
                    # Process messages
                    pass
```

**What This Does:**

1. **Automatic Capture**: All conversations with the lead agent and subagents are captured
2. **Memory Persistence**: Research topics, findings, and patterns are stored across sessions
3. **Context Injection**: Relevant past research is automatically included in new queries
4. **Multi-Agent Tracking**: Maintains memory across the entire agent hierarchy

### Benefits for Multi-Agent Research

- **Research continuity**: Reference previous research sessions and build upon them
- **Pattern learning**: System learns your research preferences and terminology
- **Contextual awareness**: Can compare and contrast findings from different sessions
- **Subagent coordination**: Memory persists across all researcher and report-writer agents

## Resources

### Claude Agent SDK
- [Claude Agent SDK Documentation](https://docs.anthropic.com/en/api/agent-sdk/overview)
- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-python)
- [Get Anthropic API Key](https://console.anthropic.com)

### Agentic Learning SDK
- [Agentic Learning Documentation](https://github.com/letta-ai/agentic-learning-sdk)
- [Get Letta API Key](https://www.letta.com/)
- [More Examples](https://github.com/letta-ai/agentic-learning-sdk/tree/main/examples)

---

Built to demonstrate the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-python) with [Agentic Learning](https://github.com/letta-ai/agentic-learning-sdk) integration

