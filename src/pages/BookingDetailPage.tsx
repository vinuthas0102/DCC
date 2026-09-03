import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Loading';
import { BookingStatusHeader } from '../components/booking/BookingStatusHeader';
import { BookingPropertyInfo } from '../components/booking/BookingPropertyInfo';
import { BookingGuestInfo } from '../components/booking/BookingGuestInfo';
import { RoomAllocationsCard } from '../components/booking/RoomAllocationsCard';
import { PaymentHistoryCard } from '../components/booking/PaymentHistoryCard';
import { BookingSidebar } from '../components/booking/BookingSidebar';
import { CancellationModal } from '../components/booking/CancellationModal';
import { RejectionModal } from '../components/booking/RejectionModal';
import { useBookingDetails } from '../hooks/useBookingDetails';
import { useBookingActions } from '../hooks/useBookingActions';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../constants/routes';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { booking, allocations, transactions, loading, refetch } = useBookingDetails(id);
  const { approveBooking, rejectBooking, cancelBooking, approving, cancelling, rejecting } = useBookingActions(refetch);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isOwner = booking?.userId === user?.id;
  const canApprove = isManager && booking?.status === 'REQUESTED';
  const canCancel = isOwner && ['REQUESTED', 'ALLOCATED', 'PROVISIONED'].includes(booking?.status || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Not Found</h3>
                <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist</p>
                <Button onClick={() => navigate(ROUTES.PROPERTIES)}>Back to Properties</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft size={20} />}>
            Back
          </Button>
        </div>

        <BookingStatusHeader
          bookingNumber={booking.bookingNumber}
          status={booking.status}
          rejectionReason={booking.rejectionReason}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BookingPropertyInfo
              propertyName={booking.property?.name || ''}
              propertyAddress={booking.property?.address || ''}
              roomTypeName={booking.roomType?.name || ''}
              quantity={booking.quantity}
              checkInDate={booking.checkInDate}
              checkOutDate={booking.checkOutDate}
              specialRequirements={booking.specialRequirements}
            />
            <BookingGuestInfo
              fullName={booking.guestDetails.fullName}
              email={booking.guestDetails.email}
              phone={booking.guestDetails.phone}
              guestCount={booking.guestDetails.numberOfGuests ?? 1}
            />
            {allocations.length > 0 && <RoomAllocationsCard allocations={allocations} />}
            {transactions.length > 0 && <PaymentHistoryCard transactions={transactions} />}
            {booking.notes && (
              <Card>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                </div>
                <CardBody>
                  <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <BookingSidebar
              totalAmount={booking.totalAmount}
              paidAmount={booking.paidAmount}
              balanceAmount={booking.balanceAmount}
              paymentStatus={booking.paymentStatus}
              otp={booking.otp}
              otpExpiresAt={booking.otpExpiresAt}
              createdAt={booking.createdAt}
              updatedAt={booking.updatedAt}
              canApprove={!!canApprove}
              canCancel={!!canCancel}
              isManager={isManager}
              propertyId={booking.property?.id}
              onApprove={() => approveBooking(booking.id)}
              onReject={() => setRejectModalOpen(true)}
              onCancel={() => setCancelModalOpen(true)}
              approving={approving}
            />
          </div>
        </div>
      </div>

      <CancellationModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={(reason) => cancelBooking(booking.id, reason).then(() => setCancelModalOpen(false))}
        bookingNumber={booking.bookingNumber}
        cancelling={cancelling}
      />

      <RejectionModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={(reason) => rejectBooking(booking.id, reason).then(() => setRejectModalOpen(false))}
        bookingNumber={booking.bookingNumber}
        rejecting={rejecting}
      />
    </div>
  );
};
