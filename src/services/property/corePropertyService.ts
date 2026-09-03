import { supabase, validateSession, refreshSession } from '../../lib/supabase';
import { PropertyDTO, CreatePropertyDTO, UpdatePropertyDTO, BlockDTO, FloorDTO, RoomDTO } from '../../types';
import { UserRole } from '../../types';
import { sanitizeUUID } from '../../utils/uuidHelpers';
import { mapPropertyFromDb } from './mappers';
import { getRoomCountsForProperties } from './helpers';
import { getBlocks, getFloors } from './blockService';
import { getRooms } from './roomService';
import { DEMO_MODE, DEMO_AVAILABLE_PROPERTIES } from '../../mocks/demoData';

function getAllowedCategoriesForRole(userRole?: UserRole): string[] | null {
  if (!userRole || userRole === 'admin' || userRole === 'manager') return null;
  if (userRole === 'govt_official') return null;
  return ['B'];
}

export async function getProperties(filters?: {
  estateId?: string;
  assetTypeId?: string;
  moduleId?: string;
  propertyTypeId?: string;
  status?: string;
  isExempt?: boolean;
  userRole?: UserRole;
}): Promise<PropertyDTO[]> {
  if (DEMO_MODE) {
    let results = [...DEMO_AVAILABLE_PROPERTIES];
    if (filters?.estateId) results = results.filter(p => p.estateId === filters.estateId);
    if (filters?.assetTypeId) results = results.filter(p => p.assetTypeId === filters.assetTypeId);
    if (filters?.status) results = results.filter(p => p.status === filters.status);
    if (filters?.isExempt !== undefined) results = results.filter(p => p.isExempt === filters.isExempt);
    const allowedCats = getAllowedCategoriesForRole(filters?.userRole);
    if (allowedCats) results = results.filter(p => p.assetType && allowedCats.includes(p.assetType.category));
    return Promise.resolve(results);
  }

  let query = supabase
    .from('properties')
    .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))');

  if (filters?.estateId) query = query.eq('estate_id', filters.estateId);
  if (filters?.assetTypeId) query = query.eq('asset_type_id', filters.assetTypeId);
  if (filters?.moduleId) query = query.eq('module_id', filters.moduleId);
  if (filters?.propertyTypeId) query = query.eq('property_type_id', filters.propertyTypeId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.isExempt !== undefined) query = query.eq('is_exempt', filters.isExempt);

  const { data, error } = await query.order('name');

  if (error) throw error;
  if (!data) return [];

  let properties = data.map(mapPropertyFromDb);

  const allowedCategories = getAllowedCategoriesForRole(filters?.userRole);
  if (allowedCategories) {
    properties = properties.filter(
      (p) => p.assetType && allowedCategories.includes(p.assetType.category)
    );
  }

  if (properties.length > 0) {
    const propertyIds = properties.map(p => p.id);
    const roomCounts = await getRoomCountsForProperties(propertyIds);

    properties.forEach(property => {
      property.totalRooms = roomCounts[property.id] || 0;
    });
  }

  return properties;
}

export async function getPropertyById(id: string): Promise<PropertyDTO | null> {
  if (DEMO_MODE) {
    return Promise.resolve(DEMO_AVAILABLE_PROPERTIES.find(p => p.id === id) ?? null);
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const property = mapPropertyFromDb(data);

  const roomCounts = await getRoomCountsForProperties([id]);
  property.totalRooms = roomCounts[id] || 0;

  return property;
}

export async function checkPropertyCodeExists(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function createProperty(property: CreatePropertyDTO): Promise<PropertyDTO> {
  const validation = await validateSession();
  if (!validation.valid) {
    console.log('Session invalid, attempting refresh before property creation...');
    try {
      await refreshSession();
    } catch (refreshError) {
      throw new Error('Session expired. Please log out and log back in to continue.');
    }
  }

  const { data, error } = await supabase
    .from('properties')
    .insert([
      {
        estate_id: sanitizeUUID(property.estateId),
        asset_type_id: sanitizeUUID(property.assetTypeId),
        module_id: sanitizeUUID(property.moduleId),
        property_type_id: sanitizeUUID(property.propertyTypeId),
        name: property.name,
        code: property.code,
        description: property.description,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        is_exempt: property.isExempt,
        status: property.status,
        images: property.images,
        amenities: property.amenities,
        metadata: property.metadata || {},
        hall_details: property.hallDetails ?? null,
        shop_details: property.shopDetails ?? null,
      },
    ])
    .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
    .single();

  if (error) {
    if (error.message?.includes('row-level security') || error.code === '42501') {
      throw new Error('Permission denied. Please log out and log back in, then try again.');
    }
    throw error;
  }
  return mapPropertyFromDb(data);
}

export async function updateProperty(id: string, updates: UpdatePropertyDTO): Promise<PropertyDTO> {
  const validation = await validateSession();
  if (!validation.valid) {
    console.log('Session invalid, attempting refresh before property update...');
    try {
      await refreshSession();
    } catch (refreshError) {
      throw new Error('Session expired. Please log out and log back in to continue.');
    }
  }

  const updateData: any = { updated_at: new Date().toISOString() };

  if (updates.estateId !== undefined) updateData.estate_id = sanitizeUUID(updates.estateId);
  if (updates.assetTypeId !== undefined) updateData.asset_type_id = sanitizeUUID(updates.assetTypeId);
  if (updates.moduleId !== undefined) updateData.module_id = sanitizeUUID(updates.moduleId);
  if (updates.propertyTypeId !== undefined) updateData.property_type_id = sanitizeUUID(updates.propertyTypeId);
  if (updates.name) updateData.name = updates.name;
  if (updates.code) updateData.code = updates.code;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
  if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
  if (updates.isExempt !== undefined) updateData.is_exempt = updates.isExempt;
  if (updates.status) updateData.status = updates.status;
  if (updates.images) updateData.images = updates.images;
  if (updates.amenities) updateData.amenities = updates.amenities;
  if (updates.metadata) updateData.metadata = updates.metadata;
  if (updates.hallDetails !== undefined) updateData.hall_details = updates.hallDetails;
  if (updates.shopDetails !== undefined) updateData.shop_details = updates.shopDetails;
  if (updates.updatedBy) updateData.updated_by = sanitizeUUID(updates.updatedBy);

  const { data, error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', id)
    .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
    .single();

  if (error) {
    if (error.message?.includes('row-level security') || error.code === '42501') {
      throw new Error('Permission denied. Please log out and log back in, then try again.');
    }
    throw error;
  }
  return mapPropertyFromDb(data);
}

export async function getPropertyHierarchy(propertyId: string): Promise<{ property: PropertyDTO; blocks: BlockDTO[]; floors: FloorDTO[]; rooms: RoomDTO[] }> {
  const property = await getPropertyById(propertyId);
  if (!property) throw new Error('Property not found');

  const blocks = await getBlocks(propertyId);

  const floorsPromises = blocks.map(block => getFloors(block.id));
  const floorsArrays = await Promise.all(floorsPromises);
  const floors = floorsArrays.flat();

  const roomsPromises = floors.map(floor => getRooms(floor.id));
  const roomsArrays = await Promise.all(roomsPromises);
  const rooms = roomsArrays.flat();

  return { property, blocks, floors, rooms };
}
