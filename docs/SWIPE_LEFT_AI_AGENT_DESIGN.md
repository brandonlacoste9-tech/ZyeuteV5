# Swipe Left → AI Agent (Design Suggestion)

**Goal:** A dedicated “whole new window” in the app for **AI agentic capabilities**, opened by **swipe left**. One clear gesture, one clear place for Ti-Guy and agent actions.

---

## 1. Recommendation: Swipe left = full-screen Agent view

**Why this works well**

1. **Swipe left** is easy to discover and remember: “left = Agent” (feed stays as “center,” Agent is one step away).
2. A **full-screen view** feels like a real second “window” and gives room for chat, tools, and future agent actions without crowding the feed. Fits the existing idea of Ti-Guy as the app’s AI; the Agent view is “Ti-Guy’s space.” Return is simple: **swipe right** or **Retour** to go back to the feed.
3. **The “Keyboard Trap” (critical)**  
   - **The problem:** On mobile, the virtual keyboard consumes ~50% of the screen height.  
   - **The failure mode:** In a half-height drawer or sheet, opening the keyboard leaves the user with a tiny “keyhole” (approx. 15–20% of the screen) to view the conversation. Reviewing context while typing becomes impossible. This is a classic mobile UX failure.  
   - **The solution:** The `/agent` route (swipe left) owns 100% of the view height. Even with the keyboard open, the user retains ~50% of the screen for the **StreamView**, so context and usability are maintained.  
   Documenting this rationale protects the decision from anyone trying to bring back the “drawer” idea later.

So: **swipe left from the feed (or from video) → open a full-screen Agent view.** That’s the core suggestion.

---

## 2. Two implementation options

### Option A — New route + full-screen Agent (recommended)

- **Route:** e.g. `/agent` or `/ti-guy`.
- **Entry:** From the feed (or main feed container), a **swipe-left gesture** navigates to `/agent`.
- **Screen:** Full-screen “Agent” view:
  - Chat with Ti-Guy (reuse or extend current ChatModal / Ti-Guy logic).
  - Optional: quick actions (résumer, chercher, suggérer, créer, etc.).
  - Header: title e.g. **Agent** or **Ti-Guy**, Québec Or emblem, **Retour** (or back chevron). All copy in Québec French.
- **Exit:** Swipe right on the Agent view (or tap **Retour**) → navigate back to feed (e.g. `/feed`).
- **Tech:** Gesture on the feed wrapper (e.g. `onSwipeLeft` → `navigate('/agent')`). Agent page is a normal route; no drawer state in the feed.
- **Header:** The `/agent` route **owns its own header** from day one: **Retour**, title (**Agent** or **Ti-Guy**), optional subtle status. That reinforces “new window” / mode switch and avoids feeling like a bare chat panel.

**Pros:** Clear mental model (one place = Agent), good for future expansion (tools, history, settings).  
**Cons:** User leaves the feed (but one swipe back returns).

### Option B — Slide-over drawer (panel)

- **Entry:** Swipe left from feed → a **drawer** slides in from the right (e.g. 85% width or full height).
- **Content:** Same as above (chat + tools), but inside the drawer. Feed stays visible (dimmed) behind.
- **Exit:** Swipe right on the drawer (or tap outside) → drawer closes.

**Pros:** Feed stays on screen; feels lighter.  
**Cons:** Less “whole new window”; drawer can feel cramped on small screens.

**Recommendation:** Prefer **Option A** (full-screen Agent route) for a true “whole new window” and simpler UX. Use Option B only if you want to keep the feed visible at all times.

---

## 3. Where to trigger “swipe left”

- **Primary:** From the **main feed** (e.g. `ContinuousFeed` or the scrollable feed container). When the user swipes left (horizontal gesture from the left edge or from the card area), go to `/agent`.
- **Optional:** From **SingleVideoView** (full-screen video): swipe left could also open Agent (and maybe remember “return to this video” so back goes to the same post). If that conflicts with existing left-swipe (e.g. Ti-Guy insight), either:
  - Reserve **swipe left** for “open Agent” and move the current “Ti-Guy insight” to a tap on an icon, or
  - Keep “swipe left = insight” on the video and only use “swipe left from feed” to open Agent.

---

## 4. Copy (Québec French)

