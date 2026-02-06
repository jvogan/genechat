import { useCallback, useRef, type ReactNode } from 'react';

interface ResizablePanelProps {
  side: 'left' | 'right';
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (width: number) => void;
  open: boolean;
  children: ReactNode;
}

export default function ResizablePanel({
  side,
  width,
  minWidth = 220,
  maxWidth = 500,
  onResize,
  open,
  children,
}: ResizablePanelProps) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = side === 'left'
          ? ev.clientX - startX.current
          : startX.current - ev.clientX;
        const next = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));
        onResize(next);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [side, width, minWidth, maxWidth, onResize],
  );

  const handlePosition = side === 'left' ? 'right' : 'left';

  return (
    <div
      style={{
        position: 'relative',
        width: open ? width : 0,
        minWidth: open ? width : 0,
        overflow: 'hidden',
        transition: dragging.current ? 'none' : 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--bg-primary)',
        borderLeft: side === 'right' ? '1px solid var(--border-subtle)' : undefined,
        borderRight: side === 'left' ? '1px solid var(--border-subtle)' : undefined,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
      {/* drag handle */}
      {open && (
        <div
          onMouseDown={onMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            [handlePosition]: -2,
            width: 5,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
