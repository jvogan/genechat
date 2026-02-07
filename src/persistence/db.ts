import Dexie, { type EntityTable } from 'dexie';
import type { Project, Conversation, SequenceBlock, BlockCheckpoint } from '../store/types';

interface Settings {
  key: string;
  value: unknown;
}

export class GeneChatDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  conversations!: EntityTable<Conversation, 'id'>;
  sequenceBlocks!: EntityTable<SequenceBlock, 'id'>;
  settings!: EntityTable<Settings, 'key'>;
  checkpoints!: EntityTable<BlockCheckpoint, 'id'>;

  constructor() {
    super('genechat');

    this.version(1).stores({
      projects: 'id, name, updatedAt',
      conversations: 'id, projectId, updatedAt',
      sequenceBlocks: 'id, conversationId, position',
      settings: 'key',
    });

    this.version(2).stores({
      projects: 'id, name, updatedAt',
      conversations: 'id, projectId, updatedAt',
      sequenceBlocks: 'id, conversationId, position',
      settings: 'key',
      checkpoints: 'id, blockId, conversationId, timestamp',
    });
  }
}

export const db = new GeneChatDB();
