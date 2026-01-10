"""Colony utility modules."""

# Tool calling utilities for Llama 4 Maverick
try:
    from .llama_tools import execute_tool, chat_with_tool_loop
    __all__ = ['execute_tool', 'chat_with_tool_loop']
except ImportError:
    # Tools module not available
    __all__ = []