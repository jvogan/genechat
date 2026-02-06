import { useState } from 'react';
import type { Feature } from '../../bio/types';
import { useUIStore } from '../../store/ui-store';

interface FeatureSelectorProps {
  features: Feature[];
  onSelect?: (feature: Feature) => void;
  maxVisible?: number;
}

const featureTypeColors: Record<string, string> = {
  orf: 'var(--green)',
  gene: 'var(--green)',
  cds: 'var(--cyan)',
  promoter: 'var(--amber)',
  terminator: 'var(--rose)',
  rbs: 'var(--purple)',
  origin: 'var(--blue)',
  resistance: '#f97316',
  restriction_site: 'var(--rose)',
  primer_bind: 'var(--text-muted)',
  misc_feature: 'var(--text-muted)',
  custom: 'var(--accent)',
};

export default function FeatureSelector({ features, onSelect, maxVisible = 5 }: FeatureSelectorProps) {
  const selectedFeatureId = useUIStore((s) => s.selectedFeatureId);
  const selectFeature = useUIStore((s) => s.selectFeature);
  const [expanded, setExpanded] = useState(false);

  if (features.length === 0) return null;

  const visibleFeatures = expanded ? features : features.slice(0, maxVisible);
  const hiddenCount = features.length - maxVisible;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 0' }}>
      {visibleFeatures.map(f => {
        const color = f.color || featureTypeColors[f.type] || 'var(--text-muted)';
        const active = f.id === selectedFeatureId;
        return (
          <button
            key={f.id}
            onClick={() => {
              const newId = active ? null : f.id;
              selectFeature(newId, 'workspace');
              if (!active) onSelect?.(f);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              background: active ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              border: active ? `1px solid ${color}` : '1px solid var(--border-subtle)',
              borderLeft: `3px solid ${color}`,
              borderRadius: 'var(--radius-sm)',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 10,
              fontWeight: active ? 600 : 500,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              boxShadow: active ? `0 0 0 1px ${color}33` : 'none',
            }}
          >
            {f.name}
            <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
              {f.start + 1}..{f.end}
            </span>
          </button>
        );
      })}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: 10,
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          +{hiddenCount} more
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: 10,
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
          }}
        >
          Show less
        </button>
      )}
    </div>
  );
}
