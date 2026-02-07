import { useRef, useCallback, useState } from 'react';
import { useUIStore } from '../../store/ui-store';
import { useAIStore } from '../../store/ai-store';
import { AI_MODELS } from '../../store/types';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { APIKeySettings } from './APIKeySettings';

export function AIDrawer() {
  const drawerHeight = useUIStore((s) => s.aiDrawerHeight);
  const setDrawerHeight = useUIStore((s) => s.setAiDrawerHeight);
  const toggleDrawer = useUIStore((s) => s.toggleDrawer);
  const activeModel = useAIStore((s) => s.activeModel);
  const [, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const modelConfig = AI_MODELS.find((m) => m.modelId === activeModel);
  const modelLabel = modelConfig?.displayName ?? activeModel;

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartHeight.current = drawerHeight;

      const handleMove = (me: MouseEvent) => {
        const delta = dragStartY.current - me.clientY;
        const next = Math.max(200, Math.min(600, dragStartHeight.current + delta));
        setDrawerHeight(next);
      };

      const handleUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [drawerHeight, setDrawerHeight],
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {showSettings && (
        <APIKeySettings onClose={() => setShowSettings(false)} />
      )}

      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        style={{
          height: 32,
          minHeight: 32,
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 32,
            height: 3,
            borderRadius: 2,
            background: 'var(--border)',
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          AI
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            opacity: 0.7,
          }}
        >
          {modelLabel}
        </span>

        {/* Settings gear */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(true);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: 36,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 14,
            padding: '2px 6px',
            borderRadius: 4,
          }}
          title="API Key Settings"
        >
          &#9881;
        </button>

        {/* Close */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDrawer();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: 12,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 14,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          x
        </button>
      </div>

      {/* Messages */}
      <ChatMessages />

      {/* Input */}
      <ChatInput />
    </div>
  );
}
