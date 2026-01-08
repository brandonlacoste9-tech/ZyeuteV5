"""Simulate a hive with mock workers, heartbeats, and tasks."""

from __future__ import annotations

import asyncio
import random
import time
from datetime import datetime, timezone
from typing import List
from uuid import uuid4

import requests

# Configuration
BASE_URL = "http://localhost:8000"
NUM_WORKERS = 3
HEARTBEAT_INTERVAL = 5  # seconds
TASK_INTERVAL = 10  # seconds
RUN_DURATION = 300  # seconds (5 minutes)


class MockBee:
    """Represents a mock worker bee."""

    def __init__(self, bee_id: str, name: str, capabilities: List[dict]) -> None:
        self.bee_id = bee_id
        self.name = name
        self.capabilities = capabilities
        self.registered = False

    def register(self) -> bool:
        """Register this bee as a worker."""
        try:
            response = requests.post(
                f"{BASE_URL}/workers",
                json={
                    "name": self.name,
                    "capabilities": self.capabilities,
                },
                timeout=5,
            )
            if response.status_code == 201:
                data = response.json()
                self.bee_id = data["id"]
                self.registered = True
                print(f"✅ Registered {self.name} (ID: {self.bee_id})")
                return True
            else:
                print(f"❌ Failed to register {self.name}: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error registering {self.name}: {e}")
            return False

    def send_heartbeat(self) -> bool:
        """Send a heartbeat to keep the worker alive."""
        if not self.registered:
            return False
        try:
            response = requests.post(
                f"{BASE_URL}/workers/{self.bee_id}/heartbeat",
                timeout=5,
            )
            return response.status_code == 204
        except Exception as e:
            print(f"⚠️ Heartbeat failed for {self.name}: {e}")
            return False

    def submit_task(self) -> bool:
        """Submit a random task."""
        task_descriptions = [
            "Process image for content moderation",
            "Generate summary of user activity",
            "Analyze sentiment of text content",
            "Extract metadata from media file",
            "Validate data integrity",
            "Generate thumbnail from video",
            "Translate text to French",
            "Classify content category",
        ]
        
        try:
            response = requests.post(
                f"{BASE_URL}/tasks",
                json={
                    "description": random.choice(task_descriptions),
                    "priority": random.randint(1, 10),
                    "timeout_seconds": random.randint(60, 600),
                    "requirements": {
                        "cpu": random.choice(["low", "medium", "high"]),
                        "memory": random.choice(["low", "medium", "high"]),
                    },
                    "tags": random.sample(["urgent", "batch", "realtime", "analytics"], k=random.randint(1, 2)),
                },
                timeout=5,
            )
            if response.status_code == 201:
                task = response.json()
                print(f"📋 {self.name} submitted task: {task['id'][:8]}... ({task['status']})")
                return True
            else:
                print(f"❌ Failed to submit task: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error submitting task: {e}")
            return False


def create_mock_bees() -> List[MockBee]:
    """Create a set of mock worker bees with different capabilities."""
    bees = [
        MockBee(
            bee_id="",
            name="ImageProcessor-Bee",
            capabilities=[
                {"name": "image_processing", "category": "media", "supported_languages": ["python"]},
                {"name": "content_moderation", "category": "safety"},
            ],
        ),
        MockBee(
            bee_id="",
            name="TextAnalyzer-Bee",
            capabilities=[
                {"name": "text_analysis", "category": "nlp", "supported_languages": ["python"]},
                {"name": "sentiment_analysis", "category": "nlp"},
            ],
        ),
        MockBee(
            bee_id="",
            name="DataValidator-Bee",
            capabilities=[
                {"name": "data_validation", "category": "data", "supported_languages": ["python", "typescript"]},
                {"name": "schema_check", "category": "data"},
            ],
        ),
    ]
    return bees


async def run_simulation() -> None:
    """Run the hive simulation."""
    print("=" * 60)
    print("🐝 ColonyOS Hive Simulation")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Workers: {NUM_WORKERS}")
    print(f"Heartbeat Interval: {HEARTBEAT_INTERVAL}s")
    print(f"Task Interval: {TASK_INTERVAL}s")
    print(f"Duration: {RUN_DURATION}s")
    print("=" * 60)
    print()

    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print(f"❌ Server health check failed: {response.status_code}")
            return
        print("✅ Server is healthy")
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print(f"   Make sure ColonyOS Kernel is running on {BASE_URL}")
        return

    # Create and register workers
    bees = create_mock_bees()[:NUM_WORKERS]
    print(f"\n📝 Registering {len(bees)} workers...")
    for bee in bees:
        bee.register()
        await asyncio.sleep(0.5)  # Stagger registrations

    registered_bees = [bee for bee in bees if bee.registered]
    if not registered_bees:
        print("❌ No workers registered. Exiting.")
        return

    print(f"\n✅ {len(registered_bees)} workers registered and ready")
    print("\n🔄 Starting simulation loop...\n")

    start_time = time.time()
    last_heartbeat = time.time()
    last_task_submission = time.time()

    try:
        while time.time() - start_time < RUN_DURATION:
            current_time = time.time()

            # Send heartbeats
            if current_time - last_heartbeat >= HEARTBEAT_INTERVAL:
                for bee in registered_bees:
                    bee.send_heartbeat()
                last_heartbeat = current_time
                print(f"💓 Heartbeats sent ({datetime.now(timezone.utc).strftime('%H:%M:%S')})")

            # Submit tasks
            if current_time - last_task_submission >= TASK_INTERVAL:
                bee = random.choice(registered_bees)
                bee.submit_task()
                last_task_submission = current_time

            # Print stats periodically
            if int(current_time - start_time) % 30 == 0 and int(current_time - start_time) > 0:
                try:
                    response = requests.get(f"{BASE_URL}/system/stats", timeout=5)
                    if response.status_code == 200:
                        stats = response.json()
                        kernel = stats.get("kernel", {})
                        workers = stats.get("workers", {})
                        print(f"\n📊 Stats: Queue={kernel.get('queue_size', 0)}, "
                              f"Workers={workers.get('total', 0)}, "
                              f"Tasks={kernel.get('total_tasks', 0)}")
                except Exception as e:
                    print(f"⚠️ Failed to fetch stats: {e}")

            await asyncio.sleep(1)

    except KeyboardInterrupt:
        print("\n\n⚠️ Simulation interrupted by user")

    print("\n" + "=" * 60)
    print("🏁 Simulation complete")
    print("=" * 60)

    # Final stats
    try:
        response = requests.get(f"{BASE_URL}/system/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print("\n📊 Final Statistics:")
            print(f"   Kernel: {stats.get('kernel', {})}")
            print(f"   Workers: {stats.get('workers', {})}")
            print(f"   Uptime: {stats.get('uptime_seconds', 0):.1f}s")
    except Exception as e:
        print(f"⚠️ Failed to fetch final stats: {e}")


if __name__ == "__main__":
    asyncio.run(run_simulation())
