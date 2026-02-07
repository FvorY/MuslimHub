import axios from 'axios';
import { StorageService } from '@/shared/services/storage';

const API_BASE = 'https://equran.id/api/v2';
const CACHE_KEY_SURAHS = 'quran_surah_list';
const CACHE_KEY_SURAH_DETAIL_PREFIX = 'quran_surah_';

export interface Surah {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
    tempatTurun: string;
    arti: string;
    deskripsi: string;
    audioFull: any;
}

export interface Ayah {
    nomorAyat: number;
    teksArab: string;
    teksLatin: string;
    teksIndonesia: string;
    audio: any;
}

export interface SurahDetail extends Surah {
    ayat: Ayah[];
    nextSurat: any;
    prevSurat: any;
}

export const QuranService = {
    async getSurahList(forceRefresh = false): Promise<Surah[]> {
        if (!forceRefresh) {
            const cached = await StorageService.get<Surah[]>(CACHE_KEY_SURAHS);
            if (cached) return cached;
        }

        try {
            const response = await axios.get(`${API_BASE}/surat`);
            if (response.data.code === 200) {
                const list = response.data.data;
                await StorageService.set(CACHE_KEY_SURAHS, list);
                return list;
            }
            return [];
        } catch (e) {
            console.error('Quran List Error', e);
            // Return cache if available even if forceRefresh failed
            const cached = await StorageService.get<Surah[]>(CACHE_KEY_SURAHS);
            return cached || [];
        }
    },

    async getSurahDetail(nomor: number): Promise<SurahDetail | null> {
        const key = `${CACHE_KEY_SURAH_DETAIL_PREFIX}${nomor}`;

        try {
            const response = await axios.get(`${API_BASE}/surat/${nomor}`);
            if (response.data.code === 200) {
                const detail = response.data.data;
                await StorageService.set(key, detail);
                return detail;
            }
        } catch (e) {
            console.error('Quran Detail Error', e);
        }

        // Fallback to cache if API fails or is offline
        const cached = await StorageService.get<SurahDetail>(key);
        return cached || null;
    },

    async isSurahCached(nomor: number): Promise<boolean> {
        const key = `${CACHE_KEY_SURAH_DETAIL_PREFIX}${nomor}`;
        const cached = await StorageService.get(key);
        return !!cached;
    },

    async cacheSurahDetail(nomor: number): Promise<boolean> {
        try {
            const response = await axios.get(`${API_BASE}/surat/${nomor}`);
            if (response.data.code === 200) {
                const detail = response.data.data;
                const key = `${CACHE_KEY_SURAH_DETAIL_PREFIX}${nomor}`;
                await StorageService.set(key, detail);
                return true;
            }
        } catch (e) {
            console.error(`Error caching surah ${nomor}`, e);
        }
        return false;
    },

    async getRandomAyah(): Promise<{ surah: Surah, ayah: Ayah } | null> {
        try {
            const surahs = await this.getSurahList();
            if (surahs.length === 0) return null;

            const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
            const detail = await this.getSurahDetail(randomSurah.nomor);

            if (detail && detail.ayat.length > 0) {
                const randomAyah = detail.ayat[Math.floor(Math.random() * detail.ayat.length)];
                return { surah: randomSurah, ayah: randomAyah };
            }
            return null;
        } catch (e) {
            console.error('Get Random Ayah Error', e);
            return null;
        }
    }
};
