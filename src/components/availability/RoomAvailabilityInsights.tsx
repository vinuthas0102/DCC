import React, { useEffect, useState } from 'react';
import { Calendar, Search, TrendingUp, Bed, Users, Wrench, Sparkles, Ban, ChevronRight, ChevronLeft } from 'lucide-react';
import { roomAvailabilityService, RoomAvailabilityData, AvailabilityStats } from '../../services/roomAvailabilityService';
import { Card, CardBody } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Loading';
import { formatCurrency } from '../../utils/formatters';

interface RoomAvailabilityInsightsProps {
  propertyId: string;
}

export const RoomAvailabilityInsights: React.FC<RoomAvailabilityInsightsProps> = ({ propertyId }) => {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomAvailabilityData[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomAvailabilityData[]>([]);
  const [stats, setStats] = useState<AvailabilityStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterBlock, setFilterBlock] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateOffset, setDateOffset] = useState(0);
  const [daysToShow] = useState(14);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + dateOffset);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysToShow - 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  useEffect(() => {
    loadAvailabilityData();
  }, [propertyId, dateOffset]);

  useEffect(() => {
    applyFilters();
  }, [rooms, searchQuery, filterRoomType, filterBlock, filterStatus]);

  const loadAvailabilityData = async () => {
    setLoading(true);
    try {
      const data = await roomAvailabilityService.getRoomAvailabilityInsights(
        propertyId,
        startDateStr,
        endDateStr
      );
      setRooms(data.rooms);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load room availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rooms];

    if (searchQuery) {
      filtered = filtered.filter((room) =>
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRoomType !== 'all') {
      filtered = filtered.filter((room) => room.roomType.name === filterRoomType);
    }

    if (filterBlock !== 'all') {
      filtered = filtered.filter((room) => room.block.name === filterBlock);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((room) => {
        const todayStatus = room.availability[startDateStr];
        return todayStatus?.status === filterStatus;
      });
    }

    setFilteredRooms(filtered);
  };

  const getDateRange = () => {
    const dates: string[] = [];
    const current = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 border-green-300';
      case 'occupied':
        return 'bg-red-100 hover:bg-red-200 border-red-300';
      case 'maintenance':
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300';
      case 'cleaning':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
      case 'blocked':
        return 'bg-slate-200 hover:bg-slate-300 border-slate-400';
      default:
        return 'bg-white hover:bg-gray-50 border-gray-200';
    }
  };

  const roomTypes = Array.from(new Set(rooms.map((r) => r.roomType.name)));
  const blocks = Array.from(new Set(rooms.map((r) => r.block.name)));
  const dateRange = getDateRange();

  const goToPreviousWeek = () => setDateOffset(dateOffset - 7);
  const goToNextWeek = () => setDateOffset(dateOffset + 7);
  const goToToday = () => setDateOffset(0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Bed className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Rooms</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalRooms}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Available</p>
                  <p className="text-2xl font-bold text-green-900">{stats.availableRooms}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-700 font-medium">Occupied</p>
                  <p className="text-2xl font-bold text-red-900">{stats.occupiedRooms}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500 rounded-lg">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.maintenanceRooms}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Cleaning</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.cleaningRooms}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium">Occupancy</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.occupancyRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                icon={<Search size={18} />}
                placeholder="Search by room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select
              value={filterRoomType}
              onChange={(e) => setFilterRoomType(e.target.value)}
              className="md:w-48"
            >
              <option value="all">All Room Types</option>
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>

            <Select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="md:w-48"
            >
              <option value="all">All Blocks</option>
              {blocks.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </Select>

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="md:w-48"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="cleaning">Cleaning</option>
              <option value="blocked">Blocked</option>
            </Select>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' - '}
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} disabled={dateOffset === 0}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-max">
              <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(60px,1fr))] gap-1">
                <div className="sticky left-0 bg-gray-50 border border-gray-200 p-3 font-semibold text-sm">
                  Room Details
                </div>
                {dateRange.map((date) => {
                  const dateObj = new Date(date);
                  return (
                    <div
                      key={date}
                      className="bg-gray-50 border border-gray-200 p-2 text-center"
                    >
                      <div className="text-xs font-semibold text-gray-700">
                        {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {dateObj.getDate()}
                      </div>
                    </div>
                  );
                })}

                {filteredRooms.map((room) => (
                  <React.Fragment key={room.id}>
                    <div className="sticky left-0 bg-white border border-gray-200 p-3">
                      <div className="font-semibold text-sm text-gray-900">
                        {room.roomNumber}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {room.roomType.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {room.block.name} - Floor {room.floor.floorNumber}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <Users className="w-3 h-3 inline mr-1" />
                        {room.capacity} | {formatCurrency(room.basePrice)}
                      </div>
                    </div>

                    {dateRange.map((date) => {
                      const dayStatus = room.availability[date];
                      const status = dayStatus?.status || 'available';

                      return (
                        <div
                          key={date}
                          className={`border p-2 flex items-center justify-center cursor-pointer transition-colors ${getStatusColor(
                            status
                          )}`}
                          title={
                            dayStatus?.guestName
                              ? `${dayStatus.guestName} (${dayStatus.bookingNumber})`
                              : status.charAt(0).toUpperCase() + status.slice(1)
                          }
                        >
                          {status === 'occupied' && (
                            <Users className="w-4 h-4 text-red-600" />
                          )}
                          {status === 'maintenance' && (
                            <Wrench className="w-4 h-4 text-gray-600" />
                          )}
                          {status === 'cleaning' && (
                            <Sparkles className="w-4 h-4 text-yellow-600" />
                          )}
                          {status === 'blocked' && (
                            <Ban className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-xs text-gray-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-xs text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-xs text-gray-700">Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-xs text-gray-700">Cleaning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200 border border-slate-400 rounded"></div>
              <span className="text-xs text-gray-700">Blocked</span>
            </div>
          </div>

          {stats && stats.roomTypeBreakdown && Object.keys(stats.roomTypeBreakdown).length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Room Type Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.roomTypeBreakdown).map(([type, data]) => (
                  <Card key={type} className="border-gray-200">
                    <CardBody className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{type}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{data.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-medium text-green-600">{data.available}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Occupied:</span>
                          <span className="font-medium text-red-600">{data.occupied}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Occupancy:</span>
                            <span className="font-semibold">
                              {data.total > 0
                                ? ((data.occupied / data.total) * 100).toFixed(0)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
