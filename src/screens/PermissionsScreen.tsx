import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackdrop from '../components/ScreenBackdrop';
import { LockService } from '../services/LockService';

type PermissionState = {
  usage: boolean;
  overlay: boolean;
  battery: boolean;
};

function StatusBadge({ on }: { on: boolean }) {
  return (
    <Text
      className={`text-[13px] font-bold ${on ? 'text-focus-ok' : 'text-focus-warn'}`}>
      {on ? 'Enabled' : 'Needs action'}
    </Text>
  );
}

export default function PermissionsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
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
    <ScreenBackdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          showsVerticalScrollIndicator={false}>
          <View className="px-4 pb-4 pt-2">
            <Text className="text-[28px] font-bold text-white" style={{ letterSpacing: 0.2 }}>
              Permissions
            </Text>
            <Text className="mt-1.5 text-[14px] leading-[1.45] text-focus-muted">
              Tune FocusLock so it survives real devices and OEM battery rules.
            </Text>

            <View className="mt-5 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[16px] font-semibold text-white">Usage access</Text>
                <StatusBadge on={state.usage} />
              </View>
              <Text className="mb-3 text-[14px] leading-snug text-focus-muted">
                Required to detect which app is in the foreground.
              </Text>
              <Pressable
                onPress={LockService.openUsageAccessSettings}
                className="rounded-xl bg-violet-600 py-3.5 active:opacity-90"
                style={{ borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.55)' }}>
                <Text className="text-center text-[15px] font-bold text-white">Open usage settings</Text>
              </Pressable>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[16px] font-semibold text-white">Display over other apps</Text>
                <StatusBadge on={state.overlay} />
              </View>
              <Text className="mb-3 text-[14px] leading-snug text-focus-muted">
                Shows the math challenge above YouTube, browsers, and social apps.
              </Text>
              <Pressable
                onPress={LockService.openOverlaySettings}
                className="rounded-xl bg-violet-600 py-3.5 active:opacity-90"
                style={{ borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.55)' }}>
                <Text className="text-center text-[15px] font-bold text-white">Open overlay settings</Text>
              </Pressable>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[16px] font-semibold text-white">Battery optimization</Text>
                <StatusBadge on={state.battery} />
              </View>
              <Text className="mb-3 text-[14px] leading-snug text-focus-muted">
                Unrestricted battery helps the foreground service after “clean all” style tools.
              </Text>
              <Pressable
                onPress={LockService.openBatteryOptimizationSettings}
                className="rounded-xl bg-violet-600 py-3.5 active:opacity-90"
                style={{ borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.55)' }}>
                <Text className="text-center text-[15px] font-bold text-white">Open battery settings</Text>
              </Pressable>
            </View>

            <View className="mt-3 rounded-[18px] border border-focus-border bg-focus-surface/95 p-4">
              <Text className="mb-2 text-[16px] font-semibold text-white">Notifications</Text>
              <Text className="mb-3 text-[14px] leading-snug text-focus-muted">
                Keep the monitoring channel on so Android treats the service as a real background task.
              </Text>
              <Pressable
                onPress={LockService.openNotificationSettings}
                className="rounded-xl bg-violet-600 py-3.5 active:opacity-90"
                style={{ borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.55)' }}>
                <Text className="text-center text-[15px] font-bold text-white">Open notification settings</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={refresh}
              className="mt-3 rounded-xl border border-focus-border py-3.5 active:opacity-90">
              <Text className="text-center text-[14px] font-semibold text-focus-muted">
                Refresh permission status
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackdrop>
  );
}
