import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Building2,
  CheckCircle,
  ChevronRight,
  Users,
  BedDouble,
  Images,
} from 'lucide-react';
import { PropertyDTO, AmenityDTO } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { requiresLoginForBooking, getModuleBadgeText, getModuleBadgeStyles } from '../../utils/moduleHelpers';
import { getAmenityIcon } from '../../utils/amenityIcons';

interface PropertyListCardProps {
  property: PropertyDTO;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  isLoggedIn: boolean;
  onBookClick: (e: React.MouseEvent, property: PropertyDTO) => void;
  onCardClick?: (property: PropertyDTO) => void;
  allAmenities?: AmenityDTO[];
  isSelected?: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
  A: 'bg-amber-100 text-amber-800 border-amber-200',
  B: 'bg-blue-100 text-blue-800 border-blue-200',
  C: 'bg-gray-100 text-gray-700 border-gray-200',
};

function isQuartersProperty(property: PropertyDTO): boolean {
  const name = property.module?.name?.toLowerCase() || '';
  const code = property.module?.code?.toLowerCase() || '';
  return name.includes('quarter') || code.includes('quarter') || code.includes('qtr');
}

export const PropertyListCard: React.FC<PropertyListCardProps> = ({
  property,
  checkIn,
  checkOut,
  guests,
  isLoggedIn,
  onBookClick,
  onCardClick,
  allAmenities = [],
  isSelected = false,
}) => {
  const navigate = useNavigate();
  const [primaryImgError, setPrimaryImgError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});

  const cat = property.assetType?.category;
  const catStyle = cat ? CATEGORY_STYLES[cat] : null;
  const moduleBadgeText = getModuleBadgeText(property.module?.code);
  const moduleBadgeStyles = getModuleBadgeStyles(property.module?.code);
  const needsLogin = requiresLoginForBooking(property.module?.code) && !isLoggedIn;
  const showDatesGuests = !isQuartersProperty(property);

  // Resolve property amenity IDs → AmenityDTO objects for icon display
  const resolvedAmenities = (property.amenities || [])
    .map(id => allAmenities.find(a => a.id === id))
    .filter(Boolean) as AmenityDTO[];
  const shownAmenities = resolvedAmenities.slice(0, 5);

  const nightCount = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : null;

  const images = property.images || [];
  const primaryImage = images[0] || '';
  const thumbnails = Array.from({ length: 4 }, (_, i) => images[i + 1] || '');
  const realImageCount = images.length;
  const extraCount = realImageCount > 5 ? realImageCount - 4 : 0;

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col sm:flex-row ${isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}`}
      onClick={() => onCardClick ? onCardClick(property) : navigate(`/properties/${property.id}`)}
    >
      {/* ── Left: Gallery Image Section ─────────────────────────── */}
      <div className="relative flex-shrink-0 sm:w-64 md:w-72 flex flex-col bg-gray-100">

        {/* Primary hero image */}
        <div className="relative overflow-hidden" style={{ height: '196px' }}>
          {images.length > 0 && !primaryImgError ? (
            <img
              src={primaryImage}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setPrimaryImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Building2 size={48} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Category badge top-left */}
          {catStyle && (
            <div className="absolute top-3 left-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border bg-white/90 backdrop-blur-sm ${catStyle}`}>
                {cat === 'A' ? 'Cat A' : cat === 'B' ? 'Cat B' : 'Cat C'}
              </span>
            </div>
          )}

          {/* Module badge top-right */}
          {property.module && (
            <div className="absolute top-3 right-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/85 text-white backdrop-blur-sm shadow-sm">
                {property.module.name}
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail strip — 4 small images, 62px height */}
        <div className="flex h-[62px] border-t border-gray-200/60">
          {thumbnails.map((src, i) => {
            const isLast = i === 3;
            const showViewAll = isLast && extraCount > 0;
            const hasError = thumbErrors[i];
            return (
              <div
                key={i}
                className="relative flex-1 overflow-hidden border-r border-gray-200/60 last:border-r-0 bg-gray-100"
              >
                {src && !hasError ? (
                  <img
                    src={src}
                    alt={`View ${i + 2}`}
                    className="w-full h-full object-cover brightness-95 group-hover:brightness-100 transition-all duration-300"
                    onError={() => setThumbErrors(prev => ({ ...prev, [i]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Images size={13} className="text-gray-400" />
                  </div>
                )}
                {showViewAll && (
                  <div className="absolute inset-0 bg-slate-900/72 flex flex-col items-center justify-center">
                    <span className="text-white text-[9px] font-black uppercase leading-tight tracking-widest">VIEW</span>
                    <span className="text-white text-[9px] font-black uppercase leading-tight tracking-widest">ALL</span>
                    {extraCount > 0 && (
                      <span className="text-white/70 text-[8px] font-semibold mt-0.5">+{extraCount}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Centre: Details ───────────────────────────────────── */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {moduleBadgeText && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${moduleBadgeStyles}`}>
                {moduleBadgeText}
              </span>
            )}
            {property.propertyType && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                {property.propertyType.name}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1 line-clamp-1">
            {property.name}
          </h3>

          <div className="flex items-center gap-1 text-gray-500 text-xs mb-2.5">
            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{property.estate?.city || property.address || 'Location not specified'}</span>
          </div>

          {shownAmenities.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {shownAmenities.map(amenity => {
                const Icon = getAmenityIcon(amenity.icon);
                return (
                  <span key={amenity.id} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                    <Icon size={11} className="text-gray-400 flex-shrink-0" />
                    {amenity.name}
                  </span>
                );
              })}
              {resolvedAmenities.length > 5 && (
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">+{resolvedAmenities.length - 5}</span>
              )}
            </div>
          )}

          {property.propertyType && (
            <div className="flex items-center gap-1.5 text-xs text-gray-700 mb-2">
              <BedDouble size={13} className="text-gray-400" />
              <span className="font-medium">{property.propertyType.name}</span>
            </div>
          )}

          <div className="space-y-1">
            {property.isExempt === false && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle size={12} className="flex-shrink-0" />
                <span>No restrictions apply</span>
              </div>
            )}
            {needsLogin ? (
              <div className="flex items-center gap-1.5 text-xs text-blue-700">
                <CheckCircle size={12} className="flex-shrink-0" />
                <span>Login required to book</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle size={12} className="flex-shrink-0" />
                <span>Book online instantly</span>
              </div>
            )}
          </div>
        </div>

        {property.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
        )}
      </div>

      {/* ── Right: Price + CTA ───────────────────────────────── */}
      <div className="flex flex-col justify-between p-4 sm:border-l border-gray-100 sm:w-48 sm:min-w-[192px] flex-shrink-0 bg-gray-50/50">
        {showDatesGuests && (checkIn || guests) && (
          <div className="mb-3 text-xs text-gray-500 leading-relaxed text-right">
            {nightCount != null && nightCount > 0 && (
              <div>{nightCount} night{nightCount > 1 ? 's' : ''}</div>
            )}
            {guests && guests > 0 && (
              <div className="flex items-center gap-1 justify-end">
                <Users size={11} />
                {guests} adult{guests > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center items-end gap-1">
          {property.minPrice != null ? (
            <>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold text-right">From</p>
              <p className="text-2xl font-black text-gray-900 text-right leading-none">
                {formatCurrency(property.minPrice)}
              </p>
              <p className="text-xs text-gray-400 text-right">per night</p>
              {property.maxPrice != null && property.maxPrice !== property.minPrice && (
                <p className="text-xs text-gray-400 text-right">
                  up to {formatCurrency(property.maxPrice)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-500 text-right">Price on request</p>
          )}

          {property.totalRooms != null && property.totalRooms > 0 && (
            <p className="text-xs text-gray-400 text-right mt-1">
              {property.totalRooms} rooms available
            </p>
          )}
        </div>

        <button
          onClick={(e) => onBookClick(e, property)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <Calendar size={14} />
          {needsLogin ? 'Login to Book' : 'See availability'}
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
