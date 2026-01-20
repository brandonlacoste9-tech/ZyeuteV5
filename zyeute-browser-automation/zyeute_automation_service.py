"""
🐝 Zyeuté Browser Automation Service - The Hands
AI-powered Quebec content discovery with cultural intelligence
Uses DeepSeek V3 or Gemini 2.0 Flash for cost-effectiveness
"""

import os
import json
import asyncio
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from loguru import logger
from browser_use import Agent, Browser, Controller

load_dotenv()

# Initialize LLM (DeepSeek V3 or Gemini)
AI_MODEL = os.getenv("AI_MODEL", "deepseek-chat")

if AI_MODEL.startswith("deepseek"):
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model=AI_MODEL,
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com",
        temperature=0.0,
    )
elif AI_MODEL.startswith("gemini"):
    from langchain_google_genai import ChatGoogleGenerativeAI

    llm = ChatGoogleGenerativeAI(
        model=AI_MODEL, google_api_key=os.getenv("GOOGLE_API_KEY"), temperature=0.0
    )
else:
    # Fallback to Browser-Use default
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(model="gpt-4o")


# Monkeypatch for browser-use compatibility (Run for ALL models)
try:
    # Relax Pydantic validation (v2/v1) for browser-use to set internal attributes
    if hasattr(llm, "model_config"):
        llm.model_config["extra"] = "allow"
    elif hasattr(llm, "__config__"):
        llm.__config__.extra = "allow"

    if not hasattr(llm, "provider"):
        object.__setattr__(llm, "provider", "openai")

    if not hasattr(llm, "model_name"):
        object.__setattr__(llm, "model_name", AI_MODEL)

    if not hasattr(llm, "model"):
        object.__setattr__(llm, "model", AI_MODEL)
except Exception as e:
    logger.warning(f"⚠️ Failed to patch LLM object: {e}")

logger.info(f"🤖 LLM initialized: {AI_MODEL}")

# ============================================================================
# CULTURAL CONTEXT
# ============================================================================

QUEBEC_CONTEXT_PATH = os.getenv("QUEBEC_CONTEXT_PATH", "./quebec-context.json")
try:
    with open(QUEBEC_CONTEXT_PATH, "r", encoding="utf-8") as f:
        QUEBEC_CONTEXT = json.load(f)
except Exception as e:
    logger.warning(f"⚠️ Could not load Quebec context: {e}")
    QUEBEC_CONTEXT = {"markers": [], "regions": {}}

# ============================================================================
# SERVICE CLASS
# ============================================================================


class ZyeuteBrowserService:
    def __init__(self):
        self.browser = Browser()
        self.controller = Controller()
        self._setup_controller()

    def _setup_controller(self):
        """Setup custom browser actions for Zyeuté"""

        @self.controller.action("Extract cultural markers")
        def extract_markers(text: str) -> Dict[str, Any]:
            """Extract Quebec cultural markers from text"""
            markers = []
            score = 0.0
            text_lower = text.lower()

            # Simple keyword matching based on loaded context
            for marker in QUEBEC_CONTEXT.get("markers", []):
                if marker in text_lower:
                    markers.append(marker)
                    score += 0.05

            # Boosters for specific regions
            for region, data in QUEBEC_CONTEXT.get("regions", {}).items():
                for keyword in data.get("keywords", []):
                    if keyword in text_lower:
                        markers.append(f"{region}:{keyword}")
                        score += 0.1

            return {"markers": markers, "cultural_score": min(1.0, score)}

    async def discover_quebec_trends(
        self, platform: str = "google", region: str = "montreal"
    ) -> Dict[str, Any]:
        """Discover trending content in Quebec"""
        logger.info(f"🔍 Discovering trends on {platform} for {region}")

        search_query = f"trending in {region} Quebec today"
        if platform == "tiktok":
            search_query = f"tiktok trends {region} quebec"

        task = f"""
        1. Go to {platform}.com
        2. Search for "{search_query}"
        3. Identify top 3 trending topics or videos.
        4. For each trend, extract:
            - Title
            - Description/Context
            - Engagement metrics (if visible)
            - Presence of French/Joual language
        5. Return a JSON list of trends.
        """

        agent = Agent(
            task=task, llm=llm, browser=self.browser, controller=self.controller
        )

        try:
            history = await agent.run()
            result = history.final_result()

            # Attempt to parse JSON from result
            try:
                # This assumes the LLM returns a string that contains JSON
                # In a real scenario, we might need robust parsing or structured output
                import re

                json_match = re.search(r"\[.*\]", result, re.DOTALL)
                if json_match:
                    trends = json.loads(json_match.group(0))
                else:
                    trends = [
                        {
                            "title": "Raw Result",
                            "description": result,
                            "cultural_score": 0.0,
                        }
                    ]
            except:
                trends = [
                    {
                        "title": "Parse Error",
                        "description": result,
                        "cultural_score": 0.0,
                    }
                ]

            # Post-process scores
            for trend in trends:
                if "cultural_score" not in trend:
                    trend["cultural_score"] = self.calculate_cultural_score(
                        trend.get("description", "") + " " + trend.get("title", "")
                    )

            return {
                "success": True,
                "platform": platform,
                "region": region,
                "trends": trends,
            }

        except Exception as e:
            logger.error(f"❌ Trend discovery failed: {e}")
            return {"success": False, "error": str(e)}

    async def analyze_competitor(
        self, url: str, metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Analyze a competitor's page for Quebec compliance"""
        logger.info(f"📊 Analyzing competitor: {url}")

        task = f"""
        1. Go to {url}
        2. Analyze the main content.
        3. Extract the following metrics: {'all available' if not metrics else ', '.join(metrics)}.
        4. Specifically look for:
            - Use of French vs English
            - Quebec cultural references (poutine, hockey, local cities)
            - Engagement from Quebec users (if visible)
        5. Return a JSON summary.
        """

        agent = Agent(task=task, llm=llm, browser=self.browser)

        try:
            history = await agent.run()
            result = history.final_result()
            return {"success": True, "url": url, "analysis": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def calculate_cultural_score(self, text: str) -> float:
        """Calculate a 0.0-1.0 score for Quebec cultural authenticity"""
        text_lower = text.lower()
        score = 0.0

        # Base language check (simple heuristic)
        common_french_words = [
            "le",
            "la",
            "les",
            "quebec",
            "montreal",
            "bonjour",
            "salut",
            "merci",
        ]
        if any(w in text_lower for w in common_french_words):
            score += 0.3

        # Cultural markers
        markers = QUEBEC_CONTEXT.get("markers", [])
        for marker in markers:
            if marker in text_lower:
                score += 0.1

        # Joual indicators
        joual = ["tsé", "genre", "faque", "pis", "chum", "blonde"]
        if any(w in text_lower for w in joual):
            score += 0.2

        return min(1.0, max(0.0, score))


# Instantiate singleton
browser_service = ZyeuteBrowserService()

if __name__ == "__main__":
    # Simple test
    async def main():
        result = await browser_service.discover_quebec_trends()
        print(json.dumps(result, indent=2))

    asyncio.run(main())
