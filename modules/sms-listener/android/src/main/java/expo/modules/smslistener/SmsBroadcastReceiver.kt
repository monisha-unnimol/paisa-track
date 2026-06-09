package expo.modules.smslistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsMessage

class SmsBroadcastReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    val bundle = intent.extras ?: return
    val pdus = bundle.get("pdus") as? Array<*> ?: return
    val format = bundle.getString("format")

    val bodyBuilder = StringBuilder()
    var sender = ""

    for (pdu in pdus) {
      val sms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        SmsMessage.createFromPdu(pdu as ByteArray, format)
      } else {
        @Suppress("DEPRECATION")
        SmsMessage.createFromPdu(pdu as ByteArray)
      }

      if (sender.isEmpty()) {
        sender = sms.originatingAddress ?: ""
      }
      bodyBuilder.append(sms.messageBody ?: "")
    }

    val body = bodyBuilder.toString()
    if (body.isBlank()) return

    SmsListenerModuleHolder.dispatch(context.applicationContext, sender, body, System.currentTimeMillis())
  }
}
