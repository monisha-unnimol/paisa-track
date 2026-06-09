import { Platform } from 'react-native';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  isSmsListenerAvailable,
  isSmsListenerRunning,
  shutdownSmsListener,
  startSmsListener,
} from './smsListenerService';
import { hasSmsPermissions, requestSmsPermissions } from './smsPermissions';

export async function syncSmsTracking(): Promise<void> {
  if (Platform.OS !== 'android') {
    await shutdownSmsListener();
    return;
  }

  const enabled = useSettingsStore.getState().smsAutoTrackingEnabled;
  if (!enabled) {
    await shutdownSmsListener();
    return;
  }

  if (!isSmsListenerAvailable()) {
    await shutdownSmsListener();
    return;
  }

  if (!(await hasSmsPermissions())) {
    await shutdownSmsListener();
    return;
  }

  await startSmsListener();
}

export async function enableSmsTracking(): Promise<'enabled' | 'denied' | 'blocked' | 'unavailable'> {
  if (Platform.OS !== 'android') {
    return 'unavailable';
  }

  if (!isSmsListenerAvailable()) {
    return 'unavailable';
  }

  const permissionResult = await requestSmsPermissions();
  if (permissionResult === 'blocked') {
    await shutdownSmsListener();
    return 'blocked';
  }

  if (permissionResult !== 'granted') {
    await shutdownSmsListener();
    return 'denied';
  }

  const started = await startSmsListener();
  return started ? 'enabled' : 'denied';
}

export async function disableSmsTracking(): Promise<void> {
  await shutdownSmsListener();
}

export async function getSmsTrackingStatus(): Promise<{
  available: boolean;
  permissionGranted: boolean;
  listenerActive: boolean;
}> {
  const available = Platform.OS === 'android' && isSmsListenerAvailable();
  const permissionGranted = available ? await hasSmsPermissions() : false;

  return {
    available,
    permissionGranted,
    listenerActive:
      available && permissionGranted && isSmsListenerRunning(),
  };
}
