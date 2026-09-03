import { supabase } from '../../lib/supabase';
import { RoomDTO, RoomTypeDTO, CreateRoomDTO } from '../../types';
import { sanitizeUUID } from '../../utils/uuidHelpers';
import { mapRoomFromDb, mapRoomTypeFromDb } from './mappers';

export async function getRoomTypes(): Promise<RoomTypeDTO[]> {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapRoomTypeFromDb);
}

export async function getRooms(floorId?: string): Promise<RoomDTO[]> {
  let query = supabase
    .from('rooms')
    .select('*, roomType:room_types(*), floor:floors(*)');

  if (floorId) query = query.eq('floor_id', floorId);

  const { data, error } = await query.order('room_number');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapRoomFromDb);
}

export async function getRoomsByProperty(propertyId: string, filters?: { roomTypeId?: string; status?: string }): Promise<RoomDTO[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      roomType:room_types(*),
      floor:floors!inner(
        *,
        block:blocks!inner(
          *
        )
      )
    `)
    .eq('floor.block.property_id', propertyId)
    .eq('is_active', true)
    .then((result) => {
      if (result.error) return result;

      let filteredData = result.data;

      if (filters?.roomTypeId) {
        filteredData = filteredData?.filter(room => room.room_type_id === filters.roomTypeId);
      }

      if (filters?.status) {
        filteredData = filteredData?.filter(room => room.status === filters.status);
      }

      return { ...result, data: filteredData };
    });

  if (error) throw error;
  if (!data) return [];
  return data.map(mapRoomFromDb);
}

export async function createRoom(room: CreateRoomDTO): Promise<RoomDTO> {
  const { data, error } = await supabase
    .from('rooms')
    .insert([
      {
        floor_id: sanitizeUUID(room.floorId),
        room_type_id: sanitizeUUID(room.roomTypeId),
        room_number: room.roomNumber,
        capacity: room.capacity,
        base_price: room.basePrice,
        amenities: room.amenities,
        is_smoking_allowed: room.isSmokingAllowed,
        features: room.features || {},
        view_type: room.viewType || '',
        bed_count: room.bedCount || 0,
        bed_type: room.bedType || '',
        metadata: room.metadata || {},
      },
    ])
    .select('*, roomType:room_types(*), floor:floors(*)')
    .single();

  if (error) throw error;
  return mapRoomFromDb(data);
}

export async function updateRoom(id: string, updates: Partial<CreateRoomDTO>): Promise<RoomDTO> {
  const updateData: any = {};
  if (updates.floorId !== undefined) updateData.floor_id = sanitizeUUID(updates.floorId);
  if (updates.roomTypeId !== undefined) updateData.room_type_id = sanitizeUUID(updates.roomTypeId);
  if (updates.roomNumber !== undefined) updateData.room_number = updates.roomNumber;
  if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
  if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice;
  if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
  if (updates.isSmokingAllowed !== undefined) updateData.is_smoking_allowed = updates.isSmokingAllowed;
  if (updates.features !== undefined) updateData.features = updates.features;
  if (updates.viewType !== undefined) updateData.view_type = updates.viewType;
  if (updates.bedCount !== undefined) updateData.bed_count = updates.bedCount;
  if (updates.bedType !== undefined) updateData.bed_type = updates.bedType;
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

  const { data, error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', id)
    .select('*, roomType:room_types(*), floor:floors(*)')
    .single();

  if (error) throw error;
  return mapRoomFromDb(data);
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}
