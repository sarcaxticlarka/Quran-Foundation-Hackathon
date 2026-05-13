/**
 * Quran AI Service — powers in-app AI features using Groq + Quran.com API.
 *
 * NOTE: The Quran MCP server (https://mcp.quran.com) is a Model Context Protocol
 * server designed for AI *clients* like Claude Code — see /.mcp.json for that config.
 * React Native apps can't speak the MCP protocol directly, so this service
 * replicates the same capabilities via Groq + the authenticated Quran REST API.
 */

import axios from 'axios';
import { quranApi, stripHtml } from './quranApi';
import { BACKEND_URL, BACKEND_API_KEY } from '../utils/constants';

const MODEL = 'llama-3.3-70b-versatile';

const groq = axios.create({
  baseURL: `${BACKEND_URL}/api/ai`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': BACKEND_API_KEY,
  },
});

async function chat(system: string, user: string, maxTokens = 500): Promise<string> {
  const { data } = await groq.post('/chat/completions', {
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.6,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ],
  });
  return data.choices[0].message.content.trim();
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
  } catch {}
  return fallback;
}

// ─── Public types (kept for backward compat with crisisStore) ─────────────────

export interface MCPVerseResult {
  verseKey: string;
  arabicText: string;
  translation: string;
  relevanceScore: number;
  reasoning: string;
  tafsirSnippet?: string;
}

export interface MCPCrisisResponse {
  selectedVerses: MCPVerseResult[];
  reflectionPrompt: string;
  dhikrSuggestion: string;
  breathingExercise: string;
}

export interface MCPConceptLink {
  fromConcept: string;
  toConcept: string;
  relationship: string;
  strength: number;
}

// ─── Crisis mode ──────────────────────────────────────────────────────────────

export interface CrisisSequence {
  verse: { key: string; arabic: string; translation: string; surahName: string };
  analysis?: string;
  tafsir: string;
  hadith: string;
  dhikr: string;
}

// Only used when Groq fails completely
const FALLBACK_VERSE_KEYS: Record<string, string> = {
  overwhelmed: '2:286', anxious: '13:28', sad: '94:5',
  lonely: '9:40', grateful: '14:7', lost: '93:7',
  angry: '3:134', hopeful: '39:53', default: '2:286',
};

const CONCEPT_VERSE_KEYS: Record<string, string[]> = {
  mercy: ['39:53', '7:156', '21:107'],
  rahmah: ['39:53', '7:156', '21:107'],
  justice: ['16:90', '4:135', '5:8'],
  patience: ['2:153', '39:10', '94:5'],
  sabr: ['2:153', '39:10', '94:5'],
  knowledge: ['96:1', '20:114', '58:11'],
  ilm: ['96:1', '20:114', '58:11'],
  gratitude: ['14:7', '2:152', '31:12'],
  shukr: ['14:7', '2:152', '31:12'],
  trust: ['65:3', '3:159', '9:51'],
  tawakkul: ['65:3', '3:159', '9:51'],
  taqwa: ['2:2', '49:13', '65:2'],
  iman: ['8:2', '2:285', '49:15'],
};

function fallbackKeysForQuery(query: string, limit: number) {
  const normalized = query.toLowerCase().trim();
  const direct = CONCEPT_VERSE_KEYS[normalized];
  if (direct) return direct.slice(0, limit);

  const matched = Object.entries(CONCEPT_VERSE_KEYS).find(([key]) => normalized.includes(key));
  return (matched?.[1] ?? ['2:286', '13:28', '16:90']).slice(0, limit);
}

async function buildFallbackVerseResults(query: string, limit: number): Promise<MCPVerseResult[]> {
  const keys = fallbackKeysForQuery(query, limit);
  const results = await Promise.all(
    keys.map(async (verseKey) => {
      const verse = await quranApi.getVerse(verseKey);
      return {
        verseKey,
        arabicText: verse.text_uthmani,
        translation: stripHtml(verse.translations?.[0]?.text ?? ''),
        relevanceScore: 0.8,
        reasoning: `This verse is commonly connected to ${query}.`,
      };
    }),
  );
  return results.filter((r) => r.arabicText && r.translation);
}

