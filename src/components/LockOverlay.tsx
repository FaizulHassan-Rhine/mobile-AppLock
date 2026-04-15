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
      className="flex-1 bg-black/95 justify-center px-6"
      style={{ paddingTop: topPad }}>
      <View className="bg-focus-card rounded-3xl p-6 border border-violet-500/30">
        <Text className="text-center text-focus-primary text-sm font-bold uppercase tracking-widest mb-2">
          FocusLock
        </Text>
        <Text className="text-center text-zinc-400 mb-6">
          এক মিনিটের বেশি ব্যবহার — এখন বিরতি নাও
        </Text>
        <View className="items-center mb-8">
          <Text className="text-zinc-500 text-sm">সময় বাকি</Text>
          <Text className="text-5xl font-bold text-white mt-1">
            {Math.max(0, remaining)}s
          </Text>
        </View>
        <MathQuestion onCorrect={onCorrect} onWrong={onWrong} />
      </View>
    </View>
  );
}
