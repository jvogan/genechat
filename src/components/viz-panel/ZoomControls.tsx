interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToView: () => void;
}

export default function ZoomControls({
  zoom,
  onZoomChange,
  onFitToView,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 36, // above StatusBar (28px + 8px gap)
        right: 8,
        height: 28,
        background: 'color-mix(in srgb, var(--bg-secondary) 85%, transparent)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--text-secondary)',
        userSelect: 'none',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '0 4px',
      }}
    >
      {/* Zoom out */}
      <button
        onClick={() => onZoomChange(Math.max(0.1, zoom * 0.8))}
        style={{
          width: 20,
          height: 20,
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 0,
          fontSize: 12,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        aria-label="Zoom out"
      >
        −
      </button>

      {/* Zoom percentage */}
      <span style={{ minWidth: 32, textAlign: 'center', color: 'var(--accent)', fontSize: 10 }}>
        {zoomPercent}%
      </span>

      {/* Zoom in */}
      <button
        onClick={() => onZoomChange(Math.min(50, zoom * 1.25))}
        style={{
          width: 20,
          height: 20,
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 0,
          fontSize: 12,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        aria-label="Zoom in"
      >
        +
      </button>

      {/* Fit button */}
      <button
        onClick={onFitToView}
        style={{
          fontSize: 10,
          padding: '2px 5px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        Fit
      </button>
    </div>
  );
}
