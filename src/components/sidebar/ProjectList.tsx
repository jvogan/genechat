import { useState, useRef, useEffect } from 'react';
import { ChevronRight, FolderClosed, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface ConversationItem {
  id: string;
  title: string;
}

interface ProjectItem {
  id: string;
  name: string;
  color: string;
  conversations: ConversationItem[];
}

interface ProjectListProps {
  projects: ProjectItem[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversationInProject: (projectId: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
}

export type { ProjectItem, ConversationItem as ProjectConversationItem };

export default function ProjectList({
  projects,
  activeConversationId,
  onSelectConversation,
  onCreateConversationInProject,
  onRenameProject,
  onDeleteProject,
}: ProjectListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpenId]);

  function confirmRename(id: string) {
    const trimmed = renameValue.trim();
    if (trimmed) onRenameProject(id, trimmed);
    setRenamingId(null);
  }

  if (projects.length === 0) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          padding: '10px 14px 4px',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: 'var(--text-muted)',
        }}
      >
        Projects
      </div>
      {projects.map((p) => {
        const isExpanded = expanded[p.id] ?? false;
        const isMenuOpen = menuOpenId === p.id;
        const isRenaming = renamingId === p.id;

        return (
          <div key={p.id}>
            {/* Project header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 4px 4px 8px',
                borderRadius: 'var(--radius-sm)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isMenuOpen) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Expand/collapse button */}
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '3px 0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  textAlign: 'left',
                  overflow: 'hidden',
                }}
              >
                <ChevronRight
                  size={12}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                    color: 'var(--text-muted)',
                  }}
                />
                <FolderClosed size={14} style={{ color: p.color, flexShrink: 0 }} />
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename(p.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => confirmRename(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      padding: '2px 4px',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-accent)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                  }}
                >
                  {p.conversations.length}
                </span>
              </button>

              {/* Add conversation button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateConversationInProject(p.id);
                  setExpanded((prev) => ({ ...prev, [p.id]: true }));
                }}
                title="New chat in project"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Plus size={13} />
              </button>

              {/* More menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(isMenuOpen ? null : p.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <MoreHorizontal size={14} />
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 4,
                    zIndex: 100,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '4px 0',
                    minWidth: 140,
                    animation: 'menuFadeIn 0.15s ease',
                    transformOrigin: 'top right',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(p.id);
                      setRenameValue(p.name);
                      setMenuOpenId(null);
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
                    <Pencil size={13} /> Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p.id);
                      setMenuOpenId(null);
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
                      color: 'var(--rose)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Nested conversations */}
            {isExpanded && (
              <div style={{ paddingLeft: 20 }}>
                {p.conversations.length === 0 ? (
                  <div
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    No conversations
                  </div>
                ) : (
                  p.conversations.map((c) => {
                    const active = c.id === activeConversationId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => onSelectConversation(c.id)}
                        style={{
                          width: '100%',
                          display: 'block',
                          padding: '6px 12px',
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
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
