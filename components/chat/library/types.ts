export type LibraryFilter = 'all' | 'image' | 'pdf';

export interface LibraryPageContentProps {
  onSelectChat: (chatId: string) => void;
}

export interface LibraryDeleteTarget {
  id: number;
  name: string;
}
