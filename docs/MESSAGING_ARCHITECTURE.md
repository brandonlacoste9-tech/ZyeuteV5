# Zyeuté Messaging Architecture - Complete System

## ✅ Already Implemented

### 1. Media Storage (Object Storage Pattern)

**Files:**
- `backend/routes/messaging.ts` - Upload endpoints
- `frontend/src/components/features/ChatMediaUploader.tsx` - Client upload
- `frontend/src/api/messaging.ts` - `uploadChatFile()` function

**Flow:**
```
1. Client requests presigned URL (or uploads via multipart)
2. Client uploads directly to Supabase/S3
3. Client sends message with mediaKey/reference
4. WebSocket broadcasts metadata only (no blobs)
5. Clients fetch from CDN
```

**Message Structure:**
```typescript
{
  id: string,
  contentType: "image" | "video" | "voice" | "file",
  contentUrl: "https://cdn.zyeute.com/...",  // Storage URL
  contentMetadata: {
    size: number,
    width?: number,
    height?: number,
    duration?: number,
    mimeType: string
  }
}
```

### 2. Offline Message Delivery

**Files:**
- `backend/websocket/gateway.ts` - WebSocket with Redis adapter
- `frontend/src/hooks/useWebSocket.ts` - Client connection
- `backend/routes/messaging.ts` - `GET /conversations/:id/messages?before=`

**Features:**
- ✅ Server as source of truth (PostgreSQL)
- ✅ WebSocket for online users (real-time)
- ✅ HTTP polling fallback for offline/sync
- ✅ `lastReadMessageId` tracking per participant
- ✅ Message history with pagination (`before` cursor)

**Offline Flow:**
```
1. Client stores pending messages in local state/IndexedDB
2. Shows "pending" status in UI
3. On reconnect: flush queue via POST /messages
4. Server assigns real IDs
5. WebSocket broadcasts to all participants
6. Client replaces temp IDs with real ones
```

### 3. Read Receipts

**Implementation:**
- Per-user `lastReadMessageId` in `conversation_participants`
- `read_at` timestamp on messages
- WebSocket `message:read` events
- UI shows ✓ / ✓✓ (delivered / read)

### 4. Group Chat Media

**Files:**
- `backend/config/group-chat-migration.sql` - N-participant schema
- `backend/routes/group-chat.ts` - Group management

**Features:**
- Media scoped to `conversation_id`
- Member permissions (owner/admin/member)
- System messages for joins/leaves

### 5. TI-GUY in Groups

**Files:**
- `backend/ai/tiguy-dialogflow.ts` - AI integration
- `backend/ai/tiguy-cost-monitor.ts` - Spending protection

**Behavior:**
- TI-GUY is a regular participant (user ID: `00000000-0000-0000-0000-000000000001`)
- Responds to @mentions or all messages in AI-enabled groups
- Uses same media pipeline for generated content

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client A      │◄───►│   WebSocket     │◄───►│   Client B      │
│  (Online)       │     │   Gateway       │     │  (Online)       │
└────────┬────────┘     │   (Redis)       │     └────────┬────────┘
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              │   PostgreSQL    │              │
         └─────────────►│   (Messages)    │◄─────────────┘
                        └─────────────────┘
                                │
                        ┌───────┴───────┐
                        │  Supabase/S3  │
                        │  (Media Store)│
                        └───────────────┘
```

## Data Flow

### Sending a Media Message

1. **Upload Phase:**
   ```
   Client → POST /upload/chat-file (multipart)
   Server → Returns { url, metadata }
   Client → Uploads to S3/Supabase
   ```

2. **Message Phase:**
   ```
   Client → POST /conversations/:id/messages
          { type: "image", contentUrl, contentMetadata }
   Server → Saves to DB
   Server → broadcastMessage(io, conversationId, message)
   WebSocket → All online participants receive `message:new`
   ```

3. **Offline Sync:**
   ```
   Offline Client → Reconnects
   Client → GET /conversations/:id/messages?after=lastSeenId
   Server → Returns missed messages
   Client → Merges into local store
   ```

## API Endpoints

### Media
```
POST /api/upload/chat-file        # Upload file, returns URL
POST /api/conversations/:id/upload # Get presigned URL
```

### Messages
```
GET  /api/conversations/:id/messages?before=&limit=  # Paginated history
POST /api/conversations/:id/messages                 # Send message
```

### WebSocket Events
```
message:new       # New message received
message:updated   # Status changed (read/delivered)
message:read      # Read receipt
member:joined     # New group member
member:left       # Member left group
```

## Environment Variables

```bash
# Storage
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
S3_BUCKET=zyeute-media

# WebSocket
REDIS_URL=redis://localhost:6379

# AI
DIALOGFLOW_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=...
```

## What's Production-Ready

✅ Media upload with progress  
✅ WebSocket real-time delivery  
✅ Offline sync with pagination  
✅ Read receipts  
✅ Group chat with permissions  
✅ TI-GUY AI integration  
✅ Cost monitoring ($800 cap)  
✅ Slack/email alerts  

## Next Steps (Optional Enhancements)

1. **Client-side IndexedDB** for offline queue persistence
2. **Thumbnail generation** worker for images/videos
3. **Push notifications** for fully offline users
4. **E2E encryption** (Signal Protocol or similar)
5. **Media CDN** with signed URLs for security
