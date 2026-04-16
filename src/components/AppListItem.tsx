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
    <View className="mb-2 flex-row items-center justify-between rounded-[14px] border border-focus-border bg-[#191925] px-4 py-3.5">
      <View className="flex-1 pr-3">
        <Text className="text-[15px] font-semibold text-white">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[12px] text-focus-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
        thumbColor="#f4f4f5"
      />
    </View>
  );
}
