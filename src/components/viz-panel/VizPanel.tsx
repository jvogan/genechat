import { useState, useCallback } from 'react';
import type { Feature, RestrictionSite, Topology } from '../../bio/types';
import PlasmidMap from './PlasmidMap';
import LinearMap from './LinearMap';
import ZoomControls from './ZoomControls';

type ViewMode = 'circular' | 'linear';

interface VizPanelProps {
  features: Feature[];
  restrictionSites: RestrictionSite[];
  totalLength: number;
  topology: Topology;
  onClose?: () => void;
  onFeatureSelect?: (featureId: string | null) => void;
}

export default function VizPanel({
  features,
  restrictionSites,
  totalLength,
  topology,
  onClose,
  onFeatureSelect,
}: VizPanelProps) {
  const [mode, setMode] = useState<ViewMode>(topology === 'circular' ? 'circular' : 'linear');
  const [zoom, setZoom] = useState(1);
  const [hoveredBP, setHoveredBP] = useState<number | null>(null);
  const [viewport] = useState({ start: 0, end: Math.min(totalLength, totalLength) });

  const handlePositionHover = useCallback((bp: number | null) => {
    setHoveredBP(bp);
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header with tab toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Tab toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: 2,
            gap: 2,
          }}
        >
          <TabButton
            active={mode === 'circular'}
            onClick={() => setMode('circular')}
            label="Circular"
          />
          <TabButton
            active={mode === 'linear'}
            onClick={() => setMode('linear')}
            label="Linear"
          />
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 16,
              lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            aria-label="Close visualization panel"
          >
            ×
          </button>
        )}
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {totalLength <= 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 8,
              color: 'var(--text-muted)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 4 }}>&#x1F9EC;</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>No sequence selected</div>
            <div style={{ fontSize: 11 }}>
              Select a sequence block to view its map
            </div>
          </div>
        ) : (
          <>
            {mode === 'circular' ? (
              <PlasmidMap
                features={features}
                restrictionSites={restrictionSites}
                totalLength={totalLength}
                topology={topology}
                onFeatureSelect={onFeatureSelect}
                onPositionHover={handlePositionHover}
              />
            ) : (
              <LinearMap
                features={features}
                restrictionSites={restrictionSites}
                totalLength={totalLength}
                onFeatureSelect={onFeatureSelect}
                onPositionHover={handlePositionHover}
              />
            )}

            {/* Zoom controls overlay */}
            <ZoomControls
              zoom={zoom}
              position={hoveredBP}
              totalLength={totalLength}
              viewport={viewport}
              onZoomChange={handleZoomChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 'calc(var(--radius-sm) - 2px)',
        border: 'none',
        background: active ? 'var(--bg-active)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {label}
    </button>
  );
}
