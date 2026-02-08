import axios from 'axios';

const API_URL = 'https://equran.id/api/doa';
const CACHE_KEY = 'doa_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik

export interface Doa {
  id: string;
  nama: string;
  ar: string;
  tr: string;
  idn: string;
  tentang: string;
  source: string;
}

export interface DoaApiResponse {
  status: string;
  total: number;
  data: Doa[];
}

// Fungsi untuk menyimpan data ke cache localStorage
const saveToCache = (data: DoaApiResponse): void => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Gagal menyimpan ke cache:', error);
  }
};

// Fungsi untuk membaca data dari cache localStorage
const readFromCache = (): DoaApiResponse | null => {
  try {
    const cachedDataString = localStorage.getItem(CACHE_KEY);
    if (!cachedDataString) return null;

    const cachedData = JSON.parse(cachedDataString);
    const isExpired = Date.now() - cachedData.timestamp > CACHE_EXPIRY_MS;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY); // Hapus cache yang kedaluwarsa
      return null;
    }

    return cachedData.data as DoaApiResponse;
  } catch (error) {
    console.error('Gagal membaca dari cache:', error);
    return null;
  }
};

export const getAllDoa = async (): Promise<DoaApiResponse> => {
  try {
    // Coba baca dari cache terlebih dahulu
    const cachedData = readFromCache();
    if (cachedData) {
      console.log('Menggunakan data doa dari cache');
      return cachedData;
    }

    // Jika tidak ada cache, ambil dari API
    const response = await axios.get<DoaApiResponse>(API_URL);
    const data = response.data;

    // Simpan data ke cache untuk penggunaan offline berikutnya
    saveToCache(data);

    return data;
  } catch (error) {
    console.error('Error fetching doa list:', error);
    throw error;
  }
};

export const getDoaById = async (id: string): Promise<Doa> => {
  try {
    // Coba baca dari cache terlebih dahulu
    const cachedData = readFromCache();
    if (cachedData) {
      const doa = cachedData.data.find(d => d.id === id);
      if (doa) {
        console.log(`Menggunakan data doa dengan id ${id} dari cache`);
        return doa;
      }
    }

    // Jika tidak ada di cache, ambil dari API
    const response = await axios.get<Doa>(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching doa with id ${id}:`, error);
    throw error;
  }
};
