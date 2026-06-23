/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json');

const SMS_PLUGIN = './plugins/withAndroidSms.js';
const IOS_BUNDLE_ID = 'com.anonymous.expensetracker';

function isSmsPlugin(entry) {
  return entry === SMS_PLUGIN || (Array.isArray(entry) && entry[0] === SMS_PLUGIN);
}

const plugins = [
  ...base.expo.plugins.filter((entry) => !isSmsPlugin(entry)),
  SMS_PLUGIN,
  'expo-secure-store',
  [
    'expo-build-properties',
    {
      ios: {
        deploymentTarget: '15.1',
      },
      android: {
        minSdkVersion: 24,
      },
    },
  ],
];

const blockedPermissions = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.RECORD_AUDIO',
];

module.exports = {
  expo: {
    ...base.expo,
    plugins,
    android: {
      ...base.expo.android,
      softwareKeyboardLayoutMode: 'resize',
      permissions: [
        'android.permission.READ_SMS',
        'android.permission.RECEIVE_SMS',
      ],
      blockedPermissions,
    },
    ios: {
      ...base.expo.ios,
      bundleIdentifier: IOS_BUNDLE_ID,
      buildNumber: '1',
      supportsTablet: true,
      infoPlist: {
        ...base.expo.ios?.infoPlist,
        UIBackgroundModes: ['remote-notification'],
        NSCameraUsageDescription:
          'Allow PaisaTrack to use your camera to set a profile avatar.',
        NSPhotoLibraryUsageDescription:
          'Allow PaisaTrack to access your photos to set a profile avatar.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
  },
};
