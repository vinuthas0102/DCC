import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { formatDateTime } from '../../utils/dateHelpers';

interface BookingSidebarProps {
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  otp: string;
  otpExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  canApprove: boolean;
  canCancel: boolean;
  isManager: boolean;
  propertyId?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  approving?: boolean;
}

export const BookingSidebar: React.FC<BookingSidebarProps> = ({
  totalAmount,
  paidAmount,
  balanceAmount,
  paymentStatus,
  otp,
  otpExpiresAt,
  createdAt,
  updatedAt,
  canApprove,
  canCancel,
  isManager,
  propertyId,
  onApprove,
  onReject,
  onCancel,
  approving,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Payment Summary</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid Amount</span>
              <span className="font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Balance Due</span>
              <span className="font-bold text-xl text-gray-900">
                {formatCurrency(balanceAmount)}
              </span>
            </div>
            <Badge
              variant={
                paymentStatus === 'COMPLETED'
                  ? 'success'
                  : paymentStatus === 'PARTIAL'
                  ? 'warning'
                  : 'error'
              }
              className="w-full justify-center"
            >
              {paymentStatus}
            </Badge>
          </div>
        </CardBody>
      </Card>

      {canApprove && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Booking Actions</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={onApprove}
                className="w-full"
                icon={<CheckCircle size={18} />}
                disabled={approving}
              >
                Approve Booking
              </Button>
              <Button
                variant="danger"
                onClick={onReject}
                className="w-full"
                icon={<XCircle size={18} />}
              >
                Reject Booking
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">OTP Details</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-xs text-blue-800 mb-2">Check-in OTP</p>
              <p className="text-3xl font-mono font-bold text-blue-900 tracking-wider">
                {otp}
              </p>
            </div>
            {otpExpiresAt && (
              <p className="text-xs text-gray-500 text-center">
                Expires: {formatDateTime(otpExpiresAt)}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Booking Timeline</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" size={16} />
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{formatDateTime(createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" size={16} />
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">{formatDateTime(updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {canCancel && (
        <Card>
          <CardBody>
            <Button
              variant="danger"
              onClick={onCancel}
              className="w-full"
              icon={<XCircle size={18} />}
            >
              Cancel Booking
            </Button>
          </CardBody>
        </Card>
      )}

      {isManager && propertyId && (
        <Card>
          <CardBody>
            <Button
              variant="outline"
              onClick={() => navigate(`/properties/${propertyId}`)}
              className="w-full"
            >
              View Property Details
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
