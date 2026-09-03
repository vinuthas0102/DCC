import { useState } from 'react';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { BookingDTO, TransactionDTO } from '../types';

export const useBookingTracking = () => {
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchBooking = async (bookingNumber: string, otp: string) => {
    setError('');
    setLoading(true);
    setBooking(null);
    setTransactions([]);

    try {
      if (!bookingNumber.trim()) {
        setError('Please enter a booking number');
        return;
      }

      const result = await bookingService.getBookingByNumberAndOTP(
        bookingNumber.trim().toUpperCase(),
        otp.trim()
      );

      if (!result) {
        setError('Booking not found or invalid OTP. Please check your booking number and OTP.');
        return;
      }

      setBooking(result);

      const transactionsData = await paymentService.getTransactions(result.id);
      setTransactions(transactionsData);
    } catch (err: any) {
      console.error('Error fetching booking:', err);
      setError('Unable to retrieve booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string, bookingNumber: string, otp: string) => {
    try {
      await bookingService.cancelBooking(bookingId);

      const updatedBooking = await bookingService.getBookingByNumberAndOTP(
        bookingNumber.trim().toUpperCase(),
        otp.trim()
      );

      setBooking(updatedBooking);
      setError('');
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError('Unable to cancel booking. Please contact support.');
      throw err;
    }
  };

  return { booking, transactions, loading, error, searchBooking, cancelBooking };
};
