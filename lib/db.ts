import Dexie, { type Table } from 'dexie';

export interface ChatSession {
  id: string; // uuid or unique string
  title: string;
  createdAt: number;
  modelMode: string;
  branchedFromChatId?: string; // parent chat ID if this chat was branched
  branchedAtIndex?: number;    // message index at which the branch was created
}

export interface ChatMessage {
  id?: number; // autoincrement primary key
  chatId: string; // foreign key to chat session
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
  createdAt: number;
}

export interface FaviconCache {
  domain: string;
  dataUrl: string;
  createdAt: number;
}

export interface LibraryFile {
  id?: number;
  chatId: string;
  messageId?: number;
  name: string;
  type: 'image' | 'pdf' | 'other';
  mimeType?: string;
  data?: string; // Base64 data URL (deprecated in v4; stored in libraryPayloads table instead)
  createdAt: number;
}

export interface LibraryFilePayload {
  fileId: number;
  data: string; // Base64 data URL
}

export class ParadoxDatabase extends Dexie {
  chats!: Table<ChatSession>;
  messages!: Table<ChatMessage>;
  favicons!: Table<FaviconCache>;
  library!: Table<LibraryFile>;
  libraryPayloads!: Table<LibraryFilePayload>;

  constructor() {
    super('ParadoxDatabase');
    this.version(2).stores({
      chats: 'id, title, createdAt, modelMode',
      messages: '++id, chatId, role, createdAt',
      favicons: 'domain, createdAt',
    });
    this.version(3).stores({
      chats: 'id, title, createdAt, modelMode',
      messages: '++id, chatId, role, createdAt',
      favicons: 'domain, createdAt',
      library: '++id, chatId, type, createdAt',
    });
    this.version(4).stores({
      chats: 'id, title, createdAt, modelMode',
      messages: '++id, chatId, role, createdAt',
      favicons: 'domain, createdAt',
      library: '++id, chatId, type, createdAt',
      libraryPayloads: 'fileId',
    }).upgrade(async tx => {
      // Migrate existing base64 data to libraryPayloads
      const files = await tx.table('library').toArray();
      for (const file of files) {
        if (file.data && file.id) {
          try {
            await tx.table('libraryPayloads').add({
              fileId: file.id,
              data: file.data
            });
            delete file.data;
            await tx.table('library').put(file);
          } catch (e) {
            console.error('[Dexie v4 Upgrade] Failed to migrate file payload:', file.id, e);
          }
        }
      }
    });
    this.version(5).stores({
      chats: 'id, title, createdAt, modelMode, branchedFromChatId',
      messages: '++id, chatId, role, createdAt',
      favicons: 'domain, createdAt',
      library: '++id, chatId, type, createdAt',
      libraryPayloads: 'fileId',
    });
  }
}

export const db = new ParadoxDatabase();
