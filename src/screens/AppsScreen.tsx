import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppListItem from '../components/AppListItem';
import ScreenBackdrop from '../components/ScreenBackdrop';
import { LockService } from '../services/LockService';

const KNOWN_LABELS: Record<string, string> = {
  'com.google.android.youtube': 'YouTube',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.facebook.katana': 'Facebook',
  'com.instagram.android': 'Instagram',
  'com.android.chrome': 'Chrome',
};

export default function AppsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [monitored, setMonitored] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [apps, setApps] = useState<Array<{ packageName: string; label: string }>>([]);
  const [query, setQuery] = useState('');
  const [loadingApps, setLoadingApps] = useState(false);

  const load = useCallback(async () => {
    const pkgs = await LockService.getMonitoredPackages();
    setMonitored(pkgs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const persistMonitored = useCallback(async (next: string[]) => {
    setMonitored(next);
    LockService.setMonitoredPackages(next);
  }, []);

  const togglePackage = useCallback(
    (pkg: string, enabled: boolean) => {
      if (enabled) {
        if (!monitored.includes(pkg)) {
          persistMonitored([...monitored, pkg]);
        }
      } else {
        persistMonitored(monitored.filter(p => p !== pkg));
      }
    },
    [monitored, persistMonitored],
  );

  const openPicker = useCallback(async () => {
    setPickerOpen(true);
    setLoadingApps(true);
    try {
      const list = await LockService.getLaunchableApps();
      list.sort((a, b) => a.label.localeCompare(b.label));
      setApps(list);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return apps;
    }
    return apps.filter(
      a =>
        a.label.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    );
  }, [apps, query]);

  const displayList = useMemo(
    () =>
      monitored.map(pkg => ({
        pkg,
        label: KNOWN_LABELS[pkg] ?? pkg,
      })),
    [monitored],
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
              Apps
            </Text>
            <Text className="mt-1.5 text-[14px] leading-[1.45] text-focus-muted">
              Choose which apps trigger the one-minute lock challenge.
            </Text>

            <View className="mt-5 flex-row items-center justify-between">
              <Text className="text-[16px] font-semibold text-white">Monitored apps</Text>
              <Pressable
                onPress={openPicker}
                className="rounded-xl border border-[#7c3aed]/55 bg-focus-primarySoft px-3 py-2 active:opacity-90">
                <Text className="text-[13px] font-bold text-[#c4b5fd]">Add app</Text>
              </Pressable>
            </View>

            {displayList.length === 0 ? (
              <Text className="mb-4 mt-3 text-[14px] text-focus-muted">
                No apps selected. Tap &quot;Add app&quot; to start.
              </Text>
            ) : (
              <View className="mt-3">
                {displayList.map(({ pkg, label }) => (
                  <AppListItem
                    key={pkg}
                    title={label}
                    subtitle={pkg}
                    value
                    onValueChange={v => togglePackage(pkg, v)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Modal visible={pickerOpen} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/75">
            <View className="max-h-[85%] rounded-t-3xl border border-focus-border bg-[#0f0f16]">
              <View className="flex-row items-center justify-between border-b border-focus-border p-4">
                <Text className="text-[18px] font-bold text-white">Add monitored app</Text>
                <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
                  <Text className="text-[14px] font-bold text-[#c4b5fd]">Close</Text>
                </Pressable>
              </View>
              <TextInput
                placeholder="Search by name or package..."
                placeholderTextColor="#71717a"
                value={query}
                onChangeText={setQuery}
                className="mx-4 mb-2 mt-3 rounded-xl border border-focus-border bg-[#10101a] px-4 py-3 text-[15px] text-white"
              />
              {loadingApps ? (
                <View className="items-center py-10">
                  <ActivityIndicator color="#7c3aed" />
                </View>
              ) : (
                <FlatList
                  data={filteredApps}
                  keyExtractor={item => item.packageName}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: tabBarHeight + 24 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const on = monitored.includes(item.packageName);
                    return (
                      <Pressable
                        onPress={() => togglePackage(item.packageName, !on)}
                        className="flex-row items-center justify-between border-b border-[#1a1a24] py-3 active:opacity-80">
                        <View className="flex-1 pr-3">
                          <Text className="text-[15px] font-medium text-white">{item.label}</Text>
                          <Text className="mt-0.5 text-[12px] text-focus-muted" numberOfLines={1}>
                            {item.packageName}
                          </Text>
                        </View>
                        <Text
                          className={`text-[13px] font-bold ${on ? 'text-focus-ok' : 'text-focus-muted'}`}>
                          {on ? 'Added' : 'Add'}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ScreenBackdrop>
  );
}
