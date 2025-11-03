"""
Agentic Learning SDK - Shared Types

Type definitions used across the SDK.
"""

from typing import Literal


# Provider type - represents supported LLM providers
Provider = Literal["gemini", "claude", "anthropic", "openai"]
