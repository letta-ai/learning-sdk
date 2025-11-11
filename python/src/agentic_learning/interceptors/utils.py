"""
Interceptor Utilities

Shared utilities for SDK interceptors.
"""

from typing import AsyncGenerator, Dict, Generator, List

from ..types import Provider
from ..core import get_current_config


def wrap_streaming_generator(stream: Generator, callback):
    """
    Wrap a streaming generator to collect chunks and call callback when done.

    Args:
        stream: Original generator
        callback: Function to call with collected content when stream completes

    Yields:
        Each chunk from the original stream
    """
    collected = []
    try:
        for chunk in stream:
            collected.append(chunk)
            yield chunk
    finally:
        # After stream completes (or errors), call callback with collected content
        if collected:
            callback(collected)


async def wrap_streaming_generator_async(stream: AsyncGenerator, callback):
    """
    Wrap an async streaming generator to collect chunks and call callback when done.

    Args:
        stream: Original async generator
        callback: Function to call with collected content when stream completes

    Yields:
        Each chunk from the original stream
    """
    collected = []
    try:
        async for chunk in stream:
            collected.append(chunk)
            yield chunk
    finally:
        # After stream completes (or errors), call callback with collected content
        if collected:
            await callback(collected)


def _save_conversation_turn(
    provider: Provider,
    model: str,
    request_messages: List[dict] = None,
    response_dict: Dict[str, str] = None,
):
    """
    Save a conversation turn to Letta in a single API call.

    Args:
        provider: Provider of the messages (e.g. "gemini", "claude", "anthropic", "openai")
        model: Model name
        request_messages: List of request messages
        response_dict: Response from provider
    """
    config = get_current_config()
    if not config:
        return

    agent = config["agent_name"]
    client = config["client"]

    if not client:
        return

    try:
        # Get or create agent using simplified API
        agent_state = client.agents.retrieve(agent=agent)

        if not agent_state:
            agent_state = client.agents.create(
                agent=agent,
                memory=config["memory"],
                model=config["model"],
            )

        return client.messages.capture(
            agent=agent,
            request_messages=request_messages or [],
            response_dict=response_dict or {},
            model=model,
            provider=provider,
        )

    except Exception as e:
        import sys
        print(f"[Warning] Failed to save conversation turn: {e}", file=sys.stderr)


async def _save_conversation_turn_async(
    provider: Provider,
    model: str,
    request_messages: List[dict] = None,
    response_dict: Dict[str, str] = None,
):
    """
    Save a conversation turn to Letta in a single API call (async version).

    Args:
        provider: Provider of the messages (e.g. "gemini", "claude", "anthropic", "openai")
        model: Model name
        request_messages: List of request messages
        response_dict: Response from provider
    """
    config = get_current_config()
    if not config:
        return

    agent = config["agent_name"]
    client = config["client"]

    if not client:
        return

    try:
        # Check if client is async or sync
        import inspect
        is_async_client = inspect.iscoroutinefunction(client.agents.retrieve)

        if is_async_client:
            # Get or create agent using async API
            agent_state = await client.agents.retrieve(agent=agent)

            if not agent_state:
                agent_state = await client.agents.create(
                    agent=agent,
                    memory=config["memory"],
                    model=config["model"],
                )

            return await client.messages.capture(
                agent=agent,
                request_messages=request_messages or [],
                response_dict=response_dict or {},
                model=model,
                provider=provider,
            )
        else:
            # Use sync client (common when using sync client with async context)
            agent_state = client.agents.retrieve(agent=agent)

            if not agent_state:
                agent_state = client.agents.create(
                    agent=agent,
                    memory=config["memory"],
                    model=config["model"],
                )

            return client.messages.capture(
                agent=agent,
                request_messages=request_messages or [],
                response_dict=response_dict or {},
                model=model,
                provider=provider,
            )

    except Exception as e:
        import sys
        print(f"[Warning] Failed to save conversation turn: {e}", file=sys.stderr)
