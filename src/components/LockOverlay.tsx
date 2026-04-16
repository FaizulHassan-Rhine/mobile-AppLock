import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, Text, View } from 'react-native';
import MathQuestion from './MathQuestion';
import { LockService } from '../services/LockService';

type Props = {
  lockSeconds?: number;
};

export default function LockOverlay({ lockSeconds = 15 }: Props) {
  const [remaining, setRemaining] = useState(lockSeconds);
  const dismissedRef = useRef(false);
  const topPad =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16;

  useEffect(() => {
    dismissedRef.current = false;
    setRemaining(lockSeconds);
  }, [lockSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [lockSeconds]);

  useEffect(() => {
    if (remaining <= 0 && !dismissedRef.current) {
      dismissedRef.current = true;
      LockService.dismissLockOverlay();
    }
  }, [remaining]);

  const onCorrect = useCallback(() => {
    dismissedRef.current = true;
    LockService.dismissLockOverlay();
  }, []);

  const onWrong = useCallback(() => {}, []);

  return (
    <View
      className="flex-1 justify-center bg-black/95 px-5"
      style={{ paddingTop: topPad }}>
      <View className="rounded-[22px] border border-[#7c3aed]/35 bg-focus-surface/95 p-6">
        <Text className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#c4b5fd]">
          FocusLock
        </Text>
        <Text className="mb-6 text-center text-[14px] leading-snug text-focus-muted">
          You have been on this app for a while — take a short break.
        </Text>
        <View className="mb-8 items-center">
          <Text className="text-[13px] text-focus-muted">Time left</Text>
          <Text className="mt-1 text-5xl font-bold text-white">{Math.max(0, remaining)}s</Text>
        </View>
        <MathQuestion onCorrect={onCorrect} onWrong={onWrong} />
      </View>
    </View>
  );
}
