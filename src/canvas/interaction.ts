export interface CanvasInteractionState {
  hoveredPosition: number | null;
  hoveredFeature: string | null;
  selectedFeature: string | null;
  selectedRange: { start: number; end: number } | null;
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  rotation: number;
  zoom: number;
  viewport: { start: number; end: number };
}

export type InteractionEvent =
  | { type: 'hover'; featureId: string | null; bp: number | null }
  | { type: 'click'; featureId: string | null; bp: number }
  | { type: 'select'; range: { start: number; end: number } }
  | { type: 'rotate'; rotation: number }
  | { type: 'zoom'; zoom: number; viewport: { start: number; end: number } }
  | { type: 'drag-start'; x: number; y: number }
  | { type: 'drag-end' };

export type InteractionCallback = (event: InteractionEvent) => void;

export interface CanvasInteractionOptions {
  canvas: HTMLCanvasElement;
  mode: 'plasmid' | 'linear' | 'base';
  totalLength: number;
  onInteraction: InteractionCallback;
  hitTest: (x: number, y: number) => { featureId: string | null; bp: number };
  getState: () => CanvasInteractionState;
}

export function attachCanvasInteraction(options: CanvasInteractionOptions): () => void {
  const { canvas, mode, totalLength, onInteraction, hitTest, getState } = options;
  const abortController = new AbortController();
  const signal = abortController.signal;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartRotation = 0;
  let selectionStart: number | null = null;

  const getCanvasCoords = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (isDragging && mode === 'plasmid') {
      // Drag rotation for plasmid
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      const startAngle = Math.atan2(dragStartY - cy, dragStartX - cx);
      const delta = angle - startAngle;
      onInteraction({ type: 'rotate', rotation: dragStartRotation + delta });
      return;
    }

    if (isDragging && (mode === 'linear' || mode === 'base') && selectionStart !== null) {
      // Selection drag
      const result = hitTest(x, y);
      const start = Math.min(selectionStart, result.bp);
      const end = Math.max(selectionStart, result.bp);
      onInteraction({ type: 'select', range: { start, end } });
      return;
    }

    // Hover
    const result = hitTest(x, y);
    onInteraction({ type: 'hover', featureId: result.featureId, bp: result.bp });
    canvas.style.cursor = result.featureId ? 'pointer' : 'default';
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    const { x, y } = getCanvasCoords(e);
    isDragging = true;
    dragStartX = x;
    dragStartY = y;

    if (mode === 'plasmid') {
      dragStartRotation = getState().rotation;
    } else {
      const result = hitTest(x, y);
      selectionStart = result.bp;
    }

    onInteraction({ type: 'drag-start', x, y });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    const { x, y } = getCanvasCoords(e);

    // Detect click (minimal drag distance)
    const dist = Math.sqrt((x - dragStartX) ** 2 + (y - dragStartY) ** 2);
    if (dist < 4) {
      const result = hitTest(x, y);
      onInteraction({ type: 'click', featureId: result.featureId, bp: result.bp });
    }

    isDragging = false;
    selectionStart = null;
    onInteraction({ type: 'drag-end' });
  };

  const handleMouseLeave = () => {
    isDragging = false;
    selectionStart = null;
    onInteraction({ type: 'hover', featureId: null, bp: null });
    canvas.style.cursor = 'default';
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const state = getState();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(50, state.zoom * zoomDelta));

    if (mode === 'plasmid') {
      // No viewport zoom for plasmid - zoom is visual only
      onInteraction({ type: 'zoom', zoom: newZoom, viewport: state.viewport });
      return;
    }

    // For linear/base: zoom into cursor position
    const { x } = getCanvasCoords(e);
    const rect = canvas.getBoundingClientRect();
    const marginLeft = mode === 'base' ? 60 : 40;
    const frac = (x - marginLeft) / (rect.width - marginLeft * 2);
    const viewLen = state.viewport.end - state.viewport.start;
    const newViewLen = Math.max(20, Math.min(totalLength, viewLen / zoomDelta));
    const centerBP = state.viewport.start + frac * viewLen;
    const newStart = Math.max(0, Math.round(centerBP - frac * newViewLen));
    const newEnd = Math.min(totalLength, Math.round(newStart + newViewLen));

    onInteraction({
      type: 'zoom',
      zoom: newZoom,
      viewport: { start: newStart, end: newEnd },
    });
  };

  canvas.addEventListener('mousemove', handleMouseMove, { signal });
  canvas.addEventListener('mousedown', handleMouseDown, { signal });
  canvas.addEventListener('mouseup', handleMouseUp, { signal });
  canvas.addEventListener('mouseleave', handleMouseLeave, { signal });
  canvas.addEventListener('wheel', handleWheel, { passive: false, signal });

  // Return cleanup function
  return () => abortController.abort();
}

export function createInitialInteractionState(totalLength: number): CanvasInteractionState {
  return {
    hoveredPosition: null,
    hoveredFeature: null,
    selectedFeature: null,
    selectedRange: null,
    isDragging: false,
    dragStart: null,
    rotation: 0,
    zoom: 1,
    viewport: { start: 0, end: Math.min(totalLength, 500) },
  };
}
