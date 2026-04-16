package com.focuslock

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat

object ServiceRestarter {
  private const val FGS_NOT_ALLOWED = "android.app.ForegroundServiceStartNotAllowedException"

  fun startMonitorService(context: Context) {
    val app = context.applicationContext
    val intent = Intent(app, AppMonitorService::class.java)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ContextCompat.startForegroundService(app, intent)
      } else {
        @Suppress("DEPRECATION")
        app.startService(intent)
      }
    } catch (e: Exception) {
      // Android 12+: FGS may not start from background; avoid referencing the exception class on old devices.
      if (e.javaClass.name == FGS_NOT_ALLOWED) return
      if (e is IllegalStateException) return
    }
  }
}
