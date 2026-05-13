import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { PrayerTimes } from './prayerTimes';

// expo-notifications remote push was removed from Expo Go in SDK 53.
// Never require the module when running inside Expo Go — it logs a console.error
// at load time that can't be silenced with try/catch.
// In a real dev build or production app, executionEnvironment is not 'storeClient'.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

type NotificationsModule = typeof import('expo-notifications');
let N: NotificationsModule | null = null;

if (!isExpoGo) {
  try {
    N = require('expo-notifications') as NotificationsModule;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert:  true,
        shouldPlaySound:  false,
        shouldSetBadge:   false,
        shouldShowBanner: true,
        shouldShowList:   true,
      }),
    });
  } catch {
    N = null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!N) return false;

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('default', {
      name: 'Noor',
      importance: N.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

const PRAYER_IDENTIFIERS = [
  'noor-prayer-fajr',
  'noor-prayer-dhuhr',
  'noor-prayer-asr',
  'noor-prayer-maghrib',
  'noor-prayer-isha',
];

const PRAYER_MESSAGES: Record<string, { title: string; body: string }> = {
  Fajr:    { title: 'Fajr is here',            body: 'Begin your day with the remembrance of Allah.' },
  Dhuhr:   { title: 'Dhuhr time',              body: 'Pause and renew your connection with the divine.' },
  Asr:     { title: "It's time for Asr",       body: 'The afternoon prayer is upon you.' },
  Maghrib: { title: 'Maghrib — sunset prayer',  body: 'The day closes. Turn to Allah in gratitude.' },
  Isha:    { title: "Isha — night's prayer",    body: 'End your day in peace and remembrance.' },
};

function parseHM(timeStr: string): { hour: number; minute: number } {
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  return { hour: h, minute: m };
}

export async function schedulePrayerReminders(times: PrayerTimes): Promise<void> {
  if (!N) return;
  await cancelPrayerReminders();

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const prayers: Array<{ key: keyof PrayerTimes; id: string }> = [
    { key: 'Fajr',    id: 'noor-prayer-fajr'   },
    { key: 'Dhuhr',   id: 'noor-prayer-dhuhr'  },
    { key: 'Asr',     id: 'noor-prayer-asr'    },
    { key: 'Maghrib', id: 'noor-prayer-maghrib' },
    { key: 'Isha',    id: 'noor-prayer-isha'   },
  ];

  for (const { key, id } of prayers) {
    const { hour, minute } = parseHM(times[key]);
    const msg = PRAYER_MESSAGES[key];
    await N.scheduleNotificationAsync({
      identifier: id,
      content: { title: msg.title, body: msg.body, sound: false },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function cancelPrayerReminders(): Promise<void> {
  if (!N) return;
  await Promise.all(
    PRAYER_IDENTIFIERS.map((id) =>
      N!.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  );
}

export async function scheduleReviewReminder(hour = 20, minute = 0): Promise<void> {
  if (!N) return;
  await N.cancelScheduledNotificationAsync('noor-review-daily').catch(() => {});

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await N.scheduleNotificationAsync({
    identifier: 'noor-review-daily',
    content: {
      title: 'Review time',
      body: 'Your flashcard queue is waiting. A few minutes of review keeps knowledge alive.',
      sound: false,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelReviewReminder(): Promise<void> {
  if (!N) return;
  await N.cancelScheduledNotificationAsync('noor-review-daily').catch(() => {});
}
