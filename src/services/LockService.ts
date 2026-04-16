import { NativeModules, Platform } from 'react-native';

type NativeService = {
  startMonitorService: () => void;
  stopMonitorService: () => void;
  isServiceEnabled: () => Promise<boolean>;
  isServiceRunning: () => Promise<boolean>;
  hasUsageAccess: () => Promise<boolean>;
  canDrawOverlays: () => Promise<boolean>;
  openUsageAccessSettings: () => void;
  openOverlaySettings: () => void;
  openNotificationSettings: () => void;
  openBatteryOptimizationSettings: () => void;
  isIgnoringBatteryOptimizations: () => Promise<boolean>;
  setMonitoredPackages: (packages: string[]) => void;
  getMonitoredPackages: () => Promise<string[]>;
  getLockCountToday: () => Promise<number>;
  getUsageThresholdSeconds: () => Promise<number>;
  setUsageThresholdSeconds: (seconds: number) => void;
  getBreakDurationSeconds: () => Promise<number>;
  setBreakDurationSeconds: (seconds: number) => void;
  dismissLockOverlay: () => void;
  getForegroundPackageName: () => Promise<string>;
  pauseActiveMedia: () => void;
  getLaunchableApps: () => Promise<
    Array<{ packageName: string; label: string }>
  >;
};

const native: NativeService | undefined =
  Platform.OS === 'android'
    ? (NativeModules.NativeServiceModule as NativeService)
    : undefined;

export const LockService = {
  isAvailable: () => Platform.OS === 'android' && !!native,

  startMonitorService: () => native?.startMonitorService(),
  stopMonitorService: () => native?.stopMonitorService(),
  isServiceEnabled: () => native?.isServiceEnabled() ?? Promise.resolve(false),
  isServiceRunning: () => native?.isServiceRunning() ?? Promise.resolve(false),
  hasUsageAccess: () => native?.hasUsageAccess() ?? Promise.resolve(false),
  canDrawOverlays: () => native?.canDrawOverlays() ?? Promise.resolve(false),
  openUsageAccessSettings: () => native?.openUsageAccessSettings(),
  openOverlaySettings: () => native?.openOverlaySettings(),
  openNotificationSettings: () => native?.openNotificationSettings(),
  openBatteryOptimizationSettings: () =>
    native?.openBatteryOptimizationSettings(),
  isIgnoringBatteryOptimizations: () =>
    native?.isIgnoringBatteryOptimizations() ?? Promise.resolve(true),
  setMonitoredPackages: (packages: string[]) =>
    native?.setMonitoredPackages(packages),
  getMonitoredPackages: () =>
    native?.getMonitoredPackages() ?? Promise.resolve([]),
  getLockCountToday: () => native?.getLockCountToday() ?? Promise.resolve(0),
  getUsageThresholdSeconds: () =>
    native?.getUsageThresholdSeconds() ?? Promise.resolve(60),
  setUsageThresholdSeconds: (seconds: number) =>
    native?.setUsageThresholdSeconds(seconds),
  getBreakDurationSeconds: () =>
    native?.getBreakDurationSeconds() ?? Promise.resolve(15),
  setBreakDurationSeconds: (seconds: number) =>
    native?.setBreakDurationSeconds(seconds),
  dismissLockOverlay: () => native?.dismissLockOverlay(),
  getForegroundPackageName: () =>
    native?.getForegroundPackageName() ?? Promise.resolve('unknown'),
  pauseActiveMedia: () => native?.pauseActiveMedia(),
  getLaunchableApps: () =>
    native?.getLaunchableApps() ?? Promise.resolve([]),
};
