import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { StorageService } from '@/shared/services/storage';

const API_BASE = 'https://islamicapi.com/api';
const API_KEY = 'ZX6Xk9eBmbZfP0FBVVkMi3dcZBnqZnSaTDoTs1D4Fj4PLtZ5';
const CACHE_KEY_ASMAUL_HUSNA = 'asmaul_husna_data';
const CACHE_KEY_ASMAUL_HUSNA_OFFLINE = 'asmaul_husna_offline_data';

export interface AsmaulHusnaItem {
    id: number;
    arabic: string;
    transliteration: string;
    translation: {
        en: string;
        id: string;
    };
    meaning: {
        en: string;
        id: string;
    };
    audio: {
        individual: string;
        full: string;
    };
}

export interface AsmaulHusnaResponse {
    data: AsmaulHusnaItem[];
    count: number;
}

interface IslamicApiAsmaulHusnaItem {
    number: number;
    name: string;
    transliteration: string;
    translation: string;
    meaning: string;
    audio: string;
}

interface IslamicApiAsmaulHusnaListResponse {
    code: number;
    status: string;
    data: {
        names: IslamicApiAsmaulHusnaItem[];
    };
}

// Helper function to convert transliteration to URL format
const transliterationToUrlFormat = (transliteration: string): string => {
    return transliteration
        .toLowerCase()                    // Convert to lowercase
        .replace(/^(al-|ar-|as-|ad-|an-|am-|at-|az-|ash-|asr-|adl-|adn-|amn-|amr-|anz-|arz-|ash-sh-|ad-d-|ar-r-|as-s-|at-t-|az-z-|al-l-)/, '') // Remove Arabic prefixes
        .replace(/[^a-z]/g, '');          // Remove any non-alphabetic characters
};

const canUseOnlineApi = (): boolean => {
    if (typeof window === 'undefined') {
        return true;
    }
    try {
        if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
            return true;
        }
    } catch {
        return false;
    }
    return false;
};

