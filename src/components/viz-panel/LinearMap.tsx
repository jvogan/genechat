import { useRef, useEffect, useCallback, useState } from 'react';
import { renderLinear, hitTestLinear } from '../../canvas/linear-renderer';
import { attachCanvasInteraction, createInitialInteractionState } from '../../canvas/interaction';
import type { CanvasInteractionState, InteractionEvent } from '../../canvas/interaction';
import type { Feature, RestrictionSite } from '../../bio/types';
import { useUIStore } from '../../store/ui-store';
import FeatureOverlay from './FeatureOverlay';

interface LinearMapProps {
  features: Feature[];
  restrictionSites: RestrictionSite[];
  totalLength: number;
  onFeatureSelect?: (featureId: string | null) => void;
  onPositionHover?: (bp: number | null) => void;
  onRangeSelect?: (range: { start: number; end: number } | null) => void;
}

export default function LinearMap({
  features,
  restrictionSites,
  totalLength,
  onFeatureSelect,
  onPositionHover,
  onRangeSelect,
}: LinearMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CanvasInteractionState>(createInitialInteractionState(totalLength));
  const rafRef = useRef<number>(0);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Keep viewport in sync when totalLength changes (e.g. switching sequence blocks)
  useEffect(() => {
    const state = stateRef.current;
    // Reset viewport to cover the full sequence when totalLength changes
    if (totalLength > 0) {
      state.viewport = { start: 0, end: totalLength };
      state.zoom = 1;
    }
  }, [totalLength]);

  // Sync external feature selection (from workspace pills) into canvas state
  const selectedFeatureId = useUIStore((s) => s.selectedFeatureId);
  const selectionSource = useUIStore((s) => s.selectionSource);
  useEffect(() => {
    // When selection comes from 'workspace', push it into canvas state so the
    // renderer highlights the corresponding rect on the linear map.
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
      case 'select':
        state.selectedRange = event.range;
        onRangeSelect?.(event.range);
        break;
      case 'zoom':
        state.zoom = event.zoom;
        state.viewport = event.viewport;
        break;
    }
  }, [features, onFeatureSelect, onPositionHover, onRangeSelect]);

  // Track mouse for tooltip
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
        renderLinear({
          canvas,
          features,
          restrictionSites,
          totalLength,
          viewport: state.viewport,
          zoom: state.zoom,
          hoveredFeature: state.hoveredFeature,
          selectedFeature: state.selectedFeature,
          selectedRange: state.selectedRange,
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
  }, [features, restrictionSites, totalLength]);

  // Interaction handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = attachCanvasInteraction({
      canvas,
      mode: 'linear',
      totalLength,
      onInteraction: handleInteraction,
      hitTest: (x, y) => hitTestLinear(x, y, canvas.getBoundingClientRect(), features, totalLength, stateRef.current.viewport),
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
