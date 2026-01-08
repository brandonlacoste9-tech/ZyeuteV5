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
        self._tasks: Dict[str, Task] = {}  # Track all tasks

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
        self._tasks[task.id] = task  # Track task
        
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

    async def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID."""
        # Check tracked tasks first
        if task_id in self._tasks:
            return self._tasks[task_id]
        # Check queue
        return await self.queue.get_task(task_id)

    def list_tasks(self, status: Optional[TaskStatus] = None) -> List[Task]:
        """List all tasks, optionally filtered by status."""
        tasks = list(self._tasks.values())
        if status:
            tasks = [t for t in tasks if t.status == status]
        return tasks

    async def register_worker(self, worker: Worker) -> None:
        self.worker_pool.register(worker)
        await self.event_bus.publish("worker_registered", {"worker_id": worker.id}, "kernel")

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive system statistics."""
        tasks = self.list_tasks()
        task_counts = {}
        for status in TaskStatus:
            task_counts[status.value] = len([t for t in tasks if t.status == status])
        
        workers = self.worker_pool.list_workers()
        worker_counts = {}
        for status in WorkerStatus:
            worker_counts[status.value] = len([w for w in workers if w.status == status])
        
        return {
            "kernel": {
                "queue_size": self.queue.size(),
                "total_tasks": len(tasks),
                "task_counts": task_counts,
            },
            "workers": {
                "total": len(workers),
                "by_status": worker_counts,
            },
            "memory_type": self.config.memory_backend,
            "event_bus_type": self.config.event_bus_type,
        }

    async def update_worker_heartbeat(self, worker_id: str) -> bool:
        """Update worker heartbeat timestamp."""
        worker = self.worker_pool.get_worker(worker_id)
        if not worker:
            return False
        worker.last_heartbeat = datetime.now(timezone.utc)
        await self.event_bus.publish("worker_heartbeat", {"worker_id": worker_id}, "kernel")
        return True
