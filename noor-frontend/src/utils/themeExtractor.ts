/**
 * Identity Theme Extractor
 * Clusters journal/reflection entries into spiritual identity themes
 * using keyword frequency and semantic proximity
 */

export type IdentityTheme =
  | 'seeker'     // Ilm, knowledge, understanding
  | 'devotee'    // Ibadah, salah, worship
  | 'grateful'   // Shukr, blessings, gratitude
  | 'patient'    // Sabr, trials, endurance
  | 'merciful'   // Compassion, community, helping
  | 'trustful'   // Tawakkul, reliance on Allah
  | 'repentant'  // Tawbah, returning, growth
  | 'mindful';   // Presence, dhikr, awareness

interface ThemeKeywords {
  [theme: string]: string[];
}

const THEME_KEYWORDS: ThemeKeywords = {
  seeker: ['learn', 'understand', 'knowledge', 'ilm', 'question', 'wisdom', 'think', 'reflect'],
  devotee: ['pray', 'salah', 'worship', 'ibadah', 'fast', 'quran', 'recite', 'tahajjud'],
  grateful: ['thankful', 'grateful', 'alhamdulillah', 'blessing', 'gift', 'favor', 'mercy'],
  patient: ['patient', 'sabr', 'trial', 'difficult', 'hard', 'endure', 'struggle', 'test'],
  merciful: ['help', 'give', 'care', 'family', 'community', 'kind', 'serve', 'share'],
  trustful: ['trust', 'tawakkul', 'rely', 'surrender', 'allah', 'plan', 'destiny', 'qadr'],
  repentant: ['forgive', 'mistake', 'return', 'tawbah', 'sorry', 'regret', 'improve', 'change'],
  mindful: ['present', 'dhikr', 'remember', 'aware', 'breath', 'moment', 'peace', 'calm'],
};

export interface ThemeScore {
  theme: IdentityTheme;
  score: number;
  label: string;
  arabicLabel: string;
  color: string;
}

const THEME_META: Record<IdentityTheme, { label: string; arabicLabel: string; color: string }> = {
  seeker: { label: 'The Seeker', arabicLabel: 'الطالب', color: '#185FA5' },
  devotee: { label: 'The Devotee', arabicLabel: 'العابد', color: '#C9A84C' },
  grateful: { label: 'The Grateful', arabicLabel: 'الشاكر', color: '#F0D98A' },
  patient: { label: 'The Patient', arabicLabel: 'الصابر', color: '#8A7D6E' },
  merciful: { label: 'The Merciful', arabicLabel: 'الرحيم', color: '#1D9E75' },
  trustful: { label: 'The Trustful', arabicLabel: 'المتوكل', color: '#534AB7' },
  repentant: { label: 'The Repentant', arabicLabel: 'التائب', color: '#D85A30' },
  mindful: { label: 'The Mindful', arabicLabel: 'الذاكر', color: '#2DC490' },
};

export function extractThemes(texts: string[]): ThemeScore[] {
  const combined = texts.join(' ').toLowerCase();
  const words = combined.split(/\W+/).filter(Boolean);

  const scores: Record<string, number> = {};

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = combined.match(regex);
      if (matches) score += matches.length;
    }
    scores[theme] = score;
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

  return Object.entries(scores)
    .map(([theme, score]) => ({
      theme: theme as IdentityTheme,
      score: Math.round((score / total) * 100),
      ...THEME_META[theme as IdentityTheme],
    }))
    .sort((a, b) => b.score - a.score);
}

export function getPrimaryIdentity(texts: string[]): ThemeScore | null {
  const themes = extractThemes(texts);
  return themes[0]?.score > 0 ? themes[0] : null;
}

export function getTopThemes(texts: string[], limit = 3): ThemeScore[] {
  return extractThemes(texts).slice(0, limit).filter((t) => t.score > 0);
}
