# 🚀 Starting the ColonyOS Kernel

## Quick Start

```bash
# Navigate to kernel directory
cd colony-kernel

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the kernel
python -m colonyos.main
```

The kernel will start on `http://localhost:8000` by default.

## Verify It's Running

```bash
# Check health
curl http://localhost:8000/health

# Check system stats
curl http://localhost:8000/system/stats
```

## Generate Live Traffic (Optional)

In a separate terminal:

```bash
cd colony-kernel
python simulate_hive.py
```

This will:
- Register 3 mock workers
- Send heartbeats every 5 seconds
- Submit random tasks every 10 seconds
- Run for 5 minutes (configurable)

## Environment Variables

Create a `.env` file or export:

```bash
export COLONY_ENV=dev
export COLONY_PORT=8000
export MAX_CONCURRENT_TASKS=4
export WORKER_HEARTBEAT_INTERVAL=120
```

## Troubleshooting

**Port already in use?**
```bash
export COLONY_PORT=8001
```

**Python version?**
```bash
python --version  # Should be 3.11+
```

**Dependencies missing?**
```bash
pip install -r requirements.txt
```

---

**The heartbeat is ready. Start the pulse.** 🐝✨
