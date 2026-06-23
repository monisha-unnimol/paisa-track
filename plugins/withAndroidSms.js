const { withAndroidManifest } = require('@expo/config-plugins');

const SMS_PERMISSIONS = [
  'android.permission.RECEIVE_SMS',
  'android.permission.READ_SMS',
];

const SMS_PERMISSIONS_WITH_NOTIFICATIONS = [
  ...SMS_PERMISSIONS,
  'android.permission.POST_NOTIFICATIONS',
];

function withAndroidSms(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.$) {
      manifest.$ = {};
    }
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    // Remove stale blocked-permission remove entries so SMS can be declared and requested.
    manifest['uses-permission'] = manifest['uses-permission'].filter((entry) => {
      const name = entry.$['android:name'];
      const isRemoved = entry.$['tools:node'] === 'remove';
      return !(isRemoved && SMS_PERMISSIONS_WITH_NOTIFICATIONS.includes(name));
    });

    for (const permission of SMS_PERMISSIONS) {
      const exists = manifest['uses-permission'].some(
        (entry) =>
          entry.$['android:name'] === permission && entry.$['tools:node'] !== 'remove',
      );

      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    }

    return config;
  });
}

module.exports = withAndroidSms;
