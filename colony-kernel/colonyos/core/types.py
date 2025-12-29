"""Core dataclasses, enums, and managers for ColonyOS."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4


class TaskStatus(Enum):
    """Lifecycle states for a task."""

    PENDING = "pending"
    QUEUED = "queued"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class WorkerStatus(Enum):
    """Status states for worker availability."""

    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    ERROR = "error"


class MessageType(Enum):
    """Message categories used across the system."""

    TASK_SUBMIT = "task_submit"
    TASK_STATUS = "task_status"
    HEARTBEAT = "heartbeat"


class SafetyLevel(Enum):
    """Safety level of a task."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class WorkerCapability:
    """Capabilities that describe worker skills."""

    name: str
    category: str
    supported_languages: Optional[List[str]] = None
    max_complexity: Optional[int] = None


@dataclass
class Identity:
    """Represents an identity within ColonyOS."""

    id: str
    name: str
    public_key: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    description: Optional[str] = None
    avatar_url: Optional[str] = None

    def verify_signature(self, message: bytes, signature: bytes) -> bool:
        """Validate a signature for a message."""

        key = bytes.fromhex(self.public_key)
        expected = hmac.new(key, message, hashlib.sha256).digest()
        return hmac.compare_digest(expected, signature)


class IdentityManager:
    """Creates and manages identities and signing keys."""

    def __init__(self) -> None:
        self._identities: Dict[str, Identity] = {}
        self._private_keys: Dict[str, bytes] = {}

    def create_identity(self, name: str, description: Optional[str] = None) -> Tuple[Identity, str]:
        """Create a new identity."""

        private_key = hashlib.sha256(uuid4().bytes).digest()
        public_key = private_key.hex()
        identity = Identity(id=str(uuid4()), name=name, public_key=public_key, description=description)
        self._identities[identity.id] = identity
        self._private_keys[identity.id] = private_key
        return identity, private_key.hex()

    def get_identity(self, identity_id: str) -> Optional[Identity]:
        """Return an identity by id."""

        return self._identities.get(identity_id)

    def sign_message(self, identity_id: str, message: bytes) -> bytes:
        """Sign a message for an identity."""

        if identity_id not in self._private_keys:
            raise KeyError(f"Unknown identity: {identity_id}")
        key = self._private_keys[identity_id]
        return hmac.new(key, message, hashlib.sha256).digest()


