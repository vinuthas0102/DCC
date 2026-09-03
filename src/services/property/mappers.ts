import {
  RegionDTO,
  EstateDTO,
  ModuleDTO,
  PropertyTypeDTO,
  AssetTypeDTO,
  PropertyDTO,
  RoomTypeDTO,
  RoomDTO,
  AmenityDTO,
  BlockDTO,
  FloorDTO,
  DEFAULT_ROOM_FEATURES,
} from '../../types';

export function mapRegionFromDb(dbRegion: any): RegionDTO {
  return {
    id: dbRegion.id,
    name: dbRegion.name,
    code: dbRegion.code,
    description: dbRegion.description || '',
    isActive: dbRegion.is_active,
    createdAt: dbRegion.created_at,
    updatedAt: dbRegion.updated_at,
  };
}

export function mapEstateFromDb(dbEstate: any): EstateDTO {
  return {
    id: dbEstate.id,
    regionId: dbEstate.region_id,
    name: dbEstate.name,
    code: dbEstate.code,
    address: dbEstate.address || '',
    city: dbEstate.city || '',
    state: dbEstate.state || '',
    pincode: dbEstate.pincode || '',
    latitude: dbEstate.latitude,
    longitude: dbEstate.longitude,
    images: dbEstate.images || [],
    contactPerson: dbEstate.contact_person || '',
    contactEmail: dbEstate.contact_email || '',
    contactPhone: dbEstate.contact_phone || '',
    isActive: dbEstate.is_active,
    createdAt: dbEstate.created_at,
    updatedAt: dbEstate.updated_at,
    region: dbEstate.region ? mapRegionFromDb(dbEstate.region) : undefined,
  };
}

export function mapModuleFromDb(dbModule: any): ModuleDTO {
  return {
    id: dbModule.id,
    name: dbModule.name,
    code: dbModule.code,
    description: dbModule.description || '',
    isActive: dbModule.is_active,
    createdAt: dbModule.created_at,
    updatedAt: dbModule.updated_at,
  };
}

export function mapPropertyTypeFromDb(dbPropertyType: any): PropertyTypeDTO {
  return {
    id: dbPropertyType.id,
    moduleId: dbPropertyType.module_id,
    name: dbPropertyType.name,
    code: dbPropertyType.code,
    description: dbPropertyType.description || '',
    isActive: dbPropertyType.is_active,
    sortOrder: dbPropertyType.sort_order,
    createdAt: dbPropertyType.created_at,
    updatedAt: dbPropertyType.updated_at,
    module: dbPropertyType.module ? mapModuleFromDb(dbPropertyType.module) : undefined,
  };
}

export function mapAssetTypeFromDb(dbAssetType: any): AssetTypeDTO {
  return {
    id: dbAssetType.id,
    name: dbAssetType.name,
    subtype: dbAssetType.subtype || '',
    category: dbAssetType.category,
    description: dbAssetType.description || '',
    moduleId: dbAssetType.module_id,
    isActive: dbAssetType.is_active,
    createdAt: dbAssetType.created_at,
    module: dbAssetType.module ? mapModuleFromDb(dbAssetType.module) : undefined,
  };
}

export function mapPropertyFromDb(dbProperty: any): PropertyDTO {
  return {
    id: dbProperty.id,
    estateId: dbProperty.estate_id,
    assetTypeId: dbProperty.asset_type_id,
    moduleId: dbProperty.module_id,
    propertyTypeId: dbProperty.property_type_id,
    name: dbProperty.name,
    code: dbProperty.code,
    description: dbProperty.description || '',
    address: dbProperty.address || '',
    latitude: dbProperty.latitude,
    longitude: dbProperty.longitude,
    isExempt: dbProperty.is_exempt,
    status: dbProperty.status,
    images: dbProperty.images || [],
    amenities: dbProperty.amenities || [],
    metadata: dbProperty.metadata || {},
    hallDetails: dbProperty.hall_details ?? null,
    shopDetails: dbProperty.shop_details ?? null,
    createdBy: dbProperty.created_by,
    updatedBy: dbProperty.updated_by,
    createdAt: dbProperty.created_at,
    updatedAt: dbProperty.updated_at,
    estate: dbProperty.estate ? mapEstateFromDb(dbProperty.estate) : undefined,
    assetType: dbProperty.assetType ? mapAssetTypeFromDb(dbProperty.assetType) : undefined,
    module: dbProperty.module ? mapModuleFromDb(dbProperty.module) : undefined,
    propertyType: dbProperty.propertyType ? mapPropertyTypeFromDb(dbProperty.propertyType) : undefined,
  };
}

export function mapRoomTypeFromDb(dbRoomType: any): RoomTypeDTO {
  return {
    id: dbRoomType.id,
    name: dbRoomType.name,
    description: dbRoomType.description || '',
    defaultCapacity: dbRoomType.default_capacity,
    sortOrder: dbRoomType.sort_order,
    isActive: dbRoomType.is_active,
    createdAt: dbRoomType.created_at,
  };
}

export function mapRoomFromDb(dbRoom: any): RoomDTO {
  return {
    id: dbRoom.id,
    floorId: dbRoom.floor_id,
    roomTypeId: dbRoom.room_type_id,
    roomNumber: dbRoom.room_number,
    capacity: dbRoom.capacity,
    basePrice: dbRoom.base_price,
    amenities: dbRoom.amenities || [],
    isSmokingAllowed: dbRoom.is_smoking_allowed,
    features: { ...DEFAULT_ROOM_FEATURES, ...(dbRoom.features || {}) },
    viewType: dbRoom.view_type || '',
    bedCount: dbRoom.bed_count || 0,
    bedType: dbRoom.bed_type || '',
    metadata: dbRoom.metadata || {},
    status: dbRoom.status,
    isActive: dbRoom.is_active,
    createdAt: dbRoom.created_at,
    updatedAt: dbRoom.updated_at,
    roomType: dbRoom.roomType ? mapRoomTypeFromDb(dbRoom.roomType) : undefined,
    floor: dbRoom.floor ? mapFloorFromDb(dbRoom.floor) : undefined,
  };
}

export function mapAmenityFromDb(dbAmenity: any): AmenityDTO {
  return {
    id: dbAmenity.id,
    name: dbAmenity.name,
    icon: dbAmenity.icon || 'star',
    category: dbAmenity.category,
    sortOrder: dbAmenity.sort_order ?? 0,
    isActive: dbAmenity.is_active,
    createdAt: dbAmenity.created_at,
  };
}

export function mapBlockFromDb(dbBlock: any): BlockDTO {
  return {
    id: dbBlock.id,
    propertyId: dbBlock.property_id,
    name: dbBlock.name,
    code: dbBlock.code,
    floors: dbBlock.floors,
    isActive: dbBlock.is_active,
    createdAt: dbBlock.created_at,
  };
}

export function mapFloorFromDb(dbFloor: any): FloorDTO {
  return {
    id: dbFloor.id,
    blockId: dbFloor.block_id,
    floorNumber: dbFloor.floor_number,
    name: dbFloor.name || '',
    isActive: dbFloor.is_active,
    createdAt: dbFloor.created_at,
  };
}
