const API_URL = 'https://islamic-api.vwxyz.id/v2/tahlil';
const CACHE_KEY = 'tahlil_cache_v1';
const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000;

export interface TahlilItem {
  id: string;
  number: number;
  title: string;
  arabic: string;
  translation: string;
}

interface CachePayload {
  timestamp: number;
  data: TahlilItem[];
}

interface TahlilApiItem {
  no?: number | string;
  judul?: string;
  arab?: string;
  id?: string;
}

interface TahlilApiResponse {
  code?: number;
  status?: string;
  data?: TahlilApiItem[];
}

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const pick = (source: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
};

const toRecordArray = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const objectPayload = payload as Record<string, unknown>;
  const candidate = pick(objectPayload, ['data', 'result', 'results', 'items', 'tahlil']);
  if (!Array.isArray(candidate)) return [];

  return candidate.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
};

const normalizeItem = (item: Record<string, unknown>, index: number): TahlilItem | null => {
  const normalized = Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key.trim().toLowerCase(), value])
  ) as Record<string, unknown>;

  const numberRaw = pick(normalized, ['no', 'nomor', 'number', 'urutan']);
  const number = Number(toText(numberRaw) || index + 1);
  const title =
    toText(pick(normalized, ['judul', 'title', 'nama', 'name'])) || `Bacaan Tahlil ${Number.isNaN(number) ? index + 1 : number}`;
  const arabic = toText(pick(normalized, ['arab', 'arabic', 'teks_arab', 'text_arab']));
  const translation = toText(pick(normalized, ['id', 'indo', 'indonesia', 'terjemahan', 'translation']));

  if (!arabic && !translation) return null;

  const safeNumber = Number.isNaN(number) ? index + 1 : number;

  return {
    id: `tahlil-${safeNumber}-${title.toLowerCase().replace(/\s+/g, '-')}`,
    number: safeNumber,
    title,
    arabic,
    translation
  };
};

const readCache = (): TahlilItem[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as CachePayload;
    const expired = Date.now() - cache.timestamp > CACHE_EXPIRY_MS;
    if (expired || !Array.isArray(cache.data)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache.data;
  } catch (error) {
    console.error('Failed to read tahlil cache:', error);
    return null;
  }
};

const saveCache = (items: TahlilItem[]): void => {
  try {
    const payload: CachePayload = {
      timestamp: Date.now(),
      data: items
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to save tahlil cache:', error);
  }
};

export const getAllTahlil = async (): Promise<TahlilItem[]> => {
  const cached = readCache();
  if (cached?.length) return cached;

  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch tahlil (${response.status})`);
  }

  const payload = (await response.json()) as TahlilApiResponse | unknown;

  let items: TahlilItem[] = [];

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as TahlilApiResponse).data)
  ) {
    const apiItems = (payload as TahlilApiResponse).data ?? [];
    items = apiItems
      .map((item, index) =>
        normalizeItem(
          {
            no: item.no,
            judul: item.judul,
            arab: item.arab,
            id: item.id
          },
          index
        )
      )
      .filter((item): item is TahlilItem => Boolean(item));
  } else {
    items = toRecordArray(payload)
      .map((item, index) => normalizeItem(item, index))
      .filter((item): item is TahlilItem => Boolean(item));
  }

  if (!items.length) {
    throw new Error('Unexpected tahlil response format');
  }

  saveCache(items);
  return items;
};
