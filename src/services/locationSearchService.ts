import { supabase } from '../lib/supabase';
import { PropertyDTO } from '../types';

interface LocationSearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  moduleId?: string;
  propertyTypeId?: string;
}

export const locationSearchService = {
  searchPropertiesByLocation: async ({
    latitude,
    longitude,
    radiusKm = 20,
    moduleId,
    propertyTypeId,
  }: LocationSearchParams): Promise<PropertyDTO[]> => {
    const latDiff = radiusKm / 111;
    const lngDiff = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const minLat = latitude - latDiff;
    const maxLat = latitude + latDiff;
    const minLng = longitude - lngDiff;
    const maxLng = longitude + lngDiff;

    let query = supabase
      .from('properties')
      .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
      .eq('status', 'ACTIVE')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    if (propertyTypeId) {
      query = query.eq('property_type_id', propertyTypeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    const properties = data.map((dbProperty: any) => ({
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
      createdBy: dbProperty.created_by,
      updatedBy: dbProperty.updated_by,
      createdAt: dbProperty.created_at,
      updatedAt: dbProperty.updated_at,
      estate: dbProperty.estate ? {
        id: dbProperty.estate.id,
        regionId: dbProperty.estate.region_id,
        name: dbProperty.estate.name,
        code: dbProperty.estate.code,
        address: dbProperty.estate.address || '',
        city: dbProperty.estate.city || '',
        state: dbProperty.estate.state || '',
        pincode: dbProperty.estate.pincode || '',
        images: dbProperty.estate.images || [],
        contactPerson: dbProperty.estate.contact_person || '',
        contactEmail: dbProperty.estate.contact_email || '',
        contactPhone: dbProperty.estate.contact_phone || '',
        isActive: dbProperty.estate.is_active,
        createdAt: dbProperty.estate.created_at,
        updatedAt: dbProperty.estate.updated_at,
      } : undefined,
      assetType: dbProperty.assetType ? {
        id: dbProperty.assetType.id,
        name: dbProperty.assetType.name,
        subtype: dbProperty.assetType.subtype || '',
        category: dbProperty.assetType.category,
        description: dbProperty.assetType.description || '',
        moduleId: dbProperty.assetType.module_id,
        isActive: dbProperty.assetType.is_active,
        createdAt: dbProperty.assetType.created_at,
      } : undefined,
      module: dbProperty.module ? {
        id: dbProperty.module.id,
        name: dbProperty.module.name,
        code: dbProperty.module.code,
        description: dbProperty.module.description || '',
        isActive: dbProperty.module.is_active,
        createdAt: dbProperty.module.created_at,
        updatedAt: dbProperty.module.updated_at,
      } : undefined,
      propertyType: dbProperty.propertyType ? {
        id: dbProperty.propertyType.id,
        moduleId: dbProperty.propertyType.module_id,
        name: dbProperty.propertyType.name,
        code: dbProperty.propertyType.code,
        description: dbProperty.propertyType.description || '',
        isActive: dbProperty.propertyType.is_active,
        sortOrder: dbProperty.propertyType.sort_order,
        createdAt: dbProperty.propertyType.created_at,
        updatedAt: dbProperty.propertyType.updated_at,
      } : undefined,
    }));

    return properties.map((property) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(String(property.latitude ?? 0)),
        parseFloat(String(property.longitude ?? 0))
      );
      return { ...property, distance } as PropertyDTO & { distance: number };
    }).sort((a, b) => (a as { distance: number }).distance - (b as { distance: number }).distance) as PropertyDTO[];
  },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
