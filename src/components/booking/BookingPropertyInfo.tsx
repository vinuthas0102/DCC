import React from 'react';
import { MapPin, Users, Calendar, FileText } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { formatDate } from '../../utils/dateHelpers';

interface BookingPropertyInfoProps {
  propertyName: string;
  propertyAddress: string;
  roomTypeName: string;
  quantity: number;
  checkInDate: string;
  checkOutDate: string;
  specialRequirements?: string;
}

export const BookingPropertyInfo: React.FC<BookingPropertyInfoProps> = ({
  propertyName,
  propertyAddress,
  roomTypeName,
  quantity,
  checkInDate,
  checkOutDate,
  specialRequirements,
}) => {
  const nights = Math.ceil(
    (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Property & Room Information</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">Property</p>
              <p className="font-semibold text-gray-900">{propertyName}</p>
              <p className="text-sm text-gray-600">{propertyAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">Room Type</p>
              <p className="font-semibold text-gray-900">{roomTypeName}</p>
              <p className="text-sm text-gray-600">Quantity: {quantity} room(s)</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500">Stay Duration</p>
              <p className="font-semibold text-gray-900">
                {formatDate(checkInDate)} - {formatDate(checkOutDate)}
              </p>
              <p className="text-sm text-gray-600">
                {nights} night(s)
              </p>
            </div>
          </div>

          {specialRequirements && (
            <div className="flex items-start gap-3">
              <FileText className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500">Special Requirements</p>
                <p className="text-gray-900 mt-1">{specialRequirements}</p>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
