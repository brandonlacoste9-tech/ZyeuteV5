"""Task queue and scheduling logic."""

import asyncio
import heapq
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from colonyos.core.types import Task, TaskStatus


@dataclass(order=True)
class PrioritizedTask:
    priority: int
    created_at: float
    task: Task = field(compare=False)


class PriorityTaskQueue:
    """In-memory priority queue for tasks."""

    def __init__(self) -> None:
        self._queue: List[PrioritizedTask] = []
        self._lock = asyncio.Lock()
        self._tasks_by_id: Dict[str, Task] = {}

    async def enqueue(self, task: Task) -> None:
        async with self._lock:
            # Python's heapq is min-heap. We want higher priority first.
            # So we negate priority.
            # Secondary sort key is creation time (fifo for same priority)
            pt = PrioritizedTask(
                priority=-task.priority,
                created_at=task.created_at.timestamp(),
                task=task,
            )
            heapq.heappush(self._queue, pt)
            self._tasks_by_id[task.id] = task
            task.status = TaskStatus.QUEUED

    async def dequeue(self) -> Optional[Task]:
        async with self._lock:
            if not self._queue:
                return None
            pt = heapq.heappop(self._queue)
            task = pt.task
            return task

    async def get_task(self, task_id: str) -> Optional[Task]:
        async with self._lock:
            return self._tasks_by_id.get(task_id)

    async def remove(self, task_id: str) -> Optional[Task]:
        async with self._lock:
            if task_id not in self._tasks_by_id:
                return None
            
            # Rebuild queue without the removed item. O(N)
            # Efficient enough for "mini-kernel" scale
            task = self._tasks_by_id.pop(task_id)
            self._queue = [pt for pt in self._queue if pt.task.id != task_id]
            heapq.heapify(self._queue)
            return task
            
    def size(self) -> int:
        return len(self._queue)


class TaskScheduler:
    """Manages task timeouts and scheduled execution."""

    def __init__(self, queue: PriorityTaskQueue) -> None:
        self.queue = queue
        self._running = False
        self._tasks: List[asyncio.Task] = []

    async def start(self) -> None:
        self._running = True
        self._tasks.append(asyncio.create_task(self._monitor_timeouts()))

    async def stop(self) -> None:
        self._running = False
        for t in self._tasks:
            t.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()

    async def _monitor_timeouts(self) -> None:
        while self._running:
            await asyncio.sleep(1.0)
            # TODO: Implement timeout logic checking against started_at
            pass
