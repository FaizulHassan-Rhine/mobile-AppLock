import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type NavKey = 'Home' | 'Apps' | 'Permissions' | 'Stats';

type Props = {
  active: NavKey;
};

const items: Array<{ key: NavKey; label: string }> = [
  { key: 'Home', label: 'Home' },
  { key: 'Apps', label: 'Apps' },
  { key: 'Permissions', label: 'Permissions' },
  { key: 'Stats', label: 'Stats' },
];

export default function QuickNav({ active }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      {items.map(item => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            className={`px-3 py-2 rounded-lg border ${
              isActive
                ? 'bg-focus-primary/20 border-focus-primary/60'
                : 'bg-zinc-900 border-zinc-700'
            }`}>
            <Text
              className={
                isActive
                  ? 'text-focus-primary font-semibold'
                  : 'text-zinc-300 font-medium'
              }>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
