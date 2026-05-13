import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { fetchPrayerTimes, getCurrentPrayerInfo, type PrayerTimesData, type CurrentPrayerInfo } from '../services/prayerTimes';
import { useAuthStore } from '../stores/authStore';
import { groqAI } from '../services/groqAI';
import { schedulePrayerReminders } from '../services/notifications';

interface UsePrayerTimesResult {
  data: PrayerTimesData | undefined;
  currentInfo: CurrentPrayerInfo | undefined;
  isLoading: boolean;
  isError: boolean;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'not-asked';
  locationUnavailable: boolean;
  city: string;
  requestPermission: () => Promise<void>;
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityHint, setCityHint] = useState<string | undefined>(undefined);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'not-asked'>('unknown');
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const madhab = useAuthStore((s) => s.user?.madhab);

  const getLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    // 1. Try last known position first — instant if cached
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    } catch {}

    // 2. Try GPS with a short timeout
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {}

    // 3. IP-based fallback — city-level, good enough for prayer times
    try {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      if (json.latitude && json.longitude) {
        if (json.city) setCityHint(json.city);
        return { lat: json.latitude, lng: json.longitude };
      }
    } catch {}

    return null;
  };

  // On mount: check existing permission status — never prompt automatically
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (status === 'granted') {
        setPermissionStatus('granted');
        const coords = await getLocation();
        if (cancelled) return;
        if (coords) {
          setCoords(coords);
        } else {
          setLocationUnavailable(true);
        }
      } else if (status === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('not-asked');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Called only when user explicitly taps "Enable prayer times"
  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPermissionStatus('granted');
      setLocationUnavailable(false);
      const coords = await getLocation();
      if (coords) {
        setCoords(coords);
      } else {
        setLocationUnavailable(true);
      }
    } else {
      setPermissionStatus('denied');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['prayer-times', coords?.lat, coords?.lng, today, madhab ?? '', cityHint ?? ''],
    queryFn: () => fetchPrayerTimes(coords!.lat, coords!.lng, madhab, cityHint),
    enabled: !!coords,
    staleTime: 1000 * 60 * 60 * 12,
    retry: 1,
  });

  const currentInfo = data ? getCurrentPrayerInfo(data.times) : undefined;

  // Keep groqAI informed of the current prayer time for contextual responses
  useEffect(() => {
    if (currentInfo) {
      groqAI.configure({ currentPrayer: currentInfo.current });
    }
  }, [currentInfo?.current]);

  // Schedule OS-level prayer notifications whenever we get fresh times
  useEffect(() => {
    if (data?.times) {
      schedulePrayerReminders(data.times).catch(() => {});
    }
  }, [data?.times]);

  return {
    data,
    currentInfo,
    isLoading: permissionStatus === 'granted' && !coords && !locationUnavailable,
    isError,
    permissionStatus,
    locationUnavailable,
    city: data?.city ?? '',
    requestPermission,
  };
}
