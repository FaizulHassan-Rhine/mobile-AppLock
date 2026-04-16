package com.focuslock

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray

object FocusLockStore {
  private const val PREFS_NAME = "focuslock_store"

  const val KEY_MONITORED_JSON = "monitored_json"
  const val KEY_SERVICE_ENABLED = "service_enabled"
  const val KEY_LOCK_COUNT = "lock_count"
  const val KEY_LOCK_DAY = "lock_day"
  const val KEY_USAGE_THRESHOLD_SECONDS = "usage_threshold_seconds"
  const val KEY_BREAK_DURATION_SECONDS = "break_duration_seconds"

  private const val DEFAULT_USAGE_THRESHOLD_SECONDS = 60
  private const val DEFAULT_BREAK_DURATION_SECONDS = 15
  private const val MIN_USAGE_THRESHOLD_SECONDS = 15
  private const val MAX_USAGE_THRESHOLD_SECONDS = 3600
  private const val MIN_BREAK_DURATION_SECONDS = 5
  private const val MAX_BREAK_DURATION_SECONDS = 300

  val DEFAULT_MONITORED: List<String> =
      listOf(
          "com.google.android.youtube",
          "com.android.chrome",
          "com.zhiliaoapp.musically",
          "com.facebook.katana",
          "com.instagram.android",
      )

  private fun prefs(context: Context): SharedPreferences =
      context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun getMonitoredPackages(context: Context): Set<String> {
    val sp = prefs(context)
    val json = sp.getString(KEY_MONITORED_JSON, null) ?: return DEFAULT_MONITORED.toSet()
    return try {
      val arr = JSONArray(json)
      (0 until arr.length()).map { arr.getString(it) }.toSet()
    } catch (_: Exception) {
      DEFAULT_MONITORED.toSet()
    }
  }

  fun setMonitoredPackages(context: Context, packages: Collection<String>) {
    val arr = JSONArray()
    packages.distinct().sorted().forEach { arr.put(it) }
    prefs(context).edit().putString(KEY_MONITORED_JSON, arr.toString()).apply()
  }

  fun isServiceEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_SERVICE_ENABLED, false)

  fun setServiceEnabled(context: Context, enabled: Boolean) {
    prefs(context).edit().putBoolean(KEY_SERVICE_ENABLED, enabled).apply()
  }

  fun incrementLockCount(context: Context) {
    val sp = prefs(context)
    val cal = java.util.Calendar.getInstance()
    val day =
        "${cal.get(java.util.Calendar.YEAR)}${cal.get(java.util.Calendar.DAY_OF_YEAR)}"
    val storedDay = sp.getString(KEY_LOCK_DAY, null)
    val count =
        if (day == storedDay) {
          sp.getInt(KEY_LOCK_COUNT, 0) + 1
        } else {
          1
        }
    sp.edit().putString(KEY_LOCK_DAY, day).putInt(KEY_LOCK_COUNT, count).apply()
  }

  fun getLockCountToday(context: Context): Int {
    val sp = prefs(context)
    val cal = java.util.Calendar.getInstance()
    val day =
        "${cal.get(java.util.Calendar.YEAR)}${cal.get(java.util.Calendar.DAY_OF_YEAR)}"
    if (sp.getString(KEY_LOCK_DAY, null) != day) return 0
    return sp.getInt(KEY_LOCK_COUNT, 0)
  }

  fun getUsageThresholdSeconds(context: Context): Int {
    val raw = prefs(context).getInt(KEY_USAGE_THRESHOLD_SECONDS, DEFAULT_USAGE_THRESHOLD_SECONDS)
    return raw.coerceIn(MIN_USAGE_THRESHOLD_SECONDS, MAX_USAGE_THRESHOLD_SECONDS)
  }

  fun setUsageThresholdSeconds(context: Context, seconds: Int) {
    val normalized = seconds.coerceIn(MIN_USAGE_THRESHOLD_SECONDS, MAX_USAGE_THRESHOLD_SECONDS)
    prefs(context).edit().putInt(KEY_USAGE_THRESHOLD_SECONDS, normalized).apply()
  }

  fun getBreakDurationSeconds(context: Context): Int {
    val raw = prefs(context).getInt(KEY_BREAK_DURATION_SECONDS, DEFAULT_BREAK_DURATION_SECONDS)
    return raw.coerceIn(MIN_BREAK_DURATION_SECONDS, MAX_BREAK_DURATION_SECONDS)
  }

  fun setBreakDurationSeconds(context: Context, seconds: Int) {
    val normalized = seconds.coerceIn(MIN_BREAK_DURATION_SECONDS, MAX_BREAK_DURATION_SECONDS)
    prefs(context).edit().putInt(KEY_BREAK_DURATION_SECONDS, normalized).apply()
  }
}
