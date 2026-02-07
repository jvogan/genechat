import { useState, useRef, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 400);
  };
  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    ...(position === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-active)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.15s ease',
    zIndex: 1000,
    boxShadow: 'var(--shadow-md)',
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <div style={tooltipStyle}>{content}</div>
    </div>
  );
}
