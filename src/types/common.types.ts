export type UserRole = 'public' | 'govt_official' | 'manager' | 'dept_user' | 'admin';

export type BookingStatus =
  | 'REQUESTED'
  | 'PROVISIONED'
  | 'AWAITING_PAYMENT'
  | 'ALLOCATED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentScenario = 'immediate' | 'post_approval' | 'pre_acceptance';
export type PaymentReferenceDate = 'on_request' | 'allotment_date' | 'acceptance_date';

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

export type PropertyStatus = 'DRAFT' | 'PUBLISHED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'REFUNDED';

export type AssetCategory = 'A' | 'B' | 'C';

export type ViewMode = 'cards' | 'table' | 'list';

export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
  idProofType?: string;
  idProofNumber?: string;
  address?: string;
  numberOfGuests?: number;
  numberOfAdults?: number;
  numberOfChildren?: number;
}

export interface AuditoriumRequirements {
  expectedAttendees?: number;
  seatingArrangement?: string;
  needsSoundSystem?: boolean;
  needsLighting?: boolean;
  needsGenerator?: boolean;
  needsGarbageManagement?: boolean;
  additionalNotes?: string;
}

export interface SearchFilters {
  location?: string;
  checkInDate?: string;
  checkOutDate?: string;
  moduleId?: string;
  propertyTypeId?: string;
  roomTypeId?: string;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  assetTypeId?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
