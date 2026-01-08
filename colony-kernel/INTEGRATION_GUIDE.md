# ColonyOS Kernel Integration Guide

This guide shows how to connect **Magnum Opus** (frontend) and **Zyeute** (backend) to the ColonyOS Kernel.

## Magnum Opus Integration

### Step 1: Update Colony Link Configuration

Edit `colony-os-magnum-opus/lib/colony-link.ts`:

```typescript
// Change from:
const COLONY_API_URL = process.env.NEXT_PUBLIC_COLONY_API_URL || 'http://localhost:10000';

// To:
const COLONY_API_URL = process.env.NEXT_PUBLIC_COLONY_API_URL || 'http://localhost:8000';
```

### Step 2: Update Environment Variables

Add to `colony-os-magnum-opus/.env.local`:

```bash
NEXT_PUBLIC_COLONY_API_URL=http://localhost:8000
```

### Step 3: Connect WebSocket Events

The ColonyOS Kernel uses FastAPI WebSockets (not Socket.IO). You'll need to adapt `colony-link.ts` to use native WebSocket:

```typescript
// Example WebSocket connection to ColonyOS Kernel
class ColonyKernelLink {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const wsUrl = COLONY_API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    this.ws = new WebSocket(`${wsUrl}/ws/events`);

    this.ws.onopen = () => {
      console.log('🧠 Connected to ColonyOS Kernel');
      this.reconnectAttempts = 0;
      // Send ping to keep connection alive
      setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('ping');
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      
      try {
        const event = JSON.parse(event.data);
        // Handle kernel events
        this.handleKernelEvent(event);
      } catch (e) {
        console.error('Failed to parse kernel event:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from ColonyOS Kernel');
      this.reconnect();
    };
  }

  private handleKernelEvent(event: { type: string; data: any; timestamp: string; source: string }) {
    // Map kernel events to Magnum Opus events
    switch (event.type) {
      case 'task_submitted':
        // Update Neurosphere with new task
        break;
      case 'worker_registered':
        // Update HiveField with new worker
        break;
      case 'worker_heartbeat':
        // Update worker status in SensoryCortex
        break;
      // ... handle other event types
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }
}
```

### Step 4: Fetch System Stats

Update `components/SensoryCortex.tsx` to poll `/system/stats`:

```typescript
useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch('http://localhost:8000/system/stats');
    const stats = await response.json();
    // Update metrics: stats.kernel, stats.workers, stats.tasks
  };
  
  fetchStats();
  const interval = setInterval(fetchStats, 2000); // Poll every 2s
  return () => clearInterval(interval);
}, []);
```

## Zyeute Integration

### Option A: Direct API Integration (Recommended)

Create a new service `zyeute/backend/services/colony-kernel-client.ts`:

```typescript
import fetch from 'node-fetch';

const COLONY_KERNEL_URL = process.env.COLONY_KERNEL_URL || 'http://localhost:8000';

export interface ColonyTaskRequest {
  description: string;
  priority?: number;
  requirements?: Record<string, any>;
  constraints?: Record<string, any>;
  timeout_seconds?: number;
  tags?: string[];
}

export interface ColonyTaskResponse {
  id: string;
  description: string;
  status: string;
  created_at: string;
  created_by: string;
  assigned_worker?: string;
  result?: any;
  error?: string;
  elapsed_seconds?: number;
}

export class ColonyKernelClient {
  async submitTask(request: ColonyTaskRequest): Promise<ColonyTaskResponse> {
    const response = await fetch(`${COLONY_KERNEL_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`ColonyOS Kernel error: ${response.statusText}`);
    }

    return response.json();
  }

  async getTask(taskId: string): Promise<ColonyTaskResponse> {
    const response = await fetch(`${COLONY_KERNEL_URL}/tasks/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return response.json();
  }

  async registerWorker(name: string, capabilities: Array<{ name: string; category: string }>): Promise<string> {
    const response = await fetch(`${COLONY_KERNEL_URL}/workers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, capabilities }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register worker: ${response.statusText}`);
    }

    const worker = await response.json();
    return worker.id;
  }

  async sendHeartbeat(workerId: string): Promise<void> {
    const response = await fetch(`${COLONY_KERNEL_URL}/workers/${workerId}/heartbeat`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Heartbeat failed: ${response.statusText}`);
    }
  }
}

