import { PropertyStatus, RoomStatus, AssetCategory } from './common.types';

export interface RegionDTO {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EstateDTO {
  id: string;
  regionId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region?: RegionDTO;
}

export interface ModuleDTO {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyTypeDTO {
  id: string;
  moduleId: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  module?: ModuleDTO;
}

export interface AssetTypeDTO {
  id: string;
  name: string;
  subtype: string;
  category: AssetCategory;
  description: string;
  moduleId?: string;
  isActive: boolean;
  createdAt: string;
  module?: ModuleDTO;
}

// ── Hall / Community Hall specific types ───────────────────────────

export interface HallCapacity {
  mainHallSeating: number;
  diningCapacity: number;
  guestRooms: number;
  acRooms: number;
  nonAcRooms: number;
  twoWheelerParking: number;
  fourWheelerParking: number;
  kitchenSizeSqft: number;
}

export interface HallBillingItem {
  label: string;
  amount: string;
  unit: string;
}

export interface HallFacilities {
  musicSystem: boolean;
  waterSupply: boolean;
  electricityDG: boolean;
  bathroomFacility: boolean;
  kitchenAccess: boolean;
  centralAC: boolean;
  cctvMonitoring: boolean;
  fireSafetySystem: boolean;
  physicalSecurity: boolean;
  fans: boolean;
}

export interface HallTerms {
  cancellationRules: string;
  bookingRules: string;
  termsAndConditions: string;
}

export interface HallDetails {
  contactDetails: string;
  inchargeName: string;
  capacity: HallCapacity;
  billing: HallBillingItem[];
  facilities: HallFacilities;
  terms: HallTerms;
}

export const DEFAULT_HALL_BILLING_ITEMS: HallBillingItem[] = [
  { label: 'Base Hall Rent (NMDC Employee)',        amount: '', unit: 'per day' },
  { label: 'Base Hall Rent (Non-NMDC Employee)',    amount: '', unit: 'per day' },
  { label: 'Music Charges (NMDC Employee)',         amount: '', unit: 'per day' },
  { label: 'Music Charges (Non-NMDC Employee)',     amount: '', unit: 'per day' },
  { label: 'Hall Rent (NMDC Employee)',             amount: '', unit: 'per day' },
  { label: 'Hall Rent (Non-NMDC Employee)',         amount: '', unit: 'per day' },
  { label: 'Water Utility Fee',                     amount: '', unit: 'per day' },
  { label: 'Electricity Charges',                   amount: '', unit: 'per day' },
  { label: 'Security Deposit (NMDC Employee)',      amount: '', unit: 'flat' },
  { label: 'Security Deposit (Non-NMDC Employee)',  amount: '', unit: 'flat' },
  { label: 'Lighting Charges',                      amount: '', unit: 'per day' },
  { label: 'Gas Charges',                           amount: '', unit: 'flat' },
  { label: 'Damage Recovery Policy',                amount: '', unit: 'as applicable' },
  { label: 'Operating Time & Noise Policy',         amount: '', unit: 'as per policy' },
  { label: 'Cleaning Charges',                      amount: '', unit: 'per event' },
  { label: 'GST Applicable %',                      amount: '', unit: 'percentage' },
];

export const DEFAULT_HALL_DETAILS: HallDetails = {
  contactDetails: '',
  inchargeName: '',
  capacity: {
    mainHallSeating: 0,
    diningCapacity: 0,
    guestRooms: 0,
    acRooms: 0,
    nonAcRooms: 0,
    twoWheelerParking: 0,
    fourWheelerParking: 0,
    kitchenSizeSqft: 0,
  },
  billing: DEFAULT_HALL_BILLING_ITEMS,
  facilities: {
    musicSystem: false,
    waterSupply: false,
    electricityDG: false,
    bathroomFacility: false,
    kitchenAccess: false,
    centralAC: false,
    cctvMonitoring: false,
    fireSafetySystem: false,
    physicalSecurity: false,
    fans: false,
  },
  terms: {
    cancellationRules: '',
    bookingRules: '',
    termsAndConditions: '',
  },
};

// ── Commercial Shop specific types ─────────────────────────────────

export interface ShopDetails {
  // Basic / Layout
  shopType: string;
  totalAreaSqft: number;
  frontageWidth: number;
  mainDoorFacing: string;
  floorDetails: string;
  twoWheelerParking: number;
  fourWheelerParking: number;
  // Technical amenities
  roofing: boolean;
  slidingDoors: boolean;
  washroomFacility: boolean;
  displayElectricMeter: boolean;
  dedicatedConnection: boolean;
  photoConnection: boolean;
  backupGenerator: boolean;
  waterConnection: boolean;
  cctvConnection: boolean;
  commonMonitoring: boolean;
  fireSafetySystem: boolean;
  // Lease financials
  leaseType: 'MONTHLY' | 'ANNUAL';
  leaseCommencementDate: string;
  leaseAgreementDate: string;
  monthlyRent: number;
  leaseAmount: number;
  maintenanceCharges: number;
  securityDeposit: number;
  electricityRatePerUnit: number;
  electricityPaymentPercent: number;
  latePaymentPercent: number;
  gstApplicable: boolean;
  gstPercentage: number;
  rentLeasePeriodYears: number;
  escalationPercent: number;
  vacancyNoticePeriodDays: number;
  standardLeaseTerms: string;
  // Vendor / Company details
  vendorName: string;
  vendorPanNo: string;
  vendorContact: string;
  vendorAadhaar: string;
  vendorGstNo: string;
  vendorEmail: string;
  vendorTempAddress: string;
  vendorAddress: string;
}

export const SHOP_TYPE_OPTIONS = [
  'General Stores',
  'Pharmacy / Medical Store',
  'Canteen / Food Stall',
  'Bakery',
  'Stationery / Books',
  'Electronics / Mobile',
  'Tailoring / Garments',
  'Barber / Salon',
  'Hardware / Tools',
  'Vegetable / Grocery',
  'Other',
];

export const DEFAULT_SHOP_DETAILS: ShopDetails = {
  shopType: '',
  totalAreaSqft: 0,
  frontageWidth: 0,
  mainDoorFacing: '',
  floorDetails: '',
  twoWheelerParking: 0,
  fourWheelerParking: 0,
  roofing: false,
  slidingDoors: false,
  washroomFacility: false,
  displayElectricMeter: false,
  dedicatedConnection: false,
  photoConnection: false,
  backupGenerator: false,
  waterConnection: false,
  cctvConnection: false,
  commonMonitoring: false,
  fireSafetySystem: false,
  leaseType: 'MONTHLY',
  leaseCommencementDate: '',
  leaseAgreementDate: '',
  monthlyRent: 0,
  leaseAmount: 0,
  maintenanceCharges: 0,
  securityDeposit: 0,
  electricityRatePerUnit: 0,
  electricityPaymentPercent: 0,
  latePaymentPercent: 0,
  gstApplicable: true,
  gstPercentage: 18,
  rentLeasePeriodYears: 0,
  escalationPercent: 0,
  vacancyNoticePeriodDays: 30,
  standardLeaseTerms: '',
  vendorName: '',
  vendorPanNo: '',
  vendorContact: '',
  vendorAadhaar: '',
  vendorGstNo: '',
  vendorEmail: '',
  vendorTempAddress: '',
  vendorAddress: '',
};

// ── Property DTO ──────────────────────────────────────────────────

export interface PropertyDTO {
  id: string;
  estateId: string | null;
  assetTypeId: string;
  moduleId?: string;
  propertyTypeId?: string;
  name: string;
  code: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isExempt: boolean;
  status: PropertyStatus;
  images: string[];
  amenities: string[];
  metadata: Record<string, any>;
  hallDetails?: HallDetails | null;
  shopDetails?: ShopDetails | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  estate?: EstateDTO;
  assetType?: AssetTypeDTO;
  module?: ModuleDTO;
  propertyType?: PropertyTypeDTO;
  minPrice?: number | null;
  maxPrice?: number | null;
  totalRooms?: number;
}

export interface BlockDTO {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  floors: number;
  isActive: boolean;
  createdAt: string;
}

export interface FloorDTO {
  id: string;
  blockId: string;
  floorNumber: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface RoomTypeDTO {
  id: string;
  name: string;
  description: string;
  defaultCapacity: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoomDTO {
  id: string;
  floorId: string;
  roomTypeId: string;
  roomNumber: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  isSmokingAllowed: boolean;
  features: RoomFeatures;
  viewType: string;
  bedCount: number;
  bedType: string;
  metadata: Record<string, any>;
  status: RoomStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roomType?: RoomTypeDTO;
  floor?: FloorDTO;
}

export interface AmenityDTO {
  id: string;
  name: string;
  icon: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoomFeatures {
  hasBalcony: boolean;
  hasAC: boolean;
  hasKitchen: boolean;
  hasLivingRoom: boolean;
  hasFridge: boolean;
  isKidsFriendly: boolean;
  isPetFriendly: boolean;
  isWheelchairAccessible: boolean;
}

export const DEFAULT_ROOM_FEATURES: RoomFeatures = {
  hasBalcony: false,
  hasAC: false,
  hasKitchen: false,
  hasLivingRoom: false,
  hasFridge: false,
  isKidsFriendly: false,
  isPetFriendly: false,
  isWheelchairAccessible: false,
};

export interface CreatePropertyDTO {
  estateId: string | null;
  assetTypeId: string | null;
  moduleId: string | null;
  propertyTypeId: string | null;
  name: string;
  code: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isExempt: boolean;
  status: PropertyStatus;
  images: string[];
  amenities: string[];
  metadata?: Record<string, any>;
  hallDetails?: HallDetails | null;
  shopDetails?: ShopDetails | null;
}

export interface UpdatePropertyDTO extends Partial<CreatePropertyDTO> {
  updatedBy?: string;
}

export interface CreateRoomDTO {
  floorId: string | null;
  roomTypeId: string | null;
  roomNumber: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  isSmokingAllowed: boolean;
  features?: RoomFeatures;
  viewType?: string;
  bedCount?: number;
  bedType?: string;
  metadata?: Record<string, any>;
}

export interface PropertyHierarchy {
  region: RegionDTO;
  estate: EstateDTO;
  property: PropertyDTO;
  blocks: BlockDTO[];
  floors: FloorDTO[];
  rooms: RoomDTO[];
}
