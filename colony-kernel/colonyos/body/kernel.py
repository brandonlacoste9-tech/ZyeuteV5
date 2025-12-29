"""Main ColonyOS kernel implementation."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from colonyos.body.queue import PriorityTaskQueue, TaskScheduler
from colonyos.body.workers import WorkerPool
from colonyos.core.event_bus import EventBus, InMemoryEventBus, RedisEventBus
from colonyos.core.memory import (
    HybridMemory,
    RedisMemory,
    SQLiteMemory,
    VectorMemory,
)
from colonyos.core.types import ColonyConfig, Task, TaskStatus, Worker
from colonyos.guardian.neurasphere import Neurasphere
from colonyos.mind.neurosphere import Neurosphere


class ColonyKernel:
    """The central kernel coordinating all ColonyOS subsystems."""

    def __init__(self, config: ColonyConfig) -> None:
        self.config = config
        self._setup_subsystems()
        self._running = False

    def _setup_subsystems(self) -> None:
        # Event Bus
        if self.config.event_bus_type == "redis" and self.config.message_queue_url:
            self.event_bus = EventBus(RedisEventBus(self.config.message_queue_url))
        else:
            self.event_bus = EventBus(InMemoryEventBus())

        # Memory
        if self.config.memory_backend == "redis" and self.config.message_queue_url:
            relational = RedisMemory(self.config.message_queue_url)
        else:
            relational = SQLiteMemory(self.config.memory_connection_string)

        vector = VectorMemory() if self.config.vector_db_backend else None
        self.memory = HybridMemory(relational, vector)

        # Layers
        from colonyos.core.types import IdentityManager
        
        self.identity_manager = IdentityManager()
        self.neurasphere = Neurasphere(
            self.config, self.memory, self.event_bus, self.identity_manager
        )
        self.neurosphere = Neurosphere(self.memory)

        # Body / Execution
        self.queue = PriorityTaskQueue()
        self.scheduler = TaskScheduler(self.queue)
        self.worker_pool = WorkerPool()

    async def start(self) -> None:
        """Boot the kernel."""
        if self._running:
            return

        self._running = True
        await self.event_bus.start()
        await self.scheduler.start()
        await self.event_bus.publish("kernel_started", {"timestamp": datetime.now(timezone.utc).isoformat()}, "kernel")

    async def stop(self) -> None:
        """Shutdown the kernel."""
        if not self._running:
            return

        self._running = False
        await self.scheduler.stop()
        await self.event_bus.stop()

    async def submit_task(self, description: str, created_by: str, **kwargs: Any) -> Task:
        """Submit a new task to the kernel."""
        
        task = Task.create(description=description, created_by=created_by, **kwargs)
        
        # 1. Safety Check (Guardian)
        approved, violations = await self.neurasphere.validate_task(task)
        if not approved:
            task.status = TaskStatus.REJECTED
            task.error = f"Safety violations: {violations}"
            # Optionally store rejected task
            return task

        # 2. Planning/Routing (Mind)
        # For now, just enqueue
        await self.queue.enqueue(task)
        
        await self.event_bus.publish("task_submitted", {"task_id": task.id}, "kernel")
        return task

    async def register_worker(self, worker: Worker) -> None:
        self.worker_pool.register(worker)
        await self.event_bus.publish("worker_registered", {"worker_id": worker.id}, "kernel")

    def get_stats(self) -> Dict[str, Any]:
        return {
            "queue_size": self.queue.size(),
            "workers": len(self.worker_pool.list_workers()),
            "memory_type": self.config.memory_backend,
        }
