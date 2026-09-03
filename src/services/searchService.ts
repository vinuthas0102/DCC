import { supabase } from '../lib/supabase';
import { PropertyDTO, SearchFilters } from '../types';

async function getPropertyPricing(propertyId: string): Promise<{ minPrice: number | null; maxPrice: number | null }> {
  const { data: rooms } = await supabase
    .from('rooms')
    .select('base_price, floor:floors!inner(block:blocks!inner(property_id))')
    .eq('status', 'AVAILABLE')
    .eq('is_active', true);

  if (!rooms || rooms.length === 0) {
    return { minPrice: null, maxPrice: null };
  }

  const propertyRooms = rooms.filter(
    (room: any) => room.floor?.block?.property_id === propertyId
  );

  if (propertyRooms.length === 0) {
    return { minPrice: null, maxPrice: null };
  }

  const prices = propertyRooms.map((r: any) => parseFloat(r.base_price)).filter(p => p > 0);

  if (prices.length === 0) {
    return { minPrice: null, maxPrice: null };
  }

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

export const searchService = {
  searchProperties: async (filters: SearchFilters): Promise<PropertyDTO[]> => {
    let query = supabase
      .from('properties')
      .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
      .eq('status', 'PUBLISHED')
      .eq('is_exempt', false);

    if (filters.moduleId) {
      query = query.eq('module_id', filters.moduleId);
    }

    if (filters.propertyTypeId) {
      query = query.eq('property_type_id', filters.propertyTypeId);
    }

    if (filters.assetTypeId) {
      query = query.eq('asset_type_id', filters.assetTypeId);
    }

    if (filters.location) {
      query = query.or(
        `name.ilike.%${filters.location}%,address.ilike.%${filters.location}%,estate.city.ilike.%${filters.location}%`
      );
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    let properties = data.map(mapPropertyFromDb);

    const propertiesWithPricing = await Promise.all(
      properties.map(async (property) => {
        const pricing = await getPropertyPricing(property.id);
        return {
          ...property,
          minPrice: pricing.minPrice,
          maxPrice: pricing.maxPrice,
        };
      })
    );

    properties = propertiesWithPricing.filter(
      (property) => property.minPrice !== null && property.maxPrice !== null
    );

    if (filters.latitude && filters.longitude && filters.radius) {
      properties = properties.filter((property) => {
        if (!property.latitude || !property.longitude) return false;

        const distance = calculateDistance(
          filters.latitude!,
          filters.longitude!,
          property.latitude,
          property.longitude
        );

        return distance <= filters.radius!;
      });
    }

    if (filters.checkInDate && filters.checkOutDate && filters.roomTypeId) {
      const availabilityPromises = properties.map(async (property) => {
        const { data: rooms } = await supabase
          .from('rooms')
          .select('*, floor:floors!inner(block:blocks!inner(property_id))')
          .eq('room_type_id', filters.roomTypeId)
          .eq('status', 'AVAILABLE');

        const propertyRooms = (rooms || []).filter(
          (room: any) => room.floor?.block?.property_id === property.id
        );

        if (propertyRooms.length === 0) return null;

        const { data: conflicts } = await supabase
          .from('booking_allocations')
          .select('room_id, booking:bookings!inner(check_in_date, check_out_date)')
          .in(
            'room_id',
            propertyRooms.map((r: any) => r.id)
          )
          .in('booking.status', ['ALLOCATED', 'CHECKED_IN']);

        const conflictingRoomIds = new Set(
          (conflicts || [])
            .filter((alloc: any) => {
              const allocCheckIn = new Date(alloc.booking.check_in_date);
              const allocCheckOut = new Date(alloc.booking.check_out_date);
              const requestCheckIn = new Date(filters.checkInDate!);
              const requestCheckOut = new Date(filters.checkOutDate!);

              return (
                (requestCheckIn >= allocCheckIn && requestCheckIn < allocCheckOut) ||
                (requestCheckOut > allocCheckIn && requestCheckOut <= allocCheckOut) ||
                (requestCheckIn <= allocCheckIn && requestCheckOut >= allocCheckOut)
              );
            })
            .map((alloc: any) => alloc.room_id)
        );

        const availableCount = propertyRooms.filter(
          (room: any) => !conflictingRoomIds.has(room.id)
        ).length;

        return availableCount > 0 ? property : null;
      });

      const availableProperties = await Promise.all(availabilityPromises);
      properties = availableProperties.filter((p) => p !== null) as PropertyDTO[];
    }

    if (filters.amenities && filters.amenities.length > 0) {
      properties = properties.filter((property) =>
        filters.amenities!.every((amenityId) => property.amenities.includes(amenityId))
      );
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceFilteredProperties = await Promise.all(
        properties.map(async (property) => {
          const { data: rooms } = await supabase
            .from('rooms')
            .select('base_price, floor:floors!inner(block:blocks!inner(property_id))')
            .eq('is_active', true);

          const propertyRooms = (rooms || []).filter(
            (room: any) => room.floor?.block?.property_id === property.id
          );

          if (propertyRooms.length === 0) return null;

          const minRoomPrice = Math.min(...propertyRooms.map((r: any) => parseFloat(r.base_price)));

          if (filters.minPrice !== undefined && minRoomPrice < filters.minPrice) return null;
          if (filters.maxPrice !== undefined && minRoomPrice > filters.maxPrice) return null;

          return property;
        })
      );

      properties = priceFilteredProperties.filter((p) => p !== null) as PropertyDTO[];
    }

    return properties;
  },
};

function mapPropertyFromDb(dbProperty: any): PropertyDTO {
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
    createdBy: dbProperty.created_by,
    updatedBy: dbProperty.updated_by,
    createdAt: dbProperty.created_at,
    updatedAt: dbProperty.updated_at,
    estate: dbProperty.estate,
    assetType: dbProperty.assetType,
    module: dbProperty.module,
    propertyType: dbProperty.propertyType,
  };
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
