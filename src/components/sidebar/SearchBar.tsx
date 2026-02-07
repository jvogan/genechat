import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '0 12px 8px',
      }}
    >
      <Search
        size={13}
        style={{
          position: 'absolute',
          left: 22,
          top: 8,
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        placeholder="Search sequences, features..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '7px 10px 7px 30px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontFamily: 'var(--font-sans)',
          outline: 'none',
        }}
      />
    </div>
  );
}
