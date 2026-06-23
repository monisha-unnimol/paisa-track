import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  isSmsListenerAvailable,
  isSmsListenerRunning,
  shutdownSmsListener,
  startSmsListener,
} from './smsListenerService';
import { hasSmsPermissions, requestSmsPermissions } from './smsPermissions';

const SMS_AUTO_TRACKING_KEY = '@paisatrack/smsAutoTrackingEnabled';

async function writeSmsAutoTrackingFlag(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SMS_AUTO_TRACKING_KEY, enabled ? 'true' : 'false');
}

export async function syncSmsTracking(): Promise<void> {
  if (Platform.OS !== 'android') {
    await shutdownSmsListener();
    return;
  }

  const enabled = useSettingsStore.getState().smsAutoTrackingEnabled;
  if (!enabled) {
    console.log('[SMS] Tracking disabled');
    await shutdownSmsListener();
    return;
  }

  if (!isSmsListenerAvailable()) {
    console.log('[SMS] Listener unavailable in this build');
    await shutdownSmsListener();
    return;
  }

  if (!(await hasSmsPermissions())) {
    console.log('[SMS] Tracking enabled but permission missing; listener not started');
    await shutdownSmsListener();
    return;
  }

  console.log('[SMS] Tracking enabled');
  await startSmsListener();
}

export async function reconcileSmsTrackingState(): Promise<'ok' | 'disabled_invalid'> {
  const enabled = useSettingsStore.getState().smsAutoTrackingEnabled;
  if (!enabled) {
    return 'ok';
  }

  if (Platform.OS !== 'android' || !isSmsListenerAvailable()) {
    console.log('[SMS] Invalid state: tracking enabled but unavailable; disabling');
    await disableSmsTracking();
    await writeSmsAutoTrackingFlag(false);
    useSettingsStore.setState({ smsAutoTrackingEnabled: false });
    return 'disabled_invalid';
  }

  if (!(await hasSmsPermissions())) {
    console.log('[SMS] Invalid state: tracking enabled but permission not granted; disabling');
    await disableSmsTracking();
    await writeSmsAutoTrackingFlag(false);
    useSettingsStore.setState({ smsAutoTrackingEnabled: false });
    return 'disabled_invalid';
  }

  return 'ok';
}

export async function enableSmsTracking(): Promise<'enabled' | 'denied' | 'blocked' | 'unavailable'> {
  if (Platform.OS !== 'android') {
    console.log('[SMS] Enable skipped: not Android');
    return 'unavailable';
  }

  if (!isSmsListenerAvailable()) {
    console.log('[SMS] Enable failed: listener unavailable');
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
  if (started) {
    console.log('[SMS] Tracking enabled');
    return 'enabled';
  }

  console.log('[SMS] Enable failed: listener did not start');
  return 'denied';
}

export async function disableSmsTracking(): Promise<void> {
  console.log('[SMS] Tracking disabled');
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
