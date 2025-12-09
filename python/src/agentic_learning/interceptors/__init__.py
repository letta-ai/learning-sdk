"""
Agentic Learning Interceptors

Automatic SDK integration for capturing conversations and injecting memory.
"""

from .base import BaseInterceptor, BaseAPIInterceptor
from .gemini import GeminiInterceptor
from .claude import ClaudeInterceptor
from .anthropic import AnthropicInterceptor
from .openai import OpenAIInterceptor
from .pydantic_ai import PydanticAIInterceptor
from .registry import install, register_interceptor, uninstall_all
from ..types import Provider

# Register available interceptors
register_interceptor(GeminiInterceptor)
register_interceptor(ClaudeInterceptor)
register_interceptor(AnthropicInterceptor)
register_interceptor(OpenAIInterceptor)
register_interceptor(PydanticAIInterceptor)

__all__ = [
    "BaseInterceptor",
    "BaseAPIInterceptor",
    "Provider",
    "GeminiInterceptor",
    "ClaudeInterceptor",
    "AnthropicInterceptor",
    "OpenAIInterceptor",
    "PydanticAIInterceptor",
    "install",
    "register_interceptor",
    "uninstall_all",
]
