# GeneChat

A desktop-class bioinformatics workbench for DNA/RNA/protein sequence analysis, built with React + TypeScript.

## What it does

- **Sequence workspace**: Paste, import, or create sequences. Each conversation holds a stack of sequence blocks with full manipulation tools (reverse complement, translate, codon optimize, auto-annotate).
- **Visualization**: Interactive circular (plasmid) and linear maps with features, restriction sites, and zoom/pan. Canvas2D rendering at 60fps with collision-detected labels.
- **AI assistant**: Bring-your-own-key chat drawer supporting Claude, GPT, Gemini, and Kimi. Streams responses with workspace context (loaded sequences, features, analysis).
- **File I/O**: Import FASTA and GenBank files (drag-drop or click). Export per-block or per-conversation.
- **Project folders**: Organize conversations into folders. Right-click to move, rename, delete.
- **Persistence**: All data saved to IndexedDB via Dexie.js. Survives page reloads.
- **Theming**: Light (default) and dark themes via CSS custom properties.

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS 4, Zustand, Dexie.js, Canvas2D, lucide-react

## Development

```bash
npm install
npm run dev     # http://localhost:5180
```

```bash
npx tsc --noEmit   # type check
npm run build       # production build
```

## Project structure

```
src/
  ai/              # AI provider implementations (Claude, GPT, Gemini, Kimi)
  bio/             # Core bioinformatics: parsers, transforms, analysis
  canvas/          # Canvas2D renderers (plasmid, linear, base-level)
  components/      # React UI (sidebar, sequence-stack, viz-panel, ai-drawer)
  hooks/           # Custom hooks (analysis, feature sync, canvas, AI chat)
  persistence/     # Dexie.js IndexedDB schema + Zustand sync
  store/           # Zustand stores (project, sequence, UI, AI state)
```

## Status

All core features working. See `BUILD_STATUS.md` for detailed build history.
