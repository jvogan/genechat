import { useState, useEffect, useMemo } from 'react';
import { X, Search, Scissors } from 'lucide-react';
import { RESTRICTION_ENZYMES, findRestrictionSites } from '../../bio/restriction-sites';
import { restrictionDigest, type DigestFragment } from '../../bio/restriction-digest';
import type { Topology } from '../../bio/types';

interface DigestDialogProps {
  sequence: string;
  sequenceName: string;
  topology: Topology;
  onDigest: (fragments: DigestFragment[]) => void;
  onClose: () => void;
}

export default function DigestDialog({
  sequence,
  sequenceName,
  topology,
  onDigest,
  onClose,
}: DigestDialogProps) {
  const [selectedEnzymes, setSelectedEnzymes] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');

  // Pre-compute cut counts for all enzymes
  const enzymeCutCounts = useMemo(() => {
    const sites = findRestrictionSites(sequence);
    const counts = new Map<string, number>();
    for (const enzyme of RESTRICTION_ENZYMES) {
      counts.set(enzyme.name, 0);
    }
    for (const site of sites) {
      counts.set(site.enzyme, (counts.get(site.enzyme) ?? 0) + 1);
    }
    return counts;
  }, [sequence]);

  // Sort enzymes: cutters first (by cut count desc), then non-cutters alphabetically
  const sortedEnzymes = useMemo(() => {
    return [...RESTRICTION_ENZYMES].sort((a, b) => {
      const aCuts = enzymeCutCounts.get(a.name) ?? 0;
      const bCuts = enzymeCutCounts.get(b.name) ?? 0;
      if (aCuts > 0 && bCuts === 0) return -1;
      if (aCuts === 0 && bCuts > 0) return 1;
      if (aCuts !== bCuts) return bCuts - aCuts;
      return a.name.localeCompare(b.name);
    });
  }, [enzymeCutCounts]);

  // Filter by search
  const filteredEnzymes = useMemo(() => {
    if (!searchFilter) return sortedEnzymes;
    const lower = searchFilter.toLowerCase();
    return sortedEnzymes.filter(e =>
      e.name.toLowerCase().includes(lower) ||
      e.recognitionSequence.toLowerCase().includes(lower)
    );
  }, [sortedEnzymes, searchFilter]);

  // Compute digest preview
  const preview = useMemo(() => {
    if (selectedEnzymes.size === 0) return null;
    const names = Array.from(selectedEnzymes);
    const fragments = restrictionDigest(sequence, names, topology);

    let totalCuts = 0;
    for (const name of names) {
      totalCuts += enzymeCutCounts.get(name) ?? 0;
    }

    return { fragments, totalCuts };
  }, [selectedEnzymes, sequence, topology, enzymeCutCounts]);

  const toggleEnzyme = (name: string) => {
    setSelectedEnzymes(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const selectUniqueCutters = () => {
    const unique = new Set<string>();
    for (const [name, count] of enzymeCutCounts) {
      if (count === 1) unique.add(name);
    }
    setSelectedEnzymes(unique);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDigest = () => {
    if (!preview || preview.fragments.length <= 1) return;
    onDigest(preview.fragments);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    marginBottom: 4,
  };

  // Max fragment size for bar scaling
  const maxFragSize = preview
    ? Math.max(...preview.fragments.map(f => f.length))
    : 0;

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
          maxWidth: 480,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'menuFadeIn 0.15s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
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
            <Scissors size={16} style={{ color: 'var(--accent)' }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              Restriction Digest
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

        {/* Sequence info */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 12,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{sequenceName}</span>
          <span style={{ marginLeft: 8 }}>{sequence.length.toLocaleString()} bp</span>
          <span style={{ marginLeft: 8 }}>{topology}</span>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', flex: 1 }}>
          {/* Search + shortcuts */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter enzymes..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 28px',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <button
              onClick={selectUniqueCutters}
              style={{
                padding: '5px 10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              title="Select only enzymes that cut exactly once"
            >
              Unique cutters
            </button>
            {selectedEnzymes.size > 0 && (
              <button
                onClick={() => setSelectedEnzymes(new Set())}
                style={{
                  padding: '5px 8px',
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Enzyme checklist */}
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            {filteredEnzymes.map(enzyme => {
              const cuts = enzymeCutCounts.get(enzyme.name) ?? 0;
              const isSelected = selectedEnzymes.has(enzyme.name);
              const noCuts = cuts === 0;

              return (
                <label
                  key={enzyme.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    cursor: noCuts ? 'default' : 'pointer',
                    opacity: noCuts ? 0.4 : 1,
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!noCuts && !isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={noCuts}
                    onChange={() => toggleEnzyme(enzyme.name)}
                    style={{ margin: 0, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', minWidth: 50 }}>
                    {enzyme.name}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flex: 1 }}>
                    {enzyme.recognitionSequence}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 500,
                      color: cuts === 1 ? 'var(--accent)' : cuts > 1 ? 'var(--text-secondary)' : 'var(--text-muted)',
                      minWidth: 40,
                      textAlign: 'right',
                    }}
                  >
                    {cuts === 0 ? 'none' : `${cuts}${cuts === 1 ? ' cut' : ' cuts'}`}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Preview */}
          {preview && preview.fragments.length > 0 && (
            <div>
              <label style={labelStyle}>
                Preview: {selectedEnzymes.size} enzyme{selectedEnzymes.size !== 1 ? 's' : ''}, {preview.totalCuts} cut{preview.totalCuts !== 1 ? 's' : ''} → {preview.fragments.length} fragment{preview.fragments.length !== 1 ? 's' : ''}
              </label>

              {/* Virtual gel — proportional bar chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
                {preview.fragments
                  .sort((a, b) => b.length - a.length)
                  .map((frag, i) => {
                    const pct = maxFragSize > 0 ? (frag.length / maxFragSize) * 100 : 100;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            height: 16,
                            width: `${Math.max(pct, 4)}%`,
                            background: 'var(--accent)',
                            borderRadius: 3,
                            opacity: 0.7,
                            transition: 'width 0.2s ease',
                          }}
                        />
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {frag.length.toLocaleString()} bp
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                          {frag.leftEnzyme && frag.rightEnzyme
                            ? `${frag.leftEnzyme}–${frag.rightEnzyme}`
                            : frag.leftEnzyme || frag.rightEnzyme || 'end'
                          }
                        </span>
                      </div>
                    );
                  })}
              </div>
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
            Cancel
          </button>
          <button
            onClick={handleDigest}
            disabled={!preview || preview.totalCuts === 0}
            style={{
              padding: '6px 14px',
              background: preview && preview.totalCuts > 0 ? 'var(--accent)' : 'var(--bg-active)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: preview && preview.totalCuts > 0 ? '#fff' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: preview && preview.totalCuts > 0 ? 'pointer' : 'default',
              opacity: preview && preview.totalCuts > 0 ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
            onMouseEnter={(e) => {
              if (preview && preview.totalCuts > 0) e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              if (preview && preview.totalCuts > 0) e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            <Scissors size={13} />
            Digest
          </button>
        </div>
      </div>
    </div>
  );
}
