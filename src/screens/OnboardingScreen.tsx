import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackdrop from '../components/ScreenBackdrop';
import { LockService } from '../services/LockService';
import type { RootStackParamList } from '../navigation/types';

const STORAGE_KEY = '@focuslock/onboarding_done';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  return v === '1';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [usageOk, setUsageOk] = useState(false);
  const [overlayOk, setOverlayOk] = useState(false);

  const refresh = useCallback(async () => {
    const [u, o] = await Promise.all([
      LockService.hasUsageAccess(),
      LockService.canDrawOverlays(),
    ]);
    setUsageOk(u);
    setOverlayOk(o);
  }, []);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      refresh();
    });
    refresh();
    return unsub;
  }, [navigation, refresh]);

  const finish = async () => {
    await markOnboardingDone();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
  };

  return (
    <ScreenBackdrop>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-3">
          <Text className="text-[28px] font-bold text-white" style={{ letterSpacing: 0.2 }}>
            Welcome
          </Text>
          <Text className="mt-2 text-[14px] leading-[1.5] text-focus-muted">
            FocusLock needs two Android permissions before it can run. Open each settings screen, enable access,
            then return here.
          </Text>

          <View className="mt-8 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="flex-1 text-[16px] font-semibold text-white">1. Usage access</Text>
              <Text
                className={`text-[13px] font-bold ${usageOk ? 'text-focus-ok' : 'text-focus-warn'}`}>
                {usageOk ? 'On' : 'Off'}
              </Text>
            </View>
            <Text className="mb-4 text-[14px] leading-snug text-focus-muted">
              Settings → Apps → Special app access → Usage access → enable FocusLock.
            </Text>
            <Pressable
              onPress={() => LockService.openUsageAccessSettings()}
              className="rounded-xl bg-violet-600 py-3.5 active:opacity-90"
              style={{ borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.55)' }}>
              <Text className="text-center text-[15px] font-bold text-white">Open usage settings</Text>
            </Pressable>
          </View>

          <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="flex-1 text-[16px] font-semibold text-white">2. Display over other apps</Text>
              <Text
                className={`text-[13px] font-bold ${overlayOk ? 'text-focus-ok' : 'text-focus-warn'}`}>
                {overlayOk ? 'On' : 'Off'}
              </Text>
            </View>
            <Text className="mb-4 text-[14px] leading-snug text-focus-muted">
              Allow FocusLock to draw the lock challenge above other apps.
            </Text>
            <Pressable
              onPress={() => LockService.openOverlaySettings()}
              className="rounded-xl bg-violet-600 py-3.5 active:opacity-90"
              style={{ borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.55)' }}>
              <Text className="text-center text-[15px] font-bold text-white">Open overlay settings</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={refresh}
            className="mt-4 rounded-xl border border-focus-border py-3.5 active:opacity-90">
            <Text className="text-center text-[14px] font-semibold text-focus-muted">Refresh status</Text>
          </Pressable>

          <Pressable
            disabled={!usageOk || !overlayOk}
            onPress={finish}
            className={`mt-4 rounded-xl py-4 ${usageOk && overlayOk ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
            <Text className="text-center text-[17px] font-bold text-white">Complete setup</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackdrop>
  );
}
