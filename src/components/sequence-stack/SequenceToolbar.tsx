import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeftRight,
  Languages,
  Undo2,
  Gauge,
  Dna,
  Tag,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { ManipulationType } from '../../bio/types';

interface ToolbarAction {
  type: ManipulationType;
  label: string;
  icon: React.ReactNode;
}

const actions: ToolbarAction[] = [
  { type: 'reverse_complement', label: 'Reverse Complement', icon: <ArrowLeftRight size={13} /> },
  { type: 'translate', label: 'Translate to Protein', icon: <Languages size={13} /> },
  { type: 'reverse_translate', label: 'Reverse Translate', icon: <Undo2 size={13} /> },
  { type: 'codon_optimize', label: 'Codon Optimize', icon: <Gauge size={13} /> },
  { type: 'mutate', label: 'Introduce Mutations', icon: <Dna size={13} /> },
  { type: 'annotate', label: 'Add Annotation', icon: <Tag size={13} /> },
  { type: 'auto_annotate', label: 'Auto Annotate', icon: <Sparkles size={13} /> },
];

interface SequenceToolbarProps {
  onAction: (type: ManipulationType) => void;
}

export default function SequenceToolbar({ onAction }: SequenceToolbarProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  return (
    <div style={{ padding: '6px 0' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 10px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          transition: 'all 0.12s ease',
          lineHeight: 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg-secondary)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        Transform
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 1001,
              minWidth: 180,
              overflow: 'hidden',
            }}
          >
            {actions.map(a => (
              <button
                key={a.type}
                onClick={() => {
                  setOpen(false);
                  onAction(a.type);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
