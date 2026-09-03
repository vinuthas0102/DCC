import React from 'react';
import { Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BookingDTO, TransactionDTO } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { getStatusBadgeVariant, getStatusIcon } from '../../utils/bookingStatusHelpers';
import { BookingPropertySection } from './BookingPropertySection';
import { BookingStaySection } from './BookingStaySection';
import { BookingGuestSection } from './BookingGuestSection';
import { BookingPaymentSection } from './BookingPaymentSection';
import { BookingInstructions } from './BookingInstructions';
import { BookingRejectionNotice } from './BookingRejectionNotice';

interface BookingDetailsCardProps {
  booking: BookingDTO;
  latestTransaction?: TransactionDTO;
}

export const BookingDetailsCard: React.FC<BookingDetailsCardProps> = ({ booking, latestTransaction }) => {
  const StatusIcon = getStatusIcon(booking.status);
  const otpExpiry = booking?.otpExpiresAt ? new Date(booking.otpExpiresAt) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card>
        <div className={`p-6 rounded-t-lg ${
          booking.status === 'CANCELLED' || booking.status === 'REJECTED'
            ? 'bg-gradient-to-r from-red-600 to-red-700'
            : 'bg-gradient-to-r from-blue-600 to-blue-700'
        } text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Booking Number</p>
              <p className="text-2xl font-bold">{booking.bookingNumber}</p>
            </div>
            <Badge
              variant={getStatusBadgeVariant(booking.status)}
              className="flex items-center gap-2 text-base px-4 py-2"
            >
              <StatusIcon className="w-5 h-5" />
              {booking.status}
            </Badge>
          </div>

          {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500">
              <div>
                <p className="text-blue-100 text-xs mb-1">Check-in OTP</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{booking.otp}</p>
              </div>
              <div>
                <p className="text-blue-100 text-xs mb-1">Valid Until</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    {otpExpiry ? formatDate(otpExpiry.toISOString()) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          <BookingPropertySection booking={booking} />
          <BookingStaySection booking={booking} />
          <BookingGuestSection booking={booking} />

          {booking.specialRequirements && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Requirements</h3>
              <p className="text-gray-700 text-sm">{booking.specialRequirements}</p>
            </div>
          )}

          {latestTransaction && <BookingPaymentSection transaction={latestTransaction} />}
          {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && otpExpiry && (
            <BookingInstructions otpExpiry={otpExpiry} />
          )}
          {booking.status === 'REJECTED' && booking.rejectionReason && (
            <BookingRejectionNotice reason={booking.rejectionReason} />
          )}
          {booking.status === 'CANCELLED' && (
            <div className="border-t pt-6">
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Booking Cancelled</p>
                    <p className="text-xs text-gray-700">
                      This booking has been cancelled. If you have any questions, please contact support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
