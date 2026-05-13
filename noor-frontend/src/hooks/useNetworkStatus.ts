import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

async function checkConnectivity(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    await fetch('https://1.1.1.1', { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const online = await checkConnectivity();
      if (!cancelled) setIsOnline(online);
    };

    check();
    intervalRef.current = setInterval(check, 15000);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return isOnline;
}
