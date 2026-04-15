package com.focuslock

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.random.Random

/**
 * Blocking overlay that consumes touch input so the target app becomes temporarily unusable.
 */
object FreezeOverlayManager {
  @Volatile private var rootView: FrameLayout? = null
  @Volatile private var countdownView: TextView? = null
  @Volatile private var hintView: TextView? = null
  @Volatile private var buttons: List<Button> = emptyList()
  @Volatile private var correctAnswer: Int = 0
  @Volatile private var lockedByWrong: Boolean = false
  @Volatile private var solved: Boolean = false
  @Volatile private var onSolved: (() -> Unit)? = null

  fun isShowing(): Boolean = rootView != null

  fun show(context: Context, onSolvedCallback: () -> Unit): Boolean {
    if (rootView != null) return true
    onSolved = onSolvedCallback
    solved = false
    lockedByWrong = false

    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
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
                    WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR,
                PixelFormat.TRANSLUCENT,
            )
            .apply {
              gravity = Gravity.TOP or Gravity.START
              title = "FocusLockFreezeOverlay"
            }

    val overlay =
        FrameLayout(context).apply {
          setBackgroundColor(Color.parseColor("#CC0F0F0F"))
          isClickable = true
          isFocusable = true
          setOnTouchListener { _: View, _: MotionEvent -> true }
        }

    val card =
        LinearLayout(context).apply {
          orientation = LinearLayout.VERTICAL
          gravity = Gravity.CENTER_HORIZONTAL
          setBackgroundColor(Color.parseColor("#1A1A1A"))
          setPadding(dp(context, 20), dp(context, 20), dp(context, 20), dp(context, 20))
        }
    val title =
        TextView(context).apply {
          setTextColor(Color.WHITE)
          textSize = 20f
          gravity = Gravity.CENTER
          text = "Focus break"
        }
    val question = buildQuestionView(context)
    val timer =
        TextView(context).apply {
          setTextColor(Color.WHITE)
          textSize = 18f
          gravity = Gravity.CENTER
          text = "15 s"
          setPadding(0, dp(context, 8), 0, dp(context, 4))
        }
    val hint =
        TextView(context).apply {
          setTextColor(Color.parseColor("#F59E0B"))
          textSize = 14f
          gravity = Gravity.CENTER
          text = ""
          setPadding(0, dp(context, 8), 0, 0)
        }

    card.addView(title)
    card.addView(question)
    card.addView(timer)
    card.addView(hint)

    val lp =
        FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
            )
            .apply {
              gravity = Gravity.CENTER
              leftMargin = dp(context, 20)
              rightMargin = dp(context, 20)
            }
    overlay.addView(card, lp)

    return try {
      wm.addView(overlay, params)
      rootView = overlay
      countdownView = timer
      hintView = hint
      true
    } catch (_: Exception) {
      false
    }
  }

  fun updateRemaining(seconds: Int) {
    countdownView?.text = "$seconds s"
  }

  fun hide(context: Context) {
    val v = rootView ?: return
    rootView = null
    countdownView = null
    hintView = null
    buttons = emptyList()
    solved = false
    lockedByWrong = false
    onSolved = null
    try {
      val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      if (v.parent != null) {
        wm.removeView(v)
      }
    } catch (_: Exception) {}
  }

  private fun buildQuestionView(context: Context): LinearLayout {
    val a = Random.nextInt(1, 8)
    val b = Random.nextInt(1, 8)
    correctAnswer = a + b
    val optionSet = linkedSetOf(correctAnswer)
    while (optionSet.size < 4) {
      optionSet.add((correctAnswer + Random.nextInt(-3, 4)).coerceAtLeast(0))
    }
    val options = optionSet.shuffled()

    val wrap =
        LinearLayout(context).apply {
          orientation = LinearLayout.VERTICAL
          gravity = Gravity.CENTER_HORIZONTAL
          setPadding(0, dp(context, 14), 0, 0)
        }
    val q =
        TextView(context).apply {
          setTextColor(Color.WHITE)
          textSize = 18f
          gravity = Gravity.CENTER
          text = "$a + $b = ?"
          setPadding(0, 0, 0, dp(context, 10))
        }
    wrap.addView(q)

    val row1 = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
    val row2 = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      setPadding(0, dp(context, 8), 0, 0)
    }
    val createdButtons = mutableListOf<Button>()
    options.forEachIndexed { idx, value ->
      val button =
          Button(context).apply {
            text = value.toString()
            setOnClickListener { onAnswerTapped(value) }
          }
      val lp =
          LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
            if (idx % 2 == 0) rightMargin = dp(context, 6) else leftMargin = dp(context, 6)
          }
      if (idx < 2) {
        row1.addView(button, lp)
      } else {
        row2.addView(button, lp)
      }
      createdButtons.add(button)
    }
    buttons = createdButtons
    wrap.addView(row1)
    wrap.addView(row2)
    return wrap
  }

  private fun onAnswerTapped(answer: Int) {
    if (lockedByWrong || solved) return
    if (answer == correctAnswer) {
      solved = true
      onSolved?.invoke()
      return
    }
    lockedByWrong = true
    hintView?.text = "Wrong answer. Wait until timer ends."
    buttons.forEach { it.isEnabled = false }
  }

  private fun dp(context: Context, value: Int): Int {
    val density = context.resources.displayMetrics.density
    return (value * density).toInt()
  }
}
