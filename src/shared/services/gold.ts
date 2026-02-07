import { StorageService } from './storage';

const CACHE_KEY = 'gold_price_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface GoldPriceCache {
    pricePerGramIdr: number;
    timestamp: number;
}

export const GoldService = {
    async getGoldPrice(): Promise<number> {
        try {
            const cached = await StorageService.get<GoldPriceCache>(CACHE_KEY);
            const now = Date.now();

            if (cached && (now - cached.timestamp < CACHE_DURATION)) {
                console.log('Using cached gold price:', cached.pricePerGramIdr);
                return cached.pricePerGramIdr;
            }

            console.log('Fetching fresh gold price data...');

            // 1. Fetch Gold Price (XAU) - usually in USD per Troy Ounce
            const goldResponse = await fetch('https://api.gold-api.com/price/XAU');
            const goldData = await goldResponse.json();
            const pricePerOunceUsd = goldData.price;

            // 2. Fetch Exchange Rate USD to IDR
            const rateResponse = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR');
            const rateData = await rateResponse.json();
            const usdToIdr = rateData.rates.IDR;

            // 3. Conversion
            // 1 Troy Ounce = 31.1034768 grams
            const gramsPerOunce = 31.1035;
            const pricePerGramUsd = pricePerOunceUsd / gramsPerOunce;
            const pricePerGramIdr = Math.round(pricePerGramUsd * usdToIdr);

            // 4. Cache the result
            await StorageService.set(CACHE_KEY, {
                pricePerGramIdr,
                timestamp: now
            });

            return pricePerGramIdr;
        } catch (error) {
            console.error('Error fetching gold price:', error);
            // Fallback value or throw
            const cached = await StorageService.get<GoldPriceCache>(CACHE_KEY);
            return cached ? cached.pricePerGramIdr : 1200000; // Return last cached or a reasonable default
        }
    }
};
