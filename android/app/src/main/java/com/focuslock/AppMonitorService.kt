package com.focuslock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.app.KeyguardManager
import android.media.AudioManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.KeyEvent
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

class AppMonitorService : Service() {

  private val handler = Handler(Looper.getMainLooper())
  private var activeMonitoredPackage: String? = null
  private var usageWindowStartMs: Long = 0
  private var lastForegroundPackage: String? = null
  private var lastForegroundSeenMs: Long = 0
  private var breakActive = false
  private var frozenPackage: String? = null
  private var breakEndsAtMs: Long = 0L

  private val pollRunnable =
      object : Runnable {
        override fun run() {
          handler.postDelayed(this, POLL_INTERVAL_MS)
          tick()
        }
      }

  override fun onCreate() {
    super.onCreate()
    instance = this
    createNotificationChannel()
    attachForegroundNotification()
    handler.post(pollRunnable)
  }

  override fun onDestroy() {
    handler.removeCallbacks(pollRunnable)
    handler.removeCallbacks(resumeRunnable)
    handler.removeCallbacks(countdownRunnable)
    FreezeOverlayManager.hide(applicationContext)
    instance = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // After OEM "clean" or process restart, ensure we are still a proper foreground service.
    attachForegroundNotification()
    return START_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    super.onTaskRemoved(rootIntent)
    // Normal recent-task clear must not permanently stop monitoring: restart while user left service on.
    if (FocusLockStore.isServiceEnabled(applicationContext)) {
      ServiceRestarter.startMonitorService(applicationContext)
    }
  }

  private fun tick() {
    if (!FocusLockStore.isServiceEnabled(applicationContext)) {
      FreezeOverlayManager.hide(applicationContext)
      stopSelf()
      return
    }
    if (!UsageStatsHelper.hasUsageAccess(applicationContext)) return
    if (!Settings.canDrawOverlays(applicationContext)) return

    // Do not trigger while device is locked/screen-off; avoids system-wide lock feeling.
    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
    val km = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    if (!pm.isInteractive || km.isKeyguardLocked) {
      if (breakActive) {
        endFreezeNow(resetWindow = true)
      }
      resetUsageWindow()
      return
    }

    val now = System.currentTimeMillis()
    var foreground = UsageStatsHelper.getForegroundPackageName(applicationContext)
    if (foreground != null) {
      lastForegroundPackage = foreground
      lastForegroundSeenMs = now
    } else if (now - lastForegroundSeenMs <= FOREGROUND_GRACE_MS && !lastForegroundPackage.isNullOrBlank()) {
      // Some OEMs occasionally return null usage events; keep short grace fallback.
      foreground = lastForegroundPackage
    }

    // If device stops reporting foreground temporarily, keep active monitored package window alive.
    val effectiveForeground = foreground ?: activeMonitoredPackage
    if (effectiveForeground == null) {
      return
    }

    if (effectiveForeground == packageName) return

    val monitored = FocusLockStore.getMonitoredPackages(applicationContext)

    if (breakActive) {
      return
    }

    if (effectiveForeground !in monitored) {
      resetUsageWindow()
      return
    }

    if (activeMonitoredPackage != effectiveForeground) {
      activeMonitoredPackage = effectiveForeground
      usageWindowStartMs = now
      return
    }

    if (usageWindowStartMs <= 0L) {
      usageWindowStartMs = now
      return
    }

    if (now - usageWindowStartMs >= currentUsageThresholdMs()) {
      triggerFreezeBreak(effectiveForeground)
    }
  }

  private fun triggerFreezeBreak(foregroundHint: String?) {
    val monitored = FocusLockStore.getMonitoredPackages(applicationContext)
    val foregroundNow = UsageStatsHelper.getForegroundPackageName(applicationContext) ?: foregroundHint
    if (foregroundNow == null || foregroundNow == packageName || foregroundNow !in monitored) {
      breakActive = false
      frozenPackage = null
      resetUsageWindow()
      return
    }

    val shown =
        FreezeOverlayManager.show(applicationContext) {
          handler.post { onFreezeSolved() }
        }
    if (!shown) {
      breakActive = false
      frozenPackage = null
      resetUsageWindow()
      return
    }

    val breakDurationMs = currentBreakDurationMs()
    breakActive = true
    frozenPackage = foregroundNow
    breakEndsAtMs = System.currentTimeMillis() + breakDurationMs
    resetUsageWindow()
    pauseActiveMediaPlayback()
    FreezeOverlayManager.updateRemaining((breakDurationMs / 1000L).toInt())
    handler.removeCallbacks(countdownRunnable)
    handler.post(countdownRunnable)
    FocusLockStore.incrementLockCount(applicationContext)
    handler.removeCallbacks(resumeRunnable)
    handler.postDelayed(resumeRunnable, breakDurationMs)
  }

