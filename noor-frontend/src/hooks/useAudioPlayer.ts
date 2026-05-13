import { useRef, useState, useEffect, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export type AudioPlayerState = {
  isPlaying: boolean;
  isLoading: boolean;
  currentKey: string | null;
  positionMs: number;
  durationMs: number;
};

export type AudioPlayerControls = {
  playUrl: (url: string, key: string) => Promise<void>;
  toggle: () => Promise<void>;
  stop: () => Promise<void>;
};

export function useAudioPlayer(): AudioPlayerState & AudioPlayerControls {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentKey: null,
    positionMs: 0,
    durationMs: 0,
  });

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setState((s) => ({
      ...s,
      isPlaying: status.isPlaying,
      positionMs: status.positionMillis,
      durationMs: status.durationMillis ?? 0,
    }));
    if (status.didJustFinish) {
      setState((s) => ({ ...s, isPlaying: false, currentKey: null, positionMs: 0 }));
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setState((s) => ({ ...s, isPlaying: false, isLoading: false, currentKey: null, positionMs: 0 }));
  }, []);

  const playUrl = useCallback(async (url: string, key: string) => {
    await stop();

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.warn('Failed to set audio mode:', error);
    }

    setState((s) => ({ ...s, isLoading: true, currentKey: key }));

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        onStatus,
      );
      soundRef.current = sound;
      setState((s) => ({ ...s, isLoading: false, isPlaying: true }));
    } catch {
      setState((s) => ({ ...s, isLoading: false, currentKey: null }));
    }
  }, [stop, onStatus]);

  const toggle = useCallback(async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, []);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  return { ...state, playUrl, toggle, stop };
}
