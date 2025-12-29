"""Memory backends used by ColonyOS."""

from __future__ import annotations

import json
import sqlite3
import threading
import time
from typing import Any, Dict, List, Optional


class BaseMemory:
    """Base key-value memory store."""

    def store(self, key: str, value: Any, scope: str = "default", ttl: Optional[int] = None) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    def retrieve(self, key: str, scope: str = "default") -> Any:  # pragma: no cover - interface
        raise NotImplementedError

    def delete(self, key: str, scope: str = "default") -> bool:  # pragma: no cover - interface
        raise NotImplementedError

    def list_keys(self, scope: str = "default") -> List[str]:  # pragma: no cover - interface
        raise NotImplementedError


class SQLiteMemory(BaseMemory):
    """Lightweight SQLite-based key-value store."""

    def __init__(self, path: str) -> None:
        self.path = path
        self._lock = threading.Lock()
        self._initialize()

    def _initialize(self) -> None:
        with sqlite3.connect(self.path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS kv_store (
                    scope TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    expires_at REAL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_kv_scope_key ON kv_store(scope, key)")

    def store(self, key: str, value: Any, scope: str = "default", ttl: Optional[int] = None) -> None:
        expires_at = None
        if ttl:
            expires_at = time.time() + ttl

        payload = json.dumps(value)
        with self._lock, sqlite3.connect(self.path) as conn:
            conn.execute(
                "REPLACE INTO kv_store(scope, key, value, expires_at) VALUES (?, ?, ?, ?)",
                (scope, key, payload, expires_at),
            )

    def retrieve(self, key: str, scope: str = "default") -> Any:
        with self._lock, sqlite3.connect(self.path) as conn:
            row = conn.execute(
                "SELECT value, expires_at FROM kv_store WHERE scope = ? AND key = ?",
                (scope, key),
            ).fetchone()

            if not row:
                return None

            value, expires_at = row
            if expires_at and expires_at < time.time():
                conn.execute("DELETE FROM kv_store WHERE scope = ? AND key = ?", (scope, key))
                return None
            return json.loads(value)

    def delete(self, key: str, scope: str = "default") -> bool:
        with self._lock, sqlite3.connect(self.path) as conn:
            cur = conn.execute("DELETE FROM kv_store WHERE scope = ? AND key = ?", (scope, key))
            return cur.rowcount > 0

    def list_keys(self, scope: str = "default") -> List[str]:
        with self._lock, sqlite3.connect(self.path) as conn:
            rows = conn.execute("SELECT key, expires_at FROM kv_store WHERE scope = ?", (scope,)).fetchall()

        keys: List[str] = []
        with self._lock, sqlite3.connect(self.path) as conn:
             for key, expires_at in rows:
                if expires_at and expires_at < time.time():
                    conn.execute("DELETE FROM kv_store WHERE scope = ? AND key = ?", (scope, key))
                    continue
                keys.append(key)
        return keys


class RedisMemory(BaseMemory):
    """Placeholder Redis-backed memory using in-memory dict for tests."""

    def __init__(self, url: str) -> None:
        self.url = url
        self._store: Dict[str, Dict[str, Any]] = {}
        self._expiry: Dict[str, Dict[str, float]] = {}

    def store(self, key: str, value: Any, scope: str = "default", ttl: Optional[int] = None) -> None:
        scope_store = self._store.setdefault(scope, {})
        scope_store[key] = value
        if ttl:
            self._expiry.setdefault(scope, {})[key] = time.time() + ttl

    def retrieve(self, key: str, scope: str = "default") -> Any:
        expires = self._expiry.get(scope, {}).get(key)
        if expires and expires < time.time():
            self.delete(key, scope)
            return None
        return self._store.get(scope, {}).get(key)

    def delete(self, key: str, scope: str = "default") -> bool:
        existed = key in self._store.get(scope, {})
        self._store.get(scope, {}).pop(key, None)
        self._expiry.get(scope, {}).pop(key, None)
        return existed

    def list_keys(self, scope: str = "default") -> List[str]:
        keys = list(self._store.get(scope, {}).keys())
        return [key for key in keys if self.retrieve(key, scope) is not None]


class VectorMemory:
    """Simple vector memory placeholder."""

    def __init__(self) -> None:
        self._store: Dict[str, List[float]] = {}

    def upsert(self, key: str, vector: List[float]) -> None:
        self._store[key] = vector

    def query(self, vector: List[float], top_k: int = 5) -> List[str]:
        return list(self._store.keys())[:top_k]


class HybridMemory:
    """Composite memory combining relational and vector stores."""

    def __init__(self, relational: BaseMemory, vector: Optional[VectorMemory] = None) -> None:
        self.relational = relational
        self.vector = vector

    def store(self, key: str, value: Any, scope: str = "default", ttl: Optional[int] = None) -> None:
        self.relational.store(key, value, scope=scope, ttl=ttl)

    def retrieve(self, key: str, scope: str = "default") -> Any:
        return self.relational.retrieve(key, scope=scope)

    def delete(self, key: str, scope: str = "default") -> bool:
        return self.relational.delete(key, scope=scope)

    def list_keys(self, scope: str = "default") -> List[str]:
        return self.relational.list_keys(scope=scope)

    def upsert_vector(self, key: str, vector: List[float]) -> None:
        if not self.vector:
            raise RuntimeError("Vector backend not configured")
        self.vector.upsert(key, vector)

    def query_vector(self, vector: List[float], top_k: int = 5) -> List[str]:
        if not self.vector:
            return []
        return self.vector.query(vector, top_k=top_k)
