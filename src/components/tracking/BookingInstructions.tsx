import React from 'react';
import { Key } from 'lucide-react';
import { formatDate } from '../../utils/dateHelpers';

interface BookingInstructionsProps {
  otpExpiry: Date;
}

export const BookingInstructions: React.FC<BookingInstructionsProps> = ({ otpExpiry }) => {
  return (
    <div className="border-t pt-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Check-in Instructions</p>
            <p className="text-xs text-blue-800">
              Present the 6-digit OTP code shown above when you arrive at the property.
              This code is valid until {formatDate(otpExpiry.toISOString())}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
