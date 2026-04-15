import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LockService } from '../services/LockService';
import QuickNav from '../components/QuickNav';

type PermissionState = {
  usage: boolean;
  overlay: boolean;
  battery: boolean;
};

function StatusBadge({ on }: { on: boolean }) {
  return (
    <Text className={on ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
      {on ? 'Enabled' : 'Needs action'}
    </Text>
  );
}

export default function PermissionsScreen() {
  const [state, setState] = useState<PermissionState>({
    usage: false,
    overlay: false,
    battery: true,
  });

  const refresh = useCallback(async () => {
    const [usage, overlay, battery] = await Promise.all([
      LockService.hasUsageAccess(),
      LockService.canDrawOverlays(),
      LockService.isIgnoringBatteryOptimizations(),
    ]);
    setState({ usage, overlay, battery });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <ScrollView className="flex-1 bg-focus-bg">
      <View className="px-5 pt-12 pb-10">
        <Text className="text-3xl font-bold text-white mb-1">Permissions</Text>
        <Text className="text-zinc-500 mb-2">
          Optimize FocusLock for all Android devices.
        </Text>
        <QuickNav active="Permissions" />

        <View className="bg-focus-card rounded-2xl p-5 mt-4 mb-3 border border-zinc-800">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-lg font-semibold">Usage Access</Text>
            <StatusBadge on={state.usage} />
          </View>
          <Text className="text-zinc-400 mb-3">
            Required to detect the current foreground app.
          </Text>
          <Pressable
            onPress={LockService.openUsageAccessSettings}
            className="bg-focus-primary py-3 rounded-xl">
            <Text className="text-center text-white font-semibold">
              Open usage settings
            </Text>
          </Pressable>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-lg font-semibold">Overlay Permission</Text>
            <StatusBadge on={state.overlay} />
          </View>
          <Text className="text-zinc-400 mb-3">
            Required to show the math challenge above YouTube/browser apps.
          </Text>
          <Pressable
            onPress={LockService.openOverlaySettings}
            className="bg-focus-primary py-3 rounded-xl">
            <Text className="text-center text-white font-semibold">
              Open overlay settings
            </Text>
          </Pressable>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-lg font-semibold">Battery Optimization</Text>
            <StatusBadge on={state.battery} />
          </View>
          <Text className="text-zinc-400 mb-3">
            Disable optimization so background monitoring survives aggressive OEM battery rules.
          </Text>
          <Pressable
            onPress={LockService.openBatteryOptimizationSettings}
            className="bg-focus-primary py-3 rounded-xl">
            <Text className="text-center text-white font-semibold">
              Open battery settings
            </Text>
          </Pressable>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <Text className="text-white text-lg font-semibold mb-2">Notifications</Text>
          <Text className="text-zinc-400 mb-3">
            Foreground service needs a visible notification channel.
          </Text>
          <Pressable
            onPress={LockService.openNotificationSettings}
            className="bg-focus-primary py-3 rounded-xl">
            <Text className="text-center text-white font-semibold">
              Open notification settings
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={refresh}
          className="py-3 mt-2 border border-zinc-700 rounded-xl">
          <Text className="text-center text-zinc-300">Refresh permission status</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
