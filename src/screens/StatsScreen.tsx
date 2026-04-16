import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackdrop from '../components/ScreenBackdrop';
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
  const tabBarHeight = useBottomTabBarHeight();
  const [state, setState] = useState<StatsState>({
    lockCount: 0,
    monitoredCount: 0,
    serviceEnabled: false,
    foregroundPackage: 'unknown',
  });

  const refresh = useCallback(async () => {
    const [lockCount, monitored, serviceEnabled, foregroundPackage] = await Promise.all([
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
    <ScreenBackdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          showsVerticalScrollIndicator={false}>
          <View className="px-4 pb-4 pt-2">
            <Text className="text-[28px] font-bold text-white" style={{ letterSpacing: 0.2 }}>
              Stats
            </Text>
            <Text className="mt-1.5 text-[14px] leading-[1.45] text-focus-muted">
              Live diagnostics: locks, service state, and foreground detection.
            </Text>

            <View className="mt-5 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <Text className="text-[12px] font-semibold uppercase tracking-wide text-focus-muted">
                Locks today
              </Text>
              <Text className="mt-1 text-[30px] font-bold text-white">{state.lockCount}</Text>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <View className="flex-row flex-wrap justify-between gap-3">
                <View>
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-focus-muted">
                    Service
                  </Text>
                  <Text
                    className={`mt-1 text-[15px] font-bold ${state.serviceEnabled ? 'text-focus-ok' : 'text-focus-warn'}`}>
                    {state.serviceEnabled ? 'Running' : 'Stopped'}
                  </Text>
                </View>
                <View>
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-focus-muted">
                    Monitored
                  </Text>
                  <Text className="mt-1 text-[15px] font-bold text-white">{state.monitoredCount} apps</Text>
                </View>
              </View>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <Text className="text-[12px] font-semibold uppercase tracking-wide text-focus-muted">
                Current foreground app
              </Text>
              <Text className="mt-2 text-[16px] font-bold text-white">{foregroundLabel}</Text>
              <Text className="mt-1 text-[12px] text-focus-muted">{state.foregroundPackage}</Text>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <Text className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-focus-muted">
                Debug
              </Text>
              <Pressable
                onPress={LockService.pauseActiveMedia}
                className="rounded-xl border border-focus-border bg-[#191925] py-3 active:opacity-90">
                <Text className="text-center text-[14px] font-bold text-white">Send pause media command</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={refresh}
              className="mt-3 rounded-xl border border-focus-border py-3.5 active:opacity-90">
              <Text className="text-center text-[14px] font-semibold text-focus-muted">Refresh diagnostics</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackdrop>
  );
}
