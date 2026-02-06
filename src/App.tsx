import { useEffect } from 'react';
import ThemeProvider, { useTheme } from './components/layout/ThemeProvider';
import AppShell from './components/layout/AppShell';
import Sidebar from './components/sidebar/Sidebar';
import SequenceStack from './components/sequence-stack/SequenceStack';
import VizPanel from './components/viz-panel/VizPanel';
import { AIDrawer } from './components/ai-drawer/AIDrawer';
import { useUIStore } from './store/ui-store';
import { useSequenceStore } from './store/sequence-store';
import { useProjectStore } from './store/project-store';
import { Sun, Moon } from 'lucide-react';
import './index.css';

function AutoSelectConversation() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const setActiveConversation = useUIStore((s) => s.setActiveConversation);
  const conversations = useProjectStore((s) => s.conversations);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, setActiveConversation]);

  return null;
}

function AutoSelectBlock() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const activeBlockId = useUIStore((s) => s.activeSequenceBlockId);
  const selectSequenceBlock = useUIStore((s) => s.selectSequenceBlock);
  const getConversationBlocks = useSequenceStore((s) => s.getConversationBlocks);

  useEffect(() => {
    if (!activeConversationId) return;
    const blocks = getConversationBlocks(activeConversationId);
    // Auto-select first block if none is selected or current selection isn't in this conversation
    if (blocks.length > 0) {
      const currentInConvo = activeBlockId && blocks.some((b) => b.id === activeBlockId);
      if (!currentInConvo) {
        selectSequenceBlock(blocks[0].id);
      }
    }
  }, [activeConversationId, activeBlockId, getConversationBlocks, selectSequenceBlock]);

  return null;
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 50,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
        transition: 'color 0.15s ease',
      }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}

function ConnectedVizPanel() {
  const activeBlockId = useUIStore((s) => s.activeSequenceBlockId);
  const selectFeature = useUIStore((s) => s.selectFeature);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const blocks = useSequenceStore((s) => s.blocks);

  const activeBlock = activeBlockId
    ? blocks.find((b) => b.id === activeBlockId) ?? null
    : null;

  return (
    <VizPanel
      features={activeBlock?.features ?? []}
      restrictionSites={activeBlock?.analysis?.restrictionSites ?? []}
      totalLength={activeBlock?.raw.length ?? 0}
      topology={activeBlock?.topology ?? 'linear'}
      onClose={togglePanel}
      onFeatureSelect={(featureId) => selectFeature(featureId, 'map')}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AutoSelectConversation />
      <AutoSelectBlock />
      <AppShell
        sidebar={<Sidebar />}
        center={<SequenceStack />}
        rightPanel={<ConnectedVizPanel />}
        aiDrawer={<AIDrawer />}
      />
      <ThemeToggle />
    </ThemeProvider>
  );
}
