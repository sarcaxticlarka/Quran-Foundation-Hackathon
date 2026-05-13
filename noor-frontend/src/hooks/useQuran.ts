import { useQuery } from '@tanstack/react-query';
import { quranApi, Verse, Surah, stripHtml } from '../services/quranApi';
import { tafsirApi } from '../services/tafsirApi';
import { useAuthStore } from '../stores/authStore';

// Default translation — Saheeh International on quran.com v4 (resource ID 20)
const DEFAULT_TRANSLATION = 20;

// ─── Surahs ──────────────────────────────────────────────────────────────────

export function useSurahs() {
  return useQuery<Surah[]>({
    queryKey: ['surahs'],
    queryFn: () => quranApi.listSurahs(),
    staleTime: Infinity,
  });
}

export function useSurah(id: number) {
  return useQuery<Surah>({
    queryKey: ['surah', id],
    queryFn: () => quranApi.getSurah(id),
    staleTime: Infinity,
    enabled: id > 0,
  });
}

// ─── Verses ──────────────────────────────────────────────────────────────────

export function useVerses(surahId: number, page = 1) {
  const translationId = useAuthStore((s) => s.user?.translationId ?? DEFAULT_TRANSLATION);
  return useQuery({
    queryKey: ['verses', surahId, page, translationId],
    queryFn: () => quranApi.getVerses(surahId, { page, perPage: 50, translationId }),
    staleTime: Infinity,
    enabled: surahId > 0,
  });
}

export function useVerse(verseKey: string) {
  const translationId = useAuthStore((s) => s.user?.translationId ?? DEFAULT_TRANSLATION);
  return useQuery<Verse>({
    queryKey: ['verse', verseKey, translationId],
    queryFn: () => quranApi.getVerse(verseKey, translationId),
    staleTime: Infinity,
    enabled: !!verseKey,
  });
}

// ─── Verse of the Day ────────────────────────────────────────────────────────
// Verse counts per surah (1–114) — verified total = 6,236
const SURAH_VERSE_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,  // 1–10
  123,111,43,52,99,128,111,110,98,135,   // 11–20
  112,78,118,64,77,227,93,88,69,60,      // 21–30
  34,30,73,54,45,83,182,88,75,85,        // 31–40
  54,53,89,59,37,35,38,29,18,45,         // 41–50
  60,49,62,55,78,96,29,22,24,13,         // 51–60
  14,11,11,18,12,12,30,52,52,44,         // 61–70
  28,28,20,56,40,31,50,40,46,42,         // 71–80
  29,19,36,25,22,17,19,26,30,20,         // 81–90
  15,21,11,8,8,19,5,8,8,11,             // 91–100
  11,8,3,9,5,4,7,3,6,3,                 // 101–110
  5,4,5,6,                               // 111–114
];

function verseKeyForIndex(idx: number): string {
  let remaining = idx;
  for (let s = 0; s < SURAH_VERSE_COUNTS.length; s++) {
    const count = SURAH_VERSE_COUNTS[s];
    if (remaining < count) {
      return `${s + 1}:${remaining + 1}`;
    }
    remaining -= count;
  }
  return '1:1';
}

export function getDailyVerseKey(): string {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  const totalVerses = 6236;
  const idx = daysSinceEpoch % totalVerses;
  return verseKeyForIndex(idx);
}

export function useVerseOfDay() {
  const verseKey = getDailyVerseKey();
  const translationId = useAuthStore((s) => s.user?.translationId ?? DEFAULT_TRANSLATION);

  return useQuery<Verse>({
    queryKey: ['verseOfDay', verseKey, translationId],
    queryFn: () => quranApi.getVerse(verseKey, translationId),
    staleTime: 1000 * 60 * 60 * 12,
  });
}

// ─── Search ──────────────────────────────────────────────────────────────────

export function useVerseSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => quranApi.searchVerses(query, { size: 20 }),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Tafsir ──────────────────────────────────────────────────────────────────

export function useTafsir(verseKey: string, tafsirId = 169) {
  return useQuery({
    queryKey: ['tafsir', verseKey, tafsirId],
    queryFn: () => tafsirApi.getTafsirForVerse(verseKey, tafsirId),
    staleTime: Infinity,
    enabled: !!verseKey,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getFirstTranslation(verse: Verse): string {
  const raw = verse.translations?.[0]?.text ?? '';
  return stripHtml(raw);
}

export function getSurahDisplayName(surah: Surah): string {
  return `${surah.name_simple} • ${surah.id}:${surah.verses_count}`;
}
