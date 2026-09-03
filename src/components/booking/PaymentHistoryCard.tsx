import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TransactionDTO } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { formatDateTime } from '../../utils/dateHelpers';

interface PaymentHistoryCardProps {
  transactions: TransactionDTO[];
}

export const PaymentHistoryCard: React.FC<PaymentHistoryCardProps> = ({ transactions }) => {
  if (transactions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-semibold text-gray-900">{transaction.transactionId}</p>
                <p className="text-sm text-gray-600">{transaction.paymentMethod}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(transaction.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
                <Badge
                  variant={transaction.paymentStatus === 'SUCCESS' ? 'success' : 'error'}
                  size="sm"
                >
                  {transaction.paymentStatus}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
