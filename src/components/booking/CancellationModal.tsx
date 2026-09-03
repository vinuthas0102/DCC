import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  bookingNumber: string;
  cancelling?: boolean;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingNumber,
  cancelling,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    onClose();
    setReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cancel Booking">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            Are you sure you want to cancel booking{' '}
            <span className="font-semibold">{bookingNumber}</span>?
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Reason *
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for cancellation..."
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={cancelling}
          >
            Keep Booking
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!reason || cancelling}
            className="flex-1"
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Modal>
  );
};
