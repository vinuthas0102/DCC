import type { BookingDTO, BookingStatus } from '../types';

export const PROPERTY_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=400&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
];

export function getPropertyImages(booking: BookingDTO): string[] {
  const imgs = booking.property?.images;
  if (Array.isArray(imgs) && imgs.length > 0) return imgs;
  if (typeof imgs === 'string') {
    try {
      const parsed = JSON.parse(imgs);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* ignore */ }
  }
  return [];
}

export function getPropertyImage(booking: BookingDTO, idx: number): string {
  const imgs = getPropertyImages(booking);
  if (imgs.length > 0) return imgs[0];
  return PROPERTY_FALLBACK_IMAGES[idx % PROPERTY_FALLBACK_IMAGES.length];
}

export function getBookingStatusConfig(status: BookingStatus) {
  switch (status) {
    case 'REQUESTED':        return { label: 'Requested',        bg: 'bg-amber-500',  border: 'border-l-amber-400',   dot: 'bg-amber-400',   badge: 'warning' as const };
    case 'PROVISIONED':      return { label: 'Provisioned',      bg: 'bg-blue-500',   border: 'border-l-blue-400',    dot: 'bg-blue-400',    badge: 'info' as const };
    case 'AWAITING_PAYMENT': return { label: 'Awaiting Payment', bg: 'bg-orange-500', border: 'border-l-orange-400',  dot: 'bg-orange-400',  badge: 'warning' as const };
    case 'ALLOCATED':        return { label: 'Upcoming',         bg: 'bg-cyan-500',   border: 'border-l-cyan-400',    dot: 'bg-cyan-400',    badge: 'info' as const };
    case 'CHECKED_IN':       return { label: 'Checked In',       bg: 'bg-emerald-500',border: 'border-l-emerald-400', dot: 'bg-emerald-400', badge: 'success' as const };
    case 'CHECKED_OUT':      return { label: 'Completed',        bg: 'bg-green-500',  border: 'border-l-green-400',   dot: 'bg-green-400',   badge: 'success' as const };
    case 'CANCELLED':        return { label: 'Cancelled',        bg: 'bg-red-500',    border: 'border-l-red-400',     dot: 'bg-red-400',     badge: 'error' as const };
    case 'REJECTED':         return { label: 'Rejected',         bg: 'bg-rose-500',   border: 'border-l-rose-400',    dot: 'bg-rose-400',    badge: 'error' as const };
    default:                 return { label: status,             bg: 'bg-gray-500',   border: 'border-l-gray-300',    dot: 'bg-gray-400',    badge: 'info' as const };
  }
}

export function calcNights(checkIn: string, checkOut: string): number {
  try {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  } catch { return 1; }
}

export const BOOKING_STATUS_ACCENT: Record<string, string> = {
  REQUESTED:        'bg-amber-400',
  PROVISIONED:      'bg-blue-400',
  AWAITING_PAYMENT: 'bg-orange-400',
  ALLOCATED:        'bg-cyan-400',
  CHECKED_IN:       'bg-emerald-400',
  CHECKED_OUT:      'bg-green-400',
  CANCELLED:        'bg-red-400',
  REJECTED:         'bg-rose-400',
};
