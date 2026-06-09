package expo.modules.smslistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class PendingSms(
  val sender: String,
  val body: String,
  val timestamp: Long,
)

object SmsPendingStore {
  private const val PREFS_NAME = "sms_listener_pending"
  private const val KEY_MESSAGES = "messages"
  private const val MAX_MESSAGES = 20

  fun add(context: Context, sender: String, body: String, timestamp: Long) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val messages = getAll(context).toMutableList()

    val duplicate = messages.any {
      it.sender == sender && it.body == body.trim()
    }
    if (duplicate) return

    messages.add(PendingSms(sender, body, timestamp))

    while (messages.size > MAX_MESSAGES) {
      messages.removeAt(0)
    }

    prefs.edit().putString(KEY_MESSAGES, encode(messages)).apply()
  }

  fun getAll(context: Context): List<PendingSms> {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_MESSAGES, null) ?: return emptyList()
    return decode(raw)
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_MESSAGES)
      .apply()
  }

  private fun encode(messages: List<PendingSms>): String {
    val array = JSONArray()
    for (message in messages) {
      array.put(
        JSONObject()
          .put("sender", message.sender)
          .put("body", message.body)
          .put("timestamp", message.timestamp),
      )
    }
    return array.toString()
  }

  private fun decode(raw: String): List<PendingSms> {
    return try {
      val array = JSONArray(raw)
      val result = ArrayList<PendingSms>(array.length())
      for (index in 0 until array.length()) {
        val item = array.getJSONObject(index)
        result.add(
          PendingSms(
            sender = item.optString("sender", ""),
            body = item.optString("body", ""),
            timestamp = item.optLong("timestamp", System.currentTimeMillis()),
          ),
        )
      }
      result
    } catch (_: Exception) {
      emptyList()
    }
  }
}

object SmsListenerModuleHolder {
  @Volatile
  private var activeModule: SmsListenerModule? = null

  fun register(module: SmsListenerModule) {
    activeModule = module
  }

  fun unregister(module: SmsListenerModule) {
    if (activeModule === module) {
      activeModule = null
    }
  }

  fun dispatch(context: Context, sender: String, body: String, timestamp: Long) {
    val trimmedBody = body.trim()
    if (trimmedBody.isBlank()) return

    val module = activeModule
    if (module != null && module.tryEmitSms(sender, trimmedBody, timestamp)) {
      return
    }

    SmsPendingStore.add(context, sender, trimmedBody, timestamp)
  }
}
