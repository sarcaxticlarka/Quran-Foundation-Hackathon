import { get, post, del } from './api';

export interface Bookmark {
  id: string;
  verseKey: string;
  surahName: string;
  arabicText: string;
  translation: string;
  note?: string;
  collectionIds: string[];
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  color: string;
  count: number;
  createdAt: string;
}

export const bookmarksApi = {
  async getBookmarks(): Promise<Bookmark[]> {
    return get<Bookmark[]>('/bookmarks');
  },

  async addBookmark(verseKey: string, note?: string): Promise<Bookmark> {
    return post<Bookmark>('/bookmarks', { verseKey, note });
  },

  async removeBookmark(id: string): Promise<void> {
    return del<void>(`/bookmarks/${id}`);
  },

  async getCollections(): Promise<Collection[]> {
    return get<Collection[]>('/collections');
  },

  async createCollection(name: string, color: string): Promise<Collection> {
    return post<Collection>('/collections', { name, color });
  },

  async addToCollection(bookmarkId: string, collectionId: string): Promise<void> {
    return post<void>(`/collections/${collectionId}/bookmarks`, { bookmarkId });
  },
};
