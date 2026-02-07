import { useState, useEffect, useMemo } from 'react';
import { X, Crosshair, Copy, Check } from 'lucide-react';
import { designPrimerPair, primerToFeature, ENZYME_TAIL_PRESETS, type PrimerPair, type PrimerDesignParams } from '../../bio/primer-design';
import type { Feature } from '../../bio/types';

interface PrimerDesignDialogProps {
  sequence: string;
  sequenceName: string;
  sequenceLength: number;
  selectedRange: { start: number; end: number } | null;
  onAddFeatures: (features: Feature[]) => void;
  onClose: () => void;
}

export default function PrimerDesignDialog({
  sequence,
  sequenceName,
  sequenceLength,
  selectedRange,
  onAddFeatures,
  onClose,
}: PrimerDesignDialogProps) {
  const [targetStart, setTargetStart] = useState(String(selectedRange ? selectedRange.start + 1 : 1));
  const [targetEnd, setTargetEnd] = useState(String(selectedRange ? selectedRange.end : Math.min(500, sequenceLength)));
  const [minLength, setMinLength] = useState(18);
  const [maxLength, setMaxLength] = useState(28);
  const [targetTm, setTargetTm] = useState(60);
  const [minGC, setMinGC] = useState(40);
  const [maxGC, setMaxGC] = useState(60);
  const [forwardTail, setForwardTail] = useState('');
  const [reverseTail, setReverseTail] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const startVal = parseInt(targetStart, 10);
  const endVal = parseInt(targetEnd, 10);
  const start0 = isNaN(startVal) ? -1 : startVal - 1;
  const end0 = isNaN(endVal) ? -1 : endVal;
  const isValid = !isNaN(startVal) && !isNaN(endVal) && start0 >= 0 && end0 <= sequenceLength && start0 < end0;

  // Compute primer pairs
  const pairs = useMemo(() => {
    if (!isValid) return [];
    const params: PrimerDesignParams = {
      targetStart: start0,
      targetEnd: end0,
      minLength,
      maxLength,
      targetTm,
      tmTolerance: 5,
      minGC: minGC / 100,
      maxGC: maxGC / 100,
      forwardTail: forwardTail || undefined,
      reverseTail: reverseTail || undefined,
    };
    return designPrimerPair(sequence, params);
  }, [sequence, start0, end0, minLength, maxLength, targetTm, minGC, maxGC, forwardTail, reverseTail, isValid]);

  const handleAddFeatures = (pair: PrimerPair) => {
    const fwd = primerToFeature(pair.forward, `Fwd primer (${sequenceName})`);
    const rev = primerToFeature(pair.reverse, `Rev primer (${sequenceName})`);
    onAddFeatures([fwd, rev]);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCopyPair = (pair: PrimerPair) => {
    const text = `Forward: 5'-${pair.forward.fullSequence}-3'\nReverse: 5'-${pair.reverse.fullSequence}-3'`;
    handleCopy(text, 'pair');
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
    padding: '6px 10px',
    background: 'var(--bg-deep)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    boxSizing: 'border-box',
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
          maxWidth: 560,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'menuFadeIn 0.15s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
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
            <Crosshair size={16} style={{ color: 'var(--accent)' }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              Design Primers
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
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
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', flex: 1 }}>
          {/* Target region */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Target start (1-indexed)</label>
              <input
                type="number"
                min={1}
                max={sequenceLength}
                value={targetStart}
                onChange={(e) => setTargetStart(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Target end (1-indexed)</label>
              <input
                type="number"
                min={1}
                max={sequenceLength}
                value={targetEnd}
                onChange={(e) => setTargetEnd(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>

          {/* Parameters */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Primer length</label>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="number"
                  min={15}
                  max={35}
                  value={minLength}
                  onChange={(e) => setMinLength(parseInt(e.target.value, 10) || 18)}
                  style={{ ...inputStyle, width: '48%' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>–</span>
                <input
                  type="number"
                  min={15}
                  max={35}
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value, 10) || 28)}
                  style={{ ...inputStyle, width: '48%' }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Target Tm</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="range"
                  min={50}
                  max={72}
                  value={targetTm}
                  onChange={(e) => setTargetTm(parseInt(e.target.value, 10))}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', minWidth: 32 }}>
                  {targetTm}°C
                </span>
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>GC% range</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{minGC}%</span>
              <input
                type="range"
                min={20}
                max={80}
                value={minGC}
                onChange={(e) => setMinGC(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <input
                type="range"
                min={20}
                max={80}
                value={maxGC}
                onChange={(e) => setMaxGC(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{maxGC}%</span>
            </div>
          </div>

          {/* Primer tails */}
          <div>
            <label style={labelStyle}>5' Primer tails (optional — for cloning)</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Forward tail</div>
                <input
                  type="text"
                  value={forwardTail}
                  onChange={(e) => setForwardTail(e.target.value.toUpperCase().replace(/[^ACGT]/g, ''))}
                  placeholder="e.g. GCGCGAATTC"
                  style={{ ...inputStyle, fontSize: 11 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
                <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                  {ENZYME_TAIL_PRESETS.map((preset) => (
                    <button
                      key={`fwd-${preset.name}`}
                      onClick={() => setForwardTail(preset.tail)}
                      style={{
                        padding: '1px 6px',
                        background: forwardTail === preset.tail ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                        border: `1px solid ${forwardTail === preset.tail ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        borderRadius: 10,
                        color: forwardTail === preset.tail ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        fontWeight: forwardTail === preset.tail ? 600 : 400,
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Reverse tail</div>
                <input
                  type="text"
                  value={reverseTail}
                  onChange={(e) => setReverseTail(e.target.value.toUpperCase().replace(/[^ACGT]/g, ''))}
                  placeholder="e.g. GCGCGGATCC"
                  style={{ ...inputStyle, fontSize: 11 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
                <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                  {ENZYME_TAIL_PRESETS.map((preset) => (
                    <button
                      key={`rev-${preset.name}`}
                      onClick={() => setReverseTail(preset.tail)}
                      style={{
                        padding: '1px 6px',
                        background: reverseTail === preset.tail ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                        border: `1px solid ${reverseTail === preset.tail ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        borderRadius: 10,
                        color: reverseTail === preset.tail ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        fontWeight: reverseTail === preset.tail ? 600 : 400,
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <label style={labelStyle}>
              {pairs.length > 0 ? `${pairs.length} primer pair${pairs.length !== 1 ? 's' : ''} found` : isValid ? 'No suitable primers found — try adjusting parameters' : 'Enter a valid target region'}
            </label>

            {pairs.length > 0 && (
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 55px 45px 55px 56px', gap: 0, padding: '6px 8px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>
                  <span>#</span>
                  <span>Sequence</span>
                  <span>Tm</span>
                  <span>GC%</span>
                  <span>Product</span>
                  <span></span>
                </div>

                {/* Top 5 pairs */}
                {pairs.slice(0, 5).map((pair, i) => (
                  <div key={i}>
                    {/* Forward */}
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 55px 45px 55px 56px', gap: 0, padding: '5px 8px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', fontSize: 11 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 10 }}>F{i + 1}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>
                        5'-{pair.forward.tail && <span style={{ color: 'var(--text-muted)' }}>{pair.forward.tail}</span>}<span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pair.forward.sequence}</span>-3'
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{pair.forward.tm.toFixed(1)}°</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{pair.forward.gcPercent.toFixed(0)}%</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>{pair.productLength} bp</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          onClick={() => handleCopy(pair.forward.fullSequence, `fwd${i}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copied === `fwd${i}` ? 'var(--accent)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                          }}
                          title="Copy forward primer"
                        >
                          {copied === `fwd${i}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    {/* Reverse */}
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 55px 45px 55px 56px', gap: 0, padding: '5px 8px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', fontSize: 11 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 10 }}>R{i + 1}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>
                        5'-{pair.reverse.tail && <span style={{ color: 'var(--text-muted)' }}>{pair.reverse.tail}</span>}<span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pair.reverse.sequence}</span>-3'
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{pair.reverse.tm.toFixed(1)}°</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{pair.reverse.gcPercent.toFixed(0)}%</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>dTm {pair.tmDifference.toFixed(1)}°</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          onClick={() => handleCopy(pair.reverse.fullSequence, `rev${i}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copied === `rev${i}` ? 'var(--accent)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                          }}
                          title="Copy reverse primer"
                        >
                          {copied === `rev${i}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <button
                          onClick={() => handleCopyPair(pair)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 3,
                            color: copied === 'pair' ? 'var(--accent)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '1px 4px',
                            display: 'flex',
                            fontSize: 9,
                            fontFamily: 'var(--font-sans)',
                          }}
                          title="Copy both primers"
                        >
                          Both
                        </button>
                        <button
                          onClick={() => handleAddFeatures(pair)}
                          style={{
                            background: 'var(--accent-subtle)',
                            border: '1px solid var(--accent)',
                            borderRadius: 3,
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            padding: '1px 5px',
                            display: 'flex',
                            fontSize: 9,
                            fontWeight: 600,
                            fontFamily: 'var(--font-sans)',
                          }}
                          title="Add primers as feature annotations"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
