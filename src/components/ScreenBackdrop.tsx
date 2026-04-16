import React from 'react';
import { View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

export default function ScreenBackdrop({ children }: Props) {
  return (
    <View className="flex-1 bg-focus-bg">
      <View
        pointerEvents="none"
        className="absolute -top-16 -left-28 h-64 w-64 rounded-full bg-[#4b2060] opacity-[0.22]"
      />
      <View
        pointerEvents="none"
        className="absolute -right-20 -top-8 h-56 w-56 rounded-full bg-[#1e2460] opacity-[0.28]"
      />
      {children}
    </View>
  );
}
