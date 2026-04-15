package com.focuslock

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import java.util.concurrent.TimeUnit

object UsageStatsHelper {

  fun hasUsageAccess(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          appOps.unsafeCheckOpNoThrow(
              AppOpsManager.OPSTR_GET_USAGE_STATS,
              Process.myUid(),
              context.packageName,
          )
        } else {
          @Suppress("DEPRECATION")
          appOps.checkOpNoThrow(
              AppOpsManager.OPSTR_GET_USAGE_STATS,
              Process.myUid(),
              context.packageName,
          )
        }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  fun openUsageAccessSettings(context: Context) {
    context.startActivity(
        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        },
    )
  }

  /**
   * Returns the package name of the app in the foreground, or null if unknown / no permission.
   */
  fun getForegroundPackageName(context: Context): String? {
    if (!hasUsageAccess(context)) return null
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val end = System.currentTimeMillis()
    val begin = end - TimeUnit.SECONDS.toMillis(15)

    // More reliable than aggregate stats for "currently foreground" detection.
    try {
      val events = usm.queryEvents(begin, end)
      val event = UsageEvents.Event()
      var latestPkg: String? = null
      var latestTs = 0L
      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND && event.timeStamp > latestTs) {
          latestPkg = event.packageName
          latestTs = event.timeStamp
        }
      }
      if (!latestPkg.isNullOrBlank()) {
        return latestPkg
      }
    } catch (_: Exception) {
      // Fallback below.
    }

    val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, begin, end) ?: return null
    if (stats.isEmpty()) return null
    val recent =
        stats.maxByOrNull { it.lastTimeUsed }
            ?: return null
    if (recent.lastTimeUsed <= 0L) {
      return null
    }
    return recent.packageName
  }
}
