import { useRef, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { useUIStore } from '../../store/ui-store';

interface SequenceSearchBarProps {
  matchCount: number;
}

export default function SequenceSearchBar({ matchCount }: SequenceSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useUIStore((s) => s.sequenceSearchQuery);
  const matchIndex = useUIStore((s) => s.sequenceSearchMatchIndex);
  const setQuery = useUIStore((s) => s.setSequenceSearchQuery);
  const setMatchIndex = useUIStore((s) => s.setSequenceSearchMatchIndex);
  const closeSearch = useUIStore((s) => s.closeSequenceSearch);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePrev = () => {
    if (matchCount === 0) return;
    setMatchIndex(matchIndex <= 0 ? matchCount - 1 : matchIndex - 1);
  };

  const handleNext = () => {
    if (matchCount === 0) return;
    setMatchIndex(matchIndex >= matchCount - 1 ? 0 : matchIndex + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) handlePrev();
      else handleNext();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        marginBottom: 6,
        animation: 'menuFadeIn 0.12s ease',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search sequence (IUPAC)..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          padding: '2px 4px',
          minWidth: 0,
        }}
      />
      {query && (
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: matchCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {matchCount > 0 ? `${matchIndex + 1} of ${matchCount}` : 'No matches'}
        </span>
      )}
      <button
        onClick={handlePrev}
        disabled={matchCount === 0}
        style={{
          background: 'none',
          border: 'none',
          color: matchCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
          cursor: matchCount > 0 ? 'pointer' : 'default',
          padding: 2,
          display: 'flex',
          borderRadius: 3,
          opacity: matchCount > 0 ? 1 : 0.4,
        }}
        title="Previous match (Shift+Enter)"
        aria-label="Previous match"
      >
        <ChevronUp size={14} />
      </button>
      <button
        onClick={handleNext}
        disabled={matchCount === 0}
        style={{
          background: 'none',
          border: 'none',
          color: matchCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
          cursor: matchCount > 0 ? 'pointer' : 'default',
          padding: 2,
          display: 'flex',
          borderRadius: 3,
          opacity: matchCount > 0 ? 1 : 0.4,
        }}
        title="Next match (Enter)"
        aria-label="Next match"
      >
        <ChevronDown size={14} />
      </button>
      <button
        onClick={closeSearch}
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
        title="Close (Escape)"
        aria-label="Close search"
      >
        <X size={14} />
      </button>
    </div>
  );
}
