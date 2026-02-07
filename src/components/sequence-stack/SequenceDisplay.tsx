import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { BASE_COLORS, AA_COLORS } from '../../bio/types';
import type { SequenceType } from '../../bio/types';
import type { MutationScar } from '../../store/types';
import type { MotifMatch } from '../../bio/motif-search';
import { useUIStore } from '../../store/ui-store';

interface SequenceDisplayProps {
  sequence: string;
  type: SequenceType;
  isActive?: boolean;
  selectedRange: { start: number; end: number } | null;
  onRangeSelect: (range: { start: number; end: number } | null) => void;
  scars?: MutationScar[];
  isEditing?: boolean;
  cursorPosition?: number;
  insertMode?: boolean;
  onClick?: (pos: number) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  searchMatches?: MotifMatch[];
  searchMatchIndex?: number;
}

const COLLAPSED_LINES = 6;
const LINE_HEIGHT_PX = 21; // ~12.5px font * 1.7 line-height
const COLLAPSED_HEIGHT = COLLAPSED_LINES * LINE_HEIGHT_PX;

export default function SequenceDisplay({
  sequence,
  type,
  isActive,
  selectedRange,
  onRangeSelect,
  scars = [],
  isEditing = false,
  cursorPosition = 0,
  insertMode = false,
  onClick,
  onKeyDown,
  searchMatches = [],
  searchMatchIndex,
}: SequenceDisplayProps) {
  const coloringEnabled = useUIStore((s) => s.sequenceColoringEnabled);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Selection tracking via refs to avoid re-renders during drag
  const isSelecting = useRef(false);
  const selectionAnchor = useRef<number>(-1);
  const hasDragged = useRef(false);

  const isProtein = type === 'protein';
  const colorMap = isProtein ? AA_COLORS : BASE_COLORS;

  // Build scar lookup map for O(1) access per base
  const scarMap = useMemo(() => {
    const m = new Map<number, MutationScar>();
    for (const scar of scars) {
      m.set(scar.position, scar);
    }
    return m;
  }, [scars]);

  // Build deletion scar positions
  const deletionScars = useMemo(() => {
    const m = new Map<number, MutationScar>();
    for (const scar of scars) {
      if (scar.type === 'deletion') {
        m.set(scar.position, scar);
      }
    }
    return m;
  }, [scars]);

  // Build search match lookup: position → { isMatch, isCurrent }
  const searchHitMap = useMemo(() => {
    const map = new Map<number, 'match' | 'current'>();
    if (searchMatches.length === 0) return map;
    for (let mi = 0; mi < searchMatches.length; mi++) {
      const m = searchMatches[mi];
      const isCurrent = mi === searchMatchIndex;
      for (let i = m.start; i < m.end; i++) {
        map.set(i, isCurrent ? 'current' : (map.get(i) ?? 'match'));
      }
    }
    return map;
  }, [searchMatches, searchMatchIndex]);

  // Auto-scroll current search match into view
  useEffect(() => {
    if (searchMatches.length === 0 || searchMatchIndex == null) return;
    const currentMatch = searchMatches[searchMatchIndex];
    if (!currentMatch || !contentRef.current) return;
    const el = contentRef.current.querySelector(`[data-pos="${currentMatch.start}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [searchMatchIndex, searchMatches]);

  // Check if content overflows collapsed height
  useEffect(() => {
    if (!contentRef.current) return;
    const check = () => {
      const el = contentRef.current;
      if (el) setOverflows(el.scrollHeight > COLLAPSED_HEIGHT);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [sequence]);

  // Auto-scroll cursor into view when editing
  useEffect(() => {
    if (!isEditing || !contentRef.current) return;
    const cursorEl = contentRef.current.querySelector('[data-cursor="true"]');
    if (cursorEl) {
      cursorEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isEditing, cursorPosition]);

  // Helper: get base index from a mouse event target
  const getPosFromEvent = useCallback((e: MouseEvent | React.MouseEvent): number => {
    const target = e.target;
    if (target instanceof HTMLElement) {
      const pos = target.getAttribute('data-pos');
      if (pos !== null) return parseInt(pos, 10);
    }
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el instanceof HTMLElement) {
      const pos = el.getAttribute('data-pos');
      if (pos !== null) return parseInt(pos, 10);
    }
    return -1;
  }, []);

  // Mouse handlers: click = position cursor, drag = selection range
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;
    const pos = getPosFromEvent(e);
    if (pos === -1) return;
    // Don't preventDefault — we need the div to receive focus naturally
    isSelecting.current = true;
    selectionAnchor.current = pos;
    hasDragged.current = false;

    const handleMouseMove = (me: MouseEvent) => {
      if (!isSelecting.current) return;
      me.preventDefault(); // prevent native text selection during drag
      const movePos = getPosFromEvent(me);
      if (movePos === -1) return;
      if (movePos !== selectionAnchor.current) {
        hasDragged.current = true;
      }
      if (hasDragged.current) {
        const start = Math.min(selectionAnchor.current, movePos);
        const end = Math.max(selectionAnchor.current, movePos) + 1;
        if (end - start > 0) {
          onRangeSelect({ start, end });
        }
      }
    };

    const handleMouseUp = (me: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (!isSelecting.current) return;
      isSelecting.current = false;

      if (!hasDragged.current) {
        // Single click — position cursor
        const upPos = getPosFromEvent(me);
        if (upPos !== -1) {
          onRangeSelect(null);
          onClick?.(upPos);
        }
      } else {
        // Drag complete — finalize selection
        const upPos = getPosFromEvent(me);
        if (upPos !== -1) {
          const start = Math.min(selectionAnchor.current, upPos);
          const end = Math.max(selectionAnchor.current, upPos) + 1;
          onRangeSelect({ start, end });
        }
      }
      // Always re-focus the sequence div so keyboard events work
      contentRef.current?.focus();
    };

    // Focus the div immediately so keyboard works right away
    contentRef.current?.focus();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isActive, getPosFromEvent, onRangeSelect, onClick]);

  const isSelected = useCallback((idx: number): boolean => {
    if (!selectedRange) return false;
    return idx >= selectedRange.start && idx < selectedRange.end;
  }, [selectedRange]);

  const grouping = useUIStore((s) => s.sequenceGrouping);

  // Build chunks based on grouping
  const chunks: string[] = [];
  if (grouping > 0) {
    for (let i = 0; i < sequence.length; i += grouping) {
      chunks.push(sequence.slice(i, i + grouping));
    }
  } else {
    chunks.push(sequence);
  }

  const showFade = !expanded && overflows;

  // Style for a scar at a given position
  const getScarStyle = (idx: number): React.CSSProperties => {
    const scar = scarMap.get(idx);
    if (!scar) return {};
    switch (scar.type) {
      case 'substitution':
        return {
          color: 'var(--scar-substitution)',
          fontWeight: 600,
        };
      case 'insertion':
        return {
          color: 'var(--scar-insertion)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        };
      default:
        return {};
    }
  };

  // Scar tooltip
  const getScarTitle = (idx: number): string | undefined => {
    const scar = scarMap.get(idx);
    if (!scar) return undefined;
    switch (scar.type) {
      case 'substitution':
        return `Substitution: ${scar.original} → ${sequence[idx]}`;
      case 'insertion':
        return `Inserted: ${scar.inserted}`;
      default:
        return undefined;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          maxHeight: expanded ? 'none' : COLLAPSED_HEIGHT,
          overflowY: expanded && overflows ? 'auto' : 'hidden',
          position: 'relative',
          transition: expanded ? 'none' : 'max-height 0.2s ease',
        }}
      >
        <div
          ref={contentRef}
          onMouseDown={handleMouseDown}
          onKeyDown={onKeyDown}
          tabIndex={isActive ? 0 : undefined}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            lineHeight: 1.7,
            letterSpacing: 0.5,
            overflowWrap: 'break-word',
            wordBreak: 'break-all',
            padding: '10px 14px',
            background: 'var(--bg-deep)',
            borderRadius: 'var(--radius-sm)',
            border: isEditing
              ? '1px solid var(--cursor-edit)'
              : '1px solid var(--border-subtle)',
            userSelect: 'none',
            cursor: isActive ? 'text' : 'default',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
        >
          {chunks.map((chunk, ci) => {
            const chunkStart = grouping > 0 ? ci * grouping : 0;
            return (
            <span key={ci}>
              {[...chunk].map((base, bi) => {
                const absIdx = chunkStart + bi;
                const selected = isSelected(absIdx);
                const isCursorPos = isEditing && absIdx === cursorPosition;
                const delScar = deletionScars.get(absIdx);
                const scarStyle = getScarStyle(absIdx);
                const scarTitle = getScarTitle(absIdx);

                return (
                  <span key={absIdx} style={{ position: 'relative' }}>
                    {/* Deletion scar marker */}
                    {delScar && (
                      <span
                        title={`Deleted: ${delScar.original}`}
                        style={{
                          display: 'inline-block',
                          width: 0,
                          borderLeft: '2px solid var(--scar-deletion)',
                          height: '1.2em',
                          verticalAlign: 'text-bottom',
                          marginRight: -1,
                        }}
                      />
                    )}
                    {/* Insert cursor */}
                    {isEditing && insertMode && isCursorPos && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 0,
                          borderLeft: '2px solid var(--cursor-edit)',
                          height: '1.3em',
                          verticalAlign: 'text-bottom',
                          animation: 'cursorBlink 1s step-end infinite',
                          marginRight: -1,
                        }}
                      />
                    )}
                    <span
                      data-pos={absIdx}
                      data-cursor={isCursorPos ? 'true' : undefined}
                      title={scarTitle}
                      style={{
                        color: scarStyle.color
                          ? scarStyle.color
                          : coloringEnabled
                            ? (colorMap[base.toUpperCase()] ?? 'var(--text-muted)')
                            : 'var(--text-secondary)',
                        fontWeight: scarStyle.fontWeight ?? 500,
                        textDecoration: scarStyle.textDecoration,
                        textUnderlineOffset: scarStyle.textUnderlineOffset as string | undefined,
                        background: isCursorPos && !insertMode
                          ? 'var(--cursor-edit)'
                          : selected
                            ? 'var(--selection-bg)'
                            : searchHitMap.get(absIdx) === 'current'
                              ? 'rgba(250, 204, 21, 0.5)'
                              : searchHitMap.get(absIdx) === 'match'
                                ? 'rgba(250, 204, 21, 0.2)'
                                : undefined,
                        ...(isCursorPos && !insertMode ? { color: 'var(--bg-deep)' } : {}),
                        borderRadius: selected || isCursorPos ? 2 : undefined,
                        animation: isCursorPos && !insertMode ? 'cursorBlink 1s step-end infinite' : undefined,
                      }}
                    >
                      {base.toUpperCase()}
                    </span>
                  </span>
                );
              })}
              {grouping > 0 && ci < chunks.length - 1 && (
                <span style={{ color: 'var(--border)', margin: '0 1px' }}> </span>
              )}
            </span>
            );
          })}
        </div>
      </div>

      {/* Fade gradient overlay */}
      {showFade && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'linear-gradient(transparent, var(--bg-deep))',
            borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Expand/collapse toggle */}
      {overflows && (
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            display: 'block',
            width: '100%',
            padding: '4px 0',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            textAlign: 'center',
            marginTop: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {expanded
            ? 'Show less'
            : `Show all \u00b7 ${sequence.length.toLocaleString()} ${isProtein ? 'aa' : 'bp'}`}
        </button>
      )}
    </div>
  );
}
