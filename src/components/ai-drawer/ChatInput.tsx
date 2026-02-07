import { useState, useRef, useCallback } from 'react';
import { Square } from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';
import { useAIStore } from '../../store/ai-store';
import { ModelPicker } from './ModelPicker';

export function ChatInput() {
  const [text, setText] = useState('');
  const { sendMessage, isStreaming } = useAIChat();
  const activeModel = useAIStore((s) => s.activeModel);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  }, [text, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = '40px';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {showModelPicker && (
        <ModelPicker onClose={() => setShowModelPicker(false)} />
      )}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        {/* Model chip */}
        <button
          onClick={() => setShowModelPicker((v) => !v)}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {activeModel.split('-').slice(0, 2).join('-')}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your sequences..."
          rows={1}
          style={{
            flex: 1,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            resize: 'none',
            height: 40,
            outline: 'none',
            lineHeight: 1.4,
          }}
        />

        {/* Send / Stop */}
        {isStreaming ? (
          <button
            onClick={() => useAIStore.getState().stopGeneration()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'var(--rose)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Stop generation"
            title="Stop generation"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: text.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: text.trim() ? 'var(--bg-deep)' : 'var(--text-muted)',
              fontSize: 16,
              cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
            aria-label="Send message"
            title="Send message"
          >
            {'\u2191'}
          </button>
        )}
      </div>
    </div>
  );
}
