import { LocalNotifications } from '@capacitor/local-notifications';

export type PrayerTime = {
  name: string;
  time: string; // HH:mm
};

function parseTime(time: string): { hour: number; minute: number } | null {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

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
    const requestStatus = await LocalNotifications.requestPermissions();
    if (requestStatus.display !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }
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
    const parsedTime = parseTime(prayer.time);
    if (!parsedTime) {
      console.warn(`Invalid prayer time format for ${prayer.name}:`, prayer.time);
      continue;
    }

    const scheduleAt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      parsedTime.hour,
      parsedTime.minute,
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
    const parsedImsyak = parseTime(options.imsyakTime);
    if (!parsedImsyak) {
      console.warn('Invalid imsyak time format:', options.imsyakTime);
    } else {

      const imsyakAt = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parsedImsyak.hour,
        parsedImsyak.minute,
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
  }

  // 5️⃣ Schedule ke OS
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
    console.log(`Scheduled ${notifications.length} notifications`);
  } else {
    console.log('No notifications to schedule for today (all times passed)');
  }

}
