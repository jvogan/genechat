import { useMemo, useState } from 'react';
import type { Feature } from '../../bio/types';

interface FeatureAnnotationTrackProps {
  features: Feature[];
  totalLength: number;
  onFeatureClick?: (featureId: string) => void;
}

interface PackedRow {
  feature: Feature;
  row: number;
}

/** Default feature color palette */
const DEFAULT_COLORS: Record<string, string> = {
  orf: '#4ade80',
  gene: '#4ade80',
  cds: '#60a5fa',
  promoter: '#fbbf24',
  rbs: '#a78bfa',
  origin: '#22d3ee',
  misc_feature: '#a78bfa',
};

export default function FeatureAnnotationTrack({
  features,
  totalLength,
  onFeatureClick,
}: FeatureAnnotationTrackProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Pack features into non-overlapping rows
  const packed = useMemo((): PackedRow[] => {
    if (features.length === 0 || totalLength === 0) return [];

    // Sort by start position
    const sorted = [...features].sort((a, b) => a.start - b.start);
    const rows: number[][] = []; // each row is array of end positions
    const result: PackedRow[] = [];

    for (const feat of sorted) {
      let placed = false;
      for (let r = 0; r < rows.length; r++) {
        const lastEnd = rows[r][rows[r].length - 1];
        if (feat.start >= lastEnd) {
          rows[r].push(feat.end);
          result.push({ feature: feat, row: r });
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([feat.end]);
        result.push({ feature: feat, row: rows.length - 1 });
      }
    }
    return result;
  }, [features, totalLength]);

  if (packed.length === 0) return null;

  const maxRow = Math.max(...packed.map((p) => p.row));
  const barHeight = 14;
  const rowGap = 2;
  const totalHeight = (maxRow + 1) * (barHeight + rowGap);

  return (
    <div
      style={{
        position: 'relative',
        height: totalHeight,
        marginBottom: 4,
        userSelect: 'none',
      }}
    >
      {packed.map(({ feature, row }) => {
        const left = (feature.start / totalLength) * 100;
        const width = Math.max(((feature.end - feature.start) / totalLength) * 100, 0.5);
        const color = feature.color || DEFAULT_COLORS[feature.type] || '#a78bfa';
        const isHovered = hoveredId === feature.id;

        return (
          <div
            key={feature.id}
            title={`${feature.name} (${feature.type}) ${feature.start + 1}..${feature.end}`}
            onClick={() => onFeatureClick?.(feature.id)}
            onMouseEnter={() => setHoveredId(feature.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: 'absolute',
              left: `${left}%`,
              width: `${width}%`,
              top: row * (barHeight + rowGap),
              height: barHeight,
              background: color,
              borderRadius: 2,
              cursor: 'pointer',
              opacity: isHovered ? 1 : 0.8,
              transition: 'opacity 0.12s',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 3,
              paddingRight: 2,
              minWidth: 4,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1,
                textShadow: '0 0 2px rgba(0,0,0,0.4)',
              }}
            >
              {feature.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
