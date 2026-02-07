import { useState, useEffect, useMemo, useRef } from 'react';
import { X, GitCompare } from 'lucide-react';
import { sequenceDiff, type DiffResult } from '../../bio/sequence-diff';
import type { SequenceBlock } from '../../store/types';

interface SequenceDiffViewProps {
  blocks: SequenceBlock[];
  activeBlockId: string | null;
  onClose: () => void;
}

const OP_COLORS: Record<string, { bg: string; text: string }> = {
  match: { bg: 'transparent', text: 'var(--text-primary)' },
  mismatch: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
  insertion: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
  deletion: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
};

export default function SequenceDiffView({
  blocks,
  activeBlockId,
  onClose,
}: SequenceDiffViewProps) {
  const activeBlock = blocks.find(b => b.id === activeBlockId);
  const parentBlock = activeBlock?.parentBlockId
    ? blocks.find(b => b.id === activeBlock.parentBlockId)
    : null;

  const [blockAId, setBlockAId] = useState(activeBlockId || blocks[0]?.id || '');
  const [blockBId, setBlockBId] = useState(parentBlock?.id || (blocks.length > 1 ? blocks[1].id : ''));
  const alignRef = useRef<HTMLDivElement>(null);

  const blockA = blocks.find(b => b.id === blockAId);
  const blockB = blocks.find(b => b.id === blockBId);

  const result: DiffResult | null = useMemo(() => {
    if (!blockA || !blockB || blockA.id === blockB.id) return null;
    return sequenceDiff(blockA.raw, blockB.raw);
  }, [blockA, blockB]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    marginBottom: 4,
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    background: 'var(--bg-deep)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  };

  // Build aligned display with position ruler
  const renderAlignment = () => {
    if (!result) return null;

    const CHARS_PER_LINE = 60;
    const lines: { pos1: number; pos2: number; seq1: string; seq2: string; mid: string }[] = [];
    const { aligned1, aligned2 } = result;

    // Build midline
    let midline = '';
    for (let i = 0; i < aligned1.length; i++) {
      if (aligned1[i] === '-' || aligned2[i] === '-') {
        midline += ' ';
      } else if (aligned1[i] === aligned2[i]) {
        midline += '|';
      } else {
        midline += '.';
      }
    }

    // Split into lines
    let pos1 = 0;
    let pos2 = 0;
    for (let offset = 0; offset < aligned1.length; offset += CHARS_PER_LINE) {
      const s1 = aligned1.slice(offset, offset + CHARS_PER_LINE);
      const s2 = aligned2.slice(offset, offset + CHARS_PER_LINE);
      const m = midline.slice(offset, offset + CHARS_PER_LINE);

      lines.push({ pos1, pos2, seq1: s1, seq2: s2, mid: m });

      // Count non-gap characters for position tracking
      for (const c of s1) { if (c !== '-') pos1++; }
      for (const c of s2) { if (c !== '-') pos2++; }
    }

    return lines.map((line, lineIdx) => (
      <div key={lineIdx} style={{ marginBottom: 4 }}>
        {/* Position */}
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 1 }}>
          {line.pos1 + 1}
        </div>
        {/* Seq A */}
        <div style={{ display: 'flex', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: '16px', letterSpacing: '0.5px' }}>
          <span style={{ width: 20, fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>A</span>
          <span>
            {renderColoredSeq(line.seq1, line.seq2, 'A')}
          </span>
        </div>
        {/* Midline */}
        <div style={{ display: 'flex', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: '12px', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
          <span style={{ width: 20, flexShrink: 0 }}></span>
          <span>{line.mid}</span>
        </div>
        {/* Seq B */}
        <div style={{ display: 'flex', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: '16px', letterSpacing: '0.5px' }}>
          <span style={{ width: 20, fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>B</span>
          <span>
            {renderColoredSeq(line.seq2, line.seq1, 'B')}
          </span>
        </div>
      </div>
    ));
  };

  const renderColoredSeq = (seq: string, other: string, which: 'A' | 'B') => {
    const spans: React.ReactNode[] = [];
    let run = '';
    let runColor = '';

    const flush = (key: number) => {
      if (run.length > 0) {
        const colors = OP_COLORS[runColor] || OP_COLORS.match;
        spans.push(
          <span key={key} style={{ background: colors.bg, color: colors.text }}>
            {run}
          </span>
        );
        run = '';
      }
    };

    for (let i = 0; i < seq.length; i++) {
      const c = seq[i];
      const o = other[i] || '';
      let op: string;

      if (c === '-') {
        op = which === 'A' ? 'insertion' : 'deletion';
      } else if (o === '-') {
        op = which === 'A' ? 'deletion' : 'insertion';
      } else if (c === o) {
        op = 'match';
      } else {
        op = 'mismatch';
      }

      if (op !== runColor) {
        flush(i);
        runColor = op;
      }
      run += c;
    }
    flush(seq.length);
    return <>{spans}</>;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 660,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'menuFadeIn 0.15s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitCompare size={16} style={{ color: 'var(--accent)' }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              Compare Sequences
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', flex: 1 }}>
          {/* Block selectors */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Sequence A</label>
              <select
                value={blockAId}
                onChange={(e) => setBlockAId(e.target.value)}
                style={selectStyle}
              >
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.raw.length} {b.type === 'protein' ? 'aa' : 'bp'})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Sequence B</label>
              <select
                value={blockBId}
                onChange={(e) => setBlockBId(e.target.value)}
                style={selectStyle}
              >
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.raw.length} {b.type === 'protein' ? 'aa' : 'bp'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {blockAId === blockBId && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', textAlign: 'center', padding: 12 }}>
              Select two different sequences to compare
            </div>
          )}

          {/* Summary bar */}
          {result && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ fontWeight: 600, color: result.identity >= 95 ? 'var(--accent)' : result.identity >= 80 ? 'var(--text-secondary)' : '#ef4444' }}>
                {result.identity}% identity
              </span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: result.mismatches > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                {result.mismatches} mismatch{result.mismatches !== 1 ? 'es' : ''}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: result.insertions > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                {result.insertions} insertion{result.insertions !== 1 ? 's' : ''}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: result.deletions > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                {result.deletions} deletion{result.deletions !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Alignment view */}
          {result && (
            <div
              ref={alignRef}
              style={{
                maxHeight: 360,
                overflowY: 'auto',
                overflowX: 'auto',
                padding: '8px 12px',
                background: 'var(--bg-deep)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {renderAlignment()}
            </div>
          )}

          {/* Legend */}
          {result && (
            <div style={{ display: 'flex', gap: 16, fontSize: 10, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: OP_COLORS.match.bg, border: '1px solid var(--border-subtle)', verticalAlign: 'middle', marginRight: 4 }}></span>Match</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: OP_COLORS.mismatch.bg, verticalAlign: 'middle', marginRight: 4 }}></span>Mismatch</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: OP_COLORS.insertion.bg, verticalAlign: 'middle', marginRight: 4 }}></span>Insertion</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: OP_COLORS.deletion.bg, verticalAlign: 'middle', marginRight: 4 }}></span>Deletion</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
