interface ZoomControlsProps {
  zoom: number;
  position: number | null;
  totalLength: number;
  viewport: { start: number; end: number };
  onZoomChange: (zoom: number) => void;
}

export default function ZoomControls({
  zoom,
  position,
  totalLength,
  viewport,
  onZoomChange,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);
  const viewLen = viewport.end - viewport.start;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 16px',
        background: 'rgba(22, 24, 32, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 40,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-secondary)',
        userSelect: 'none',
      }}
    >
      {/* Zoom out */}
      <button
        onClick={() => onZoomChange(Math.max(0.1, zoom * 0.8))}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: 14,
          lineHeight: 1,
        }}
        aria-label="Zoom out"
      >
        -
      </button>

      {/* Zoom slider */}
      <input
        type="range"
        min={10}
        max={5000}
        value={zoomPercent}
        onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
        style={{
          width: 80,
          height: 3,
          appearance: 'none',
          background: 'var(--border)',
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
          accentColor: 'var(--accent)',
        }}
        aria-label="Zoom level"
      />

      {/* Zoom in */}
      <button
        onClick={() => onZoomChange(Math.min(50, zoom * 1.25))}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: 14,
          lineHeight: 1,
        }}
        aria-label="Zoom in"
      >
        +
      </button>

      {/* Zoom percentage */}
      <span style={{ minWidth: 42, textAlign: 'right', color: 'var(--accent)' }}>
        {zoomPercent}%
      </span>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 16,
          background: 'var(--border)',
        }}
      />

      {/* Position readout */}
      <span style={{ minWidth: 80 }}>
        {position !== null ? (
          <>
            <span style={{ color: 'var(--text-muted)' }}>pos </span>
            <span style={{ color: 'var(--text-primary)' }}>{(position + 1).toLocaleString()}</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            {viewport.start + 1}..{viewport.end}
          </span>
        )}
      </span>

      {/* Total length */}
      <span style={{ color: 'var(--text-muted)' }}>
        / {totalLength.toLocaleString()} bp
      </span>

      {/* View range info */}
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        ({viewLen.toLocaleString()} visible)
      </span>
    </div>
  );
}
