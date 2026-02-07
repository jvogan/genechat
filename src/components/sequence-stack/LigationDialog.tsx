import { useState, useEffect, useMemo } from 'react';
import { X, Link2, ArrowUp, ArrowDown } from 'lucide-react';
import { ligate } from '../../bio/ligate';
import type { SequenceBlock } from '../../store/types';
import type { Feature } from '../../bio/types';

interface LigationDialogProps {
  blocks: SequenceBlock[];
  onLigate: (result: { sequence: string; features: Feature[]; name: string }) => void;
  onClose: () => void;
}

export default function LigationDialog({
  blocks,
  onLigate,
  onClose,
}: LigationDialogProps) {
  // Only show DNA blocks
  const dnaBlocks = useMemo(() => blocks.filter(b => b.type === 'dna'), [blocks]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [linker, setLinker] = useState('');

  const toggleBlock = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSelectedIds(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    setSelectedIds(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  // Compute ligation preview
  const preview = useMemo(() => {
    if (selectedIds.length < 2) return null;
    const fragments = selectedIds.map(id => {
      const block = dnaBlocks.find(b => b.id === id)!;
      return {
        sequence: block.raw,
        name: block.name,
        features: block.features,
      };
    });
    const cleanLinker = linker.toUpperCase().replace(/[^ATGCN]/g, '');
    const result = ligate(fragments, cleanLinker);
    return {
      totalLength: result.sequence.length,
      featureCount: result.features.length,
      linkerLength: cleanLinker.length,
      fragmentCount: selectedIds.length,
    };
  }, [selectedIds, linker, dnaBlocks]);

  const handleLigate = () => {
    if (selectedIds.length < 2) return;
    const fragments = selectedIds.map(id => {
      const block = dnaBlocks.find(b => b.id === id)!;
      return {
        sequence: block.raw,
        name: block.name,
        features: block.features,
      };
    });
    const cleanLinker = linker.toUpperCase().replace(/[^ATGCN]/g, '');
    const result = ligate(fragments, cleanLinker);
    const names = selectedIds.map(id => dnaBlocks.find(b => b.id === id)!.name);
    const name = `Ligation of ${names.join(' + ')}`;
    onLigate({ sequence: result.sequence, features: result.features, name });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const selectedBlocks = selectedIds
    .map(id => dnaBlocks.find(b => b.id === id))
    .filter((b): b is SequenceBlock => !!b);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'menuFadeIn 0.15s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link2 size={16} style={{ color: 'var(--accent)' }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              Ligate Fragments
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', flex: 1 }}>
          {/* Block selection */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Select DNA blocks to join ({dnaBlocks.length} available)
            </label>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              {dnaBlocks.map(block => {
                const isSelected = selectedIds.includes(block.id);
                return (
                  <label
                    key={block.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBlock(block.id)}
                      style={{ margin: 0, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {block.name}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {block.raw.length.toLocaleString()} bp
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reorder selected */}
          {selectedBlocks.length >= 2 && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Fragment order (drag to reorder)
              </label>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                {selectedBlocks.map((block, idx) => (
                  <div
                    key={block.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderBottom: idx < selectedBlocks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      fontSize: 12,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 16 }}>
                      {idx + 1}.
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {block.name}
                    </span>
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: idx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        padding: 2,
                        display: 'flex',
                      }}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx >= selectedBlocks.length - 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: idx >= selectedBlocks.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)',
                        cursor: idx >= selectedBlocks.length - 1 ? 'default' : 'pointer',
                        padding: 2,
                        display: 'flex',
                      }}
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linker sequence */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Linker sequence <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={linker}
              onChange={(e) => setLinker(e.target.value)}
              placeholder="e.g. GAATTC"
              style={{
                width: '100%',
                padding: '7px 10px',
                background: 'var(--bg-deep)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {linker && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginTop: 3 }}>
                Linker will be inserted between each fragment
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ fontWeight: 600 }}>Result: </span>
              {preview.totalLength.toLocaleString()} bp
              {preview.featureCount > 0 && `, ${preview.featureCount} features`}
              {preview.linkerLength > 0 && `, ${preview.linkerLength}bp linker × ${preview.fragmentCount - 1}`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleLigate}
            disabled={selectedIds.length < 2}
            style={{
              padding: '6px 14px',
              background: selectedIds.length >= 2 ? 'var(--accent)' : 'var(--bg-active)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: selectedIds.length >= 2 ? '#fff' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: selectedIds.length >= 2 ? 'pointer' : 'default',
              opacity: selectedIds.length >= 2 ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
            onMouseEnter={(e) => {
              if (selectedIds.length >= 2) e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              if (selectedIds.length >= 2) e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            <Link2 size={13} />
            Ligate
          </button>
        </div>
      </div>
    </div>
  );
}
