import { supabase } from '../../lib/supabase';

export async function getRoomCountsForProperties(propertyIds: string[]): Promise<Record<string, number>> {
  if (propertyIds.length === 0) return {};

  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id,
      floor:floors!inner(
        id,
        block:blocks!inner(
          id,
          property_id
        )
      )
    `)
    .eq('is_active', true)
    .in('floor.block.property_id', propertyIds);

  if (error) {
    console.error('Error fetching room counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  propertyIds.forEach(id => counts[id] = 0);

  if (data) {
    data.forEach((room: any) => {
      const propertyId = room.floor?.block?.property_id;
      if (propertyId) {
        counts[propertyId] = (counts[propertyId] || 0) + 1;
      }
    });
  }

  return counts;
}
