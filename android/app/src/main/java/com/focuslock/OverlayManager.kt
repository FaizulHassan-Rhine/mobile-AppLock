package com.focuslock

import android.app.Application
import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.interfaces.fabric.ReactSurface
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Presents a second React Native surface ("FocusLockOverlay") as a SYSTEM_ALERT_WINDOW overlay.
 */
object OverlayManager {

  private val bgExecutor = Executors.newSingleThreadExecutor()

  @Volatile private var surface: ReactSurface? = null

  fun isShowing(): Boolean = surface != null

  fun show(application: Application, lockSeconds: Int): Boolean {
    if (surface != null) return true
    var shown = false
    val showBlock: () -> Unit = show@{
      if (surface != null) return@show
      val host = (application as MainApplication).reactHost
      val props =
          Bundle().apply {
            putInt("lockSeconds", lockSeconds)
          }
      val newSurface = host.createSurface(application.applicationContext, "FocusLockOverlay", props)
      val wm = application.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      val type =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
          } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
          }
      val params =
          WindowManager.LayoutParams(
                  WindowManager.LayoutParams.MATCH_PARENT,
                  WindowManager.LayoutParams.MATCH_PARENT,
                  type,
                  WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                      WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR or
                      WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                  PixelFormat.TRANSLUCENT,
              )
              .apply {
                gravity = Gravity.TOP or Gravity.START
                title = "FocusLockOverlay"
              }
      try {
        val startTask = newSurface.start()
        val view = newSurface.view
        if (view == null) {
          android.util.Log.e("OverlayManager", "show failed: surface view is null")
          return@show
        }
        wm.addView(view, params)
        surface = newSurface
        shown = true
        bgExecutor.execute {
          try {
            startTask.waitForCompletion()
          } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
          }
        }
      } catch (e: Exception) {
        android.util.Log.e("OverlayManager", "show failed", e)
      }
    }
    if (Looper.myLooper() == Looper.getMainLooper()) {
      showBlock()
    } else {
      val latch = CountDownLatch(1)
      UiThreadUtil.runOnUiThread {
        try {
          showBlock()
        } finally {
          latch.countDown()
        }
      }
      try {
        latch.await(2, TimeUnit.SECONDS)
      } catch (_: InterruptedException) {
        Thread.currentThread().interrupt()
      }
    }
    return shown
  }

  fun hide(application: Application) {
    val s = surface ?: return
    surface = null
    UiThreadUtil.runOnUiThread {
      try {
        val wm = application.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        s.view?.let { v ->
          if (v.parent != null) {
            wm.removeView(v)
          }
        }
      } catch (e: Exception) {
        android.util.Log.e("OverlayManager", "removeView", e)
      }
      bgExecutor.execute {
        try {
          s.stop().waitForCompletion()
        } catch (_: InterruptedException) {
          Thread.currentThread().interrupt()
        }
        try {
          s.detach()
        } catch (_: Exception) {}
      }
    }
  }
}
