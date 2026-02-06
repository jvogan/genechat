import Dexie, { type EntityTable } from 'dexie';
import type { Project, Conversation, SequenceBlock } from '../store/types';

interface Settings {
  key: string;
  value: unknown;
}

export class GeneChatDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  conversations!: EntityTable<Conversation, 'id'>;
  sequenceBlocks!: EntityTable<SequenceBlock, 'id'>;
  settings!: EntityTable<Settings, 'key'>;

  constructor() {
    super('genechat');

    this.version(1).stores({
      projects: 'id, name, updatedAt',
      conversations: 'id, projectId, updatedAt',
      sequenceBlocks: 'id, conversationId, position',
      settings: 'key',
    });
  }
}

export const db = new GeneChatDB();
