"""
Agentic Learning SDK - Core Context Manager

This module provides a context manager for automatic learning/memory integration
with Letta. It captures conversation turns and saves them to Letta for persistent memory.
"""

from contextvars import ContextVar, Token
from typing import List, Optional


_LEARNING_CONFIG: ContextVar[Optional[dict]] = ContextVar('learning_config', default=None)

# Track whether interceptors have been installed
_INTERCEPTORS_INSTALLED = False


def get_current_config() -> Optional[dict]:
    """Get the current active learning configuration (context-local)."""
    return _LEARNING_CONFIG.get()


def _ensure_interceptors_installed():
    """
    Ensure SDK interceptors are installed (one-time setup).

    This auto-detects available SDKs and installs interceptors for them.
    Only runs once per process.
    """
    global _INTERCEPTORS_INSTALLED

    if _INTERCEPTORS_INSTALLED:
        return

    from .interceptors import install
    install()

    _INTERCEPTORS_INSTALLED = True


# =============================================================================
# Sync implementation
# =============================================================================


class LearningContext:
    """Sync context manager for Letta learning integration."""

    def __init__(self, client: "AgenticLearning", agent: str, capture_only: bool, memory: List[str], model: str):
        """
        Initialize learning context.

        Args:
            client: AgenticLearning client instance (sync)
            agent: Name of the Letta agent to use for memory storage
            capture_only: Whether to skip auto-injecting memory into prompts
                Set to True to capture conversations without memory injection on subsequent turns
            memory: List of Letta memory block labels to configure for the agent
            model: Optional model to use for Letta agent (e.g. "anthropic/claude-sonnet-4-20250514")
        """
        self.agent_name = agent
        self.client = client
        self.capture_only = capture_only
        self.memory = memory
        self.model = model
        self._token: Optional[Token] = None

    def __enter__(self):
        """Enter the learning context."""
        _ensure_interceptors_installed()

        self._token = _LEARNING_CONFIG.set({
            "agent_name": self.agent_name,
            "client": self.client,
            "capture_only": self.capture_only,
            "memory": self.memory,
            "model": self.model,
            "pending_user_message": None  # Buffer for batching messages
        })

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit the learning context."""
        if self._token is not None:
            _LEARNING_CONFIG.reset(self._token)

        return False # Don't suppress exceptions


def learning(
    agent: str = "letta_agent",
    client: Optional["AgenticLearning"] = None,
    capture_only: bool = False,
    memory: List[str] = ["human"],
    model: str = "anthropic/claude-sonnet-4-20250514",
) -> LearningContext:
    """
    Create a sync learning context for automatic Letta integration.

    All SDK interactions within this context will automatically:
    1. Capture user messages and assistant responses
    2. Save conversations to Letta for persistent memory
    3. Inject Letta memory into prompts (if capture_only=False)

    Args:
        agent: Name of the Letta agent to use for memory storage. Defaults to 'letta_agent'.
        client: Optional AgenticLearning client instance (sync). If None, will create default client using LETTA_API_KEY from env.
        capture_only: Whether to capture conversations without automatic Letta memory injection (default: False)
        memory: Optional list of Letta memory blocks to configure for the agent (default: ["human"])
        model: Optional model to use for Letta agent (default: "anthropic/claude-sonnet-4-20250514")

    Returns:
        LearningContext that can be used as a sync context manager

    Example:
        >>> from agentic_learning import learning
        >>>
        >>> # Simplest usage - one line!
        >>> with learning(agent="my_agent"):
        >>>     # Your LLM API calls here
        >>>     pass
        >>>
        >>> # With custom memory blocks
        >>> with learning(agent="sales_bot", memory=["customer", "product"]):
        >>>     # Your LLM API calls here
        >>>     pass
    """
    if client is None:
        from .client import AgenticLearning
        client = AgenticLearning()

    return LearningContext(agent=agent, client=client, capture_only=capture_only, memory=memory, model=model)


# =============================================================================
# Async implementation
# =============================================================================


class AsyncLearningContext:
    """Async context manager for Letta learning integration."""

    def __init__(self, client: "AsyncAgenticLearning", agent: str, capture_only: bool, memory: List[str], model: str):
        """
        Initialize async learning context.

        Args:
            client: AsyncAgenticLearning client instance (async)
            agent: Name of the Letta agent to use for memory storage
            capture_only: Whether to skip auto-injecting memory into prompts
                Set to True to capture conversations without memory injection on subsequent turns
            memory: List of Letta memory block labels to configure for the agent
            model: Optional model to use for Letta agent (e.g. "anthropic/claude-sonnet-4-20250514")
        """
        self.agent_name = agent
        self.client = client
        self.capture_only = capture_only
        self.memory = memory
        self.model = model
        self._token: Optional[Token] = None

    async def __aenter__(self):
        """Enter the learning context."""
        _ensure_interceptors_installed()

        self._token = _LEARNING_CONFIG.set({
            "agent_name": self.agent_name,
            "client": self.client,
            "capture_only": self.capture_only,
            "memory": self.memory,
            "model": self.model,
            "pending_user_message": None  # Buffer for batching messages
        })

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit the learning context."""
        if self._token is not None:
            _LEARNING_CONFIG.reset(self._token)

        return False # Don't suppress exceptions


def learning_async(
    agent: str = "letta_agent",
    client: Optional["AsyncAgenticLearning"] = None,
    capture_only: bool = False,
    memory: List[str] = ["human"],
    model: str = "anthropic/claude-sonnet-4-20250514",
) -> AsyncLearningContext:
    """
    Create an async learning context for automatic Letta integration.

    All SDK interactions within this context will automatically:
    1. Capture user messages and assistant responses
    2. Save conversations to Letta for persistent memory
    3. Inject Letta memory into prompts (if capture_only=False)

    Args:
        agent: Name of the Letta agent to use for memory storage. Defaults to 'letta_agent'.
        client: Optional AsyncAgenticLearning client instance (async). If None, will create default client using LETTA_API_KEY from env.
        capture_only: Whether to capture conversations without automatic Letta memory injection (default: False)
        memory: Optional list of Letta memory blocks to configure for the agent (default: ["human"])
        model: Optional model to use for Letta agent (default: "anthropic/claude-sonnet-4-20250514")

    Returns:
        AsyncLearningContext that can be used as an async context manager

    Example:
        >>> from agentic_learning import learning_async
        >>>
        >>> # Simplest usage - one line!
        >>> async with learning_async(agent="my_agent"):
        >>>     # Your LLM API calls here
        >>>     pass
        >>>
        >>> # With custom memory blocks
        >>> async with learning_async(agent="sales_bot", memory=["customer", "product"]):
        >>>     # Your LLM API calls here
        >>>     pass
    """
    if client is None:
        from .client import AsyncAgenticLearning
        client = AsyncAgenticLearning()

    return AsyncLearningContext(agent=agent, client=client, capture_only=capture_only, memory=memory, model=model)
