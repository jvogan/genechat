import { useEffect } from 'react';
import ThemeProvider, { useTheme } from './components/layout/ThemeProvider';
import AppShell from './components/layout/AppShell';
import Sidebar from './components/sidebar/Sidebar';
import SequenceStack from './components/sequence-stack/SequenceStack';
import { AIDrawer } from './components/ai-drawer/AIDrawer';
import { useUIStore } from './store/ui-store';
import { useSequenceStore } from './store/sequence-store';
import { useProjectStore } from './store/project-store';
import { Sun, Moon } from 'lucide-react';
import { useURLSync } from './hooks/useURLSync';
import './index.css';

function AutoSelectConversation() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const setActiveConversation = useUIStore((s) => s.setActiveConversation);
  const conversations = useProjectStore((s) => s.conversations);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      // Defer to URL param if present
      const urlConvId = new URLSearchParams(window.location.search).get('conv');
      if (urlConvId && conversations.some((c) => c.id === urlConvId)) {
        setActiveConversation(urlConvId);
      } else {
        setActiveConversation(conversations[0].id);
      }
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

function URLSync() {
  useURLSync();
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

export default function App() {
  return (
    <ThemeProvider>
      <URLSync />
      <AutoSelectConversation />
      <AutoSelectBlock />
      <AppShell
        sidebar={<Sidebar />}
        center={<SequenceStack />}
        aiDrawer={<AIDrawer />}
      />
      <ThemeToggle />
    </ThemeProvider>
  );
}
