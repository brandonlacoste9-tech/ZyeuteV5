# TikTok Reverse Engineering & Zyeuté Comparison — June 4, 2026

To ensure Zyeuté feels familiar and performant to users migrating from TikTok, we analyzed TikTok's web application across its core features. This document outlines TikTok's design patterns and compares them against Zyeuté's current implementation to identify areas for improvement.

---

## 1. Profile Page (`/@username`)

### Layout & Header
- **TikTok:** Uses a 2-column layout (sidebar on left, content on right). The profile header has a large circular avatar on the left. To its right are the Display Name, handle, and verified badge.
- **Stats:** Formatted as `[Bold Number] [Regular Label]` (e.g., **49.4M** Followers, **10.1B** Likes) in a single row.
- **Actions:** Primary action (Follow) is a solid colored button (red). Secondary actions (Message, Share) are light gray with black text/icons.
- **Bio:** Supports text, line breaks, and a distinct link area with a link icon.

### Tabs & Grid
- **Tabs:** Standard tabs are **Videos**, **Reposts**, and **Liked**. The active tab has bold text and a solid bottom border. Icons are used alongside text (e.g., a grid icon for Videos).
- **Playlists:** Horizontal scrollable list above the main video grid.
- **Grid:** A **6-column grid** on large screens. Thumbnails are standard 9:16 aspect ratio.
- **Overlays:** 
  - **Pinned** badge (red background, white text) at top-left.
  - **Play count** (▷ 14.9M) at bottom-left. No duration is shown.

### Zyeuté Gaps / Opportunities
- **Grid density:** Zyeuté should ensure its desktop grid dynamically scales (up to 6 columns) to match TikTok's scanning efficiency.
- **Stats styling:** Ensure Zyeuté uses the exact `Bold Number + Regular Text` format for quick readability.
- **Playlists:** Consider adding profile playlists to group related content.

---

## 2. Explore / Discover Page (`/explore`)

### Search Integration
- **TikTok:** The Explore page doesn't have a massive centered search bar; instead, the search bar is integrated into the left sidebar (a pill-shaped button that expands into an active text field when clicked).

### Category Filters
- **TikTok:** At the top of the grid, a horizontal scrolling list of predefined category chips (e.g., *All, Singing & Dancing, Comedy, Sports, Anime & Comics, Food*).
- **Behavior:** Clicking a category filters the grid instantly without a full page reload.

### Content Grid
- **TikTok:** Just like the profile page, Explore uses a **6-column grid** of video thumbnails (9:16 ratio). 
- **Metadata:** Along with the play count overlay on the thumbnail, the user's avatar and username are displayed directly *below* the thumbnail.
- **Navigation:** Clicking a video opens it in a "theater mode" modal overlay (or navigates to a single-video page) rather than a vertical scrolling feed.

### Zyeuté Gaps / Opportunities
- **Category Chips:** Zyeuté could implement a sticky horizontal scrolling list of categories at the top of the Discover/Search page.
- **Creator Context:** Ensure the video grid shows the creator's avatar/handle beneath the thumbnail to encourage discovery.

---

## 3. Comments Panel

### Layout & Interaction
- **TikTok:** On desktop, the comments section is a **side-panel** that slides in on the right side of the video, shifting or overlaying the content slightly.
- **Header:** Simple "Comments [Count]" with a close (X) button.
- **Comment Structure:** 
  - Circular avatar on the left.
  - Username (bold/gray), comment text (black).
  - Footer row: Date (e.g., `5-1`), "Reply" button, and a right-aligned heart icon with the like count.
- **Nested Replies:** Replies are hidden by default behind a "View X replies ⌄" button.
- **Input:** Fixed text area at the bottom of the panel with `@` mention, emoji picker, and a send/post button.

### Zyeuté Gaps / Opportunities
- **Desktop Layout:** Zyeuté should ensure comments on desktop use a side-panel rather than a full-screen modal or center popup, keeping the video visible and playing.
- **Inline Replies:** Implement collapsible nested replies if not already present.

---

## 4. Share Sheet

### Layout & Options
- **TikTok:** A centered, floating modal (white background, rounded corners) with the title "Share to".
- **Structure:**
  - **Top Row (Internal):** Horizontally scrollable list of TikTok friends/recent messages (Avatar + Name).
  - **Bottom Row (External):** Horizontally scrollable list of large, brightly colored circular icons for external sharing: *Repost (yellow), Copy link (blue), WhatsApp (green), Embed (teal), Facebook (blue), etc.*

### Zyeuté Gaps / Opportunities
- **Icon styling:** Use distinct, brightly colored circular icons for share targets (Copy Link, WhatsApp, X, etc.) to match the expected UI.
- **Internal vs External:** Separate internal sharing (to Zyeuté connections) from external sharing into two distinct rows.
