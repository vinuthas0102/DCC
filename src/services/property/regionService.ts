import { supabase } from '../../lib/supabase';
import { RegionDTO } from '../../types';
import { mapRegionFromDb } from './mappers';

export async function getRegions(): Promise<RegionDTO[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapRegionFromDb);
}

export async function createRegion(region: { name: string; code: string; description?: string }): Promise<RegionDTO> {
  const { data, error } = await supabase
    .from('regions')
    .insert([
      {
        name: region.name,
        code: region.code,
        description: region.description || '',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return mapRegionFromDb(data);
}

export async function updateRegion(id: string, updates: { name?: string; code?: string; description?: string; isActive?: boolean }): Promise<RegionDTO> {
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.code !== undefined) updateData.code = updates.code;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('regions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRegionFromDb(data);
}
