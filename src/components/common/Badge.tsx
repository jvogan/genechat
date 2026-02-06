import type { SequenceType } from '../../bio/types';

interface BadgeProps {
  type: SequenceType;
  className?: string;
}

const badgeConfig: Record<string, { label: string; bg: string; color: string }> = {
  dna: { label: 'DNA', bg: 'rgba(0,212,170,0.15)', color: 'var(--accent)' },
  rna: { label: 'RNA', bg: 'rgba(251,191,36,0.15)', color: 'var(--amber)' },
  protein: { label: 'PROTEIN', bg: 'rgba(167,139,250,0.15)', color: 'var(--purple)' },
  misc: { label: 'MISC', bg: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)' },
  unknown: { label: 'UNKNOWN', bg: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)' },
  mixed: { label: 'MIXED', bg: 'rgba(96,165,250,0.15)', color: 'var(--blue)' },
};

export default function Badge({ type }: BadgeProps) {
  const config = badgeConfig[type] ?? badgeConfig.misc;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 5,
        fontSize: 9,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 0.8,
        background: config.bg,
        color: config.color,
        lineHeight: '16px',
        textTransform: 'uppercase',
      }}
    >
      {config.label}
    </span>
  );
}
