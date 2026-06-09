package expo.modules.smslistener

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

object SmsNotificationHelper {
  private const val CHANNEL_ID = "sms-transactions"
  private const val CHANNEL_NAME = "SMS transaction alerts"
  private const val NOTIFICATION_ID = 9101

  fun show(context: Context, sender: String, body: String) {
    val notificationManager =
      context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    ensureChannel(notificationManager)

    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?.apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        putExtra("openSmsPending", true)
      } ?: return

    val pendingIntent = PendingIntent.getActivity(
      context,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val preview = body.replace("\n", " ").trim().take(120)
    val title = if (sender.isNotBlank()) "Bank SMS from $sender" else "Bank SMS detected"

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.sym_action_chat)
      .setContentTitle(title)
      .setContentText("Tap to review and add as expense")
      .setStyle(NotificationCompat.BigTextStyle().bigText(preview))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent)
      .build()

    notificationManager.notify(NOTIFICATION_ID, notification)
  }

  private fun ensureChannel(notificationManager: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val existing = notificationManager.getNotificationChannel(CHANNEL_ID)
    if (existing != null) return

    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_HIGH,
    ).apply {
      description = "Alerts when a bank SMS is detected"
      enableVibration(true)
    }

    notificationManager.createNotificationChannel(channel)
  }
}
