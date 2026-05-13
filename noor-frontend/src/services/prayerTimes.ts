import axios from 'axios';

const ALADHAN_BASE = 'https://api.aladhan.com/v1';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerTimesData {
  times: PrayerTimes;
  city: string;
  country: string;
  date: string;
  hijriDate: string;
  hijriMonth: string;
  hijriYear: string;
}

export interface CurrentPrayerInfo {
  current: keyof PrayerTimes;
  next: keyof PrayerTimes;
  nextTime: string;
  minutesUntilNext: number;
  timeLabel: string;
}

const PRAYER_ORDER: (keyof PrayerTimes)[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Madhab → Aladhan school number (for Asr calculation)
const MADHAB_SCHOOL: Record<string, number> = {
  Hanafi: 1,
  Shafi: 0,
  Maliki: 0,
  Hanbali: 0,
};

function parseTime(timeStr: string): number {
  // "05:23" or "05:23 (PKT)" → minutes since midnight
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + m;
}

function formatTime12(timeStr: string): string {
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  madhab?: string,
  cityHint?: string,
): Promise<PrayerTimesData> {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  const school = madhab ? (MADHAB_SCHOOL[madhab] ?? 0) : 0;

  const { data } = await axios.get(`${ALADHAN_BASE}/timings/${dateStr}`, {
    params: { latitude, longitude, method: 2, school },
    timeout: 10000,
  });

  const timings = data.data.timings as PrayerTimes;
  const meta = data.data.meta;
  const hijri = data.data.date.hijri;

  // Derive city: prefer IP hint → timezone city → fallback
  const tzCity = meta.timezone?.split('/')?.slice(-1)[0]?.replace(/_/g, ' ') ?? '';
  const city = cityHint || tzCity || 'Your Location';

  return {
    times: {
      Fajr:    timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr:   timings.Dhuhr,
      Asr:     timings.Asr,
      Maghrib: timings.Maghrib,
      Isha:    timings.Isha,
    },
    city,
    country:    meta.timezone?.split('/')[0] ?? '',
    date:       today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    hijriDate:  `${hijri.day} ${hijri.month.en} ${hijri.year} AH`,
    hijriMonth: hijri.month.en,
    hijriYear:  hijri.year,
  };
}

export function getCurrentPrayerInfo(times: PrayerTimes): CurrentPrayerInfo {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let currentPrayer: keyof PrayerTimes = 'Isha';
  let nextPrayer: keyof PrayerTimes = 'Fajr';

  for (let i = 0; i < PRAYER_ORDER.length; i++) {
    const prayer = PRAYER_ORDER[i];
    const prayerMin = parseTime(times[prayer]);

    if (nowMinutes < prayerMin) {
      nextPrayer = prayer;
      currentPrayer = i === 0 ? 'Isha' : PRAYER_ORDER[i - 1];
      break;
    }
    if (i === PRAYER_ORDER.length - 1) {
      currentPrayer = 'Isha';
      nextPrayer = 'Fajr';
    }
  }

  const nextMinutes = parseTime(times[nextPrayer]);
  const minutesUntilNext = nextMinutes > nowMinutes
    ? nextMinutes - nowMinutes
    : 1440 - nowMinutes + nextMinutes; // wraps past midnight

  const LABELS: Record<keyof PrayerTimes, string> = {
    Fajr:    'Fajr — the dawn prayer approaches',
    Sunrise: 'After sunrise — a blessed morning',
    Dhuhr:   'Dhuhr — midday remembrance',
    Asr:     'Asr — the afternoon prayer',
    Maghrib: 'Maghrib — the day is closing',
    Isha:    'Isha — end your day with Allah',
  };

  return {
    current:          currentPrayer,
    next:             nextPrayer,
    nextTime:         formatTime12(times[nextPrayer]),
    minutesUntilNext,
    timeLabel:        LABELS[currentPrayer],
  };
}

export function formatPrayerTime(timeStr: string): string {
  return formatTime12(timeStr);
}
