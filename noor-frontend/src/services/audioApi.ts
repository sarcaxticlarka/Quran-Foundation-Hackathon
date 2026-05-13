import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL } from '../utils/constants';

const quranClient = axios.create({
  baseURL: `${BACKEND_URL}/api/quran`,
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

async function getAudioData<T>(path: string, config?: { params?: Record<string, unknown> }): Promise<T> {
  try {
    const { data } = await quranClient.get<T>(path, config);
    return data;
  } catch {
    const { data } = await publicQuranClient.get<T>(path, config);
    return data;
  }
}

export interface Reciter {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name: { name: string; language_name: string };
}

export interface AudioFile {
  id: number;
  chapter_id: number;
  file_size: number;
  format: string;
  audio_url: string;
  duration: number;
}

export interface VerseAudio {
  url: string;
  verse_key: string;
  duration: number;
  segments: number[][];
}

const CDN_BASE = 'https://verses.quran.com';

// CDN folder name per reciter ID — verified against Quran.com API responses
const RECITER_CDN_PATH: Record<number, string> = {
  7: 'Alafasy/mp3',
  1: 'AbdulSamad_128kbps_WithTashkeel',
  4: 'Ghamdi_ver3',
  5: 'Husary_128kbps',
  9: 'AbuBakr_128kbps',
};

export const audioApi = {
  async listReciters(): Promise<Reciter[]> {
    const data = await getAudioData<{ recitations: Reciter[] }>('/resources/recitations', {
      params: { language: 'en' },
    });
    return data.recitations;
  },

  async getChapterAudio(
    chapterId: number,
    reciterId = 7,
  ): Promise<AudioFile> {
    const data = await getAudioData<{ audio_file: AudioFile }>(
      `/chapter_recitations/${reciterId}/${chapterId}`,
    );
    return data.audio_file;
  },

  async getVerseAudios(
    chapterId: number,
    reciterId = 7,
  ): Promise<VerseAudio[]> {
    const data = await getAudioData<{ audio_files: VerseAudio[] }>(
      `/recitations/${reciterId}/by_chapter/${chapterId}`,
    );
    // API sometimes returns relative URLs — ensure they are absolute
    return (data.audio_files as VerseAudio[]).map((f) => ({
      ...f,
      url: f.url.startsWith('http') ? f.url : `${CDN_BASE}/${f.url}`,
    }));
  },

  // Builds a deterministic CDN URL without needing an API call.
  // This is used as the primary source for per-verse playback.
  buildVerseAudioUrl(verseKey: string, reciterId = 7): string {
    const [surah, ayah] = verseKey.split(':');
    const file = `${surah.padStart(3, '0')}${ayah.padStart(3, '0')}.mp3`;
    const folder = RECITER_CDN_PATH[reciterId] ?? RECITER_CDN_PATH[7];
    return `${CDN_BASE}/${folder}/${file}`;
  },
};

export default audioApi;
