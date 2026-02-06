import { useEffect, useRef, useCallback, type RefObject } from 'react';

type RenderFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

export function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  render: RenderFn,
  deps: unknown[] = [],
  animate = false,
) {
  const animFrameRef = useRef<number>(0);
  const renderRef = useRef(render);
  renderRef.current = render;

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(dpr, dpr);
    return { ctx, width, height };
  }, [canvasRef]);

  useEffect(() => {
    const result = setupCanvas();
    if (!result) return;

    const { ctx, width, height } = result;

    if (animate) {
      let running = true;
      const loop = () => {
        if (!running) return;
        ctx.clearRect(0, 0, width, height);
        renderRef.current(ctx, width, height);
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
      return () => {
        running = false;
        cancelAnimationFrame(animFrameRef.current);
      };
    } else {
      ctx.clearRect(0, 0, width, height);
      renderRef.current(ctx, width, height);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupCanvas, animate, ...deps]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const result = setupCanvas();
      if (result) {
        const { ctx, width, height } = result;
        ctx.clearRect(0, 0, width, height);
        renderRef.current(ctx, width, height);
      }
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, setupCanvas]);
}
