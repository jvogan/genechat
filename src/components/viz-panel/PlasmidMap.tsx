import { useRef, useEffect, useCallback, useState } from 'react';
import { renderPlasmid, hitTestPlasmid } from '../../canvas/plasmid-renderer';
import { attachCanvasInteraction, createInitialInteractionState } from '../../canvas/interaction';
import type { CanvasInteractionState, InteractionEvent } from '../../canvas/interaction';
import type { Feature, RestrictionSite } from '../../bio/types';
import { useUIStore } from '../../store/ui-store';
import FeatureOverlay from './FeatureOverlay';

interface PlasmidMapProps {
  features: Feature[];
  restrictionSites: RestrictionSite[];
  totalLength: number;
  topology: 'linear' | 'circular';
  onFeatureSelect?: (featureId: string | null) => void;
  onPositionHover?: (bp: number | null) => void;
}

export default function PlasmidMap({
  features,
  restrictionSites,
  totalLength,
  topology,
  onFeatureSelect,
  onPositionHover,
}: PlasmidMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CanvasInteractionState>(createInitialInteractionState(totalLength));
  const rafRef = useRef<number>(0);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Reset interaction state when totalLength changes (e.g. switching sequence blocks)
  useEffect(() => {
    const state = stateRef.current;
    if (totalLength > 0) {
      state.viewport = { start: 0, end: totalLength };
      state.rotation = 0;
      state.zoom = 1;
    }
  }, [totalLength]);

  // Sync external feature selection (from workspace pills) into canvas state
  const selectedFeatureId = useUIStore((s) => s.selectedFeatureId);
  const selectionSource = useUIStore((s) => s.selectionSource);
  useEffect(() => {
    // When selection comes from 'workspace', push it into canvas state so the
    // renderer highlights the corresponding arc on the plasmid map.
    if (selectionSource === 'workspace' || selectedFeatureId === null) {
      stateRef.current.selectedFeature = selectedFeatureId;
    }
  }, [selectedFeatureId, selectionSource]);

  const handleInteraction = useCallback((event: InteractionEvent) => {
    const state = stateRef.current;
    switch (event.type) {
      case 'hover':
        state.hoveredFeature = event.featureId;
        if (event.featureId) {
          const feat = features.find(f => f.id === event.featureId);
          setHoveredFeature(feat || null);
        } else {
          setHoveredFeature(null);
        }
        onPositionHover?.(event.bp);
        break;
      case 'click':
        state.selectedFeature = event.featureId;
        onFeatureSelect?.(event.featureId);
        break;
      case 'rotate':
        state.rotation = event.rotation;
        break;
      case 'zoom':
        state.zoom = event.zoom;
        break;
    }
  }, [features, onFeatureSelect, onPositionHover]);

  // Track mouse position for tooltip
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    canvas.addEventListener('mousemove', onMouse);
    return () => canvas.removeEventListener('mousemove', onMouse);
  }, []);

  // Render loop with ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    let running = true;
    const render = () => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const state = stateRef.current;
        renderPlasmid({
          canvas,
          features,
          restrictionSites,
          totalLength,
          rotation: state.rotation,
          hoveredFeature: state.hoveredFeature,
          selectedFeature: state.selectedFeature,
          topology,
        });
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    // Watch for container resize so canvas re-renders at new dimensions
    const observer = new ResizeObserver(() => {
      // The RAF loop will pick up the new size automatically
    });
    observer.observe(container);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [features, restrictionSites, totalLength, topology]);

  // Interaction handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = attachCanvasInteraction({
      canvas,
      mode: 'plasmid',
      totalLength,
      onInteraction: handleInteraction,
      hitTest: (x, y) => hitTestPlasmid(x, y, canvas.getBoundingClientRect(), features, totalLength, stateRef.current.rotation),
      getState: () => stateRef.current,
    });

    return cleanup;
  }, [features, totalLength, handleInteraction]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {hoveredFeature && tooltipPos && (
        <FeatureOverlay
          feature={hoveredFeature}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </div>
  );
}
