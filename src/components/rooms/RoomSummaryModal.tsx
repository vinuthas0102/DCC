import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, DoorOpen, Users, DollarSign } from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { RoomDTO } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface RoomSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onRoomSelect?: (room: RoomDTO) => void;
}

export const RoomSummaryModal: React.FC<RoomSummaryModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  onRoomSelect,
}) => {
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadRooms();
    }
  }, [isOpen, propertyId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const blocks = await propertyService.getBlocks(propertyId);
      const allRooms: RoomDTO[] = [];

      for (const block of blocks) {
        const floors = await propertyService.getFloors(block.id);
        for (const floor of floors) {
          const floorRooms = await propertyService.getRooms(floor.id);
          allRooms.push(...floorRooms);
        }
      }

      setRooms(allRooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = searchQuery
    ? rooms.filter(
        (room) =>
          room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.roomType?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.status.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rooms;

  const statusCounts = rooms.reduce(
    (acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'OCCUPIED':
        return 'error';
      case 'CLEANING':
        return 'warning';
      case 'MAINTENANCE':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Summary" size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-1">Available</p>
            <p className="text-2xl font-bold text-green-900">{statusCounts['AVAILABLE'] || 0}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 mb-1">Occupied</p>
            <p className="text-2xl font-bold text-red-900">{statusCounts['OCCUPIED'] || 0}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 mb-1">Cleaning</p>
            <p className="text-2xl font-bold text-yellow-900">{statusCounts['CLEANING'] || 0}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Maintenance</p>
            <p className="text-2xl font-bold text-blue-900">{statusCounts['MAINTENANCE'] || 0}</p>
          </div>
        </div>

        <Input
          type="text"
          placeholder="Search by room number, type, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        <div className="max-h-96 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mx-auto" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DoorOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No rooms found</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                onClick={() => onRoomSelect?.(room)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <DoorOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Room {room.roomNumber}</p>
                      <p className="text-sm text-gray-600">{room.roomType?.name}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(room.status)}>{room.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {room.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(room.basePrice)}/night</span>
                  </div>
                </div>

                {room.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
