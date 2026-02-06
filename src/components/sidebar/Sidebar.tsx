import { useState, useMemo, useCallback } from 'react';
import { Plus, Dna, FolderPlus } from 'lucide-react';
import ConversationList, { type ConversationItem } from './ConversationList';
import ProjectList from './ProjectList';
import { useProjectStore } from '../../store/project-store';
import { useUIStore } from '../../store/ui-store';

export default function Sidebar() {
  const conversations = useProjectStore((s) => s.conversations);
  const projects = useProjectStore((s) => s.projects);
  const createConversation = useProjectStore((s) => s.createConversation);
  const createProject = useProjectStore((s) => s.createProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const moveConversation = useProjectStore((s) => s.moveConversation);
  const deleteConversation = useProjectStore((s) => s.deleteConversation);
  const getProjectConversations = useProjectStore((s) => s.getProjectConversations);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const setActiveConversation = useUIStore((s) => s.setActiveConversation);

  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const ungroupedItems: ConversationItem[] = useMemo(() => {
    const items = conversations
      .filter((c) => c.projectId === null)
      .map((c) => ({ id: c.id, title: c.title }));
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const projectItems = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        conversations: getProjectConversations(p.id).map((c) => ({
          id: c.id,
          title: c.title,
        })),
      })),
    [projects, getProjectConversations],
  );

  const projectInfoForMenu = useMemo(
    () => projects.map((p) => ({ id: p.id, name: p.name, color: p.color })),
    [projects],
  );

  const handleNewChat = useCallback(() => {
    const id = createConversation('New Sequence Chat', null);
    setActiveConversation(id);
  }, [createConversation, setActiveConversation]);

  const handleCreateConversationInProject = useCallback(
    (projectId: string) => {
      const id = createConversation('New Sequence Chat', projectId);
      setActiveConversation(id);
    },
    [createConversation, setActiveConversation],
  );

  function handleFinishCreateProject() {
    const trimmed = newProjectName.trim();
    if (trimmed) createProject(trimmed);
    setCreatingProject(false);
    setNewProjectName('');
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Dna size={18} style={{ color: 'var(--accent)' }} />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            GeneChat
          </span>
        </div>
        <button
          onClick={handleNewChat}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Plus size={15} />
          New chat
        </button>

        {/* New project button */}
        <button
          onClick={() => setCreatingProject(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            marginTop: 4,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <FolderPlus size={14} />
          New project
        </button>

        {/* Inline project creation input */}
        {creatingProject && (
          <input
            autoFocus
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishCreateProject();
              if (e.key === 'Escape') {
                setCreatingProject(false);
                setNewProjectName('');
              }
            }}
            onBlur={handleFinishCreateProject}
            style={{
              width: '100%',
              padding: '6px 8px',
              marginTop: 4,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        )}
      </div>

      {/* Scrollable area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 6px' }}>
        {projectItems.length > 0 && (
          <ProjectList
            projects={projectItems}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversation}
            onCreateConversationInProject={handleCreateConversationInProject}
            onRenameProject={renameProject}
            onDeleteProject={deleteProject}
          />
        )}
        <ConversationList
          conversations={ungroupedItems}
          activeId={activeConversationId}
          onSelect={setActiveConversation}
          projects={projectInfoForMenu}
          onMoveToProject={moveConversation}
          onDelete={deleteConversation}
        />
      </div>
    </div>
  );
}
