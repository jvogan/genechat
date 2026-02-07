import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Feature, FeatureType } from '../../bio/types';

interface FeatureEditorProps {
  sequenceLength: number;
  feature?: Feature | null;
  initialRange?: { start: number; end: number } | null;
  template?: { name: string; type: FeatureType; color: string } | null;
  onSave: (feature: Feature) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const FEATURE_TYPES: FeatureType[] = [
  'orf', 'gene', 'cds', 'promoter', 'terminator', 'rbs',
  'origin', 'restriction_site', 'primer_bind', 'misc_feature', 'custom',
];

const PRESET_COLORS = [
  '#4ade80', '#60a5fa', '#a78bfa', '#fb7185',
  '#fbbf24', '#22d3ee', '#f97316', '#8b5cf6',
];

const TYPE_DEFAULT_COLORS: Record<string, string> = {
  orf: '#4ade80',
  gene: '#4ade80',
  cds: '#22d3ee',
  promoter: '#fbbf24',
  terminator: '#fb7185',
  rbs: '#8b5cf6',
  origin: '#60a5fa',
  resistance: '#f97316',
  restriction_site: '#fb7185',
  primer_bind: '#a78bfa',
  misc_feature: '#a78bfa',
  custom: '#60a5fa',
};

export default function FeatureEditor({
  sequenceLength,
  feature,
  initialRange,
  template,
  onSave,
  onDelete,
  onClose,
}: FeatureEditorProps) {
  const isEditing = !!feature;

  const [name, setName] = useState(feature?.name ?? template?.name ?? '');
  const [type, setType] = useState<FeatureType>(feature?.type ?? template?.type ?? 'misc_feature');
  const [startDisplay, setStartDisplay] = useState(
    feature ? String(feature.start + 1) : initialRange ? String(initialRange.start + 1) : '1'
  );
  const [endDisplay, setEndDisplay] = useState(
    feature ? String(feature.end) : initialRange ? String(initialRange.end) : String(sequenceLength)
  );
  const [strand, setStrand] = useState<1 | -1>(feature?.strand ?? 1);
  const [color, setColor] = useState(
    feature?.color ?? template?.color ?? TYPE_DEFAULT_COLORS['misc_feature']
  );

  // When type changes (and we're adding, not editing), update color to type default
  // Intentional derived-state reset when feature type changes
  useEffect(() => {
    if (!isEditing) {
      setColor(TYPE_DEFAULT_COLORS[type] ?? '#a78bfa'); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [type, isEditing]);

  // Parse numeric values
  const startVal = parseInt(startDisplay, 10);
  const endVal = parseInt(endDisplay, 10);
  const start0 = isNaN(startVal) ? -1 : startVal - 1; // convert 1-indexed display to 0-indexed
  const end0 = isNaN(endVal) ? -1 : endVal; // end is already exclusive in 0-indexed when shown as 1-indexed inclusive

  // Validation
  const nameValid = name.trim().length > 0;
  const startValid = !isNaN(startVal) && start0 >= 0;
  const endValid = !isNaN(endVal) && end0 <= sequenceLength;
  const rangeValid = startValid && endValid && start0 < end0;
  const isValid = nameValid && rangeValid;

  const handleSave = () => {
    if (!isValid) return;
    const saved: Feature = {
      id: feature?.id ?? crypto.randomUUID(),
      name: name.trim(),
      type,
      start: start0,
      end: end0,
      strand,
      color,
      metadata: feature?.metadata ?? {},
    };
    onSave(saved);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    marginBottom: 4,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    background: 'var(--bg-deep)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  };

  const numberInputStyle: React.CSSProperties = {
    ...inputStyle,
    fontFamily: 'var(--font-mono)',
    width: '100%',
  };

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
          maxWidth: 400,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'menuFadeIn 0.15s ease',
          overflow: 'hidden',
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
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
            }}
          >
            {isEditing ? 'Edit Feature' : 'Add Feature'}
          </span>
          <button
            onClick={onClose}
            aria-label="Close feature editor"
            title="Close feature editor"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.12s, background 0.12s',
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

        {/* Form body */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GFP, AmpR, T7 promoter"
              autoFocus
              style={{
                ...inputStyle,
                borderColor: !nameValid && name.length > 0 ? 'var(--rose)' : undefined,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FeatureType)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: 30,
              }}
            >
              {FEATURE_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Start / End row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start (1-indexed)</label>
              <input
                type="number"
                min={1}
                max={sequenceLength}
                value={startDisplay}
                onChange={(e) => setStartDisplay(e.target.value)}
                style={{
                  ...numberInputStyle,
                  borderColor: !startValid && startDisplay.length > 0 ? 'var(--rose)' : undefined,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End (1-indexed)</label>
              <input
                type="number"
                min={1}
                max={sequenceLength}
                value={endDisplay}
                onChange={(e) => setEndDisplay(e.target.value)}
                style={{
                  ...numberInputStyle,
                  borderColor: !endValid && endDisplay.length > 0 ? 'var(--rose)' : undefined,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>

          {/* Validation hint */}
          {!rangeValid && (startDisplay.length > 0 || endDisplay.length > 0) && (
            <div
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                color: 'var(--rose)',
                marginTop: -8,
              }}
            >
              {!startValid
                ? 'Start must be >= 1'
                : !endValid
                  ? `End must be <= ${sequenceLength}`
                  : 'Start must be less than End'}
            </div>
          )}

          {/* Strand */}
          <div>
            <label style={labelStyle}>Strand</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([1, -1] as const).map((s) => {
                const active = strand === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStrand(s)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      background: active ? 'var(--accent-subtle)' : 'var(--bg-deep)',
                      border: active
                        ? '1px solid var(--border-accent)'
                        : '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--bg-deep)';
                    }}
                  >
                    {s === 1 ? 'Forward (+)' : 'Reverse (-)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => {
                const active = color === c;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: c,
                      border: active
                        ? '2px solid var(--text-primary)'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: active ? 'var(--shadow-md)' : 'none',
                      transition: 'border-color 0.12s, box-shadow 0.12s, transform 0.12s',
                      transform: active ? 'scale(1.1)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={c}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* Delete button (left side, only when editing) */}
          <div>
            {isEditing && onDelete && (
              <button
                onClick={onDelete}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger-text)',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--rose)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'var(--rose)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--danger-bg)';
                  e.currentTarget.style.color = 'var(--danger-text)';
                  e.currentTarget.style.borderColor = 'var(--danger-border)';
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>

          {/* Cancel + Save (right side) */}
          <div style={{ display: 'flex', gap: 8 }}>
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
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              style={{
                padding: '6px 14px',
                background: isValid ? 'var(--accent)' : 'var(--bg-active)',
                border: '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
                color: isValid ? '#fff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: isValid ? 'pointer' : 'default',
                opacity: isValid ? 1 : 0.5,
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (isValid) e.currentTarget.style.background = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                if (isValid) e.currentTarget.style.background = 'var(--accent)';
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
