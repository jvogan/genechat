import { useState, useMemo } from 'react';
import { Copy, Check, Scissors, Tag, BarChart3 } from 'lucide-react';
import type { SequenceType } from '../../bio/types';
import { gcContent, meltingTemperature, molecularWeight, proteinMolecularWeight } from '../../bio/gc-content';
import { reverseComplement } from '../../bio';

interface SelectionActionBarProps {
  raw: string;
  type: SequenceType;
  selectedRange: { start: number; end: number };
  onExtract: () => void;
  onAddFeature: () => void;
}

export default function SelectionActionBar({
  raw,
  type,
  selectedRange,
  onExtract,
  onAddFeature,
}: SelectionActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [rcCopied, setRcCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const substring = raw.slice(selectedRange.start, selectedRange.end);
  const isProtein = type === 'protein';
  const isNucleotide = type === 'dna' || type === 'rna';

  const stats = useMemo(() => {
    if (!substring) return null;
    if (isProtein) {
      const mw = proteinMolecularWeight(substring);
      return { length: `${substring.length} aa`, mw: `${(mw / 1000).toFixed(1)} kDa` };
    }
    if (isNucleotide) {
      const gc = gcContent(substring);
      const tm = meltingTemperature(substring);
      const mw = molecularWeight(substring);
      return {
        length: `${substring.length} bp`,
        gc: `${(gc * 100).toFixed(1)}% GC`,
        tm: tm !== null ? `Tm ${tm.toFixed(1)}°C` : null,
        mw: mw > 1000 ? `${(mw / 1000).toFixed(1)} kDa` : `${mw.toFixed(0)} Da`,
      };
    }
    return { length: `${substring.length}` };
  }, [substring, isProtein, isNucleotide]);

  const handleCopy = () => {
    navigator.clipboard.writeText(substring);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    whiteSpace: 'nowrap',
    transition: 'background 0.1s',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '3px 6px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        animation: 'menuFadeIn 0.12s ease',
        marginTop: 6,
        marginBottom: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* Selection range badge */}
      <span
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          padding: '2px 6px',
          whiteSpace: 'nowrap',
        }}
      >
        {selectedRange.start + 1}–{selectedRange.end} ({substring.length}{isProtein ? ' aa' : ' bp'})
      </span>

      <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

      <button
        onClick={handleCopy}
        style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        title="Copy selection"
      >
        {copied ? <Check size={12} style={{ color: 'var(--accent)' }} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      {isNucleotide && (
        <button
          onClick={() => {
            const rc = reverseComplement(substring, type === 'rna');
            navigator.clipboard.writeText(rc);
            setRcCopied(true);
            setTimeout(() => setRcCopied(false), 1500);
          }}
          style={{
            ...btnStyle,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: 0.5,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          title="Copy reverse complement"
        >
          {rcCopied ? <Check size={12} style={{ color: 'var(--accent)' }} /> : null}
          {rcCopied ? 'RC copied' : 'RC'}
        </button>
      )}

      <button
        onClick={onExtract}
        style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        title="Extract selection as new block"
      >
        <Scissors size={12} />
        Extract
      </button>

      <button
        onClick={onAddFeature}
        style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        title="Add feature annotation at selection"
      >
        <Tag size={12} />
        Feature
      </button>

      <button
        onClick={() => setShowStats((v) => !v)}
        style={{
          ...btnStyle,
          color: showStats ? 'var(--accent)' : 'var(--text-secondary)',
          background: showStats ? 'var(--accent-subtle)' : 'none',
        }}
        onMouseEnter={(e) => { if (!showStats) e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { if (!showStats) e.currentTarget.style.background = 'none'; }}
        title="Show selection stats"
      >
        <BarChart3 size={12} />
        Stats
      </button>

      {/* Stats popover */}
      {showStats && stats && (
        <>
          <div style={{ width: '100%', height: 0 }} /> {/* force wrap */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '4px 8px',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
            }}
          >
            <span>{stats.length}</span>
            {'gc' in stats && stats.gc && <span>{stats.gc}</span>}
            {'tm' in stats && stats.tm && <span>{stats.tm}</span>}
            <span>{stats.mw}</span>
          </div>
        </>
      )}
    </div>
  );
}
