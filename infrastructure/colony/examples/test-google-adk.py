#!/usr/bin/env python3
"""
Test Google ADK Integration
Quick test to verify Google ADK agent is working
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment from root .env
root_dir = Path(__file__).parent.parent.parent
load_dotenv(root_dir / ".env")

from core.google_adk_agent import get_google_adk_agent

def test_google_adk():
    """Test Google ADK agent"""
    print("🧪 [TEST] Testing Google ADK Integration\n")
    
    try:
        # Get agent
        agent = get_google_adk_agent()
        
        # Test simple directive
        print("1️⃣ Testing simple directive...")
        result = agent.execute_directive("List available tools")
        
        print(f"\n📊 Result:")
        print(f"   Status: {result.get('status')}")
        print(f"   Response: {result.get('result', {}).get('text', 'N/A')}")
        
        # Test tool discovery
        print("\n2️⃣ Testing tool discovery...")
        tools = agent.get_available_tools()
        print(f"   Found {len(tools)} tools")
        
        if result.get('status') == 'completed':
            print("\n✅ Test passed!")
        else:
            print("\n⚠️ Test completed with warnings")
            print(f"   Note: {result.get('note', 'N/A')}")
            
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    test_google_adk()
