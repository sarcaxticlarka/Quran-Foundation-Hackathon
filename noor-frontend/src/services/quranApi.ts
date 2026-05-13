import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL } from '../utils/constants';

const API_BASE = `${BACKEND_URL}/api/quran`;
const PUBLIC_QURAN_API_BASE = process.env.EXPO_PUBLIC_QURAN_CONTENT_FALLBACK_URL ?? 'https://api.quran.com/api/v4';

// Saheeh International — confirmed working ID from /resources/translations
const DEFAULT_TRANSLATION_ID = 20;

const quranClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'X-API-Key': BACKEND_API_KEY,
  },
});

const publicQuranClient = axios.create({
  baseURL: PUBLIC_QURAN_API_BASE,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

async function getQuranData<T>(path: string, config?: { params?: Record<string, unknown> }): Promise<T> {
  try {
    const { data } = await quranClient.get<T>(path, config);
    return data;
  } catch (error) {
    const { data } = await publicQuranClient.get<T>(path, config);
    return data;
  }
}

// Strip HTML tags and footnote markers from translation text
export function stripHtml(text: string): string {
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface Surah {
  id: number;
  revelation_place: 'makkah' | 'madinah';
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name: { language_name: string; name: string };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  text_uthmani: string;
  text_imlaei?: string;
  text_indopak?: string;
  words?: Word[];
  translations?: Translation[];
}

export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  line_number: number;
  page_number: number;
  code_v1: string;
  code_v2: string | null;
  text_uthmani: string;
  translation: { text: string; language_name: string };
  transliteration: { text: string; language_name: string };
}

export interface Translation {
  id: number;
  resource_id: number;
  text: string;
  verse_key?: string;
  language_name?: string;
  resource_name?: string;
}

// ─────────────────────────────────────────────
// API Calls
// ─────────────────────────────────────────────
export const quranApi = {
  async listSurahs(): Promise<Surah[]> {
    const data = await getQuranData<{ chapters: Surah[] }>('/chapters', {
      params: { language: 'en' },
    });
    return data.chapters;
  },

  async getSurah(id: number): Promise<Surah> {
    const data = await getQuranData<{ chapter: Surah }>(`/chapters/${id}`, {
      params: { language: 'en' },
    });
    return data.chapter;
  },

  async getVerses(
    surahId: number,
    options?: {
      translationId?: number;
      words?: boolean;
      page?: number;
      perPage?: number;
    },
  ): Promise<{ verses: Verse[]; pagination: { total_records: number; current_page: number; total_pages: number } }> {
    const data = await getQuranData<{ verses: Verse[]; pagination: { total_records: number; current_page: number; total_pages: number } }>(`/verses/by_chapter/${surahId}`, {
      params: {
        language: 'en',
        words: options?.words ?? false,
        fields: 'text_uthmani',
        translations: options?.translationId ?? DEFAULT_TRANSLATION_ID,
        per_page: options?.perPage ?? 50,
        page: options?.page ?? 1,
      },
    });
    return data;
  },

  async getVerse(verseKey: string, translationId = DEFAULT_TRANSLATION_ID): Promise<Verse> {
    const data = await getQuranData<{ verse: Verse }>(`/verses/by_key/${verseKey}`, {
      params: {
        language: 'en',
        words: false,
        fields: 'text_uthmani',
        translations: translationId,
      },
    });
    return data.verse;
  },

  async searchVerses(
    query: string,
    options?: { page?: number; size?: number },
  ): Promise<{ results: Array<{ verse_key: string; text: string; translations: Translation[] }>; total_results: number }> {
    const data = await getQuranData<{ search: { results: Array<{ verse_key: string; text: string; translations: Translation[] }>; total_results: number } }>('/search', {
      params: {
        q: query,
        language: 'en',
        size: options?.size ?? 20,
        page: options?.page ?? 0,
      },
    });
    return data.search;
  },

  async getVerseOfDay(): Promise<Verse> {
    const date = new Date();
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const surahId = (dayOfYear % 114) + 1;
    const { verses } = await quranApi.getVerses(surahId, { perPage: 1 });
    return verses[0];
  },
};

export default quranApi;
