import { StorageService } from './storage';

const CACHE_KEY = 'zakat_nisab_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface NisabData {
    gold: {
        weight: number;
        unit_price: number;
        nisab_amount: number;
    };
    silver: {
        weight: number;
        unit_price: number;
        nisab_amount: number;
    };
}

interface ZakatNisabCache {
    data: NisabData;
    timestamp: number;
}

export const ZakatNisabService = {
    async getNisab(currency: string = 'idr', unit: string = 'g', standard: string = 'classical', forceRefresh: boolean = false): Promise<NisabData> {
        const cacheKey = `${CACHE_KEY}_${standard}`;
        try {
            if (forceRefresh) {
                await StorageService.remove(cacheKey);
            }
            const cached = await StorageService.get<ZakatNisabCache>(cacheKey);
            const now = Date.now();
            const expectedGoldWeight = standard === 'common' ? 85 : 87.48;
            const expectedSilverWeight = standard === 'common' ? 595 : 612.36;
            if (cached) {
                const isFresh = (now - cached.timestamp < CACHE_DURATION);
                const matchesStandard = cached.data?.gold?.weight === expectedGoldWeight && cached.data?.silver?.weight === expectedSilverWeight;
                if (isFresh && matchesStandard) {
                    console.log('Using cached Zakat Nisab data for standard:', standard, cached.data);
                    return cached.data;
                } else {
                    await StorageService.remove(cacheKey);
                }
            }

            console.log('Fetching fresh Zakat Nisab data for standard:', standard, '...');

            const API_KEY = 'ZX6Xk9eBmbZfP0FBVVkMi3dcZBnqZnSaTDoTs1D4Fj4PLtZ5'; // Replace with your actual API key
            const response = await fetch(`https://islamicapi.com/api/v1/zakat-nisab/?standard=${standard}&currency=${currency}&unit=${unit}&api_key=${API_KEY}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                const apiData = result.data.nisab_thresholds;
                const nisabData: NisabData = {
                    gold: {
                        weight: standard === 'common' ? 85 : 87.48,
                        unit_price: Number(apiData.gold.unit_price),
                        nisab_amount: Number(apiData.gold.nisab_amount)
                    },
                    silver: {
                        weight: standard === 'common' ? 595 : 612.36,
                        unit_price: Number(apiData.silver.unit_price),
                        nisab_amount: Number(apiData.silver.nisab_amount)
                    }
                };
                await StorageService.set(cacheKey, {
                    data: nisabData,
                    timestamp: now
                });
                return nisabData;
            } else {
                throw new Error(result.message || 'Failed to fetch Zakat Nisab data');
            }
        } catch (error) {
            console.error('Error fetching Zakat Nisab data:', error);
            const cached = await StorageService.get<ZakatNisabCache>(cacheKey); // Use standard-specific cacheKey
            const expectedGoldWeight = standard === 'common' ? 85 : 87.48;
            const expectedSilverWeight = standard === 'common' ? 595 : 612.36;
            if (cached && cached.data?.gold?.weight === expectedGoldWeight && cached.data?.silver?.weight === expectedSilverWeight) {
                return cached.data;
            }
            // Fallback or throw an error if no cached data
            throw new Error('Unable to fetch Zakat Nisab data and no cached data available.');
        }
    }
};
