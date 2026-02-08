import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const NotificationChannelService = {
  async init() {
    if (Capacitor.getPlatform() !== 'android') return;

    // Subuh
    await LocalNotifications.createChannel({
      id: 'subuh_notifications',
      name: 'Subuh Prayer',
      description: 'Subuh prayer notifications',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'adzan_subuh.mp3'
    });

    // Sholat lainnya
    await LocalNotifications.createChannel({
      id: 'prayer_notifications',
      name: 'Prayer Times',
      description: 'Daily prayer notifications',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'adzan.mp3'
    });

    // Imsyak
    await LocalNotifications.createChannel({
      id: 'imsyak_notifications',
      name: 'Imsyak',
      description: 'Imsyak reminder',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: 'adzan.mp3' // Fallback since notification.wav is missing
    });
  }
};
