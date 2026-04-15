import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen, { hasCompletedOnboarding } from '../screens/OnboardingScreen';
import AppsScreen from '../screens/AppsScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import StatsScreen from '../screens/StatsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0F0F0F',
    card: '#0F0F0F',
    primary: '#7C3AED',
    text: '#fafafa',
    border: '#27272a',
    notification: '#7C3AED',
  },
};

export default function AppNavigator() {
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<'Onboarding' | 'Home'>('Onboarding');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const done = await hasCompletedOnboarding();
      if (!cancelled) {
        setInitial(done ? 'Home' : 'Onboarding');
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 bg-focus-bg items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initial}
        screenOptions={{
          headerStyle: { backgroundColor: '#0F0F0F' },
          headerTintColor: '#fafafa',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0F0F0F' },
          animation: 'slide_from_right',
          animationDuration: 220,
          fullScreenGestureEnabled: true,
        }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'FocusLock Home' }}
        />
        <Stack.Screen name="Apps" component={AppsScreen} options={{ title: 'Manage Apps' }} />
        <Stack.Screen
          name="Permissions"
          component={PermissionsScreen}
          options={{ title: 'Permissions' }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: 'Stats & Diagnostics' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