  fun onOverlayDismissedFromNative() {
    handler.post {
      breakActive = false
      frozenPackage = null
      resetUsageWindow()
    }
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val ch =
          NotificationChannel(
              CHANNEL_ID,
              "FocusLock monitoring",
              NotificationManager.IMPORTANCE_DEFAULT,
          )
      ch.description = "Keeps FocusLock active to monitor app usage"
      ch.setSound(null, null)
      ch.enableVibration(false)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ch.setBlockable(false)
      }
      (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(ch)
    }
  }

  private fun attachForegroundNotification() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ServiceCompat.startForeground(
          this,
          NOTIFICATION_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      @Suppress("DEPRECATION")
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun buildNotification(): Notification {
    val launchIntent =
        Intent(this, MainActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
    val pi =
        PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val b =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FocusLock")
            .setContentText("Monitoring in background — do not dismiss to keep locks working")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pi)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    // Android 14+: show FGS notification immediately (less likely to be treated as dismissible/minimized).
    if (Build.VERSION.SDK_INT >= 34) {
      b.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
    }
    return b.build()
  }

  private val resumeRunnable =
      Runnable {
        FreezeOverlayManager.hide(applicationContext)
        handler.removeCallbacks(countdownRunnable)
        val monitored = FocusLockStore.getMonitoredPackages(applicationContext)
        val current = UsageStatsHelper.getForegroundPackageName(applicationContext)
        val shouldResume =
            breakActive &&
                frozenPackage != null &&
                frozenPackage == current &&
                current in monitored &&
                current != packageName
        if (shouldResume) {
          playActiveMediaPlayback()
          activeMonitoredPackage = current
          usageWindowStartMs = System.currentTimeMillis()
        } else {
          resetUsageWindow()
        }
        breakActive = false
        frozenPackage = null
        breakEndsAtMs = 0L
      }

  private val countdownRunnable =
      object : Runnable {
        override fun run() {
          if (!breakActive) return
          val remainingMs = breakEndsAtMs - System.currentTimeMillis()
          if (remainingMs <= 0L) return
          val sec = ((remainingMs + 999L) / 1000L).toInt()
          FreezeOverlayManager.updateRemaining(sec)
          handler.postDelayed(this, 250L)
        }
      }

  private fun resetUsageWindow() {
    activeMonitoredPackage = null
    usageWindowStartMs = 0L
  }

  private fun currentUsageThresholdMs(): Long =
      FocusLockStore.getUsageThresholdSeconds(applicationContext).toLong() * 1000L

  private fun currentBreakDurationMs(): Long =
      FocusLockStore.getBreakDurationSeconds(applicationContext).toLong() * 1000L

  private fun pauseActiveMediaPlayback() {
    dispatchMediaWithFallback(
        primary = KeyEvent.KEYCODE_MEDIA_PAUSE,
        secondary = KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
        expectMusicActive = false,
    )
  }

  private fun playActiveMediaPlayback() {
    dispatchMediaWithFallback(
        primary = KeyEvent.KEYCODE_MEDIA_PLAY,
        secondary = KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
        expectMusicActive = true,
    )
  }

  private fun dispatchMediaWithFallback(primary: Int, secondary: Int, expectMusicActive: Boolean) {
    try {
      val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      dispatchMediaKey(primary)
      handler.postDelayed(
          {
            val stateAfterPrimary = am.isMusicActive
            val reachedTarget =
                if (expectMusicActive) stateAfterPrimary else !stateAfterPrimary
            if (!reachedTarget) {
              dispatchMediaKey(secondary)
            }
          },
          MEDIA_RECHECK_DELAY_MS,
      )
    } catch (_: Exception) {}
  }

  private fun dispatchMediaKey(keyCode: Int) {
    try {
      val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val down = KeyEvent(KeyEvent.ACTION_DOWN, keyCode)
      val up = KeyEvent(KeyEvent.ACTION_UP, keyCode)
      am.dispatchMediaKeyEvent(down)
      am.dispatchMediaKeyEvent(up)
      val downIntent = Intent(Intent.ACTION_MEDIA_BUTTON).apply {
        putExtra(Intent.EXTRA_KEY_EVENT, down)
      }
      val upIntent = Intent(Intent.ACTION_MEDIA_BUTTON).apply {
        putExtra(Intent.EXTRA_KEY_EVENT, up)
      }
      sendOrderedBroadcast(downIntent, null)
      sendOrderedBroadcast(upIntent, null)
    } catch (_: Exception) {}
  }

  private fun endFreezeNow(resetWindow: Boolean) {
    FreezeOverlayManager.hide(applicationContext)
    handler.removeCallbacks(resumeRunnable)
    handler.removeCallbacks(countdownRunnable)
    breakActive = false
    frozenPackage = null
    breakEndsAtMs = 0L
    if (resetWindow) {
      resetUsageWindow()
    }
  }

  private fun onFreezeSolved() {
    if (!breakActive) return
    val monitored = FocusLockStore.getMonitoredPackages(applicationContext)
    val current = UsageStatsHelper.getForegroundPackageName(applicationContext)
    val shouldResumePlayback =
        frozenPackage != null &&
            current != null &&
            current == frozenPackage &&
            current in monitored &&
            current != packageName

    if (shouldResumePlayback) {
      playActiveMediaPlayback()
    }

    endFreezeNow(resetWindow = true)

    if (current != null && current in monitored && current != packageName) {
      activeMonitoredPackage = current
      usageWindowStartMs = System.currentTimeMillis()
    }
  }

  companion object {
    /** New id so channel importance / blockable settings apply on upgrade installs. */
    private const val CHANNEL_ID = "focuslock_fgs_v2"
    private const val NOTIFICATION_ID = 71042
    private const val POLL_INTERVAL_MS = 2000L
    private const val MEDIA_RECHECK_DELAY_MS = 350L
    private const val FOREGROUND_GRACE_MS = 8_000L

    @Volatile private var instance: AppMonitorService? = null

    fun notifyOverlayDismissed(context: Context) {
      instance?.onOverlayDismissedFromNative()
    }
  }
}
