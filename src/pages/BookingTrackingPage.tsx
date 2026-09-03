import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TrackingNavbar } from '../components/tracking/TrackingNavbar';
import { TrackingSearchForm } from '../components/tracking/TrackingSearchForm';
import { BookingDetailsCard } from '../components/tracking/BookingDetailsCard';
import { CancelBookingModal } from '../components/tracking/CancelBookingModal';
import { useBookingTracking } from '../hooks/useBookingTracking';
import { ROUTES } from '../constants/routes';

export const BookingTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { booking, transactions, loading, error, searchBooking, cancelBooking } = useBookingTracking();
  const [bookingNumber, setBookingNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchBooking(bookingNumber, otp);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(booking!.id, bookingNumber, otp);
      setShowCancelModal(false);
    } catch {
    } finally {
      setCancelling(false);
    }
  };

  const canCancelBooking = booking && ['REQUESTED', 'PROVISIONED', 'ALLOCATED'].includes(booking.status);
  const latestTransaction = transactions[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <TrackingNavbar />

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Booking</h1>
          <p className="text-gray-600">
            Enter your booking number and OTP to view booking details, print confirmation, or cancel your reservation
          </p>
        </div>

        <TrackingSearchForm
          bookingNumber={bookingNumber}
          otp={otp}
          error={error}
          loading={loading}
          onBookingNumberChange={setBookingNumber}
          onOtpChange={setOtp}
          onSubmit={handleSearch}
        />

        {booking && (
          <>
            <BookingDetailsCard booking={booking} latestTransaction={latestTransaction} />

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Print Confirmation
              </Button>
              {canCancelBooking && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Need help?</p>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.HOME)}
            size="sm"
          >
            Back to Home
          </Button>
        </div>
      </div>

      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        bookingNumber={booking?.bookingNumber || ''}
        propertyName={booking?.property?.name || ''}
        paidAmount={booking?.paidAmount || 0}
        cancelling={cancelling}
      />
    </div>
  );
};
