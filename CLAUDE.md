# GeneChat — Development Context

## Architecture

This is a **sequence workbench**, not a chat app. The center panel is a stack of sequence blocks (like a notebook), not a message thread.

- **Left sidebar**: Conversation list + project folders (ChatGPT-style navigation)
- **Center**: Sequence block stack, max-width 768px, with toolbar actions (inline GC plot + ORF track per block)
- **Bottom drawer**: AI chat (slides up, Copilot-style), BYOK multi-provider

## Key patterns

- **State**: Zustand stores (`src/store/`). Three stores: project, sequence, UI, plus AI store.
- **Persistence**: Dexie.js IndexedDB (`src/persistence/`). Hydrates on load, auto-syncs writes. If you change seeding/default data, users must clear IndexedDB: `indexedDB.deleteDatabase('genechat')` + hard reload.
- **Bio engine**: Pure functions in `src/bio/`. No side effects, fully typed.
- **AI providers**: `src/ai/providers/` — SSE streaming for all 4 providers. Context built from workspace sequences.
- **Theming**: CSS custom properties in `src/index.css`. Light default, dark via toggle. Never hardcode colors.

## Dev server

```bash
npm run dev   # port 5180
```

## Known gotchas

- React StrictMode runs effects twice. Module-level guards (`let seeded = false`) survive the unmount/remount cycle; `useRef` guards do not.
- IndexedDB persists across code changes and HMR. Stale data from previous sessions can mask bugs. Clear with `indexedDB.deleteDatabase('genechat')`.
- GC plot and ORF track are inline React components in `src/components/sequence-stack/`, not standalone canvas renderers.
