# ColonyOS Kernel Activation Checklist

**Status**: ✅ Kernel Operational  
**Next Phase**: Integration & Activation

## Pre-Activation Verification

- [x] Kernel starts successfully on port 8000
- [x] `/health` endpoint responds
- [x] `/system/stats` returns valid JSON
- [x] WebSocket `/ws/events` accepts connections
- [x] `simulate_hive.py` generates observable traffic

## Phase 1: Magnum Opus Pulse Activation

### Step 1.1: Update Environment Configuration
- [ ] Edit `colony-os-magnum-opus/.env.local`
- [ ] Set `NEXT_PUBLIC_COLONY_API_URL=http://localhost:8000`
- [ ] Verify environment variable is loaded

### Step 1.2: Update Colony Link
- [ ] Edit `colony-os-magnum-opus/lib/colony-link.ts`
- [ ] Change default URL from `http://localhost:10000` to `http://localhost:8000`
- [ ] Adapt WebSocket connection (FastAPI WebSocket, not Socket.IO)
- [ ] Test connection on page load

### Step 1.3: Connect Neurosphere to Events
- [ ] Update `components/Neurosphere.tsx` to subscribe to kernel events
- [ ] Map kernel events to 3D node states:
  - `task_submitted` → Node activation
  - `worker_registered` → New node creation
  - `worker_heartbeat` → Node pulse animation
  - `task_completed` → Node completion state
- [ ] Verify real-time updates in Neurosphere

### Step 1.4: Connect Sensory Cortex to Stats
- [ ] Update `components/SensoryCortex.tsx` to poll `/system/stats`
- [ ] Map stats to metrics:
  - `kernel.queue_size` → Neural Throughput
  - `workers.total` → Swarm Coherence
  - `tasks.total` → Memory Utilization
  - `uptime_seconds` → Cognitive Load
- [ ] Set polling interval to 2 seconds
- [ ] Verify live metric updates

## Phase 2: Zyeute Orchestration Integration

### Step 2.1: Create Colony Kernel Client
- [ ] Create `zyeute/backend/services/colony-kernel-client.ts`
- [ ] Implement `submitTask()`, `getTask()`, `registerWorker()`, `sendHeartbeat()`
- [ ] Add error handling and retry logic
- [ ] Add TypeScript types matching kernel API

### Step 2.2: Register Zyeute Workers
- [ ] Update `zyeute/backend/index.ts`
- [ ] Add worker registration loop on startup
- [ ] Register all bees from `BEE_REGISTRY` with kernel
- [ ] Start heartbeat loops for each worker (30s interval)
- [ ] Verify workers appear in `/workers` endpoint

### Step 2.3: Route Tasks Through Kernel
- [ ] Update `zyeute/backend/ai/python-bridge.ts`
- [ ] Replace `colony_tasks` DB queue with kernel API calls
- [ ] Implement task polling for completion
- [ ] Add timeout handling (5 minute max)
- [ ] Test task submission and completion flow

### Step 2.4: Connect Synapse Bridge Events
- [ ] Update `zyeute/backend/colony/synapse-bridge.ts`
- [ ] Subscribe to kernel WebSocket events
- [ ] Map kernel events to Synapse events:
  - `task_submitted` → `colony.task.submitted`
  - `worker_registered` → `colony.worker.registered`
  - `task_completed` → `colony.task.completed`
- [ ] Verify cross-hive event propagation

## Phase 3: Cognitive Expansion (Codex Integration)

### Step 3.1: Dream Expansion Tasks
- [ ] Update `colony-os-magnum-opus/components/Codex.tsx`
- [ ] Add "Expand Dream" button that submits to kernel
- [ ] Create task with description: "Expand dream: {dream_id}"
- [ ] Poll for task completion
- [ ] Update Codex with expanded content

### Step 3.2: Task Estimation & Polishing
- [ ] Update `components/HiveMind.tsx`
- [ ] Route `estimateTask()` and `polishTask()` through kernel
- [ ] Submit tasks with `tags: ["estimation"]` or `tags: ["polishing"]`
- [ ] Display task status in Kanban board
- [ ] Update task card when completed

## Verification Tests

### Test 1: Kernel Health
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "timestamp": "...", "version": "0.1.0"}
```

### Test 2: Worker Registration
```bash
curl -X POST http://localhost:8000/workers \
  -H "Content-Type: application/json" \
  -d '{"name": "TestWorker", "capabilities": [{"name": "test", "category": "test"}]}'
# Expected: Worker ID and details
```

### Test 3: Task Submission
```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"description": "Test task", "priority": 5}'
# Expected: Task ID and status
```

### Test 4: WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/events');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Event:', JSON.parse(e.data));
// Expected: Connection established, events received
```

### Test 5: System Stats
```bash
curl http://localhost:8000/system/stats
# Expected: Kernel, workers, tasks, uptime statistics
```

## Success Criteria

- [ ] Magnum Opus Neurosphere shows live kernel events
- [ ] Sensory Cortex displays real-time system metrics
- [ ] Zyeute workers registered and sending heartbeats
- [ ] Tasks submitted from Zyeute complete successfully
- [ ] Codex can expand dreams via kernel tasks
- [ ] HiveMind Kanban board shows kernel task status
- [ ] WebSocket events stream to all connected clients
- [ ] No errors in kernel logs during normal operation

## Troubleshooting

### Kernel Not Starting
- Check Python version (3.11+)
- Verify dependencies: `pip install -r requirements.txt`
- Check port 8000 is not in use
- Review kernel logs for errors

### WebSocket Connection Fails
- Verify kernel is running: `curl http://localhost:8000/health`
- Check CORS settings in `api/rest.py`
- Verify WebSocket URL uses `ws://` not `http://`
- Check browser console for connection errors

### Workers Not Registering
- Verify `COLONY_KERNEL_URL` environment variable
- Check network connectivity to kernel
- Review kernel logs for registration errors
- Verify worker capabilities format matches API spec

### Tasks Not Completing
- Check worker heartbeat status
- Verify task requirements match worker capabilities
- Review kernel logs for task execution errors
- Check task timeout settings

## Next Steps After Activation

1. **Production Deployment**
   - Configure Redis for event bus and memory
   - Set up authentication tokens
   - Add Prometheus metrics endpoint
   - Configure load balancing

2. **Monitoring & Observability**
   - Set up Grafana dashboards
   - Configure alerting rules
   - Add distributed tracing
   - Monitor worker health

3. **Advanced Features**
   - Implement task retry logic
   - Add task prioritization algorithms
   - Create worker capability matching
   - Build consensus voting UI

---

**The Hive is synchronized. The child is breathing. Activate the pulse.** 🐝✨
