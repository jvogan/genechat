import type { ORF, Feature, RestrictionSite } from '../bio/types';
import { BASE_COLORS } from '../bio/types';

export interface BaseRenderOptions {
  canvas: HTMLCanvasElement;
  sequence: string;
  orfs: ORF[];
  viewport: { start: number; end: number };
  zoom: number;
  hoveredPosition: number | null;
  selectedRange: { start: number; end: number } | null;
  showComplement: boolean;
  showAminoAcids: boolean;
  features?: Feature[];
  restrictionSites?: RestrictionSite[];
}

interface ThemeColors {
  bgDeep: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSubtle: string;
}

const COMPLEMENT: Record<string, string> = {
  A: 'T', T: 'A', G: 'C', C: 'G', U: 'A', N: 'N',
};

const ORF_TRACK_COLORS = [
  '#a78bfa', // purple
  '#fb7185', // rose
  '#22d3ee', // cyan
  '#fbbf24', // amber
  '#4ade80', // green
  '#60a5fa', // blue
];

function getThemeColors(canvas: HTMLCanvasElement): ThemeColors {
  const style = getComputedStyle(canvas);
  const get = (prop: string, fallback: string) => style.getPropertyValue(prop).trim() || fallback;
  return {
    bgDeep: get('--bg-deep', '#0a0c10'),
    bgPrimary: get('--bg-primary', '#0f1117'),
    bgSecondary: get('--bg-secondary', '#161820'),
    bgTertiary: get('--bg-tertiary', '#1c1f2b'),
    border: get('--border', '#2a2d3e'),
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

function drawORFTracks(
  ctx: CanvasRenderingContext2D,
  orfs: ORF[],
  viewport: { start: number; end: number },
  _width: number,
  marginLeft: number,
  y: number,
  charW: number,
  _colors: ThemeColors
) {
  const trackH = 10;
  const trackGap = 2;

  for (let i = 0; i < orfs.length && i < 6; i++) {
    const orf = orfs[i];
    if (orf.end < viewport.start || orf.start > viewport.end) continue;

    const x1 = marginLeft + (Math.max(orf.start, viewport.start) - viewport.start) * charW;
    const x2 = marginLeft + (Math.min(orf.end, viewport.end) - viewport.start) * charW;
    const trackY = y + i * (trackH + trackGap);

    const color = ORF_TRACK_COLORS[i % ORF_TRACK_COLORS.length];

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x1, trackY, x2 - x1, trackH, 3);
    ctx.fill();

    // Border
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Frame label
    if (x2 - x1 > 30) {
      ctx.font = '8px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`F${orf.frame}`, x1 + 3, trackY + trackH / 2);
      ctx.globalAlpha = 1;
    }
  }

  return orfs.length > 0 ? Math.min(orfs.length, 6) * (trackH + trackGap) + 6 : 0;
}

type LabelRect = { x: number; y: number; w: number; h: number };

function rectsOverlap(a: LabelRect, b: LabelRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function canPlaceRect(rect: LabelRect, used: LabelRect[]): boolean {
  for (const u of used) {
    if (rectsOverlap(rect, u)) return false;
  }
  return true;
}

function drawFeatureBars(
  ctx: CanvasRenderingContext2D,
  features: Feature[],
  viewport: { start: number; end: number },
  marginLeft: number,
  y: number,
  charW: number,
): number {
  const barH = 6;
  const gap = 2;
  const visible = features.filter(f => f.end > viewport.start && f.start < viewport.end);
  if (visible.length === 0) return 0;

  for (let i = 0; i < visible.length; i++) {
    const feat = visible[i];
    const x1 = marginLeft + (Math.max(feat.start, viewport.start) - viewport.start) * charW;
    const x2 = marginLeft + (Math.min(feat.end, viewport.end) - viewport.start) * charW;
    const barY = y + i * (barH + gap);
    const barW = Math.max(x2 - x1, 2);

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = feat.color || '#00d4aa';
    ctx.beginPath();
    ctx.roundRect(x1, barY, barW, barH, 3);
    ctx.fill();
    ctx.restore();

    // Feature name if bar is wide enough
    if (barW > 40) {
      ctx.save();
      ctx.font = '8px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = feat.color || '#00d4aa';
      ctx.globalAlpha = 0.8;
      let label = feat.name;
      const maxW = barW - 6;
      while (ctx.measureText(label + '\u2026').width > maxW && label.length > 1) {
        label = label.slice(0, -1);
      }
      if (label !== feat.name) label += '\u2026';
      ctx.fillText(label, x1 + 3, barY + barH / 2);
      ctx.restore();
    }
  }

  return visible.length * (barH + gap) + 4;
}

function drawRestrictionSiteMarkers(
  ctx: CanvasRenderingContext2D,
  sites: RestrictionSite[],
  viewport: { start: number; end: number },
  marginLeft: number,
  y: number,
  charW: number,
  colors: ThemeColors,
) {
  const usedRects: LabelRect[] = [];
  const triH = 5;

  for (const site of sites) {
    if (site.position < viewport.start || site.position > viewport.end) continue;
    const x = marginLeft + (site.position - viewport.start) * charW + charW / 2;

    // Downward-pointing triangle
    ctx.save();
    ctx.fillStyle = colors.textMuted;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - triH / 2, y);
    ctx.lineTo(x + triH / 2, y);
    ctx.lineTo(x, y + triH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Enzyme name with collision detection
    ctx.save();
    ctx.font = '8px system-ui, -apple-system, sans-serif';
    const labelW = ctx.measureText(site.enzyme).width;
    const labelH = 10;
    const labelX = x - labelW / 2;
    const labelY = y + triH + 2;
    const rect: LabelRect = { x: labelX, y: labelY, w: labelW, h: labelH };

    if (canPlaceRect(rect, usedRects)) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colors.textMuted;
      ctx.globalAlpha = 0.6;
      ctx.fillText(site.enzyme, x, labelY);
      usedRects.push(rect);
    }
    ctx.restore();
  }
}

export function renderBases(options: BaseRenderOptions): void {
  const { canvas, sequence, orfs, viewport, hoveredPosition, selectedRange, showComplement, showAminoAcids, features, restrictionSites } = options;
  if (!canvas || sequence.length === 0) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w <= 0 || h <= 0) return; // Not laid out yet

  const ctx = setupHiDPI(canvas);
  const colors = getThemeColors(canvas);

  ctx.clearRect(0, 0, w, h);

  const marginLeft = 60;
  const viewLen = viewport.end - viewport.start;

  // Character sizing
  const availWidth = w - marginLeft - 20;
  const charW = Math.min(18, Math.max(6, availWidth / viewLen));
  const charH = Math.max(14, charW * 1.4);
  const baseFontSize = Math.min(14, Math.max(8, charW * 0.9));

  // ORF tracks
  let currentY = 8;
  const orfHeight = drawORFTracks(ctx, orfs, viewport, w, marginLeft, currentY, charW, colors);
  currentY += orfHeight;

  // Feature annotation bars
  if (features && features.length > 0) {
    const featHeight = drawFeatureBars(ctx, features, viewport, marginLeft, currentY, charW);
    currentY += featHeight;
  }

  // Selection highlight
  if (selectedRange) {
    const selStart = Math.max(selectedRange.start, viewport.start);
    const selEnd = Math.min(selectedRange.end, viewport.end);
    const sx = marginLeft + (selStart - viewport.start) * charW;
    const sw = (selEnd - selStart) * charW;
    ctx.fillStyle = colors.accentSubtle;
    ctx.fillRect(sx, currentY, sw, showComplement ? charH * 2 + 8 : charH + 4);
  }

  // Position numbers row
  ctx.font = `${Math.max(8, baseFontSize - 2)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = colors.textMuted;

  const posInterval = Math.max(1, Math.ceil(10 / charW) * 10);
  for (let i = viewport.start; i < viewport.end; i++) {
    if ((i + 1) % posInterval === 0) {
      const x = marginLeft + (i - viewport.start) * charW + charW / 2;
      ctx.fillText(`${i + 1}`, x, currentY);
    }
  }
  currentY += 4;

  // Line number
  ctx.font = `${Math.max(8, baseFontSize - 2)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(`${viewport.start + 1}`, marginLeft - 8, currentY);

  // Draw bases
  ctx.font = `bold ${baseFontSize}px 'JetBrains Mono', 'Fira Code', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = viewport.start; i < viewport.end && i < sequence.length; i++) {
    const base = sequence[i].toUpperCase();
    const x = marginLeft + (i - viewport.start) * charW;
    const isHovered = hoveredPosition === i;

    // Codon separator
    if (i > viewport.start && (i % 3 === 0)) {
      ctx.save();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(x, currentY);
      ctx.lineTo(x, currentY + charH);
      ctx.stroke();
      ctx.restore();
    }

    // Hover highlight
    if (isHovered) {
      ctx.save();
      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(x, currentY, charW, showComplement ? charH * 2 + 8 : charH + 4);
      ctx.restore();
    }

    // Base character
    const color = BASE_COLORS[base] || colors.textSecondary;

    // Subtle background block
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = isHovered ? 0.2 : 0.08;
    ctx.beginPath();
    ctx.roundRect(x + 1, currentY + 1, charW - 2, charH - 2, 2);
    ctx.fill();
    ctx.restore();

    // Base letter
    ctx.fillStyle = color;
    ctx.globalAlpha = isHovered ? 1 : 0.9;
    ctx.fillText(base, x + charW / 2, currentY + 2);
    ctx.globalAlpha = 1;
  }

  // Complement strand
  if (showComplement) {
    const compY = currentY + charH + 4;

    ctx.font = `${baseFontSize}px 'JetBrains Mono', 'Fira Code', monospace`;
    ctx.globalAlpha = 0.5;
    for (let i = viewport.start; i < viewport.end && i < sequence.length; i++) {
      const base = sequence[i].toUpperCase();
      const comp = COMPLEMENT[base] || 'N';
      const x = marginLeft + (i - viewport.start) * charW;
      const color = BASE_COLORS[comp] || colors.textSecondary;

      ctx.fillStyle = color;
      ctx.fillText(comp, x + charW / 2, compY + 2);
    }
    ctx.globalAlpha = 1;

    // Strand labels
    ctx.font = `9px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('5\'', marginLeft - 8, currentY + 2);
    ctx.fillText('3\'', marginLeft - 8, compY + 2);
    currentY = compY + charH + 8;
  } else {
    currentY += charH + 8;
  }

  // Amino acid row
  if (showAminoAcids && charW >= 8) {
    ctx.font = `${Math.max(7, baseFontSize - 3)}px 'JetBrains Mono', 'Fira Code', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.7;

    for (let i = viewport.start; i < viewport.end && i + 2 < sequence.length; i += 3) {
      const codonStart = i - (i % 3);
      if (codonStart < viewport.start) continue;
      const x = marginLeft + (codonStart - viewport.start) * charW;
      const codon = sequence.slice(codonStart, codonStart + 3).toUpperCase();
      const aa = codonToAA(codon);
      if (aa) {
        ctx.fillText(aa, x + charW * 1.5, currentY);
      }
    }
    ctx.globalAlpha = 1;
    currentY += 14;
  }

  // Restriction site markers
  if (restrictionSites && restrictionSites.length > 0) {
    drawRestrictionSiteMarkers(ctx, restrictionSites, viewport, marginLeft, currentY, charW, colors);
  }
}

const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

function codonToAA(codon: string): string | null {
  return CODON_TABLE[codon] || null;
}

export function hitTestBases(
  x: number,
  _y: number,
  canvasRect: DOMRect,
  sequenceLength: number,
  viewport: { start: number; end: number }
): { position: number | null } {
  const marginLeft = 60;
  const availWidth = canvasRect.width - marginLeft - 20;
  const viewLen = viewport.end - viewport.start;
  const charW = Math.min(18, Math.max(6, availWidth / viewLen));

  const pos = Math.floor((x - marginLeft) / charW) + viewport.start;
  if (pos < 0 || pos >= sequenceLength || x < marginLeft) {
    return { position: null };
  }
  return { position: pos };
}

export function getVisibleRange(
  sequenceLength: number,
  scrollOffset: number,
  canvasWidth: number,
  zoom: number
): { start: number; end: number } {
  const marginLeft = 60;
  const availWidth = canvasWidth - marginLeft - 20;
  const baseCharW = 12;
  const charW = baseCharW * zoom;
  const visibleBases = Math.floor(availWidth / charW);
  const start = Math.max(0, Math.floor(scrollOffset));
  const end = Math.min(sequenceLength, start + visibleBases);
  return { start, end };
}
