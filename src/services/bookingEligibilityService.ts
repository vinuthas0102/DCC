import { supabase } from '../lib/supabase';
import { dateBlockService } from './dateBlockService';
import { BookingEligibilityResult } from '../types';

class BookingEligibilityService {
  async checkAvailability(
    userId: string,
    propertyId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number
  ): Promise<BookingEligibilityResult> {
    const eligibilityCheck = await dateBlockService.checkUserEligibility(
      userId,
      propertyId,
      roomTypeId,
      checkInDate,
      checkOutDate
    );

    if (!eligibilityCheck.canBook) {
      return {
        canBook: false,
        reason: eligibilityCheck.reason,
      };
    }

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_number, status, floor:floors!inner(block:blocks!inner(property_id))')
      .eq('room_type_id', roomTypeId)
      .eq('is_active', true)
      .eq('status', 'AVAILABLE')
      .gte('capacity', 1);

    if (roomsError) throw roomsError;

    const propertyRooms = (rooms || []).filter(
      (room: any) => room.floor?.block?.property_id === propertyId
    );

    if (propertyRooms.length === 0) {
      return {
        canBook: false,
        reason: 'No rooms of this type exist for the selected property',
      };
    }

    if (propertyRooms.length < quantity) {
      return {
        canBook: false,
        reason: `Only ${propertyRooms.length} rooms available, but ${quantity} requested`,
      };
    }

    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('room_type_id, quantity')
      .eq('property_id', propertyId)
      .eq('room_type_id', roomTypeId)
      .neq('status', 'CANCELLED')
      .neq('status', 'REJECTED')
      .or(
        `and(check_in_date.lte.${checkOutDate},check_out_date.gte.${checkInDate})`
      );

    if (bookingsError) throw bookingsError;

    const bookedCount = (existingBookings || []).reduce(
      (sum, booking) => sum + (booking.quantity || 0),
      0
    );

    const actuallyAvailable = propertyRooms.length - bookedCount;

    if (actuallyAvailable < quantity) {
      return {
        canBook: false,
        reason: `Only ${actuallyAvailable} rooms available for these dates`,
      };
    }

    return { canBook: true };
  }

  async getRoomsAvailableForUser(
    userId: string,
    propertyId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<Array<{ roomTypeId: string; availableCount: number; isBlocked: boolean; reason?: string }>> {
    const { data: roomTypes, error: roomTypesError } = await supabase
      .from('room_types')
      .select('id, name')
      .eq('is_active', true);

    if (roomTypesError) throw roomTypesError;

    const results = await Promise.all(
      (roomTypes || []).map(async (roomType) => {
        const eligibility = await this.checkAvailability(
          userId,
          propertyId,
          roomType.id,
          checkInDate,
          checkOutDate,
          1
        );

        return {
          roomTypeId: roomType.id,
          availableCount: eligibility.canBook ? 1 : 0,
          isBlocked: !eligibility.canBook,
          reason: eligibility.reason,
        };
      })
    );

    return results;
  }

  async getBlockedRoomTypesForProperty(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<string[]> {
    const { affectedRoomTypeIds } = await dateBlockService.getBlockingRulesForProperty(
      propertyId,
      startDate,
      endDate
    );

    return affectedRoomTypeIds;
  }
}

export const bookingEligibilityService = new BookingEligibilityService();
