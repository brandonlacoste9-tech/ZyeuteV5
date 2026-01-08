# ColonyOS Kernel

**Status**: ✅ OPERATIONAL  
**Version**: 0.1.0  
**Port**: 8000 (configurable via `COLONY_PORT`)

## Overview

The ColonyOS Kernel is a standalone, headless Python service that serves as the **single source of truth** for multi-agent task distribution and orchestration. It provides a stable REST + WebSocket API for integration with Magnum Opus (frontend) and Zyeute (backend).

## Quick Start

### 1. Install Dependencies

```bash
cd colony-kernel
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)

```bash
export COLONY_ENV=dev
export COLONY_PORT=8000
export MAX_CONCURRENT_TASKS=4
export WORKER_HEARTBEAT_INTERVAL=120
```

### 3. Start the Kernel

```bash
python -m colonyos.main
```

Or using the entry point:
```bash
colonyos
```

### 4. Verify Health

```bash
curl http://localhost:8000/health
```

### 5. Run Simulation (Optional)

In a separate terminal:
```bash
python simulate_hive.py
```

## API Endpoints

### Health & Stats
- `GET /health` - Health check
- `GET /system/stats` - System statistics (kernel, workers, tasks, uptime)

### Tasks
- `POST /tasks` - Create a new task
- `GET /tasks` - List tasks (optional `?status=pending&limit=100`)
- `GET /tasks/{task_id}` - Get task details
- `DELETE /tasks/{task_id}` - Cancel a task

### Workers
- `POST /workers` - Register a new worker
- `GET /workers` - List all workers
- `GET /workers/{worker_id}` - Get worker details
- `POST /workers/{worker_id}/heartbeat` - Update worker heartbeat

### System Management
- `POST /system/checkpoint` - Create system checkpoint
- `POST /system/rollback/{checkpoint_id}` - Rollback to checkpoint
- `GET /system/audit` - Get audit log (optional `?event_type=task_submitted&limit=100`)

### WebSocket
- `WS /ws/events` - Real-time event stream

## WebSocket Events

The WebSocket endpoint streams all events from the kernel's event bus:

```json
{
  "type": "task_submitted",
  "data": {"task_id": "..."},
  "timestamp": "2025-01-20T12:00:00Z",
  "source": "kernel"
}
```

Common event types:
- `kernel_started`
- `task_submitted`
- `task_validated`
- `task_rejected`
- `task_cancelled`
- `worker_registered`
- `worker_heartbeat`

## Integration Points

### Magnum Opus (Frontend)

Update `colony-os-magnum-opus/lib/colony-link.ts`:
```typescript
const COLONY_API_URL = process.env.NEXT_PUBLIC_COLONY_API_URL || "http://localhost:8000";
```

### Zyeute (Backend)

Connect to the kernel via HTTP:
```typescript
const response = await fetch("http://localhost:8000/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    description: "Process video upload",
    priority: 5,
    requirements: { cpu: "medium" },
  }),
});
```

## Architecture

```
┌─────────────────────────────────────────┐
│         ColonyOS Kernel (Python)        │
├─────────────────────────────────────────┤
│  • ColonyKernel (Body)                 │
│  • Neurasphere (Guardian)               │
│  • Neurosphere (Mind)                   │
│  • EventBus (InMemory/Redis)            │
│  • HybridMemory (SQLite/Redis/Vector)   │
└─────────────────────────────────────────┘
           │                    │
           │ REST/WS            │ Events
           ▼                    ▼
    ┌──────────┐         ┌──────────┐
    │ Magnum   │         │  Zyeute  │
    │  Opus    │         │ Backend  │
    └──────────┘         └──────────┘
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COLONY_ENV` | `dev` | Environment (dev/production) |
| `COLONY_PORT` | `8000` | API server port |
| `COLONY_HOST` | `0.0.0.0` | API server host |
| `COLONY_LOG_LEVEL` | `INFO` | Logging level |
| `MAX_CONCURRENT_TASKS` | `4` | Max concurrent tasks |
| `WORKER_HEARTBEAT_INTERVAL` | `120` | Heartbeat timeout (seconds) |
| `COLONY_MEMORY_BACKEND` | `sqlite` | Memory backend (sqlite/redis) |
| `COLONY_EVENT_BUS_TYPE` | `inmemory` | Event bus type (inmemory/redis) |
| `COLONY_SECRET_TOKEN` | - | Secret token for auth (optional) |

## Development

### Running Tests

```bash
pytest
```

### Code Structure

```
colony-kernel/
├── colonyos/
│   ├── api/
│   │   └── rest.py          # FastAPI application
│   ├── body/
│   │   ├── kernel.py        # Main kernel orchestrator
│   │   ├── queue.py         # Task queue
│   │   └── workers.py      # Worker pool
│   ├── core/
│   │   ├── types.py         # Core dataclasses
│   │   ├── event_bus.py     # Event bus
│   │   └── memory.py        # Memory backends
│   ├── guardian/
│   │   └── neurasphere.py  # Safety & consensus
│   ├── mind/
│   │   └── neurosphere.py  # Task routing
│   └── main.py              # Entry point
├── simulate_hive.py         # Simulation script
├── requirements.txt
└── pyproject.toml
```

## Status

✅ **Core Substrate**: Complete  
✅ **REST API**: Complete (Handshake Spec compliant)  
✅ **WebSocket Events**: Complete  
✅ **Worker Management**: Complete  
✅ **Task Lifecycle**: Complete  
✅ **System Checkpoints**: Complete  
✅ **Audit Logging**: Complete  
✅ **Simulation Script**: Complete  

## Next Steps

1. **Magnum Opus Integration**: Update `COLONY_API_URL` to connect frontend
2. **Zyeute Integration**: Wire backend to `/tasks` endpoint
3. **Production Deployment**: Configure Redis for event bus and memory
4. **Monitoring**: Add Prometheus metrics endpoint
5. **Authentication**: Implement token-based auth for production

---

**The Hive is synchronized. The child is breathing.** 🐝✨
