# GeneChat — Development Context

## Architecture

This is a **sequence workbench**, not a chat app. The center panel is a stack of sequence blocks (like a notebook), not a message thread.

- **Left sidebar**: Conversation list + project folders (ChatGPT-style navigation)
- **Center**: Sequence block stack, max-width 768px, with toolbar actions
- **Right panel**: Circular/linear map visualization (Canvas2D), hidden by default
- **Bottom drawer**: AI chat (slides up, Copilot-style), BYOK multi-provider

## Key patterns

- **State**: Zustand stores (`src/store/`). Three stores: project, sequence, UI, plus AI store.
- **Persistence**: Dexie.js IndexedDB (`src/persistence/`). Hydrates on load, auto-syncs writes. If you change seeding/default data, users must clear IndexedDB: `indexedDB.deleteDatabase('genechat')` + hard reload.
- **Bio engine**: Pure functions in `src/bio/`. No side effects, fully typed.
- **Canvas rendering**: `src/canvas/` — direct Canvas2D, no library. HiDPI-aware. Both renderers use AABB collision detection for labels.
- **AI providers**: `src/ai/providers/` — SSE streaming for all 4 providers. Context built from workspace sequences.
- **Theming**: CSS custom properties in `src/index.css`. Light default, dark via toggle. Never hardcode colors in canvas renderers — use `getComputedStyle()`.

## Dev server

```bash
npm run dev   # port 5180
```

## Known gotchas

- React StrictMode runs effects twice. Module-level guards (`let seeded = false`) survive the unmount/remount cycle; `useRef` guards do not.
- IndexedDB persists across code changes and HMR. Stale data from previous sessions can mask bugs. Clear with `indexedDB.deleteDatabase('genechat')`.
- Canvas renderers read CSS variables via `getComputedStyle(canvas)`. The canvas element must be in the DOM and themed before rendering.
