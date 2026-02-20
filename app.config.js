export default {
  expo: {
    name: 'Scaffld',
    slug: 'scaffld',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    // Disabled: Stripe Terminal SDK does not yet support New Architecture (github.com/stripe/stripe-terminal-react-native/issues/848)
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0C1220',
    },
    scheme: 'scaffld',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'app.scaffld.mobile',
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Scaffld uses your location to plan routes and track job check-ins.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Scaffld uses background location for geofencing alerts when you arrive at or leave job sites.',
        NSCameraUsageDescription:
          'Scaffld uses your camera to take photos of job sites and completed work.',
        NSPhotoLibraryUsageDescription:
          'Scaffld accesses your photos to attach images to jobs and quotes.',
        NSContactsUsageDescription:
          'Scaffld accesses your contacts to quickly import client information.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0C1220',
      },
      package: 'app.scaffld.mobile',
      versionCode: 1,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'CAMERA',
        'READ_CONTACTS',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'NFC',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.0',
          },
        },
      ],
      [
        '@stripe/stripe-terminal-react-native',
        {
          bluetoothBackgroundMode: true,
          locationWhenInUsePermission:
            'Location access is required to accept in-person payments.',
        },
      ],
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Scaffld uses your location in the background to auto-start timers when you arrive at job sites.',
          locationWhenInUsePermission:
            'Scaffld uses your location to plan routes and track job check-ins.',
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Scaffld accesses your photos to attach images to jobs and quotes.',
          cameraPermission: 'Scaffld uses your camera to take photos of job sites and completed work.',
        },
      ],
      [
        'expo-notifications',
        {
          color: '#0EA5A0',
          sounds: [],
        },
      ],
      [
        'expo-contacts',
        {
          contactsPermission: 'Scaffld accesses your contacts to quickly import client information.',
        },
      ],
      'expo-secure-store',
      '@react-native-community/datetimepicker',
      'expo-quick-actions',
    ],
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      },
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      functionsBaseUrl: process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  },
};
