import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LockService } from '../services/LockService';

const STORAGE_KEY = '@focuslock/onboarding_done';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  return v === '1';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

export default function OnboardingScreen() {
  const navigation = useNavigation();
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
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }),
    );
  };

  return (
    <ScrollView className="flex-1 bg-focus-bg">
      <View className="px-5 pt-14 pb-10">
        <Text className="text-3xl font-bold text-white mb-2">সেটআপ</Text>
        <Text className="text-zinc-400 mb-8">
          FocusLock কাজ করতে দুটি অনুমতি দরকার। নিচের ধাপগুলো অনুসরণ করো।
        </Text>

        <View className="bg-focus-card rounded-2xl p-5 mb-4 border border-zinc-800">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold flex-1">
              ১. Usage access
            </Text>
            {usageOk ? (
              <Text className="text-emerald-400 text-sm font-medium">চালু</Text>
            ) : (
              <Text className="text-amber-400 text-sm font-medium">বন্ধ</Text>
            )}
          </View>
          <Text className="text-zinc-400 text-sm mb-4 leading-5">
            সেটিংস → অ্যাপ → বিশেষ অ্যাপ অ্যাক্সেস → Usage access → FocusLock
            চালু করো।
          </Text>
          <Pressable
            onPress={() => LockService.openUsageAccessSettings()}
            className="bg-focus-primary py-3 rounded-xl active:opacity-90">
            <Text className="text-center text-white font-semibold">
              Usage সেটিংস খুলুন
            </Text>
          </Pressable>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-8 border border-zinc-800">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold flex-1">
              ২. Display over other apps
            </Text>
            {overlayOk ? (
              <Text className="text-emerald-400 text-sm font-medium">চালু</Text>
            ) : (
              <Text className="text-amber-400 text-sm font-medium">বন্ধ</Text>
            )}
          </View>
          <Text className="text-zinc-400 text-sm mb-4 leading-5">
            অন্য অ্যাপের ওপর প্রদর্শন অনুমতি দাও যাতে লক স্ক্রিন দেখানো যায়।
          </Text>
          <Pressable
            onPress={() => LockService.openOverlaySettings()}
            className="bg-focus-primary py-3 rounded-xl active:opacity-90">
            <Text className="text-center text-white font-semibold">
              Overlay সেটিংস খুলুন
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={refresh}
          className="py-3 mb-4 border border-zinc-700 rounded-xl">
          <Text className="text-center text-zinc-300">অনুমতি আবার চেক করুন</Text>
        </Pressable>

        <Pressable
          disabled={!usageOk || !overlayOk}
          onPress={finish}
          className={`py-4 rounded-xl ${
            usageOk && overlayOk ? 'bg-emerald-600' : 'bg-zinc-800'
          }`}>
          <Text className="text-center text-white font-bold text-lg">
            শুরু করুন
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
