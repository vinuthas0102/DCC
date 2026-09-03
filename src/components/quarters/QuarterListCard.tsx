import React, { useState } from 'react';
import {
  MapPin,
  Bed,
  Ruler,
  Layers,
  Home,
  Plus,
  Eye,
  ChevronRight,
  CheckCircle,
  Images,
  Compass,
  Zap,
  Droplets,
  LayoutDashboard,
} from 'lucide-react';
import { Quarter } from '../../services/quartersService';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80',
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
];

function resolveImages(q: Quarter, idx: number): string[] {
  let images = q.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = (images as unknown as string)
        .replace(/^\{/, '')
        .replace(/\}$/, '')
        .split(',')
        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }
  const parsed: string[] = Array.isArray(images) ? images.filter(Boolean) : [];
  const result = [...parsed];
  let fi = idx;
  while (result.length < 5) {
    result.push(FALLBACK_IMAGES[fi % FALLBACK_IMAGES.length]);
    fi++;
  }
  return result;
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getOccupancyStyles(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

interface QuarterListCardProps {
  quarter: Quarter;
  idx: number;
  onView: (q: Quarter) => void;
  onAddToRequest?: (q: Quarter) => void;
}

export const QuarterListCard: React.FC<QuarterListCardProps> = ({
  quarter,
  idx,
  onView,
  onAddToRequest,
}) => {
  const [primaryImgError, setPrimaryImgError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});
  const isAvailable = quarter.occupancy_status === 'AVAILABLE';
  const allImages = resolveImages(quarter, idx);
  const primaryImage = allImages[0];
  const thumbnails = allImages.slice(1, 5);
  const realImageCount = (() => {
    let imgs = quarter.images;
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    }
    return Array.isArray(imgs) ? imgs.filter(Boolean).length : 0;
  })();
  const extraCount = realImageCount > 5 ? realImageCount - 4 : 0;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col sm:flex-row"
      onClick={() => onView(quarter)}
    >
      {/* ── Left: Gallery Image Section ─────────────────────────── */}
      <div className="relative flex-shrink-0 sm:w-64 md:w-72 flex flex-col bg-gray-100">

        {/* Primary hero image */}
        <div className="relative overflow-hidden" style={{ height: '196px' }}>
          {!primaryImgError ? (
            <img
              src={primaryImage}
              alt={quarter.quarter_number}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setPrimaryImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Home size={48} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-3 left-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border bg-white/90 backdrop-blur-sm ${getOccupancyStyles(quarter.occupancy_status)}`}>
              {isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/85 text-white backdrop-blur-sm shadow-sm">
              {quarter.quarter_type}
            </span>
          </div>
        </div>

        {/* Thumbnail strip — 4 small images */}
        <div className="flex h-[62px] border-t border-gray-200/60">
          {thumbnails.map((src, i) => {
            const isLast = i === 3;
            const showViewAll = isLast && extraCount > 0;
            return (
              <div
                key={i}
                className="relative flex-1 overflow-hidden border-r border-gray-200/60 last:border-r-0 bg-gray-100"
              >
                {!thumbErrors[i] ? (
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
                  <div className="absolute inset-0 bg-slate-900/72 flex flex-col items-center justify-center gap-0">
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

      {/* ── Centre: Details ──────────────────────────────────────── */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base font-bold text-blue-700 group-hover:text-blue-800 transition-colors leading-snug">
              {quarter.quarter_number}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {quarter.quarter_type}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {quarter.bhk_config}
            </span>
          </div>

          {quarter.address && (
            <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
              <MapPin size={12} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">{quarter.address}</span>
            </div>
          )}

          {/* Specs */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 mb-2">
            <span className="flex items-center gap-1.5">
              <Bed size={13} className="text-gray-400" />{quarter.bhk_config}
            </span>
            <span className="flex items-center gap-1.5">
              <Ruler size={13} className="text-gray-400" />{quarter.area_sqft} sq.ft
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={13} className="text-gray-400" />{quarter.furnishing_status}
            </span>
            <span className="text-gray-400 font-mono text-[11px]">
              Blk {quarter.block_name || '—'} · Fl {quarter.floor_number}
              {quarter.total_floors > 0 ? `/${quarter.total_floors}` : ''}
            </span>
            {quarter.facing && (
              <span className="flex items-center gap-1 text-gray-500">
                <Compass size={11} className="text-gray-400" />{quarter.facing}-facing
              </span>
            )}
          </div>

          {/* Extended feature chips */}
          {(quarter.balcony || quarter.pooja_room || quarter.lift_access || quarter.power_backup || quarter.location_area || quarter.resident_type || quarter.renovation_status) && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {quarter.resident_type && (
                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full">{quarter.resident_type}</span>
              )}
              {quarter.renovation_status && (
                <span className="text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">{quarter.renovation_status}</span>
              )}
              {quarter.balcony && (
                <span className="text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <LayoutDashboard size={8} />Balcony
                </span>
              )}
              {quarter.pooja_room && (
                <span className="text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">Pooja Room</span>
              )}
              {quarter.lift_access && (
                <span className="text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full">Lift</span>
              )}
              {quarter.power_backup && (
                <span className="text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Zap size={8} />Power Backup
                </span>
              )}
              {quarter.water_charges > 0 && (
                <span className="text-[10px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Droplets size={8} />Water ₹{quarter.water_charges}/mo
                </span>
              )}
            </div>
          )}

          {/* Amenities */}
          {quarter.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quarter.amenities.slice(0, 5).map((a) => (
                <span key={a} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                  {a}
                </span>
              ))}
              {quarter.amenities.length > 5 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  +{quarter.amenities.length - 5} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            {isAvailable ? (
              <>
                <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                <span className="text-emerald-700 font-medium">Available now — apply via request</span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-red-300 flex-shrink-0" />
                <span className="text-gray-500">Currently occupied</span>
              </>
            )}
          </div>
        </div>

        {quarter.description && (
          <p className="text-xs text-gray-400 mt-2.5 line-clamp-1 leading-relaxed border-t border-gray-100 pt-2">
            {quarter.description}
          </p>
        )}
      </div>

      {/* ── Right: Rent + CTA ────────────────────────────────────── */}
      <div
        className="flex flex-col justify-between p-4 sm:border-l border-gray-100 sm:w-48 flex-shrink-0 bg-gray-50/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-end gap-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Monthly Rent (HRA)</p>
          <p className="text-2xl font-bold text-gray-900 leading-none tracking-tight">
            {fmtINR(quarter.monthly_rent)}
          </p>
          <p className="text-xs text-gray-400">per month</p>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <Ruler size={11} className="text-gray-400" />
            <span>{quarter.area_sqft} sq.ft</span>
            <span className="text-gray-300">·</span>
            <Bed size={11} className="text-gray-400" />
            <span>{quarter.bhk_config}</span>
          </div>
          {quarter.quota && (
            <div className="mt-1.5 text-[10px] text-center text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
              {quarter.quota} Quota
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {isAvailable && onAddToRequest && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToRequest(quarter); }}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-200"
            >
              <Plus size={14} />
              Add to Request
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onView(quarter); }}
            className="w-full flex items-center justify-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          >
            <Eye size={13} />
            View Details
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
