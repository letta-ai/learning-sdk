"""
Agentic Learning Client

High-level client interfaces for interacting with Letta agents.
"""

import os
from typing import Optional

from .agents import AgentsClient, AsyncAgentsClient
from .memory import MemoryClient, AsyncMemoryClient
from .messages import MessagesClient, AsyncMessagesClient


# =============================================================================
# Sync Client
# =============================================================================


class AgenticLearning:
    """
    Synchronous client for Agentic Learning SDK.

    Provides simplified APIs for managing Letta agents with name-based lookups.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize the Agentic Learning client.

        Args:
            base_url: Letta server base URL. Defaults to LETTA_BASE_URL env var or None.
            api_key: Optional authentication api_key for Letta server. Defaults to LETTA_API_KEY env var or None.
        """
        from letta_client import Letta

        self.base_url = base_url or os.getenv("LETTA_BASE_URL", None)
        self.api_key = api_key or os.getenv("LETTA_API_KEY", None)
        self._letta = Letta(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "X-Letta-Source": "learning-sdk-python",
            },
        )

        self.agents = AgentsClient(self, self._letta)
        self.memory = MemoryClient(self, self._letta)
        self.messages = MessagesClient(self, self._letta)

    @property
    def letta(self):
        """Access the underlying Letta client for advanced operations."""
        return self._letta


# =============================================================================
# Async Client
# =============================================================================


class AsyncAgenticLearning:
    """
    Asynchronous client for Agentic Learning SDK.

    Provides simplified async APIs for managing Letta agents with name-based lookups.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize the Async Agentic Learning client.

        Args:
            base_url: Letta server base URL. Defaults to LETTA_BASE_URL env var or None.
            toapi_keyken: Optional authentication api_key for Letta server. Defaults to LETTA_API_KEY env var or None.
        """
        from letta_client import AsyncLetta

        self.base_url = base_url or os.getenv("LETTA_BASE_URL", None)
        self.api_key = api_key or os.getenv("LETTA_API_KEY", None)
        self._letta = AsyncLetta(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "X-Letta-Source": "learning-sdk-python",
            },
        )

        self.agents = AsyncAgentsClient(self, self._letta)
        self.memory = AsyncMemoryClient(self, self._letta)
        self.messages = AsyncMessagesClient(self, self._letta)

    @property
    def letta(self):
        """Access the underlying AsyncLetta client for advanced operations."""
        return self._letta


__all__ = ["AgenticLearning", "AsyncAgenticLearning"]
