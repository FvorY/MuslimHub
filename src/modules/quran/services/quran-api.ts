import axios from 'axios';
import { StorageService } from '@/shared/services/storage';

const API_BASE = 'https://quran-api.santrikoding.com/api/surah';
const CACHE_KEY_SURAHS = 'quran_surah_list';
const CACHE_KEY_SURAH_DETAIL_PREFIX = 'quran_surah_';

// Fallback audio sources (Quran.com CDN - ar.alafasy)
const CDN_AYAH_AUDIO_BASE = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy';
const CDN_SURAH_AUDIO_BASE = 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy';

// Ayah counts per surah (1-indexed). Used to compute global ayah numbers
// for the Quran.com CDN fallback when the primary API does not provide
// verse-level audio (e.g., santrikoding response only has surah audio).
const SURAH_AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
    110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
    83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
    78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
    56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
    11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

// Pre-compute start index (0-based) for each surah in global ayah numbering
const SURAH_AYAH_OFFSETS: number[] = [];
for (let i = 0; i < SURAH_AYAH_COUNTS.length; i += 1) {
    const prev = i === 0 ? 0 : SURAH_AYAH_OFFSETS[i - 1] + SURAH_AYAH_COUNTS[i - 1];
    SURAH_AYAH_OFFSETS.push(prev);
}

const getGlobalAyahNumber = (surahNumber: number, ayahNumber: number): number | null => {
    if (
        !Number.isInteger(surahNumber) ||
        !Number.isInteger(ayahNumber) ||
        surahNumber < 1 ||
        surahNumber > SURAH_AYAH_COUNTS.length ||
        ayahNumber < 1 ||
        ayahNumber > SURAH_AYAH_COUNTS[surahNumber - 1]
    ) {
        return null;
    }

    return SURAH_AYAH_OFFSETS[surahNumber - 1] + ayahNumber;
};

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

export const getAyahAudioUrl = (
    ayah: Pick<Ayah, 'audio' | 'nomorAyat'>,
    surahNumber?: number
): string => {
    const primary = resolveAudioUrl(ayah.audio);
    if (primary) return primary;

    // Fallback: Quran.com CDN uses global ayah numbering (1-6236)
    if (surahNumber) {
        const globalAyah = getGlobalAyahNumber(surahNumber, ayah.nomorAyat);
        if (globalAyah) {
            return `${CDN_AYAH_AUDIO_BASE}/${globalAyah}.mp3`;
        }
    }

    return '';
};

export const getSurahAudioUrl = (surah: Pick<Surah, 'audioFull' | 'nomor'>): string => {
    const primary = resolveAudioUrl(surah.audioFull);
    if (primary) return primary;

    // Fallback: Quran.com CDN surah-level audio (1-114)
    if (surah.nomor && surah.nomor >= 1 && surah.nomor <= 114) {
        return `${CDN_SURAH_AUDIO_BASE}/${surah.nomor}.mp3`;
    }

    return '';
};

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
