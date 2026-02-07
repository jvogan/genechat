# GeneChat

Open-source, browser-based bioinformatics workbench — restriction digest, ligation, primer design, sequence diff, AI assistant, and more. No server required.

A desktop-class sequence analysis tool for DNA/RNA/protein, built with React + TypeScript.

## What it does

- **Sequence workspace**: Paste, import, or create sequences. Each conversation holds a stack of sequence blocks with full manipulation tools (reverse complement, translate, codon optimize, auto-annotate).
- **Cloning operations**: Restriction digest with 25 enzymes (unique-cutter filter, proportional fragment preview), ligation with linker support, and primer design with Tm/GC tuning and restriction-site tail presets.
- **Sequence diff**: Needleman-Wunsch alignment between any two blocks with color-coded identity/mismatch display.
- **Sequence search**: IUPAC-aware motif search (Cmd+F) with match highlighting and prev/next navigation.
- **Block stats**: Per-block metrics — length, GC%, molecular weight, melting temperature, ORF count.
- **Selection actions**: Select bases to copy, extract to a new block, create a feature, or view stats.
- **Per-block checkpoints**: Save and restore sequence snapshots with labeled history.
- **Drag-to-reorder**: Grip handle on each block for pointer-based reordering.
- **URL deep linking**: Share conversations via `?conv=<id>` query parameters.
- **AI assistant**: Bring-your-own-key chat drawer supporting Claude, GPT, Gemini, and Kimi. Streams responses with workspace context. AI can create blocks, add features, modify sequences, and highlight regions.
- **Visualization**: Interactive circular (plasmid) and linear maps with features, restriction sites, and zoom/pan. Canvas2D rendering at 60fps.
- **File I/O**: Import FASTA and GenBank files (drag-drop or click). Export per-block or per-conversation.
- **Project folders**: Organize conversations into folders. Right-click to move, rename, delete.
- **Persistence**: All data saved to IndexedDB via Dexie.js. Survives page reloads.
- **Theming**: Light (default) and dark themes via CSS custom properties.

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS 4, Zustand, Dexie.js, Canvas2D, lucide-react

## Development

**Prerequisites:** Node 20+

```bash
npm install
npm run dev     # http://localhost:5180 (falls back to 5181+ if busy)
```

```bash
npx tsc --noEmit   # type check
npm run lint        # ESLint
npm test            # unit tests
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

## License

[MIT](LICENSE)
