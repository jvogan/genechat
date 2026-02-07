import { useMemo } from 'react';
import { useCheckpointStore } from '../../store/checkpoint-store';
import { RotateCcw, X } from 'lucide-react';

interface CheckpointListProps {
  blockId: string;
  currentLength: number;
  onClose: () => void;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CheckpointList({ blockId, currentLength, onClose }: CheckpointListProps) {
  const allCheckpoints = useCheckpointStore((s) => s.checkpoints);
  const restoreCheckpoint = useCheckpointStore((s) => s.restoreCheckpoint);
  const deleteCheckpoint = useCheckpointStore((s) => s.deleteCheckpoint);
  const checkpoints = useMemo(
    () => allCheckpoints.filter((c) => c.blockId === blockId).sort((a, b) => b.timestamp - a.timestamp),
    [allCheckpoints, blockId],
  );

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        animation: 'menuFadeIn 0.15s ease',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Checkpoints
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            borderRadius: 3,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          aria-label="Close checkpoints"
          title="Close checkpoints"
        >
          <X size={12} />
        </button>
      </div>

      {checkpoints.length === 0 ? (
        <div
          style={{
            padding: '16px 12px',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
            textAlign: 'center',
          }}
        >
          No checkpoints saved
        </div>
      ) : (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {checkpoints.map((cp) => {
            const delta = cp.raw.length - currentLength;
            const unit = cp.type === 'protein' ? 'aa' : 'bp';
            const deltaStr = delta === 0 ? `0 ${unit}` : delta > 0 ? `+${delta} ${unit}` : `${delta} ${unit}`;
            const deltaColor = delta > 0 ? 'var(--scar-insertion)' : delta < 0 ? 'var(--rose)' : 'var(--text-muted)';

            return (
              <div
                key={cp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cp.label}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 1 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      {relativeTime(cp.timestamp)}
                    </span>
                    <span style={{ color: deltaColor, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      {deltaStr}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => restoreCheckpoint(cp.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    borderRadius: 3,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  title="Restore this checkpoint"
                  aria-label="Restore this checkpoint"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() => deleteCheckpoint(cp.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    borderRadius: 3,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rose)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Delete this checkpoint"
                  aria-label="Delete this checkpoint"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
