import { useUIStore } from '../store/ui-store';
import { X } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const mod = isMac ? '\u2318' : 'Ctrl';

const SHORTCUTS = [
  { keys: `${mod}+F`, description: 'Find in sequence' },
  { keys: `${mod}+Shift+R`, description: 'Reverse complement' },
  { keys: `${mod}+Shift+T`, description: 'Translate' },
  { keys: `${mod}+Shift+O`, description: 'Codon optimize' },
  { keys: `${mod}+Shift+E`, description: 'Auto annotate' },
  { keys: `${mod}+/`, description: 'Show this legend' },
  { keys: 'Escape', description: 'Close dialogs / clear selection' },
  { keys: 'Double-click name', description: 'Rename block' },
];

export default function ShortcutLegend() {
  const open = useUIStore((s) => s.shortcutLegendOpen);
  const toggle = useUIStore((s) => s.toggleShortcutLegend);
  if (!open) return null;
  return (
    <div
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Escape') toggle(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'menuFadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '24px 28px',
          maxWidth: 400,
          width: '90%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Keyboard Shortcuts</span>
          <button
            onClick={toggle}
            aria-label="Close shortcut legend"
            title="Close shortcut legend"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 4 }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SHORTCUTS.map((s) => (
            <div key={s.keys} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.description}</span>
              <kbd style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
              }}>
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
