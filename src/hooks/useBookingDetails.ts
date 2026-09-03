import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { allocationService } from '../services/allocationService';
import { paymentService } from '../services/paymentService';
import { useUIStore } from '../stores/uiStore';
import { BookingDTO, BookingAllocationDTO, TransactionDTO } from '../types';
import { ROUTES } from '../constants/routes';

export const useBookingDetails = (bookingId: string | undefined) => {
  const navigate = useNavigate();
  const addToast = useUIStore((state) => state.addToast);
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [allocations, setAllocations] = useState<BookingAllocationDTO[]>([]);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookingDetails = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      const [bookingData, allocationsData, transactionsData] = await Promise.all([
        bookingService.getBookingById(bookingId),
        allocationService.getAllocations(bookingId).catch(() => []),
        paymentService.getTransactions(bookingId).catch(() => []),
      ]);

      if (!bookingData) {
        addToast('Booking not found', 'error');
        navigate(ROUTES.PROPERTIES);
        return;
      }

      setBooking(bookingData);
      setAllocations(allocationsData);
      setTransactions(transactionsData);
    } catch (error: any) {
      addToast(error.message || 'Failed to load booking details', 'error');
      navigate(ROUTES.PROPERTIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  return { booking, allocations, transactions, loading, refetch: loadBookingDetails };
};
