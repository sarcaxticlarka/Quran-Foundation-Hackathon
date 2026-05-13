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

// Try multiple free IP geolocation APIs in order
async function getLocationFromIP(): Promise<{ lat: number; lng: number; city?: string } | null> {
  // 1. ip-api.com — free, no key needed, very reliable
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city', {
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    if (json.status === 'success' && json.lat && json.lon) {
      return { lat: json.lat, lng: json.lon, city: json.city };
    }
  } catch {}

  // 2. ipapi.co fallback
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    if (json.latitude && json.longitude) {
      return { lat: json.latitude, lng: json.longitude, city: json.city };
    }
  } catch {}

  // 3. freeipapi.com fallback
  try {
    const res = await fetch('https://freeipapi.com/api/json', {
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    if (json.latitude && json.longitude) {
      return { lat: json.latitude, lng: json.longitude, city: json.cityName };
    }
  } catch {}

  return null;
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityHint, setCityHint] = useState<string | undefined>(undefined);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'not-asked'>('unknown');
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const madhab = useAuthStore((s) => s.user?.madhab);

  const getLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    // 1. Try last known GPS position — instant if cached
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    } catch {}

    // 2. Try fresh GPS with low accuracy (faster)
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      if (loc) return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {}

    // 3. IP-based fallback — city-level, good enough for prayer times
    const ipLocation = await getLocationFromIP();
    if (ipLocation) {
      if (ipLocation.city) setCityHint(ipLocation.city);
      return { lat: ipLocation.lat, lng: ipLocation.lng };
    }

    return null;
  };

  // On mount: check existing permission. If granted → get location.
  // If not granted → skip GPS and go straight to IP location so prayer
  // times always show without needing location permission.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;

      if (status === 'granted') {
        setPermissionStatus('granted');
        const loc = await getLocation();
        if (cancelled) return;
        if (loc) {
          setCoords(loc);
        } else {
          setLocationUnavailable(true);
        }
      } else {
        // Permission not granted — use IP location silently so prayer times
        // still show. Mark as 'not-asked' so the opt-in prompt is visible
        // (user can grant GPS for more accurate times).
        setPermissionStatus(status === 'denied' ? 'denied' : 'not-asked');

        // Still try IP location regardless of GPS permission
        const ipLocation = await getLocationFromIP();
        if (cancelled) return;
        if (ipLocation) {
          if (ipLocation.city) setCityHint(ipLocation.city);
          setCoords({ lat: ipLocation.lat, lng: ipLocation.lng });
        } else {
          setLocationUnavailable(true);
        }
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
      const loc = await getLocation();
      if (loc) {
        setCoords(loc);
      } else {
        setLocationUnavailable(true);
      }
    } else {
      setPermissionStatus('denied');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading: queryLoading, isError } = useQuery({
    queryKey: ['prayer-times', coords?.lat, coords?.lng, today, madhab ?? '', cityHint ?? ''],
    queryFn: () => fetchPrayerTimes(coords!.lat, coords!.lng, madhab, cityHint),
    enabled: !!coords,
    staleTime: 1000 * 60 * 60 * 12,
    retry: 2,
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

  // isLoading: true while checking permissions OR fetching location OR fetching prayer times
  const isLoading =
    permissionStatus === 'unknown' ||
    (!coords && !locationUnavailable) ||
    (!!coords && queryLoading);

  return {
    data,
    currentInfo,
    isLoading,
    isError,
    permissionStatus,
    locationUnavailable,
    city: data?.city ?? cityHint ?? '',
    requestPermission,
  };
}
