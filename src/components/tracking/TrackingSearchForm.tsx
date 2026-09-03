import React from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface TrackingSearchFormProps {
  bookingNumber: string;
  otp: string;
  error: string;
  loading: boolean;
  onBookingNumberChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TrackingSearchForm: React.FC<TrackingSearchFormProps> = ({
  bookingNumber,
  otp,
  error,
  loading,
  onBookingNumberChange,
  onOtpChange,
  onSubmit,
}) => {
  return (
    <Card className="mb-6">
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Number *
            </label>
            <Input
              value={bookingNumber}
              onChange={(e) => onBookingNumberChange(e.target.value.toUpperCase())}
              placeholder="Enter your booking number (e.g., BK20260327000001)"
              className="font-mono"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OTP Code *
            </label>
            <Input
              value={otp}
              onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="font-mono text-lg tracking-wider"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              The OTP was provided in your booking confirmation
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !bookingNumber || otp.length !== 6}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find My Booking
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};
