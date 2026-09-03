import { useState } from 'react';
import { bookingService } from '../services/bookingService';
import { useUIStore } from '../stores/uiStore';

export const useBookingActions = (onSuccess?: () => void) => {
  const addToast = useUIStore((state) => state.addToast);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const approveBooking = async (bookingId: string) => {
    setApproving(true);
    try {
      await bookingService.updateBookingStatus(bookingId, 'PROVISIONED');
      addToast('Booking approved successfully', 'success');
      onSuccess?.();
    } catch (error: any) {
      addToast(error.message || 'Failed to approve booking', 'error');
    } finally {
      setApproving(false);
    }
  };

  const rejectBooking = async (bookingId: string, reason: string) => {
    if (!reason) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }

    setRejecting(true);
    try {
      await bookingService.updateBookingStatus(bookingId, 'REJECTED', reason);
      addToast('Booking rejected', 'success');
      onSuccess?.();
    } catch (error: any) {
      addToast(error.message || 'Failed to reject booking', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const cancelBooking = async (bookingId: string, reason: string) => {
    if (!reason) {
      addToast('Please provide a cancellation reason', 'error');
      return;
    }

    setCancelling(true);
    try {
      await bookingService.updateBookingStatus(bookingId, 'CANCELLED', reason);
      addToast('Booking cancelled successfully', 'success');
      onSuccess?.();
    } catch (error: any) {
      addToast(error.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return {
    approveBooking,
    rejectBooking,
    cancelBooking,
    approving,
    rejecting,
    cancelling,
  };
};
