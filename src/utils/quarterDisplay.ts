import type { Quarter } from '../types/quarters';

export const QUARTER_TYPE_OPTIONS = [
  'Type-I',
  'Type-II',
  'Type-III',
  'Type-III Hi Tech and specific colony',
  'Type-III Double Storey',
  'Type-IV',
  'Type-V',
] as const;

export type QuarterTypeOption = typeof QUARTER_TYPE_OPTIONS[number];

export const QUARTER_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80',
];

export function parseQuarterImages(images: Quarter['images']): string[] {
  let parsed: unknown = images;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed as string);
    } catch {
      parsed = (parsed as string)
        .replace(/^\{/, '')
        .replace(/\}$/, '')
        .split(',')
        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }
  if (Array.isArray(parsed) && (parsed as string[]).length > 0) return parsed as string[];
  return [];
}

export function resolveQuarterImages(q: Quarter): string[] {
  const imgs = parseQuarterImages(q.images);
  return imgs.length > 0 ? imgs : QUARTER_PLACEHOLDER_IMAGES;
}

export function resolveQuarterImage(q: Quarter, idx: number): string {
  const imgs = parseQuarterImages(q.images);
  const first = imgs.length > 0 ? imgs[0] : null;
  return first || QUARTER_PLACEHOLDER_IMAGES[idx % QUARTER_PLACEHOLDER_IMAGES.length];
}

export function fmtINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN');
}

export function getOccupancyBadgeClass(status: string): string {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
