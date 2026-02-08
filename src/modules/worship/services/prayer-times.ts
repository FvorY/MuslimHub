import { StorageService } from '@/shared/services/storage';
import axios from 'axios';
import { LocationCacheService } from '@/shared/services/location-cache';

export interface PrayerTimes {
    subuh: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
    imsyak: string;
    date: string;
    city?: string; // City name
}

const STORAGE_KEY_PRAYER_TIMES = 'muslimhub_prayer_times';

export const PrayerTimeService = {
    async getPrayerTimes(lat: number, lng: number): Promise<PrayerTimes | null> {
        // 1. Check cache for today
        const today = new Date().toISOString().split('T')[0];
        const cached = await StorageService.get<PrayerTimes>(STORAGE_KEY_PRAYER_TIMES);
        if (cached && cached.date === today) {
            return cached;
        }

        // 2. Fetch Online
        try {
            const response = await axios.get('https://api.aladhan.com/v1/timings', {
                params: {
                    latitude: lat,
                    longitude: lng,
                    method: 20 // Kemenag RI is usually method 20 or similar.
                }
            });

            const timings = response.data.data.timings;
            const result: PrayerTimes = {
                subuh: timings.Fajr,
                dzuhur: timings.Dhuhr,
                ashar: timings.Asr,
                maghrib: timings.Maghrib,
                isya: timings.Isha,
                imsyak: timings.Imsak,
                date: today,
                city: 'Auto Detected'
            };

            await StorageService.set(STORAGE_KEY_PRAYER_TIMES, result);
            
            // Cache lokasi dengan nama kota
            await LocationCacheService.setCachedLocation(lat, lng, result.city);
            
            return result;

        } catch (e) {
            console.error('Error fetching prayer times', e);
            return cached || null; // Return cached even if old if offline
        }
    },

    async getNextPrayer(times: PrayerTimes): Promise<{ name: string, time: string, remaining: number } | null> {
        const now = new Date();
        const timeToDate = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
        };

        const prayers = [
            { name: 'Subuh', time: times.subuh, date: timeToDate(times.subuh) },
            { name: 'Dzuhur', time: times.dzuhur, date: timeToDate(times.dzuhur) },
            { name: 'Ashar', time: times.ashar, date: timeToDate(times.ashar) },
            { name: 'Maghrib', time: times.maghrib, date: timeToDate(times.maghrib) },
            { name: 'Isya', time: times.isya, date: timeToDate(times.isya) }
        ];

        for (const p of prayers) {
            if (p.date > now) {
                return {
                    name: p.name,
                    time: p.time,
                    remaining: Math.floor((p.date.getTime() - now.getTime()) / 1000)
                };
            }
        }

        // If all passed, next is Subuh tomorrow
        return { name: 'Subuh', time: times.subuh, remaining: 0 };
    }
};
