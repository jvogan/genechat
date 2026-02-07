import { create } from 'zustand';
import type { Project, Conversation } from './types';

interface ProjectState {
  projects: Project[];
  conversations: Conversation[];
}

interface ProjectActions {
  createProject(name: string, color?: string): string;
  renameProject(id: string, name: string): void;
  deleteProject(id: string): void;
  createConversation(title: string, projectId: string | null): string;
  renameConversation(id: string, title: string): void;
  deleteConversation(id: string): void;
  moveConversation(conversationId: string, toProjectId: string | null): void;
  getConversation(id: string): Conversation | undefined;
  getProjectConversations(projectId: string): Conversation[];
  restoreConversation(conv: Conversation): void;
}

export type ProjectStore = ProjectState & ProjectActions;

function uid(): string {
  return crypto.randomUUID();
}

const now = Date.now();

// Sample conversations — sequences seeded in SequenceStack
const sampleConversations: Conversation[] = [
  {
    id: 'conv-gfp',
    title: 'GFP Analysis',
    projectId: null,
    sequenceBlockIds: [],
    createdAt: now - 3600000,
    updatedAt: now - 3600000,
  },
  {
    id: 'conv-cloning',
    title: 'pUC19 Vector',
    projectId: null,
    sequenceBlockIds: [],
    createdAt: now - 7200000,
    updatedAt: now - 7200000,
  },
  {
    id: 'conv-reporters',
    title: 'Reporter Constructs',
    projectId: null,
    sequenceBlockIds: [],
    createdAt: now - 86400000,
    updatedAt: now - 43200000,
  },
  {
    id: 'conv-human',
    title: 'Human Genetics',
    projectId: null,
    sequenceBlockIds: [],
    createdAt: now - 172800000,
    updatedAt: now - 86400000,
  },
  {
    id: 'conv-crispr',
    title: 'CRISPR Components',
    projectId: null,
    sequenceBlockIds: [],
    createdAt: now - 259200000,
    updatedAt: now - 172800000,
  },
  {
    id: 'conv-biomaterials',
    title: 'Biomaterials',
    projectId: null,
    sequenceBlockIds: [],
    createdAt: now - 345600000,
    updatedAt: now - 259200000,
  },
];

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  conversations: sampleConversations,

  createProject(name, color = '#4ade80') {
    const id = uid();
    const ts = Date.now();
    set((s) => ({
      projects: [
        ...s.projects,
        { id, name, color, conversationIds: [], createdAt: ts, updatedAt: ts },
      ],
    }));
    return id;
  },

  renameProject(id, name) {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
      ),
    }));
  },

  deleteProject(id) {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      conversations: s.conversations.map((c) =>
        c.projectId === id ? { ...c, projectId: null } : c,
      ),
    }));
  },

  createConversation(title, projectId) {
    const id = uid();
    const ts = Date.now();
    const conv: Conversation = {
      id,
      title,
      projectId,
      sequenceBlockIds: [],
      createdAt: ts,
      updatedAt: ts,
    };
    set((s) => ({
      conversations: [...s.conversations, conv],
      projects: projectId
        ? s.projects.map((p) =>
            p.id === projectId
              ? { ...p, conversationIds: [...p.conversationIds, id], updatedAt: ts }
              : p,
          )
        : s.projects,
    }));
    return id;
  },

  renameConversation(id, title) {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
      ),
    }));
  },

  deleteConversation(id) {
    const conv = get().conversations.find((c) => c.id === id);
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      projects: conv?.projectId
        ? s.projects.map((p) =>
            p.id === conv.projectId
              ? {
                  ...p,
                  conversationIds: p.conversationIds.filter((cid) => cid !== id),
                  updatedAt: Date.now(),
                }
              : p,
          )
        : s.projects,
    }));
  },

  moveConversation(conversationId, toProjectId) {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const fromProjectId = conv.projectId;
    const ts = Date.now();
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, projectId: toProjectId, updatedAt: ts } : c,
      ),
      projects: s.projects.map((p) => {
        if (p.id === fromProjectId) {
          return {
            ...p,
            conversationIds: p.conversationIds.filter((cid) => cid !== conversationId),
            updatedAt: ts,
          };
        }
        if (p.id === toProjectId) {
          return {
            ...p,
            conversationIds: [...p.conversationIds, conversationId],
            updatedAt: ts,
          };
        }
        return p;
      }),
    }));
  },

  getConversation(id) {
    return get().conversations.find((c) => c.id === id);
  },

  getProjectConversations(projectId) {
    return get().conversations.filter((c) => c.projectId === projectId);
  },

  restoreConversation(conv) {
    set((s) => ({
      conversations: [...s.conversations, conv],
      projects: conv.projectId
        ? s.projects.map((p) =>
            p.id === conv.projectId
              ? { ...p, conversationIds: [...p.conversationIds, conv.id], updatedAt: Date.now() }
              : p,
          )
        : s.projects,
    }));
  },
}));
