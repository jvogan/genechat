import { useState, useRef, useMemo, useEffect } from 'react';
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
  Undo2,
  Redo2,
  Lock,
  Unlock,
  GripVertical,
  Save,
  History,
} from 'lucide-react';
import SequenceDisplay from './SequenceDisplay';
import SequenceToolbar from './SequenceToolbar';
import SequenceNotes from './SequenceNotes';
import FeatureSelector from './FeatureSelector';
import FeatureAnnotationTrack from './FeatureAnnotationTrack';
import FeatureEditor from './FeatureEditor';
import FeatureTemplateDropdown from './FeatureTemplateDropdown';
import type { FeatureTemplate } from '../../constants/feature-templates';
import GCPlot from './GCPlot';
import ORFTrack from './ORFTrack';
import type { SequenceType, Feature, ManipulationType, ORF } from '../../bio/types';
import type { MutationScar } from '../../store/types';
import { exportToFasta, exportToGenBank, downloadFile } from '../../persistence/export';
import type { SequenceBlock as SequenceBlockType } from '../../store/types';
import { useUIStore } from '../../store/ui-store';
import { useCheckpointStore } from '../../store/checkpoint-store';
import { useSequenceEditor } from '../../hooks/useSequenceEditor';
import CheckpointList from './CheckpointList';
import BlockStatsRow from './BlockStatsRow';
import SequenceSearchBar from './SequenceSearchBar';
import SelectionActionBar from './SelectionActionBar';
import { findMotif, type MotifMatch } from '../../bio/motif-search';

interface SequenceBlockProps {
  id: string;
  name: string;
  raw: string;
  type: SequenceType;
  topology: 'linear' | 'circular';
  features: Feature[];
  notes: string;
  scars?: MutationScar[];
  isActive?: boolean;
  parentBlockId?: string | null;
  parentBlockName?: string | null;
  manipulation?: ManipulationType | null;
  onNotesChange?: (notes: string) => void;
  onNameChange?: (name: string) => void;
  onAction?: (type: ManipulationType) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onNavigateToParent?: (blockId: string) => void;
  onAddFeature?: (feature: Feature) => void;
  onUpdateFeature?: (featureId: string, updates: Partial<Feature>) => void;
  onRemoveFeature?: (featureId: string) => void;
  onExtractSelection?: (start: number, end: number) => void;
}

/** Build a human-readable description for a scar */
function scarDescription(scar: MutationScar, raw: string): string {
  const pos1 = scar.position + 1; // 1-indexed for display
  switch (scar.type) {
    case 'substitution':
      return `${scar.original}\u2192${raw[scar.position] ?? '?'} at pos ${pos1}`;
    case 'insertion':
      return `Inserted ${scar.inserted} after pos ${pos1}`;
    case 'deletion':
      return `Deleted ${scar.original} at pos ${pos1}`;
    default:
      return `Edit at pos ${pos1}`;
  }
}

/** Relative time string */
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


