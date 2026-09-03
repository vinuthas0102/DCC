import { useCallback } from 'react';
import { BookingDTO } from '../types';

export interface BookingEmailData {
  bookingNumber: string;
  otp: string;
  guestEmail: string;
  guestName: string;
  guestPhone: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  roomTypeName?: string;
  quantity: number;
}

export interface CancellationEmailData {
  bookingNumber: string;
  guestEmail: string;
  guestName: string;
  propertyName: string;
  cancellationDate: string;
}

export const useBookingEmailNotification = () => {
  const sendBookingConfirmation = useCallback((booking: BookingDTO, otp: string) => {
    const emailData: BookingEmailData = {
      bookingNumber: booking.bookingNumber,
      otp,
      guestEmail: booking.guestDetails.email || '',
      guestName: booking.guestDetails.fullName || '',
      guestPhone: booking.guestDetails.phone || '',
      propertyName: booking.property?.name || 'Property',
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      totalAmount: booking.totalAmount,
      roomTypeName: booking.roomType?.name,
      quantity: booking.quantity,
    };

    console.log('📧 Booking Confirmation Email Data:', emailData);

    return emailData;
  }, []);

  const sendCancellationNotification = useCallback((booking: BookingDTO) => {
    const emailData: CancellationEmailData = {
      bookingNumber: booking.bookingNumber,
      guestEmail: booking.guestDetails.email || '',
      guestName: booking.guestDetails.fullName || '',
      propertyName: booking.property?.name || 'Property',
      cancellationDate: new Date().toISOString(),
    };

    console.log('📧 Booking Cancellation Email Data:', emailData);

    return emailData;
  }, []);

  return {
    sendBookingConfirmation,
    sendCancellationNotification,
  };
};