// Offline data structure for Asmaul Husna with Indo/English translations
const ASMAUL_HUSNA_OFFLINE_DATA: AsmaulHusnaItem[] = [
    {
        id: 1,
        arabic: "الرَّحْمَنُ",
        transliteration: "Ar-Rahman",
        translation: {
            en: "The Most Gracious",
            id: "Yang Maha Pengasih"
        },
        meaning: {
            en: "The One who continually showers all of creation with blessings and prosperity without any disparity.",
            id: "Yang senantiasa melimpahkan berkah dan kemakmuran kepada seluruh makhluk tanpa perbedaan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/rahman.mp3",
            full: ""
        }
    },
    {
        id: 2,
        arabic: "الرَّحِيمُ",
        transliteration: "Ar-Rahim",
        translation: {
            en: "The Most Merciful",
            id: "Yang Maha Penyayang"
        },
        meaning: {
            en: "The One who gives mercy to those who deserve it.",
            id: "Yang memberikan rahmat kepada orang-orang yang berhak menerimanya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/rahim.mp3",
            full: ""
        }
    },
    {
        id: 3,
        arabic: "الْمَلِكُ",
        transliteration: "Al-Malik",
        translation: {
            en: "The King and Owner of Dominion",
            id: "Yang Maha Merajai"
        },
        meaning: {
            en: "The One who owns and rules all of creation.",
            id: "Yang memiliki dan menguasai seluruh alam semesta."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/malik.mp3",
            full: ""
        }
    },
    {
        id: 4,
        arabic: "الْقُدُّوسُ",
        transliteration: "Al-Quddus",
        translation: {
            en: "The Absolutely Pure",
            id: "Yang Maha Suci"
        },
        meaning: {
            en: "The One who is free from all imperfections and defects.",
            id: "Yang bersih dari segala kekurangan dan cacat."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/quddus.mp3",
            full: ""
        }
    },
    {
        id: 5,
        arabic: "السَّلَامُ",
        transliteration: "As-Salam",
        translation: {
            en: "The Perfection and Giver of Peace",
            id: "Yang Maha Memberi Kesejahteraan"
        },
        meaning: {
            en: "The One who is perfect and gives peace and safety.",
            id: "Yang sempurna dan memberi keamanan serta keselamatan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/salam.mp3",
            full: ""
        }
    },
    {
        id: 6,
        arabic: "الْمُؤْمِنُ",
        transliteration: "Al-Mu'min",
        translation: {
            en: "The One Who Gives Emaan and Security",
            id: "Yang Maha Memberi Keamanan"
        },
        meaning: {
            en: "The One who gives faith and security to the believers.",
            id: "Yang memberikan keimanan dan keamanan kepada orang-orang beriman."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mumin.mp3",
            full: ""
        }
    },
    {
        id: 7,
        arabic: "الْمُهَيْمِنُ",
        transliteration: "Al-Muhaymin",
        translation: {
            en: "The Guardian, The Witness",
            id: "Yang Maha Mengawasi"
        },
        meaning: {
            en: "The One who watches over and protects all of creation.",
            id: "Yang mengawasi dan melindungi seluruh makhluk."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muhaimin.mp3",
            full: ""
        }
    },
    {
        id: 8,
        arabic: "الْعَزِيزُ",
        transliteration: "Al-Aziz",
        translation: {
            en: "The All Mighty",
            id: "Yang Maha Perkasa"
        },
        meaning: {
            en: "The One who is mighty and powerful, and cannot be overcome.",
            id: "Yang mempunyai kekuasaan dan tidak dapat dikalahkan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/aziz.mp3",
            full: ""
        }
    },
    {
        id: 9,
        arabic: "الْجَبَّارُ",
        transliteration: "Al-Jabbar",
        translation: {
            en: "The Compeller, The All-Compelling",
            id: "Yang Maha Mengalahkan"
        },
        meaning: {
            en: "The One who compels and repairs all broken things.",
            id: "Yang menundukkan dan memperbaiki segala yang rusak."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/jabbar.mp3",
            full: ""
        }
    },
    {
        id: 10,
        arabic: "الْمُتَكَبِّرُ",
        transliteration: "Al-Mutakabbir",
        translation: {
            en: "The Supremely Great",
            id: "Yang Maha Megah"
        },
        meaning: {
            en: "The One who is greater than all of creation.",
            id: "Yang lebih agung dari segala makhluk."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mutakabbir.mp3",
            full: ""
        }
    },
    {
        id: 11,
        arabic: "الْخَالِقُ",
        transliteration: "Al-Khaliq",
        translation: {
            en: "The Creator",
            id: "Yang Maha Pencipta"
        },
        meaning: {
            en: "The One who creates everything from nothing with perfect wisdom.",
            id: "Yang menciptakan segala sesuatu dari tiada dengan penuh hikmah."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/khaliq.mp3",
            full: ""
        }
    },
    {
        id: 12,
        arabic: "الْبَارِئُ",
        transliteration: "Al-Bari'",
        translation: {
            en: "The Originator",
            id: "Yang Maha Membuat"
        },
        meaning: {
            en: "The One who brings creation into existence in due proportion.",
            id: "Yang mengadakan makhluk sesuai ukuran dan ketentuan-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/bari.mp3",
            full: ""
        }
    },
    {
        id: 13,
        arabic: "الْمُصَوِّرُ",
        transliteration: "Al-Musawwir",
        translation: {
            en: "The Fashioner",
            id: "Yang Maha Membentuk"
        },
        meaning: {
            en: "The One who gives everything its distinct shape and form.",
            id: "Yang memberi setiap makhluk rupa dan bentuk yang unik."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/musawwir.mp3",
            full: ""
        }
    },
    {
        id: 14,
        arabic: "الْغَفَّارُ",
        transliteration: "Al-Ghaffar",
        translation: {
            en: "The Oft-Forgiving",
            id: "Yang Maha Pengampun"
        },
        meaning: {
            en: "The One who forgives again and again those who return to Him.",
            id: "Yang berulang kali mengampuni hamba yang bertaubat."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/ghaffar.mp3",
            full: ""
        }
    },
    {
        id: 15,
        arabic: "الْقَهَّارُ",
        transliteration: "Al-Qahhar",
        translation: {
            en: "The Subduer",
            id: "Yang Maha Mengalahkan"
        },
        meaning: {
            en: "The One who has absolute power and subdues all of His creation.",
            id: "Yang memiliki kekuasaan mutlak dan menundukkan seluruh makhluk."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/qahhar.mp3",
            full: ""
        }
    },
    {
        id: 16,
        arabic: "الْوَهَّابُ",
        transliteration: "Al-Wahhab",
        translation: {
            en: "The Bestower",
            id: "Yang Maha Pemberi"
        },
        meaning: {
            en: "The One who gives generously without expecting any return.",
            id: "Yang memberi karunia tanpa mengharap balasan dari makhluk."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/wahhab.mp3",
            full: ""
        }
    },
    {
        id: 17,
        arabic: "الرَّزَّاقُ",
        transliteration: "Ar-Razzaq",
        translation: {
            en: "The Provider",
            id: "Yang Maha Pemberi Rezeki"
        },
        meaning: {
            en: "The One who provides sustenance to all of His creation.",
            id: "Yang memberi rezeki kepada seluruh makhluk dalam berbagai bentuk."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/razzaq.mp3",
            full: ""
        }
    },
    {
        id: 18,
        arabic: "الْفَتَّاحُ",
        transliteration: "Al-Fattah",
        translation: {
            en: "The Opener",
            id: "Yang Maha Membuka"
        },
        meaning: {
            en: "The One who opens the doors of mercy, sustenance, and knowledge.",
            id: "Yang membuka pintu rahmat, rezeki, dan ilmu bagi hamba-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/fattah.mp3",
            full: ""
        }
    },
    {
        id: 19,
        arabic: "اَلْعَلِيْمُ",
        transliteration: "Al-Alim",
        translation: {
            en: "The All-Knowing",
            id: "Yang Maha Mengetahui"
        },
        meaning: {
            en: "The One whose knowledge encompasses everything, past, present, and future.",
            id: "Yang ilmu-Nya meliputi segala sesuatu, masa lalu, kini, dan akan datang."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/alim.mp3",
            full: ""
        }
    },
    {
        id: 20,
        arabic: "الْقَابِضُ",
        transliteration: "Al-Qabid",
        translation: {
            en: "The Withholder",
            id: "Yang Maha Menyempitkan"
        },
        meaning: {
            en: "The One who constricts sustenance and life as He wills with wisdom.",
            id: "Yang menyempitkan rezeki dan keadaan sesuai hikmah-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/qabid.mp3",
            full: ""
        }
    },
    {
        id: 21,
        arabic: "الْبَاسِطُ",
        transliteration: "Al-Basit",
        translation: {
            en: "The Expander",
            id: "Yang Maha Melapangkan"
        },
        meaning: {
            en: "The One who expands sustenance, mercy, and hearts.",
            id: "Yang melapangkan rezeki, rahmat, dan hati hamba-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/basit.mp3",
            full: ""
        }
    },
    {
        id: 22,
        arabic: "الْخَافِضُ",
        transliteration: "Al-Khafid",
        translation: {
            en: "The Abaser",
            id: "Yang Maha Merendahkan"
        },
        meaning: {
            en: "The One who lowers whom He wills in status and dignity.",
            id: "Yang merendahkan siapa saja yang Dia kehendaki derajatnya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/khafid.mp3",
            full: ""
        }
    },
    {
        id: 23,
        arabic: "الرَّافِعُ",
        transliteration: "Ar-Rafi'",
        translation: {
            en: "The Exalter",
            id: "Yang Maha Meninggikan"
        },
        meaning: {
            en: "The One who raises whom He wills in rank, honor, and faith.",
            id: "Yang meninggikan derajat hamba-Nya yang beriman dan taat."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/rafi.mp3",
            full: ""
        }
    },
    {
        id: 24,
        arabic: "الْمُعِزُّ",
        transliteration: "Al-Mu'izz",
        translation: {
            en: "The Honorer",
            id: "Yang Maha Memuliakan"
        },
        meaning: {
            en: "The One who grants honor and dignity to whom He wills.",
            id: "Yang memuliakan siapa saja yang Dia kehendaki dengan ketaatan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muizz.mp3",
            full: ""
        }
    },
    {
        id: 25,
        arabic: "المُذِلُّ",
        transliteration: "Al-Mudhill",
        translation: {
            en: "The Humiliator",
            id: "Yang Maha Menghinakan"
        },
        meaning: {
            en: "The One who humiliates and lowers the arrogant and disobedient.",
            id: "Yang menghinakan orang-orang yang sombong dan ingkar."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mudhill.mp3",
            full: ""
        }
    },
    {
        id: 26,
        arabic: "السَّمِيعُ",
        transliteration: "As-Sami'",
        translation: {
            en: "The All-Hearing",
            id: "Yang Maha Mendengar"
        },
        meaning: {
            en: "The One who hears every sound, spoken or unspoken.",
            id: "Yang mendengar segala suara, baik yang tampak maupun tersembunyi."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/sami.mp3",
            full: ""
        }
    },
    {
        id: 27,
        arabic: "الْبَصِيرُ",
        transliteration: "Al-Basir",
        translation: {
            en: "The All-Seeing",
            id: "Yang Maha Melihat"
        },
        meaning: {
            en: "The One who sees everything, the outward and the inward.",
            id: "Yang melihat segala sesuatu, yang tampak maupun tersembunyi."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/basir.mp3",
            full: ""
        }
    },
    {
        id: 28,
        arabic: "الْحَكَمُ",
        transliteration: "Al-Hakam",
        translation: {
            en: "The Judge",
            id: "Yang Maha Menetapkan"
        },
        meaning: {
            en: "The One who judges with perfect justice and wisdom.",
            id: "Yang menetapkan hukum dengan keadilan dan hikmah yang sempurna."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/hakam.mp3",
            full: ""
        }
    },
    {
        id: 29,
        arabic: "الْعَدْلُ",
        transliteration: "Al-Adl",
        translation: {
            en: "The Just",
            id: "Yang Maha Adil"
        },
        meaning: {
            en: "The One whose every decree and action is perfectly just.",
            id: "Yang segala ketetapan dan perbuatan-Nya penuh keadilan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/adl.mp3",
            full: ""
        }
    },
    {
        id: 30,
        arabic: "اللَّطِيفُ",
        transliteration: "Al-Latif",
        translation: {
            en: "The Subtle, The Most Gentle",
            id: "Yang Maha Lembut"
        },
        meaning: {
            en: "The One who is kind and gentle with His servants in unseen ways.",
            id: "Yang lembut dalam kasih sayang dan pengaturan-Nya kepada hamba."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/latif.mp3",
            full: ""
        }
    },
    {
        id: 31,
        arabic: "الْخَبِيرُ",
        transliteration: "Al-Khabir",
        translation: {
            en: "The All-Aware",
            id: "Yang Maha Mengetahui Rahasia"
        },
        meaning: {
            en: "The One who is fully aware of the hidden and inner realities.",
            id: "Yang mengetahui segala rahasia dan keadaan batin makhluk."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/khabir.mp3",
            full: ""
        }
    },
    {
        id: 32,
        arabic: "الْحَلِيمُ",
        transliteration: "Al-Halim",
        translation: {
            en: "The Forbearing",
            id: "Yang Maha Penyantun"
        },
        meaning: {
            en: "The One who does not hasten to punish despite having power.",
            id: "Yang tidak tergesa menghukum meski berkuasa atas segalanya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/halim.mp3",
            full: ""
        }
    },
    {
        id: 33,
        arabic: "الْعَظِيمُ",
        transliteration: "Al-Azim",
        translation: {
            en: "The Magnificent",
            id: "Yang Maha Agung"
        },
        meaning: {
            en: "The One whose greatness and majesty are beyond imagination.",
            id: "Yang keagungan dan kebesaran-Nya melampaui segala bayangan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/azim.mp3",
            full: ""
        }
    },
    {
        id: 34,
        arabic: "الْغَفُورُ",
        transliteration: "Al-Ghafur",
        translation: {
            en: "The All-Forgiving",
            id: "Yang Maha Pengampun"
        },
        meaning: {
            en: "The One who forgives major sins and covers faults.",
            id: "Yang mengampuni dosa-dosa besar dan menutupi aib hamba."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/ghafur.mp3",
            full: ""
        }
    },
    {
        id: 35,
        arabic: "الشَّكُورُ",
        transliteration: "Ash-Shakur",
        translation: {
            en: "The Most Appreciative",
            id: "Yang Maha Mensyukuri"
        },
        meaning: {
            en: "The One who rewards even small deeds with abundant reward.",
            id: "Yang membalas amal kecil dengan ganjaran yang berlipat ganda."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/shakur.mp3",
            full: ""
        }
    },
    {
        id: 36,
        arabic: "الْعَلِيُّ",
        transliteration: "Al-Aliyy",
        translation: {
            en: "The Most High",
            id: "Yang Maha Tinggi"
        },
        meaning: {
            en: "The One who is exalted above all of creation.",
            id: "Yang ketinggian-Nya mengatasi seluruh makhluk dan sifat mereka."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/ali.mp3",
            full: ""
        }
    },
    {
        id: 37,
        arabic: "الْكَبِيرُ",
        transliteration: "Al-Kabir",
        translation: {
            en: "The Most Great",
            id: "Yang Maha Besar"
        },
        meaning: {
            en: "The One whose greatness is beyond measure or comparison.",
            id: "Yang kebesaran-Nya tak terukur dan tiada bandingannya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/kabir.mp3",
            full: ""
        }
    },
    {
        id: 38,
        arabic: "الْحَفِيظُ",
        transliteration: "Al-Hafiz",
        translation: {
            en: "The Preserver",
            id: "Yang Maha Memelihara"
        },
        meaning: {
            en: "The One who guards and protects all things.",
            id: "Yang menjaga dan memelihara seluruh makhluk dari kebinasaan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/hafiz.mp3",
            full: ""
        }
    },
    {
        id: 39,
        arabic: "المُقيِت",
        transliteration: "Al-Muqit",
        translation: {
            en: "The Sustainer",
            id: "Yang Maha Pemberi Kecukupan"
        },
        meaning: {
            en: "The One who provides each being with what it needs to survive.",
            id: "Yang mencukupkan kebutuhan setiap makhluk sesuai ketentuan-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muqit.mp3",
            full: ""
        }
    },
    {
        id: 40,
        arabic: "الْحسِيبُ",
        transliteration: "Al-Hasib",
        translation: {
            en: "The Reckoner",
            id: "Yang Maha Membuat Perhitungan"
        },
        meaning: {
            en: "The One who is sufficient for His servants and takes account of all deeds.",
            id: "Yang mencukupi hamba-Nya dan menghisab seluruh amal mereka."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/hasib.mp3",
            full: ""
        }
    },
    {
        id: 41,
        arabic: "الْجَلِيلُ",
        transliteration: "Al-Jalil",
        translation: {
            en: "The Majestic",
            id: "Yang Maha Mulia"
        },
        meaning: {
            en: "The One who possesses absolute majesty and glory.",
            id: "Yang memiliki kemuliaan dan kebesaran yang sempurna."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/jalil.mp3",
            full: ""
        }
    },
    {
        id: 42,
        arabic: "الْكَرِيمُ",
        transliteration: "Al-Karim",
        translation: {
            en: "The Generous",
            id: "Yang Maha Pemurah"
        },
        meaning: {
            en: "The One who is generous and noble in giving.",
            id: "Yang pemurah dalam memberi dan memuliakan hamba."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/karim.mp3",
            full: ""
        }
    },
    {
        id: 43,
        arabic: "الرَّقِيبُ",
        transliteration: "Ar-Raqib",
        translation: {
            en: "The Watchful",
            id: "Yang Maha Mengawasi"
        },
        meaning: {
            en: "The One who observes everything with perfect awareness.",
            id: "Yang mengawasi segala perbuatan hamba tanpa luput sedikit pun."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/raqib.mp3",
            full: ""
        }
    },
    {
        id: 44,
        arabic: "الْمُجِيبُ",
        transliteration: "Al-Mujib",
        translation: {
            en: "The Responder",
            id: "Yang Maha Mengabulkan"
        },
        meaning: {
            en: "The One who responds to the supplications of His servants.",
            id: "Yang mengabulkan doa hamba yang memohon kepada-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mujib.mp3",
            full: ""
        }
    },
    {
        id: 45,
        arabic: "الْوَاسِعُ",
        transliteration: "Al-Wasi'",
        translation: {
            en: "The All-Encompassing",
            id: "Yang Maha Luas"
        },
        meaning: {
            en: "The One whose mercy, knowledge, and provision are vast.",
            id: "Yang keluasan rahmat, ilmu, dan rezeki-Nya meliputi segalanya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/wasi.mp3",
            full: ""
        }
    },
    {
        id: 46,
        arabic: "الْحَكِيمُ",
        transliteration: "Al-Hakim",
        translation: {
            en: "The All-Wise",
            id: "Yang Maha Bijaksana"
        },
        meaning: {
            en: "The One whose every command and decree is full of wisdom.",
            id: "Yang segala perintah dan ketetapan-Nya penuh hikmah."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/hakim.mp3",
            full: ""
        }
    },
    {
        id: 47,
        arabic: "الْوَدُودُ",
        transliteration: "Al-Wadud",
        translation: {
            en: "The Loving",
            id: "Yang Maha Mengasihi"
        },
        meaning: {
            en: "The One who loves His believing servants and is beloved by them.",
            id: "Yang amat mencintai hamba-Nya yang beriman dan dicintai mereka."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/wadud.mp3",
            full: ""
        }
    },
    {
        id: 48,
        arabic: "الْمَجِيدُ",
        transliteration: "Al-Majid",
        translation: {
            en: "The Most Glorious",
            id: "Yang Maha Mulia"
        },
        meaning: {
            en: "The One who is glorious, noble, and honorable.",
            id: "Yang memiliki kemuliaan dan kehormatan yang sangat tinggi."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/majid.mp3",
            full: ""
        }
    },
    {
        id: 49,
        arabic: "الْبَاعِثُ",
        transliteration: "Al-Ba'ith",
        translation: {
            en: "The Resurrector",
            id: "Yang Maha Membangkitkan"
        },
        meaning: {
            en: "The One who will resurrect the dead for judgment.",
            id: "Yang membangkitkan seluruh makhluk dari kubur pada hari kiamat."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/baith.mp3",
            full: ""
        }
    },
    {
        id: 50,
        arabic: "الشَّهِيدُ",
        transliteration: "Ash-Shahid",
        translation: {
            en: "The Witness",
            id: "Yang Maha Menyaksikan"
        },
        meaning: {
            en: "The One who witnesses everything, seen and unseen.",
            id: "Yang menyaksikan segala sesuatu, yang tampak dan tersembunyi."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/shahid.mp3",
            full: ""
        }
    },
    {
        id: 51,
        arabic: "الْحَقُّ",
        transliteration: "Al-Haqq",
        translation: {
            en: "The Truth",
            id: "Yang Maha Benar"
        },
        meaning: {
            en: "The One whose existence is undeniable and whose speech is truth.",
            id: "Yang keberadaan-Nya pasti dan seluruh firman-Nya adalah kebenaran."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/haqq.mp3",
            full: ""
        }
    },
    {
        id: 52,
        arabic: "الْوَكِيلُ",
        transliteration: "Al-Wakil",
        translation: {
            en: "The Trustee",
            id: "Yang Maha Mewakili"
        },
        meaning: {
            en: "The One who is relied upon and takes care of affairs.",
            id: "Yang mengurus seluruh urusan makhluk dan tempat bertawakal."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/wakil.mp3",
            full: ""
        }
    },
    {
        id: 53,
        arabic: "الْقَوِيُّ",
        transliteration: "Al-Qawiyy",
        translation: {
            en: "The All-Strong",
            id: "Yang Maha Kuat"
        },
        meaning: {
            en: "The One whose strength is perfect and cannot be overcome.",
            id: "Yang kekuatan-Nya sempurna dan tak mungkin dikalahkan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/qawi.mp3",
            full: ""
        }
    },
    {
        id: 54,
        arabic: "الْمَتِينُ",
        transliteration: "Al-Matin",
        translation: {
            en: "The Firm",
            id: "Yang Maha Kokoh"
        },
        meaning: {
            en: "The One whose strength is firm, unshakeable, and enduring.",
            id: "Yang kekuatan-Nya sangat kokoh dan tidak pernah melemah."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/matin.mp3",
            full: ""
        }
    },
    {
        id: 55,
        arabic: "الْوَلِيُّ",
        transliteration: "Al-Waliyy",
        translation: {
            en: "The Protecting Friend",
            id: "Yang Maha Melindungi"
        },
        meaning: {
            en: "The One who protects and guides the righteous.",
            id: "Yang menjadi pelindung dan penolong bagi orang-orang saleh."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/waliy.mp3",
            full: ""
        }
    },
    {
        id: 56,
        arabic: "الْحَمِيدُ",
        transliteration: "Al-Hamid",
        translation: {
            en: "The Praiseworthy",
            id: "Yang Maha Terpuji"
        },
        meaning: {
            en: "The One who is praised for His essence, names, and actions.",
            id: "Yang layak dipuji atas zat, nama, dan perbuatan-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/hamid.mp3",
            full: ""
        }
    },
    {
        id: 57,
        arabic: "الْمُحْصِي",
        transliteration: "Al-Muhsi",
        translation: {
            en: "The Reckoner of All",
            id: "Yang Maha Menghitung"
        },
        meaning: {
            en: "The One who has counted everything in a perfect register.",
            id: "Yang menghitung segala sesuatu secara teliti dan sempurna."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muhsi.mp3",
            full: ""
        }
    },
    {
        id: 58,
        arabic: "الْمُبْدِئُ",
        transliteration: "Al-Mubdi",
        translation: {
            en: "The Originator",
            id: "Yang Maha Memulai"
        },
        meaning: {
            en: "The One who initiates creation without precedent.",
            id: "Yang memulai penciptaan tanpa contoh sebelumnya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mubdi.mp3",
            full: ""
        }
    },
    {
        id: 59,
        arabic: "الْمُعِيدُ",
        transliteration: "Al-Mu'id",
        translation: {
            en: "The Restorer",
            id: "Yang Maha Mengembalikan"
        },
        meaning: {
            en: "The One who restores life and returns creation after death.",
            id: "Yang mengembalikan makhluk hidup kembali setelah kematian."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muid.mp3",
            full: ""
        }
    },
    {
        id: 60,
        arabic: "الْمُحْيِي",
        transliteration: "Al-Muhyi",
        translation: {
            en: "The Giver of Life",
            id: "Yang Maha Menghidupkan"
        },
        meaning: {
            en: "The One who gives life to the dead and enlivens hearts.",
            id: "Yang menghidupkan yang mati dan menghidupkan hati dengan iman."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muhyi.mp3",
            full: ""
        }
    },
    {
        id: 61,
        arabic: "اَلْمُمِيتُ",
        transliteration: "Al-Mumit",
        translation: {
            en: "The Taker of Life",
            id: "Yang Maha Mematikan"
        },
        meaning: {
            en: "The One who causes death at its appointed time.",
            id: "Yang mematikan setiap makhluk pada waktu yang telah ditetapkan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mumit.mp3",
            full: ""
        }
    },
    {
        id: 62,
        arabic: "الْحَيُّ",
        transliteration: "Al-Hayy",
        translation: {
            en: "The Ever-Living",
            id: "Yang Maha Hidup"
        },
        meaning: {
            en: "The One whose life is perfect, eternal, and self-sustaining.",
            id: "Yang kehidupan-Nya kekal, sempurna, dan tak bergantung pada apa pun."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/hayy.mp3",
            full: ""
        }
    },
    {
        id: 63,
        arabic: "الْقَيُّومُ",
        transliteration: "Al-Qayyum",
        translation: {
            en: "The Self-Subsisting",
            id: "Yang Maha Berdiri Sendiri"
        },
        meaning: {
            en: "The One who sustains and manages all of existence.",
            id: "Yang mengurus dan menegakkan seluruh alam semesta."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/qayyum.mp3",
            full: ""
        }
    },
    {
        id: 64,
        arabic: "الْوَاجِدُ",
        transliteration: "Al-Wajid",
        translation: {
            en: "The Finder",
            id: "Yang Maha Menemukan"
        },
        meaning: {
            en: "The One who finds whatever He wills and never lacks.",
            id: "Yang menemukan apa saja yang Dia kehendaki dan tidak kekurangan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/wajid.mp3",
            full: ""
        }
    },
    {
        id: 65,
        arabic: "الْمَاجِدُ",
        transliteration: "Al-Majid",
        translation: {
            en: "The Illustrious",
            id: "Yang Maha Mulia dan Luhur"
        },
        meaning: {
            en: "The One who is splendid and noble in essence and actions.",
            id: "Yang keluhuran dan kemuliaan-Nya tampak pada seluruh perbuatan-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/majid.mp3",
            full: ""
        }
    },
    {
        id: 66,
        arabic: "الْواحِدُ",
        transliteration: "Al-Wahid",
        translation: {
            en: "The One",
            id: "Yang Maha Esa"
        },
        meaning: {
            en: "The One who has no partner, equal, or rival.",
            id: "Yang Esa, tidak ada sekutu, tandingan, maupun penyerupanya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/wahid.mp3",
            full: ""
        }
    },
    {
        id: 67,
        arabic: "اَلاَحَدُ",
        transliteration: "Al-Ahad",
        translation: {
            en: "The Unique One",
            id: "Yang Maha Tunggal"
        },
        meaning: {
            en: "The One who is uniquely One in His essence and attributes.",
            id: "Yang keesaan-Nya mutlak dalam zat, sifat, dan perbuatan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/ahad.mp3",
            full: ""
        }
    },
    {
        id: 68,
        arabic: "الصَّمَدُ",
        transliteration: "As-Samad",
        translation: {
            en: "The Self-Sufficient",
            id: "Yang Maha Dibutuhkan"
        },
        meaning: {
            en: "The One upon whom all creation depends, while He needs none.",
            id: "Yang menjadi tempat bergantung seluruh makhluk dan tidak butuh apa pun."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/samad.mp3",
            full: ""
        }
    },
    {
        id: 69,
        arabic: "الْقَادِرُ",
        transliteration: "Al-Qadir",
        translation: {
            en: "The Able",
            id: "Yang Maha Kuasa"
        },
        meaning: {
            en: "The One who is able to do whatever He wills.",
            id: "Yang berkuasa melakukan apa saja yang Dia kehendaki."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/qadir.mp3",
            full: ""
        }
    },
    {
        id: 70,
        arabic: "الْمُقْتَدِرُ",
        transliteration: "Al-Muqtadir",
        translation: {
            en: "The All-Powerful",
            id: "Yang Maha Menentukan"
        },
        meaning: {
            en: "The One who perfectly executes His will with absolute power.",
            id: "Yang melaksanakan kehendak-Nya dengan kekuasaan yang sempurna."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muqtadir.mp3",
            full: ""
        }
    },
    {
        id: 71,
        arabic: "الْمُقَدِّمُ",
        transliteration: "Al-Muqaddim",
        translation: {
            en: "The One Who Brings Forward",
            id: "Yang Maha Mendahulukan"
        },
        meaning: {
            en: "The One who brings forward whom He wills in rank or time.",
            id: "Yang mendahulukan siapa saja yang Dia kehendaki dalam derajat atau waktu."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muqaddim.mp3",
            full: ""
        }
    },
    {
        id: 72,
        arabic: "الْمُؤَخِّرُ",
        transliteration: "Al-Mu'akhkhir",
        translation: {
            en: "The One Who Delays",
            id: "Yang Maha Mengakhirkan"
        },
        meaning: {
            en: "The One who delays and holds back whom He wills.",
            id: "Yang mengakhirkan dan menangguhkan siapa yang Dia kehendaki."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muakhkhir.mp3",
            full: ""
        }
    },
    {
        id: 73,
        arabic: "الأوَّلُ",
        transliteration: "Al-Awwal",
        translation: {
            en: "The First",
            id: "Yang Maha Awal"
        },
        meaning: {
            en: "The One who has no beginning; nothing preceded Him.",
            id: "Yang keberadaan-Nya tanpa awal dan tidak didahului apa pun."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/awwal.mp3",
            full: ""
        }
    },
    {
        id: 74,
        arabic: "الآخِرُ",
        transliteration: "Al-Akhir",
        translation: {
            en: "The Last",
            id: "Yang Maha Akhir"
        },
        meaning: {
            en: "The One who has no end; everything will perish except Him.",
            id: "Yang keberadaan-Nya tanpa akhir dan segala sesuatu akan binasa kecuali Dia."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/akhir.mp3",
            full: ""
        }
    },
    {
        id: 75,
        arabic: "الظَّاهِرُ",
        transliteration: "Az-Zahir",
        translation: {
            en: "The Manifest",
            id: "Yang Maha Nyata"
        },
        meaning: {
            en: "The One whose existence is evident through His signs.",
            id: "Yang keberadaan-Nya tampak melalui tanda-tanda kekuasaan-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/zahir.mp3",
            full: ""
        }
    },
    {
        id: 76,
        arabic: "الْبَاطِنُ",
        transliteration: "Al-Batin",
        translation: {
            en: "The Hidden",
            id: "Yang Maha Tersembunyi"
        },
        meaning: {
            en: "The One who is hidden from our perception yet closer than anything.",
            id: "Yang tersembunyi dari pandangan makhluk namun sangat dekat dengan mereka."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/batin.mp3",
            full: ""
        }
    },
    {
        id: 77,
        arabic: "الْوَالِي",
        transliteration: "Al-Wali",
        translation: {
            en: "The Patron",
            id: "Yang Maha Menguasai"
        },
        meaning: {
            en: "The One who manages and governs all affairs.",
            id: "Yang menguasai dan mengatur seluruh urusan makhluk."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/waliy.mp3",
            full: ""
        }
    },
    {
        id: 78,
        arabic: "الْمُتَعَالِي",
        transliteration: "Al-Muta'ali",
        translation: {
            en: "The Supremely Exalted",
            id: "Yang Maha Tinggi Derajat-Nya"
        },
        meaning: {
            en: "The One who is far above any imperfection or deficiency.",
            id: "Yang sangat tinggi dan maha suci dari segala kekurangan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muta_ali.mp3",
            full: ""
        }
    },
    {
        id: 79,
        arabic: "الْبَرُّ",
        transliteration: "Al-Barr",
        translation: {
            en: "The Most Kind",
            id: "Yang Maha Dermawan"
        },
        meaning: {
            en: "The One who is extremely kind and gentle with His servants.",
            id: "Yang sangat dermawan dan lembut terhadap hamba-hamba-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/barr.mp3",
            full: ""
        }
    },
    {
        id: 80,
        arabic: "التَّوَّابُ",
        transliteration: "At-Tawwab",
        translation: {
            en: "The Accepter of Repentance",
            id: "Yang Maha Penerima Taubat"
        },
        meaning: {
            en: "The One who accepts repentance and returns His servants to Him.",
            id: "Yang menerima taubat dan mengembalikan hamba kepada jalan-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/tawwab.mp3",
            full: ""
        }
    },
    {
        id: 81,
        arabic: "الْمُنْتَقِمُ",
        transliteration: "Al-Muntaqim",
        translation: {
            en: "The Avenger",
            id: "Yang Maha Pemberi Balasan"
        },
        meaning: {
            en: "The One who justly punishes the arrogant and wrongdoers.",
            id: "Yang memberikan balasan yang adil kepada orang-orang zalim."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muntaqim.mp3",
            full: ""
        }
    },
    {
        id: 82,
        arabic: "العَفُوُّ",
        transliteration: "Al-Afuww",
        translation: {
            en: "The Pardoner",
            id: "Yang Maha Pemaaf"
        },
        meaning: {
            en: "The One who erases sins and overlooks faults.",
            id: "Yang menghapus dosa dan memaafkan kesalahan hamba."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/afuw.mp3",
            full: ""
        }
    },
    {
        id: 83,
        arabic: "الرَّؤُوفُ",
        transliteration: "Ar-Ra'uf",
        translation: {
            en: "The Most Compassionate",
            id: "Yang Maha Pengasih"
        },
        meaning: {
            en: "The One whose compassion and gentleness are immense.",
            id: "Yang kelembutan dan belas kasih-Nya sangat besar kepada hamba."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/rauf.mp3",
            full: ""
        }
    },
    {
        id: 84,
        arabic: "مَالِكُ الْمُلْكِ",
        transliteration: "Malik-ul-Mulk",
        translation: {
            en: "Owner of the Dominion",
            id: "Pemilik Kerajaan"
        },
        meaning: {
            en: "The One who owns the entire dominion and disposes of it as He wills.",
            id: "Yang memiliki seluruh kerajaan dan mengaturnya sesuai kehendak-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/malik_ul_mulk.mp3",
            full: ""
        }
    },
    {
        id: 85,
        arabic: "ذُو الْجَلاَلِ وَالإكْرَامِ",
        transliteration: "Dhul-Jalali wal-Ikram",
        translation: {
            en: "Lord of Majesty and Honor",
            id: "Yang Memiliki Keagungan dan Kemuliaan"
        },
        meaning: {
            en: "The One who possesses majesty, glory, and honor.",
            id: "Yang memiliki keagungan dan kemuliaan yang sempurna."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/dhu_l_jalali_wal_ikram.mp3",
            full: ""
        }
    },
    {
        id: 86,
        arabic: "الْمُقْسِطُ",
        transliteration: "Al-Muqsit",
        translation: {
            en: "The Just One",
            id: "Yang Maha Adil"
        },
        meaning: {
            en: "The One who is absolutely fair and equitable.",
            id: "Yang menegakkan keadilan dan menempatkan segala sesuatu pada tempatnya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/muqsit.mp3",
            full: ""
        }
    },
    {
        id: 87,
        arabic: "الْجَامِعُ",
        transliteration: "Al-Jami'",
        translation: {
            en: "The Gatherer",
            id: "Yang Maha Mengumpulkan"
        },
        meaning: {
            en: "The One who gathers creation on the Day of Judgment.",
            id: "Yang mengumpulkan manusia pada hari kiamat untuk dihisab."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/jami.mp3",
            full: ""
        }
    },
    {
        id: 88,
        arabic: "الْغَنِيُّ",
        transliteration: "Al-Ghaniyy",
        translation: {
            en: "The Self-Sufficient",
            id: "Yang Maha Kaya"
        },
        meaning: {
            en: "The One who is free of all needs while all depend on Him.",
            id: "Yang Maha Kaya dan sama sekali tidak membutuhkan makhluk-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/ghaniy.mp3",
            full: ""
        }
    },
    {
        id: 89,
        arabic: "الْمُغْنِي",
        transliteration: "Al-Mughni",
        translation: {
            en: "The Enricher",
            id: "Yang Maha Memberi Kekayaan"
        },
        meaning: {
            en: "The One who enriches whom He wills and grants sufficiency.",
            id: "Yang memberikan kecukupan dan kekayaan bagi siapa saja yang Dia kehendaki."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mughni.mp3",
            full: ""
        }
    },
    {
        id: 90,
        arabic: "اَلْمَانِعُ",
        transliteration: "Al-Mani'",
        translation: {
            en: "The Withholder",
            id: "Yang Maha Mencegah"
        },
        meaning: {
            en: "The One who prevents harm or benefit as He wills.",
            id: "Yang mencegah bahaya atau manfaat sesuai kehendak-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/mani.mp3",
            full: ""
        }
    },
    {
        id: 91,
        arabic: "الضَّارَّ",
        transliteration: "Ad-Darr",
        translation: {
            en: "The Distresser",
            id: "Yang Maha Memberi Derita"
        },
        meaning: {
            en: "The One who allows harm to reach whom He wills with justice.",
            id: "Yang menimpakan bahaya kepada siapa yang Dia kehendaki dengan keadilan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/darr.mp3",
            full: ""
        }
    },
    {
        id: 92,
        arabic: "النَّافِعُ",
        transliteration: "An-Nafi'",
        translation: {
            en: "The Benefactor",
            id: "Yang Maha Memberi Manfaat"
        },
        meaning: {
            en: "The One who brings benefit and goodness to His creation.",
            id: "Yang mendatangkan manfaat dan kebaikan bagi makhluk-Nya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/nafi.mp3",
            full: ""
        }
    },
    {
        id: 93,
        arabic: "النُّورُ",
        transliteration: "An-Nur",
        translation: {
            en: "The Light",
            id: "Yang Maha Bercahaya"
        },
        meaning: {
            en: "The One who is the light of the heavens and the earth.",
            id: "Yang menjadi cahaya langit dan bumi serta hati orang beriman."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/nur.mp3",
            full: ""
        }
    },
    {
        id: 94,
        arabic: "الْهَادِي",
        transliteration: "Al-Hadi",
        translation: {
            en: "The Guide",
            id: "Yang Maha Pemberi Petunjuk"
        },
        meaning: {
            en: "The One who guides the hearts to faith and righteousness.",
            id: "Yang memberi hidayah kepada hati menuju iman dan ketaatan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/hadi.mp3",
            full: ""
        }
    },
    {
        id: 95,
        arabic: "الْبَدِيعُ",
        transliteration: "Al-Badi'",
        translation: {
            en: "The Incomparable Originator",
            id: "Yang Maha Pencipta Tanpa Contoh"
        },
        meaning: {
            en: "The One who originates creation in a unique and unparalleled way.",
            id: "Yang menciptakan segala sesuatu tanpa contoh sebelumnya dan tiada tandingan."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/badi.mp3",
            full: ""
        }
    },
    {
        id: 96,
        arabic: "الْبَاقِي",
        transliteration: "Al-Baqi",
        translation: {
            en: "The Everlasting",
            id: "Yang Maha Kekal"
        },
        meaning: {
            en: "The One whose existence is everlasting and never ends.",
            id: "Yang keberadaan-Nya kekal abadi dan tidak akan pernah lenyap."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/baqi.mp3",
            full: ""
        }
    },
    {
        id: 97,
        arabic: "الْوَارِثُ",
        transliteration: "Al-Warith",
        translation: {
            en: "The Inheritor",
            id: "Yang Maha Mewarisi"
        },
        meaning: {
            en: "The One who remains after all of creation has perished.",
            id: "Yang tetap ada setelah seluruh makhluk binasa dan mewarisi semuanya."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/warith.mp3",
            full: ""
        }
    },
    {
        id: 98,
        arabic: "الرَّشِيدُ",
        transliteration: "Ar-Rashid",
        translation: {
            en: "The Guide to the Right Path",
            id: "Yang Maha Membimbing"
        },
        meaning: {
            en: "The One who directs to the straight path and sound judgment.",
            id: "Yang membimbing kepada jalan yang lurus dan keputusan yang benar."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/rashid.mp3",
            full: ""
        }
    },
    {
        id: 99,
        arabic: "الصَّبُورُ",
        transliteration: "As-Sabur",
        translation: {
            en: "The Most Patient",
            id: "Yang Maha Sabar"
        },
        meaning: {
            en: "The One who is most patient and does not hasten the punishment of sinners.",
            id: "Yang sangat sabar dan tidak tergesa mengazab hamba yang bermaksiat."
        },
        audio: {
            individual: "https://islamicapi.com/audio/asma-ul-husna/sabur.mp3",
            full: ""
        }
    }
];

