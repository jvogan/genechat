import { db } from './db';
import { useProjectStore } from '../store/project-store';
import { useSequenceStore } from '../store/sequence-store';
import { useAIStore } from '../store/ai-store';
import { useUIStore } from '../store/ui-store';
import type { AIProviderName } from '../store/types';

// Hydrate stores from IndexedDB on app load
export async function hydrate(): Promise<void> {
  try {
    const [projects, conversations, blocks, themeRow, apiKeysRow] =
      await Promise.all([
        db.projects.toArray(),
        db.conversations.toArray(),
        db.sequenceBlocks.toArray(),
        db.settings.get('theme'),
        db.settings.get('apiKeys'),
      ]);

    if (projects.length > 0 || conversations.length > 0) {
      useProjectStore.setState({ projects, conversations });
    }

    if (blocks.length > 0) {
      useSequenceStore.setState({ blocks });
    }

    if (themeRow?.value) {
      useUIStore.setState({ theme: themeRow.value as 'light' | 'dark' });
    }

    if (apiKeysRow?.value) {
      useAIStore.setState({
        apiKeys: apiKeysRow.value as Record<AIProviderName, string>,
      });
    }

    // If DB was empty but stores have default data, persist it now
    // so that sample data survives page refresh even without user interaction
    if (projects.length === 0 && conversations.length === 0) {
      const state = useProjectStore.getState();
      if (state.projects.length > 0 || state.conversations.length > 0) {
        await db.projects.bulkPut(state.projects);
        await db.conversations.bulkPut(state.conversations);
      }
    }

    if (blocks.length === 0) {
      const storeBlocks = useSequenceStore.getState().blocks;
      if (storeBlocks.length > 0) {
        await db.sequenceBlocks.bulkPut(storeBlocks);
      }
    }
  } catch (err) {
    console.warn('Failed to hydrate from IndexedDB:', err);
  }
}

// Subscribe to store changes and persist
export function startSync(): () => void {
  const unsubs: (() => void)[] = [];

  // Debounce writes to avoid hammering IndexedDB
  let projectTimer: ReturnType<typeof setTimeout>;
  unsubs.push(
    useProjectStore.subscribe((state) => {
      clearTimeout(projectTimer);
      projectTimer = setTimeout(async () => {
        try {
          await db.transaction('rw', db.projects, db.conversations, async () => {
            await db.projects.clear();
            await db.conversations.clear();
            if (state.projects.length > 0) await db.projects.bulkPut(state.projects);
            if (state.conversations.length > 0) await db.conversations.bulkPut(state.conversations);
          });
        } catch (err) {
          console.warn('Failed to sync projects:', err);
        }
      }, 300);
    }),
  );

  let seqTimer: ReturnType<typeof setTimeout>;
  unsubs.push(
    useSequenceStore.subscribe((state) => {
      clearTimeout(seqTimer);
      seqTimer = setTimeout(async () => {
        try {
          await db.transaction('rw', db.sequenceBlocks, async () => {
            await db.sequenceBlocks.clear();
            if (state.blocks.length > 0) await db.sequenceBlocks.bulkPut(state.blocks);
          });
        } catch (err) {
          console.warn('Failed to sync sequences:', err);
        }
      }, 300);
    }),
  );

  let uiTimer: ReturnType<typeof setTimeout>;
  unsubs.push(
    useUIStore.subscribe(
      (state) => state.theme,
      (theme) => {
        clearTimeout(uiTimer);
        uiTimer = setTimeout(async () => {
          try {
            await db.settings.put({ key: 'theme', value: theme });
          } catch (err) {
            console.warn('Failed to sync theme:', err);
          }
        }, 300);
      },
    ),
  );

  let keyTimer: ReturnType<typeof setTimeout>;
  unsubs.push(
    useAIStore.subscribe(
      (state) => state.apiKeys,
      (apiKeys) => {
        clearTimeout(keyTimer);
        keyTimer = setTimeout(async () => {
          try {
            await db.settings.put({ key: 'apiKeys', value: apiKeys });
          } catch (err) {
            console.warn('Failed to sync API keys:', err);
          }
        }, 300);
      },
    ),
  );

  return () => {
    unsubs.forEach((fn) => fn());
    clearTimeout(projectTimer);
    clearTimeout(seqTimer);
    clearTimeout(uiTimer);
    clearTimeout(keyTimer);
  };
}
