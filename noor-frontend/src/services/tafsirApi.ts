import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL } from '../utils/constants';

const API_BASE = `${BACKEND_URL}/api/quran`;

const quranClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'X-API-Key': BACKEND_API_KEY,
  },
});

const publicQuranClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_QURAN_CONTENT_FALLBACK_URL ?? 'https://api.quran.com/api/v4',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

async function getTafsirData<T>(path: string, config?: { params?: Record<string, unknown> }): Promise<T> {
  try {
    const { data } = await quranClient.get<T>(path, config);
    return data;
  } catch {
    const { data } = await publicQuranClient.get<T>(path, config);
    return data;
  }
}

export interface TafsirResource {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
  slug: string;
}

export interface TafsirText {
  id: number;
  resource_id: number;
  verse_key: string;
  text: string;
  resource_name: string;
  language_name: string;
}

export const tafsirApi = {
  async listTafsirs(language = 'en'): Promise<TafsirResource[]> {
    const data = await getTafsirData<{ tafsirs: TafsirResource[] }>('/resources/tafsirs', {
      params: { language },
    });
    return data.tafsirs;
  },

  async getTafsirForVerse(
    verseKey: string,
    tafsirId = 169, // Ibn Kathir English — confirmed working ID
  ): Promise<TafsirText> {
    const data = await getTafsirData<{ tafsir: TafsirText }>(`/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
    return data.tafsir;
  },

  async getTafsirForChapter(
    chapterId: number,
    tafsirId = 169,
  ): Promise<TafsirText[]> {
    const data = await getTafsirData<{ tafsirs: TafsirText[] }>(`/tafsirs/${tafsirId}/by_chapter/${chapterId}`);
    return data.tafsirs;
  },
};

export default tafsirApi;