const mapApiItemsToAsmaulHusnaItems = (apiItems: IslamicApiAsmaulHusnaItem[]): AsmaulHusnaItem[] => {
    return apiItems.map((item) => {
        // Use the API provided audio URL first, fallback to transliteration format if needed
        const audioIndividual = item.audio ? `https://islamicapi.com${item.audio}` : 
            `https://islamicapi.com/audio/asma-ul-husna/${transliterationToUrlFormat(item.transliteration)}.mp3`;
        return {
            id: item.number,
            arabic: item.name,
            transliteration: item.transliteration,
            translation: {
                en: '',
                id: item.translation || ''
            },
            meaning: {
                en: '',
                id: item.meaning || ''
            },
            audio: {
                individual: audioIndividual,
                full: '' // API doesn't provide full audio, will use sequential playback
            }
        };
    });
};

const mergeOfflineWithApi = (apiItems: AsmaulHusnaItem[]): AsmaulHusnaItem[] => {
    const apiById = new Map<number, AsmaulHusnaItem>();
    for (const item of apiItems) {
        apiById.set(item.id, item);
    }

    return ASMAUL_HUSNA_OFFLINE_DATA.map((off) => {
        const apiItem = apiById.get(off.id);
        if (!apiItem) return off;
        return {
            ...off,
            arabic: apiItem.arabic || off.arabic,
            transliteration: apiItem.transliteration || off.transliteration,
            translation: {
                en: off.translation.en,
                id: apiItem.translation.id || off.translation.id
            },
            meaning: {
                en: off.meaning.en,
                id: apiItem.meaning.id || off.meaning.id
            },
            audio: {
                individual: apiItem.audio.individual || off.audio.individual,
                full: off.audio.full
            }
        };
    });
};

