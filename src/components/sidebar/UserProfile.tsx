import { Settings } from 'lucide-react';

export default function UserProfile() {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
        }}
      >
        GeneChat v0.1
      </span>
      <button
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          borderRadius: 4,
          transition: 'color 0.12s',
        }}
        title="Settings"
        aria-label="Settings"
      >
        <Settings size={15} />
      </button>
    </div>
  );
}
