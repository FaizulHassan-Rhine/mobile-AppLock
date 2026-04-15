import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import QuickNav from '../components/QuickNav';
import { LockService } from '../services/LockService';

type StatsState = {
  lockCount: number;
  monitoredCount: number;
  serviceEnabled: boolean;
  foregroundPackage: string;
};

const KNOWN_LABELS: Record<string, string> = {
  'com.google.android.youtube': 'YouTube',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.facebook.katana': 'Facebook',
  'com.instagram.android': 'Instagram',
  'com.android.chrome': 'Chrome',
};

export default function StatsScreen() {
  const [state, setState] = useState<StatsState>({
    lockCount: 0,
    monitoredCount: 0,
    serviceEnabled: false,
    foregroundPackage: 'unknown',
  });

  const refresh = useCallback(async () => {
    const [lockCount, monitored, serviceEnabled, foregroundPackage] =
      await Promise.all([
        LockService.getLockCountToday(),
        LockService.getMonitoredPackages(),
        LockService.isServiceEnabled(),
        LockService.getForegroundPackageName(),
      ]);
    setState({
      lockCount,
      monitoredCount: monitored.length,
      serviceEnabled,
      foregroundPackage,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const foregroundLabel = useMemo(() => {
    return KNOWN_LABELS[state.foregroundPackage] ?? state.foregroundPackage;
  }, [state.foregroundPackage]);

  return (
    <ScrollView className="flex-1 bg-focus-bg">
      <View className="px-5 pt-12 pb-10">
        <Text className="text-3xl font-bold text-white mb-1">Stats & Diagnostics</Text>
        <Text className="text-zinc-500 mb-2">
          Verify if FocusLock can detect apps and trigger locks correctly.
        </Text>
        <QuickNav active="Stats" />

        <View className="bg-focus-card rounded-2xl p-5 mt-4 mb-3 border border-zinc-800">
          <Text className="text-zinc-400 text-sm mb-1">Locked today</Text>
          <Text className="text-3xl font-bold text-white">{state.lockCount}</Text>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <Text className="text-zinc-400 text-sm mb-1">Service status</Text>
          <Text
            className={
              state.serviceEnabled
                ? 'text-emerald-400 font-semibold'
                : 'text-amber-400 font-semibold'
            }>
            {state.serviceEnabled ? 'Running' : 'Stopped'}
          </Text>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <Text className="text-zinc-400 text-sm mb-1">Monitored app count</Text>
          <Text className="text-white text-xl font-semibold">{state.monitoredCount}</Text>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <Text className="text-zinc-400 text-sm mb-1">Current foreground app</Text>
          <Text className="text-white text-base font-semibold">{foregroundLabel}</Text>
          <Text className="text-zinc-500 text-xs mt-1">{state.foregroundPackage}</Text>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <Text className="text-zinc-400 text-sm mb-2">Debug action</Text>
          <Pressable
            onPress={LockService.pauseActiveMedia}
            className="bg-zinc-900 py-3 rounded-xl border border-zinc-700">
            <Text className="text-center text-zinc-100 font-semibold">
              Send pause media command now
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={refresh}
          className="py-3 mt-2 border border-zinc-700 rounded-xl">
          <Text className="text-center text-zinc-300">Refresh diagnostics</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
