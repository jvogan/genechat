interface SequenceNotesProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SequenceNotes({ value, onChange }: SequenceNotesProps) {
  return (
    <textarea
      placeholder="Add notes..."
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={2}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-secondary)',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
        resize: 'vertical',
        outline: 'none',
        lineHeight: 1.5,
        minHeight: 36,
        transition: 'border-color 0.15s ease',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = 'var(--accent-dim)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    />
  );
}
