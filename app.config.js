const appJson = require('./app.json');
const fs = require('fs');
const path = require('path');

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
  process.env.GOOGLE_MAPS_ANDROID_API_KEY;
const nativeMapsEnabled =
  process.env.EXPO_PUBLIC_ENABLE_NATIVE_MAPS === 'true' && Boolean(googleMapsApiKey);

const config = {
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra || {}),
    nativeMapsEnabled,
  },
};

if (googleMapsApiKey) {
  config.android = {
    ...(config.android || {}),
    config: {
      ...(config.android?.config || {}),
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  };
}

if (fs.existsSync(path.join(__dirname, 'google-services.json'))) {
  config.android = {
    ...(config.android || {}),
    googleServicesFile: './google-services.json',
  };
}

module.exports = config;