export default function SequenceBlock({
  id,
  name,
  raw,
  type,
  topology,
  features,
  notes,
  scars = [],
  isActive,
  parentBlockId,
  parentBlockName,
  manipulation,
  onNotesChange,
  onNameChange,
  onAction,
  onDelete,
  onDuplicate,
  onNavigateToParent,
  onAddFeature,
  onUpdateFeature,
  onRemoveFeature,
  onExtractSelection,
}: SequenceBlockProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [copied, setCopied] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [featureEditorOpen, setFeatureEditorOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [templatePreset, setTemplatePreset] = useState<FeatureTemplate | null>(null);
  const [checkpointListOpen, setCheckpointListOpen] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset delete confirmation when menu closes + cleanup timer
  useEffect(() => {
    if (!menuOpen) setConfirmingDelete(false); // eslint-disable-line react-hooks/set-state-in-effect -- cleanup side-state when parent menu closes
  }, [menuOpen]);
  useEffect(() => {
    return () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); };
  }, []);

  const selectedRange = useUIStore((s) => s.selectedRange);
  const setSelectedRange = useUIStore((s) => s.setSelectedRange);
  const cursorPosition = useUIStore((s) => s.editCursorPosition);
  const selectFeature = useUIStore((s) => s.selectFeature);
  const isLocked = useUIStore((s) => s.lockedBlockIds.has(id));
  const toggleBlockLock = useUIStore((s) => s.toggleBlockLock);
  const checkpointCount = useCheckpointStore((s) => s.checkpoints.filter((c) => c.blockId === id).length);
  const isMultiSelected = useUIStore((s) => s.selectedBlockIds.has(id));
  const searchOpen = useUIStore((s) => s.sequenceSearchOpen);
  const searchQuery = useUIStore((s) => s.sequenceSearchQuery);
  const searchMatchIndex = useUIStore((s) => s.sequenceSearchMatchIndex);

  // Compute search matches when search is active on this block
  const searchMatches = useMemo((): MotifMatch[] => {
    if (!isActive || !searchOpen || !searchQuery) return [];
    return findMotif(raw, searchQuery);
  }, [isActive, searchOpen, searchQuery, raw]);

  // Wire the sequence editor hook
  const {
    handleClick,
    handleKeyDown,
    isEditing,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    insertMode,
    toggleInsertMode,
  } = useSequenceEditor({
    blockId: id,
    raw,
    scars,
    features,
    sequenceType: type,
    isActive: !!isActive,
    isLocked,
  });

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

  // Sorted scars for changelog display
  const sortedScars = useMemo(() =>
    [...scars].sort((a, b) => b.createdAt - a.createdAt),
  [scars]);

  // Scar type colors for changelog
  const scarColor = (scarType: MutationScar['type']): string => {
    switch (scarType) {
      case 'substitution': return 'var(--scar-substitution)';
      case 'insertion': return 'var(--scar-insertion)';
      case 'deletion': return 'var(--scar-deletion)';
      default: return 'var(--text-muted)';
    }
  };

  // Tiny toolbar button style
  const tinyBtnStyle = (disabled: boolean): React.CSSProperties => ({
    width: 22,
    height: 22,
    borderRadius: 3,
    border: 'none',
    background: 'none',
    color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    opacity: disabled ? 0.4 : 1,
    transition: 'color 0.1s, background 0.1s',
  });

  return (
    <div
      data-testid="sequence-block"
      style={{
        borderRadius: 'var(--radius-md)',
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderLeft: isActive ? '3px solid var(--accent)' : '1px solid var(--border)',
        background: isActive ? 'var(--active-block-bg)' : 'var(--bg-primary)',
        boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        animation: 'fadeIn 0.3s ease',
        transition: 'box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease',
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
        {/* Drag handle */}
        <div
          data-drag-handle="true"
          style={{
            position: 'relative',
            color: 'var(--text-muted)',
            cursor: 'grab',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.cursor = 'grabbing'; }}
          onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.cursor = 'grab'; }}
        >
          {isMultiSelected && (
            <div style={{
              position: 'absolute', top: -2, left: -2, width: 14, height: 14,
              borderRadius: '50%', background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={9} style={{ color: 'white' }} />
            </div>
          )}
          <GripVertical size={14} />
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? 'Collapse block' : 'Expand block'}
          title={expanded ? 'Collapse block' : 'Expand block'}
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
            data-testid="block-name"
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
              borderRadius: 3,
              padding: '1px 4px',
              margin: '-1px -4px',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            title="Double-click to rename"
          >
            {name}
          </span>
        )}

        {/* Mode badge — only show insert mode indicator */}
        {isEditing && insertMode && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--scar-insertion)',
              background: 'rgba(20,184,166,0.1)',
              border: '1px solid rgba(20,184,166,0.25)',
              borderRadius: 3,
              padding: '1px 5px',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            INSERT
          </span>
        )}

        {/* Derivation breadcrumb */}
        {parentBlockName && manipulation && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (parentBlockId && onNavigateToParent) onNavigateToParent(parentBlockId);
            }}
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 200,
              background: 'none',
              border: 'none',
              cursor: parentBlockId ? 'pointer' : 'default',
              padding: '2px 4px',
              borderRadius: 3,
              fontFamily: 'var(--font-sans)',
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={(e) => { if (parentBlockId) { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
            title={parentBlockId ? `Go to ${parentBlockName}` : undefined}
          >
            from {parentBlockName}
          </button>
        )}

        {/* Lock toggle */}
        <button
          onClick={() => toggleBlockLock(id)}
          style={{
            background: isLocked ? 'var(--accent-subtle)' : 'none',
            border: 'none',
            color: isLocked ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            borderRadius: 4,
            transition: 'background 0.12s, color 0.12s',
          }}
          title={isLocked ? 'Unlock editing' : 'Lock editing'}
          aria-label={isLocked ? 'Unlock editing' : 'Lock editing'}
          onMouseEnter={e => { if (!isLocked) e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { if (!isLocked) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>

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
            aria-label="More actions"
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
                  animation: 'menuFadeIn 0.15s ease',
                  transformOrigin: 'top right',
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
                    const blockData: SequenceBlockType = { id, name, notes: '', raw, type, topology, features, analysis: null, scars: [], conversationId: '', parentBlockId: null, manipulation: null, position: 0, createdAt: 0 };
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
                    const blockData: SequenceBlockType = { id, name, notes: '', raw, type, topology, features, analysis: null, scars: [], conversationId: '', parentBlockId: null, manipulation: null, position: 0, createdAt: 0 };
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
                <button
                  onClick={() => {
                    useCheckpointStore.getState().createCheckpoint(id);
                    setMenuOpen(false);
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
                  <Save size={13} />
                  Save checkpoint
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setCheckpointListOpen(v => !v);
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
                  <History size={13} />
                  Checkpoints ({checkpointCount})
                </button>
                {onDuplicate && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate();
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
                      textAlign: 'left' as const,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Copy size={13} />
                    Duplicate
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirmingDelete) {
                        if (confirmTimer.current) clearTimeout(confirmTimer.current);
                        setMenuOpen(false);
                        onDelete();
                      } else {
                        setConfirmingDelete(true);
                        confirmTimer.current = setTimeout(() => setConfirmingDelete(false), 3000);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 12px',
                      background: confirmingDelete ? 'var(--danger-bg)' : 'none',
                      border: 'none',
                      color: 'var(--rose)',
                      fontSize: 12,
                      fontWeight: confirmingDelete ? 600 : 400,
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => { if (!confirmingDelete) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (!confirmingDelete) e.currentTarget.style.background = 'none'; }}
                  >
                    <Trash2 size={13} />
                    {confirmingDelete ? 'Really delete?' : 'Delete'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: expanded ? 2000 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
      <div style={{ padding: '0 14px 12px' }}>
        {/* Inline edit toolbar — visible on active block */}
        {isActive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginBottom: 6,
              userSelect: 'none',
            }}
          >
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              style={tinyBtnStyle(!canUndo)}
              title="Undo (Cmd+Z)"
              aria-label="Undo"
              onMouseEnter={e => { if (canUndo) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <Undo2 size={12} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              style={tinyBtnStyle(!canRedo)}
              title="Redo (Cmd+Shift+Z)"
              aria-label="Redo"
              onMouseEnter={e => { if (canRedo) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <Redo2 size={12} />
            </button>
            <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button
              onClick={toggleInsertMode}
              style={{
                height: 22,
                borderRadius: 3,
                border: 'none',
                background: insertMode ? 'rgba(20,184,166,0.12)' : 'none',
                color: insertMode ? 'var(--scar-insertion)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '0 6px',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.3,
                transition: 'all 0.1s',
              }}
              title={insertMode ? 'Switch to substitute mode' : 'Switch to insert mode'}
              onMouseEnter={e => { if (!insertMode) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!insertMode) e.currentTarget.style.background = 'none'; }}
            >
              {insertMode ? 'INS' : 'SUB'}
            </button>
          </div>
        )}

        {/* Checkpoint list */}
        {checkpointListOpen && (
          <CheckpointList
            blockId={id}
            currentLength={raw.length}
            onClose={() => setCheckpointListOpen(false)}
          />
        )}

        {/* Sequence search bar */}
        {isActive && searchOpen && (
          <SequenceSearchBar matchCount={searchMatches.length} />
        )}

        {/* Block stats row */}
        <BlockStatsRow raw={raw} type={type} selectedRange={isActive ? selectedRange : null} />

        {/* GC content sparkline */}
        <GCPlot raw={raw} type={type} />

        {/* Feature annotation track */}
        {features.length > 0 && (
          <FeatureAnnotationTrack
            features={features}
            totalLength={raw.length}
            onFeatureClick={(featureId) => selectFeature(featureId, 'workspace')}
          />
        )}

        {/* ORF visualization track */}
        {(type === 'dna' || type === 'rna') && (
          <ORFTrack
            raw={raw}
            type={type}
            totalLength={raw.length}
            onORFClick={(orf: ORF) => setSelectedRange({ start: orf.start, end: orf.end })}
          />
        )}

        {/* Sequence display */}
        <SequenceDisplay
          sequence={raw}
          type={type}
          isActive={isActive}
          selectedRange={isActive ? selectedRange : null}
          onRangeSelect={(range) => setSelectedRange(range)}
          scars={scars}
          isEditing={isEditing}
          cursorPosition={cursorPosition}
          insertMode={insertMode}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          searchMatches={isActive ? searchMatches : undefined}
          searchMatchIndex={isActive && searchMatches.length > 0 ? searchMatchIndex : undefined}
        />

        {/* Selection action bar */}
        {isActive && selectedRange && (
          <SelectionActionBar
            raw={raw}
            type={type}
            selectedRange={selectedRange}
            onExtract={() => {
              if (onExtractSelection) onExtractSelection(selectedRange.start, selectedRange.end);
            }}
            onAddFeature={() => {
              setEditingFeature(null);
              setFeatureEditorOpen(true);
            }}
          />
        )}

        {/* Features pills + add button */}
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {features.length > 0 && (
            <FeatureSelector
              features={features}
              onEdit={(f) => { setEditingFeature(f); setFeatureEditorOpen(true); }}
              onRemove={(featureId) => onRemoveFeature?.(featureId)}
            />
          )}
          {isActive && (
            <button
              onClick={() => { setEditingFeature(null); setTemplatePreset(null); setFeatureEditorOpen(true); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                background: 'none',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: 10,
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              + Feature
            </button>
          )}
          {isActive && (
            <FeatureTemplateDropdown
              onSelect={(tmpl) => {
                setTemplatePreset(tmpl);
                setEditingFeature(null);
                setFeatureEditorOpen(true);
              }}
            />
          )}
        </div>

        {/* Feature editor modal */}
        {featureEditorOpen && (
          <FeatureEditor
            sequenceLength={raw.length}
            feature={editingFeature}
            initialRange={!editingFeature ? selectedRange : null}
            template={!editingFeature ? templatePreset : null}
            onSave={(f) => {
              if (editingFeature) {
                onUpdateFeature?.(f.id, f);
              } else {
                onAddFeature?.(f);
              }
              setFeatureEditorOpen(false);
              setEditingFeature(null);
              setTemplatePreset(null);
            }}
            onDelete={editingFeature ? () => {
              onRemoveFeature?.(editingFeature.id);
              setFeatureEditorOpen(false);
              setEditingFeature(null);
            } : undefined}
            onClose={() => { setFeatureEditorOpen(false); setEditingFeature(null); setTemplatePreset(null); }}
          />
        )}

        {/* Toolbar */}
        <SequenceToolbar
          onAction={handleAction}
          sequenceType={type}
          selectedRange={isActive ? selectedRange : null}
          onClearSelection={() => setSelectedRange(null)}
        />

        {/* Mutation Changelog */}
        {scars.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => setChangelogOpen(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                padding: '2px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span style={{
                display: 'inline-block',
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--scar-substitution)',
                flexShrink: 0,
              }} />
              {scars.length} edit{scars.length !== 1 ? 's' : ''}
              <ChevronDown
                size={10}
                style={{
                  transform: changelogOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            {changelogOpen && (
              <div
                style={{
                  maxHeight: 120,
                  overflowY: 'auto',
                  marginTop: 4,
                  padding: '4px 8px',
                  background: 'var(--bg-deep)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {sortedScars.map(scar => (
                  <div
                    key={scar.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '2px 0',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{
                      width: 5, height: 5,
                      borderRadius: '50%',
                      background: scarColor(scar.type),
                      flexShrink: 0,
                    }} />
                    <span style={{ color: scarColor(scar.type), fontWeight: 500 }}>
                      {scarDescription(scar, raw)}
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {relativeTime(scar.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {showNotes && (
          <div style={{ marginTop: 8 }}>
            <SequenceNotes value={localNotes} onChange={handleNotesChange} />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
