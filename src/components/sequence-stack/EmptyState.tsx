import { Dna, Upload, Keyboard } from 'lucide-react';

const hints = [
  { icon: <Upload size={13} />, text: 'Drag & drop .fasta or .gb files anywhere' },
  { icon: <Keyboard size={13} />, text: 'Cmd+A select all, Cmd+C copy sequence' },
];

export default function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 40px',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease',
        minHeight: '100%',
      }}
    >
      {/* DNA helix icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'var(--accent-subtle)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Dna size={28} style={{ color: 'var(--accent)' }} />
      </div>

      {/* Main instruction text */}
      <p
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          maxWidth: 380,
          marginBottom: 10,
        }}
      >
        Paste a DNA, RNA, or protein sequence to get started
      </p>

      {/* Muted subtext */}
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          maxWidth: 360,
          marginBottom: 20,
        }}
      >
        Supports raw sequences, FASTA, and GenBank formats
      </p>

      {/* Hints */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hints.map((h, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{h.icon}</span>
            {h.text}
          </div>
        ))}
      </div>
    </div>
  );
}
