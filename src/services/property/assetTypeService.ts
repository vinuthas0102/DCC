import { supabase } from '../../lib/supabase';
import { AssetTypeDTO, ModuleDTO, PropertyTypeDTO, AmenityDTO } from '../../types';
import { sanitizeUUID } from '../../utils/uuidHelpers';
import { mapAssetTypeFromDb, mapModuleFromDb, mapPropertyTypeFromDb, mapAmenityFromDb } from './mappers';

export async function getAssetTypes(): Promise<AssetTypeDTO[]> {
  const { data, error } = await supabase
    .from('asset_types')
    .select('*, module:modules(*)')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapAssetTypeFromDb);
}

export async function createAssetType(assetType: { name: string; subtype: string; category: string; description?: string; moduleId?: string }): Promise<AssetTypeDTO> {
  const { data, error } = await supabase
    .from('asset_types')
    .insert([
      {
        name: assetType.name,
        subtype: assetType.subtype,
        category: assetType.category,
        description: assetType.description || '',
        module_id: assetType.moduleId ? sanitizeUUID(assetType.moduleId) : null,
      },
    ])
    .select('*, module:modules(*)')
    .single();

  if (error) throw error;
  return mapAssetTypeFromDb(data);
}

export async function updateAssetType(id: string, updates: { name?: string; subtype?: string; category?: string; description?: string; moduleId?: string; isActive?: boolean }): Promise<AssetTypeDTO> {
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.subtype !== undefined) updateData.subtype = updates.subtype;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.moduleId !== undefined) updateData.module_id = updates.moduleId ? sanitizeUUID(updates.moduleId) : null;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('asset_types')
    .update(updateData)
    .eq('id', id)
    .select('*, module:modules(*)')
    .single();

  if (error) throw error;
  return mapAssetTypeFromDb(data);
}

export async function getModules(): Promise<ModuleDTO[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapModuleFromDb);
}

export async function getPropertyTypes(moduleId?: string): Promise<PropertyTypeDTO[]> {
  let query = supabase
    .from('property_types')
    .select('*, module:modules(*)')
    .eq('is_active', true);

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data, error } = await query.order('sort_order');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapPropertyTypeFromDb);
}

export async function getAmenities(): Promise<AmenityDTO[]> {
  const { data, error } = await supabase
    .from('amenities')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  if (!data) return [];
  return data.map(mapAmenityFromDb);
}
