/**
 * @format
 */

import 'react-native-gesture-handler';
import './global.css';
import { AppRegistry } from 'react-native';
import App from './App';
import LockOverlay from './src/components/LockOverlay';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('FocusLockOverlay', () => LockOverlay);
