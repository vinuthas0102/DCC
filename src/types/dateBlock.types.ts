export interface DesignationDTO {
  id: string;
  designationName: string;
  designationCode: string;
  level: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DateBlockDTO {
  id: string;
  blockName: string;
  description: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ranges?: DateBlockRangeDTO[];
  rules?: DateBlockRuleDTO[];
  overrides?: PropertyDateOverrideDTO[];
}

export interface DateBlockRangeDTO {
  id: string;
  blockId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface DateBlockRuleDTO {
  id: string;
  blockId: string;
  assetTypeId: string;
  roomTypeIds: string[];
  allowedDesignations: string[];
  createdAt: string;
  assetType?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface PropertyDateOverrideDTO {
  id: string;
  blockId: string;
  propertyId: string;
  overrideType: 'ALLOW' | 'BLOCK';
  allowedDesignations: string[];
  roomTypeIds: string[];
  createdAt: string;
  property?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateDateBlockRequest {
  blockName: string;
  description: string;
  ranges: Array<{ startDate: string; endDate: string }>;
  rules: Array<{
    assetTypeId: string;
    roomTypeIds: string[];
    allowedDesignations: string[];
  }>;
}

export interface CreatePropertyOverrideRequest {
  blockId: string;
  propertyId: string;
  overrideType: 'ALLOW' | 'BLOCK';
  allowedDesignations: string[];
  roomTypeIds: string[];
}

export interface BookingEligibilityResult {
  canBook: boolean;
  reason?: string;
  blockedRoomTypeIds?: string[];
  alternativeDates?: string[];
}
