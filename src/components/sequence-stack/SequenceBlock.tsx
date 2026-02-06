import { useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
  StickyNote,
  Download,
} from 'lucide-react';
import SequenceDisplay from './SequenceDisplay';
import SequenceToolbar from './SequenceToolbar';
import SequenceNotes from './SequenceNotes';
import FeatureSelector from './FeatureSelector';
import type { SequenceType, Feature, ManipulationType } from '../../bio/types';
import { exportToFasta, exportToGenBank, downloadFile } from '../../persistence/export';
import type { SequenceBlock as SequenceBlockType } from '../../store/types';

interface SequenceBlockProps {
  id: string;
  name: string;
  raw: string;
  type: SequenceType;
  topology: 'linear' | 'circular';
  features: Feature[];
  notes: string;
  isActive?: boolean;
  parentBlockName?: string | null;
  manipulation?: ManipulationType | null;
  onNotesChange?: (notes: string) => void;
  onNameChange?: (name: string) => void;
  onAction?: (type: ManipulationType) => void;
  onDelete?: () => void;
}

const manipulationLabels: Record<string, string> = {
  reverse_complement: 'Reverse Complement of',
  translate: 'Translated from',
  reverse_translate: 'Reverse Translated from',
  codon_optimize: 'Codon Optimized from',
  mutate: 'Mutated from',
  annotate: 'Annotated from',
  auto_annotate: 'Auto Annotated from',
};

export default function SequenceBlock({
  id,
  name,
  raw,
  type,
  topology,
  features,
  notes,
  isActive,
  parentBlockName,
  manipulation,
  onNotesChange,
  onNameChange,
  onAction,
  onDelete,
}: SequenceBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [copied, setCopied] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isProtein = type === 'protein';
  const unitLabel = isProtein ? 'aa' : 'bp';
  const length = raw.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setMenuOpen(false);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleNameSubmit = () => {
    setEditing(false);
    onNameChange?.(editName);
  };

  const handleAction = (actionType: ManipulationType) => {
    onAction?.(actionType);
  };

  const handleNotesChange = (val: string) => {
    setLocalNotes(val);
    onNotesChange?.(val);
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        borderLeft: isActive ? '3px solid var(--accent)' : '1px solid var(--border)',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        animation: 'fadeIn 0.3s ease',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
        }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            transition: 'color 0.12s',
          }}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Name */}
        {editing ? (
          <input
            ref={nameInputRef}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
            autoFocus
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '3px 8px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onDoubleClick={() => setEditing(true)}
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'default',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {name}
          </span>
        )}

        {/* Derivation note (inline, subtle) */}
        {parentBlockName && manipulation && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 200,
            }}
          >
            from {parentBlockName}
          </span>
        )}

        {/* Overflow menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              background: menuOpen ? 'var(--bg-hover)' : 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 4,
              transition: 'background 0.12s',
            }}
            title="More actions"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 20,
                  minWidth: 160,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={handleCopy}
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
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy sequence'}
                </button>
                <button
                  onClick={() => {
                    const blockData: SequenceBlockType = { id, name, notes: '', raw, type, topology, features, analysis: null, conversationId: '', parentBlockId: null, manipulation: null, position: 0, createdAt: 0 };
                    const content = exportToFasta([blockData]);
                    downloadFile(content, `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.fasta`, 'text/plain');
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', background: 'none', border: 'none',
                    color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)',
                    cursor: 'pointer', textAlign: 'left' as const,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  <Download size={13} />
                  Export FASTA
                </button>
                <button
                  onClick={() => {
                    const blockData: SequenceBlockType = { id, name, notes: '', raw, type, topology, features, analysis: null, conversationId: '', parentBlockId: null, manipulation: null, position: 0, createdAt: 0 };
                    const content = exportToGenBank(blockData);
                    downloadFile(content, `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.gb`, 'text/plain');
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', background: 'none', border: 'none',
                    color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)',
                    cursor: 'pointer', textAlign: 'left' as const,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  <Download size={13} />
                  Export GenBank
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditing(true);
                    setTimeout(() => nameInputRef.current?.focus(), 50);
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
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  <Pencil size={13} />
                  Rename
                </button>
                {/* Length info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  {length.toLocaleString()} {unitLabel}
                  {topology === 'circular' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> · circular</span>
                  )}
                </div>
                {/* Toggle notes */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowNotes(v => !v);
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
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  <StickyNote size={13} />
                  {showNotes ? 'Hide notes' : 'Show notes'}
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--rose)',
                      fontSize: 12,
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0 14px 12px' }}>
        {/* Sequence display */}
        <SequenceDisplay
          sequence={raw}
          type={type}
          maxLength={expanded ? Infinity : 120}
        />

        {/* Features */}
        {features.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <FeatureSelector features={features} />
          </div>
        )}

        {/* Toolbar */}
        <SequenceToolbar onAction={handleAction} />

        {/* Notes (hidden by default, toggled via menu) */}
        {showNotes && (
          <div style={{ marginTop: 8 }}>
            <SequenceNotes value={localNotes} onChange={handleNotesChange} />
          </div>
        )}
      </div>
    </div>
  );
}
