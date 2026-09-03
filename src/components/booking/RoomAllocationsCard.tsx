import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BookingAllocationDTO } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { formatDateTime } from '../../utils/dateHelpers';

interface RoomAllocationsCardProps {
  allocations: BookingAllocationDTO[];
}

export const RoomAllocationsCard: React.FC<RoomAllocationsCardProps> = ({ allocations }) => {
  if (allocations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Room Allocations</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {allocations.map((allocation) => (
            <div
              key={allocation.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                  {allocation.room?.roomNumber}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Room {allocation.room?.roomNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    Capacity: {allocation.room?.capacity} | {formatCurrency(allocation.room?.basePrice || 0)}/night
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Allocated: {formatDateTime(allocation.allocatedAt)}
                  </p>
                </div>
              </div>
              {allocation.checkInTime && (
                <Badge variant="success">Checked In</Badge>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
