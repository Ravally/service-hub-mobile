export default {
  expo: {
    name: 'Trellio',
    slug: 'trellio',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0C1220',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'app.trellio.mobile',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Trellio uses your location to track clock-in/out for jobs.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Trellio tracks your location during active jobs for GPS logging.',
        NSCameraUsageDescription:
          'Trellio uses the camera for job photos and form submissions.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0C1220',
      },
      package: 'app.trellio.mobile',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      [
        'expo-image-picker',
        {
          photosPermission: 'Trellio uses your photos for job documentation.',
          cameraPermission: 'Trellio uses the camera for job photos and form submissions.',
        },
      ],
      [
        'expo-notifications',
        {
          color: '#0EA5A0',
          sounds: [],
        },
      ],
    ],
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
  },
};
