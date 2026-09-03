import React from 'react';
import { Bed, Ruler, MapPin, Layers, Eye, Plus } from 'lucide-react';
import type { Quarter } from '../../services/quartersService';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80',
];

function resolveImage(q: Quarter, idx: number): string {
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
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

interface QuarterCardProps {
  quarter: Quarter;
  idx: number;
  onView: (q: Quarter) => void;
  onAddToRequest: (q: Quarter) => void;
  isSelected?: boolean;
}

export const QuarterCard: React.FC<QuarterCardProps> = ({ quarter, idx, onView, onAddToRequest, isSelected }) => (
  <article onClick={() => onView(quarter)} className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group cursor-pointer ${isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}`}>
    <div className="relative overflow-hidden aspect-[4/3]">
      <img
        src={resolveImage(quarter, idx)}
        alt={quarter.quarter_number}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]; }}
      />
      <div className="absolute top-3 left-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getOccupancyBadge(quarter.occupancy_status)}`}>
          {quarter.occupancy_status === 'AVAILABLE' ? 'Available' : 'Occupied'}
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/80 text-white backdrop-blur-sm">
          {quarter.quarter_type}
        </span>
      </div>
    </div>
    <div className="p-4 flex flex-col flex-1">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{quarter.quarter_number}</h3>
        <span className="text-xs text-gray-400 font-mono ml-2 shrink-0">
          Blk {quarter.block_name || '—'} · Fl {quarter.floor_number}
        </span>
      </div>
      {quarter.address && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin size={11} />
          <span className="truncate">{quarter.address}</span>
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
        <span className="flex items-center gap-1"><Bed size={12} />{quarter.bhk_config}</span>
        <span className="flex items-center gap-1"><Ruler size={12} />{quarter.area_sqft} sq.ft</span>
        <span className="flex items-center gap-1"><Layers size={12} />{quarter.furnishing_status.replace('-', ' ')}</span>
      </div>
      {quarter.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {quarter.amenities.slice(0, 3).map(a => (
            <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{a}</span>
          ))}
          {quarter.amenities.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{quarter.amenities.length - 3}</span>
          )}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <span className="text-lg font-bold text-gray-900">{fmtINR(quarter.monthly_rent)}</span>
          <span className="text-xs text-gray-500">/mo</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onView(quarter); }}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
            title="View details"
          >
            <Eye size={14} />
          </button>
          {quarter.occupancy_status === 'AVAILABLE' && (
            <button
              onClick={e => { e.stopPropagation(); onAddToRequest(quarter); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  </article>
);
