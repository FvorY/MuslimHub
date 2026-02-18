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
    latitude?: number;
    longitude?: number;
}

const STORAGE_KEY_PRAYER_TIMES = 'muslimhub_prayer_times';
const MAX_CACHE_DISTANCE_KM = 10;

function normalizeTime(value: string): string {
    const match = value?.match(/(\d{1,2}):(\d{1,2})/);
    if (!match) return value;

    const hour = match[1].padStart(2, '0');
    const minute = match[2].padStart(2, '0');
    return `${hour}:${minute}`;
}

function toRadians(value: number): number {
    return (value * Math.PI) / 180;
}

function distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

export const PrayerTimeService = {
    async getPrayerTimes(lat: number, lng: number, options?: { force?: boolean }): Promise<PrayerTimes | null> {
        // 1. Check cache for today
        const today = new Date().toISOString().split('T')[0];
        const cached = await StorageService.get<PrayerTimes>(STORAGE_KEY_PRAYER_TIMES);
        if (!options?.force && cached && cached.date === today) {
            if (
                typeof cached.latitude === 'number' &&
                typeof cached.longitude === 'number'
            ) {
                const distance = distanceInKm(lat, lng, cached.latitude, cached.longitude);
                if (distance <= MAX_CACHE_DISTANCE_KM) {
                    return cached;
                }
            }
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
                subuh: normalizeTime(timings.Fajr),
                dzuhur: normalizeTime(timings.Dhuhr),
                ashar: normalizeTime(timings.Asr),
                maghrib: normalizeTime(timings.Maghrib),
                isya: normalizeTime(timings.Isha),
                imsyak: normalizeTime(timings.Imsak),
                date: today,
                city: 'Auto Detected',
                latitude: lat,
                longitude: lng
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
