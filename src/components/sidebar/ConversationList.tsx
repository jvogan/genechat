import { useState, useEffect, useRef } from 'react';
import { FolderClosed, Trash2 } from 'lucide-react';

export interface ConversationItem {
  id: string;
  title: string;
  blockCount?: number;
  updatedAt?: number;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ProjectInfo {
  id: string;
  name: string;
  color: string;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  projects?: ProjectInfo[];
  onMoveToProject?: (conversationId: string, projectId: string | null) => void;
  onDelete?: (conversationId: string) => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  projects,
  onMoveToProject,
  onDelete,
}: ConversationListProps) {
  const [contextMenu, setContextMenu] = useState<{
    conversationId: string;
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const deleteConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      setConfirmingDeleteId(null);
      if (deleteConfirmTimer.current) clearTimeout(deleteConfirmTimer.current);
    };
  }, [contextMenu]);

  function handleContextMenu(e: React.MouseEvent, conversationId: string) {
    if (!projects?.length && !onDelete) return;
    e.preventDefault();
    setContextMenu({ conversationId, x: e.clientX, y: e.clientY });
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {conversations.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            data-testid="conversation-item"
            key={c.id}
            onClick={() => onSelect(c.id)}
            onContextMenu={(e) => handleContextMenu(e, c.id)}
            style={{
              width: '100%',
              display: 'block',
              padding: '8px 12px',
              background: active ? 'var(--bg-active)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-sans)',
              marginBottom: 1,
              transition: 'background 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.title}
            </div>
            {(c.blockCount != null || c.updatedAt != null) && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {c.blockCount != null && `${c.blockCount} block${c.blockCount !== 1 ? 's' : ''}`}
                {c.blockCount != null && c.updatedAt != null && ' \u00b7 '}
                {c.updatedAt != null && relativeTime(c.updatedAt)}
              </div>
            )}
          </button>
        );
      })}

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 200,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            padding: '4px 0',
            minWidth: 160,
            animation: 'menuFadeIn 0.15s ease',
            transformOrigin: 'top left',
          }}
        >
          {projects?.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onMoveToProject?.(contextMenu.conversationId, p.id);
                setContextMenu(null);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <FolderClosed size={13} style={{ color: p.color }} />
              Move to {p.name}
            </button>
          ))}
          {projects && projects.length > 0 && onDelete && (
            <div
              style={{
                height: 1,
                background: 'var(--border)',
                margin: '4px 0',
              }}
            />
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirmingDeleteId === contextMenu.conversationId) {
                  if (deleteConfirmTimer.current) clearTimeout(deleteConfirmTimer.current);
                  onDelete(contextMenu.conversationId);
                  setContextMenu(null);
                  setConfirmingDeleteId(null);
                } else {
                  setConfirmingDeleteId(contextMenu.conversationId);
                  deleteConfirmTimer.current = setTimeout(() => setConfirmingDeleteId(null), 3000);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: confirmingDeleteId === contextMenu.conversationId ? 'var(--danger-bg)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: confirmingDeleteId === contextMenu.conversationId ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                color: 'var(--rose)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (confirmingDeleteId !== contextMenu.conversationId) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (confirmingDeleteId !== contextMenu.conversationId) e.currentTarget.style.background = 'none';
              }}
            >
              <Trash2 size={13} />
              {confirmingDeleteId === contextMenu.conversationId ? 'Really delete?' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
