
// This file is required for the background runner to work.
// It must be placed in the `android/app/src/main/assets` directory.

addEventListener('fetch-prayer-times', async (resolve, reject, args) => {
  try {
    // We need to dynamically import the services here
    const { GeolocationService } = await import('./src/shared/services/geolocation');
    const { PrayerTimeService } = await import('./src/modules/worship/services/prayer-times');
    const { NotificationService } = await import('./src/shared/services/notification');

    const pos = await GeolocationService.getCurrentPosition();
    const times = await PrayerTimeService.getPrayerTimes(pos.coords.latitude, pos.coords.longitude);
    if (times) {
      await NotificationService.updatePrayerNotifications(times);
    }
    resolve();
  } catch (e) {
    console.error('Background task failed', e);
    reject(e);
  }
});
