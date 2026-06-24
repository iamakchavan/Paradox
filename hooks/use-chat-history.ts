import { db, type ChatSession, type ChatMessage } from '@/lib/db';

export const createChatSession = async (modelMode: string, title: string = 'New Chat'): Promise<string> => {
  const id = crypto.randomUUID();
  const session: ChatSession = {
    id,
    title,
    createdAt: Date.now(),
    modelMode,
  };
  await db.chats.add(session);
  return id;
};

export const deleteChatSession = async (chatId: string): Promise<void> => {
  await db.chats.delete(chatId);
  await db.messages.where('chatId').equals(chatId).delete();
  
  // Clean up library files and their payloads
  const files = await db.library.where('chatId').equals(chatId).toArray();
  for (const file of files) {
    if (file.id !== undefined) {
      await db.libraryPayloads.delete(file.id);
    }
  }
  await db.library.where('chatId').equals(chatId).delete();
};

export const renameChatSession = async (chatId: string, newTitle: string): Promise<void> => {
  await db.chats.update(chatId, { title: newTitle });
};

export const addMessageToSession = async (
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
  images?: string[],
  pdfs?: { name: string; data: string }[]
): Promise<number> => {
  const msg: ChatMessage = {
    chatId,
    role,
    content,
    images,
    pdfs,
    createdAt: Date.now(),
  };
  const messageId = await db.messages.add(msg);
  const numericId = messageId as number;

  // Simultaneously sync sent files to the library for index-lookup
  if (role === 'user') {
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const data = images[i];
        const mimeMatch = data.match(/^data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const ext = mimeType.split('/')[1] || 'png';
        const fileId = await db.library.add({
          chatId,
          messageId: numericId,
          name: `Image_${Date.now()}_${i}.${ext}`,
          type: 'image',
          mimeType,
          createdAt: Date.now(),
        });
        await db.libraryPayloads.add({
          fileId: fileId as number,
          data,
        });
      }
    }

    if (pdfs && pdfs.length > 0) {
      for (let i = 0; i < pdfs.length; i++) {
        const pdf = pdfs[i];
        const fileId = await db.library.add({
          chatId,
          messageId: numericId,
          name: pdf.name || `Document_${Date.now()}_${i}.pdf`,
          type: 'pdf',
          mimeType: 'application/pdf',
          createdAt: Date.now(),
        });
        await db.libraryPayloads.add({
          fileId: fileId as number,
          data: pdf.data,
        });
      }
    }
  }

  return numericId;
};

export const updateMessageContentById = async (messageId: number, content: string): Promise<void> => {
  await db.messages.update(messageId, { content });
};

export const updateLastMessageContent = async (chatId: string, content: string): Promise<void> => {
  // Find the last assistant message in this session and update its content
  const lastMsg = await db.messages
    .where('chatId')
    .equals(chatId)
    .and(msg => msg.role === 'assistant')
    .sortBy('createdAt')
    .then(messages => messages[messages.length - 1]);

  if (lastMsg && lastMsg.id !== undefined) {
    await db.messages.update(lastMsg.id, { content });
  }
};

/**
 * Branch off a new chat from an existing conversation at a specific message index.
 * Deep-copies messages from index 0 through branchAtIndex (inclusive) plus their
 * associated library files and payloads into a new independent ChatSession.
 *
 * @param sourceChatId  The ID of the parent chat to branch from.
 * @param branchAtIndex The inclusive index of the last message to copy (0-based).
 * @param modelMode     The model ID to assign to the branched session.
 * @returns The new chat's ID.
 */
export const branchOffChat = async (
  sourceChatId: string,
  branchAtIndex: number,
  modelMode: string
): Promise<string> => {
  const newChatId = crypto.randomUUID();

  // 1. Read source messages in chronological order
  const sourceMessages = await db.messages
    .where('chatId')
    .equals(sourceChatId)
    .sortBy('createdAt');

  // Clamp to valid bounds
  const lastIndex = Math.min(branchAtIndex, sourceMessages.length - 1);

  // 2. Create the branched session
  const sourceChat = await db.chats.get(sourceChatId);
  const session: ChatSession = {
    id: newChatId,
    title: sourceChat?.title ? `${sourceChat.title} (branch)` : 'Branch',
    createdAt: Date.now(),
    modelMode,
    branchedFromChatId: sourceChatId,
    branchedAtIndex: lastIndex,
  };
  await db.chats.add(session);

  // 3. Deep-copy messages 0..lastIndex with fresh timestamps to preserve ordering
  const baseTime = Date.now();
  const oldMessageIds: number[] = [];

  for (let i = 0; i <= lastIndex; i++) {
    const src = sourceMessages[i];
    oldMessageIds.push(src.id!);

    const newMsg: ChatMessage = {
      chatId: newChatId,
      role: src.role,
      content: src.content,
      images: src.images ? [...src.images] : undefined,
      pdfs: src.pdfs ? src.pdfs.map(p => ({ ...p })) : undefined,
      createdAt: baseTime + i, // incremental to preserve sort order
    };
    await db.messages.add(newMsg);
  }

  // 4. Copy associated library files and their payloads
  const sourceLibFiles = await db.library
    .where('chatId')
    .equals(sourceChatId)
    .toArray();

  const relevantFiles = sourceLibFiles.filter(
    f => f.messageId !== undefined && oldMessageIds.includes(f.messageId)
  );

  for (const file of relevantFiles) {
    const newFileId = await db.library.add({
      chatId: newChatId,
      messageId: file.messageId,
      name: file.name,
      type: file.type,
      mimeType: file.mimeType,
      createdAt: Date.now(),
    });

    // Copy the payload if it exists in the separate payloads table
    if (file.id !== undefined) {
      const payload = await db.libraryPayloads.get(file.id);
      if (payload) {
        await db.libraryPayloads.add({
          fileId: newFileId as number,
          data: payload.data,
        });
      }
    }
  }

  return newChatId;
};
