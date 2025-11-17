#!/usr/bin/env python3
"""Quick test to verify hooks are being called."""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, HookMatcher

load_dotenv()

async def test_hooks():
    """Test that hooks are actually being called."""

    # Simple hook that just prints
    async def test_pre_hook(hook_input, tool_use_id, context):
        print(f"\n✓ PRE HOOK CALLED: {hook_input['tool_name']}")
        return {'continue_': True}

    async def test_post_hook(hook_input, tool_use_id, context):
        print(f"✓ POST HOOK CALLED")
        return {'continue_': True}

    hooks = {
        'PreToolUse': [HookMatcher(matcher=None, hooks=[test_pre_hook])],
        'PostToolUse': [HookMatcher(matcher=None, hooks=[test_post_hook])]
    }

    options = ClaudeAgentOptions(
        permission_mode="bypassPermissions",
        allowed_tools=["Bash"],
        hooks=hooks,
        model="haiku"
    )

    print("Testing hooks...")
    async with ClaudeSDKClient(options=options) as client:
        await client.query(prompt="Run 'echo test hooks'")
        async for msg in client.receive_response():
            if type(msg).__name__ == 'AssistantMessage':
                for block in msg.content:
                    if type(block).__name__ == 'TextBlock':
                        print(f"Response: {block.text[:100]}")

if __name__ == "__main__":
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\nError: ANTHROPIC_API_KEY not found.")
        print("Set it in a .env file or export it in your shell.\n")
    else:
        asyncio.run(test_hooks())
