import { get, post, put, del } from './api';

export interface WordEntry {
  root: string;
  arabicWord: string;
  transliteration: string;
  meaning: string;
  forms: string[];
  occurrences: number;
  verseKeys: string[];
}

export interface Concept {
  id: string;
  title: string;
  arabicTerm: string;
  description: string;
  relatedConcepts: string[];
  verseKeys: string[];
  category: string;
}

export const collectionsApi = {
  async getWordRoots(): Promise<WordEntry[]> {
    return get<WordEntry[]>('/collections/words');
  },

  async getWordByKey(key: string): Promise<WordEntry> {
    return get<WordEntry>(`/collections/words/${key}`);
  },

  async getConcepts(): Promise<Concept[]> {
    return get<Concept[]>('/collections/concepts');
  },

  async getConcept(id: string): Promise<Concept> {
    return get<Concept>(`/collections/concepts/${id}`);
  },

  async saveWord(wordKey: string): Promise<void> {
    return post<void>('/collections/saved-words', { wordKey });
  },

  async getSavedWords(): Promise<WordEntry[]> {
    return get<WordEntry[]>('/collections/saved-words');
  },
};
