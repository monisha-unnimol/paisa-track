package expo.modules.smslistener

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch

class SmsListenerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SmsListener")

    Events("onSmsReceived")

    OnCreate {
      SmsListenerModuleHolder.register(this@SmsListenerModule)
    }

    OnDestroy {
      SmsListenerModuleHolder.unregister(this@SmsListenerModule)
    }

    AsyncFunction("startListening") {
      // Manifest receiver handles SMS in background; JS drains pending queue separately.
    }

    AsyncFunction("stopListening") {
      SmsListenerModuleHolder.unregister(this@SmsListenerModule)
    }

    AsyncFunction("getPendingMessages") {
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any>>()
      SmsPendingStore.getAll(context).map { message ->
        mapOf(
          "sender" to message.sender,
          "body" to message.body,
          "timestamp" to message.timestamp,
        )
      }
    }

    AsyncFunction("clearPendingMessages") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      SmsPendingStore.clear(context)
      null
    }
  }

  fun tryEmitSms(sender: String, body: String, timestamp: Long): Boolean {
    if (appContext.reactContext == null) return false

    appContext.mainQueue.launch {
      sendEvent(
        "onSmsReceived",
        mapOf(
          "sender" to sender,
          "body" to body,
          "timestamp" to timestamp,
        ),
      )
    }
    return true
  }
}