- **Route / title:** **Agent** or **Ti-Guy** (header).
- **Back:** **Retour** or chevron only (aria-label: « Retour au fil »).
- **Placeholder chat:** e.g. **Écris un message…** or **Pose une question à Ti-Guy…**
- **Quick actions (if any):** **Résumer**, **Chercher**, **Suggérer**, **Créer** — keep short, from **`docs/UI_COPY_QUEBEC_FRENCH.md`** or add there.
- Any new strings: add to the UI copy doc and follow the style guide (tu, no English).

---

## 5. Technical hooks

- **Existing:** `ChatButton` + `ChatModal` (Ti-Guy); `TiGuySwarmAdapter`; backend Ti-Guy/colony routes. Reuse for the Agent view chat.
- **New:** Route `/agent` (or `/ti-guy`), page component e.g. `AgentView` or `TiGuyAgentPage` that wraps chat + optional actions; gesture detector on feed that calls `navigate('/agent')` on swipe left.
- **Gesture:** Use existing swipe logic (e.g. similar to `SingleVideoView`) or a small helper (e.g. `useSwipeGesture`) so a clear horizontal left-swipe from the feed triggers navigation.

---

## 6. Summary

| What | Suggestion |
|------|------------|
| **Gesture** | Swipe left (from feed, or from video if you unify) |
| **Result** | Open a **full-screen Agent view** (new route, e.g. `/agent`) |
| **Content** | Ti-Guy chat + optional agent tools; all copy in Québec French |
| **Return** | Swipe right or **Retour** → back to feed |
| **Alternative** | Slide-over drawer from the right if you prefer to keep feed visible |

Implementing **Option A** (full-screen Agent route + swipe left from feed) gives you a clear “whole new window” for AI agentic capabilities and a simple, consistent gesture (swipe left = Agent).

---

## 7. Agent Screen IA: “Today” vs “Tomorrow”

The screen is a **flexible container**, not a hard-coded “Chat View.” If we lock in an iMessage-style layout, we box ourselves in when we add agent tools, memory, or visual widgets. The layout below works for a simple MVP today and accommodates tools/memory in ~6 months without a total redesign.

### 7.1 Zone A: Header (fixed)

- **Status:** Locked per this doc; the `/agent` route owns this.
- **Elements:** **Retour** (left), **Agent / Ti-Guy** or context (center), optional **status indicator** (right or subtext).
- **Evolution:**
  - **Day 1:** Static title (e.g. **Ti-Guy**).
  - **Day 180:** Title can become interactive (e.g. tap → Agent settings, memory constraints, or session context).

### 7.2 Zone B: The “Canvas” (scrollable body)

This is where “6-month” foresight matters most.

- **Day 1 (chat stream):** A linear list of bubbles: user message, agent reply. Familiar, low risk.
- **Day 180 (workspace):**
  - **Zero state:** When the user swipes left, a blank white screen is intimidating. The Canvas should **pull context from the Feed** (the “passive discovery” side). Example: user was on a restaurant review in the feed → Agent Canvas shows a floating chip/card: *« Tu veux que je réserve une table à [Restaurant]? »* (or similar in Québec French). So the first thing they see is *context-aware*, not empty.
  - **Widgets:** The body is not only text bubbles. Reserve a slot for **tool outputs** (map snippet, calendar card, code block, draft) that persist and are actionable, not just a fleeting message.

**Architecture:** Treat the body as a **StreamView**, not a ChatView. The StreamView accepts different **cell types** so we can add kinds of content without rewriting the container:
- **MessageCell** — user or agent text (today’s bubbles).
- **ActionCardCell** — suggested action or tool result (e.g. “Réserver”, “Voir sur la carte”, code block).
- **ContextHeaderCell** — “Chatting about: *Top 10 Hiking Trails*” or “From feed: *[Post title]*”. Renders at top of stream when context was passed from feed.

This keeps the screen from being “chat only” and avoids retrofitting widgets later.

### 7.3 Zone C: Input assembly (fixed bottom)

- **Day 1:** Text field + Send. Sufficient for MVP.
- **Day 180 (multimodal):** Voice (mic), vision (camera), context (attachments). If “swipe left = active intelligence,” the **microphone can be more prominent** than the keyboard (e.g. Gemini Live / voice-first), but that’s a product call; the layout should reserve space for mic + optional camera + text so we don’t redesign the footer when we add modalities.

---

## 8. Context passing (Feed → Agent)

To make “swipe left” feel **magical** rather than just functional, the Agent screen can use **context from the Feed**.

