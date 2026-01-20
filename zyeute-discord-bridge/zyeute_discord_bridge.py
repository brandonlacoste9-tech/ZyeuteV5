#!/usr/bin/env python3
"""
🏴 ZYEUTÉ DISCORD CULTURAL BRIDGE 🏴
Quebec Digital Sovereignty Discord Intelligence System

Inspired by Gravilo but designed for Quebec cultural preservation:
- Monitors Quebec Discord communities
- Discovers authentic joual content
- Identifies Quebec creators and cultural events
- Bridges Discord → Zyeuté for cultural repatriation
- Respects privacy while preserving culture

Usage:
    python zyeute_discord_bridge.py

Environment Variables:
    DISCORD_TOKEN - Discord bot token
    ZYEUTE_WEBHOOK_URL - Zyeuté cultural content ingestion webhook
    ZYEUTE_API_SECRET - Authentication for Zyeuté API
    CULTURAL_ANALYSIS_URL - Ti-Guy cultural analysis endpoint

Requirements:
    - Bot must be in Quebec-focused Discord servers
    - Read message history permissions
    - Respect Quebec privacy laws (Bill 64)
"""

import os
import sys
import json
import logging
import asyncio
import discord
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from dataclasses import dataclass

# ==========================================
# 🔧 CONFIGURATION
# ==========================================

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
ZYEUTE_WEBHOOK_URL = os.getenv("ZYEUTE_WEBHOOK_URL")
ZYEUTE_API_SECRET = os.getenv("ZYEUTE_API_SECRET")
CULTURAL_ANALYSIS_URL = os.getenv(
    "CULTURAL_ANALYSIS_URL", "http://localhost:3001/api/trinity/tiguy"
)

DAYS_TO_INDEX = int(os.getenv("DAYS_TO_INDEX", "7"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "25"))
CULTURAL_THRESHOLD = float(os.getenv("CULTURAL_THRESHOLD", "0.7"))

QUEBEC_KEYWORDS = {
    "joual_terms": [
        "icitte",
        "à matin",
        "tantôt",
        "pantoute",
        "ben",
        "ostie",
        "tabarnak",
        "câlisse",
        "crisse",
        "esti",
        "toé",
        "moé",
        "pis",
        "pi",
        "ça",
    ],
    "quebec_places": [
        "montréal",
        "montreal",
        "québec",
        "quebec city",
        "gatineau",
        "sherbrooke",
        "trois-rivières",
        "saguenay",
        "rimouski",
        "rouyn-noranda",
        "chicoutimi",
    ],
    "cultural_terms": [
        "poutine",
        "cabane à sucre",
        "sugar shack",
        "festival",
        "carnaval",
        "saint-jean",
        "fête nationale",
        "quebecois",
        "québécois",
        "belle province",
        "chez nous",
        "nos affaires",
        "notre gang",
    ],
    "exclusion_terms": [
        "toronto",
        "vancouver",
        "calgary",
        "ottawa politics",
        "ontario",
        "english only",
        "speak english",
        "anti-quebec",
        "separatist hate",
    ],
}

# ==========================================
# 🎭 DATA CLASSES
# ==========================================


@dataclass
class CulturalAnalysis:
    quebec_score: float
    joual_detected: bool
    cultural_tags: List[str]
    regional_context: Optional[str]
    creator_potential: float
    content_type: str
    authenticity_score: float
    reason: str


@dataclass
class DiscordMessage:
    content: str
    author: str
    author_id: str
    channel: str
    channel_id: str
    server_id: str
    server_name: str
    timestamp: datetime
    url: str
    cultural_analysis: Optional[CulturalAnalysis] = None


# ==========================================
# 🤖 DISCORD CLIENT SETUP
# ==========================================

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.guild_messages = True
intents.members = False

client = discord.Client(intents=intents)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("zyeute_bridge")

# ==========================================
# 🧠 CULTURAL ANALYSIS ENGINE
# ==========================================


