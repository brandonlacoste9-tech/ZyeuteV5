"""
Llama 4 Maverick Tool Calling Utilities
Production-ready tool execution and chat loop for Colony OS
"""

import json
import logging
from typing import List, Dict, Any, Callable, Optional

logger = logging.getLogger(__name__)

def execute_tool(tool_name: str, tool_input: dict, tool_executor: Callable) -> str:
    """
    Execute a tool call and return result as JSON string.
    Handles errors gracefully with proper logging.
    
    Args:
        tool_name: Name of the tool to execute
        tool_input: Tool arguments as dictionary
        tool_executor: Function that executes tools (tool_name, args) -> result
    
    Returns:
        JSON string of tool result or error
    """
    if not tool_executor or not callable(tool_executor):
        logger.warning(f"Tool executor not available for {tool_name}")
        return json.dumps({"error": "Tool executor not available"})
    
    try:
        result = tool_executor(tool_name, tool_input)
        
        # Ensure result is JSON-serializable
        if isinstance(result, str):
            try:
                # Validate it's valid JSON
                json.loads(result)
                return result
            except json.JSONDecodeError:
                # Wrap in JSON
                return json.dumps({"result": result})
        
        # Already dict/list - serialize
        return json.dumps(result) if not isinstance(result, (dict, list)) else json.dumps(result)
    
    except Exception as e:
        logger.error(f"Tool execution error for {tool_name}: {e}", exc_info=True)
        return json.dumps({"error": str(e)})


def chat_with_tool_loop(
    prompt: str,
    tools: List[Dict[str, Any]],
    tool_executor: Callable,
    api_url: str,
    model: str,
    tool_choice: str = "auto",
    max_iterations: int = 10,
    temperature: float = 0.7,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Complete chat loop with automatic tool execution.
    Handles multi-turn conversations until model returns final text.
    
    Args:
        prompt: User prompt
        tools: List of tool definitions (OpenAI format)
        tool_executor: Function to execute tools
        api_url: Llama stack API endpoint
        model: Model name
        tool_choice: Tool choice strategy ('auto', 'none', or specific)
        max_iterations: Maximum tool execution iterations
        temperature: Model temperature
        timeout: Request timeout in seconds
    
    Returns:
        Final response with text, tool_calls, usage, and iterations
    """
    import requests
    
    messages = [{"role": "user", "content": prompt}]
    base_payload = {
        "model": model,
        "temperature": temperature
    }
    
    if tools:
        base_payload["tools"] = tools
        base_payload["tool_choice"] = tool_choice
    
    iteration = 0
    all_tool_calls = []
    total_usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    
    while iteration < max_iterations:
        iteration += 1
        logger.debug(f"Tool loop iteration {iteration}")
        
        payload = {**base_payload, "messages": messages}
        
        try:
            response = requests.post(
                api_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=timeout
            )
            response.raise_for_status()
            
            result_data = response.json()
            message = result_data['choices'][0]['message']
            messages.append(message)
            
            # Accumulate usage
            usage = result_data.get('usage', {})
            total_usage["prompt_tokens"] += usage.get("prompt_tokens", 0)
            total_usage["completion_tokens"] += usage.get("completion_tokens", 0)
            total_usage["total_tokens"] += usage.get("total_tokens", 0)
            
            # Check for tool calls
            tool_calls = message.get('tool_calls', [])
            
            if not tool_calls:
                # Final response
                return {
                    "text": message.get('content', ''),
                    "tool_calls": all_tool_calls if all_tool_calls else None,
                    "usage": total_usage,
                    "iterations": iteration
                }
            
            # Execute tools
            all_tool_calls.extend(tool_calls)
            tool_results = []
            
            for tool_call in tool_calls:
                tool_id = tool_call.get('id')
                tool_name = tool_call.get('function', {}).get('name')
                tool_args_str = tool_call.get('function', {}).get('arguments', '{}')
                
                try:
                    tool_args = json.loads(tool_args_str) if isinstance(tool_args_str, str) else tool_args_str
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON in tool arguments: {tool_args_str}")
                    tool_args = {}
                
                tool_result = execute_tool(tool_name, tool_args, tool_executor)
                
                tool_results.append({
                    "tool_call_id": tool_id,
                    "role": "tool",
                    "name": tool_name,
                    "content": tool_result
                })
            
            messages.extend(tool_results)
        
        except requests.exceptions.RequestException as e:
            logger.error(f"API request error: {e}")
            raise
    
    # Max iterations reached
    logger.warning(f"Max iterations ({max_iterations}) reached")
    return {
        "text": messages[-1].get('content', 'Max iterations reached') if messages else '',
        "tool_calls": all_tool_calls,
        "usage": total_usage,
        "iterations": iteration,
        "warning": "Max iterations reached"
    }