export const AsmaulHusnaService = {
    async getAsmaulHusnaList(forceRefresh = false, language: 'en' | 'id' = 'id'): Promise<AsmaulHusnaItem[]> {
        if (!forceRefresh) {
            const cached = await StorageService.get<AsmaulHusnaItem[]>(CACHE_KEY_ASMAUL_HUSNA);
            if (cached) return cached;
            
            const offlineCached = await StorageService.get<AsmaulHusnaItem[]>(CACHE_KEY_ASMAUL_HUSNA_OFFLINE);
            if (offlineCached) return offlineCached;
        }

        if (!canUseOnlineApi()) {
            await StorageService.set(CACHE_KEY_ASMAUL_HUSNA_OFFLINE, ASMAUL_HUSNA_OFFLINE_DATA);
            return ASMAUL_HUSNA_OFFLINE_DATA;
        }

        try {
            const response = await axios.get<IslamicApiAsmaulHusnaListResponse>(`${API_BASE}/v1/asma-ul-husna/`, {
                params: {
                    language: language,
                    api_key: API_KEY
                }
            });

            const apiResponse = response.data;
            const apiItems = apiResponse.data && apiResponse.data.names ? apiResponse.data.names : [];

            if (apiItems.length) {
                const mappedItems = mapApiItemsToAsmaulHusnaItems(apiItems);
                const mergedData = mergeOfflineWithApi(mappedItems);

                await StorageService.set(CACHE_KEY_ASMAUL_HUSNA, mergedData);
                return mergedData;
            }
        } catch (e) {
            console.error('Asmaul Husna API Error', e);
        }

        // Fallback to offline data if API fails or is offline
        await StorageService.set(CACHE_KEY_ASMAUL_HUSNA_OFFLINE, ASMAUL_HUSNA_OFFLINE_DATA);
        return ASMAUL_HUSNA_OFFLINE_DATA;
    },

    async getAsmaulHusnaDetail(id: number, language: 'en' | 'id' = 'id'): Promise<AsmaulHusnaItem | null> {
        if (!canUseOnlineApi()) {
            const offlineData = ASMAUL_HUSNA_OFFLINE_DATA.find(item => item.id === id);
            return offlineData || null;
        }

        try {
            const response = await axios.get(`${API_BASE}/asmaul-husna/${id}`, {
                headers: {
                    'X-API-KEY': API_KEY
                },
                params: {
                    language: language
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
        } catch (e) {
            console.error(`Asmaul Husna Detail Error for ID ${id}`, e);
        }

        // Fallback to offline data
        const offlineData = ASMAUL_HUSNA_OFFLINE_DATA.find(item => item.id === id);
        return offlineData || null;
    },

    async cacheAsmaulHusnaData(language: 'en' | 'id' = 'id'): Promise<boolean> {
        if (!canUseOnlineApi()) {
            await StorageService.set(CACHE_KEY_ASMAUL_HUSNA, ASMAUL_HUSNA_OFFLINE_DATA);
            return true;
        }

        try {
            const response = await axios.get<IslamicApiAsmaulHusnaListResponse>(`${API_BASE}/v1/asma-ul-husna/`, {
                params: {
                    language: language,
                    api_key: API_KEY
                }
            });

            const apiResponse = response.data;
            const apiItems = apiResponse.data && apiResponse.data.names ? apiResponse.data.names : [];

            if (apiItems.length) {
                const mappedItems = mapApiItemsToAsmaulHusnaItems(apiItems);
                const mergedData = mergeOfflineWithApi(mappedItems);

                await StorageService.set(CACHE_KEY_ASMAUL_HUSNA, mergedData);
                return true;
            }
        } catch (e) {
            console.error('Cache Asmaul Husna Error', e);
        }
        return false;
    },

    async isOnlineDataAvailable(): Promise<boolean> {
        if (!canUseOnlineApi()) {
            return false;
        }

        try {
            const response = await axios.get<IslamicApiAsmaulHusnaListResponse>(`${API_BASE}/v1/asma-ul-husna/`, {
                params: {
                    language: 'id',
                    api_key: API_KEY
                },
                timeout: 5000
            });
            const apiResponse = response.data;
            const apiItems = apiResponse.data && apiResponse.data.names ? apiResponse.data.names : [];
            return apiItems.length > 0;
        } catch (e) {
            return false;
        }
    }
};
