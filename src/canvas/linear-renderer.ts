import type { Feature, RestrictionSite } from '../bio/types';

type LabelRect = { x: number; y: number; w: number; h: number };

function rectsOverlap(a: LabelRect, b: LabelRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function canPlace(rect: LabelRect, used: LabelRect[]): boolean {
  for (const u of used) {
    if (rectsOverlap(rect, u)) return false;
  }
  return true;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
}

export interface LinearRenderOptions {
  canvas: HTMLCanvasElement;
  features: Feature[];
  restrictionSites: RestrictionSite[];
  totalLength: number;
  viewport: { start: number; end: number };
  zoom: number;
  hoveredFeature: string | null;
  selectedFeature: string | null;
  selectedRange: { start: number; end: number } | null;
}

interface ThemeColors {
  bgDeep: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSubtle: string;
}

function getThemeColors(canvas: HTMLCanvasElement): ThemeColors {
  const style = getComputedStyle(canvas);
  const get = (prop: string, fallback: string) => style.getPropertyValue(prop).trim() || fallback;
  return {
    bgDeep: get('--bg-deep', '#0a0c10'),
    bgPrimary: get('--bg-primary', '#0f1117'),
    bgSecondary: get('--bg-secondary', '#161820'),
    bgTertiary: get('--bg-tertiary', '#1c1f2b'),
    border: get('--border', '#2a2d3e'),
    borderSubtle: get('--border-subtle', '#1e2130'),
    textPrimary: get('--text-primary', '#e8eaf0'),
    textSecondary: get('--text-secondary', '#9498aa'),
    textMuted: get('--text-muted', '#5c6078'),
    accent: get('--accent', '#00d4aa'),
    accentSubtle: get('--accent-subtle', 'rgba(0, 212, 170, 0.15)'),
  };
}

function setupHiDPI(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}

function bpToX(bp: number, viewStart: number, viewEnd: number, width: number, marginLeft: number): number {
  const viewLen = viewEnd - viewStart;
  return marginLeft + ((bp - viewStart) / viewLen) * (width - marginLeft * 2);
}

function assignTracks(features: Feature[]): Map<string, number> {
  const trackMap = new Map<string, number>();
  const sorted = [...features].sort((a, b) => a.start - b.start);
  const trackEnds: number[] = [];

  for (const feat of sorted) {
    let track = -1;
    for (let i = 0; i < trackEnds.length; i++) {
      if (trackEnds[i] <= feat.start) {
        track = i;
        break;
      }
    }
    if (track === -1) {
      track = trackEnds.length;
      trackEnds.push(0);
    }
    trackEnds[track] = feat.end;
    trackMap.set(feat.id, track);
  }
  return trackMap;
}

function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  viewStart: number,
  viewEnd: number,
  width: number,
  marginLeft: number,
  y: number,
  colors: ThemeColors
) {
  const viewLen = viewEnd - viewStart;

  // Backbone line
  const x1 = marginLeft;
  const x2 = width - marginLeft;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Accent line on top
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Tick interval
  const rawInterval = viewLen / 10;
  const mag = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  let interval: number;
  if (rawInterval / mag < 2) interval = mag;
  else if (rawInterval / mag < 5) interval = 2 * mag;
  else interval = 5 * mag;

  const firstTick = Math.ceil(viewStart / interval) * interval;
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.textMuted;

  for (let bp = firstTick; bp <= viewEnd; bp += interval) {
    const x = bpToX(bp, viewStart, viewEnd, width, marginLeft);
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.strokeStyle = colors.textMuted;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillText(formatBP(bp), x, y + 7);
  }
}

function formatBP(bp: number): string {
  if (bp >= 1000000) return `${(bp / 1000000).toFixed(1)}M`;
  if (bp >= 1000) return `${(bp / 1000).toFixed(1)}k`;
  return `${bp}`;
}

