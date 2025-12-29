"""Worker management components."""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from colonyos.core.types import Worker, WorkerStatus


@dataclass
class WorkerMetrics:
    """Performance metrics for workers."""
    
    tasks_completed: int = 0
    tasks_failed: int = 0
    total_execution_time: float = 0.0
    
    def record_success(self, duration: float) -> None:
        self.tasks_completed += 1
        self.total_execution_time += duration
        
    def record_failure(self) -> None:
        self.tasks_failed += 1


class WorkerPool:
    """Manages the registry of available workers."""

    def __init__(self) -> None:
        self._workers: Dict[str, Worker] = {}
        self._metrics: Dict[str, WorkerMetrics] = {}

    def register(self, worker: Worker) -> None:
        self._workers[worker.id] = worker
        if worker.id not in self._metrics:
            self._metrics[worker.id] = WorkerMetrics()

    def unregister(self, worker_id: str) -> None:
        self._workers.pop(worker_id, None)

    def get_worker(self, worker_id: str) -> Optional[Worker]:
        return self._workers.get(worker_id)

    def list_workers(self) -> List[Worker]:
        return list(self._workers.values())

    def update_status(self, worker_id: str, status: WorkerStatus) -> None:
        if worker_id in self._workers:
            self._workers[worker_id].status = status

    def get_metrics(self, worker_id: str) -> Optional[WorkerMetrics]:
        return self._metrics.get(worker_id)
