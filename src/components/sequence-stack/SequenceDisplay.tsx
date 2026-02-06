import { BASE_COLORS, AA_COLORS } from '../../bio/types';
import type { SequenceType } from '../../bio/types';
import { useUIStore } from '../../store/ui-store';

interface SequenceDisplayProps {
  sequence: string;
  type: SequenceType;
  maxLength?: number;
}

export default function SequenceDisplay({ sequence, type, maxLength = 120 }: SequenceDisplayProps) {
  const coloringEnabled = useUIStore((s) => s.sequenceColoringEnabled);

  const isProtein = type === 'protein';
  const colorMap = isProtein ? AA_COLORS : BASE_COLORS;
  const truncated = sequence.length > maxLength;
  const display = truncated ? sequence.slice(0, maxLength) : sequence;
  const remaining = sequence.length - maxLength;

  // Group into chunks of 10 for readability
  const chunks: string[] = [];
  for (let i = 0; i < display.length; i += 10) {
    chunks.push(display.slice(i, i + 10));
  }

  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12.5,
        lineHeight: 1.7,
        letterSpacing: 0.5,
        overflowWrap: 'break-word',
        wordBreak: 'break-all',
        padding: '10px 14px',
        background: 'var(--bg-deep)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        maxHeight: !truncated && sequence.length > 300 ? 240 : undefined,
        overflowY: !truncated && sequence.length > 300 ? 'auto' : undefined,
      }}
    >
      {chunks.map((chunk, ci) => (
        <span key={ci}>
          {[...chunk].map((base, bi) => (
            <span
              key={`${ci}-${bi}`}
              style={{
                color: coloringEnabled
                  ? (colorMap[base.toUpperCase()] ?? 'var(--text-muted)')
                  : 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {base.toUpperCase()}
            </span>
          ))}
          {ci < chunks.length - 1 && (
            <span style={{ color: 'var(--border)', margin: '0 1px' }}> </span>
          )}
        </span>
      ))}
      {truncated && (
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 400,
            marginLeft: 4,
          }}
        >
          ...+{remaining.toLocaleString()} {isProtein ? 'aa' : 'bp'}
        </span>
      )}
    </div>
  );
}
