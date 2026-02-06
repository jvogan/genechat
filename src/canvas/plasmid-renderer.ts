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

export interface PlasmidRenderOptions {
  canvas: HTMLCanvasElement;
  features: Feature[];
  restrictionSites: RestrictionSite[];
  totalLength: number;
  rotation: number;
  hoveredFeature: string | null;
  selectedFeature: string | null;
  topology: 'linear' | 'circular';
}

interface ThemeColors {
  bgDeep: string;
  bgPrimary: string;
  bgSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentDim: string;
}

function getThemeColors(canvas: HTMLCanvasElement): ThemeColors {
  const style = getComputedStyle(canvas);
  return {
    bgDeep: style.getPropertyValue('--bg-deep').trim() || '#0a0c10',
    bgPrimary: style.getPropertyValue('--bg-primary').trim() || '#0f1117',
    bgSecondary: style.getPropertyValue('--bg-secondary').trim() || '#161820',
    border: style.getPropertyValue('--border').trim() || '#2a2d3e',
    textPrimary: style.getPropertyValue('--text-primary').trim() || '#e8eaf0',
    textSecondary: style.getPropertyValue('--text-secondary').trim() || '#9498aa',
    textMuted: style.getPropertyValue('--text-muted').trim() || '#5c6078',
    accent: style.getPropertyValue('--accent').trim() || '#00d4aa',
    accentDim: style.getPropertyValue('--accent-dim').trim() || '#00a888',
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

function bpToAngle(bp: number, totalLength: number, rotation: number): number {
  return ((bp / totalLength) * Math.PI * 2) - Math.PI / 2 + rotation;
}

function drawBackboneCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  colors: ThemeColors
) {
  // Outer ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Inner backbone line
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBPTicks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  totalLength: number,
  rotation: number,
  colors: ThemeColors
) {
  const interval = totalLength <= 5000 ? 500 : totalLength <= 20000 ? 1000 : 5000;
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let bp = 0; bp < totalLength; bp += interval) {
    const angle = bpToAngle(bp, totalLength, rotation);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Tick mark
    const innerR = radius - 6;
    const outerR = radius + 6;
    ctx.beginPath();
    ctx.moveTo(cx + innerR * cosA, cy + innerR * sinA);
    ctx.lineTo(cx + outerR * cosA, cy + outerR * sinA);
    ctx.strokeStyle = colors.textMuted;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    const labelR = radius + 20;
    const labelX = cx + labelR * cosA;
    const labelY = cy + labelR * sinA;

    ctx.save();
    ctx.translate(labelX, labelY);
    let textAngle = angle + Math.PI / 2;
    if (textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2) {
      textAngle += Math.PI;
    }
    ctx.rotate(textAngle);
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(`${bp}`, 0, 0);
    ctx.restore();
  }
}

