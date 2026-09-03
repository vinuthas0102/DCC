import React from 'react';
import { XCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../constants/statuses';
import { BookingStatus } from '../../types';

interface BookingStatusHeaderProps {
  bookingNumber: string;
  status: BookingStatus;
  rejectionReason?: string;
}

export const BookingStatusHeader: React.FC<BookingStatusHeaderProps> = ({
  bookingNumber,
  status,
  rejectionReason,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{bookingNumber}</h1>
          <p className="text-gray-600">Booking Details & Status</p>
        </div>
        <Badge className={BOOKING_STATUS_COLORS[status]} size="lg">
          {BOOKING_STATUS_LABELS[status]}
        </Badge>
      </div>

      {rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-900">Rejection Reason</p>
              <p className="text-sm text-red-800 mt-1">{rejectionReason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