class QuebecCulturalAnalyzer:
    def __init__(self):
        self.analysis_cache: Dict[str, CulturalAnalysis] = {}

    async def analyze_message_batch(
        self, messages: List[DiscordMessage]
    ) -> List[DiscordMessage]:
        if not CULTURAL_ANALYSIS_URL:
            logger.warning("Cultural analysis disabled - CULTURAL_ANALYSIS_URL not set")
            return messages

        batch_texts = [msg.content for msg in messages]

        try:
            payload = {
                "action": "cultural-analysis",
                "payload": {
                    "messages": batch_texts,
                    "analysis_type": "quebec_cultural_relevance",
                },
                "context": {"culturalContext": "quebec", "source": "discord_bridge"},
            }

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ZYEUTE_API_SECRET}",
            }

            response = requests.post(
                CULTURAL_ANALYSIS_URL, json=payload, headers=headers, timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                analyses = result.get("data", {}).get("analyses", [])
                for i, analysis_data in enumerate(analyses):
                    if i < len(messages):
                        messages[i].cultural_analysis = self._parse_analysis(
                            analysis_data
                        )
            else:
                logger.warning(f"Cultural analysis failed: {response.status_code}")
                for msg in messages:
                    msg.cultural_analysis = self._keyword_analysis(msg.content)

        except Exception as e:
            logger.error(f"Cultural analysis error: {e}")
            for msg in messages:
                msg.cultural_analysis = self._keyword_analysis(msg.content)

        return messages

    def _parse_analysis(self, analysis_data: dict) -> CulturalAnalysis:
        return CulturalAnalysis(**analysis_data)

    def _keyword_analysis(self, content: str) -> CulturalAnalysis:
        content_lower = content.lower()

        joual_score = sum(
            1 for term in QUEBEC_KEYWORDS["joual_terms"] if term in content_lower
        ) / len(QUEBEC_KEYWORDS["joual_terms"])
        place_score = sum(
            1 for place in QUEBEC_KEYWORDS["quebec_places"] if place in content_lower
        ) / len(QUEBEC_KEYWORDS["quebec_places"])
        cultural_score = sum(
            1 for term in QUEBEC_KEYWORDS["cultural_terms"] if term in content_lower
        ) / len(QUEBEC_KEYWORDS["cultural_terms"])
        exclusion_penalty = (
            sum(
                1
                for term in QUEBEC_KEYWORDS["exclusion_terms"]
                if term in content_lower
            )
            * 0.3
        )

        quebec_score = max(
            0,
            (joual_score * 0.4 + place_score * 0.3 + cultural_score * 0.3)
            - exclusion_penalty,
        )

        content_type = "general"
        if any(
            term in content_lower for term in ["festival", "événement", "spectacle"]
        ):
            content_type = "event"
        elif joual_score > 0.3:
            content_type = "cultural"
        elif quebec_score > 0.6:
            content_type = "creator"

        return CulturalAnalysis(
            quebec_score=quebec_score,
            joual_detected=joual_score > 0.2,
            cultural_tags=["keyword_analysis"],
            regional_context=None,
            creator_potential=quebec_score * 0.8,
            content_type=content_type,
            authenticity_score=quebec_score,
            reason="Keyword-based cultural analysis",
        )


# ==========================================
# 🌉 ZYEUTÉ BRIDGE FUNCTIONS
# ==========================================


class ZyeuteBridge:
    def __init__(self):
        self.analyzer = QuebecCulturalAnalyzer()
        self.processed_messages: Set[str] = set()

    async def process_discord_channel(self, channel: discord.TextChannel) -> int:
        if not channel.permissions_for(channel.guild.me).read_message_history:
            logger.warning(f"No read permissions for #{channel.name}")
            return 0

        logger.info(f"🔍 Analyzing channel: #{channel.name} in {channel.guild.name}")

        cutoff_date = datetime.utcnow() - timedelta(days=DAYS_TO_INDEX)
        messages_batch: List[DiscordMessage] = []
        cultural_content_found = 0

        try:
            async for message in channel.history(limit=None, after=cutoff_date):
                if message.author.bot or not message.content.strip():
                    continue

                message_key = f"{message.id}"
                if message_key in self.processed_messages:
                    continue

                discord_msg = DiscordMessage(
                    content=message.content,
                    author=message.author.name,
                    author_id=str(message.author.id),
                    channel=channel.name,
                    channel_id=str(channel.id),
                    server_id=str(message.guild.id),
                    server_name=message.guild.name,
                    timestamp=message.created_at,
                    url=f"https://discord.com/channels/{message.guild.id}/{channel.id}/{message.id}",
                )

                messages_batch.append(discord_msg)
                self.processed_messages.add(message_key)

                if len(messages_batch) >= BATCH_SIZE:
                    cultural_content_found += await self._process_message_batch(
                        messages_batch
                    )
                    messages_batch = []

            if messages_batch:
                cultural_content_found += await self._process_message_batch(
                    messages_batch
                )

        except Exception as e:
            logger.error(f"Error processing #{channel.name}: {e}")

        logger.info(
            f"✅ Found {cultural_content_found} Quebec cultural messages in #{channel.name}"
        )
        return cultural_content_found

    async def _process_message_batch(self, messages: List[DiscordMessage]) -> int:
        analyzed_messages = await self.analyzer.analyze_message_batch(messages)

        cultural_messages = [
            msg
            for msg in analyzed_messages
            if msg.cultural_analysis
            and msg.cultural_analysis.quebec_score >= CULTURAL_THRESHOLD
        ]

        if not cultural_messages:
            return 0

        await self._send_to_zyeute(cultural_messages)

        for msg in cultural_messages:
            analysis = msg.cultural_analysis
            logger.info(
                f"🏴 Quebec content found! Score: {analysis.quebec_score:.2f}, "
                f"Type: {analysis.content_type}, Joual: {analysis.joual_detected}, "
                f"Author: {msg.author}"
            )

        return len(cultural_messages)

    async def _send_to_zyeute(self, cultural_messages: List[DiscordMessage]):
        if not ZYEUTE_WEBHOOK_URL:
            logger.info(
                f"[DRY RUN] Would send {len(cultural_messages)} cultural messages to Zyeuté"
            )
            return

        payload = {
            "source": "discord_cultural_bridge",
            "cultural_context": "quebec",
            "discovery_metadata": {
                "bridge_version": "1.0.0",
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "cultural_threshold": CULTURAL_THRESHOLD,
            },
            "cultural_messages": [],
        }

        for msg in cultural_messages:
            analysis = msg.cultural_analysis

            payload["cultural_messages"].append(
                {
                    "content": msg.content,
                    "source_metadata": {
                        "platform": "discord",
                        "author": msg.author,
                        "channel": msg.channel,
                        "server": msg.server_name,
                        "timestamp": msg.timestamp.isoformat(),
                        "url": msg.url,
                    },
                    "cultural_analysis": {
                        "quebec_score": analysis.quebec_score,
                        "joual_detected": analysis.joual_detected,
                        "cultural_tags": analysis.cultural_tags,
                        "regional_context": analysis.regional_context,
                        "creator_potential": analysis.creator_potential,
                        "content_type": analysis.content_type,
                        "authenticity_score": analysis.authenticity_score,
                        "analysis_reason": analysis.reason,
                    },
                    "suggested_actions": self._suggest_cultural_actions(msg, analysis),
                }
            )

        try:
            headers = {
                "Content-Type": "application/json",
                "x-zyeute-secret": ZYEUTE_API_SECRET,
            }

            response = requests.post(
                ZYEUTE_WEBHOOK_URL, json=payload, headers=headers, timeout=30
            )

            if response.status_code == 200:
                logger.info(
                    f"✅ Sent {len(cultural_messages)} Quebec cultural messages to Zyeuté"
                )
            else:
                logger.error(
                    f"❌ Failed to send to Zyeuté: {response.status_code} - {response.text}"
                )

        except Exception as e:
            logger.error(f"❌ Error sending to Zyeuté: {e}")

    def _suggest_cultural_actions(
        self, msg: DiscordMessage, analysis: CulturalAnalysis
    ) -> List[str]:
        actions = []

        if analysis.creator_potential > 0.7:
            actions.append(f"invite_creator:{msg.author_id}")

        if analysis.content_type == "event":
            actions.append("add_to_event_discovery")

        if analysis.joual_detected:
            actions.append("preserve_joual_content")

        if analysis.quebec_score > 0.8:
            actions.append("feature_cultural_content")

        return actions


# ==========================================
# 🎭 DISCORD EVENT HANDLERS
# ==========================================

bridge = ZyeuteBridge()


@client.event
async def on_ready():
    logger.info(f"🏴 Zyeuté Cultural Bridge connected as {client.user}")
    logger.info(
        f"🔍 Starting Quebec cultural discovery across {len(client.guilds)} Discord servers..."
    )

    total_cultural_content = 0

    for guild in client.guilds:
        logger.info(
            f"\n📡 Scanning server: {guild.name} ({len(guild.text_channels)} channels)"
        )

        guild_cultural_content = 0

        for channel in guild.text_channels:
            try:
                cultural_count = await bridge.process_discord_channel(channel)
                guild_cultural_content += cultural_count
                total_cultural_content += cultural_count

                await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"Error processing channel #{channel.name}: {e}")

        logger.info(
            f"🎭 Server '{guild.name}' cultural content: {guild_cultural_content} messages"
        )

    logger.info(f"\n🎉 Cultural discovery complete!")
    logger.info(
        f"📊 Total Quebec cultural content discovered: {total_cultural_content} messages"
    )
    logger.info(f"🏴 Quebec digital sovereignty mission advanced!")

    logger.info("🔄 Switching to real-time cultural monitoring mode...")


