import { useState, useMemo } from 'react';
import type { SequenceType, ORF } from '../../bio/types';
import { findORFs } from '../../bio/orf-detection';

interface ORFTrackProps {
  raw: string;
  type: SequenceType;
  totalLength: number;
  onORFClick?: (orf: ORF) => void;
}

const FRAME_COLORS: Record<string, string> = {
  '+1': '#4ade80',
  '+2': '#60a5fa',
  '+3': '#a78bfa',
  '-1': '#fb7185',
  '-2': '#fbbf24',
  '-3': '#22d3ee',
};

const FRAME_LABELS = ['+1', '+2', '+3', '-1', '-2', '-3'];

export default function ORFTrack({ raw, type, totalLength, onORFClick }: ORFTrackProps) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Find ORFs
  const orfs = useMemo(() => {
    if (type === 'protein' || raw.length > 50000) return [];
    return findORFs(raw, 30); // min 30 amino acids
  }, [raw, type]);

  // Guard
  if (type === 'protein' || raw.length > 50000 || orfs.length === 0) return null;

  // Group ORFs by frame key
  const orfsByFrame: Record<string, ORF[]> = {};
  for (const label of FRAME_LABELS) orfsByFrame[label] = [];
  for (const orf of orfs) {
    const key = `${orf.strand === 1 ? '+' : '-'}${orf.frame}`;
    if (orfsByFrame[key]) orfsByFrame[key].push(orf);
  }

  const rowHeight = 12;
  const rowGap = 1;

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Toggle pill */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          background: expanded ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
          border: '1px solid ' + (expanded ? 'var(--border-accent)' : 'var(--border-subtle)'),
          borderRadius: 10,
          color: expanded ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          transition: 'all 0.12s',
          marginBottom: expanded ? 4 : 0,
        }}
      >
        ORFs ({orfs.length})
      </button>

      {/* Expanded 6-frame view */}
      {expanded && (
        <div style={{
          position: 'relative',
          animation: 'menuFadeIn 0.15s ease',
        }}>
          {FRAME_LABELS.map((label, rowIdx) => (
            <div
              key={label}
              style={{
                display: 'flex',
                height: rowHeight,
                marginBottom: rowIdx < 5 ? rowGap : 0,
              }}
            >
              {/* Frame label */}
              <div style={{
                width: 30,
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: FRAME_COLORS[label],
                fontWeight: 600,
                lineHeight: `${rowHeight}px`,
                textAlign: 'right',
                paddingRight: 4,
                flexShrink: 0,
                userSelect: 'none',
              }}>
                {label}
              </div>

              {/* Track row */}
              <div style={{
                flex: 1,
                position: 'relative',
                background: 'var(--bg-secondary)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                {orfsByFrame[label].map((orf, i) => {
                  const left = (orf.start / totalLength) * 100;
                  const width = Math.max(((orf.end - orf.start) / totalLength) * 100, 0.5);
                  const color = FRAME_COLORS[label];
                  const globalIdx = orfs.indexOf(orf);
                  const isHovered = hoveredIdx === globalIdx;
                  const isForward = orf.strand === 1;

                  return (
                    <div
                      key={`${label}-${i}`}
                      title={`${orf.aminoAcids} aa, ${orf.startCodon}\u2192${orf.stopCodon || 'end'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onORFClick?.(orf);
                      }}
                      onMouseEnter={() => setHoveredIdx(globalIdx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        top: 0,
                        height: '100%',
                        background: color,
                        opacity: isHovered ? 1 : 0.7,
                        cursor: 'pointer',
                        transition: 'opacity 0.1s',
                        borderRadius: isForward ? '0 3px 3px 0' : '3px 0 0 3px',
                        minWidth: 3,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
