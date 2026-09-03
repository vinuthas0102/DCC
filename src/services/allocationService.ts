import { supabase } from '../lib/supabase';
import { BookingAllocationDTO, CreateAllocationDTO } from '../types';

export const allocationService = {
  getAllocations: async (bookingId: string): Promise<BookingAllocationDTO[]> => {
    const { data, error } = await supabase
      .from('booking_allocations')
      .select('*, room:rooms(*, roomType:room_types(*))')
      .eq('booking_id', bookingId);

    if (error) throw error;
    return data.map(mapAllocationFromDb);
  },

  createAllocation: async (
    allocation: CreateAllocationDTO,
    userId: string
  ): Promise<BookingAllocationDTO> => {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('property_id, room_type_id')
      .eq('id', allocation.bookingId)
      .maybeSingle();

    if (bookingError) throw bookingError;
    if (!booking) throw new Error('Booking not found');

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, room_type_id, floor:floors!inner(block:blocks!inner(property_id))')
      .eq('id', allocation.roomId)
      .maybeSingle();

    if (roomError) throw roomError;
    if (!room) throw new Error('Room not found');

    const roomPropertyId = (room as any).floor?.block?.property_id;

    if (roomPropertyId !== booking.property_id) {
      throw new Error('Room does not belong to the booking property');
    }

    if (room.room_type_id !== booking.room_type_id) {
      throw new Error('Room type does not match booking room type');
    }

    const { data: existingAllocation } = await supabase
      .from('booking_allocations')
      .select('id')
      .eq('room_id', allocation.roomId)
      .maybeSingle();

    if (existingAllocation) {
      throw new Error('Room is already allocated to another booking');
    }

    const { data, error } = await supabase
      .from('booking_allocations')
      .insert([
        {
          booking_id: allocation.bookingId,
          room_id: allocation.roomId,
          allocated_by: userId,
          allocated_at: new Date().toISOString(),
        },
      ])
      .select('*, room:rooms(*, roomType:room_types(*))')
      .single();

    if (error) throw error;

    await supabase.from('rooms').update({ status: 'OCCUPIED' }).eq('id', allocation.roomId);

    return mapAllocationFromDb(data);
  },

  deleteAllocation: async (id: string): Promise<void> => {
    const { data: allocation } = await supabase
      .from('booking_allocations')
      .select('room_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('booking_allocations').delete().eq('id', id);

    if (error) throw error;

    if (allocation) {
      await supabase.from('rooms').update({ status: 'AVAILABLE' }).eq('id', allocation.room_id);
    }
  },

  checkInBooking: async (
    bookingId: string,
    signature: string
  ): Promise<BookingAllocationDTO[]> => {
    const { data, error } = await supabase
      .from('booking_allocations')
      .update({
        check_in_time: new Date().toISOString(),
        guest_signature: signature,
      })
      .eq('booking_id', bookingId)
      .select('*, room:rooms(*, roomType:room_types(*))');

    if (error) throw error;

    await supabase
      .from('bookings')
      .update({ status: 'CHECKED_IN' })
      .eq('id', bookingId);

    return data.map(mapAllocationFromDb);
  },

  checkOutBooking: async (bookingId: string): Promise<void> => {
    const { data: allocations } = await supabase
      .from('booking_allocations')
      .select('room_id')
      .eq('booking_id', bookingId);

    await supabase
      .from('booking_allocations')
      .update({
        check_out_time: new Date().toISOString(),
      })
      .eq('booking_id', bookingId);

    await supabase
      .from('bookings')
      .update({ status: 'CHECKED_OUT' })
      .eq('id', bookingId);

    if (allocations) {
      for (const alloc of allocations) {
        await supabase.from('rooms').update({ status: 'CLEANING' }).eq('id', alloc.room_id);
      }
    }
  },

  markRoomCleaned: async (roomId: string): Promise<void> => {
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'AVAILABLE' })
      .eq('id', roomId);

    if (error) throw error;
  },
};

function mapAllocationFromDb(dbAllocation: any): BookingAllocationDTO {
  return {
    id: dbAllocation.id,
    bookingId: dbAllocation.booking_id,
    roomId: dbAllocation.room_id,
    allocatedBy: dbAllocation.allocated_by,
    allocatedAt: dbAllocation.allocated_at,
    checkInTime: dbAllocation.check_in_time,
    checkOutTime: dbAllocation.check_out_time,
    guestSignature: dbAllocation.guest_signature || '',
    room: dbAllocation.room,
  };
}
