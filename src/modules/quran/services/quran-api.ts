import axios from 'axios';
import { StorageService } from '@/shared/services/storage';

const API_BASE = 'https://quran-api.santrikoding.com/api/surah';
const CACHE_KEY_SURAHS = 'quran_surah_list';
const CACHE_KEY_SURAH_DETAIL_PREFIX = 'quran_surah_';

const sanitizeDescription = (input: unknown): string => {
    const text = String(input ?? '');
    return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();
};

const sanitizeVerseText = (input: unknown): string => {
    const text = String(input ?? '');
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();
};

const normalizeAudioUrl = (input: unknown): string => {
    if (typeof input !== 'string') return '';

    const url = input.trim();
    if (!url) return '';

    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    if (url.startsWith('http://')) {
        return `https://${url.slice('http://'.length)}`;
    }

    return url;
};

const normalizeAudioValue = (input: unknown): unknown => {
    if (typeof input === 'string') {
        return normalizeAudioUrl(input);
    }

    if (input && typeof input === 'object') {
        const record = input as Record<string, unknown>;
        return Object.fromEntries(
            Object.entries(record).map(([key, value]) => [key, typeof value === 'string' ? normalizeAudioUrl(value) : value])
        );
    }

    return input;
};

const pickAudioUrlFromObject = (input: Record<string, unknown>): string => {
    const preferredKeys = ['05', '5', '01', '1', 'url', 'src', 'audio'];

    for (const key of preferredKeys) {
        const value = normalizeAudioUrl(input[key]);
        if (value) return value;
    }

    for (const value of Object.values(input)) {
        if (typeof value === 'string') {
            const url = normalizeAudioUrl(value);
            if (url) return url;
            continue;
        }

        if (value && typeof value === 'object') {
            const nested = pickAudioUrlFromObject(value as Record<string, unknown>);
            if (nested) return nested;
        }
    }

    return '';
};

const resolveAudioUrl = (input: unknown): string => {
    if (typeof input === 'string') {
        return normalizeAudioUrl(input);
    }

    if (input && typeof input === 'object') {
        return pickAudioUrlFromObject(input as Record<string, unknown>);
    }

    return '';
};

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

const extractPayload = <T>(payload: unknown): T => {
    if (Array.isArray(payload) || (payload && typeof payload === 'object' && !('data' in (payload as Record<string, unknown>)))) {
        return payload as T;
    }

    return ((payload as { data?: T })?.data ?? payload) as T;
};

const mapSurah = (raw: Record<string, any>): Surah => ({
    nomor: Number(raw.nomor ?? 0),
    nama: String(raw.nama ?? ''),
    namaLatin: String(raw.nama_latin ?? raw.namaLatin ?? ''),
    jumlahAyat: Number(raw.jumlah_ayat ?? raw.jumlahAyat ?? 0),
    tempatTurun: String(raw.tempat_turun ?? raw.tempatTurun ?? ''),
    arti: String(raw.arti ?? ''),
    deskripsi: sanitizeDescription(raw.deskripsi),
    audioFull: normalizeAudioValue(raw.audio ?? raw.audioFull ?? null),
});

const mapAyah = (raw: Record<string, any>): Ayah => ({
    nomorAyat: Number(raw.nomor ?? raw.nomorAyat ?? raw.ayat ?? 0),
    teksArab: String(raw.ar ?? raw.teksArab ?? raw.arab ?? ''),
    teksLatin: sanitizeVerseText(raw.tr ?? raw.teksLatin ?? raw.latin ?? ''),
    teksIndonesia: sanitizeVerseText(raw.idn ?? raw.teksIndonesia ?? raw.terjemahan ?? ''),
    audio: normalizeAudioValue(raw.audio ?? raw.audioFull ?? null),
});

export const getAyahAudioUrl = (ayah: Pick<Ayah, 'audio'>): string => resolveAudioUrl(ayah.audio);

export const getSurahAudioUrl = (surah: Pick<Surah, 'audioFull'>): string => resolveAudioUrl(surah.audioFull);

const mapSurahDetail = (raw: Record<string, any>): SurahDetail => {
    const ayatRaw = Array.isArray(raw.ayat) ? raw.ayat : [];
    return {
        ...mapSurah(raw),
        ayat: ayatRaw.map((item: Record<string, any>) => mapAyah(item)),
        nextSurat: raw.nextSurat ?? null,
        prevSurat: raw.prevSurat ?? null,
    };
};

const sanitizeSurahDetail = (detail: SurahDetail): SurahDetail => ({
    ...detail,
    deskripsi: sanitizeDescription(detail.deskripsi),
    ayat: Array.isArray(detail.ayat)
        ? detail.ayat.map((ayah) => ({
            ...ayah,
            teksLatin: sanitizeVerseText(ayah.teksLatin),
            teksIndonesia: sanitizeVerseText(ayah.teksIndonesia),
        }))
        : [],
});

export const QuranService = {
    async getSurahList(forceRefresh = false): Promise<Surah[]> {
        if (!forceRefresh) {
            const cached = await StorageService.get<Surah[]>(CACHE_KEY_SURAHS);
            if (cached) return cached.map((item) => ({ ...item, deskripsi: sanitizeDescription(item.deskripsi) }));
        }

        try {
            const response = await axios.get(API_BASE);
            const payload = extractPayload<Record<string, any>[]>(response.data);
            const list = Array.isArray(payload) ? payload.map(mapSurah) : [];
            await StorageService.set(CACHE_KEY_SURAHS, list);
            return list;
        } catch (e) {
            console.error('Quran List Error', e);
            // Return cache if available even if forceRefresh failed
            const cached = await StorageService.get<Surah[]>(CACHE_KEY_SURAHS);
            return cached ? cached.map((item) => ({ ...item, deskripsi: sanitizeDescription(item.deskripsi) })) : [];
        }
    },

    async getSurahDetail(nomor: number): Promise<SurahDetail | null> {
        const key = `${CACHE_KEY_SURAH_DETAIL_PREFIX}${nomor}`;

        try {
            const response = await axios.get(`${API_BASE}/${nomor}`);
            const payload = extractPayload<Record<string, any>>(response.data);
            const detail = mapSurahDetail(payload);
            await StorageService.set(key, detail);
            return detail;
        } catch (e) {
            console.error('Quran Detail Error', e);
        }

        // Fallback to cache if API fails or is offline
        const cached = await StorageService.get<SurahDetail>(key);
        return cached ? sanitizeSurahDetail(cached) : null;
    },

    async isSurahCached(nomor: number): Promise<boolean> {
        const key = `${CACHE_KEY_SURAH_DETAIL_PREFIX}${nomor}`;
        const cached = await StorageService.get(key);
        return !!cached;
    },

    async cacheSurahDetail(nomor: number): Promise<boolean> {
        try {
            const response = await axios.get(`${API_BASE}/${nomor}`);
            const payload = extractPayload<Record<string, any>>(response.data);
            const detail = mapSurahDetail(payload);
            const key = `${CACHE_KEY_SURAH_DETAIL_PREFIX}${nomor}`;
            await StorageService.set(key, detail);
            return true;
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
