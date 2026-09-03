import { create } from 'zustand';
import { BookingDTO, BookingFilters } from '../types';
import { bookingService } from '../services/bookingService';

interface BookingStore {
  bookings: BookingDTO[];
  currentBooking: BookingDTO | null;
  loading: boolean;
  setBookings: (bookings: BookingDTO[]) => void;
  setCurrentBooking: (booking: BookingDTO | null) => void;
  fetchBookings: (filters?: BookingFilters) => Promise<void>;
  fetchBookingById: (id: string) => Promise<void>;
  clearCurrentBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  currentBooking: null,
  loading: false,

  setBookings: (bookings) => set({ bookings }),

  setCurrentBooking: (booking) => set({ currentBooking: booking }),

  fetchBookings: async (filters) => {
    set({ loading: true });
    try {
      const bookings = await bookingService.getBookings(filters);
      set({ bookings, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchBookingById: async (id) => {
    set({ loading: true });
    try {
      const booking = await bookingService.getBookingById(id);
      set({ currentBooking: booking, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCurrentBooking: () => set({ currentBooking: null }),
}));
