# Architecture Overview – Continuous Feed

## TL;DR

- **Virtualisation**: `react-window@2` (render‑props API) for O(1) rendering.
- **Data model**: Discriminated union `FeedItem = Post | Ad` → type‑safe interleaving.
- **Memoisation**: `React.memo` with **shallow** comparison; we rely on stable `rowProps` from `useMemo`.
- **Height**: `100dvh` to avoid mobile‑browser toolbar "black‑screen" bugs.
- **Strict TypeScript**: `noUncheckedIndexedAccess`, `strict`, `noImplicitAny`, etc.
- **Performance guard**: Defensive `if (!post) return null;` and safe array‑index guards in `areRowsEqual`.

---

## Detailed Decisions

| Feature                | Implementation                                                                       | Rationale                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **List Container**     | `react-window` `List` (v2)                                                           | Modern API, deterministic row keys, lightweight, works with large feeds.          |
| **Row Props**          | `type FeedRowProps = RowComponentProps<RowData>`                                     | react-window v2 passes props directly via `rowProps`, not nested in `data`.       |
| **Memo Equality**      | Default shallow compare + `useMemo` for `rowProps`                                   | Avoids heavy custom comparators that broke type‑checking.                         |
| **Ad Interleaving**    | `interleaveAds(posts, 5, adFactory)` producing a `FeedItem[]`                        | Keeps the list homogeneous while allowing ad rendering via discriminated union.   |
| **Lazy Media**         | `UnifiedMediaCard` uses intersection observer                                        | Loads network payloads only when the row is on‑screen → lower memory & bandwidth. |
| **CSS Height**         | `height: 100dvh` (fallback via `calc(100vh - env(safe-area-inset-top))`)             | Prevents the "black screen" caused by mobile address‑bar collapse.                |
| **Strict TS Settings** | `noUncheckedIndexedAccess`, `strict`, `noImplicitAny`                                | Catches potential `undefined` bugs early (e.g., array‑index access).              |
| **Build Guard**        | CI pipeline (see `.github/workflows/ci.yml`) runs `npm run check` + `npm run build`. | Guarantees no dev‑only shortcuts slip into `main`.                                |

---

## react-window v2 API Reference

### Key Differences from v1

| v1 API                                | v2 API                                |
| ------------------------------------- | ------------------------------------- |
| `FixedSizeList`                       | `List`                                |
| `ListChildComponentProps`             | `RowComponentProps`                   |
| `itemCount` / `itemSize` / `itemData` | `rowCount` / `rowHeight` / `rowProps` |
| `children` (render prop)              | `rowComponent` prop                   |
| `ref`                                 | `listRef`                             |
| `onItemsRendered`                     | `onRowsRendered`                      |

### Example Usage

```tsx
import { List, RowComponentProps, ListImperativeAPI } from "react-window";

type RowData = {
  posts: Post[];
  currentIndex: number;
  // ... other props
};

type FeedRowProps = RowComponentProps<RowData>;

const FeedRow = ({ index, style, posts, currentIndex }: FeedRowProps) => {
  const post = posts[index];
  if (!post) return null;
  return <div style={style}>...</div>;
};

// In parent component:
<List<RowData>
  listRef={listRef}
  style={{ height, width }}
  rowCount={posts.length}
  rowHeight={height}
  rowComponent={FeedRow}
  rowProps={itemData}
  overscanCount={1}
  onRowsRendered={(visible) => handleRowsRendered(visible)}
/>;
```

---

## Future‑Proofing Checklist

- ✅ **CI** always runs the full type‑check, lint, and production build.
- ✅ **Documentation** explains why we use v2 API and avoid nested `data` objects.
- ✅ **Performance profiling** (DevTools "Paint Flashing") should only flash newly‑visible rows.
- ✅ **E2E tests** (Cypress) verify scrolling and ad placement (see `cypress/e2e/feed.cy.js`).

---

## Common Pitfalls to Avoid

1. **Don't use `ListChildComponentProps`** – That's v1 API. Use `RowComponentProps` for v2.

2. **Don't access props via `data` object** – In v2, `rowProps` are spread directly onto the component.

3. **Always guard array access** – With `noUncheckedIndexedAccess`, `posts[index]` returns `Post | undefined`.

4. **Keep `rowProps` stable** – Use `useMemo` to prevent unnecessary re-renders.

5. **Use `listRef` not `ref`** – The v2 API renamed the ref prop.

---

## File Structure

```
frontend/src/components/features/
├── ContinuousFeed.tsx      # Main virtualized feed component
├── VirtualCommentList.tsx  # Virtualized comment list (also uses v2 API)
├── UnifiedMediaCard.tsx    # Single post/video card with lazy loading
└── FeedRow.tsx             # (inline in ContinuousFeed) Row renderer
```

Any deviation from these conventions should be reviewed with the team and documented.
