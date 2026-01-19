# Zyeuté Design System: "Opulence Canadienne" (Premium Leather & Gold)

**Status:** LOCKED 🔒
**Directives:** "Build from now on - you know the look."
**Last Verified:** 2026-01-19

## Core Aesthetic

- **Vibe:** Luxury, Warm, Organic, Exclusive (NOT Cyberpunk/Neon).
- **Metaphor:** A VIP Lounge in Old Montreal. Dark leather seats, warm gold lighting, premium service.

## Color Palette (Tailwind)

### Primary Surfaces

- **Main Background:** `#0d0c0b` (Deepest Warm Black)
- **Card Surface:** `#241d19` (Dark Espresso Leather)
- **Texture:** `url('leather-dark')` (Subtle pebbled grain)

### Accents

- **Primary Gold:** `#FFBF00` (Amber Gold) - Main Action Buttons, Highlights.
- **Secondary Gold:** `#FFD966` (Pale Gold) - Text Links, Secondary borders.
- **Glow:** `rgba(255, 191, 0, 0.4)` - Soft, warm halo (not harsh neon).

## Typography

- **Font:** Inter (Clean, White Sans-serif).
- **Headings:** Bold, often Gold Gradient (`bg-gradient-to-r from-gold-300 to-gold-600`).
- **Body:** White (`#FFFFFF`) or Warm Gray (`#a18e87`) for muted text.

## UI Components

### Buttons (`btn-gold`)

- Gradient Gold Background.
- Black Text (High contrast).
- Soft Drop Shadow (Warm).

### Borders

- **Stitching:** Dashed lines (`var(--stitching-color)`) representing leather shifting.
- **Gold Rims:** 1px solid gold for cards/modals.

## UX Behavior

- **Scrolling:** snapping (`snap-y`), smooth (`scroll-smooth`).
- **Video:** Autoplay muted, click to unmute.
- **Haptics:** Premium heavy impact on interactions.
