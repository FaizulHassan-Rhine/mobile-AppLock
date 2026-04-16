/**
 * FocusLock — React Native shell
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b10" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
