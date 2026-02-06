# GeneChat Build Status

> **For any Claude instance resuming work**: Read this file + the plan at
> `/Users/jacobvogan/.claude/plans/structured-moseying-pearl.md`
> and the memory at `/Users/jacobvogan/.claude/projects/-Users-jacobvogan-github-2-claude-gene-1/memory/MEMORY.md`

## Scaffold (DONE)
- [x] Vite + React + TS project created at `genechat/`
- [x] Dependencies: zustand, dexie, tailwindcss, @tailwindcss/vite, lucide-react
- [x] Shared types: `src/bio/types.ts`, `src/store/types.ts`, `src/ai/types.ts`
- [x] CSS tokens: `src/index.css` (light + dark themes, all design variables)
- [x] App shell: `src/App.tsx` (3-panel placeholder layout, theme toggle)
- [x] Vite config: port 5180, tailwind plugin
- [x] Dev server verified working

## Team: genechat-build (4 agents — ALL COMPLETE)

### Agent: bio-engine (Task #1) — src/bio/*
Status: COMPLETE
All files created, TypeScript compiles with zero errors.
- [x] types.ts (shared types — scaffold)
- [x] detect-type.ts — auto-detect DNA/RNA/protein/misc/unknown/mixed, IUPAC-aware
- [x] fasta-parser.ts — parse + serialize multi-record FASTA
- [x] reverse-complement.ts — full IUPAC ambiguity code support, DNA + RNA
- [x] translate.ts — DNA/RNA to protein, all 3 frames, translateFromFirstATG
- [x] rev-translate.ts — protein to DNA using optimal codon frequencies
- [x] codon-tables.ts — standard genetic code (64 codons), E. coli/human/yeast usage tables
- [x] codon-optimize.ts — codon optimization for 3 organisms + CAI calculation
- [x] orf-detection.ts — all 3 frames, both strands, min-length filter, sorted by length
- [x] restriction-sites.ts — 25 enzymes, IUPAC pattern matching, unique/non-cutter queries
- [x] gc-content.ts — GC%, AT%, composition, molecular weight, Tm, sliding window
- [x] annotate.ts — auto-annotation engine (ORFs + restriction sites + GC analysis)
- [x] index.ts — barrel re-export of all public functions

### Agent: canvas-viz (Task #2) — src/canvas/* + src/components/viz-panel/*
Status: COMPLETE
All files created, TypeScript compiles with zero errors.
- [x] canvas/plasmid-renderer.ts — circular DNA map, gene arcs, bp ticks, restriction site dashes, origin marker, center info, hover glow, drag rotation, HiDPI
- [x] canvas/linear-renderer.ts — linear map, auto track assignment, scale bar, forward/reverse strands, direction arrows, selection range overlay
- [x] canvas/base-renderer.ts — colored nucleotide sequence (A/T/G/C), codon separators, complement strand, amino acid row, ORF tracks, virtual scrolling
- [x] canvas/interaction.ts — unified mouse handler (hover/click/drag/zoom) for plasmid, linear, and base modes
- [x] canvas/index.ts — barrel export
- [x] components/viz-panel/VizPanel.tsx — container with circular/linear tab toggle, close button
- [x] components/viz-panel/PlasmidMap.tsx — React wrapper, 60fps RAF render loop, interaction binding
- [x] components/viz-panel/LinearMap.tsx — React wrapper for linear renderer
- [x] components/viz-panel/FeatureOverlay.tsx — floating tooltip with feature details (name, type, range, strand)
- [x] components/viz-panel/ZoomControls.tsx — glassmorphism zoom slider + position readout
- [x] components/viz-panel/index.ts — barrel export

### Agent: ui-shell (Task #3) — src/components/*
Status: COMPLETE
All 19 files created, TypeScript compiles with zero errors. App.tsx updated to wire components.
- [x] components/layout/AppShell.tsx — 3-panel flexbox, sidebar|center|right + AI drawer slot
- [x] components/layout/ResizablePanel.tsx — drag-to-resize with min/max bounds, smooth animation
- [x] components/layout/ThemeProvider.tsx — dark/light context + localStorage persistence
- [x] components/sidebar/Sidebar.tsx — full sidebar: logo, new-chat, search, projects, conversations, user footer
- [x] components/sidebar/ProjectList.tsx — collapsible folder tree with chevron rotation
- [x] components/sidebar/ConversationList.tsx — active highlighting + type badges + timestamps
- [x] components/sidebar/SearchBar.tsx — filters conversations by title
- [x] components/sidebar/UserProfile.tsx — initials avatar + name + plan label
- [x] components/sequence-stack/SequenceStack.tsx — scrollable block container + paste input
- [x] components/sequence-stack/SequenceBlock.tsx — HERO: glassmorphism header, editable name, colored bases, derivation indicator, copy/delete, expand/collapse
- [x] components/sequence-stack/SequenceToolbar.tsx — 7 manipulation buttons (RC/Translate/RevTrans/CodonOpt/Mutate/Annotate/Auto) with tooltips
- [x] components/sequence-stack/SequenceDisplay.tsx — colored bases (A=green T=red G=yellow C=blue) with glow, groups of 10, truncation
- [x] components/sequence-stack/SequenceNotes.tsx — editable textarea with focus highlight
- [x] components/sequence-stack/FeatureSelector.tsx — colored feature pills with selection state
- [x] components/sequence-stack/EmptyState.tsx — DNA icon + 3 suggestion cards
- [x] components/common/Button.tsx — primary/secondary/danger/ghost variants, sm/md sizes
- [x] components/common/Badge.tsx — DNA(green)/RNA(amber)/PROTEIN(purple)/MISC(gray) pills
- [x] components/common/Tooltip.tsx — delayed hover tooltip
- [x] components/common/Modal.tsx — overlay + dialog with close button
- [x] App.tsx — updated to compose ThemeProvider + AppShell + Sidebar + SequenceStack + VizPanel + AIDrawer

