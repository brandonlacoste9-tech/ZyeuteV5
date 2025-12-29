"""Guardian orchestrating safety checks and consensus."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from colonyos.core.types import ColonyConfig, Identity, IdentityManager, Task
from colonyos.core.memory import HybridMemory
from colonyos.core.event_bus import EventBus
from colonyos.guardian.safety import (
    AuditLog,
    ProhibitedPatternRule,
    ResourceLimitRule,
    SafetyLevelRule,
    TaskViolation,
)


@dataclass
class ConsensusVote:
    vote_id: str
    participants: List[str]
    decision: Dict[str, Any]
    threshold: float
    future: asyncio.Future[Tuple[bool, Dict[str, Any]]]
    votes: Dict[str, bool]

    def record_vote(self, participant: str, approve: bool) -> None:
        if participant not in self.participants:
            return
        if participant in self.votes:
            return
        self.votes[participant] = approve

    def tally(self) -> Tuple[int, int]:
        approvals = sum(1 for approved in self.votes.values() if approved)
        total = len(self.participants)
        return approvals, total

    def is_complete(self) -> bool:
        approvals, total = self.tally()
        if total == 0:
            return True
        if approvals / total >= self.threshold:
            return True
        if len(self.votes) == total:
            return True
        return False

    def result(self) -> Tuple[bool, Dict[str, Any]]:
        approvals, total = self.tally()
        approved = total > 0 and approvals / total >= self.threshold
        return approved, {
            "approvals": approvals,
            "total": total,
            "decision": self.decision,
        }


class StateManager:
    """Simple checkpoint manager using memory backend."""

    def __init__(self, memory: HybridMemory, scope: str = "checkpoints") -> None:
        self.memory = memory
        self.scope = scope

    def create_checkpoint(self, state: Dict[str, Any]) -> str:
        checkpoint_id = str(uuid4())
        payload = {
            "id": checkpoint_id,
            "state": state,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.memory.store(checkpoint_id, payload, scope=self.scope)
        return checkpoint_id

    def list_checkpoints(self) -> List[Dict[str, Any]]:
        checkpoints: List[Dict[str, Any]] = []
        for key in self.memory.list_keys(scope=self.scope):
            payload = self.memory.retrieve(key, scope=self.scope)
            if payload:
                checkpoints.append(payload)
        checkpoints.sort(key=lambda cp: cp["timestamp"])
        return checkpoints

    async def load_checkpoint(self, checkpoint_id: str) -> Optional[Dict[str, Any]]:
        return self.memory.retrieve(checkpoint_id, scope=self.scope)


class ConsensusCoordinator:
    """Manages active consensus votes."""

    def __init__(self, config: Optional[Dict[str, Any]]) -> None:
        self.threshold = 0.66
        if config and "consensus_threshold" in config:
            self.threshold = float(config["consensus_threshold"])
        self.active_votes: Dict[str, ConsensusVote] = {}

    def start_vote(self, decision: Dict[str, Any], participants: List[str]) -> ConsensusVote:
        vote_id = str(uuid4())
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        future: asyncio.Future[Tuple[bool, Dict[str, Any]]] = loop.create_future()
        
        vote = ConsensusVote(
            vote_id=vote_id,
            participants=participants,
            decision=decision,
            threshold=self.threshold,
            future=future,
            votes={},
        )
        self.active_votes[vote_id] = vote

        # If no participants, approve immediately
        if not participants:
            vote.future.set_result((True, {"approvals": 0, "total": 0, "decision": decision}))
            return vote

        return vote

    async def cast_vote(self, vote_id: str, participant: str, approve: bool) -> None:
        vote = self.active_votes.get(vote_id)
        if not vote:
            return
        vote.record_vote(participant, approve)
        if vote.is_complete() and not vote.future.done():
            vote.future.set_result(vote.result())
            self.active_votes.pop(vote_id, None)


class Neurasphere:
    """Guardian orchestrating safety checks and consensus."""

    def __init__(
        self,
        config: ColonyConfig,
        memory: HybridMemory,
        event_bus: EventBus,
        identity_manager: IdentityManager,
    ) -> None:
        self.config = config
        self.memory = memory
        self.event_bus = event_bus
        self.identity_manager = identity_manager
        self.identity: Optional[Identity] = None
        self.audit_log = AuditLog(memory.relational)
        self.state_manager = StateManager(memory)
        self.consensus = ConsensusCoordinator(config.guardian if hasattr(config, "guardian") else None)
        self._safety_rules = [
            ProhibitedPatternRule([r"rm\s+-rf", r"DROP\s+TABLE"]),
            ResourceLimitRule(max_tokens=2000, max_timeout=3600),
            SafetyLevelRule(),
        ]

    def set_identity(self, identity: Identity) -> None:
        self.identity = identity

    async def validate_task(self, task: Task) -> Tuple[bool, List[TaskViolation]]:
        violations: List[TaskViolation] = []
        for rule in self._safety_rules:
            passed, message = rule.check(task)
            if not passed and message:
                violations.append(TaskViolation(rule=rule.__class__.__name__, message=message))

        approved = len(violations) == 0
        if approved:
            await self.event_bus.publish("task_validated", {"task_id": task.id}, "neurasphere")
        else:
            await self.event_bus.publish(
                "task_rejected",
                {"task_id": task.id, "violations": [v.message for v in violations]},
                "neurasphere",
            )
        return approved, violations

    async def request_consensus(self, decision: Dict[str, Any], participants: List[str]) -> Tuple[bool, Dict[str, Any]]:
        vote = self.consensus.start_vote(decision, participants)
        result = await vote.future
        return result

    def get_audit_trail(self, event_type: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        entries = self.audit_log.list_events(limit=limit)
        if event_type:
            entries = [entry for entry in entries if entry.event_type == event_type]
        return [
            {
                "id": entry.id,
                "timestamp": entry.timestamp.isoformat(),
                "event_type": entry.event_type,
                "actor": entry.actor,
                "details": entry.details,
            }
            for entry in entries
        ]

    def create_checkpoint(self, state: Dict[str, Any]) -> str:
        checkpoint_id = self.state_manager.create_checkpoint(state)
        self.audit_log.log_event("checkpoint", self.identity.id if self.identity else "system", {"id": checkpoint_id})
        return checkpoint_id

    async def rollback_to_checkpoint(self, checkpoint_id: str) -> Dict[str, Any]:
        payload = await self.state_manager.load_checkpoint(checkpoint_id)
        if not payload:
            raise ValueError(f"Checkpoint {checkpoint_id} not found")
        self.audit_log.log_event("rollback", self.identity.id if self.identity else "system", {"id": checkpoint_id})
        return payload["state"]
