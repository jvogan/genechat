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
  X,
  Scissors,
  Crosshair,
} from 'lucide-react';
import type { ManipulationType, SequenceType } from '../../bio/types';
import { useUIStore } from '../../store/ui-store';

interface ToolbarAction {
  type: ManipulationType;
  label: string;
  icon: React.ReactNode;
}

const allActions: ToolbarAction[] = [
  { type: 'reverse_complement', label: 'Reverse Complement', icon: <ArrowLeftRight size={13} /> },
  { type: 'translate', label: 'Translate to Protein', icon: <Languages size={13} /> },
  { type: 'reverse_translate', label: 'Reverse Translate → DNA', icon: <Undo2 size={13} /> },
  { type: 'reverse_translate_rna', label: 'Reverse Translate → RNA', icon: <Undo2 size={13} /> },
  { type: 'codon_optimize', label: 'Codon Optimize', icon: <Gauge size={13} /> },
  { type: 'mutate', label: 'Introduce Mutations', icon: <Dna size={13} /> },
  { type: 'annotate', label: 'Add Annotation', icon: <Tag size={13} /> },
  { type: 'auto_annotate', label: 'Auto Annotate', icon: <Sparkles size={13} /> },
  { type: 'restriction_digest', label: 'Restriction Digest', icon: <Scissors size={13} /> },
  { type: 'design_primers', label: 'Design Primers', icon: <Crosshair size={13} /> },
];

/** Filter actions by sequence type */
function getActionsForType(seqType: SequenceType): ToolbarAction[] {
  const dnaRnaTypes: ManipulationType[] = [
    'reverse_complement', 'translate', 'codon_optimize', 'mutate', 'annotate', 'auto_annotate',
    'restriction_digest', 'design_primers',
  ];
  const proteinTypes: ManipulationType[] = [
    'reverse_translate', 'reverse_translate_rna', 'mutate',
  ];

  if (seqType === 'dna' || seqType === 'rna') {
    return allActions.filter(a => dnaRnaTypes.includes(a.type));
  }
  if (seqType === 'protein') {
    return allActions.filter(a => proteinTypes.includes(a.type));
  }
  return allActions; // fallback: show all
}

const GROUPING_OPTIONS = [0, 3, 6, 9, 10] as const;
const CODON_TABLE_OPTIONS: { value: 'ecoli' | 'human' | 'yeast'; label: string }[] = [
  { value: 'ecoli', label: 'E. coli' },
  { value: 'human', label: 'Human' },
  { value: 'yeast', label: 'Yeast' },
];

interface SequenceToolbarProps {
  onAction: (type: ManipulationType) => void;
  sequenceType: SequenceType;
  selectedRange: { start: number; end: number } | null;
  onClearSelection?: () => void;
}

export default function SequenceToolbar({ onAction, sequenceType, selectedRange, onClearSelection }: SequenceToolbarProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const grouping = useUIStore((s) => s.sequenceGrouping);
  const setGrouping = useUIStore((s) => s.setSequenceGrouping);
  const codonTable = useUIStore((s) => s.codonTable);
  const setCodonTable = useUIStore((s) => s.setCodonTable);
  const translationFrame = useUIStore((s) => s.translationFrame);
  const setTranslationFrame = useUIStore((s) => s.setTranslationFrame);

  const isProtein = sequenceType === 'protein';
  const unitLabel = isProtein ? 'aa' : 'bp';
  const filteredActions = getActionsForType(sequenceType);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  return (
    <div style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        data-testid="transform-dropdown"
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
          flexShrink: 0,
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

      {/* Selection range indicator */}
      {selectedRange && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span style={{ color: 'var(--border)' }}>&middot;</span>
          <span>
            Selected:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              {selectedRange.start + 1}..{selectedRange.end}
            </span>
            {' '}
            <span style={{ opacity: 0.7 }}>
              ({(selectedRange.end - selectedRange.start).toLocaleString()} {unitLabel})
            </span>
          </span>
          <button
            onClick={onClearSelection}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X size={12} />
          </button>
        </div>
      )}

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
              animation: 'menuFadeIn 0.15s ease',
              transformOrigin: 'top left',
            }}
          >
            {filteredActions.map(a => (
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

      {/* Settings: frame + grouping + codon table */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Reading frame selector — DNA/RNA only */}
        {!isProtein && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginRight: 2 }}>Frame</span>
            {([0, 1, 2] as const).map(f => (
              <button
                key={f}
                onClick={() => setTranslationFrame(f)}
                style={{
                  padding: '2px 5px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: translationFrame === f ? 600 : 400,
                  background: translationFrame === f ? 'var(--accent-subtle)' : 'none',
                  color: translationFrame === f ? 'var(--accent)' : 'var(--text-muted)',
                  border: translationFrame === f ? '1px solid var(--accent)' : '1px solid transparent',
                  borderRadius: 3,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
                title={`Reading frame +${f + 1}`}
              >
                +{f + 1}
              </button>
            ))}
          </div>
        )}
        {/* Grouping selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {GROUPING_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setGrouping(n)}
              style={{
                padding: '2px 5px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: grouping === n ? 600 : 400,
                background: grouping === n ? 'var(--accent-subtle)' : 'none',
                color: grouping === n ? 'var(--accent)' : 'var(--text-muted)',
                border: grouping === n ? '1px solid var(--accent)' : '1px solid transparent',
                borderRadius: 3,
                cursor: 'pointer',
                lineHeight: 1,
              }}
              title={n === 0 ? 'No spacing' : `Group by ${n}`}
            >
              {n === 0 ? '–' : n}
            </button>
          ))}
        </div>

        {/* Codon table selector */}
        <select
          value={codonTable}
          onChange={e => setCodonTable(e.target.value as 'ecoli' | 'human' | 'yeast')}
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-sans)',
            padding: '2px 4px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 3,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Codon usage table — affects Reverse Translate and Codon Optimize"
        >
          {CODON_TABLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
