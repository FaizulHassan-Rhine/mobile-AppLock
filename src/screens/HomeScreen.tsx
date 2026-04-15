import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LockService } from '../services/LockService';
import QuickNav from '../components/QuickNav';
import type { RootStackParamList } from '../navigation/types';

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [serviceOn, setServiceOn] = useState(false);
  const [monitoredCount, setMonitoredCount] = useState(0);
  const [lockCount, setLockCount] = useState(0);
  const [permissionReady, setPermissionReady] = useState(false);

  const load = useCallback(async () => {
    const [on, pkgs, count, usageOk, overlayOk] = await Promise.all([
      LockService.isServiceEnabled(),
      LockService.getMonitoredPackages(),
      LockService.getLockCountToday(),
      LockService.hasUsageAccess(),
      LockService.canDrawOverlays(),
    ]);
    setServiceOn(on);
    setMonitoredCount(pkgs.length);
    setLockCount(count);
    setPermissionReady(usageOk && overlayOk);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleService = useCallback(
    async (on: boolean) => {
      if (on) {
        LockService.startMonitorService();
      } else {
        LockService.stopMonitorService();
      }
      setServiceOn(on);
    },
    [],
  );

  return (
    <ScrollView className="flex-1 bg-focus-bg">
      <View className="px-5 pt-12 pb-10">
        <Text className="text-3xl font-bold text-white mb-1">FocusLock</Text>
        <Text className="text-zinc-500 mb-2">
          One-minute focus lock with smart overlay challenge
        </Text>
        <QuickNav active="Home" />

        <View className="bg-focus-card rounded-2xl p-5 mb-4 border border-zinc-800">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-semibold">সার্ভিস</Text>
              <Text
                className={
                  serviceOn ? 'text-emerald-400 mt-1' : 'text-zinc-500 mt-1'
                }>
                {serviceOn ? 'Service Running' : 'Service Stopped'}
              </Text>
            </View>
            <Pressable
              onPress={() => toggleService(!serviceOn)}
              className={`w-14 h-8 rounded-full p-1 ${
                serviceOn ? 'bg-focus-primary' : 'bg-zinc-700'
              }`}>
              <View
                className={`w-6 h-6 rounded-full bg-white ${
                  serviceOn ? 'self-end' : 'self-start'
                }`}
              />
            </Pressable>
          </View>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <Text className="text-zinc-400 text-sm mb-1">Status</Text>
          <Text className="text-white text-base">
            Permissions:{' '}
            <Text
              className={permissionReady ? 'text-emerald-400' : 'text-amber-400'}>
              {permissionReady ? 'Ready' : 'Action Needed'}
            </Text>
          </Text>
          <Text className="text-white text-base mt-1">
            Monitored apps: <Text className="text-focus-primary">{monitoredCount}</Text>
          </Text>
          <Text className="text-white text-base mt-1">
            Locked today: <Text className="text-focus-primary">{lockCount}</Text>
          </Text>
        </View>

        <View className="bg-focus-card rounded-2xl p-5 mb-3 border border-zinc-800">
          <Text className="text-white text-lg font-semibold mb-2">Quick Actions</Text>
          <Pressable
            onPress={() => navigation.navigate('Apps')}
            className="bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-700 mb-2">
            <Text className="text-white font-semibold">Manage monitored apps</Text>
            <Text className="text-zinc-400 text-sm mt-1">
              Add YouTube, browser, and any custom distractions.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Permissions')}
            className="bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-700 mb-2">
            <Text className="text-white font-semibold">Fix permissions</Text>
            <Text className="text-zinc-400 text-sm mt-1">
              Jump directly to usage access, overlay, and battery settings.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Stats')}
            className="bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-700">
            <Text className="text-white font-semibold">View diagnostics</Text>
            <Text className="text-zinc-400 text-sm mt-1">
              Verify foreground app detection and service health.
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
