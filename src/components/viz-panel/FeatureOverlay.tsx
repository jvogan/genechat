import type { Feature } from '../../bio/types';

interface FeatureOverlayProps {
  feature: Feature;
  x: number;
  y: number;
}

const TYPE_LABELS: Record<string, string> = {
  orf: 'ORF',
  gene: 'Gene',
  cds: 'CDS',
  promoter: 'Promoter',
  terminator: 'Terminator',
  rbs: 'RBS',
  origin: 'Origin',
  resistance: 'Resistance',
  restriction_site: 'Restriction Site',
  primer_bind: 'Primer Binding',
  misc_feature: 'Feature',
  custom: 'Custom',
};

export default function FeatureOverlay({ feature, x, y }: FeatureOverlayProps) {
  const length = feature.end - feature.start;
  const strandLabel = feature.strand === 1 ? 'Forward (+)' : 'Reverse (-)';
  const typeLabel = TYPE_LABELS[feature.type] || feature.type;

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.min(x + 12, window.innerWidth - 280),
        top: Math.max(y - 10, 4),
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '8px 12px',
        pointerEvents: 'none',
        zIndex: 50,
        boxShadow: 'var(--shadow-md)',
        minWidth: 160,
        maxWidth: 260,
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.12s ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: feature.color || 'var(--accent)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {feature.name}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '3px 10px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Type</span>
        <span style={{ color: 'var(--text-secondary)' }}>{typeLabel}</span>

        <span style={{ color: 'var(--text-muted)' }}>Range</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {feature.start + 1}..{feature.end}
        </span>

        <span style={{ color: 'var(--text-muted)' }}>Length</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {length.toLocaleString()} bp
        </span>

        <span style={{ color: 'var(--text-muted)' }}>Strand</span>
        <span style={{ color: 'var(--text-secondary)' }}>{strandLabel}</span>
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Click to select
      </div>
    </div>
  );
}
