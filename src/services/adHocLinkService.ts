import { supabase } from '../lib/supabase';
import { AdHocLinkDTO, CreateAdHocLinkDTO } from '../types';

export const adHocLinkService = {
  createLink: async (managerId: string, linkData: CreateAdHocLinkDTO): Promise<AdHocLinkDTO> => {
    const token = generateToken();

    const { data, error } = await supabase
      .from('ad_hoc_links')
      .insert([
        {
          token,
          manager_id: managerId,
          property_id: linkData.propertyId,
          expires_at: linkData.expiresAt,
          metadata: linkData.metadata || {},
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return mapLinkFromDb(data);
  },

  getLinks: async (managerId: string): Promise<AdHocLinkDTO[]> => {
    const { data, error } = await supabase
      .from('ad_hoc_links')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapLinkFromDb);
  },

  getLinkByToken: async (token: string): Promise<AdHocLinkDTO | null> => {
    const { data, error } = await supabase
      .from('ad_hoc_links')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapLinkFromDb(data);
  },

  markLinkAsUsed: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('ad_hoc_links')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};

function mapLinkFromDb(dbLink: any): AdHocLinkDTO {
  return {
    id: dbLink.id,
    token: dbLink.token,
    managerId: dbLink.manager_id,
    propertyId: dbLink.property_id,
    expiresAt: dbLink.expires_at,
    metadata: dbLink.metadata || {},
    used: dbLink.used,
    usedAt: dbLink.used_at,
    createdAt: dbLink.created_at,
  };
}

function generateToken(): string {
  return `AHL${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
