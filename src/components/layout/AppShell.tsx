import { type ReactNode } from 'react';
import { Map, MessageSquare, PanelLeftClose, PanelLeft } from 'lucide-react';
import ResizablePanel from './ResizablePanel';
import { useUIStore } from '../../store/ui-store';

interface AppShellProps {
  sidebar: ReactNode;
  center: ReactNode;
  rightPanel: ReactNode;
  aiDrawer?: ReactNode;
}

export default function AppShell({ sidebar, center, rightPanel, aiDrawer }: AppShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const panelOpen = useUIStore((s) => s.panelOpen);
  const panelWidth = useUIStore((s) => s.panelWidth);
  const setPanelWidth = useUIStore((s) => s.setPanelWidth);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const aiDrawerOpen = useUIStore((s) => s.aiDrawerOpen);
  const aiDrawerHeight = useUIStore((s) => s.aiDrawerHeight);
  const toggleDrawer = useUIStore((s) => s.toggleDrawer);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--bg-deep)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <ResizablePanel
        side="left"
        width={sidebarWidth}
        onResize={setSidebarWidth}
        open={sidebarOpen}
        minWidth={240}
        maxWidth={400}
      >
        {sidebar}
      </ResizablePanel>

      {/* Center workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Top bar controls */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            gap: 4,
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-primary)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={toggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              transition: 'color 0.12s',
            }}
            title="Toggle sidebar"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={togglePanel}
            style={{
              background: panelOpen ? 'var(--bg-active)' : 'none',
              border: 'none',
              color: panelOpen ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              transition: 'all 0.12s',
            }}
            title={panelOpen ? 'Hide map' : 'Show map'}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = panelOpen ? 'var(--text-primary)' : 'var(--text-muted)'; }}
          >
            <Map size={16} />
          </button>
          <button
            onClick={toggleDrawer}
            style={{
              background: aiDrawerOpen ? 'var(--bg-active)' : 'none',
              border: 'none',
              color: aiDrawerOpen ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              transition: 'all 0.12s',
            }}
            title="AI Chat"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = aiDrawerOpen ? 'var(--text-primary)' : 'var(--text-muted)'; }}
          >
            <MessageSquare size={16} />
          </button>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>{center}</div>

          {/* AI Drawer */}
          {aiDrawerOpen && aiDrawer && (
            <div
              style={{
                height: aiDrawerHeight,
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {aiDrawer}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <ResizablePanel
        side="right"
        width={panelWidth}
        onResize={setPanelWidth}
        open={panelOpen}
        minWidth={300}
        maxWidth={600}
      >
        {rightPanel}
      </ResizablePanel>
    </div>
  );
}
