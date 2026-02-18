const API_URL = 'https://islamic-api.vwxyz.id/v2/kisahnabi';
const CACHE_KEY = 'kisah_nabi_cache_v3';
const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000;

export interface KisahNabiItem {
  id: string;
  title: string;
  prophetName: string;
  birthYear: string;
  age: string;
  place?: string;
  imageUrl?: string;
  content: string;
  source?: string;
}

interface KisahNabiCachePayload {
  timestamp: number;
  data: KisahNabiItem[];
}

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const normalizeImageUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice('http://'.length)}`;
  }
  return trimmed;
};

const pick = (source: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
};

const extractItems = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const objectPayload = payload as Record<string, unknown>;
  const listCandidate = pick(objectPayload, ['data', 'result', 'results', 'kisahnabi', 'kisah_nabi', 'items']);

  if (!Array.isArray(listCandidate)) {
    return [];
  }

  return listCandidate.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
};

const normalizeItem = (item: Record<string, unknown>, index: number): KisahNabiItem | null => {
  const normalizedItem = Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key.trim().toLowerCase(), value])
  ) as Record<string, unknown>;

  const id = toText(pick(item, ['id', 'uuid', 'slug', 'nomor', 'no'])) || `kisah-${index + 1}`;
  const title =
    toText(pick(normalizedItem, ['name', 'nama_nabi', 'nabi', 'title', 'judul', 'nama', 'prophet'])) ||
    `Kisah Nabi ${index + 1}`;
  const prophetName =
    toText(pick(normalizedItem, ['name', 'nama_nabi', 'nabi', 'prophet', 'title', 'judul', 'nama'])) ||
    title;
  const content =
    toText(pick(normalizedItem, ['description', 'kisah', 'story', 'content', 'isi', 'deskripsi'])) ||
    toText(pick(normalizedItem, ['ringkasan', 'summary']));
  const birthYear =
    toText(pick(normalizedItem, ['thn_kelahiran', 'tahun_kelahiran', 'birth_year', 'kelahiran'])) || '-';
  const age = toText(pick(normalizedItem, ['usia', 'age', 'umur'])) || '-';
  const place = toText(pick(normalizedItem, ['tmp', 'tempat', 'tempat_kelahiran', 'birth_place'])) || undefined;
  const imageUrlRaw = toText(pick(normalizedItem, ['image_url', 'image', 'thumbnail', 'thumb']));
  const imageUrl = imageUrlRaw ? normalizeImageUrl(imageUrlRaw) : undefined;
  const source = toText(pick(normalizedItem, ['source', 'sumber', 'url'])) || undefined;

  if (!content) return null;

  return {
    id,
    title,
    prophetName,
    birthYear,
    age,
    place,
    imageUrl,
    content,
    source
  };
};

const readCache = (): KisahNabiItem[] | null => {
  try {
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    if (!cacheRaw) return null;

    const cache = JSON.parse(cacheRaw) as KisahNabiCachePayload;
    const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY_MS;
    if (isExpired || !Array.isArray(cache.data)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache.data;
  } catch (error) {
    console.error('Failed to read kisah nabi cache:', error);
    return null;
  }
};

const saveCache = (items: KisahNabiItem[]): void => {
  try {
    const payload: KisahNabiCachePayload = {
      timestamp: Date.now(),
      data: items
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to cache kisah nabi data:', error);
  }
};

export const getAllKisahNabi = async (): Promise<KisahNabiItem[]> => {
  const cached = readCache();
  if (cached?.length) {
    return cached;
  }

  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch kisah nabi (${response.status})`);
  }

  const payload = await response.json();
  const rawItems = extractItems(payload);
  const normalized = rawItems
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is KisahNabiItem => Boolean(item));

  if (!normalized.length) {
    throw new Error('Unexpected kisah nabi response format');
  }

  saveCache(normalized);
  return normalized;
};
