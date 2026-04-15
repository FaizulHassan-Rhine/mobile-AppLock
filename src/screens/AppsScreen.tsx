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
import { useFocusEffect } from '@react-navigation/native';
import AppListItem from '../components/AppListItem';
import QuickNav from '../components/QuickNav';
import { LockService } from '../services/LockService';

const KNOWN_LABELS: Record<string, string> = {
  'com.google.android.youtube': 'YouTube',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.facebook.katana': 'Facebook',
  'com.instagram.android': 'Instagram',
  'com.android.chrome': 'Chrome',
};

export default function AppsScreen() {
  const [monitored, setMonitored] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [apps, setApps] = useState<Array<{ packageName: string; label: string }>>(
    [],
  );
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
        a.label.toLowerCase().includes(q) ||
        a.packageName.toLowerCase().includes(q),
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
    <ScrollView className="flex-1 bg-focus-bg">
      <View className="px-5 pt-12 pb-10">
        <Text className="text-3xl font-bold text-white mb-1">Apps</Text>
        <Text className="text-zinc-500 mb-2">
          Choose which apps trigger the 1-minute lock challenge.
        </Text>
        <QuickNav active="Apps" />

        <View className="flex-row items-center justify-between mb-3 mt-4">
          <Text className="text-white text-lg font-semibold">Monitored apps</Text>
          <Pressable
            onPress={openPicker}
            className="bg-focus-primary/20 px-3 py-2 rounded-lg border border-focus-primary/40">
            <Text className="text-focus-primary font-semibold text-sm">Add app</Text>
          </Pressable>
        </View>

        {displayList.length === 0 ? (
          <Text className="text-zinc-500 mb-4">
            No apps selected. Tap "Add app" to start.
          </Text>
        ) : (
          displayList.map(({ pkg, label }) => (
            <AppListItem
              key={pkg}
              title={label}
              subtitle={pkg}
              value
              onValueChange={v => togglePackage(pkg, v)}
            />
          ))
        )}
      </View>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-focus-bg rounded-t-3xl max-h-[85%] border border-zinc-800">
            <View className="p-4 border-b border-zinc-800 flex-row items-center justify-between">
              <Text className="text-white text-lg font-bold">Choose apps</Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text className="text-focus-primary font-semibold">Close</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Search apps..."
              placeholderTextColor="#666"
              value={query}
              onChangeText={setQuery}
              className="mx-4 mt-3 mb-2 bg-focus-card text-white px-4 py-3 rounded-xl border border-zinc-800"
            />
            {loadingApps ? (
              <View className="py-8 items-center">
                <ActivityIndicator color="#7C3AED" />
              </View>
            ) : (
              <FlatList
                data={filteredApps}
                keyExtractor={item => item.packageName}
                contentContainerClassName="px-4 pb-24"
                renderItem={({ item }) => {
                  const on = monitored.includes(item.packageName);
                  return (
                    <Pressable
                      onPress={() => {
                        togglePackage(item.packageName, !on);
                      }}
                      className="flex-row items-center justify-between py-3 border-b border-zinc-900">
                      <View className="flex-1 pr-3">
                        <Text className="text-white font-medium">{item.label}</Text>
                        <Text
                          className="text-zinc-500 text-xs mt-0.5"
                          numberOfLines={1}>
                          {item.packageName}
                        </Text>
                      </View>
                      <Text
                        className={
                          on ? 'text-emerald-400 font-semibold' : 'text-zinc-500'
                        }>
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
    </ScrollView>
  );
}
