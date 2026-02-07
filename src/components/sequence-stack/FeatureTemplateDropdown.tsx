import { useState } from 'react';
import { FEATURE_TEMPLATES, getTemplateCategories, type FeatureTemplate } from '../../constants/feature-templates';

interface FeatureTemplateDropdownProps {
  onSelect: (template: FeatureTemplate) => void;
}

export default function FeatureTemplateDropdown({ onSelect }: FeatureTemplateDropdownProps) {
  const [open, setOpen] = useState(false);
  const categories = getTemplateCategories();

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setOpen(v => !v)}
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
        onMouseLeave={(e) => { if (!open) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
      >
        + Template
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: 4,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 20,
            minWidth: 220,
            maxHeight: 320,
            overflowY: 'auto',
            animation: 'menuFadeIn 0.15s ease',
            transformOrigin: 'top left',
          }}>
            {categories.map((cat, catIdx) => (
              <div key={cat}>
                {/* Category header */}
                <div style={{
                  padding: '6px 12px 2px',
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderTop: catIdx > 0 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  {cat}
                </div>
                {/* Items */}
                {FEATURE_TEMPLATES.filter(t => t.category === cat).map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      onSelect(t);
                      setOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    title={t.description}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: t.color,
                      flexShrink: 0,
                    }} />
                    {t.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
