// app.config.js — dynamic config so EAS env vars (from eas.json) are picked up.
// Do NOT use dotenv here — EAS injects EXPO_PUBLIC_* vars into process.env directly.

module.exports = {
  expo: {
    name: 'Noor',
    slug: 'noor',
    scheme: 'noor',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    backgroundColor: '#0B2214',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0B2214',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.noor.spiritual',
      icon: './assets/icon.png',
      infoPlist: {
        CFBundleDisplayName: 'Noor',
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
      },
    },
    android: {
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0B2214',
      },
      edgeToEdgeEnabled: true,
      package: 'com.noor.spiritual',
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
      name: 'Noor — The Spiritual OS',
      shortName: 'Noor',
      themeColor: '#0B2214',
      backgroundColor: '#0B2214',
    },
    plugins: [
      'expo-router',
      'expo-web-browser',
      ['expo-av', { microphonePermission: 'Allow Noor to access your microphone for recitation feedback.' }],
      ['expo-notifications', { icon: './assets/icon.png', color: '#C9A84C' }],
      'expo-font',
      ['expo-media-library', { photosPermission: 'Allow Noor to save your spiritual journey card to your photo library.' }],
      ['expo-location', { locationWhenInUsePermission: 'Allow Noor to access your location to show accurate prayer times for your city.' }],
    ],
    experiments: { typedRoutes: true },
    extra: {
      router: {},
      eas: { projectId: '56390f40-dd1a-46a6-9984-2d1152979496' },
      // Expose OAuth config through Constants.expoConfig.extra
      oauthClientId: process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID,
      oauthRedirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
      oauthEndpoint: process.env.EXPO_PUBLIC_QURAN_OAUTH_ENDPOINT,
    },
  },
};