@dataclass
class Message:
    """Signed message payload used for inter-module coordination."""

    id: str
    type: MessageType
    sender: str
    recipient: str
    payload: Dict[str, Any]
    signature: Optional[bytes] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: Optional[str] = None

    @classmethod
    def create(
        cls,
        type: MessageType,
        sender: str,
        recipient: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
    ) -> "Message":
        return cls(
            id=str(uuid4()),
            type=type,
            sender=sender,
            recipient=recipient,
            payload=payload,
            correlation_id=correlation_id,
        )

    def sign(self, identity_manager: IdentityManager) -> None:
        """Sign the message using the sender's private key."""
        
        # Canonicalize payload for signing (simplified)
        data = json.dumps(self.payload, sort_keys=True).encode("utf-8")
        self.signature = identity_manager.sign_message(self.sender, data)

    def verify(self, identity: Identity) -> bool:
        """Verify the message signature."""
        
        if not self.signature:
            return False
        if identity.id != self.sender:
            return False
        data = json.dumps(self.payload, sort_keys=True).encode("utf-8")
        return identity.verify_signature(data, self.signature)

    def to_wire_format(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "sender": self.sender,
            "recipient": self.recipient,
            "payload": self.payload,
            "signature": self.signature.hex() if self.signature else None,
            "timestamp": self.timestamp.isoformat(),
            "correlation_id": self.correlation_id,
        }

    @classmethod
    def from_wire_format(cls, data: Dict[str, Any]) -> "Message":
        msg = cls(
            id=data["id"],
            type=MessageType(data["type"]),
            sender=data["sender"],
            recipient=data["recipient"],
            payload=data["payload"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            correlation_id=data.get("correlation_id"),
        )
        signature = data.get("signature")
        if signature:
            msg.signature = bytes.fromhex(signature)
        return msg


@dataclass
class Event:
    """Event emitted via the event bus."""

    event_type: str
    data: Dict[str, Any]
    source: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class Task:
    """Executable unit tracked by the kernel."""

    id: str
    description: str
    created_by: str
    priority: int = 0
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assigned_worker: Optional[str] = None
    timeout_seconds: Optional[int] = None
    requirements: Dict[str, Any] = field(default_factory=dict)
    constraints: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    result: Optional[Any] = None
    error: Optional[str] = None
    error_trace: Optional[str] = None
    max_retries: int = 0
    retry_count: int = 0

    @classmethod
    def create(
        cls,
        description: str,
        created_by: str,
        priority: int = 0,
        requirements: Optional[Dict[str, Any]] = None,
        constraints: Optional[Dict[str, Any]] = None,
        timeout_seconds: Optional[int] = None,
        max_retries: int = 0,
    ) -> "Task":
        return cls(
            id=str(uuid4()),
            description=description,
            created_by=created_by,
            priority=priority,
            requirements=requirements or {},
            constraints=constraints or {},
            timeout_seconds=timeout_seconds,
            max_retries=max_retries,
        )

    def can_retry(self) -> bool:
        return self.retry_count < self.max_retries

    def to_wire_format(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "description": self.description,
            "created_by": self.created_by,
            "priority": self.priority,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "assigned_worker": self.assigned_worker,
            "timeout_seconds": self.timeout_seconds,
            "requirements": self.requirements,
            "constraints": self.constraints,
            "metadata": self.metadata,
            "result": self.result,
            "error": self.error,
            "error_trace": self.error_trace,
            "max_retries": self.max_retries,
            "retry_count": self.retry_count,
        }

    @classmethod
    def from_wire_format(cls, payload: Dict[str, Any]) -> "Task":
        task = cls(
            id=payload["id"],
            description=payload["description"],
            created_by=payload.get("created_by", "unknown"),
            priority=payload.get("priority", 0),
            status=TaskStatus(payload.get("status", TaskStatus.PENDING.value)),
            timeout_seconds=payload.get("timeout_seconds"),
            requirements=payload.get("requirements", {}),
            constraints=payload.get("constraints", {}),
            metadata=payload.get("metadata", {}),
            result=payload.get("result"),
            error=payload.get("error"),
            error_trace=payload.get("error_trace"),
            max_retries=payload.get("max_retries", 0),
            retry_count=payload.get("retry_count", 0),
        )
        created_at = payload.get("created_at")
        if created_at:
            task.created_at = datetime.fromisoformat(created_at)
        started_at = payload.get("started_at")
        if started_at:
            task.started_at = datetime.fromisoformat(started_at)
        completed_at = payload.get("completed_at")
        if completed_at:
            task.completed_at = datetime.fromisoformat(completed_at)
        task.assigned_worker = payload.get("assigned_worker")
        return task


@dataclass
class Worker:
    """Runtime worker record."""

    id: str
    identity: Optional[Identity]
    capabilities: List[WorkerCapability]
    status: WorkerStatus = WorkerStatus.IDLE
    current_task_id: Optional[str] = None
    last_heartbeat: Optional[datetime] = None

    def is_available(self) -> bool:
        return self.status == WorkerStatus.IDLE and self.current_task_id is None

    def is_healthy(self, heartbeat_timeout: int) -> bool:
        if self.last_heartbeat is None:
            return True
        delta = datetime.now(timezone.utc) - self.last_heartbeat
        return delta.total_seconds() <= heartbeat_timeout


@dataclass
class TaskRouting:
    """Routing decision describing which worker should execute a task."""

    worker_id: str


@dataclass
class WorkflowNode:
    """Node within a workflow plan."""

    task: Task


@dataclass
class WorkflowPlan:
    """Simple workflow description."""

    id: str
    goal: str
    nodes: Dict[str, WorkflowNode]


@dataclass
class ColonyConfig:
    """Configuration for ColonyOS subsystems."""

    system_id: str = field(default_factory=lambda: str(uuid4()))
    log_level: str = "INFO"
    max_concurrent_tasks: int = 4
    worker_heartbeat_timeout: int = 120
    memory_backend: str = "sqlite"
    memory_connection_string: str = ":memory:"
    event_bus_type: str = "inmemory"
    message_queue_url: Optional[str] = None
    vector_db_backend: Optional[str] = None
    mind: Dict[str, Any] = field(default_factory=dict)
    guardian: Dict[str, Any] = field(
        default_factory=lambda: {"consensus_threshold": 0.66, "drift_threshold": 0.3}
    )


async def gather_with_concurrency(limit: int, tasks: Any) -> List[Any]:
    """Utility helper for running tasks with concurrency limits."""
    
    semaphore = asyncio.Semaphore(limit)
    results: List[Any] = []

    async def run(task: Any) -> None:
        async with semaphore:
            results.append(await task)

    await asyncio.gather(*(run(task) for task in tasks))
    return results
