import React from 'react';
import { MapPin, Bed, Ruler, Building2, Layers } from 'lucide-react';
import { ImageCarousel } from '../ui/ImageCarousel';
import type { Quarter } from '../../services/quartersService';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
];

function resolveAllImages(q: Quarter): string[] {
  let images: unknown = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images as string); } catch {
      images = (images as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) return images as string[];
  return PLACEHOLDER_IMAGES;
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED')  return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

interface QuarterDetailCardProps {
  quarter: Quarter;
  compact?: boolean;
}

export const QuarterDetailCard: React.FC<QuarterDetailCardProps> = ({ quarter, compact }) => {
  const images = resolveAllImages(quarter);
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className={compact ? 'h-44' : 'h-56'}>
        <ImageCarousel images={images} alt={quarter.quarter_number} className="h-full" showFullscreen autoPlay={false} />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{quarter.quarter_number}</h3>
            {quarter.address && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} className="flex-shrink-0" /><span className="truncate">{quarter.address}</span>
              </div>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${getOccupancyBadge(quarter.occupancy_status)}`}>
            {quarter.occupancy_status === 'AVAILABLE' ? 'Available' : quarter.occupancy_status === 'OCCUPIED' ? 'Occupied' : quarter.occupancy_status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Bed size={13} />,       label: 'Config',   value: quarter.bhk_config },
            { icon: <Ruler size={13} />,     label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
            { icon: <Building2 size={13} />, label: 'Block/Fl', value: `${quarter.block_name || '—'} / ${quarter.floor_number}` },
            { icon: <Layers size={13} />,    label: 'Furnish',  value: quarter.furnishing_status },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <div className="flex items-center gap-1 text-gray-400 mb-0.5">{item.icon}<span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span></div>
              <div className="text-xs font-semibold text-gray-800 truncate">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
          <div className="text-xs text-blue-600 font-medium">Monthly Rent</div>
          <div className="font-bold text-gray-900">{fmtINR(quarter.monthly_rent)}</div>
        </div>
        {quarter.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quarter.amenities.slice(0, 6).map(a => (
              <span key={a} className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">{a}</span>
            ))}
            {quarter.amenities.length > 6 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{quarter.amenities.length - 6}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full font-medium">{quarter.quarter_type}</span>
          {quarter.block_name && <span className="text-xs text-gray-500">Block {quarter.block_name}</span>}
        </div>
      </div>
    </div>
  );
};
