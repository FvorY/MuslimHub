
addEventListener('fetch', async (resolve, reject, args) => {
  try {
    const { PrayerTimeService } = await import('./modules/worship/services/prayer-times');
    const { NotificationService } = await import('./shared/services/notification');
    const { GeolocationService } = await import('./shared/services/geolocation');
    const { Preferences } = await import('@capacitor/preferences');

    const { value: reminderEnabled } = await Preferences.get({ key: 'prayerReminder' });

    if (reminderEnabled === 'true') {
      const pos = await GeolocationService.getCurrentPosition().catch(() => null);
      if (pos) {
        const times = await PrayerTimeService.getPrayerTimes(pos.coords.latitude, pos.coords.longitude);
        if (times) {
          await NotificationService.updatePrayerNotifications(times);
          console.log('Prayer notifications refreshed in background');
        }
      }
    }
    resolve();
  } catch (error) {
    console.error('Background fetch failed:', error);
    reject(error);
  }
});