- **Architecture question:** When the user swipes left, does the Agent screen **snapshot** data from the Feed (e.g. current post, topic, or last viewed item)?
  - **If yes:** Pass a small context payload (e.g. `{ postId?, title?, type? }`) when navigating to `/agent`. The Agent view shows a **ContextHeaderCell** at the top of the StreamView (e.g. « En lien avec: *[Post title]* ») and can surface a first **ActionCardCell** (e.g. « Tu veux que je fasse X avec ça? »). Zero state is *contextual*, not blank.
  - **If no:** Every entry is a fresh session; no context banner. Simpler, but no “I was just looking at this” continuity.

**Recommendation:** Support **context passing** from day one in the IA (StreamView + ContextHeaderCell + optional first ActionCard). The feed can pass a minimal payload on `navigate('/agent', { state: { feedContext } })`. If you don’t have backend support for “act on this post” yet, the UI can still show “En lien avec: *[title]*” and a generic “Pose une question à Ti-Guy” so the user knows why they’re here. Backend can later add real actions (reserve, summarize, etc.).

---

## 9. StreamView: minimal data shape (for implementers)

So the Agent screen is not a ChatView but a **StreamView** that accepts multiple cell types. A minimal, future-proof shape:

- **Stream** = ordered list of **items**. Each item has a **type** and a **payload**.
- **Types:** `message` | `action_card` | `context_header`.
- **Payloads:**
  - `message`: `{ role: 'user' | 'agent', content: string, id? }`.
  - `action_card`: `{ title: string, description?: string, actions: { label: string, payload?: unknown }[], id? }` (and optionally `widget` for map/calendar/code).
  - `context_header`: `{ label: string, source?: string, id? }` (e.g. “En lien avec: *Top 10 Hiking Trails*”, source “feed”).

**Day 1:** Only `message` items; render as bubbles. Same UX as chat.  
**Day 180:** Append `context_header` when entry had feed context; append `action_card` when the agent suggests an action or returns a tool result. No change to the container; only new item types and renderers.

---

## 10. StreamView Component API (technical spec)

To support the evolution from “chat” to “workspace,” the Agent screen must not expect a simple array of strings. It consumes a **heterogeneous stream of cells**. The StreamView is the **polymorphic engine** of the Agent screen: the technical reason you need the full screen. A drawer is only acceptable for text-only chat; once the stream holds maps, reservations, code blocks, or dashboards, you need the full canvas.

### 10.1 Data structure (discriminated union)

A single `StreamItem` type; the `type` field tells the renderer which component to use.

```typescript
// 1. The discriminator
export type StreamItemType = 'message' | 'context_header' | 'action_card';

// 2. The payloads
export interface MessagePayload {
  role: 'user' | 'agent' | 'system';
  content: string;
  attachments?: Attachment[];
}

export interface ContextHeaderPayload {
  sourceLabel: string;  // e.g. "En lien avec"
  title: string;       // e.g. "Top 10 Poutine Spots"
  previewUrl?: string;
}

export interface ActionCardPayload {
  id: string;
  title: string;       // e.g. "Restaurant Reservation"
  state: 'pending' | 'success' | 'failed';
  data: unknown;       // Widget data (map, calendar, etc.)
  actions: { label: string; actionId: string; style: string }[];
}

// 3. The union
export type StreamItem =
  | { id: string; type: 'message'; payload: MessagePayload }
  | { id: string; type: 'context_header'; payload: ContextHeaderPayload }
  | { id: string; type: 'action_card'; payload: ActionCardPayload };
```

### 10.2 Renderer logic

The `StreamView` component maps `item.type` → `CellComponent`. This allows injecting complex tools (action cards) into the stream without breaking the chat history. Use a switch or map on `item.type` and render `MessageCell`, `ContextHeaderCell`, or `ActionCardCell` accordingly.

---

## 11. Future considerations (when you’re ready)

- **Edge cases:** Accidental swipes (threshold, dead zone), back-stack behavior (e.g. back from Agent → feed, not logout), deep links to `/agent`.
- **Gesture conflicts:** Sanity-check on iOS/Android (system back gesture, edge-swipe, full-screen video) so feed swipe-left stays reliable.

**Option B (drawer)** can be treated as legacy / quick-access later, not the canonical agent experience.

---

**Référence:** Master plan `docs/CLAUDE_CODE_MASTER_PLAN_QUEBEC_TIKTOK.md`; UI copy `docs/UI_COPY_QUEBEC_FRENCH.md`.  
**Dernière mise à jour:** 2026-02-05
