import { supabase } from '../../lib/supabase';
import { EstateDTO } from '../../types';
import { sanitizeUUID } from '../../utils/uuidHelpers';
import { mapEstateFromDb } from './mappers';

export async function getEstates(regionId?: string): Promise<EstateDTO[]> {
  let query = supabase.from('estates').select('*, region:regions(*)').eq('is_active', true);

  if (regionId) {
    query = query.eq('region_id', regionId);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  if (!data) return [];
  return data.map(mapEstateFromDb);
}

export async function createEstate(estate: { regionId: string; name: string; code: string; city: string; state: string; address?: string; pincode?: string; latitude?: number; longitude?: number; images?: string[]; contactPerson?: string; contactEmail?: string; contactPhone?: string }): Promise<EstateDTO> {
  const { data, error } = await supabase
    .from('estates')
    .insert([
      {
        region_id: sanitizeUUID(estate.regionId),
        name: estate.name,
        code: estate.code,
        city: estate.city,
        state: estate.state,
        address: estate.address || '',
        pincode: estate.pincode || '',
        latitude: estate.latitude,
        longitude: estate.longitude,
        images: estate.images || [],
        contact_person: estate.contactPerson || '',
        contact_email: estate.contactEmail || '',
        contact_phone: estate.contactPhone || '',
      },
    ])
    .select('*, region:regions(*)')
    .single();

  if (error) throw error;
  return mapEstateFromDb(data);
}

export async function updateEstate(id: string, updates: { regionId?: string; name?: string; code?: string; city?: string; state?: string; address?: string; pincode?: string; latitude?: number; longitude?: number; images?: string[]; contactPerson?: string; contactEmail?: string; contactPhone?: string; isActive?: boolean }): Promise<EstateDTO> {
  const updateData: any = {};
  if (updates.regionId !== undefined) updateData.region_id = sanitizeUUID(updates.regionId);
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.code !== undefined) updateData.code = updates.code;
  if (updates.city !== undefined) updateData.city = updates.city;
  if (updates.state !== undefined) updateData.state = updates.state;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.pincode !== undefined) updateData.pincode = updates.pincode;
  if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
  if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
  if (updates.images !== undefined) updateData.images = updates.images;
  if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson;
  if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
  if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('estates')
    .update(updateData)
    .eq('id', id)
    .select('*, region:regions(*)')
    .single();

  if (error) throw error;
  return mapEstateFromDb(data);
}
