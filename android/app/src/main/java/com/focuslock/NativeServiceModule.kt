package com.focuslock

import android.app.Application
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.view.KeyEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class NativeServiceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NativeServiceModule"

  private fun appContext(): Context = reactApplicationContext.applicationContext

  @ReactMethod
  fun startMonitorService() {
    FocusLockStore.setServiceEnabled(appContext(), true)
    val intent = Intent(appContext(), AppMonitorService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      appContext().startForegroundService(intent)
    } else {
      appContext().startService(intent)
    }
  }

  @ReactMethod
  fun stopMonitorService() {
    FocusLockStore.setServiceEnabled(appContext(), false)
    appContext().stopService(Intent(appContext(), AppMonitorService::class.java))
  }

  @ReactMethod
  fun isServiceEnabled(promise: Promise) {
    promise.resolve(FocusLockStore.isServiceEnabled(appContext()))
  }

  @ReactMethod
  fun isServiceRunning(promise: Promise) {
    promise.resolve(FocusLockStore.isServiceEnabled(appContext()))
  }

  @ReactMethod
  fun hasUsageAccess(promise: Promise) {
    promise.resolve(UsageStatsHelper.hasUsageAccess(appContext()))
  }

  @ReactMethod
  fun canDrawOverlays(promise: Promise) {
    promise.resolve(Settings.canDrawOverlays(appContext()))
  }

  @ReactMethod
  fun openUsageAccessSettings() {
    UsageStatsHelper.openUsageAccessSettings(appContext())
  }

  @ReactMethod
  fun openOverlaySettings() {
    val intent =
        Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${appContext().packageName}"),
        )
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    appContext().startActivity(intent)
  }

  @ReactMethod
  fun openNotificationSettings() {
    val intent =
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
          putExtra(Settings.EXTRA_APP_PACKAGE, appContext().packageName)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    appContext().startActivity(intent)
  }

  @ReactMethod
  fun openBatteryOptimizationSettings() {
    val pkgUri = Uri.parse("package:${appContext().packageName}")
    val intent =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, pkgUri)
        } else {
          Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      appContext().startActivity(intent)
    } catch (_: ActivityNotFoundException) {
      val fallback = Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      appContext().startActivity(fallback)
    }
  }

  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(true)
      return
    }
    val pm = appContext().getSystemService(Context.POWER_SERVICE) as PowerManager
    promise.resolve(pm.isIgnoringBatteryOptimizations(appContext().packageName))
  }

  @ReactMethod
  fun getForegroundPackageName(promise: Promise) {
    val pkg = UsageStatsHelper.getForegroundPackageName(appContext()) ?: "unknown"
    promise.resolve(pkg)
  }

  @ReactMethod
  fun pauseActiveMedia() {
    val am = appContext().getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val downPause = KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MEDIA_PAUSE)
    val upPause = KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_MEDIA_PAUSE)
    am.dispatchMediaKeyEvent(downPause)
    am.dispatchMediaKeyEvent(upPause)
    val downIntent = Intent(Intent.ACTION_MEDIA_BUTTON).apply {
      putExtra(Intent.EXTRA_KEY_EVENT, downPause)
    }
    val upIntent = Intent(Intent.ACTION_MEDIA_BUTTON).apply {
      putExtra(Intent.EXTRA_KEY_EVENT, upPause)
    }
    appContext().sendOrderedBroadcast(downIntent, null)
    appContext().sendOrderedBroadcast(upIntent, null)
    reactApplicationContext.runOnUiQueueThread {
      if (am.isMusicActive) {
        val downToggle = KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
        val upToggle = KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
        am.dispatchMediaKeyEvent(downToggle)
        am.dispatchMediaKeyEvent(upToggle)
      }
    }
  }

  @ReactMethod
  fun setMonitoredPackages(packages: ReadableArray) {
    val list = mutableListOf<String>()
    for (i in 0 until packages.size()) {
      list.add(packages.getString(i) ?: continue)
    }
    FocusLockStore.setMonitoredPackages(appContext(), list)
  }

  @ReactMethod
  fun getMonitoredPackages(promise: Promise) {
    val arr = Arguments.createArray()
    FocusLockStore.getMonitoredPackages(appContext()).sorted().forEach { arr.pushString(it) }
    promise.resolve(arr)
  }

  @ReactMethod
  fun getLockCountToday(promise: Promise) {
    promise.resolve(FocusLockStore.getLockCountToday(appContext()))
  }

  @ReactMethod
  fun dismissLockOverlay() {
    val app = appContext() as Application
    OverlayManager.hide(app)
    AppMonitorService.notifyOverlayDismissed(appContext())
  }

  @ReactMethod
  fun getLaunchableApps(promise: Promise) {
    try {
      val pm = appContext().packageManager
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val list =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.queryIntentActivities(intent, android.content.pm.PackageManager.ResolveInfoFlags.of(0))
          } else {
            @Suppress("DEPRECATION") pm.queryIntentActivities(intent, 0)
          }
      val arr = Arguments.createArray()
      val seen = HashSet<String>()
      for (ri in list) {
        val pkg = ri.activityInfo.packageName
        if (!seen.add(pkg)) continue
        if (pkg == appContext().packageName) continue
        val map = Arguments.createMap()
        map.putString("packageName", pkg)
        val label = ri.loadLabel(pm)?.toString() ?: pkg
        map.putString("label", label)
        arr.pushMap(map)
      }
      promise.resolve(arr)
    } catch (e: Exception) {
      promise.reject("E_APPS", e.message, e)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Double) {}
}
