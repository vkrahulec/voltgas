module.exports = {
  expo: {
    name: 'voltgas-mobile',
    slug: 'voltgas-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android', 'web'],
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    entryPoint: './index.js',
    plugins: ['expo-location'],
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  },
};
