import { BookingStatus, RoomStatus, PaymentStatus, PropertyStatus, AssetCategory } from '../types';

export const BOOKING_STATUSES: Record<string, BookingStatus> = {
  REQUESTED: 'REQUESTED',
  PROVISIONED: 'PROVISIONED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  ALLOCATED: 'ALLOCATED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: 'Requested',
  PROVISIONED: 'Provisioned',
  AWAITING_PAYMENT: 'Awaiting Payment',
  ALLOCATED: 'Allocated',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  REQUESTED: 'bg-blue-100 text-blue-800',
  PROVISIONED: 'bg-yellow-100 text-yellow-800',
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-800',
  ALLOCATED: 'bg-green-100 text-green-800',
  CHECKED_IN: 'bg-teal-100 text-teal-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export const ROOM_STATUSES: Record<string, RoomStatus> = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  CLEANING: 'CLEANING',
  MAINTENANCE: 'MAINTENANCE',
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-red-100 text-red-800',
  CLEANING: 'bg-yellow-100 text-yellow-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
};

export const PAYMENT_STATUSES: Record<string, PaymentStatus> = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  COMPLETED: 'COMPLETED',
  REFUNDED: 'REFUNDED',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  COMPLETED: 'Completed',
  REFUNDED: 'Refunded',
};

export const PROPERTY_STATUSES: Record<string, PropertyStatus> = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
};

export const ASSET_CATEGORIES: AssetCategory[] = ['A', 'B', 'C'];

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  A: 'Category A',
  B: 'Category B',
  C: 'Category C',
};
