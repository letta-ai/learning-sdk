"""
Agentic Learning Interceptors

Automatic SDK integration for capturing conversations and injecting memory.
"""

from .base import BaseInterceptor, BaseAPIInterceptor
from .gemini import GeminiInterceptor
from .claude import ClaudeInterceptor
from .anthropic import AnthropicInterceptor
from .openai import OpenAIInterceptor
from .registry import install, register_interceptor, uninstall_all
from ..types import Provider

# Register available interceptors
register_interceptor(GeminiInterceptor)
register_interceptor(ClaudeInterceptor)
register_interceptor(AnthropicInterceptor)
register_interceptor(OpenAIInterceptor)

__all__ = [
    "BaseInterceptor",
    "BaseAPIInterceptor",
    "Provider",
    "GeminiInterceptor",
    "ClaudeInterceptor",
    "AnthropicInterceptor",
    "OpenAIInterceptor",
    "install",
    "register_interceptor",
    "uninstall_all",
]
