# 🎬 Vertical Feed Integration Plan

**Status:** Planning Phase  
**Source:** Next.js Feed System → React/Vite/Express Adaptation  
**Target:** Production-Ready Vertical Feed with Gestures & Realtime

---

## 📋 ARCHITECTURE MAPPING

### **Source (Next.js) → Target (React/Vite/Express)**

| Component | Next.js | React/Vite/Express | Status |
|-----------|---------|-------------------|--------|
| **Routing** | App Router | React Router | ✅ Already using |
| **API Routes** | `/api/videos/[id]/fire` | Express routes | ✅ `/api/posts/:id/fire` exists |
| **Client** | `createClientComponentClient` | Existing `supabase` client | ✅ Already exists |
| **Query** | TanStack Query | TanStack Query | ✅ Already installed |
| **Types** | Custom `Video` type | Existing `Post` & `User` types | ⚠️ Need to adapt |
| **Table** | `videos` / `post_fire` | `publications` / `reactions` | ⚠️ Need to map |
| **Components** | New components | Enhance existing | ⚠️ Reuse `SingleVideoView` |

---

## 🎯 IMPLEMENTATION STRATEGY

### **Phase 1: Backend API Routes (Express)**

#### 1.1 Fire Reaction Routes ✅ (Already Exists)
- ✅ `POST /api/posts/:id/fire` - Toggle fire reaction
- ⚠️ **Enhancement Needed:** Return `{ added: boolean, fire_count: number }` consistently

#### 1.2 Not Interested Route ❌ (New)
**File:** `zyeute/backend/routes.ts`
**Location:** Add after fire reaction route (line ~854)

```typescript
// POST /api/posts/:id/not-interested
app.post("/api/posts/:id/not-interested", requireAuth, async (req, res) => {
  // Insert into new table: post_not_interested
  // Table structure: id, user_id, post_id, created_at
  // Returns: { success: true }
});
```

**Database Migration Needed:**
- Create `post_not_interested` table in Supabase
- Add indexes on `user_id` and `post_id`

#### 1.3 Feed Videos Endpoint ❌ (New)
**File:** `zyeute/backend/routes.ts`
**Endpoint:** `GET /api/feed/videos`

**Purpose:** Paginated feed of completed videos with user reactions

**Query Params:**
- `page` (default: 0)
- `limit` (default: 10)

**Response:**
```typescript
{
  videos: Post[],
  hasMore: boolean,
  nextPage: number | null
}
```

---

### **Phase 2: Frontend Types & Utilities**

#### 2.1 Type Extensions
**File:** `zyeute/frontend/src/types/index.ts`

**Add to existing `Post` type:**
```typescript
interface Post {
  // ... existing fields ...
  user_has_fired?: boolean; // From reactions table
  job_status?: 'pending' | 'processing' | 'completed' | 'failed';
}
```

#### 2.2 Supabase Helpers
**File:** `zyeute/frontend/src/lib/supabase.ts` (enhance existing)

**Add helpers:**
```typescript
// Get enhanced video URL from media_metadata or fallback
export function getEnhancedVideoUrl(post: Post): string {
  // Check media_metadata.renditions for enhanced path
  // Fallback to enhanced_url or original_url
}

// Get thumbnail URL
export function getThumbnailUrl(post: Post): string {
  // Similar logic for thumbnails
}
```

---

### **Phase 3: Custom Hooks**

#### 3.1 Gesture Hook
**File:** `zyeute/frontend/src/hooks/useGestures.ts` (NEW)

**Adapt from Next.js code:**
- Already React-compatible
- No changes needed to core logic
- Test gesture locking and cooldown

#### 3.2 Feed Videos Hook
**File:** `zyeute/frontend/src/hooks/useFeedVideos.ts` (NEW)

