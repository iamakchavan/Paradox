import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LibraryFile } from '@/lib/db';

export function useLibrary(searchQuery: string = '', typeFilter: 'all' | 'image' | 'pdf' = 'all') {
  return useLiveQuery(
    async () => {
      let files: LibraryFile[];

      if (typeFilter !== 'all') {
        files = await db.library
          .where('type')
          .equals(typeFilter)
          .reverse()
          .limit(100)
          .toArray();
      } else {
        files = await db.library
          .orderBy('createdAt')
          .reverse()
          .limit(100)
          .toArray();
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        files = files.filter(f => f.name.toLowerCase().includes(query));
      }

      return files;
    },
    [searchQuery, typeFilter]
  );
}

export const deleteLibraryFile = async (id: number): Promise<void> => {
  await db.library.delete(id);
  await db.libraryPayloads.delete(id);
};
