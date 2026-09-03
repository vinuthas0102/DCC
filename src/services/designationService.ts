import { supabase } from '../lib/supabase';
import { DesignationDTO } from '../types';

export const designationService = {
  async getDesignations(): Promise<DesignationDTO[]> {
    const { data, error } = await supabase
      .from('designation_master')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true });

    if (error) throw error;

    return (data || []).map((d) => ({
      id: d.id,
      designationName: d.designation_name,
      designationCode: d.designation_code,
      level: d.level,
      description: d.description || '',
      isActive: d.is_active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  },

  async createDesignation(
    name: string,
    code: string,
    level: number,
    description: string
  ): Promise<DesignationDTO> {
    const { data, error } = await supabase
      .from('designation_master')
      .insert({
        designation_name: name,
        designation_code: code,
        level,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      designationName: data.designation_name,
      designationCode: data.designation_code,
      level: data.level,
      description: data.description || '',
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateDesignation(
    id: string,
    updates: Partial<{
      name: string;
      code: string;
      level: number;
      description: string;
      isActive: boolean;
    }>
  ): Promise<DesignationDTO> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name) dbUpdates.designation_name = updates.name;
    if (updates.code) dbUpdates.designation_code = updates.code;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('designation_master')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      designationName: data.designation_name,
      designationCode: data.designation_code,
      level: data.level,
      description: data.description || '',
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};