### Agent: state-ai (Task #4) — src/store/* + src/persistence/* + src/ai/* + src/hooks/* + ai-drawer
Status: COMPLETE
All files created, TypeScript compiles with zero errors (tsc --noEmit exits 0).
- [x] store/ui-store.ts — Full UI state + actions (theme, sidebar, panel, drawer, feature selection, zoom, search)
- [x] store/project-store.ts — Projects + conversations CRUD, sample data (GFP Variants, CRISPR Library)
- [x] store/sequence-store.ts — Sequence blocks with auto-detect type, auto-name, full CRUD + reorder + setBlockParent
- [x] store/ai-store.ts — API keys per provider, active model, chat messages, streaming, updateLastAssistantMessage
- [x] store/index.ts — Barrel exports
- [x] ai/provider-registry.ts — Register/get/list pattern
- [x] ai/providers/claude.ts — Anthropic API, SSE streaming, x-api-key + anthropic-version headers, CORS header
- [x] ai/providers/openai.ts — OpenAI API, SSE streaming, Bearer auth
- [x] ai/providers/gemini.ts — Gemini streamGenerateContent with alt=sse, system instruction support
- [x] ai/providers/kimi.ts — Kimi/Moonshot OpenAI-compatible at api.moonshot.cn
- [x] ai/context-builder.ts — System message from workspace blocks (name, type, length, features, analysis, preview)
- [x] ai/index.ts — Auto-registers all 4 providers + barrel exports
- [x] persistence/db.ts — Dexie v4, 4 tables: projects, conversations, sequenceBlocks, settings
- [x] persistence/sync.ts — Hydrate on load + subscribe-based sync with 300ms debounce, persists theme + API keys
- [x] persistence/export.ts — Markdown export (frontmatter + fenced blocks + feature tables) + FASTA + download helper
- [x] persistence/index.ts — Barrel exports
- [x] hooks/useSequenceAnalysis.ts — Auto-detect type + mock analysis (GC%, MW, Tm, composition)
- [x] hooks/useFeatureLink.ts — Bidirectional workspace/map feature sync with loop prevention
- [x] hooks/useCanvasRenderer.ts — Canvas2D setup (DPR-aware), ResizeObserver, optional animation loop
- [x] hooks/useAIChat.ts — Full chat hook: context from workspace, streaming via provider, error handling
- [x] hooks/index.ts — Barrel exports
- [x] components/ai-drawer/AIDrawer.tsx — Slide-up drawer with drag handle, fills parent container
- [x] components/ai-drawer/ChatMessages.tsx — Scrollable messages, user/AI alignment, typing dots animation
- [x] components/ai-drawer/ChatInput.tsx — Auto-growing textarea, Enter to send, model chip, send button states
- [x] components/ai-drawer/ModelPicker.tsx — Dropdown grouped by provider, key status badges, active checkmark
- [x] components/ai-drawer/APIKeySettings.tsx — Modal, per-provider key input, show/hide, test connection button
- [x] components/ai-drawer/index.ts — Barrel exports

## Task #5: Integration (COMPLETE)
- [x] Replace App.tsx placeholders with real components (VizPanel, AIDrawer)
- [x] Connect AppShell to UIStore (sidebar, panel, drawer state synchronized)
- [x] Connect Sidebar to stores (projects, conversations from Zustand)
- [x] Connect SequenceStack to stores (blocks from Zustand, not mock data)
- [x] Wire bio functions into SequenceToolbar (RC, translate, rev-translate, codon-opt, annotate)
- [x] Wire VizPanel with active sequence block features
- [x] Wire AIDrawer toggle via UIStore
- [x] Added setBlockParent action to sequence-store for derivation tracking
- [x] Dev server running at port 5180, zero TypeScript errors, Vite build passes
- [x] Verified in Chrome: sidebar, blocks, drawer, all working
- [x] Wire bidirectional feature sync (center ↔ right panel)
- [x] Polish light theme
- [x] Wire persistence (IndexedDB sync on load)
- [x] Test all toolbar actions end-to-end
- [x] Canvas rendering (PlasmidMap/LinearMap wired to store data)
- [x] ThemeProvider ↔ UIStore sync
- [x] Block selection → VizPanel activation