**Implementation:**
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useFeedVideos() {
  return useInfiniteQuery({
    queryKey: ['feed-videos'],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch from Express API: GET /api/feed/videos?page=${pageParam}
      // Or directly from Supabase if preferred
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          user:user_profiles!user_id(*),
          reactions:reactions!reactions_publication_id_idx(user_id)
        `)
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false })
        .range(pageParam * 10, (pageParam + 1) * 10 - 1);

      // Transform to include user_has_fired boolean
      return data.map(post => ({
        ...post,
        user_has_fired: post.reactions?.some(r => r.user_id === user?.id) || false
      }));
    },
    getNextPageParam: (lastPage, pages) => 
      lastPage.length === 10 ? pages.length : undefined,
    initialPageParam: 0,
  });
}
```

#### 3.3 Realtime Job Status Hook
**File:** `zyeute/frontend/src/hooks/useRealtimeJobStatus.ts` (NEW)

**Implementation:**
```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeJobStatus(
  postId: string,
  onStatusChange: (status: string, enhancedUrl?: string) => void
) {
  useEffect(() => {
    const channel = supabase.channel(`post:${postId}:status`);

    channel
      .on('broadcast', { event: 'status' }, ({ payload }) => {
        onStatusChange(payload.status, payload.enhanced_url);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, onStatusChange]);
}
```

---

### **Phase 4: Components**

#### 4.1 Fire Animation Component
**File:** `zyeute/frontend/src/components/feed/FireAnimation.tsx` (NEW)

**Direct copy from Next.js code:**
- Uses Framer Motion (already installed)
- No changes needed

#### 4.2 Enhanced VideoCard Component
**File:** `zyeute/frontend/src/components/feed/VideoCard.tsx` (NEW)

**OR Enhance Existing:**
- Option A: Create new `feed/VideoCard.tsx` specifically for vertical feed
- Option B: Enhance `components/features/SingleVideoView.tsx` to support both modes

**Recommendation:** Option A (separate component for clarity)

**Key Features:**
- Full-screen video player
- Gesture handling integration
- Fire button with animation
- Realtime status indicator
- Mute toggle
- Comment/Share buttons

**Integrates:**
- `useRealtimeJobStatus` hook
- `getEnhancedVideoUrl` helper
- `getThumbnailUrl` helper
- Fire animation on swipe right / double tap

#### 4.3 Vertical Feed Page
**File:** `zyeute/frontend/src/pages/FeedVertical.tsx` (NEW)

**OR Enhance Existing:**
- Option A: Create new `/feed-vertical` route
- Option B: Enhance existing `Player.tsx` page

**Recommendation:** Option A (cleaner separation)

**Key Features:**
- Gesture navigation (swipe up/down)
- Infinite scroll with TanStack Query
- Fire animation on swipe right / double tap
- Skip video on swipe left
- Progress indicators (top dots)
- Preloading next videos

**Route:** `/feed-vertical` or `/feed/:startId?`

---

### **Phase 5: Integration Points**

#### 5.1 Router Updates
**File:** `zyeute/frontend/src/App.tsx`

**Add route:**
```typescript
<Route
  path="/feed-vertical/:startId?"
  element={
    <ProtectedRoute>
      <FeedVertical />
    </ProtectedRoute>
  }
/>
```

#### 5.2 API Service Updates
**File:** `zyeute/frontend/src/services/api.ts`

**Add functions:**
```typescript
export async function firePost(postId: string, add: boolean): Promise<{ added: boolean, fire_count: number }> {
  // Call POST /api/posts/:id/fire (existing)
}

export async function markNotInterested(postId: string): Promise<void> {
  // Call POST /api/posts/:id/not-interested (new)
}
```

#### 5.3 QueryProvider Check
**File:** `zyeute/frontend/src/providers/QueryProvider.tsx`

**Verify:**
- ✅ QueryClient configured
- ✅ QueryClientProvider wraps app
- ✅ Devtools available (optional)

---

## 📊 DATABASE CHANGES

### 1. Create `post_not_interested` Table

**Migration:** `zyeute/migrations/XXXX_create_post_not_interested.sql`

```sql
CREATE TABLE IF NOT EXISTS post_not_interested (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_post_not_interested_user_id ON post_not_interested(user_id);
CREATE INDEX idx_post_not_interested_post_id ON post_not_interested(post_id);
```

### 2. Update Schema Types
**File:** `zyeute/shared/schema.ts`

**Add:**
```typescript
export const postNotInterested = pgTable("post_not_interested", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserPost: unique().on(table.userId, table.postId),
  userIdIdx: index("idx_post_not_interested_user_id").on(table.userId),
  postIdIdx: index("idx_post_not_interested_post_id").on(table.postId),
}));
```

---

## 🔧 DEPENDENCIES CHECK

### Already Installed ✅
- ✅ `@tanstack/react-query` - v5.90.12
- ✅ `framer-motion` - v11.15.0
- ✅ `lucide-react` - v0.545.0
- ✅ `@supabase/supabase-js` - v2.87.1
- ✅ `react-router-dom` - v7.10.1

### No Additional Dependencies Needed ✅

---

## 🚀 IMPLEMENTATION ORDER

### **Step 1: Backend (30 min)**
1. Create `post_not_interested` migration
2. Add Express route: `POST /api/posts/:id/not-interested`
3. Test route with Postman/curl

### **Step 2: Frontend Types & Helpers (20 min)**
1. Add `user_has_fired` to Post type
2. Add `job_status` to Post type
3. Create `getEnhancedVideoUrl` helper
4. Create `getThumbnailUrl` helper

### **Step 3: Custom Hooks (45 min)**
1. Create `useGestures` hook
2. Create `useFeedVideos` hook
3. Create `useRealtimeJobStatus` hook
4. Test each hook independently

### **Step 4: Components (60 min)**
1. Create `FireAnimation` component
2. Create `VideoCard` component (feed-specific)
3. Integrate hooks into VideoCard
4. Test component in isolation

### **Step 5: Feed Page (45 min)**
1. Create `FeedVertical` page component
2. Integrate gesture navigation
3. Add infinite scroll
4. Add fire animations
5. Test full flow

### **Step 6: Integration (30 min)**
1. Add route to `App.tsx`
2. Update API service
3. Test end-to-end
4. Fix edge cases

### **Step 7: Polish (30 min)**
1. Add loading states
2. Add error boundaries
3. Add accessibility attributes
4. Performance optimization

---

## ✅ TEST CHECKLIST

### Backend Tests
- [ ] `POST /api/posts/:id/not-interested` creates record
- [ ] Duplicate requests return success (idempotent)
- [ ] Unauthorized requests return 401
- [ ] Migration creates table correctly

### Frontend Tests
- [ ] Videos load from feed hook
- [ ] Infinite scroll loads more videos
- [ ] Swipe up navigates to next video
- [ ] Swipe down navigates to previous video
- [ ] Swipe right triggers fire animation
- [ ] Double tap triggers fire animation
- [ ] Swipe left skips video
- [ ] Fire button toggles correctly
- [ ] Processing indicator shows for pending videos
- [ ] Realtime updates work when video completes
- [ ] Mute toggle works
- [ ] Tap to play/pause works

---

## 🎨 DESIGN CONSIDERATIONS

### Consistent with Existing UI
- Use existing leather/gold theme
- Match button styles from `SingleVideoView`
- Use existing haptic feedback patterns
- Match animation timing with existing components

### Performance
- Preload next 2-3 videos
- Lazy load images/thumbnails
- Debounce gesture handlers
- Optimize re-renders with React.memo

### Accessibility
- Keyboard navigation support
- Screen reader announcements
- Focus management
- ARIA labels for gestures

---

## 🐛 KNOWN ADAPTATIONS

### 1. Table Name Mapping
- Next.js uses `videos` → Zyeute uses `publications`
- Next.js uses `post_fire` → Zyeute uses `reactions`
- Need to update all queries accordingly

### 2. Type Differences
- Next.js `Video` type → Zyeute `Post` type
- Some fields may need mapping (e.g., `enhanced_url` vs `media_metadata.renditions`)

### 3. API Response Format
- Next.js expects specific shape → Zyeute may have different shape
- May need transformation layer in hooks

### 4. Realtime Channel Naming
- Next.js uses `post:{postId}:status`
- Verify Zyeute uses same pattern (from video pipeline architecture doc)

---

## 📝 NOTES

- **Player.tsx exists** - Consider if we should enhance it or create new component
- **SingleVideoView exists** - Can reuse some logic but need gesture-specific version
- **ContinuousFeed exists** - Different use case (horizontal feed vs vertical)
- **QueryProvider exists** - Verify it's wrapping the app correctly

---

**Ready to proceed with implementation?** 🚀
