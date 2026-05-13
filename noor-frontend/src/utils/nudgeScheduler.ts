/**
 * Nudge Scheduler - Time-sensitive spiritual reminders
 * Aligned with Islamic prayer times and circadian patterns
 */

export type NudgeSlot =
  | 'fajr'       // Pre-dawn
  | 'morning'    // Post-Fajr
  | 'duha'       // Mid-morning
  | 'dhuhr'      // Midday
  | 'asr'        // Afternoon
  | 'maghrib'    // Sunset
  | 'isha'       // Night
  | 'tahajjud';  // Late night

export interface NudgeConfig {
  slot: NudgeSlot;
  title: string;
  body: string;
  type: 'review' | 'recite' | 'dhikr' | 'reflect' | 'halaqa';
}

const SLOT_MESSAGES: Record<NudgeSlot, NudgeConfig[]> = {
  fajr: [
    {
      slot: 'fajr',
      title: 'Start with the Name of Allah',
      body: 'A few minutes of recitation at Fajr illuminates the entire day.',
      type: 'recite',
    },
  ],
  morning: [
    {
      slot: 'morning',
      title: 'Morning Adhkar',
      body: 'Your morning dhikr streak continues. Tap to begin.',
      type: 'dhikr',
    },
  ],
  duha: [
    {
      slot: 'duha',
      title: 'Review Queue Ready',
      body: `You have cards due. The best time to review is now.`,
      type: 'review',
    },
  ],
  dhuhr: [
    {
      slot: 'dhuhr',
      title: 'Midday Reflection',
      body: 'Pause and reconnect. A verse awaits you.',
      type: 'reflect',
    },
  ],
  asr: [
    {
      slot: 'asr',
      title: 'Afternoon Check-in',
      body: 'How is your soul today? Your Halaqa is active.',
      type: 'halaqa',
    },
  ],
  maghrib: [
    {
      slot: 'maghrib',
      title: 'Evening Recitation',
      body: 'The best recitation is heard in the stillness of evening.',
      type: 'recite',
    },
  ],
  isha: [
    {
      slot: 'isha',
      title: 'Night Review',
      body: 'Complete your daily review before sleep for best retention.',
      type: 'review',
    },
  ],
  tahajjud: [
    {
      slot: 'tahajjud',
      title: 'The Night is Yours',
      body: 'Allah descends to the lower heaven. Speak to Him.',
      type: 'dhikr',
    },
  ],
};

export function getSlotForHour(hour: number): NudgeSlot {
  if (hour >= 4 && hour < 6) return 'fajr';
  if (hour >= 6 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 11) return 'duha';
  if (hour >= 11 && hour < 14) return 'dhuhr';
  if (hour >= 14 && hour < 17) return 'asr';
  if (hour >= 17 && hour < 20) return 'maghrib';
  if (hour >= 20 && hour < 23) return 'isha';
  return 'tahajjud';
}

export function getNudgeForNow(): NudgeConfig {
  const hour = new Date().getHours();
  const slot = getSlotForHour(hour);
  const messages = SLOT_MESSAGES[slot];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getScheduledNudgeTimes(): Array<{ slot: NudgeSlot; hour: number; minute: number }> {
  return [
    { slot: 'fajr', hour: 5, minute: 0 },
    { slot: 'morning', hour: 6, minute: 30 },
    { slot: 'duha', hour: 9, minute: 0 },
    { slot: 'dhuhr', hour: 12, minute: 30 },
    { slot: 'asr', hour: 15, minute: 30 },
    { slot: 'maghrib', hour: 18, minute: 30 },
    { slot: 'isha', hour: 21, minute: 0 },
  ];
}
