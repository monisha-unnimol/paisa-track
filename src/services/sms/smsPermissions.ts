import { PermissionsAndroid, Platform } from 'react-native';

const SMS_RATIONALE = {
  title: 'SMS Access Required',
  message:
    'PaisaTrack reads bank SMS messages to detect transactions for automatic expense tracking. Messages stay on your device.',
  buttonPositive: 'Allow',
  buttonNegative: 'Deny',
} as const;

const RECEIVE_SMS_RATIONALE = {
  title: 'Receive SMS',
  message:
    'Allow PaisaTrack to receive new bank SMS so transactions can be detected in real time.',
  buttonPositive: 'Allow',
  buttonNegative: 'Deny',
} as const;

const NOTIFICATIONS_RATIONALE = {
  title: 'Notifications',
  message: 'Allow notifications so you can review detected transactions.',
  buttonPositive: 'Allow',
  buttonNegative: 'Not now',
} as const;

export type SmsPermissionResult =
  | 'granted'
  | 'denied'
  | 'blocked';

export async function requestSmsPermissions(): Promise<SmsPermissionResult> {
  if (Platform.OS !== 'android') {
    return 'denied';
  }

  const readResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    SMS_RATIONALE,
  );

  if (readResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return 'blocked';
  }

  if (readResult !== PermissionsAndroid.RESULTS.GRANTED) {
    return 'denied';
  }

  const receiveResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    RECEIVE_SMS_RATIONALE,
  );

  if (receiveResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return 'blocked';
  }

  if (receiveResult !== PermissionsAndroid.RESULTS.GRANTED) {
    return 'denied';
  }

  if (Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      NOTIFICATIONS_RATIONALE,
    );
  }

  return 'granted';
}

export async function hasSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const receiveGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  );
  const readGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
  );

  return receiveGranted && readGranted;
}