export const colonyKernelClient = new ColonyKernelClient();
```

### Option B: Update Python Bridge

Modify `zyeute/backend/ai/python-bridge.ts` to use ColonyOS Kernel:

```typescript
import { colonyKernelClient } from '../services/colony-kernel-client.js';

export async function executePythonBee(
  beeId: string,
  task: HiveTask,
): Promise<HiveTaskResult> {
  console.log(`[Python Bridge] Submitting task to ColonyOS Kernel: ${beeId}`);

  try {
    const colonyTask = await colonyKernelClient.submitTask({
      description: `Execute ${task.type} on ${beeId}`,
      priority: task.priority === 10 ? 9 : 5,
      requirements: {
        beeId,
        capability: task.type,
      },
      constraints: task.payload.constraints || {},
      tags: [beeId, task.type],
    });

    // Poll for completion
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      
      const status = await colonyKernelClient.getTask(colonyTask.id);
      
      if (status.status === 'completed') {
        return {
          taskId: task.id,
          success: true,
          data: status.result,
          metadata: {
            beeId,
            colonyTaskId: colonyTask.id,
            executionTime: status.elapsed_seconds || 0,
          },
        };
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Task failed');
      }
      
      attempts++;
    }

    throw new Error('Task timeout');
  } catch (error: any) {
    console.error(`[Python Bridge] Task failed:`, error);
    return {
      taskId: task.id,
      success: false,
      error: error.message,
    };
  }
}
```

### Step 3: Register Zyeute Workers

In `zyeute/backend/index.ts`, register workers with ColonyOS Kernel:

```typescript
import { colonyKernelClient } from './services/colony-kernel-client.js';
import { BEE_REGISTRY } from './ai/bee-registry.js';

async function registerWorkersWithKernel() {
  for (const [beeId, bee] of Object.entries(BEE_REGISTRY)) {
    try {
      const workerId = await colonyKernelClient.registerWorker(
        bee.name,
        bee.capabilities.map(cap => ({
          name: cap,
          category: bee.core,
        }))
      );
      
      console.log(`✅ Registered ${bee.name} with ColonyOS Kernel (ID: ${workerId})`);
      
      // Start heartbeat loop
      setInterval(() => {
        colonyKernelClient.sendHeartbeat(workerId).catch(console.error);
      }, 30000); // Every 30 seconds
    } catch (error) {
      console.error(`❌ Failed to register ${bee.name}:`, error);
    }
  }
}

// Call after kernel initialization
if (process.env.COLONY_KERNEL_URL) {
  registerWorkersWithKernel();
}
```

## Environment Variables

### Magnum Opus
```bash
NEXT_PUBLIC_COLONY_API_URL=http://localhost:8000
```

### Zyeute
```bash
COLONY_KERNEL_URL=http://localhost:8000
```

## Testing Integration

1. **Start ColonyOS Kernel**:
   ```bash
   cd colony-kernel
   python -m colonyos.main
   ```

2. **Verify Health**:
   ```bash
   curl http://localhost:8000/health
   ```

3. **Run Simulation** (optional):
   ```bash
   python simulate_hive.py
   ```

4. **Start Magnum Opus**:
   ```bash
   cd colony-os-magnum-opus
   npm run dev
   ```

5. **Start Zyeute Backend**:
   ```bash
   cd zyeute
   npm run dev
   ```

## Event Mapping

| ColonyOS Kernel Event | Magnum Opus Action | Zyeute Action |
|----------------------|-------------------|---------------|
| `task_submitted` | Update Neurosphere | Log task creation |
| `task_completed` | Update task status | Process result |
| `worker_registered` | Add to HiveField | Track worker |
| `worker_heartbeat` | Update worker status | Update metrics |
| `kernel_started` | Initialize connection | Log kernel ready |

## Next Steps

1. ✅ Update Magnum Opus `COLONY_API_URL`
2. ✅ Create Zyeute ColonyOS Kernel client
3. ✅ Register Zyeute workers with kernel
4. ⏳ Implement WebSocket event handlers
5. ⏳ Add error handling and retry logic
6. ⏳ Set up production environment variables

---

**The Fiberoptic Cable is ready. Connect the strands.** 🐝✨
