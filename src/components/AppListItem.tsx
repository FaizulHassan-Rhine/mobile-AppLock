import React from 'react';
import { Switch, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export default function AppListItem({
  title,
  subtitle,
  value,
  onValueChange,
}: Props) {
  return (
    <View className="flex-row items-center justify-between bg-focus-card px-4 py-3 rounded-2xl mb-2 border border-zinc-800">
      <View className="flex-1 pr-3">
        <Text className="text-white text-base font-medium">{title}</Text>
        {subtitle ? (
          <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: '#7C3AED' }}
        thumbColor="#f4f4f5"
      />
    </View>
  );
}
