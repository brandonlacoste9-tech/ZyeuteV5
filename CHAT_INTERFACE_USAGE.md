# 💬 Zyeuté Messenger - Chat Interface

## 🎨 Design Theme
- **Leather & Gold Stitched** - Louis Vuitton x Québec aesthetic
- Deep brown leather background (#2b1f17)
- Gold accents (#d4af37) with stitching borders
- Fleur-de-lis pattern overlay

## 🚀 Usage

### Basic Usage
```tsx
import { ChatInterface } from "@/components/chat";

function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button onClick={() => setShowChat(true)}>
        Open Chat
      </button>
      
      {showChat && (
        <ChatInterface onClose={() => setShowChat(false)} />
      )}
    </>
  );
}
```

### Integration with Existing Chat Button
Replace your existing `ChatModal` with the new `ChatInterface`:

```tsx
// In your ChatButton.tsx or where you open chat
import { ChatInterface } from "@/components/chat";

// Instead of <ChatModal onClose={...} />
<ChatInterface onClose={() => setIsOpen(false)} />
```

## ✨ Features

### Sidebar Tabs
1. **📜 Historique** - Recent chat conversations
2. **💬 DMs** - Private direct messages
3. **📁 Mes Trucs (My Stuff)** - Files, photos, audio, videos, settings

### My Stuff Submenu
- **📄 Fichiers** - Documents and files
- **🖼️ Photos** - Image gallery grid
- **🎵 Audio** - Voice messages and music
- **🎬 Vidéos** - Video files
- **⚙️ Paramètres** - Chat settings

### Chat Features
- **🎙️ Voice Messages** - Hold microphone button to record
- **📎 File Upload** - Images, videos, documents
- **😀 Emoji Toolbar** - Quick emoji access
- **⚜️ Ti-Guy AI** - Quebec joual-speaking AI assistant

## 🎯 UI Elements

### Header
- Zyeuté logo with fleur-de-lis
- Tab switcher (History / DMs / My Stuff)
- Collapsible sidebar

### Chat Area
- Gold-stitched message bubbles
- User (purple) vs Ti-Guy (gold/amber) colors
- Typing indicators
- Voice waveform animation
- Read receipts (✓✓)

### Input Area
- Hold-to-talk microphone button
- Text input with placeholder "Message Ti-Guy en joual..."
- File attachment button
- Send button with gold gradient

## 🔧 Customization

### Colors
The component uses your existing Tailwind colors:
- Gold: `#d4af37` (use `text-[#d4af37]` or `bg-[#d4af37]`)
- Leather dark: `#2b1f17`
- Leather medium: `#3a2820`
- Leather light: `#e8dcc8`

### Add to Tailwind Config
```js
// tailwind.config.js
colors: {
  leather: {
    900: '#2b1f17',
    800: '#3a2820',
    700: '#4a3530',
    200: '#e8dcc8',
  },
  gold: {
    400: '#d4af37',
    500: '#c4a030',
  }
}
```

## 📱 Responsive
- Full-screen on mobile
- Sidebar collapsible
- Max-width 6xl (1152px) centered

## 🔌 API Integration
Uses existing `tiguyService.sendMessage()` for AI responses.

## 📝 TODO / Future Additions
- [ ] Real file upload to backend
- [ ] Actual voice recording (Web Audio API)
- [ ] Emoji picker component
- [ ] Search functionality
- [ ] Group chats
- [ ] Voice/video calls
- [ ] Message reactions
- [ ] Thread replies
