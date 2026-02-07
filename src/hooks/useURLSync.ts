import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/ui-store';
import { useProjectStore } from '../store/project-store';

export function useURLSync() {
  const syncingFromUrl = useRef(false);
  const appliedFromUrl = useRef(false);

  // Subscribe to conversations — when they become available, apply URL param once
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('conv');
    if (!convId) return;

    const tryApply = () => {
      if (appliedFromUrl.current) return false;
      const conversations = useProjectStore.getState().conversations;
      if (conversations.some((c) => c.id === convId)) {
        appliedFromUrl.current = true;
        syncingFromUrl.current = true;
        useUIStore.getState().setActiveConversation(convId);
        setTimeout(() => { syncingFromUrl.current = false; }, 0);
        return true;
      }
      return false;
    };

    // Try immediately (conversations may already be hydrated)
    if (tryApply()) return;

    // Subscribe and wait for conversations to load
    const unsub = useProjectStore.subscribe(() => {
      if (tryApply()) unsub();
    });
    return unsub;
  }, []);

  // Subscribe to conversation changes and update URL
  useEffect(() => {
    const unsub = useUIStore.subscribe(
      (state) => state.activeConversationId,
      (activeConversationId) => {
        if (syncingFromUrl.current) return;
        const url = new URL(window.location.href);
        if (activeConversationId) {
          url.searchParams.set('conv', activeConversationId);
        } else {
          url.searchParams.delete('conv');
        }
        window.history.replaceState({}, '', url.toString());
      },
    );
    return unsub;
  }, []);

  return null;
}
