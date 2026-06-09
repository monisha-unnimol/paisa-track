const { withAndroidManifest } = require('@expo/config-plugins');

const SMS_PERMISSIONS = [
  'android.permission.RECEIVE_SMS',
  'android.permission.READ_SMS',
  'android.permission.POST_NOTIFICATIONS',
];

function withAndroidSms(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    // Drop stale blocked-permission remove entries so SMS can be requested at runtime.
    manifest['uses-permission'] = manifest['uses-permission'].filter((entry) => {
      const name = entry.$['android:name'];
      const isRemoved = entry.$['tools:node'] === 'remove';
      return !(isRemoved && SMS_PERMISSIONS.includes(name));
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
