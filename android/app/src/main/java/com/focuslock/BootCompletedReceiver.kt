package com.focuslock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootCompletedReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    if (!FocusLockStore.isServiceEnabled(context.applicationContext)) return
    ServiceRestarter.startMonitorService(context.applicationContext)
  }
}
