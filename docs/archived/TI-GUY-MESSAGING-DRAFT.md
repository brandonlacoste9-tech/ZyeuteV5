# 🦫 TI-GUY Messaging Area - Complete Draft

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     TI-GUY MESSAGING                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌─────────────────────────────────────────┐  │
│  │  MENU    │  │           CHAT AREA                     │  │
│  │  (DMs,   │  │  ┌─────────────────────────────────┐    │  │
│  │  Groups, │  │  │  Messages (Leather Wallet UI)   │    │  │
│  │  Vault)  │  │  │                                 │    │  │
│  │          │  │  │  🦫 TI-GUY: Salut!              │    │  │
│  │  🔓 2K   │  │  │  👤 User: Merci!                │    │  │
│  │  unlock  │  │  │  🦫 TI-GUY: Je peux t'aider!    │    │  │
│  └──────────┘  │  │                                 │    │  │
│                │  └─────────────────────────────────┘    │  │
│                │                                         │  │
│                │  ┌─────────────────────────────────────┐│  │
│                │  │  INPUT AREA (Belt Buckle Design)    ││  │
│                │  │  [🎙️] [⚜️] [Type... ] [➤]         ││  │
│                │  └─────────────────────────────────────┘│  │
│                └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features Checklist

### ✅ Core Features

- [x] **Leather Wallet UI** - Gold stitching, belt buckle, leather textures
- [x] **Chat Type Menu** - DMs, Groups, Channels, Vault (2K unlock)
- [x] **Ti-Guy AI Chat** - DeepSeek V3 integration
- [x] **Real User Messaging** - Database backend
- [x] **Reactions** - Emoji on messages

### 🔨 To Build (This Draft)

- [ ] **Voice Messages** - Hold to record, playback
- [ ] **File Sharing** - Images, videos, documents
- [ ] **Real-time** - WebSocket live updates
- [ ] **Encryption** - E2E secure mode
- [ ] **Ephemeral** - Auto-destruct messages
- [ ] **Search** - Find messages in chat

---

## Component Structure

```
frontend/src/components/chat/
├── ChatLayout.tsx           # Main layout wrapper
├── ChatTypeMenu.tsx         # Dropdown menu (✅ created)
├── ChatArea.tsx             # Messages display
├── ChatInput.tsx            # Belt buckle input
├── ChatMessage.tsx          # Individual message bubble
├── ChatVoiceRecorder.tsx    # Voice recording
├── ChatFileUploader.tsx     # File sharing
├── ChatEncryptionToggle.tsx # Secure mode switch
├── ChatEphemeralSelector.tsx # Auto-destruct timer
└── index.ts                 # Exports
```

---

## Key Components Draft

### 1. ChatLayout.tsx - Main Container

```tsx
// Leather wallet container with stitching
<div className="chat-layout leather-wallet">
  <ChatTypeMenu userLikes={userLikes} />
  <ChatArea messages={messages} />
  <ChatInput onSend={handleSend} />
</div>

// CSS Variables
--leather-brown: #4a2c1f;
--leather-dark: #2e1a12;
--gold-thread: #b8860b;
--gold-metal: #d4af37;
--stitch-dash: 6px;
```

### 2. ChatArea.tsx - Messages Display

```tsx
// Features:
// - Scrollable message list
// - Date separators
// - Typing indicators
// - Load more (pagination)

<div className="chat-area leather-texture">
  {messages.map((msg) => (
    <ChatMessage
      key={msg.id}
      type={msg.sender === "tiguy" ? "bot" : msg.isMe ? "sent" : "received"}
      content={msg.content}
      timestamp={msg.created_at}
      reactions={msg.reactions}
    />
  ))}
  {isTyping && <TypingIndicator />}
</div>
```

### 3. ChatMessage.tsx - Message Bubble

```tsx
// 3 message types:
// - received: Brown leather, left side
// - sent: Dark leather, right side
// - bot: Purple leather, TI-GUY avatar

<div
  className={cn(
    "message stitched",
    type === "received" && "received",
    type === "sent" && "sent",
    type === "bot" && "bot",
  )}
>
  {type === "bot" && <Avatar>🦫</Avatar>}
  <Content>{content}</Content>
  <Reactions reactions={reactions} />
  <Timestamp>{time}</Timestamp>
</div>
```

### 4. ChatInput.tsx - Belt Buckle Design

```tsx
// Features:
// - Text input with dashed border (stitching)
// - Voice record button (hold)
// - File attach button
// - Send button (gold buckle)
// - Emoji picker

<div className="chat-input belt-design">
  <VoiceButton onHold={startRecording} />

  <div className="belt-buckle">
    <span>⚜️</span>
  </div>

  <div className="input-field stitched">
    <input placeholder="Écris à Ti-Guy..." />
  </div>

  <SendButton>➤</SendButton>
</div>
```

### 5. ChatVoiceRecorder.tsx - Voice Messages

