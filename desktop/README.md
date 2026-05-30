# Zyeute Desktop Studio 💻

Creator Studio for Quebec's TikTok - Electron Desktop App

## Features

- 📊 Dashboard with analytics
- 🎬 Content management
- ⬆️ Bulk video upload with drag & drop
- 📈 Performance analytics
- 🔴 Live streaming studio
- 💬 Comment moderation
- ⚜️ Quebec leather aesthetic

## Tech Stack

- Electron
- HTML/CSS/JS
- Node.js

## Setup

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Build for Mac
npm run build:mac

# Build for Windows
npm run build:win
```

## Project Structure

```
desktop/
├── main.js              # Electron main process
├── preload.js           # Preload script
├── package.json         # Dependencies & build config
├── renderer/
│   ├── index.html      # Main UI
│   ├── styles.css      # Quebec leather styling
│   └── app.js          # App logic
└── README.md           # This file
```

## Screens

1. **Dashboard** - Overview stats & recent videos
2. **Content** - Manage all videos
3. **Upload** - Drag & drop video upload
4. **Analytics** - Audience & performance data
5. **Live Studio** - Go live streaming
6. **Comments** - Moderate comments

## Keyboard Shortcuts

- `Cmd/Ctrl + U` - Upload video
- `Cmd/Ctrl + 1-4` - Switch sections
- `Cmd/Ctrl + L` - Go live

## Next Steps

- [ ] Connect to backend API
- [ ] Real-time analytics
- [ ] Live streaming implementation
- [ ] Multi-account support
- [ ] Scheduling posts

🐝⚜️
