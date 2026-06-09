import { EventSubscription, NativeModule, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type SmsReceivedEvent = {
  sender: string;
  body: string;
  timestamp: number;
};

declare class SmsListenerNativeModule extends NativeModule {
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  getPendingMessages(): Promise<SmsReceivedEvent[]>;
  clearPendingMessages(): Promise<void>;
  addListener(
    eventName: 'onSmsReceived',
    listener: (event: SmsReceivedEvent) => void,
  ): EventSubscription;
  removeListeners(count: number): void;
}

let nativeModule: SmsListenerNativeModule | null = null;

if (Platform.OS === 'android') {
  try {
    nativeModule = requireNativeModule<SmsListenerNativeModule>('SmsListener');
  } catch {
    nativeModule = null;
  }
}

export function isSmsListenerAvailable(): boolean {
  return nativeModule != null;
}

export async function startSmsListening(): Promise<void> {
  if (!nativeModule) {
    throw new Error('SMS listener is only available on Android development builds.');
  }
  await nativeModule.startListening();
}

export async function stopSmsListening(): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.stopListening();
}

export async function getPendingMessages(): Promise<SmsReceivedEvent[]> {
  if (!nativeModule) return [];
  return nativeModule.getPendingMessages();
}

export async function clearPendingMessages(): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.clearPendingMessages();
}

export function addSmsReceivedListener(
  listener: (event: SmsReceivedEvent) => void,
): EventSubscription | null {
  if (!nativeModule) return null;
  return nativeModule.addListener('onSmsReceived', listener);
}
