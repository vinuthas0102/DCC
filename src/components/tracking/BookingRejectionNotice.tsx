import React from 'react';
import { XCircle } from 'lucide-react';

interface BookingRejectionNoticeProps {
  reason: string;
}

export const BookingRejectionNotice: React.FC<BookingRejectionNoticeProps> = ({ reason }) => {
  return (
    <div className="border-t pt-6">
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason</p>
            <p className="text-xs text-red-800">{reason}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
