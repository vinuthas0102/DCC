import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { BookingDTO } from '../../types';

interface BookingGuestSectionProps {
  booking: BookingDTO;
}

export const BookingGuestSection: React.FC<BookingGuestSectionProps> = ({ booking }) => {
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        Guest Information
      </h3>
      <div className="space-y-3">
        {booking.guestDetails?.fullName && (
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{booking.guestDetails.fullName}</span>
          </div>
        )}
        {booking.guestDetails?.email && (
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{booking.guestDetails.email}</span>
          </div>
        )}
        {booking.guestDetails?.phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{booking.guestDetails.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
};