```tsx
// Features:
// - Hold to record (press & hold mic button)
// - Recording animation (sound waves)
// - Playback with progress bar
// - Cancel on slide left

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    // ... record logic
  };

  return (
    <div className={cn("voice-recorder", isRecording && "recording")}>
      {isRecording ? <RecordingWaveform duration={duration} /> : <MicButton />}
    </div>
  );
};
```

### 6. ChatFileUploader.tsx - File Sharing

```tsx
// Features:
// - Image upload (camera/gallery)
// - Video upload
// - Document upload (PDF, etc.)
// - Preview before send
// - Upload progress

const FileUploader = ({ onUpload }) => {
  const handleFile = async (file: File) => {
    // Upload to Supabase/S3
    const url = await uploadFile(file);
    onUpload({ type: file.type, url });
  };

  return (
    <div className="file-uploader">
      <input type="file" accept="image/*,video/*" onChange={handleFile} />
      <ImagePreview />
      <UploadProgress />
    </div>
  );
};
```

---

## State Management

```typescript
// Chat State
interface ChatState {
  // Current view
  activeChatType: "tiguy" | "dms" | "groups" | "channels" | "vault";
  activeConversation: string | null;

  // Messages
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;

  // Input
  inputText: string;
  attachments: Attachment[];

  // Recording
  isRecording: boolean;
  recordingDuration: number;

  // Settings
  isEncrypted: boolean;
  ephemeralDuration: number; // 0 = off, 10s, 1m, 5m, 1h, 24h

  // UI
  isTyping: boolean;
  showEmojiPicker: boolean;
  searchQuery: string;
}
```

---

## API Integration

```typescript
// messagingService.ts (already created)

// Get conversations
GET /api/messaging/conversations

// Get messages
GET /api/messaging/conversations/:id/messages

// Send message
POST /api/messaging/conversations/:id/messages
{
  content: string,
  type: 'text' | 'image' | 'video' | 'audio',
  mediaUrl?: string,
  ephemeralDuration?: number
}

// Ti-Guy AI
POST /api/tiguy/chat
{
  message: string
}
```

---

## 2K Likes Unlock System

```typescript
// Unlock milestones
const UNLOCKS = {
  0: ["tiguy", "dms", "groups"], // Free
  2000: ["channels", "vault"], // Premium
};

// Check unlock
const isUnlocked = (feature: string, userLikes: number) => {
  if (UNLOCKS[0].includes(feature)) return true;
  if (userLikes >= 2000) return true;
  return false;
};

// Show progress
const progress = Math.min((userLikes / 2000) * 100, 100);
```

---

## CSS Styles (Key Classes)

```css
/* Leather Wallet Base */
.leather-wallet {
  background: linear-gradient(180deg, #3d2316 0%, #2e1a12 100%);
  border: 4px solid #2e1a12;
  border-radius: 30px;
}

/* Gold Stitching */
.stitched {
  position: relative;
}
.stitched::before {
  content: "";
  position: absolute;
  inset: 4px;
  border: 2px dashed #b8860b;
  border-radius: inherit;
  opacity: 0.6;
  pointer-events: none;
}

/* Message Types */
.message.received {
  background: linear-gradient(145deg, #8c5e35, #6b4226);
  border-bottom-left-radius: 5px;
  align-self: flex-start;
}

.message.sent {
  background: linear-gradient(145deg, #5c3a21, #3d2314);
  border-bottom-right-radius: 5px;
  align-self: flex-end;
}

.message.bot {
  background: linear-gradient(145deg, #5e2c73, #3a1848);
  border-bottom-left-radius: 5px;
}

/* Belt Buckle */
.belt-buckle {
  width: 70px;
  height: 60px;
  background: linear-gradient(145deg, #d4af37, #a8860b);
  border-radius: 10px;
  border: 2px solid #f4d03f;
  display: flex;
  align-items: center;
  justify-content: center;
}
.belt-buckle::after {
  content: "⚜️";
  font-size: 28px;
}
```

---

## Next Steps to Build

### Phase 1: Foundation (Day 1)

1. ✅ Create ChatLayout wrapper
2. ✅ Integrate ChatTypeMenu
3. ✅ Style ChatArea with leather theme
4. ✅ Build ChatInput with belt buckle

### Phase 2: Messaging (Day 2)

5. Connect to messaging API
6. Load real conversations
7. Send/receive messages
8. Real-time with WebSocket

### Phase 3: Features (Day 3)

9. Voice recording
10. File uploads
11. Reactions
12. Search messages

### Phase 4: Polish (Day 4)

13. Encryption toggle
14. Ephemeral messages
15. Animations
16. Mobile responsive

---

## Files to Create

```
✅ ChatTypeMenu.tsx (done)
📁 ChatLayout.tsx
📁 ChatArea.tsx
📁 ChatMessage.tsx
📁 ChatInput.tsx
📁 ChatVoiceRecorder.tsx
📁 ChatFileUploader.tsx
📁 ChatEncryptionToggle.tsx
📁 chat.styles.css (all leather styles)
```

---

**Ready to build? Pick a component and I'll write the full code!** 🚀
