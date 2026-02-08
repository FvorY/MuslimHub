import { LocalNotifications } from '@capacitor/local-notifications';

export type PrayerTime = {
  name: string;
  time: string; // HH:mm
};

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTime[],
  options?: {
    enableImsyak?: boolean;
    imsyakTime?: string;
  }
) {
  // 1️⃣ Permission
  const permStatus = await LocalNotifications.checkPermissions();
  if (permStatus.display !== 'granted') {
    await LocalNotifications.requestPermissions();
  }

  // 2️⃣ Hapus notif lama
  // Correctly get pending notifications to cancel them
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }

  const today = new Date();
  const now = new Date();
  const notifications: any[] = [];
  let notifId = 1;

  // 3️⃣ Schedule sholat
  for (const prayer of prayerTimes) {
    if (!prayer.time) continue;
    
    const [hour, minute] = prayer.time.split(':').map(Number);

    const scheduleAt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hour,
      minute,
      0
    );

    // Only schedule if time hasn't passed yet today
    if (scheduleAt <= now) continue;

    notifications.push({
      id: notifId++,
      title: `Waktu Sholat ${prayer.name}`,
      body: `Mari tunaikan sholat ${prayer.name}`,
      channelId:
        prayer.name === 'Subuh'
          ? 'subuh_notifications'
          : 'prayer_notifications',
      schedule: {
        at: scheduleAt,
        allowWhileIdle: true
      },
      sound: prayer.name === 'Subuh' ? 'adzan_subuh.mp3' : 'adzan.mp3'
    });
  }

  // 4️⃣ Optional: Imsyak
  if (options?.enableImsyak && options.imsyakTime) {
    const [h, m] = options.imsyakTime.split(':').map(Number);

    const imsyakAt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      h,
      m,
      0
    );

    if (imsyakAt > now) {
      notifications.push({
        id: notifId++,
        title: 'Imsyak',
        body: 'Waktu imsyak telah tiba',
        channelId: 'imsyak_notifications',
        schedule: {
          at: imsyakAt,
          allowWhileIdle: true
        },
        sound: 'adzan.mp3' // Fallback
      });
    }
  }

  // 5️⃣ Schedule ke OS
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
    console.log(`Scheduled ${notifications.length} notifications`);
  } else {
    console.log('No notifications to schedule for today (all times passed)');
  }

  // 6️⃣ Simpan tanggal schedule
  localStorage.setItem('last_prayer_schedule', today.toDateString());
}