@client.event
async def on_message(message: discord.Message):
    if message.author.bot or not message.guild:
        return

    if not message.content.strip():
        return

    content_lower = message.content.lower()
    has_quebec_indicators = any(
        term in content_lower
        for term_list in QUEBEC_KEYWORDS.values()
        for term in term_list[:3]
    )

    if not has_quebec_indicators:
        return

    logger.info(f"🔴 Real-time Quebec content detected in #{message.channel.name}")

    discord_msg = DiscordMessage(
        content=message.content,
        author=message.author.name,
        author_id=str(message.author.id),
        channel=message.channel.name,
        channel_id=str(message.channel.id),
        server_id=str(message.guild.id),
        server_name=message.guild.name,
        timestamp=message.created_at,
        url=f"https://discord.com/channels/{message.guild.id}/{message.channel.id}/{message.id}",
    )

    try:
        analyzed_messages = await bridge.analyzer.analyze_message_batch([discord_msg])

        if (
            analyzed_messages[0].cultural_analysis
            and analyzed_messages[0].cultural_analysis.quebec_score
            >= CULTURAL_THRESHOLD
        ):

            await bridge._send_to_zyeute([analyzed_messages[0]])

            analysis = analyzed_messages[0].cultural_analysis
            logger.info(
                f"⚡ Real-time Quebec content bridged! Score: {analysis.quebec_score:.2f}, "
                f"Type: {analysis.content_type}"
            )

    except Exception as e:
        logger.error(f"Error processing real-time message: {e}")


# ==========================================
# 🚀 MAIN ENTRY POINT
# ==========================================


def main():
    if not DISCORD_TOKEN:
        logger.error("❌ DISCORD_TOKEN environment variable not set")
        sys.exit(1)

    if not ZYEUTE_WEBHOOK_URL:
        logger.warning("⚠️ ZYEUTE_WEBHOOK_URL not set - running in DRY RUN mode")

    logger.info("🏴 Zyeuté Discord Cultural Bridge starting...")
    logger.info(f"📅 Discovery window: {DAYS_TO_INDEX} days")
    logger.info(f"🎯 Cultural threshold: {CULTURAL_THRESHOLD}")
    logger.info(f"📦 Batch size: {BATCH_SIZE}")

    try:
        client.run(DISCORD_TOKEN)
    except KeyboardInterrupt:
        logger.info("🛑 Cultural bridge shutdown by user")
    except Exception as e:
        logger.error(f"❌ Bridge error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
