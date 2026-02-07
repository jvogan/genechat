import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SequenceType } from '../../bio/types';
import { gcContent, molecularWeight, meltingTemperature, proteinMolecularWeight } from '../../bio/gc-content';
import { findORFs } from '../../bio/orf-detection';

interface BlockStatsRowProps {
  raw: string;
  type: SequenceType;
  selectedRange?: { start: number; end: number } | null;
}

interface StatPill {
  label: string;
  value: string;
  title?: string;
}

export default function BlockStatsRow({ raw, type, selectedRange }: BlockStatsRowProps) {
  const [collapsed, setCollapsed] = useState(false);

  const stats = useMemo((): StatPill[] => {
    if (!raw || raw.length === 0) return [];
    const isProtein = type === 'protein';
    const isNucleotide = type === 'dna' || type === 'rna';

    if (isProtein) {
      const mw = proteinMolecularWeight(raw);
      return [
        { label: 'Length', value: `${raw.length.toLocaleString()} aa` },
        { label: 'MW', value: mw > 1e6 ? `${(mw / 1e6).toFixed(2)} MDa` : mw > 1000 ? `${(mw / 1000).toFixed(1)} kDa` : `${mw.toFixed(0)} Da`, title: `${mw.toFixed(1)} Da` },
      ];
    }

    if (isNucleotide) {
      const gc = gcContent(raw);
      const mw = molecularWeight(raw);
      const tm = meltingTemperature(raw);
      const pills: StatPill[] = [
        { label: 'Length', value: `${raw.length.toLocaleString()} bp` },
        { label: 'GC', value: `${(gc * 100).toFixed(1)}%` },
        { label: 'MW', value: mw > 1e6 ? `${(mw / 1e6).toFixed(2)} MDa` : mw > 1000 ? `${(mw / 1000).toFixed(1)} kDa` : `${mw.toFixed(0)} Da`, title: `${mw.toFixed(1)} Da` },
      ];
      if (tm !== null) {
        pills.push({ label: 'Tm', value: `${tm.toFixed(1)}°C` });
      }
      // ORF count — skip for very long sequences
      if (raw.length <= 50000) {
        const orfs = findORFs(raw, 30);
        pills.push({ label: 'ORFs', value: String(orfs.length) });
      }
      return pills;
    }

    // misc/unknown/mixed — just show length
    return [{ label: 'Length', value: `${raw.length.toLocaleString()}` }];
  }, [raw, type]);

  const selectionStats = useMemo((): StatPill[] => {
    if (!selectedRange || !raw) return [];
    const sel = raw.slice(selectedRange.start, selectedRange.end);
    if (sel.length === 0) return [];
    const isProtein = type === 'protein';
    const isNucleotide = type === 'dna' || type === 'rna';

    if (isProtein) {
      const mw = proteinMolecularWeight(sel);
      return [
        { label: 'Sel', value: `${sel.length.toLocaleString()} aa` },
        { label: 'MW', value: mw > 1e6 ? `${(mw / 1e6).toFixed(2)} MDa` : mw > 1000 ? `${(mw / 1000).toFixed(1)} kDa` : `${mw.toFixed(0)} Da`, title: `${mw.toFixed(1)} Da` },
      ];
    }

    if (isNucleotide) {
      const gc = gcContent(sel);
      const mw = molecularWeight(sel);
      const tm = meltingTemperature(sel);
      const pills: StatPill[] = [
        { label: 'Sel', value: `${sel.length.toLocaleString()} bp` },
        { label: 'GC', value: `${(gc * 100).toFixed(1)}%` },
        { label: 'MW', value: mw > 1e6 ? `${(mw / 1e6).toFixed(2)} MDa` : mw > 1000 ? `${(mw / 1000).toFixed(1)} kDa` : `${mw.toFixed(0)} Da`, title: `${mw.toFixed(1)} Da` },
      ];
      if (tm !== null) {
        pills.push({ label: 'Tm', value: `${tm.toFixed(1)}°C` });
      }
      return pills;
    }

    return [{ label: 'Sel', value: `${sel.length.toLocaleString()}` }];
  }, [selectedRange, raw, type]);

  if (stats.length === 0) return null;

  return (
    <div style={{ marginBottom: 6, userSelect: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          title={collapsed ? 'Expand stats' : 'Collapse stats'}
        >
          <ChevronDown
            size={10}
            style={{
              transform: collapsed ? 'rotate(-90deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>
        {!collapsed &&
          stats.map((stat) => (
            <span
              key={stat.label}
              title={stat.title}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '1px 7px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 9 }}>{stat.label}</span>
              {stat.value}
            </span>
          ))}
        {selectedRange && selectionStats.length > 0 && !collapsed && (
          <>
            <div style={{ width: '100%', height: 0 }} />
            {selectionStats.map((stat) => (
              <span
                key={`sel-${stat.label}`}
                title={stat.title}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '1px 7px',
                  background: 'var(--accent-subtle)',
                  borderRadius: 10,
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 9 }}>{stat.label}</span>
                {stat.value}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
