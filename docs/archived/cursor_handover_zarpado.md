# 🚀 PHASE 6: INNOVATION OVERLOAD

**Commander:** Antigravity
**Operative:** Cursor
**Objective:** Heavy Lifting. Database Refactor, Gamification, and Ephemeral Posts.

---

## 🏗️ MISSION 1: THE GLOBAL HIVE (Database)

Currently, all posts are mixed in one feed. We need separation.

### 1. Schema Update (`shared/schema.ts`)

- Add `hive_id` (varchar, length 2, default 'QC') to the `posts` table definition.
- Valid values: 'QC', 'BR', 'AR', 'MX'.

### 2. Backend Routing (`server/routes.ts`)

- Update the `/api/posts` (GET) endpoint.
- It should accept a query param `?hive=AR`.
- If provided, filter the database query: `.where(eq(posts.hiveId, 'AR'))`.
- **Default:** If users don't provide a hive, default to their profile's hive or 'QC'.

---

## 🎁 MISSION 2: LOCALIZED ECONOMY (Gamification)

Adapt the "Gifting" feature to the active region.

### 1. Define Gift Inventory

Create a `GiftRegistry` in `client/src/config/factory.ts` or a new file `client/src/config/gifts.ts`:

- **QC:** Maple Syrup (10 coins), Poutine (50 coins).
- **BR:** Cafezinho (10 coins), Feijoada (50 coins).
- **AR:** Mate (10 coins), Asado (50 coins).
- **MX:** Taco (10 coins), Tequila (50 coins).

### 2. Frontend Implementation

- Update the `VideoCard` gift button to show the correct icon based on `AppConfig.identity.region`.
- Example: If Region == 'AR', show 🧉 icon.

---

## 👻 MISSION 3: FANTASMA MODE (Ephemeral)

Snapchat-style view-once posts for Zarpado/Ritual.

### 1. Schema Update

- Add `is_ephemeral` (boolean, default false) to `posts`.
- Add `max_views` (integer, default null) to `posts`.

### 2. Visual Indicator

- In `VideoCard.tsx`, if `post.is_ephemeral` is true, show a 👻 icon badge.

### 3. Destruction Logic (Backend)

- In `server/routes.ts` (GET /api/posts/:id):
  - Increment `view_count`.
  - **CHECK:** If `is_ephemeral` && `view_count >= max_views`:
    - **DELETE** the post from DB immediately (or mark as `deleted`).
    - Return 404 to the user.

---

## 🛑 SAFETY PROTOCOLS

1.  **DO NOT PUSH.**
2.  **Verify** `npm run build` after every mission.
3.  **Run Tests:** Ensure you didn't break the existing QC feed.
4.  **Report Back:** List exactly what files you touched.

**EXECUTE ALL MISSIONS SEQUENTIALLY. REPORT WHEN DONE.**
