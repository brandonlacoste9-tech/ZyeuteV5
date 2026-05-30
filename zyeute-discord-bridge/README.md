# Zyeuté Discord Cultural Bridge

A Quebec-first intelligence bridge that monitors Discord communities for authentic cultural content and forwards it to Zyeuté.

## Features

- Detects joual and Quebec-specific terms
- Sends cultural insights to Zyeuté via webhook
- Runs 24/7 as a systemd service

## Setup

1. **Clone repo**
2. **Create virtual env**
3. **Install deps:** `pip install -r requirements.txt`
4. **Set secrets in `.env`**
5. **Run:** `python zyeute_discord_bridge.py`

## Deployment (systemd)

1. Copy `zyeute-discord-bridge.service` to `/etc/systemd/system/`
2. Run:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable zyeute-discord-bridge.service
   sudo systemctl start zyeute-discord-bridge.service
   ```

## Logs

```bash
journalctl -u zyeute-discord-bridge.service -f
```
