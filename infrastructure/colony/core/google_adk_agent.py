"""
Google ADK Agent Integration for Colony OS
Native Google Agent Development Kit integration
"""

import os
from typing import Dict, Any, Optional

try:
    from google.adk.agents.llm_agent import LlmAgent
    from google.adk.tools.api_registry import ApiRegistry
    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False
    print("⚠️ [GOOGLE ADK] Google ADK not installed. Install with: pip install google-adk")

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "zyeutev5")
MCP_SERVER_NAME = os.environ.get(
    "GOOGLE_ADK_MCP_SERVER",
    f"projects/{PROJECT_ID}/locations/global/mcpServers/google-compute.googleapis.com-mcp"
)


class GoogleAdkColonyAgent:
    """
    Google ADK Agent for Colony OS
    Integrates Google's native agent framework with Colony OS
    """
    
    def __init__(self, project_id: str = None, mcp_server_name: str = None):
        self.project_id = project_id or PROJECT_ID
        self.mcp_server_name = mcp_server_name or MCP_SERVER_NAME
        self.agent = None
        self.api_registry = None
        
        if ADK_AVAILABLE:
            self._initialize()
        else:
            print("⚠️ [GOOGLE ADK] ADK not available, agent will use fallback")
    
    def _initialize(self):
        """Initialize Google ADK agent with MCP tools"""
        try:
            print(f"🤖 [GOOGLE ADK] Initializing agent for project: {self.project_id}")
            
            # Create API registry
            self.api_registry = ApiRegistry(self.project_id)
            
            # Get tools from MCP server
            registry_tools = self.api_registry.get_toolset(
                mcp_server_name=self.mcp_server_name
            )
            
            # Create LLM agent
            self.agent = LlmAgent(
                model="gemini-2.0-flash",
                name="colony_queen_bee",
                instruction=(
                    "You are the Queen Bee of Colony OS, a sovereign digital organism. "
                    "Use the tools you have access to help execute directives autonomously. "
                    "Think step-by-step, execute tools when needed, and adapt based on results."
                ),
                tools=[registry_tools],
            )
            
            print("✅ [GOOGLE ADK] Agent initialized successfully")
        except Exception as e:
            print(f"❌ [GOOGLE ADK] Initialization failed: {e}")
            self.agent = None
    
    def execute_directive(self, prompt: str) -> Dict[str, Any]:
        """
        Execute a directive using Google ADK agent
        
        Args:
            prompt: The directive to execute
            
        Returns:
            Result dictionary with status and response
        """
        if not ADK_AVAILABLE or not self.agent:
            return {
                "status": "failed",
                "error": "Google ADK not available",
                "fallback": "Use Llama 4 Maverick instead"
            }
        
        try:
            print(f"🤖 [GOOGLE ADK] Executing directive: {prompt[:50]}...")
            
            # Execute via ADK agent
            response = self.agent.run(prompt)
            
            return {
                "status": "completed",
                "result": {
                    "text": str(response),
                    "model": "gemini-2.0-flash",
                    "provider": "google-adk"
                }
            }
        except Exception as e:
            print(f"❌ [GOOGLE ADK] Execution failed: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def get_available_tools(self) -> list:
        """Get list of available tools from MCP server"""
        if not self.api_registry:
            return []
        
        try:
            tools = self.api_registry.get_toolset(mcp_server_name=self.mcp_server_name)
            return tools if isinstance(tools, list) else [tools]
        except Exception as e:
            print(f"⚠️ [GOOGLE ADK] Failed to get tools: {e}")
            return []


# Singleton instance
_google_adk_agent: Optional[GoogleAdkColonyAgent] = None


def get_google_adk_agent() -> GoogleAdkColonyAgent:
    """Get or create Google ADK agent instance"""
    global _google_adk_agent
    if _google_adk_agent is None:
        _google_adk_agent = GoogleAdkColonyAgent()
    return _google_adk_agent
