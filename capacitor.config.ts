import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muslimhub.app',
  appName: 'MuslimHub',
  webDir: 'dist',
  plugins: {
    BackgroundRunner: {
      label: 'com.muslimhub.app.background.task',
      src: 'background.js',
      event: 'fetch-prayer-times',
      repeat: true,
      interval: 3600,
      autoStart: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#10b981",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "notification.wav",
      schedule: {
        allowWhileIdle: true,
        exact: true
      }
    }
  }
};

export default config;
