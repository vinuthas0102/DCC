import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { propertyService } from '../../services/propertyService';
import { RoomTypeDTO, AmenityDTO, RoomFeatures, DEFAULT_ROOM_FEATURES } from '../../types';
import {
  Plus, Trash2, Copy, DoorOpen, Building, Search, Check,
  BedDouble, Cigarette, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import { FormLoadingSkeleton } from '../ui/LoadingSkeleton';
import { getAmenityIcon, getCategoryTheme } from '../../utils/amenityIcons';
import { VIEW_OPTIONS, BED_TYPE_OPTIONS, POLICY_TOGGLES, FEATURE_TOGGLES } from '../../constants/roomFeatures';

interface Room {
  tempId: string;
  blockId: string;
  floorNumber: number;
  roomNumber: string;
  roomTypeId: string | null;
  capacity: number;
  basePrice: number;
  amenities: string[];
  isSmokingAllowed: boolean;
  features: RoomFeatures;
  viewType: string;
  bedCount: number;
  bedType: string;
}

interface RoomsTabProps {
  formData: {
    blocks: Array<{ tempId: string; name: string; code: string; floors: number }>;
    rooms: Room[];
  };
  updateFormData: (updates: any) => void;
}


// Single room card
interface RoomCardEditorProps {
  room: Room;
  index: number;
  blocks: Array<{ tempId: string; name: string; code: string; floors: number }>;
  roomTypes: RoomTypeDTO[];
  amenities: AmenityDTO[];
  groupedAmenities: Record<string, AmenityDTO[]>;
  onUpdate: (updates: Partial<Room>) => void;
  onRemove: () => void;
}

const RoomCardEditor: React.FC<RoomCardEditorProps> = ({
  room, index, blocks, roomTypes, amenities, groupedAmenities, onUpdate, onRemove,
}) => {
  const [amenitySearch, setAmenitySearch] = useState('');
  const [amenityExpanded, setAmenityExpanded] = useState(false);
  const selectedCount = room.amenities.length;

  const getFloorOptions = (blockId: string) => {
    const block = blocks.find(b => b.tempId === blockId);
    if (!block) return [];
    return Array.from({ length: block.floors }, (_, i) => i + 1);
  };

  const toggleAmenity = (amenityId: string) => {
    const next = room.amenities.includes(amenityId)
      ? room.amenities.filter(a => a !== amenityId)
      : [...room.amenities, amenityId];
    onUpdate({ amenities: next });
  };

  const toggleFeature = (key: keyof RoomFeatures) => {
    onUpdate({ features: { ...room.features, [key]: !room.features[key] } });
  };

  const filteredGrouped = amenitySearch.trim()
    ? { 'Search Results': amenities.filter(a => a.name.toLowerCase().includes(amenitySearch.toLowerCase())) }
    : groupedAmenities;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <DoorOpen size={14} className="text-blue-600" />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900">Room {index + 1}</span>
            {room.roomNumber && <span className="ml-2 text-xs text-gray-400 font-mono">#{room.roomNumber}</span>}
          </div>
          {selectedCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {selectedCount} amenities
            </span>
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Basic info grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Block *</label>
            <Select
              value={room.blockId}
              onChange={e => onUpdate({ blockId: e.target.value, floorNumber: 1 })}
            >
              <option value="">Select block…</option>
              {blocks.map(block => (
                <option key={block.tempId} value={block.tempId}>{block.name || block.code}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Floor *</label>
            <Select
              value={room.floorNumber}
              onChange={e => onUpdate({ floorNumber: parseInt(e.target.value) })}
              disabled={!room.blockId}
            >
              <option value="">Select floor…</option>
              {getFloorOptions(room.blockId).map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Room Number *</label>
            <Input
              type="text"
              value={room.roomNumber}
              onChange={e => onUpdate({ roomNumber: e.target.value })}
              placeholder="e.g., 101"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Room Type *</label>
            <Select
              value={room.roomTypeId || ''}
              onChange={e => onUpdate({ roomTypeId: e.target.value || null })}
            >
              <option value="">Select type…</option>
              {roomTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} (cap: {t.defaultCapacity})</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Capacity</label>
            <Input
              type="number"
              min="1"
              value={room.capacity}
              onChange={e => onUpdate({ capacity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Base Price (₹/night) *</label>
            <Input
              type="number"
              min="0"
              step="100"
              value={room.basePrice}
              onChange={e => onUpdate({ basePrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Bed configuration */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={14} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Bed Configuration</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Number of Beds</label>
              <Input
                type="number"
                min="0"
                max="10"
                value={room.bedCount}
                onChange={e => onUpdate({ bedCount: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Bed Type</label>
              <Select
                value={room.bedType}
                onChange={e => onUpdate({ bedType: e.target.value })}
              >
                {BED_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* View type */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Eye size={14} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Room View</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map(opt => {
              const ViewIcon = opt.icon;
              const isSelected = room.viewType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ viewType: opt.value })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  <ViewIcon size={11} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Policy toggles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Policies</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[...POLICY_TOGGLES, { key: 'isSmokingAllowed' as keyof RoomFeatures, label: 'Smoking Allowed', icon: Cigarette, activeColor: 'bg-red-400' }].map(toggle => {
              const isActive = toggle.key === 'isSmokingAllowed'
                ? room.isSmokingAllowed
                : room.features[toggle.key as keyof RoomFeatures];
              const ToggleIcon = toggle.icon;
              return (
                <button
                  key={toggle.key}
                  type="button"
                  onClick={() => {
                    if (toggle.key === 'isSmokingAllowed') {
                      onUpdate({ isSmokingAllowed: !room.isSmokingAllowed });
                    } else {
                      toggleFeature(toggle.key as keyof RoomFeatures);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isActive
                      ? `${toggle.activeColor} border-transparent text-white shadow-sm`
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ToggleIcon size={12} />
                  {toggle.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick feature toggles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Quick Features</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURE_TOGGLES.map(toggle => {
              const isActive = room.features[toggle.key];
              const FeatureIcon = toggle.icon;
              return (
                <button
                  key={toggle.key}
                  type="button"
                  onClick={() => toggleFeature(toggle.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    isActive
                      ? `${toggle.activeColor} border-transparent text-white shadow-sm`
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FeatureIcon size={11} />
                  {toggle.label}
                  {isActive && <Check size={9} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amenities section */}
        <div>
          <button
            type="button"
            onClick={() => setAmenityExpanded(e => !e)}
            className="w-full flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Room Amenities</span>
              {selectedCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{selectedCount} selected</span>
              )}
            </div>
            {amenityExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>

          {amenityExpanded && (
            <div className="mt-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search amenities…"
                  value={amenitySearch}
                  onChange={e => setAmenitySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300"
                />
              </div>

              {/* Grouped amenity tiles */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {Object.entries(filteredGrouped).map(([category, items]) => {
                  const theme = getCategoryTheme(category);
                  return (
                    <div key={category}>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{category}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                        {items.map(amenity => {
                          const isSelected = room.amenities.includes(amenity.id);
                          const AmenityIcon = getAmenityIcon(amenity.icon);
                          return (
                            <button
                              key={amenity.id}
                              type="button"
                              onClick={() => toggleAmenity(amenity.id)}
                              className={`relative flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                                isSelected
                                  ? `${theme.selectedBg} ${theme.selectedBorder} ${theme.selectedText} shadow-sm`
                                  : `${theme.bg} ${theme.border} ${theme.text} hover:shadow-sm`
                              }`}
                            >
                              <AmenityIcon size={13} className="flex-shrink-0" />
                              <span className="truncate leading-tight">{amenity.name}</span>
                              {isSelected && (
                                <span className="absolute top-1 right-1">
                                  <Check size={9} className={theme.selectedText} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(filteredGrouped).length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs">No amenities match your search</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main RoomsTab
export const RoomsTab: React.FC<RoomsTabProps> = ({ formData, updateFormData }) => {
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [amenities, setAmenities] = useState<AmenityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const blocks = formData?.blocks || [];
  const rooms = formData?.rooms || [];

  const groupedAmenities = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) acc[amenity.category] = [];
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, AmenityDTO[]>);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setError('');
      const [types, amen] = await Promise.all([
        propertyService.getRoomTypes(),
        propertyService.getAmenities(),
      ]);
      setRoomTypes(types);
      setAmenities(amen);
    } catch (err: any) {
      setError(err.message || 'Failed to load room data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const makeRoom = (overrides: Partial<Room> = {}): Room => ({
    tempId: `room_${Date.now()}`,
    blockId: blocks[0]?.tempId || '',
    floorNumber: 1,
    roomNumber: '',
    roomTypeId: null,
    capacity: 1,
    basePrice: 0,
    amenities: [],
    isSmokingAllowed: false,
    features: { ...DEFAULT_ROOM_FEATURES },
    viewType: '',
    bedCount: 0,
    bedType: '',
    ...overrides,
  });

  const addRoom = () => updateFormData({ rooms: [...rooms, makeRoom()] });

  const cloneFromPrevious = () => {
    if (rooms.length === 0) return;
    const last = rooms[rooms.length - 1];
    updateFormData({ rooms: [makeRoom({ ...last, roomNumber: '' }), ...rooms] });
  };

  const removeRoom = (tempId: string) =>
    updateFormData({ rooms: rooms.filter(r => r.tempId !== tempId) });

  const updateRoom = (tempId: string, updates: Partial<Room>) =>
    updateFormData({ rooms: rooms.map(r => r.tempId === tempId ? { ...r, ...updates } : r) });

  if (loading) return <FormLoadingSkeleton />;

  if (blocks.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <Building size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-semibold mb-1">No blocks defined yet</p>
        <p className="text-sm text-gray-400">Complete the "Blocks & Floors" tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Room Setup</h3>
        <p className="text-sm text-gray-500">
          Configure each room with its type, features, view, bed setup, policies, and amenities.
          Use "Clone from Previous" to duplicate a room's configuration.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="ml-3 font-semibold text-red-600 hover:underline">Retry</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={addRoom} variant="outline" disabled={loading}>
          <Plus size={14} className="mr-1.5" /> Add Room
        </Button>
        <Button onClick={cloneFromPrevious} variant="outline" disabled={loading || rooms.length === 0}>
          <Copy size={14} className="mr-1.5" /> Clone from Previous
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <DoorOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">No rooms added yet</p>
          <p className="text-sm text-gray-400">Click "Add Room" to start defining rooms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room, index) => (
            <RoomCardEditor
              key={room.tempId}
              room={room}
              index={index}
              blocks={blocks}
              roomTypes={roomTypes}
              amenities={amenities}
              groupedAmenities={groupedAmenities}
              onUpdate={updates => updateRoom(room.tempId, updates)}
              onRemove={() => removeRoom(room.tempId)}
            />
          ))}
        </div>
      )}

      {rooms.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <DoorOpen size={15} className="text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-emerald-800">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} configured
          </p>
        </div>
      )}
    </div>
  );
};