export const mcpService = {
  /**
   * Full AI-driven crisis support sequence.
   *
   * 1. Groq reads the user's actual words, analyzes the emotional state, and
   *    selects the most relevant verse from anywhere in the Quran.
   * 2. The real Arabic text + translation is fetched from the Quran.com API.
   * 3. Returns verse + AI analysis note + tafsir + hadith + dhikr.
   */
  async getCrisisSequence(mood: string, context?: string): Promise<CrisisSequence> {
    const userInput = [mood, context].filter(Boolean).join(' — ');

    const analysisSystem = `You are an Islamic scholar and compassionate spiritual counselor with knowledge of the entire Quran.
A Muslim has come to you for guidance. Read their words carefully, understand their true emotional state and situation, then:
1. Select the single most relevant Quran verse from anywhere in the 114 surahs.
2. Write a 1-sentence personal note explaining why THIS verse speaks to THEIR exact situation.
3. Write 2-3 sentences of scholarly tafsir connecting the verse to their specific words (cite Ibn Kathir, Al-Tabari, or Al-Qurtubi).
4. Give an authentic hadith that directly relates to their situation.
5. Recommend a specific dhikr with count and brief explanation of why it helps this state.

Respond ONLY with valid JSON:
{
  "verse_key": "surah:ayah",
  "analysis": "1 sentence — why this verse speaks to exactly what they shared",
  "tafsir": "2-3 sentences of scholarly tafsir personalized to their situation",
  "hadith": "Full hadith quote with narrator and source",
  "dhikr": "Specific dhikr with count and brief reason"
}

Think broadly — the whole Quran is available:
grief → 2:155-157, loneliness → 58:7, failure/shame → 39:53, anxiety about future → 65:3, anger → 3:134, gratitude → 14:7, seeking guidance → 1:5-6, family stress → 17:23, financial worry → 65:3, heartbreak → 2:286, spiritual dryness → 39:53, guilt → 39:53, feeling unseen → 58:7, exam stress → 94:5-6, hopelessness → 12:87, trust issues → 3:160.
Choose the verse that fits THEIR words — not a generic default.`;

    const raw = await chat(analysisSystem, `User shared: "${userInput}"`, 600);

    const parsed = parseJSON<{
      verse_key: string;
      analysis: string;
      tafsir: string;
      hadith: string;
      dhikr: string;
    }>(raw, {
      verse_key: FALLBACK_VERSE_KEYS[mood.toLowerCase()] ?? FALLBACK_VERSE_KEYS.default,
      analysis: 'This verse was chosen to bring you comfort and clarity.',
      tafsir: 'This verse carries immense mercy and comfort for the believer in times of need.',
      hadith: 'The Prophet ﷺ said: "The greatest reward comes with the greatest trial. When Allah loves a people He tests them." — Tirmidhi 2396',
      dhikr: 'SubhanAllah × 33, Alhamdulillah × 33, Allahu Akbar × 33',
    });

    // Validate verse key format
    const verseKey = /^\d{1,3}:\d{1,3}$/.test(parsed.verse_key)
      ? parsed.verse_key
      : (FALLBACK_VERSE_KEYS[mood.toLowerCase()] ?? FALLBACK_VERSE_KEYS.default);

    // Fetch real Arabic + translation from Quran.com API
    let verseData: { arabic: string; translation: string; surahName: string };
    try {
      const verse = await quranApi.getVerse(verseKey);
      const translation = stripHtml(verse.translations?.[0]?.text ?? '');
      const [surahId] = verseKey.split(':');
      verseData = { arabic: verse.text_uthmani, translation, surahName: `Surah ${surahId} · ${verseKey}` };
    } catch {
      verseData = {
        arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
        translation: 'Allah does not burden a soul beyond that it can bear.',
        surahName: 'Surah Al-Baqarah · 2:286',
      };
    }

    return {
      verse: { key: verseKey, ...verseData },
      analysis: parsed.analysis,
      tafsir: parsed.tafsir,
      hadith: parsed.hadith,
      dhikr: parsed.dhikr,
    };
  },

  /**
   * Semantic verse search — finds thematically relevant verses for a query.
   *
   * Groq provides Arabic + translation directly so results are never empty
   * even when the Quran API is unavailable. The API is then used in parallel
   * to enrich with authenticated text where possible.
   */
  async semanticSearch(query: string, limit = 3): Promise<MCPVerseResult[]> {
    const system = `You are a Quran scholar with full memorisation of the Quran.
Find the ${limit} verses most relevant to the given concept.
You MUST include the Arabic text and English translation for each verse.
Respond ONLY with a JSON array (no markdown, no extra text):
[
  {
    "verseKey": "16:90",
    "arabicText": "full Arabic text of this verse",
    "translation": "English translation of this verse",
    "reasoning": "one sentence explaining why this verse relates to the query"
  }
]`;

    let raw = '';
    try {
      raw = await chat(
        system,
        `Find ${limit} Quran verses about: "${query}"`,
        700,
      );
    } catch (err) {
      console.warn('Groq semanticSearch failed, using Quran fallback:', err);
      return buildFallbackVerseResults(query, limit);
    }

    const suggestions = parseJSON<Array<{
      verseKey: string;
      arabicText: string;
      translation: string;
      reasoning: string;
    }>>(raw, []);

    if (suggestions.length === 0) return buildFallbackVerseResults(query, limit);

    // Enrich with real Quran API text in parallel — fall back to Groq text on failure
    const results = await Promise.all(
      suggestions.slice(0, limit).map(async (s) => {
        // Validate key format first
        if (!/^\d{1,3}:\d{1,3}$/.test(s.verseKey)) {
          return {
            verseKey: s.verseKey,
            arabicText: s.arabicText,
            translation: s.translation,
            relevanceScore: 0.85,
            reasoning: s.reasoning,
          };
        }
        try {
          const verse = await quranApi.getVerse(s.verseKey);
          return {
            verseKey: s.verseKey,
            arabicText: verse.text_uthmani || s.arabicText,
            translation: stripHtml(verse.translations?.[0]?.text ?? '') || s.translation,
            relevanceScore: 0.95,
            reasoning: s.reasoning,
          };
        } catch {
          // API unavailable — Groq text is accurate enough to display
          return {
            verseKey: s.verseKey,
            arabicText: s.arabicText,
            translation: s.translation,
            relevanceScore: 0.85,
            reasoning: s.reasoning,
          };
        }
      }),
    );

    const filtered = results.filter((r) => r.arabicText && r.translation);
    return filtered.length > 0 ? filtered : buildFallbackVerseResults(query, limit);
  },

  /**
   * Generate a personalized reflection prompt for a verse.
   */
  async generateReflectionPrompt(verseKey: string, userContext?: string): Promise<string> {
    const system = `You are an Islamic spiritual guide. Generate a single open-ended
reflection question for a Muslim to journal about, based on the verse provided.
Keep it under 40 words. Be warm and introspective.`;

    const user = `Verse ${verseKey}${userContext ? `. Context: ${userContext}` : ''}`;
    return chat(system, user, 80);
  },

  /**
   * Concept relationship links for the Knowledge Graph.
   */
  async getConceptLinks(conceptId: string): Promise<MCPConceptLink[]> {
    const system = `You are a Quran scholar. Return 5 related Quranic concepts for "${conceptId}".
Respond ONLY with JSON: [{"fromConcept": "taqwa", "toConcept": "sabr", "relationship": "leads to", "strength": 0.8}]`;

    const raw = await chat(system, `Concept: ${conceptId}`, 300);
    return parseJSON<MCPConceptLink[]>(raw, []);
  },
};

export default mcpService;
