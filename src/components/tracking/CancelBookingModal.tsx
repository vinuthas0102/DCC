import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingNumber: string;
  propertyName: string;
  paidAmount: number;
  cancelling: boolean;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingNumber,
  propertyName,
  paidAmount,
  cancelling,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Booking">
      <div className="p-6 space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900 mb-1">Are you sure?</p>
              <p className="text-xs text-yellow-800">
                Cancelling this booking cannot be undone. Please contact support if you need to make changes instead of cancelling.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Booking Number:</span>
            <span className="font-semibold text-gray-900">{bookingNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Property:</span>
            <span className="font-medium text-gray-900">{propertyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-bold text-gray-900">{formatCurrency(paidAmount)}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={cancelling}
          >
            Keep Booking
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={cancelling}
          >
            {cancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Yes, Cancel Booking
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