function drawFeatureRect(
  ctx: CanvasRenderingContext2D,
  feat: Feature,
  track: number,
  viewStart: number,
  viewEnd: number,
  width: number,
  marginLeft: number,
  trackBaseY: number,
  trackHeight: number,
  isHovered: boolean,
  isSelected: boolean,
  colors: ThemeColors
) {
  const x1 = bpToX(feat.start, viewStart, viewEnd, width, marginLeft);
  const x2 = bpToX(feat.end, viewStart, viewEnd, width, marginLeft);
  const y = trackBaseY + track * (trackHeight + 4);
  const rw = Math.max(x2 - x1, 2);
  const featureColor = feat.color || colors.accent;

  ctx.save();
  // No glow — just opacity change handles emphasis

  // Feature body
  ctx.beginPath();
  const rh = trackHeight;
  const r = Math.min(4, rw / 2);
  ctx.roundRect(x1, y, rw, rh, r);
  ctx.fillStyle = featureColor;
  ctx.globalAlpha = isHovered ? 1 : 0.8;
  ctx.fill();

  // Direction arrow
  if (rw > 20) {
    const arrowSize = 6;
    ctx.beginPath();
    if (feat.strand === 1) {
      ctx.moveTo(x2 - 1, y + rh / 2 - arrowSize);
      ctx.lineTo(x2 + arrowSize, y + rh / 2);
      ctx.lineTo(x2 - 1, y + rh / 2 + arrowSize);
    } else {
      ctx.moveTo(x1 + 1, y + rh / 2 - arrowSize);
      ctx.lineTo(x1 - arrowSize, y + rh / 2);
      ctx.lineTo(x1 + 1, y + rh / 2 + arrowSize);
    }
    ctx.closePath();
    ctx.fillStyle = featureColor;
    ctx.fill();
  }

  ctx.restore();

  // Label inside feature (contrast-aware + measureText truncation)
  if (rw > 40) {
    ctx.font = `${isHovered ? 'bold ' : ''}10px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rgb = hexToRgb(featureColor);
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    ctx.fillStyle = luminance > 0.5 ? '#1a1a2e' : '#ffffff';
    ctx.globalAlpha = 0.9;
    const maxLabelW = rw - 12;
    let label = feat.name;
    while (ctx.measureText(label + '\u2026').width > maxLabelW && label.length > 1) {
      label = label.slice(0, -1);
    }
    if (label !== feat.name) label += '\u2026';
    ctx.fillText(label, x1 + rw / 2, y + rh / 2);
    ctx.globalAlpha = 1;
  }
}

function drawRestrictionSites(
  ctx: CanvasRenderingContext2D,
  sites: RestrictionSite[],
  viewStart: number,
  viewEnd: number,
  width: number,
  marginLeft: number,
  topY: number,
  bottomY: number,
  colors: ThemeColors
) {
  ctx.save();
  ctx.setLineDash([2, 3]);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;

  const usedRects: LabelRect[] = [];

  for (const site of sites) {
    if (site.position < viewStart || site.position > viewEnd) continue;
    const x = bpToX(site.position, viewStart, viewEnd, width, marginLeft);
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.strokeStyle = colors.textMuted;
    ctx.stroke();

    // Label with collision detection
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = '8px system-ui, -apple-system, sans-serif';
    const labelMetrics = ctx.measureText(site.enzyme);
    const labelW = labelMetrics.width;
    const labelH = 10; // approximate line height for 8px font
    const labelX = x - labelW / 2;
    const labelY = topY - 4 - labelH;
    const rect: LabelRect = { x: labelX, y: labelY, w: labelW, h: labelH };

    if (canPlace(rect, usedRects)) {
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText(site.enzyme, x, topY - 4);
      usedRects.push(rect);
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawSelectionRange(
  ctx: CanvasRenderingContext2D,
  range: { start: number; end: number },
  viewStart: number,
  viewEnd: number,
  width: number,
  marginLeft: number,
  height: number,
  colors: ThemeColors
) {
  const x1 = bpToX(range.start, viewStart, viewEnd, width, marginLeft);
  const x2 = bpToX(range.end, viewStart, viewEnd, width, marginLeft);

  ctx.save();
  ctx.fillStyle = colors.accentSubtle;
  ctx.fillRect(x1, 0, x2 - x1, height);

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, 0);
  ctx.lineTo(x1, height);
  ctx.moveTo(x2, 0);
  ctx.lineTo(x2, height);
  ctx.stroke();
  ctx.restore();
}

export function renderLinear(options: LinearRenderOptions): void {
  const { canvas, features, restrictionSites, totalLength, viewport, hoveredFeature, selectedFeature, selectedRange } = options;
  if (!canvas || totalLength <= 0) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w <= 0 || h <= 0) return; // Panel not laid out yet

  const ctx = setupHiDPI(canvas);
  const colors = getThemeColors(canvas);

  ctx.clearRect(0, 0, w, h);

  const marginLeft = 40;
  const scaleBarY = h - 30;
  const trackHeight = 20;
  const trackBaseY = 30;

  // Selection range background
  if (selectedRange) {
    drawSelectionRange(ctx, selectedRange, viewport.start, viewport.end, w, marginLeft, h, colors);
  }

  // Forward strand features (strand 1)
  const forwardFeats = features.filter(f => f.strand === 1);
  const reverseFeats = features.filter(f => f.strand === -1);
  const forwardTracks = assignTracks(forwardFeats);
  const reverseTracks = assignTracks(reverseFeats);

  // Draw scale bar
  drawScaleBar(ctx, viewport.start, viewport.end, w, marginLeft, scaleBarY, colors);

  // Draw restriction sites
  drawRestrictionSites(ctx, restrictionSites, viewport.start, viewport.end, w, marginLeft, trackBaseY - 10, scaleBarY, colors);

  // Strand labels
  ctx.font = '9px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = colors.textMuted;
  if (forwardFeats.length > 0) ctx.fillText('5\' → 3\'', 4, trackBaseY + 6);
  const reverseBaseY = scaleBarY - 50;
  if (reverseFeats.length > 0) ctx.fillText('3\' ← 5\'', 4, reverseBaseY + 6);

  // Draw forward features
  for (const feat of forwardFeats) {
    if (feat.end < viewport.start || feat.start > viewport.end) continue;
    const track = forwardTracks.get(feat.id) || 0;
    drawFeatureRect(ctx, feat, track, viewport.start, viewport.end, w, marginLeft, trackBaseY, trackHeight,
      feat.id === hoveredFeature, feat.id === selectedFeature, colors);
  }

  // Draw reverse features
  for (const feat of reverseFeats) {
    if (feat.end < viewport.start || feat.start > viewport.end) continue;
    const track = reverseTracks.get(feat.id) || 0;
    drawFeatureRect(ctx, feat, track, viewport.start, viewport.end, w, marginLeft, reverseBaseY, trackHeight,
      feat.id === hoveredFeature, feat.id === selectedFeature, colors);
  }
}

export function hitTestLinear(
  x: number,
  y: number,
  canvasRect: DOMRect,
  features: Feature[],
  totalLength: number,
  viewport: { start: number; end: number }
): { featureId: string | null; bp: number } {
  const w = canvasRect.width;
  const marginLeft = 40;
  const viewLen = viewport.end - viewport.start;
  const bp = Math.round(viewport.start + ((x - marginLeft) / (w - marginLeft * 2)) * viewLen);

  const trackHeight = 20;
  const trackBaseY = 30;
  const scaleBarY = canvasRect.height - 30;

  const forwardFeats = features.filter(f => f.strand === 1);
  const reverseFeats = features.filter(f => f.strand === -1);
  const forwardTracks = assignTracks(forwardFeats);
  const reverseTracks = assignTracks(reverseFeats);

  // Check forward
  for (const feat of forwardFeats) {
    const track = forwardTracks.get(feat.id) || 0;
    const fy = trackBaseY + track * (trackHeight + 4);
    const fx1 = bpToX(feat.start, viewport.start, viewport.end, w, marginLeft);
    const fx2 = bpToX(feat.end, viewport.start, viewport.end, w, marginLeft);
    if (x >= fx1 && x <= fx2 && y >= fy && y <= fy + trackHeight) {
      return { featureId: feat.id, bp };
    }
  }

  // Check reverse
  const reverseBaseY = scaleBarY - 50;
  for (const feat of reverseFeats) {
    const track = reverseTracks.get(feat.id) || 0;
    const fy = reverseBaseY + track * (trackHeight + 4);
    const fx1 = bpToX(feat.start, viewport.start, viewport.end, w, marginLeft);
    const fx2 = bpToX(feat.end, viewport.start, viewport.end, w, marginLeft);
    if (x >= fx1 && x <= fx2 && y >= fy && y <= fy + trackHeight) {
      return { featureId: feat.id, bp };
    }
  }

  return { featureId: null, bp: Math.max(0, Math.min(bp, totalLength)) };
}
