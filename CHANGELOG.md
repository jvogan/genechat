# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-07

### Added

- **Sequence workspace** — always-editable DNA, RNA, and protein blocks with inline stats (length, GC%, MW, Tm, ORF count), checkpoints, feature annotations, drag-to-reorder, and line numbers
- **Import/Export** — FASTA, GenBank, and Markdown import via drag-and-drop; per-block and per-conversation export
- **Restriction digest** — 25 built-in enzymes, unique-cutter filter, proportional fragment preview
- **Ligation** — concatenate fragments with optional linker sequence
- **Primer design** — Tm/GC tuning, top 5 pairs, restriction-site tail presets (EcoRI, BamHI, HindIII, NcoI, XhoI, NdeI)
- **Sequence diff** — Needleman-Wunsch pairwise alignment with color-coded identity/mismatch display
- **Motif search** — IUPAC-aware find (Cmd+F) with match highlighting and navigation
- **Reading frame translation** — +1/+2/+3 frame selector
- **AI assistant** — bring-your-own-key chat drawer supporting Claude, GPT, Gemini, and Kimi with workspace-aware actions (create blocks, add features, modify sequences, rename, highlight)
- **AI chat UX** — markdown rendering, stop generation, clear chat, context indicator
- **GC sliding window plot** — Canvas2D sparkline with adaptive window size
- **ORF visualization** — 6-frame collapsed track, click to select, color-coded by frame
- **Feature templates** — 17 presets (promoters, terminators, tags, origins, markers)
- **Selection actions** — copy, extract, annotate, stats, reverse complement
- **Multi-block selection** — Shift+click with batch bar (Export FASTA, Delete, Clear)
- **Duplicate block** — copies sequence, features, and parent reference
- **Keyboard shortcuts** — Cmd+? legend, plus shortcuts for common operations
- **Project folders** — organize conversations into named groups
- **URL deep linking** — shareable `?conv=<id>` URLs
- **Checkpoints** — per-block save/restore with Dexie.js
- **Error boundaries** — graceful fallback UI for sidebar, center panel, and AI drawer
- **Input validation** — strips invalid characters on paste/import with notification
- **Destructive action polish** — inline 2-step confirm (no `window.confirm`), undo for batch delete and conversation delete
- **Theming** — light default, dark mode via toggle, CSS custom properties throughout
- **Code splitting** — React.lazy for 4 dialog components
- **E2E tests** — 8 Playwright tests covering core workflows

[0.1.0]: https://github.com/jvogan/genechat/releases/tag/v0.1.0
