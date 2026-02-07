import { useRef, useMemo, useEffect } from 'react';
import type { SequenceType } from '../../bio/types';
import { gcContentWindow } from '../../bio/gc-content';
import { useUIStore } from '../../store/ui-store';

interface GCPlotProps {
  raw: string;
  type: SequenceType;
}

export default function GCPlot({ raw, type }: GCPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useUIStore((s) => s.theme);

  // Adaptive window parameters
  const { windowSize, step } = useMemo(() => {
    const len = raw.length;
    if (len <= 500) return { windowSize: 20, step: 5 };
    if (len <= 5000) return { windowSize: 50, step: 10 };
    return { windowSize: 100, step: 20 };
  }, [raw.length]);

  // Compute GC data
  const data = useMemo(() => {
    if (type === 'protein' || raw.length < windowSize || raw.length > 100000) return null;
    return gcContentWindow(raw, windowSize, step);
  }, [raw, type, windowSize, step]);

  // Draw on canvas
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = 40;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Read theme colors
    const style = getComputedStyle(canvas);
    const accent = style.getPropertyValue('--accent').trim() || '#4f46e5';
    const bgSecondary = style.getPropertyValue('--bg-secondary').trim() || '#f3f4f6';
    const textMuted = style.getPropertyValue('--text-muted').trim() || '#9ca3af';

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = bgSecondary;
    ctx.fillRect(0, 0, width, height);

    if (data.length === 0) return;

    // Map data to pixels
    const xScale = width / (data.length - 1 || 1);
    const yScale = height;

    // Filled area
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < data.length; i++) {
      const x = i * xScale;
      const y = height - data[i].gc * yScale;
      ctx.lineTo(x, y);
    }
    ctx.lineTo((data.length - 1) * xScale, height);
    ctx.closePath();

    // Use globalAlpha for fill opacity (works with any color format)
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Stroked line
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = i * xScale;
      const y = height - data[i].gc * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 50% guideline
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.strokeStyle = textMuted;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // "50%" label
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'right';
    ctx.fillText('50%', width - 4, height * 0.5 - 3);
  }, [data, theme]);

  // Guard: skip rendering
  if (!data) return null;

  return (
    <div style={{ marginBottom: 4 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 40,
          borderRadius: 4,
          display: 'block',
        }}
      />
    </div>
  );
}
