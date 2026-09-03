import { supabase } from '../lib/supabase';

export interface RoomAvailabilityData {
  id: string;
  roomNumber: string;
  roomType: {
    id: string;
    name: string;
  };
  floor: {
    id: string;
    name: string;
    floorNumber: number;
  };
  block: {
    id: string;
    name: string;
  };
  capacity: number;
  basePrice: number;
  status: string;
  availability: Record<string, RoomDayStatus>;
}

export interface RoomDayStatus {
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'blocked';
  bookingId?: string;
  bookingNumber?: string;
  guestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface AvailabilityStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  cleaningRooms: number;
  blockedRooms: number;
  occupancyRate: number;
  roomTypeBreakdown: Record<string, {
    total: number;
    available: number;
    occupied: number;
  }>;
}

class RoomAvailabilityService {
  async getRoomAvailabilityInsights(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ rooms: RoomAvailabilityData[]; stats: AvailabilityStats }> {
    const { data: blocks } = await supabase
      .from('blocks')
      .select('id, name, code')
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (!blocks || blocks.length === 0) {
      return { rooms: [], stats: this.getEmptyStats() };
    }

    const blockIds = blocks.map((b) => b.id);

    const { data: floors } = await supabase
      .from('floors')
      .select('id, block_id, floor_number, name')
      .in('block_id', blockIds)
      .eq('is_active', true);

    if (!floors || floors.length === 0) {
      return { rooms: [], stats: this.getEmptyStats() };
    }

    const floorIds = floors.map((f) => f.id);

    const { data: rooms } = await supabase
      .from('rooms')
      .select(`
        id,
        room_number,
        capacity,
        base_price,
        status,
        floor_id,
        room_type_id,
        room_types!inner(id, name)
      `)
      .in('floor_id', floorIds)
      .eq('is_active', true)
      .order('room_number');

    if (!rooms || rooms.length === 0) {
      return { rooms: [], stats: this.getEmptyStats() };
    }

    const roomIds = rooms.map((r) => r.id);

    const { data: bookingAllocations } = await supabase
      .from('booking_allocations')
      .select(`
        room_id,
        booking_id,
        bookings!inner(
          id,
          booking_number,
          check_in_date,
          check_out_date,
          status,
          guest_details
        )
      `)
      .in('room_id', roomIds);

    const dateRange = this.generateDateRange(startDate, endDate);
    const roomAvailabilityMap: Record<string, RoomAvailabilityData> = {};

    for (const room of rooms) {
      const floor = floors.find((f) => f.id === room.floor_id);
      const block = blocks.find((b) => b.id === floor?.block_id);

      const availability: Record<string, RoomDayStatus> = {};

      for (const date of dateRange) {
        if (room.status === 'MAINTENANCE') {
          availability[date] = { status: 'maintenance' };
        } else if (room.status === 'CLEANING') {
          availability[date] = { status: 'cleaning' };
        } else {
          availability[date] = { status: 'available' };
        }
      }

      if (bookingAllocations) {
        const roomAllocations = bookingAllocations.filter(
          (ba) => ba.room_id === room.id
        );

        for (const allocation of roomAllocations) {
          const rawBooking = allocation.bookings;
          const booking = Array.isArray(rawBooking) ? rawBooking[0] : rawBooking;

          if (
            booking &&
            booking.status !== 'CANCELLED' &&
            booking.status !== 'REJECTED'
          ) {
            const bookingDates = this.getDatesBetween(
              booking.check_in_date,
              booking.check_out_date
            );

            const guestName = booking.guest_details?.name || 'Guest';

            for (const date of bookingDates) {
              if (availability[date]) {
                availability[date] = {
                  status: 'occupied',
                  bookingId: booking.id,
                  bookingNumber: booking.booking_number,
                  guestName,
                  checkInDate: booking.check_in_date,
                  checkOutDate: booking.check_out_date,
                };
              }
            }
          }
        }
      }

      const roomTypeData = Array.isArray(room.room_types) ? room.room_types[0] : room.room_types;
      roomAvailabilityMap[room.id] = {
        id: room.id,
        roomNumber: room.room_number,
        roomType: {
          id: room.room_type_id,
          name: roomTypeData?.name ?? '',
        },
        floor: {
          id: floor?.id || '',
          name: floor?.name || '',
          floorNumber: floor?.floor_number || 0,
        },
        block: {
          id: block?.id || '',
          name: block?.name || '',
        },
        capacity: room.capacity,
        basePrice: room.base_price,
        status: room.status,
        availability,
      };
    }

    const roomsArray = Object.values(roomAvailabilityMap);
    const stats = this.calculateStats(roomsArray, dateRange[0]);

    return { rooms: roomsArray, stats };
  }

  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private getDatesBetween(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private calculateStats(
    rooms: RoomAvailabilityData[],
    referenceDate: string
  ): AvailabilityStats {
    const stats: AvailabilityStats = {
      totalRooms: rooms.length,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
      cleaningRooms: 0,
      blockedRooms: 0,
      occupancyRate: 0,
      roomTypeBreakdown: {},
    };

    for (const room of rooms) {
      const dayStatus = room.availability[referenceDate];

      if (dayStatus) {
        switch (dayStatus.status) {
          case 'available':
            stats.availableRooms++;
            break;
          case 'occupied':
            stats.occupiedRooms++;
            break;
          case 'maintenance':
            stats.maintenanceRooms++;
            break;
          case 'cleaning':
            stats.cleaningRooms++;
            break;
          case 'blocked':
            stats.blockedRooms++;
            break;
        }
      }

      if (!stats.roomTypeBreakdown[room.roomType.name]) {
        stats.roomTypeBreakdown[room.roomType.name] = {
          total: 0,
          available: 0,
          occupied: 0,
        };
      }

      stats.roomTypeBreakdown[room.roomType.name].total++;

      if (dayStatus?.status === 'available') {
        stats.roomTypeBreakdown[room.roomType.name].available++;
      } else if (dayStatus?.status === 'occupied') {
        stats.roomTypeBreakdown[room.roomType.name].occupied++;
      }
    }

    stats.occupancyRate =
      stats.totalRooms > 0
        ? (stats.occupiedRooms / stats.totalRooms) * 100
        : 0;

    return stats;
  }

  private getEmptyStats(): AvailabilityStats {
    return {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
      cleaningRooms: 0,
      blockedRooms: 0,
      occupancyRate: 0,
      roomTypeBreakdown: {},
    };
  }

  async getOccupancyTrend(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ date: string; occupancyRate: number }[]> {
    const { rooms } = await this.getRoomAvailabilityInsights(
      propertyId,
      startDate,
      endDate
    );

    const dateRange = this.generateDateRange(startDate, endDate);
    const trend: { date: string; occupancyRate: number }[] = [];

    for (const date of dateRange) {
      let occupiedCount = 0;
      const totalRooms = rooms.length;

      for (const room of rooms) {
        if (room.availability[date]?.status === 'occupied') {
          occupiedCount++;
        }
      }

      const occupancyRate =
        totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;

      trend.push({ date, occupancyRate });
    }

    return trend;
  }
}

export const roomAvailabilityService = new RoomAvailabilityService();
