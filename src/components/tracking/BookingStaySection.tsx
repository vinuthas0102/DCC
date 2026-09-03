import React from 'react';
import { Calendar } from 'lucide-react';
import { BookingDTO } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

interface BookingStaySectionProps {
  booking: BookingDTO;
}

export const BookingStaySection: React.FC<BookingStaySectionProps> = ({ booking }) => {
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Stay Details
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Check-in</p>
          <p className="font-semibold text-gray-900">{formatDate(booking.checkInDate)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Check-out</p>
          <p className="font-semibold text-gray-900">{formatDate(booking.checkOutDate)}</p>
        </div>
      </div>
    </div>
  );
};
