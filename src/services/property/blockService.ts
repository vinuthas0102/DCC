import { supabase } from '../../lib/supabase';
import { BlockDTO, FloorDTO } from '../../types';
import { mapBlockFromDb, mapFloorFromDb } from './mappers';

export async function getBlocks(propertyId: string): Promise<BlockDTO[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapBlockFromDb);
}

export async function getFloors(blockId: string): Promise<FloorDTO[]> {
  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('block_id', blockId)
    .eq('is_active', true)
    .order('floor_number');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapFloorFromDb);
}

export async function createBlock(block: { propertyId: string; name: string; code: string; floors: number }): Promise<BlockDTO> {
  const { data, error } = await supabase
    .from('blocks')
    .insert([
      {
        property_id: block.propertyId,
        name: block.name,
        code: block.code,
        floors: block.floors,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return mapBlockFromDb(data);
}

export async function createFloor(floor: { blockId: string; floorNumber: number; name: string }): Promise<FloorDTO> {
  const { data, error } = await supabase
    .from('floors')
    .insert([
      {
        block_id: floor.blockId,
        floor_number: floor.floorNumber,
        name: floor.name,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return mapFloorFromDb(data);
}

export async function updateBlock(id: string, updates: { name?: string; code?: string; floors?: number }): Promise<BlockDTO> {
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.code !== undefined) updateData.code = updates.code;
  if (updates.floors !== undefined) updateData.floors = updates.floors;

  const { data, error } = await supabase
    .from('blocks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapBlockFromDb(data);
}

export async function updateFloor(id: string, updates: { floorNumber?: number; name?: string }): Promise<FloorDTO> {
  const updateData: any = {};
  if (updates.floorNumber !== undefined) updateData.floor_number = updates.floorNumber;
  if (updates.name !== undefined) updateData.name = updates.name;

  const { data, error } = await supabase
    .from('floors')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapFloorFromDb(data);
}

export async function deleteBlock(id: string): Promise<void> {
  const { error } = await supabase
    .from('blocks')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteFloor(id: string): Promise<void> {
  const { error } = await supabase
    .from('floors')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}
