import React from 'react';
import {
  Users, Calendar, BedDouble, Baby, PawPrint, Accessibility,
  Cigarette, Check, Trees, Mountain, Waves, Building2, Droplets,
  CircleDot, Eye,
} from 'lucide-react';
import { RoomDTO, AmenityDTO } from '../../types';
import { getAmenityIcon } from '../../utils/amenityIcons';

interface RoomDisplayCardProps {
  room: RoomDTO;
  allAmenities?: AmenityDTO[];
  onBook?: () => void;
  compact?: boolean;
}

const VIEW_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; className?: string }>; cls: string }> = {
  garden:    { label: 'Garden View',    Icon: Trees,    cls: 'bg-green-100 text-green-700 border-green-200' },
  mountain:  { label: 'Mountain View',  Icon: Mountain, cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  sea:       { label: 'Sea View',       Icon: Waves,    cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  city:      { label: 'City View',      Icon: Building2,cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  pool:      { label: 'Pool View',      Icon: Droplets, cls: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  courtyard: { label: 'Courtyard View', Icon: CircleDot,cls: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const BED_TYPE_LABELS: Record<string, string> = {
  single: 'Single', double: 'Double', twin: 'Twin', queen: 'Queen', king: 'King',
};

export const RoomDisplayCard: React.FC<RoomDisplayCardProps> = ({
  room, allAmenities = [], onBook, compact = false,
}) => {
  // Resolve amenity objects for this room
  const resolvedAmenities: AmenityDTO[] = room.amenities
    .map(id => allAmenities.find(a => a.id === id))
    .filter((a): a is AmenityDTO => Boolean(a));

  const shownAmenities = resolvedAmenities.slice(0, 5);
  const extraCount = resolvedAmenities.length - shownAmenities.length;

  const viewCfg = room.viewType ? VIEW_CONFIG[room.viewType] : null;

  const { features } = room;
  const policyItems = [
    { show: features?.isKidsFriendly,         Icon: Baby,          label: 'Kids OK',     cls: 'bg-sky-100 text-sky-700 border-sky-200' },
    { show: features?.isPetFriendly,           Icon: PawPrint,      label: 'Pets OK',     cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    { show: features?.isWheelchairAccessible,  Icon: Accessibility, label: 'Accessible',  cls: 'bg-green-100 text-green-700 border-green-200' },
    { show: room.isSmokingAllowed,             Icon: Cigarette,     label: 'Smoking',     cls: 'bg-red-100 text-red-700 border-red-200' },
  ].filter(p => p.show);

  const noSmokingBadge = !room.isSmokingAllowed;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="flex flex-col sm:flex-row">
        {/* Left: Illustration */}
        <div className={`flex-none ${compact ? 'w-full sm:w-24 h-20' : 'w-full sm:w-36 h-28'} bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center relative overflow-hidden`}>
          <BedDouble size={compact ? 28 : 36} className="text-blue-200 group-hover:text-blue-300 transition-colors" />
          {viewCfg && (
            <div className={`absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${viewCfg.cls} backdrop-blur-sm`}>
              <viewCfg.Icon size={8} />
              {viewCfg.label}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className={`flex-1 ${compact ? 'p-3' : 'p-4'} flex flex-col justify-between min-w-0`}>
          {/* Row 1: name + price */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">
                {room.roomType?.name || 'Room'} <span className="font-mono text-gray-400 text-xs">#{room.roomNumber}</span>
              </h4>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Users size={10} />Sleeps {room.capacity}
                </span>
                {(room.bedCount > 0 || room.bedType) && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <BedDouble size={10} />
                    {room.bedCount > 0 ? `${room.bedCount}×` : ''}{BED_TYPE_LABELS[room.bedType] || room.bedType || ''}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`font-black text-gray-900 leading-none ${compact ? 'text-base' : 'text-xl'}`}>
                ₹{room.basePrice.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-gray-400">per night</div>
            </div>
          </div>

          {/* Row 2: amenity icon strip */}
          {(shownAmenities.length > 0 || resolvedAmenities.length === 0 && room.amenities.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {shownAmenities.map(amenity => {
                const Icon = getAmenityIcon(amenity.icon);
                return (
                  <span key={amenity.id} className="flex items-center gap-1 text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-full">
                    <Icon size={9} className="flex-shrink-0" />{amenity.name}
                  </span>
                );
              })}
              {/* fallback: raw strings when allAmenities not provided */}
              {resolvedAmenities.length === 0 && room.amenities.slice(0, 5).map(a => (
                <span key={a} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{a}</span>
              ))}
              {extraCount > 0 && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">+{extraCount}</span>
              )}
            </div>
          )}

          {/* Row 3: policy chips + CTA */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap gap-1">
              {policyItems.map(({ Icon, label, cls }) => (
                <span key={label} className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
                  <Icon size={8} />{label}
                </span>
              ))}
              {noSmokingBadge && (
                <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">
                  <Cigarette size={8} className="line-through" />Non-Smoking
                </span>
              )}
              {features?.hasBalcony && (
                <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                  <Eye size={8} />Balcony
                </span>
              )}
            </div>
            {onBook && (
              <button
                onClick={onBook}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Calendar size={10} /> Book
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
