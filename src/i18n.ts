import { createI18n } from 'vue-i18n';

const messages = {
    en: {
        tabs: {
            home: 'Home',
            worship: 'Worship',
            quran: 'Quran',
            tools: 'Tools',
            settings: 'Settings'
        },
        common: {
            loading: 'Loading...',
            error: 'An error occurred',
            back_again_to_exit: 'Press back again to exit MuslimHub'
        },
        home: {
            greeting: "Assalamu'alaikum",
            next_prayer: 'Next Prayer',
            prayer_times: 'Prayer Times',
            dzikir: 'Dzikir',
            qibla: 'Qibla',
            imminent: 'is coming soon',
            now: 'is now'
        },
        prayers: {
            subuh: 'Subuh',
            dzuhur: 'Dzuhur',
            ashar: 'Ashar',
            maghrib: 'Maghrib',
            isya: 'Isya'
        },
        tools: {
            zakat_calculator: 'Zakat Calculator',
            ramadan_companion: 'Ramadan Companion',
            income: 'Income',
            gold_silver: 'Gold/Silver',
            calculate: 'Calculate',
            result: 'Result'
        },
        settings: {
            dark_mode: 'Dark Mode',
            language: 'Language',
            about: 'About',
            general: 'General',
            prayer_reminder: 'Prayer Reminder'
        }
    },
    id: {
        tabs: {
            home: 'Beranda',
            worship: 'Ibadah',
            quran: 'Al-Quran',
            tools: 'Alat',
            settings: 'Pengaturan'
        },
        common: {
            loading: 'Memuat...',
            error: 'Terjadi kesalahan',
            back_again_to_exit: 'Tekan kembali lagi untuk keluar dari MuslimHub'
        },
        home: {
            greeting: "Assalamu'alaikum",
            next_prayer: 'Shalat Berikutnya',
            prayer_times: 'Jadwal Shalat',
            dzikir: 'Dzikir',
            qibla: 'Kiblat',
            imminent: 'sebentar lagi',
            now: 'sekarang'
        },
        prayers: {
            subuh: 'Subuh',
            dzuhur: 'Dzuhur',
            ashar: 'Ashar',
            maghrib: 'Maghrib',
            isya: 'Isyak'
        },
        tools: {
            zakat_calculator: 'Kalkulator Zakat',
            ramadan_companion: 'Panduan Ramadan',
            income: 'Pendapatan',
            gold_silver: 'Emas/Perak',
            calculate: 'Hitung',
            result: 'Hasil'
        },
        settings: {
            dark_mode: 'Mode Gelap',
            language: 'Bahasa',
            about: 'Tentang',
            general: 'Umum',
            prayer_reminder: 'Ingatkan Sholat'
        }
    }
};

const i18n = createI18n({
    legacy: false,
    locale: 'id', // Default to Indonesian as per target audience context? Or maybe EN. Let's start with ID based on "MuslimHub" context usually being strong in ID, but USER said "Bilingual". Let's stick to 'en' or 'id' as default. User didn't specify default, but I'll pick 'id' as it feels more native for "equran.id" usage.
    fallbackLocale: 'en',
    messages
});

export default i18n;
