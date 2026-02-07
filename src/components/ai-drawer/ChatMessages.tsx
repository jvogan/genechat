import { useEffect, useRef } from 'react';
import { useAIStore } from '../../store/ai-store';
import MarkdownText from './MarkdownText';

export function ChatMessages() {
  const messages = useAIStore((s) => s.chatMessages);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
          padding: 20,
          textAlign: 'center',
        }}
      >
        Ask questions about your sequences, request annotations, or get help with molecular biology.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {messages.map((msg) => {
        const isError =
          msg.role === 'assistant' &&
          (msg.content.startsWith('Error:') ||
            msg.content.startsWith('No API key') ||
            msg.content.startsWith('Provider "'));

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                ...(msg.role === 'user'
                  ? {
                      background: 'var(--accent)',
                      color: 'var(--bg-deep)',
                      borderBottomRightRadius: 4,
                    }
                  : isError
                    ? {
                        background: 'rgba(248,113,113,0.1)',
                        color: '#f87171',
                        borderBottomLeftRadius: 4,
                        border: '1px solid rgba(248,113,113,0.25)',
                      }
                    : {
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        borderBottomLeftRadius: 4,
                        border: '1px solid var(--border-subtle)',
                      }),
              }}
            >
              {msg.content ? (
                <MessageContent content={msg.content} role={msg.role} />
              ) : (isStreaming && msg.role === 'assistant' ? (
                <span style={{ color: 'var(--text-muted)' }}>
                  <TypingDots />
                </span>
              ) : null)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageContent({ content, role }: { content: string; role: string }) {
  if (role !== 'assistant') return <>{content}</>;

  // Split content into text and action result lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      elements.push(<MarkdownText key={`t${elements.length}`} text={textBuffer.join('\n')} />);
      textBuffer = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('\u2713 ')) {
      flushText();
      elements.push(
        <div
          key={`a${elements.length}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 0',
            fontSize: 11,
            fontWeight: 500,
            color: '#4ade80',
          }}
        >
          {line}
        </div>,
      );
    } else if (line.startsWith('\u2717 ')) {
      flushText();
      elements.push(
        <div
          key={`a${elements.length}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 0',
            fontSize: 11,
            fontWeight: 500,
            color: '#f87171',
          }}
        >
          {line}
        </div>,
      );
    } else {
      textBuffer.push(line);
    }
  }
  flushText();

  return <>{elements}</>;
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--text-muted)',
            animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  );
}
