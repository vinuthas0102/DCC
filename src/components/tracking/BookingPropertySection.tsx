import React from 'react';
import { Home } from 'lucide-react';
import { BookingDTO } from '../../types';

interface BookingPropertySectionProps {
  booking: BookingDTO;
}

export const BookingPropertySection: React.FC<BookingPropertySectionProps> = ({ booking }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Home className="w-5 h-5 text-blue-600" />
        Property Details
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Property:</span>
          <span className="font-semibold text-gray-900">{booking.property?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Location:</span>
          <span className="font-medium text-gray-900">{booking.property?.address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Room Type:</span>
          <span className="font-medium text-gray-900">{booking.roomType?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-medium text-gray-900">{booking.quantity} room{booking.quantity !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};
