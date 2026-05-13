import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface AudioState {
  currentKey: string | null;
  currentTitle: string;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
}

export interface AudioContextValue extends AudioState {
  playUrl: (url: string, key: string, title?: string) => Promise<void>;
  toggle: () => Promise<void>;
  stop: () => Promise<void>;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<AudioState>({
    currentKey: null,
    currentTitle: '',
    isPlaying: false,
    isLoading: false,
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
      setState((s) => ({ ...s, isPlaying: false, positionMs: 0 }));
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setState({ currentKey: null, currentTitle: '', isPlaying: false, isLoading: false, positionMs: 0, durationMs: 0 });
  }, []);

  const playUrl = useCallback(async (url: string, key: string, title = '') => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.warn('Failed to set audio mode:', error);
    }

    setState((s) => ({ ...s, isLoading: true, currentKey: key, currentTitle: title, isPlaying: false, positionMs: 0, durationMs: 0 }));

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
  }, [onStatus]);

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

  return (
    <AudioCtx.Provider value={{ ...state, playUrl, toggle, stop }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useGlobalAudio(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useGlobalAudio must be used inside AudioProvider');
  return ctx;
}
