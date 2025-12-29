"""Asynchronous event bus backends used by ColonyOS."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional
from uuid import uuid4

from colonyos.core.types import Event

EventHandler = Callable[[Event], Awaitable[None]]


class EventBusBackend:
    """Base interface for event bus backends."""

    async def start(self) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def stop(self) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def publish(self, event: Event) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def subscribe(self, event_type: str, handler: EventHandler) -> str:  # pragma: no cover - interface
        raise NotImplementedError

    async def unsubscribe(self, subscription_id: str) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def get_history(self, event_type: Optional[str], limit: int) -> List[Event]:  # pragma: no cover - interface
        raise NotImplementedError


@dataclass
class Subscription:
    subscription_id: str
    event_type: str
    handler: EventHandler


class InMemoryEventBus(EventBusBackend):
    """Simple in-memory event bus backend with async dispatch."""

    def __init__(self) -> None:
        self._subscriptions: Dict[str, Subscription] = {}
        self._lock = asyncio.Lock()
        self._history: List[Event] = []
        self._running = False

    async def start(self) -> None:
        self._running = True

    async def stop(self) -> None:
        self._running = False
        async with self._lock:
            self._subscriptions.clear()

    async def publish(self, event: Event) -> None:
        if not self._running:
            return

        async with self._lock:
            self._history.append(event)
            subscriptions = list(self._subscriptions.values())

        for subscription in subscriptions:
            if subscription.event_type not in {event.event_type, "*"}:
                continue
            asyncio.create_task(subscription.handler(event))

    async def subscribe(self, event_type: str, handler: EventHandler) -> str:
        subscription_id = str(uuid4())
        async with self._lock:
            self._subscriptions[subscription_id] = Subscription(
                subscription_id=subscription_id,
                event_type=event_type,
                handler=handler,
            )
        return subscription_id

    async def unsubscribe(self, subscription_id: str) -> None:
        async with self._lock:
            self._subscriptions.pop(subscription_id, None)

    async def get_history(self, event_type: Optional[str], limit: int = 100) -> List[Event]:
        async with self._lock:
            if event_type is None:
                return list(self._history[-limit:])
            return [event for event in self._history if event.event_type == event_type][-limit:]


class EventBus:
    """High level event bus facade used by ColonyOS."""

    def __init__(self, backend: EventBusBackend) -> None:
        self.backend = backend

    async def start(self) -> None:
        await self.backend.start()

    async def stop(self) -> None:
        await self.backend.stop()

    async def publish(self, event_type: str, data: Dict[str, Any], source: str) -> None:
        event = Event(event_type=event_type, data=data, source=source, timestamp=datetime.now(timezone.utc))
        await self.backend.publish(event)

    async def subscribe(self, event_type: str, handler: EventHandler) -> str:
        return await self.backend.subscribe(event_type, handler)

    async def unsubscribe(self, subscription_id: str) -> None:
        await self.backend.unsubscribe(subscription_id)

    async def get_history(self, event_type: Optional[str] = None, limit: int = 100) -> List[Event]:
        return await self.backend.get_history(event_type, limit)


class RedisEventBus(EventBusBackend):
    """Placeholder Redis-backed event bus."""

    def __init__(self, url: str) -> None:
        self.url = url
        self._backend = InMemoryEventBus()

    async def start(self) -> None:
        await self._backend.start()

    async def stop(self) -> None:
        await self._backend.stop()

    async def publish(self, event: Event) -> None:
        await self._backend.publish(event)

    async def subscribe(self, event_type: str, handler: EventHandler) -> str:
        return await self._backend.subscribe(event_type, handler)

    async def unsubscribe(self, subscription_id: str) -> None:
        await self._backend.unsubscribe(subscription_id)

    async def get_history(self, event_type: Optional[str], limit: int) -> List[Event]:
        return await self._backend.get_history(event_type, limit)
