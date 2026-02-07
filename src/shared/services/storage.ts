import { Preferences } from '@capacitor/preferences';

export const StorageService = {
    async set(key: string, value: any): Promise<void> {
        await Preferences.set({
            key,
            value: JSON.stringify(value),
        });
    },

    async get<T>(key: string): Promise<T | null> {
        const { value } = await Preferences.get({ key });
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch (e) {
            console.error('Error parsing storage value', e);
            return null;
        }
    },

    async remove(key: string): Promise<void> {
        await Preferences.remove({ key });
    },

    async clear(): Promise<void> {
        await Preferences.clear();
    }
};
