# Dialogflow Webhook: Voice-First Video Search

**Status:** 🟢 Ready  
**Credits:** Uses Dialogflow CX credits ($813.16)  
**Feature:** Ti-Guy can search videos via voice commands

---

## How It Works

### User Flow

1. **User speaks:** _"Ti-Guy, trouve-moi des vidéos de motoneige à Gaspé."_
2. **Dialogflow CX:** Uses **Audio Session credit** ($0.0065/15sec) to transcribe and detect intent
3. **Webhook Call:** Dialogflow calls `/api/dialogflow/webhook` with intent `search_videos` and parameters
4. **Backend:** Webhook handler searches Zyeuté database for matching videos
5. **Ti-Guy replies:** _"J'ai trouvé 5 vidéos pour 'motoneige à Gaspé'! Je t'affiche ça maintenant."_
6. **Frontend:** Receives payload with video results and displays them

---

## Supported Intents

### 1. `search_videos` / `find_videos`

**User says:**

- _"Trouve-moi des vidéos de [query]"_
- _"Cherche [query]"_
- _"Montre-moi [query]"_

**Parameters:**

- `query` - Search term (e.g., "motoneige", "poutine", "hockey")
- `location` - Optional location filter (e.g., "Gaspé", "Montréal")
- `limit` - Number of results (default: 10)

**Webhook Response:**

```json
{
  "fulfillmentResponse": {
    "messages": [
      {
        "text": {
          "text": ["J'ai trouvé 5 vidéos pour 'motoneige à Gaspé'!"]
        }
      }
    ],
    "payload": {
      "action": "show_videos",
      "videos": [
        {
          "id": "post-123",
          "caption": "Motoneige à Gaspé",
          "mediaUrl": "https://...",
          "location": "Gaspé",
          "reactionsCount": 42
        }
      ],
      "query": "motoneige à Gaspé",
      "count": 5
    }
  }
}
```

---

### 2. `show_montreal_videos`

**User says:**

- _"Montre-moi les vidéos de Montréal"_
- _"Vidéos de Mtl"_
- _"Contenu montréalais"_

**Webhook Response:**

- Filters posts by location containing "Montreal" or "Montréal"
- Returns videos with Montreal-specific content

---

### 3. `show_feed`

**User says:**

- _"Montre-moi le feed"_
- _"Ouvre le feed"_

**Webhook Response:**

```json
{
  "fulfillmentResponse": {
    "messages": [
      {
        "text": {
          "text": ["Je t'ouvre le feed maintenant!"]
        }
      }
    ],
    "payload": {
      "action": "navigate",
      "route": "/feed"
    }
  }
}
```

---

## Credit Usage Breakdown

| Action               | Credit Type   | Cost             | Example                              |
| -------------------- | ------------- | ---------------- | ------------------------------------ |
| **Audio Input**      | Audio Session | $0.0065 / 15 sec | User speaks for 10 seconds = $0.0043 |
| **Intent Detection** | Text Session  | $0.002 / request | Dialogflow detects intent            |
| **Webhook Call**     | Free          | $0               | Backend processes search             |
| **Audio Output**     | Audio Session | Included         | Ti-Guy replies                       |

**Total per voice search:** ~$0.006-0.01  
**With $813.16:** ~80,000+ voice searches

---

## Frontend Integration

### Handle Webhook Payload

```typescript
// In your voice component or Dialogflow response handler
const handleDialogflowResponse = (response: any) => {
  const payload = response.payload;

  if (payload.action === "show_videos") {
    // Display video results
    setSearchResults(payload.videos);
    setSearchQuery(payload.query);
    navigate("/search", { state: { videos: payload.videos } });
  } else if (payload.action === "navigate") {
    // Navigate to route
    navigate(payload.route);
  }
};
```

### Example: Voice Search Component

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function VoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const handleVoiceCommand = async (audioBlob: Blob) => {
    // Send audio to Dialogflow CX
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const response = await fetch("/api/dialogflow/tiguy", {
      method: "POST",
      body: JSON.stringify({
        message: "", // Will be transcribed from audio
        userId: currentUser.id,
        audio: await audioBlob.arrayBuffer(),
      }),
    });

    const data = await response.json();

    // Handle webhook payload if present
    if (data.action === "show_videos") {
      navigate("/search", { state: { videos: data.videos } });
    } else if (data.action === "navigate") {
      navigate(data.route);
    }
  };

  return (
    <button onClick={startListening}>
      {isListening ? "🎤 Listening..." : "🎤 Search Videos"}
    </button>
  );
}
```

---

## Testing the Webhook

### 1. Test with cURL

```bash
curl -X POST https://zyeute-api.onrender.com/api/dialogflow/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "detectIntentResponse": {
      "queryResult": {
        "intent": {
          "displayName": "search_videos"
        },
        "parameters": {
          "fields": {
            "query": {
              "stringValue": "motoneige à Gaspé"
            }
          }
        }
      },
      "session": "test-session-123"
    }
  }'
```

### 2. Test in Dialogflow Console

1. Go to **Dialogflow CX Console** → **Test Agent**
2. Type: _"Trouve-moi des vidéos de motoneige à Gaspé"_
3. Verify webhook is called
4. Check response includes video payload

---

## Advanced: Enhanced Search

### Vector Search Integration

For better semantic search, enhance the webhook to use vector embeddings:

```typescript
// In dialogflow-webhook.ts
import { generateEmbedding } from "./ai/vertex-service.js";

// Generate embedding for query
const queryEmbedding = await generateEmbedding(query);

// Use vector search instead of text match
const posts = await storage.getSmartRecommendations(queryEmbedding, limit);
```

### Location-Based Filtering

Enhance location search with geospatial queries:

```typescript
// Use getNearbyPosts for location-based search
if (location) {
  const coords = await geocodeLocation(location); // Get lat/lon
  posts = await storage.getNearbyPosts(coords.lat, coords.lon, 50000); // 50km radius
}
```

---

## Success Criteria

✅ **Webhook endpoint** responds to Dialogflow CX calls  
✅ **Video search** returns relevant results  
✅ **Ti-Guy voice** replies with video count  
✅ **Frontend** displays video results from payload  
✅ **Dialogflow CX credits** showing usage in billing dashboard

---

**Ti-Guy can now search videos via voice commands using Dialogflow CX credits!** 🎤🎥
