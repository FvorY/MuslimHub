import { StorageService } from '@/shared/services/storage';

const LAST_READ_KEY = 'quran_last_read';

export interface QuranLastRead {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  updatedAt: string;
}

export const QuranReadingProgressService = {
  async getLastRead(): Promise<QuranLastRead | null> {
    return StorageService.get<QuranLastRead>(LAST_READ_KEY);
  },

  async setLastRead(payload: Omit<QuranLastRead, 'updatedAt'>): Promise<void> {
    await StorageService.set(LAST_READ_KEY, {
      ...payload,
      updatedAt: new Date().toISOString()
    });
  },

  async clearLastRead(): Promise<void> {
    await StorageService.remove(LAST_READ_KEY);
  }
};
