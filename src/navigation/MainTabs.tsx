import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/HomeScreen';
import AppsScreen from '../screens/AppsScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import StatsScreen from '../screens/StatsScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function IconHome({ color, size }: { color: string; size: number }) {
  return <MaterialCommunityIcons name="home-variant-outline" size={size} color={color} />;
}

function IconApps({ color, size }: { color: string; size: number }) {
  return <MaterialCommunityIcons name="view-grid-outline" size={size} color={color} />;
}

function IconPermissions({ color, size }: { color: string; size: number }) {
  return <MaterialCommunityIcons name="shield-lock-outline" size={size} color={color} />;
}

function IconStats({ color, size }: { color: string; size: number }) {
  return <MaterialCommunityIcons name="chart-line" size={size} color={color} />;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#10101a',
          borderTopColor: '#252534',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#c4b5fd',
        tabBarInactiveTintColor: '#71717a',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: IconHome,
        }}
      />
      <Tab.Screen
        name="Apps"
        component={AppsScreen}
        options={{
          tabBarLabel: 'Apps',
          tabBarIcon: IconApps,
        }}
      />
      <Tab.Screen
        name="Permissions"
        component={PermissionsScreen}
        options={{
          tabBarLabel: 'Access',
          tabBarIcon: IconPermissions,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: IconStats,
        }}
      />
    </Tab.Navigator>
  );
}
