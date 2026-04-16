import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackdrop from '../components/ScreenBackdrop';
import { LockService } from '../services/LockService';
import type { MainTabParamList } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const tabBarHeight = useBottomTabBarHeight();
  const [serviceOn, setServiceOn] = useState(false);
  const [monitoredCount, setMonitoredCount] = useState(0);
  const [lockCount, setLockCount] = useState(0);
  const [permissionReady, setPermissionReady] = useState(false);
  const [usageSecondsInput, setUsageSecondsInput] = useState('60');
  const [breakSecondsInput, setBreakSecondsInput] = useState('15');
  const [settingsSaved, setSettingsSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [on, pkgs, count, usageOk, overlayOk, usageSeconds, breakSeconds] =
      await Promise.all([
      LockService.isServiceEnabled(),
      LockService.getMonitoredPackages(),
      LockService.getLockCountToday(),
      LockService.hasUsageAccess(),
      LockService.canDrawOverlays(),
      LockService.getUsageThresholdSeconds(),
      LockService.getBreakDurationSeconds(),
    ]);
    setServiceOn(on);
    setMonitoredCount(pkgs.length);
    setLockCount(count);
    setPermissionReady(usageOk && overlayOk);
    setUsageSecondsInput(String(usageSeconds));
    setBreakSecondsInput(String(breakSeconds));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleService = useCallback(async (on: boolean) => {
    if (on) {
      LockService.startMonitorService();
    } else {
      LockService.stopMonitorService();
    }
    setServiceOn(on);
  }, []);

  const saveTimingSettings = useCallback(() => {
    const usage = Number.parseInt(usageSecondsInput.trim(), 10);
    const pause = Number.parseInt(breakSecondsInput.trim(), 10);
    if (Number.isNaN(usage) || Number.isNaN(pause)) {
      setSettingsSaved('Enter valid numbers');
      return;
    }
    const normalizedUsage = Math.max(15, Math.min(3600, usage));
    const normalizedPause = Math.max(5, Math.min(300, pause));
    LockService.setUsageThresholdSeconds(normalizedUsage);
    LockService.setBreakDurationSeconds(normalizedPause);
    setUsageSecondsInput(String(normalizedUsage));
    setBreakSecondsInput(String(normalizedPause));
    setSettingsSaved('Saved');
  }, [breakSecondsInput, usageSecondsInput]);

  return (
    <ScreenBackdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          showsVerticalScrollIndicator={false}>
          <View className="px-4 pb-4 pt-2">
            <Text className="text-[28px] font-bold leading-tight text-white" style={{ letterSpacing: 0.2 }}>
              FocusLock
            </Text>
            <Text className="mt-1.5 text-[14px] leading-[1.45] text-focus-muted">
              One-minute focus lock with a smart overlay challenge.
            </Text>

            <View className="mt-5 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-[15px] font-semibold text-white">Monitoring</Text>
                  <Text
                    className={`mt-1 text-[13px] font-semibold ${serviceOn ? 'text-focus-ok' : 'text-focus-muted'}`}>
                    {serviceOn ? 'Running in background' : 'Stopped'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: serviceOn }}
                  onPress={() => toggleService(!serviceOn)}
                  className={`h-8 w-14 justify-center rounded-full p-1 ${serviceOn ? 'bg-focus-primary' : 'bg-zinc-600'}`}>
                  <View
                    className={`h-6 w-6 rounded-full bg-white ${serviceOn ? 'self-end' : 'self-start'}`}
                  />
                </Pressable>
              </View>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <Text className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-focus-muted">
                Session status
              </Text>
              <Text className="text-[15px] text-white">
                Permissions:{' '}
                <Text className={permissionReady ? 'font-bold text-focus-ok' : 'font-bold text-focus-warn'}>
                  {permissionReady ? 'Ready' : 'Action needed'}
                </Text>
              </Text>
              <Text className="mt-2 text-[15px] text-white">
                Monitored apps:{' '}
                <Text className="font-bold text-[#c4b5fd]">{monitoredCount}</Text>
              </Text>
              <Text className="mt-2 text-[15px] text-white">
                Locks today:{' '}
                <Text className="font-bold text-[#c4b5fd]">{lockCount}</Text>
              </Text>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <Text className="mb-2 text-[16px] font-semibold text-white">
                Timer settings
              </Text>
              <Text className="text-[13px] text-focus-muted">
                Control when lock starts and how long the question pause stays.
              </Text>
              <View className="mt-3 flex-row gap-2">
                <View className="flex-1">
                  <Text className="mb-1 text-[12px] font-semibold text-focus-muted">
                    Focus time (sec)
                  </Text>
                  <TextInput
                    value={usageSecondsInput}
                    onChangeText={setUsageSecondsInput}
                    keyboardType="number-pad"
                    placeholder="60"
                    placeholderTextColor="#71717a"
                    className="rounded-xl border border-focus-border bg-[#10101a] px-3 py-2.5 text-white"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-[12px] font-semibold text-focus-muted">
                    Pause time (sec)
                  </Text>
                  <TextInput
                    value={breakSecondsInput}
                    onChangeText={setBreakSecondsInput}
                    keyboardType="number-pad"
                    placeholder="15"
                    placeholderTextColor="#71717a"
                    className="rounded-xl border border-focus-border bg-[#10101a] px-3 py-2.5 text-white"
                  />
                </View>
              </View>
              <Pressable
                onPress={saveTimingSettings}
                className="mt-3 rounded-xl border border-[#7c3aed]/55 bg-focus-primarySoft py-2.5 active:opacity-90">
                <Text className="text-center text-[13px] font-bold text-[#c4b5fd]">
                  Save timer settings
                </Text>
              </Pressable>
              {settingsSaved ? (
                <Text className="mt-2 text-[12px] text-focus-muted">{settingsSaved}</Text>
              ) : null}
            </View>

            <View className="mt-5">
              <Text className="mb-2 text-[16px] font-semibold text-white">Quick actions</Text>
              <Pressable
                onPress={() => navigation.navigate('Apps')}
                className="mb-2 rounded-[14px] border border-focus-border bg-[#191925] p-3 active:opacity-90">
                <Text className="text-[15px] font-semibold text-white">Manage monitored apps</Text>
                <Text className="mt-1 text-[13px] text-focus-muted">
                  Add YouTube, browser, and any custom distractions.
                </Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Permissions')}
                className="mb-2 rounded-[14px] border border-focus-border bg-[#191925] p-3 active:opacity-90">
                <Text className="text-[15px] font-semibold text-white">Check permissions</Text>
                <Text className="mt-1 text-[13px] text-focus-muted">
                  Usage, overlay, battery, and notification settings.
                </Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Stats')}
                className="rounded-[14px] border border-focus-border bg-[#191925] p-3 active:opacity-90">
                <Text className="text-[15px] font-semibold text-white">Diagnostics</Text>
                <Text className="mt-1 text-[13px] text-focus-muted">
                  Service state, foreground detection, and lock metrics.
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackdrop>
  );
}
