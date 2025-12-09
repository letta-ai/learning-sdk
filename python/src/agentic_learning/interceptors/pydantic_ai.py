"""
pydantic-ai interceptor

interceptor for pydantic-ai agent runs.
"""

import functools
import inspect
import sys
from typing import Any

from .base import BaseInterceptor
from .utils import _save_conversation_turn, _save_conversation_turn_async
from ..core import get_current_config


class PydanticAIInterceptor(BaseInterceptor):
    """
    interceptor for pydantic-ai.

    intercepts Agent.run() and Agent.run_sync() to capture conversations.
    """

    PROVIDER = "pydantic-ai"

    @classmethod
    def is_available(cls) -> bool:
        """check if pydantic-ai is installed."""
        try:
            import pydantic_ai
            return True
        except ImportError:
            return False

    def install(self):
        """install interceptor by patching Agent.run and Agent.run_sync."""
        try:
            from pydantic_ai.agent import Agent
        except ImportError:
            return

        # store original methods
        self._original_methods["run"] = Agent.run
        self._original_methods["run_sync"] = Agent.run_sync

        # patch with wrapped versions
        Agent.run = self._wrap_run(self._original_methods["run"])
        Agent.run_sync = self._wrap_run_sync(self._original_methods["run_sync"])

    def uninstall(self):
        """uninstall interceptor and restore original methods."""
        try:
            from pydantic_ai.agent import Agent
        except ImportError:
            return

        if "run" in self._original_methods:
            Agent.run = self._original_methods["run"]
        if "run_sync" in self._original_methods:
            Agent.run_sync = self._original_methods["run_sync"]

    def build_request_messages(self, user_message: str) -> list:
        """build request messages array for letta."""
        return [{"role": "user", "content": user_message}]

    def build_response_dict(self, response: Any) -> dict:
        """build response dict for letta from pydantic-ai result."""
        content = str(response) if response is not None else ""
        return {"role": "assistant", "content": content}

    def _extract_user_prompt(self, args, kwargs) -> str:
        """extract user prompt from run arguments."""
        if args:
            return str(args[0])
        return str(kwargs.get("user_prompt", ""))

    def _get_model_name(self, agent) -> str:
        """extract model name from agent."""
        if hasattr(agent, "model"):
            model = agent.model
            if hasattr(model, "model_name"):
                return model.model_name
            elif hasattr(model, "name"):
                return model.name
            return str(model)
        return "unknown"

    def _inject_memory(self, kwargs: dict, memory_context: str) -> dict:
        """inject memory context into kwargs via message_history."""
        from pydantic_ai.messages import ModelRequest, SystemPromptPart

        memory_msg = ModelRequest(
            parts=[SystemPromptPart(content=f"[Memory Context]\n{memory_context}")]
        )
        existing_history = list(kwargs.get("message_history") or [])
        kwargs["message_history"] = [memory_msg] + existing_history
        return kwargs

    def _wrap_run(self, original_method):
        """wrap async run method."""
        interceptor = self

        @functools.wraps(original_method)
        async def wrapper(self_arg, *args, **kwargs):
            config = get_current_config()
            if not config:
                return await original_method(self_arg, *args, **kwargs)

            user_message = interceptor._extract_user_prompt(args, kwargs)

            if not config.get("capture_only", False):
                client = config.get("client")
                agent_name = config.get("agent_name")

                if client and agent_name:
                    try:
                        result = client.memory.context.retrieve(agent=agent_name)
                        if inspect.iscoroutine(result):
                            memory_context = await result
                        else:
                            memory_context = result

                        if memory_context:
                            kwargs = interceptor._inject_memory(kwargs, memory_context)
                    except Exception as e:
                        print(f"[warning] memory injection failed: {e}", file=sys.stderr)

            result = await original_method(self_arg, *args, **kwargs)

            model_name = interceptor._get_model_name(self_arg)
            output = result.output if hasattr(result, "output") else result

            try:
                await _save_conversation_turn_async(
                    provider=interceptor.PROVIDER,
                    model=model_name,
                    request_messages=interceptor.build_request_messages(user_message),
                    response_dict=interceptor.build_response_dict(output),
                )
            except Exception as e:
                print(f"[warning] failed to save conversation: {e}", file=sys.stderr)

            return result

        return wrapper

    def _wrap_run_sync(self, original_method):
        """wrap sync run method."""
        interceptor = self

        @functools.wraps(original_method)
        def wrapper(self_arg, *args, **kwargs):
            config = get_current_config()
            if not config:
                return original_method(self_arg, *args, **kwargs)

            user_message = interceptor._extract_user_prompt(args, kwargs)

            if not config.get("capture_only", False):
                client = config.get("client")
                agent_name = config.get("agent_name")

                if client and agent_name:
                    try:
                        memory_context = client.memory.context.retrieve(agent=agent_name)
                        if memory_context:
                            kwargs = interceptor._inject_memory(kwargs, memory_context)
                    except Exception as e:
                        print(f"[warning] memory injection failed: {e}", file=sys.stderr)

            result = original_method(self_arg, *args, **kwargs)

            model_name = interceptor._get_model_name(self_arg)
            output = result.output if hasattr(result, "output") else result

            try:
                _save_conversation_turn(
                    provider=interceptor.PROVIDER,
                    model=model_name,
                    request_messages=interceptor.build_request_messages(user_message),
                    response_dict=interceptor.build_response_dict(output),
                )
            except Exception as e:
                print(f"[warning] failed to save conversation: {e}", file=sys.stderr)

            return result

        return wrapper
