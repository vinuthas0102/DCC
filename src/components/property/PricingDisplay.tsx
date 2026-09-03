import React from 'react';
import { RoomDTO } from '../../types';
import { IndianRupee, TrendingUp, TrendingDown, Cigarette, CigaretteOff } from 'lucide-react';

interface PricingDisplayProps {
  rooms: RoomDTO[];
}

export const PricingDisplay: React.FC<PricingDisplayProps> = ({ rooms }) => {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No pricing information available</p>
      </div>
    );
  }

  const prices = rooms.map((r) => r.basePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

  const roomTypesPricing = rooms.reduce((acc, room) => {
    const typeName = room.roomType?.name || 'Unknown';
    if (!acc[typeName]) {
      acc[typeName] = {
        count: 0,
        minPrice: room.basePrice,
        maxPrice: room.basePrice,
        totalCapacity: 0,
      };
    }
    acc[typeName].count++;
    acc[typeName].minPrice = Math.min(acc[typeName].minPrice, room.basePrice);
    acc[typeName].maxPrice = Math.max(acc[typeName].maxPrice, room.basePrice);
    acc[typeName].totalCapacity += room.capacity;
    return acc;
  }, {} as Record<string, { count: number; minPrice: number; maxPrice: number; totalCapacity: number }>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">Lowest Price</p>
          </div>
          <p className="text-2xl font-bold text-green-700">₹{minPrice}</p>
          <p className="text-xs text-green-600 mt-1">Per night</p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Average Price</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">₹{avgPrice}</p>
          <p className="text-xs text-blue-600 mt-1">Per night</p>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-medium text-orange-900">Highest Price</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">₹{maxPrice}</p>
          <p className="text-xs text-orange-600 mt-1">Per night</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Pricing by Room Type</h4>
        <div className="space-y-3">
          {Object.entries(roomTypesPricing).map(([roomType, data]) => (
            <div
              key={roomType}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-900">{roomType}</h5>
                <span className="text-xs text-gray-500">{data.count} rooms</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Price Range</p>
                  <p className="font-semibold text-gray-900">
                    {data.minPrice === data.maxPrice
                      ? `₹${data.minPrice}`
                      : `₹${data.minPrice} - ₹${data.maxPrice}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total Capacity</p>
                  <p className="font-semibold text-gray-900">{data.totalCapacity} guests</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Avg per Room</p>
                  <p className="font-semibold text-gray-900">
                    {Math.round(data.totalCapacity / data.count)} guests
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Cigarette className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Smoking Allowed:</span>
            <span className="font-medium text-gray-900">
              {rooms.filter((r) => r.isSmokingAllowed).length} rooms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CigaretteOff className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Non-Smoking:</span>
            <span className="font-medium text-gray-900">
              {rooms.filter((r) => !r.isSmokingAllowed).length} rooms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