function drawFeatureArc(
  ctx: CanvasRenderingContext2D,
  feature: Feature,
  cx: number,
  cy: number,
  radius: number,
  totalLength: number,
  rotation: number,
  isHovered: boolean,
  isSelected: boolean,
  colors: ThemeColors,
  usedRects: LabelRect[]
) {
  const startAngle = bpToAngle(feature.start, totalLength, rotation);
  const endAngle = bpToAngle(feature.end, totalLength, rotation);
  const arcWidth = (isHovered || isSelected) ? 18 : 14;
  const arcRadius = radius + (feature.strand === 1 ? 0 : -arcWidth - 4);
  const featureColor = feature.color || colors.accent;

  ctx.save();

  // Emphasis on hover/select (no glow)
  if (isHovered || isSelected) {
    // Just use opacity change, no shadow
  }

  // Draw the arc
  ctx.beginPath();
  ctx.arc(cx, cy, arcRadius, startAngle, endAngle);
  ctx.lineWidth = arcWidth;
  ctx.strokeStyle = featureColor;
  ctx.lineCap = 'butt';
  ctx.globalAlpha = (isHovered || isSelected) ? 1 : 0.75;
  ctx.stroke();

  // Direction arrow at end
  if (feature.end - feature.start > totalLength * 0.01) {
    const arrowAngle = feature.strand === 1 ? endAngle : startAngle;
    const arrowDir = feature.strand === 1 ? 1 : -1;
    const arrowTip = arrowAngle + (arrowDir * 0.02);
    const ax = cx + arcRadius * Math.cos(arrowTip);
    const ay = cy + arcRadius * Math.sin(arrowTip);
    const perpAngle = arrowTip + Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - arrowDir * 8 * Math.cos(arrowAngle) + 5 * Math.cos(perpAngle),
      ay - arrowDir * 8 * Math.sin(arrowAngle) + 5 * Math.sin(perpAngle)
    );
    ctx.lineTo(
      ax - arrowDir * 8 * Math.cos(arrowAngle) - 5 * Math.cos(perpAngle),
      ay - arrowDir * 8 * Math.sin(arrowAngle) - 5 * Math.sin(perpAngle)
    );
    ctx.closePath();
    ctx.fillStyle = featureColor;
    ctx.globalAlpha = isHovered ? 1 : 0.85;
    ctx.fill();
  }

  ctx.restore();

  // Label with collision detection
  const midBp = (feature.start + feature.end) / 2;
  const midAngle = bpToAngle(midBp, totalLength, rotation);
  const baseLabelR = arcRadius + (feature.strand === 1 ? arcWidth / 2 + 16 : -(arcWidth / 2 + 16));
  const font = `${(isHovered || isSelected) ? 'bold ' : ''}11px system-ui, -apple-system, sans-serif`;
  ctx.font = font;
  const textMetrics = ctx.measureText(feature.name);
  const textW = textMetrics.width;
  const textH = 14; // approximate line height for 11px font

  // Try default position, then pushed-out position
  for (const offset of [0, 20]) {
    const labelR = baseLabelR + (feature.strand === 1 ? offset : -offset);
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + labelR * Math.sin(midAngle);
    const rect: LabelRect = { x: labelX - textW / 2, y: labelY - textH / 2, w: textW, h: textH };

    if (canPlace(rect, usedRects)) {
      ctx.save();
      ctx.translate(labelX, labelY);
      let textAngle = midAngle + Math.PI / 2;
      if (textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2) {
        textAngle += Math.PI;
      }
      ctx.rotate(textAngle);
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = (isHovered || isSelected) ? colors.textPrimary : colors.textSecondary;
      ctx.fillText(feature.name, 0, 0);
      ctx.restore();
      usedRects.push(rect);
      break;
    }
    // If second attempt also fails, skip the label entirely
  }
}

function drawRestrictionSites(
  ctx: CanvasRenderingContext2D,
  sites: RestrictionSite[],
  cx: number,
  cy: number,
  radius: number,
  totalLength: number,
  rotation: number,
  colors: ThemeColors,
  usedRects: LabelRect[]
) {
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.textMuted;
  ctx.globalAlpha = 0.6;

  for (const site of sites) {
    const angle = bpToAngle(site.position, totalLength, rotation);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const innerR = radius - 24;
    const outerR = radius + 24;

    ctx.beginPath();
    ctx.moveTo(cx + innerR * cosA, cy + innerR * sinA);
    ctx.lineTo(cx + outerR * cosA, cy + outerR * sinA);
    ctx.stroke();

    // Enzyme name with collision detection
    const baseNameR = outerR + 12;
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    const enzymeMetrics = ctx.measureText(site.enzyme);
    const enzymeW = enzymeMetrics.width;
    const enzymeH = 12; // approximate line height for 9px font
    ctx.restore();

    let placed = false;
    for (const offset of [0, 20]) {
      const nameR = baseNameR + offset;
      const nameLabelX = cx + nameR * cosA;
      const nameLabelY = cy + nameR * sinA;
      const rect: LabelRect = { x: nameLabelX - enzymeW / 2, y: nameLabelY - enzymeH / 2, w: enzymeW, h: enzymeH };

      if (canPlace(rect, usedRects)) {
        ctx.save();
        ctx.setLineDash([]);
        ctx.translate(nameLabelX, nameLabelY);
        let textAngle = angle + Math.PI / 2;
        if (textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2) {
          textAngle += Math.PI;
        }
        ctx.rotate(textAngle);
        ctx.font = '9px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colors.textMuted;
        ctx.fillText(site.enzyme, 0, 0);
        ctx.restore();
        usedRects.push(rect);
        placed = true;
        break;
      }
    }
    // If not placed, skip the label entirely
  }
  ctx.restore();
}

