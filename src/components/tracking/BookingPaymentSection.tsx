import React from 'react';
import { CreditCard } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { TransactionDTO } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateHelpers';

interface BookingPaymentSectionProps {
  transaction: TransactionDTO;
}

export const BookingPaymentSection: React.FC<BookingPaymentSectionProps> = ({ transaction }) => {
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-blue-600" />
        Payment Information
      </h3>
      <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between">
          <span className="text-gray-600">Transaction ID:</span>
          <span className="font-mono text-sm font-semibold text-gray-900">{transaction.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-medium text-gray-900">{transaction.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Amount Paid:</span>
          <span className="text-lg font-bold text-green-600">{formatCurrency(transaction.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Status:</span>
          <Badge variant="success">{transaction.paymentStatus}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date & Time:</span>
          <span className="text-sm text-gray-900">{formatDate(transaction.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
