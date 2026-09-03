import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';

interface BookingGuestInfoProps {
  fullName: string;
  email: string;
  phone: string;
  guestCount: number;
}

export const BookingGuestInfo: React.FC<BookingGuestInfoProps> = ({
  fullName,
  email,
  phone,
  guestCount,
}) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Guest Information</h2>
      </CardHeader>
      <CardBody>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium text-gray-900">{fullName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Guest Count</p>
            <p className="font-medium text-gray-900">{guestCount}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