function drawCenterInfo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  totalLength: number,
  topology: string,
  colors: ThemeColors
) {
  // Subtle radial gradient behind text
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();

  // BP count
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.textPrimary;
  ctx.fillText(`${totalLength.toLocaleString()} bp`, cx, cy - 8);

  // Topology label
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = colors.accent;
  ctx.fillText(topology.toUpperCase(), cx, cy + 14);
}

function drawOriginMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  colors: ThemeColors
) {
  const angle = bpToAngle(0, 1, rotation); // position 0
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const markerX = cx + radius * cosA;
  const markerY = cy + radius * sinA;

  ctx.save();
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
  ctx.fillStyle = colors.accent;
  ctx.fill();
  ctx.restore();
}

export function renderPlasmid(options: PlasmidRenderOptions): void {
  const { canvas, features, restrictionSites, totalLength, rotation, hoveredFeature, selectedFeature, topology } = options;
  if (!canvas || totalLength <= 0) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w <= 0 || h <= 0) return; // Panel not laid out yet

  const ctx = setupHiDPI(canvas);
  const colors = getThemeColors(canvas);

  // Clear
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.32;

  drawBackboneCircle(ctx, cx, cy, radius, colors);
  drawBPTicks(ctx, cx, cy, radius, totalLength, rotation, colors);
  drawOriginMarker(ctx, cx, cy, radius, rotation, colors);

  const usedRects: LabelRect[] = [];

  // Draw features sorted by size (largest first, so small ones render on top)
  const sorted = [...features].sort((a, b) => (b.end - b.start) - (a.end - a.start));
  for (const feat of sorted) {
    drawFeatureArc(
      ctx, feat, cx, cy, radius, totalLength, rotation,
      feat.id === hoveredFeature,
      feat.id === selectedFeature,
      colors,
      usedRects
    );
  }

  drawRestrictionSites(ctx, restrictionSites, cx, cy, radius, totalLength, rotation, colors, usedRects);
  drawCenterInfo(ctx, cx, cy, totalLength, topology, colors);
}

export function hitTestPlasmid(
  x: number,
  y: number,
  canvasRect: DOMRect,
  features: Feature[],
  totalLength: number,
  rotation: number
): { featureId: string | null; bp: number } {
  const cx = canvasRect.width / 2;
  const cy = canvasRect.height / 2;
  const radius = Math.min(canvasRect.width, canvasRect.height) * 0.32;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let angle = Math.atan2(dy, dx);

  // Convert angle to bp
  angle = angle + Math.PI / 2 - rotation;
  if (angle < 0) angle += Math.PI * 2;
  const bp = Math.round((angle / (Math.PI * 2)) * totalLength) % totalLength;

  // Check if near the ring
  if (dist < radius - 30 || dist > radius + 30) {
    return { featureId: null, bp };
  }

  // Hit test features
  for (const feat of features) {
    let start = feat.start;
    let end = feat.end;
    if (start > end) {
      // wraps around origin
      if (bp >= start || bp <= end) {
        return { featureId: feat.id, bp };
      }
    } else {
      if (bp >= start && bp <= end) {
        return { featureId: feat.id, bp };
      }
    }
  }

  return { featureId: null, bp };
}