## Polish Pass (Feb 5-6 2026 — genechat-build team)

### canvas-viz agent
- VizPanel empty state when no sequence selected
- Restriction sites data flow (was hardcoded [])
- Zero-dimension canvas guard (prevents 0x0 canvas that never recovers)
- Block selection: SequenceStack now calls selectSequenceBlock(), auto-selects GFP on seed
- Active block visual feedback (accent border + glow)
- Bidirectional feature sync verified working (workspace ↔ map)

### ui-shell agent
- ThemeProvider ↔ UIStore sync confirmed already wired
- Light theme: fixed AppShell top bar hardcoded dark rgba → color-mix with CSS vars
- Light theme: fixed SequenceBlock glassmorphism header hardcoded dark rgba → CSS vars

### state-ai agent
- IndexedDB persistence confirmed already wired (main.tsx hydrate→startSync)
- All 7 toolbar actions verified working end-to-end (mutate is placeholder)
- Derivation indicators verified (parentBlockName + manipulation type)

## Current State (Latest)
- **74 source files** across all modules
- **Zero TypeScript errors** (tsc --noEmit exits 0)
- **Vite build passes** (378KB JS bundle, 10.5KB CSS)
- **Dev server** at http://localhost:5180
- **All features functional:**
  - Sidebar: projects, conversations, search, new chat button — all store-connected
  - Sequence Stack: GFP DNA block auto-selected, click any block to activate in VizPanel
  - All toolbar actions: RC, Translate, RevTrans, CodonOpt, Annotate, Auto (Mutate = placeholder)
  - Derivation indicators on derived blocks
  - VizPanel: circular/linear maps render with features + restriction sites
  - Bidirectional feature sync: click pill ↔ click map feature
  - AI Drawer: slides up with drag handle, model picker, chat input
  - Light + dark themes both working
  - IndexedDB persistence on load + auto-sync

## UX Overhaul + Browser Testing (Feb 5-6 2026) — COMPLETE
All verified in Chrome at localhost:5181:

### Fixes Applied
- [x] Transform dropdown: changed to position:fixed (was clipped by overflow:hidden)
- [x] Block name edit: changed to double-click (single click was confusing)
- [x] Feature pill active state: accent border + glow + bold (was too subtle)
- [x] Plasmid renderer: stronger selected feature highlight (wider arc, bigger glow, bold label)
- [x] AutoSelectBlock: auto-selects first block when switching conversations
- [x] Paste auto-selects new block so VizPanel renders immediately
- [x] Toolbar actions auto-select derived block + show success notification
- [x] Auto-annotate shows feature count notification
- [x] Conversation auto-rename from first pasted sequence name
- [x] Expanded sequences max-height 240px with scroll
- [x] Notification toast slide-in/out animation (CSS keyframes)
- [x] Empty state: minimal DNA icon + helpful prompt text
- [x] Sidebar seq count badges ("2 seqs", "1 seq")
- [x] Sequence color toggle (default OFF)

### Verified Working
- [x] All toolbar actions: RC, Translate, RevTrans, CodonOpt, Auto-Annotate
- [x] Circular + Linear map rendering with features
- [x] Bidirectional feature sync (pill ↔ map)
- [x] IndexedDB persistence (survives page reload)
- [x] Light + dark themes
- [x] AI Drawer opens/closes with model picker
- [x] New conversation creation
- [x] Conversation switching with auto-block-select

## Bug Fixes + Viz Polish + AI Test (Feb 6 2026) — COMPLETE

### Duplicate Conversations Fix
- Root cause: SequenceStack seeding called createConv() generating new UUIDs while project-store had 6 hardcoded conversations with fixed IDs
- Fix: module-level `let seeded = false` guard + use existing conversation IDs instead of createConv()
- Required clearing stale IndexedDB: `indexedDB.deleteDatabase('genechat')`

### Viz Label Collision Detection
- Both plasmid-renderer.ts and linear-renderer.ts now use AABB collision detection (LabelRect + usedRects)
- Feature labels and restriction site labels skip if overlapping

### Linear Renderer Contrast Fix
- Replaced hardcoded #000000 text with luminance-based contrast (hexToRgb + perceived luminance)
- Label truncation uses ctx.measureText() loop with ellipsis

### Gemini Model ID Update
- Updated from gemini-3-pro/flash to gemini-3-pro-preview/gemini-3-flash-preview

### AI Chat Verified
- Gemini streaming tested and working with real API key
- BYOK keys wired to all providers (Claude, GPT, Gemini, Kimi)

## Remaining Work
1. **Mutate action**: needs parameter UI (position, base, type)
2. **Keyboard shortcuts**: Cmd+N, Cmd+K, etc not implemented
