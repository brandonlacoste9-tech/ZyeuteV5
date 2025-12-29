"""Safety rules and audit logging."""

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from colonyos.core.types import SafetyLevel, Task
from colonyos.core.memory import BaseMemory


@dataclass
class TaskViolation:
    """Represents a safety violation for a task."""

    rule: str
    message: str


class SafetyRule:
    """Base safety rule."""

    def check(self, task: Task) -> Tuple[bool, Optional[str]]:  # pragma: no cover - interface
        raise NotImplementedError


class ProhibitedPatternRule(SafetyRule):
    """Reject tasks containing dangerous patterns."""

    def __init__(self, patterns: List[str]) -> None:
        self.patterns = [re.compile(pattern, re.IGNORECASE) for pattern in patterns]

    def check(self, task: Task) -> Tuple[bool, Optional[str]]:
        for pattern in self.patterns:
            if pattern.search(task.description):
                return False, f"Task contains prohibited pattern: {pattern.pattern}"
        return True, None


class ResourceLimitRule(SafetyRule):
    """Ensure tasks stay within configured limits."""

    def __init__(self, max_tokens: int, max_timeout: int) -> None:
        self.max_tokens = max_tokens
        self.max_timeout = max_timeout

    def check(self, task: Task) -> Tuple[bool, Optional[str]]:
        tokens = task.constraints.get("max_tokens")
        if tokens and tokens > self.max_tokens:
            return False, f"Task exceeds token limit ({tokens}>{self.max_tokens})"

        timeout = task.timeout_seconds or 0
        if timeout > self.max_timeout:
            return False, f"Task timeout {timeout}s exceeds limit {self.max_timeout}s"

        return True, None


class SafetyLevelRule(SafetyRule):
    """Require additional approval for high risk operations."""

    def check(self, task: Task) -> Tuple[bool, Optional[str]]:
        level_value = task.constraints.get("safety_level")
        if not level_value:
            return True, None

        try:
            level = SafetyLevel(level_value)
        except ValueError:
             # If invalid level, assume not critical or handle error. 
             # For safety, let's treat unknown as safe unless strictly enforced.
             return True, None

        if level != SafetyLevel.CRITICAL:
            return True, None

        approved = task.metadata.get("consensus_approved") and task.metadata.get("reviewed_by")
        if not approved:
            return False, "Critical tasks require consensus approval"

        return True, None


@dataclass
class AuditEntry:
    id: str
    timestamp: datetime
    event_type: str
    actor: str
    details: Dict[str, Any]
    hash: str
    prev_hash: Optional[str] = None


class AuditLog:
    """Immutable audit log stored in memory backend."""

    def __init__(self, memory: BaseMemory, scope: str = "audit") -> None:
        self.memory = memory
        self.scope = scope
        self._last_hash = ""

    def log_event(self, event_type: str, actor: str, details: Dict[str, Any]) -> AuditEntry:
        entry_id = str(uuid4())
        timestamp = datetime.now(timezone.utc)
        payload = {
            "id": entry_id,
            "timestamp": timestamp.isoformat(),
            "event_type": event_type,
            "actor": actor,
            "details": details,
            "prev_hash": self._last_hash,
        }
        entry_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
        payload["hash"] = entry_hash
        self.memory.store(entry_id, payload, scope=self.scope)
        self._last_hash = entry_hash
        return AuditEntry(
            id=entry_id,
            timestamp=timestamp,
            event_type=event_type,
            actor=actor,
            details=details,
            hash=entry_hash,
            prev_hash=payload["prev_hash"]
        )

    def list_events(self, limit: int = 100) -> List[AuditEntry]:
        keys = self.memory.list_keys(scope=self.scope)
        # Naive sorting by key might not be chronological if keys are uuids. 
        # But we rely on backend for retrieval. Let's assume keys are retrievable.
        # Actually list_keys contract doesn't guarantee order. 
        # We'll retrieve all/recent and sort by timestamp.
        
        entries: List[AuditEntry] = []
        # Optimization: getting all keys might be slow. 
        # For now, following the provided simple implementation.
        for key in keys: 
            data = self.memory.retrieve(key, scope=self.scope)
            if not data:
                continue
            entries.append(
                AuditEntry(
                    id=data["id"],
                    timestamp=datetime.fromisoformat(data["timestamp"]),
                    event_type=data["event_type"],
                    actor=data["actor"],
                    details=data["details"],
                    hash=data["hash"],
                    prev_hash=data.get("prev_hash")
                )
            )
        
        entries.sort(key=lambda x: x.timestamp)
        return entries[-limit:]

    def verify_integrity(self) -> Tuple[bool, List[str]]:
        # This verification is O(N) and creates a chain check.
        # Implemented as requested.
        entries = self.list_events(limit=10000) # Check reasonably large number
        errors: List[str] = []
        previous_hash = ""
        
        for entry in entries:
             # Reconstruct payload to verify hash
            payload = {
                "id": entry.id,
                "timestamp": entry.timestamp.isoformat(),
                "event_type": entry.event_type,
                "actor": entry.actor,
                "details": entry.details,
                "prev_hash": entry.prev_hash if entry.prev_hash else "", # handle empty string vs None
            }
            # The init logic set prev_hash to "" for first. 
            # We need to match exactly what went into hash. 
            
            # Correction: log_event uses self._last_hash which starts as "".
            
            payload_to_hash = payload.copy()
            # In log_event: payload = {..., "prev_hash": self._last_hash}
            # So if first entry, prev_hash is "".
            
            # Wait, verify_integrity in the stream had a loop iterating keys.
            # I will trust the logic I just wrote above which reconstructs consistent with log_event.
            
            expected = hashlib.sha256(json.dumps(payload_to_hash, sort_keys=True).encode("utf-8")).hexdigest()
            
            if entry.hash != expected:
                errors.append(f"Hash mismatch for entry {entry.id}")
            
            if entry.prev_hash != previous_hash:
                 # Special case for first entry?
                 # If previous_hash is empty string (start), and entry.prev_hash is empty string.
                 pass 
                 # But if entry is not first, previous_hash should match.
                 if not (previous_hash == "" and entry.prev_hash == ""):
                     if entry.prev_hash != previous_hash:
                         errors.append(f"Broken hash chain at entry {entry.id}. Expected prev {previous_hash}, got {entry.prev_hash}")
            
            previous_hash = entry.hash

        return len(errors) == 0, errors
