import { useMemo } from 'react';
import { gcContent, meltingTemperature } from '../../bio/gc-content';

interface StatusBarProps {
  totalLength: number;
  sequence: string;
  selectedRange: { start: number; end: number } | null;
  hoveredBP: number | null;
}

export default function StatusBar({
  totalLength,
  sequence,
  selectedRange,
  hoveredBP,
}: StatusBarProps) {
  const subseq = useMemo(
    () =>
      selectedRange
        ? sequence.slice(selectedRange.start, selectedRange.end)
        : sequence,
    [sequence, selectedRange],
  );

  const gc = useMemo(() => gcContent(subseq), [subseq]);
  const tm = useMemo(() => meltingTemperature(subseq), [subseq]);

  const displayLength = selectedRange
    ? selectedRange.end - selectedRange.start
    : totalLength;

  const divider = (
    <div
      style={{
        width: 1,
        height: 14,
        margin: '0 8px',
        background: 'var(--border-subtle)',
        flexShrink: 0,
      }}
    />
  );

  const label = (text: string) => (
    <span style={{ color: 'var(--text-muted)' }}>{text} </span>
  );

  const value = (text: string) => (
    <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
  );

  return (
    <div
      style={{
        height: 28,
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* BASES */}
      <span style={{ padding: '0 8px' }}>
        {label('BASES')}
        {value(totalLength.toLocaleString() + ' bp')}
      </span>

      {divider}

      {/* START */}
      <span style={{ padding: '0 8px' }}>
        {label('START')}
        {value(selectedRange ? (selectedRange.start + 1).toLocaleString() : '--')}
      </span>

      {divider}

      {/* END */}
      <span style={{ padding: '0 8px' }}>
        {label('END')}
        {value(selectedRange ? selectedRange.end.toLocaleString() : '--')}
      </span>

      {divider}

      {/* LENGTH */}
      <span style={{ padding: '0 8px' }}>
        {label('LENGTH')}
        {value(displayLength.toLocaleString())}
      </span>

      {divider}

      {/* GC */}
      <span style={{ padding: '0 8px' }}>
        {label('GC')}
        {value((gc * 100).toFixed(1) + '%')}
      </span>

      {divider}

      {/* Tm */}
      <span style={{ padding: '0 8px' }}>
        {label('Tm')}
        {value(tm !== null ? tm.toFixed(1) + '\u00B0C' : '--\u00B0C')}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Position readout */}
      {hoveredBP !== null && (
        <span style={{ padding: '0 8px', color: 'var(--text-secondary)' }}>
          pos {(hoveredBP + 1).toLocaleString()}
        </span>
      )}
    </div>
  );
}
