import React from 'react';
import { RoomDTO, BlockDTO, FloorDTO } from '../../types';
import { Home, Users, IndianRupee, Cigarette, CigaretteOff, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface RoomsDisplayProps {
  rooms: RoomDTO[];
  blocks: BlockDTO[];
  floors: FloorDTO[];
}

export const RoomsDisplay: React.FC<RoomsDisplayProps> = ({ rooms }) => {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No rooms configured</p>
      </div>
    );
  }

  const groupedRooms = rooms.reduce((acc, room) => {
    const roomTypeName = room.roomType?.name || 'Unknown';
    if (!acc[roomTypeName]) acc[roomTypeName] = [];
    acc[roomTypeName].push(room);
    return acc;
  }, {} as Record<string, RoomDTO[]>);

  return (
    <div className="space-y-3">
      {/* Per-type summary table */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 gap-2 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span className="col-span-1">Room Type</span>
          <span className="text-center">Total</span>
          <span className="text-center">Available</span>
          <span className="text-center">Starting Price</span>
          <span className="text-center">Capacity</span>
        </div>

        {Object.entries(groupedRooms).map(([roomTypeName, roomsOfType]) => {
          const availableCount = roomsOfType.filter(r => r.status === 'AVAILABLE').length;
          const maintenanceCount = roomsOfType.filter(r => r.status === 'MAINTENANCE').length;
          const minPrice = Math.min(...roomsOfType.map(r => r.basePrice));
          const maxCapacity = Math.max(...roomsOfType.map(r => r.capacity));
          const smokingAllowed = roomsOfType.some(r => r.isSmokingAllowed);

          return (
            <div key={roomTypeName} className="grid grid-cols-5 gap-2 px-4 py-3.5 bg-white hover:bg-gray-50/50 transition-colors items-center">
              {/* Room type name + smoking */}
              <div className="col-span-1 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Home size={14} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{roomTypeName}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {smokingAllowed ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                        <Cigarette size={9} /> Smoking
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <CigaretteOff size={9} /> No smoking
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="text-center">
                <span className="text-lg font-bold text-gray-900">{roomsOfType.length}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">rooms</p>
              </div>

              {/* Available */}
              <div className="text-center flex flex-col items-center gap-0.5">
                <span className={`text-lg font-bold ${availableCount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {availableCount}
                </span>
                {maintenanceCount > 0 && (
                  <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                    <Wrench size={8} className="inline mr-0.5" />{maintenanceCount} maint.
                  </Badge>
                )}
                {availableCount > 0
                  ? <CheckCircle size={12} className="text-emerald-400" />
                  : <XCircle size={12} className="text-red-400" />
                }
              </div>

              {/* Starting price */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <IndianRupee size={11} className="text-gray-500" />
                  <span className="text-sm font-bold text-gray-900">{minPrice.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">per night</p>
              </div>

              {/* Capacity */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users size={13} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">{maxCapacity}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">guests/room</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-700">{rooms.length}</p>
            <p className="text-xs text-blue-900 mt-1">Total Rooms</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">
              {rooms.filter(r => r.status === 'AVAILABLE').length}
            </p>
            <p className="text-xs text-blue-900 mt-1">Available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">
              {rooms.reduce((sum, r) => sum + r.capacity, 0)}
            </p>
            <p className="text-xs text-blue-900 mt-1">Total Capacity</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">
              ₹{Math.min(...rooms.map(r => r.basePrice)).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-blue-900 mt-1">Starting From</p>
          </div>
        </div>
      </div>
    </div>
  );
};
