import Dexie, { type Table } from 'dexie';

export interface ChatSession {
  id: string; // uuid or unique string
  title: string;
  createdAt: number;
  updatedAt?: number;
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

export type IntegrationStatus = 'connected' | 'expired' | 'unreachable' | 'error' | 'disconnected';

export interface MCPIntegration {
  id: string;             // Unique identifier (e.g., 'github', 'cal', or UUID)
  name: string;           // Display name (e.g., 'GitHub')
  url: string;            // Remote SSE host URL (e.g., 'https://mcp.github.com/mcp')
  connectionMode: 'auto' | 'direct' | 'proxy'; // Connection strategy
  authType: 'none' | 'apiKey' | 'oauth';
  accessToken?: string;   // Token stored locally in browser
  refreshToken?: string;  // Refresh token for silent auth updates
  expiresAt?: number;     // Token expiration timestamp (epoch ms)
  isEnabled: boolean;
  status: IntegrationStatus; // Connection health tracker
  cachedTools: Array<{    // Populated during the Discovery lifecycle
    name: string;         // Original tool name (e.g., 'search')
    namespacedName: string; // Collision-free name (e.g., 'github_search')
    description: string;
    inputSchema: any;     // Cached arguments validator schema
  }>;
  lastToolSync: number;   // Epoch timestamp of last successful sync
  scope?: string;         // Custom authorization scopes
  createdAt: number;
}

export class ParadoxDatabase extends Dexie {
  chats!: Table<ChatSession>;
  messages!: Table<ChatMessage>;
  favicons!: Table<FaviconCache>;
  library!: Table<LibraryFile>;
  libraryPayloads!: Table<LibraryFilePayload>;
  mcpIntegrations!: Table<MCPIntegration>;

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
    this.version(6).stores({
      chats: 'id, title, createdAt, updatedAt, modelMode, branchedFromChatId',
      messages: '++id, chatId, role, createdAt',
      favicons: 'domain, createdAt',
      library: '++id, chatId, type, createdAt',
      libraryPayloads: 'fileId',
    }).upgrade(async tx => {
      // Initialize updatedAt value for existing chats to their createdAt value
      const chats = await tx.table('chats').toArray();
      for (const chat of chats) {
        if (!chat.updatedAt) {
          chat.updatedAt = chat.createdAt;
          await tx.table('chats').put(chat);
        }
      }
    });
    this.version(7).stores({
      chats: 'id, title, createdAt, updatedAt, modelMode, branchedFromChatId',
      messages: '++id, chatId, role, createdAt',
      favicons: 'domain, createdAt',
      library: '++id, chatId, type, createdAt',
      libraryPayloads: 'fileId',
      mcpIntegrations: 'id, name, url, isEnabled'
    });
  }
}

export const db = new ParadoxDatabase();
