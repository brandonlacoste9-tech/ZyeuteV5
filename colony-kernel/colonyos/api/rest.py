"""FastAPI interface for ColonyOS matching the Handshake Spec."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from colonyos.body.kernel import ColonyKernel
from colonyos.core.types import (
    Identity,
    IdentityManager,
    Task as ColonyTask,
    TaskStatus,
    Worker,
    WorkerCapability,
    WorkerStatus,
)


class TaskCreateRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=10_000)
    requirements: Dict[str, Any] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=5, ge=0, le=10)
    timeout_seconds: int = Field(default=300, ge=1, le=3_600)
    tags: List[str] = Field(default_factory=list)


class TaskResponse(BaseModel):
    id: str
    description: str
    status: str
    created_at: str
    created_by: str
    assigned_worker: Optional[str]
    result: Optional[Any]
    error: Optional[str]
    elapsed_seconds: Optional[float]


class WorkerRegisterRequest(BaseModel):
    name: str
    capabilities: List[Dict[str, Any]]


class WorkerResponse(BaseModel):
    id: str
    name: str
    status: str
    capabilities: List[Dict[str, Any]]
    current_task: Optional[str]
    last_heartbeat: Optional[str]


class SystemStatsResponse(BaseModel):
    kernel: Dict[str, Any]
    workers: Dict[str, Any]
    tasks: Dict[str, Any]
    uptime_seconds: float


class CheckpointResponse(BaseModel):
    checkpoint_id: str
    timestamp: str


class RollbackResponse(BaseModel):
    status: str
    checkpoint_id: str
    state: Dict[str, Any]


def create_app(kernel: ColonyKernel, identity_manager: IdentityManager) -> FastAPI:
    app = FastAPI(title="ColonyOS Kernel API", version="0.1.0")
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    start_time = datetime.now(timezone.utc)
    active_connections: List[WebSocket] = []

    def _task_to_response(task: ColonyTask) -> TaskResponse:
        return TaskResponse(
            id=task.id,
            description=task.description,
            status=task.status.value,
            created_at=task.created_at.isoformat(),
            created_by=task.created_by,
            assigned_worker=task.assigned_worker,
            result=task.result,
            error=task.error,
            elapsed_seconds=task.elapsed_seconds,
        )

    def _worker_to_response(worker: Worker) -> WorkerResponse:
        identity_name = worker.identity.name if worker.identity else "Unknown"
        return WorkerResponse(
            id=worker.id,
            name=identity_name,
            status=worker.status.value,
            capabilities=[
                {
                    "name": cap.name,
                    "category": cap.category,
                    "supported_languages": cap.supported_languages,
                    "max_complexity": cap.max_complexity,
                }
                for cap in worker.capabilities
            ],
            current_task=worker.current_task_id,
            last_heartbeat=worker.last_heartbeat.isoformat() if worker.last_heartbeat else None,
        )

    @app.on_event("startup")
    async def startup() -> None:
        await kernel.start()

    @app.on_event("shutdown")
    async def shutdown() -> None:
        await kernel.stop()

    @app.get("/health")
    async def health_check() -> Dict[str, Any]:
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "0.1.0",
        }

    @app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
    async def create_task(request: TaskCreateRequest) -> TaskResponse:
        # Create a system identity for the task creator
        system_identity, _ = identity_manager.create_identity("system", "System identity")
        
        task = await kernel.submit_task(
            description=request.description,
            created_by=system_identity.id,
            priority=request.priority,
            requirements=request.requirements,
            constraints=request.constraints,
            timeout_seconds=request.timeout_seconds,
            max_retries=0,
        )
        if request.tags:
            task.metadata["tags"] = request.tags
        
        return _task_to_response(task)

    @app.get("/tasks/{task_id}", response_model=TaskResponse)
    async def get_task(task_id: str) -> TaskResponse:
        task = await kernel.get_task(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found",
            )
        return _task_to_response(task)

    @app.get("/tasks", response_model=List[TaskResponse])
    async def list_tasks(
        status_filter: Optional[str] = None, limit: int = 100
    ) -> List[TaskResponse]:
        tasks = kernel.list_tasks()
        if status_filter:
            try:
                desired_status = TaskStatus(status_filter)
                tasks = [t for t in tasks if t.status == desired_status]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status_filter}",
                )
        tasks.sort(key=lambda t: t.created_at, reverse=True)
        return [_task_to_response(task) for task in tasks[:limit]]

    @app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def cancel_task(task_id: str) -> None:
        task = await kernel.get_task(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found",
            )
        if task.status in {TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task cannot be cancelled (already completed or cancelled)",
            )
        task.status = TaskStatus.CANCELLED
        await kernel.event_bus.publish("task_cancelled", {"task_id": task_id}, "kernel")

    @app.post("/workers", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
    async def register_worker(request: WorkerRegisterRequest) -> WorkerResponse:
        worker_id = f"worker_{datetime.now(timezone.utc).timestamp()}"
        identity, _ = identity_manager.create_identity(request.name, f"Worker: {request.name}")
        capabilities = [WorkerCapability(**cap) for cap in request.capabilities]
        worker = Worker(
            id=worker_id,
            identity=identity,
            capabilities=capabilities,
            status=WorkerStatus.IDLE,
        )
        await kernel.register_worker(worker)
        return _worker_to_response(worker)

    @app.get("/workers", response_model=List[WorkerResponse])
    async def list_workers() -> List[WorkerResponse]:
        workers = kernel.worker_pool.list_workers()
        return [_worker_to_response(worker) for worker in workers]

    @app.get("/workers/{worker_id}", response_model=WorkerResponse)
    async def get_worker(worker_id: str) -> WorkerResponse:
        worker = kernel.worker_pool.get_worker(worker_id)
        if not worker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker {worker_id} not found",
            )
        return _worker_to_response(worker)

    @app.post("/workers/{worker_id}/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
    async def worker_heartbeat(worker_id: str) -> None:
        success = await kernel.update_worker_heartbeat(worker_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker {worker_id} not found",
            )

    @app.get("/system/stats", response_model=SystemStatsResponse)
    async def get_system_stats() -> SystemStatsResponse:
        stats = kernel.get_stats()
        uptime = (datetime.now(timezone.utc) - start_time).total_seconds()
        return SystemStatsResponse(
            kernel=stats.get("kernel", {}),
            workers=stats.get("workers", {}),
            tasks=stats.get("kernel", {}).get("task_counts", {}),
            uptime_seconds=uptime,
        )

    @app.get("/system/audit")
    async def get_audit_log(
        event_type: Optional[str] = None, limit: int = 100
    ) -> Dict[str, Any]:
        entries = kernel.neurasphere.get_audit_trail(event_type=event_type, limit=limit)
        return {"entries": entries}

    @app.post("/system/checkpoint", response_model=CheckpointResponse)
    async def create_checkpoint() -> CheckpointResponse:
        state = {
            "tasks": {
                tid: task.to_wire_format()
                for tid, task in kernel._tasks.items()
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        checkpoint_id = kernel.neurasphere.create_checkpoint(state)
        return CheckpointResponse(
            checkpoint_id=checkpoint_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    @app.post("/system/rollback/{checkpoint_id}", response_model=RollbackResponse)
    async def rollback_system(checkpoint_id: str) -> RollbackResponse:
        try:
            state = await kernel.neurasphere.rollback_to_checkpoint(checkpoint_id)
            return RollbackResponse(
                status="rolled_back",
                checkpoint_id=checkpoint_id,
                state=state,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )

    @app.websocket("/ws/events")
    async def websocket_events(websocket: WebSocket) -> None:
        await websocket.accept()
        active_connections.append(websocket)

        async def event_handler(event) -> None:
            try:
                await websocket.send_json(
                    {
                        "type": event.event_type,
                        "data": event.data,
                        "timestamp": event.timestamp.isoformat(),
                        "source": event.source,
                    }
                )
            except Exception as exc:
                # Connection closed or error
                if websocket in active_connections:
                    active_connections.remove(websocket)

        subscription_id = await kernel.event_bus.subscribe("*", event_handler)

        try:
            while True:
                try:
                    data = await websocket.receive_text()
                    if data == "ping":
                        await websocket.send_text("pong")
                except WebSocketDisconnect:
                    break
        finally:
            if websocket in active_connections:
                active_connections.remove(websocket)
            await kernel.event_bus.unsubscribe(subscription_id)

    return app
