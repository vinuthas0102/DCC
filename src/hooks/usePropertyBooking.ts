import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { bookingEligibilityService } from '../services/bookingEligibilityService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { validateBookingForm } from '../utils/bookingValidation';
import { GuestDetails } from '../types';
import { ROUTES } from '../constants/routes';

interface BookingFormData {
  checkIn: string;
  checkOut: string;
  roomTypeId: string;
  quantity: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adultCount: number;
  childCount: number;
  requirements: string;
}

export const usePropertyBooking = (propertyId: string | undefined, requiresLogin: boolean) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  const createBooking = async (formData: BookingFormData) => {
    if (requiresLogin && !user) {
      addToast('Please login to make a booking for Government Facilities', 'error');
      navigate(ROUTES.LOGIN);
      return;
    }

    const validation = validateBookingForm({
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      roomTypeId: formData.roomTypeId,
      guestName: formData.guestName,
      guestEmail: formData.guestEmail,
      guestPhone: formData.guestPhone,
      adultCount: formData.adultCount,
    });

    if (!validation.valid) {
      addToast(validation.error || 'Validation failed', 'error');
      return;
    }

    setLoading(true);
    try {
      const guestDetails: GuestDetails = {
        fullName: formData.guestName,
        email: formData.guestEmail,
        phone: formData.guestPhone,
        numberOfGuests: formData.adultCount + formData.childCount,
        numberOfAdults: formData.adultCount,
        numberOfChildren: formData.childCount,
      };

      if (user) {
        const eligibility = await bookingEligibilityService.checkAvailability(
          user.id,
          propertyId!,
          formData.roomTypeId,
          formData.checkIn,
          formData.checkOut,
          formData.quantity
        );

        if (!eligibility.canBook) {
          addToast(eligibility.reason || 'Cannot book for selected dates', 'error');
          setLoading(false);
          return;
        }

        const booking = await bookingService.createBooking(user.id, {
          propertyId: propertyId!,
          roomTypeId: formData.roomTypeId,
          quantity: formData.quantity,
          checkInDate: formData.checkIn,
          checkOutDate: formData.checkOut,
          guestDetails,
          specialRequirements: formData.requirements,
        });

        const paymentParams = new URLSearchParams({
          bookingId: booking.id,
          amount: booking.totalAmount.toString(),
          returnUrl: ROUTES.BOOKING_CONFIRMATION,
        });

        navigate(`${ROUTES.PAYMENT}?${paymentParams.toString()}`);
      } else {
        const availability = await bookingService.checkAvailability({
          propertyId: propertyId!,
          roomTypeId: formData.roomTypeId,
          checkInDate: formData.checkIn,
          checkOutDate: formData.checkOut,
          quantity: formData.quantity,
        });

        if (!availability.available) {
          addToast('Selected rooms are not available for these dates', 'error');
          setLoading(false);
          return;
        }

        const result = await bookingService.createGuestBooking(
          {
            propertyId: propertyId!,
            roomTypeId: formData.roomTypeId,
            quantity: formData.quantity,
            checkInDate: formData.checkIn,
            checkOutDate: formData.checkOut,
            guestDetails,
            specialRequirements: formData.requirements,
          },
          {
            name: formData.guestName,
            email: formData.guestEmail,
            phone: formData.guestPhone,
          }
        );

        const paymentParams = new URLSearchParams({
          bookingId: result.booking.id,
          amount: result.booking.totalAmount.toString(),
          returnUrl: ROUTES.BOOKING_CONFIRMATION,
          otp: result.otp,
        });

        navigate(`${ROUTES.PAYMENT}?${paymentParams.toString()}`);
      }
    } catch (error: any) {
      addToast(error.message || 'Booking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (formData: BookingFormData) => {
    if (!user) {
      addToast('Please login to save a draft booking', 'error');
      navigate(ROUTES.LOGIN);
      return;
    }

    const validation = validateBookingForm({
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      roomTypeId: formData.roomTypeId,
      guestName: formData.guestName,
      guestEmail: formData.guestEmail,
      guestPhone: formData.guestPhone,
      adultCount: formData.adultCount,
    });

    if (!validation.valid) {
      addToast(validation.error || 'Validation failed', 'error');
      return;
    }

    setDraftLoading(true);
    try {
      const guestDetails: GuestDetails = {
        fullName: formData.guestName,
        email: formData.guestEmail,
        phone: formData.guestPhone,
        numberOfGuests: formData.adultCount + formData.childCount,
        numberOfAdults: formData.adultCount,
        numberOfChildren: formData.childCount,
      };

      await bookingService.saveDraftBooking(user.id, {
        propertyId: propertyId!,
        roomTypeId: formData.roomTypeId,
        quantity: formData.quantity,
        checkInDate: formData.checkIn,
        checkOutDate: formData.checkOut,
        guestDetails,
        specialRequirements: formData.requirements,
      });

      addToast('Booking saved as draft', 'success');
      navigate(ROUTES.BOOKINGS);
    } catch (error: any) {
      addToast(error.message || 'Failed to save draft', 'error');
    } finally {
      setDraftLoading(false);
    }
  };

  return { createBooking, loading, saveDraft, draftLoading };
};
