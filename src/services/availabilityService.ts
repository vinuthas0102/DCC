import { supabase } from '../lib/supabase';
import { dateBlockService } from './dateBlockService';

export interface DayAvailability {
  date: string;
  totalRooms: number;
  bookedRooms: number;
  blockedRooms: number;
  availableRooms: number;
  status: 'available' | 'partial' | 'full' | 'blocked';
}

class AvailabilityService {
  private generateEmptyAvailability(month: number, year: number, lastDay: number): DayAvailability[] {
    const availability: DayAvailability[] = [];
    for (let day = 1; day <= lastDay; day++) {
      const currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      availability.push({
        date: currentDate,
        totalRooms: 0,
        bookedRooms: 0,
        blockedRooms: 0,
        availableRooms: 0,
        status: 'full',
      });
    }
    return availability;
  }

  async getPropertyAvailability(
    propertyId: string,
    month: number,
    year: number
  ): Promise<DayAvailability[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    console.log('🔍 [Availability] Fetching for property:', propertyId, 'Month:', month, 'Year:', year);

    const { data: propertyBlocks } = await supabase
      .from('blocks')
      .select('id')
      .eq('property_id', propertyId)
      .eq('is_active', true);

    const blockIds = (propertyBlocks || []).map((b) => b.id);
    console.log('📦 [Availability] Found blocks:', blockIds.length, blockIds);

    if (blockIds.length === 0) {
      console.warn('⚠️ [Availability] No blocks found - returning empty availability');
      return this.generateEmptyAvailability(month, year, lastDay);
    }

    const { data: floors } = await supabase
      .from('floors')
      .select('id')
      .in('block_id', blockIds)
      .eq('is_active', true);

    const floorIds = (floors || []).map((f) => f.id);
    console.log('🏢 [Availability] Found floors:', floorIds.length, floorIds);

    if (floorIds.length === 0) {
      console.warn('⚠️ [Availability] No floors found - returning empty availability');
      return this.generateEmptyAvailability(month, year, lastDay);
    }

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_type_id, status, is_active')
      .in('floor_id', floorIds)
      .in('status', ['AVAILABLE', 'OCCUPIED'])
      .eq('is_active', true);

    if (roomsError) {
      console.error('❌ [Availability] Rooms query error:', roomsError);
      throw roomsError;
    }

    console.log('🚪 [Availability] Found rooms:', rooms?.length || 0, rooms);

    const totalRooms = (rooms || []).filter((r) => r.status === 'AVAILABLE').length;
    console.log('✅ [Availability] Total available rooms:', totalRooms);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('check_in_date, check_out_date, quantity, room_type_id, status')
      .eq('property_id', propertyId)
      .neq('status', 'CANCELLED')
      .neq('status', 'REJECTED')
      .lte('check_in_date', endDate)
      .gte('check_out_date', startDate);

    if (bookingsError) {
      console.error('❌ [Availability] Bookings query error:', bookingsError);
      throw bookingsError;
    }

    console.log('📅 [Availability] Found bookings:', bookings?.length || 0, bookings);

    const { blocks } = await dateBlockService.getBlockingRulesForProperty(
      propertyId,
      startDate,
      endDate
    );

    console.log('🚫 [Availability] Found date blocks:', blocks.length, blocks);

    const availability: DayAvailability[] = [];

    for (let day = 1; day <= lastDay; day++) {
      const currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const bookedOnDay = (bookings || [])
        .filter(
          (b) =>
            b.check_in_date <= currentDate && b.check_out_date >= currentDate
        )
        .reduce((sum, b) => sum + (b.quantity || 0), 0);

      const isBlocked = blocks.some((block) =>
        block.ranges?.some((r) => r.startDate <= currentDate && r.endDate >= currentDate)
      );

      const blockedRooms = isBlocked ? Math.floor(totalRooms * 0.5) : 0;
      const availableRooms = Math.max(0, totalRooms - bookedOnDay - blockedRooms);

      let status: 'available' | 'partial' | 'full' | 'blocked' = 'available';
      if (isBlocked && availableRooms === 0) {
        status = 'blocked';
      } else if (availableRooms === 0) {
        status = 'full';
      } else if (availableRooms < totalRooms * 0.3) {
        status = 'partial';
      }

      if (day === 1) {
        console.log(`📊 [Availability] Day ${day}: total=${totalRooms}, booked=${bookedOnDay}, blocked=${blockedRooms}, available=${availableRooms}, status=${status}`);
      }

      availability.push({
        date: currentDate,
        totalRooms,
        bookedRooms: bookedOnDay,
        blockedRooms,
        availableRooms,
        status,
      });
    }

    console.log('✨ [Availability] Generated availability for', availability.length, 'days');
    return availability;
  }

  async getMonthlyStats(propertyId: string, month: number, year: number) {
    const availability = await this.getPropertyAvailability(propertyId, month, year);

    return {
      totalDays: availability.length,
      fullyAvailable: availability.filter((d) => d.status === 'available').length,
      partiallyAvailable: availability.filter((d) => d.status === 'partial').length,
      fullyBooked: availability.filter((d) => d.status === 'full').length,
      blocked: availability.filter((d) => d.status === 'blocked').length,
      averageOccupancy: availability.reduce((sum, d) => sum + (d.bookedRooms / d.totalRooms) * 100, 0) / availability.length,
    };
  }
}

export const availabilityService = new AvailabilityService();
