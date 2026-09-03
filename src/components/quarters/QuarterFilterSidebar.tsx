import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  RotateCcw,
  X,
  MapPin,
  Home,
  CheckCircle,
} from 'lucide-react';
import { Quarter } from '../../services/quartersService';
import { MiniMapComponent } from '../maps/MiniMapComponent';
import { QUARTER_TYPE_OPTIONS } from '../../utils/quarterDisplay';

export type QuarterSortOrder = 'default' | 'rent_asc' | 'rent_desc' | 'area_desc';

export interface QuarterSidebarFilters {
  searchQuery: string;
  quarterTypes: string[];
  bhkConfigs: string[];
  furnishingStatuses: string[];
  toiletTypes: string[];
  floorNumbers: number[];
  availableOnly: boolean;
  minRent: number;
  maxRent: number;
  sortOrder: QuarterSortOrder;
}

interface QuarterFilterSidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  /** When provided, renders a close (X) button instead of the collapse arrow */
  onClose?: () => void;
  filters: QuarterSidebarFilters;
  onChange: (patch: Partial<QuarterSidebarFilters>) => void;
  onClear: () => void;
  allQuarters: Quarter[];
  rentRange: { min: number; max: number };
  mapCenter: { lat: number; lng: number } | null;
}

const QUARTER_TYPES = ['Type-I', 'Type-II', 'Type-III', 'Type-IV', 'Type-V', 'Type-VI'];
const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-Furnished', 'Furnished'];

const SORT_OPTIONS: { value: QuarterSortOrder; label: string }[] = [
  { value: 'default',   label: 'Default (Quarter No.)' },
  { value: 'rent_asc',  label: 'Rent: low to high' },
  { value: 'rent_desc', label: 'Rent: high to low' },
  { value: 'area_desc', label: 'Area: largest first' },
];

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function countByType(quarters: Quarter[], type: string) {
  return quarters.filter((q) => q.quarter_type === type).length;
}
function countByBhk(quarters: Quarter[], bhk: string) {
  return quarters.filter((q) => q.bhk_config === bhk).length;
}
function countByFurnishing(quarters: Quarter[], f: string) {
  return quarters.filter((q) => q.furnishing_status === f).length;
}

function CheckboxRow({
  checked,
  onToggle,
  label,
  count,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  count: number;
}) {
  if (count === 0) return null;
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5" onClick={onToggle}>
      <div
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400 bg-white'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <span className="text-xs text-gray-400">{count}</span>
    </label>
  );
}

export const QuarterFilterSidebar: React.FC<QuarterFilterSidebarProps> = ({
  collapsed,
  onCollapse,
  onClose,
  filters,
  onChange,
  onClear,
  allQuarters,
  rentRange,
  mapCenter,
}) => {
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.searchQuery) n++;
    if (filters.quarterTypes.length > 0) n += filters.quarterTypes.length;
    if (filters.bhkConfigs.length > 0) n += filters.bhkConfigs.length;
    if (filters.furnishingStatuses.length > 0) n += filters.furnishingStatuses.length;
    if (filters.toiletTypes.length > 0) n += filters.toiletTypes.length;
    if (filters.floorNumbers.length > 0) n += filters.floorNumbers.length;
    if (filters.availableOnly) n++;
    if (rentRange.max > rentRange.min) {
      if (filters.minRent > rentRange.min || filters.maxRent < rentRange.max) n++;
    }
    return n;
  }, [filters, rentRange]);

  const toggleMulti = (key: keyof Pick<QuarterSidebarFilters, 'quarterTypes' | 'bhkConfigs' | 'furnishingStatuses' | 'toiletTypes'>, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ [key]: next });
  };

  const availableCount = allQuarters.filter((q) => q.occupancy_status === 'AVAILABLE').length;

  // Collapsed strip
  if (collapsed) {
    return (
      <div className="flex-shrink-0 w-11 flex flex-col items-center gap-2 pt-3">
        <button
          onClick={() => onCollapse(false)}
          title="Expand filters"
          className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
        <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm" title="Filters">
          <SlidersHorizontal size={16} className="text-gray-500" />
        </div>
        {activeCount > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
            {activeCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 flex flex-col h-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-500" />
          <span className="text-sm font-bold text-gray-800">Filter by</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
            <button
              onClick={onClear}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"
              title="Clear all filters"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {onClose ? (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X size={16} className="text-gray-600" />
            </button>
          ) : (
            <button
              onClick={() => onCollapse(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Collapse"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-5">

        {/* Mini Map */}
        {mapCenter ? (
          <div>
            <MiniMapComponent
              latitude={mapCenter.lat}
              longitude={mapCenter.lng}
              label="Quarters area"
              height="160px"
            />
            <button
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mx-auto"
              onClick={() =>
                window.open(`https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}`, '_blank')
              }
            >
              <MapPin size={12} />
              Show on map
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-100 h-36 flex items-center justify-center border border-gray-200">
            <div className="text-center">
              <Home size={28} className="text-gray-300 mx-auto mb-1" />
              <span className="text-xs text-gray-400">Map unavailable</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Quarter no., block, address…"
              value={filters.searchQuery}
              onChange={(e) => onChange({ searchQuery: e.target.value })}
              className="w-full pl-8 pr-7 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 focus:bg-white transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onChange({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Sort by</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => onChange({ sortOrder: e.target.value as QuarterSortOrder })}
            className="w-full py-2 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Monthly Rent range */}
        {rentRange.max > rentRange.min && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Monthly rent</label>
            <div className="text-xs text-gray-500 mb-3">
              {fmtINR(filters.minRent)} – {fmtINR(filters.maxRent)}
              {filters.maxRent >= rentRange.max ? '+' : ''}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8 text-right">Min</span>
                <input
                  type="range"
                  min={rentRange.min}
                  max={rentRange.max}
                  step={Math.max(1, Math.floor((rentRange.max - rentRange.min) / 100))}
                  value={filters.minRent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v <= filters.maxRent) onChange({ minRent: v });
                  }}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8 text-right">Max</span>
                <input
                  type="range"
                  min={rentRange.min}
                  max={rentRange.max}
                  step={Math.max(1, Math.floor((rentRange.max - rentRange.min) / 100))}
                  value={filters.maxRent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= filters.minRent) onChange({ maxRent: v });
                  }}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Availability */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Availability</label>
          <label className="flex items-center gap-2.5 cursor-pointer group py-0.5" onClick={() => onChange({ availableOnly: !filters.availableOnly })}>
            <div
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                filters.availableOnly ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 group-hover:border-emerald-400 bg-white'
              }`}
            >
              {filters.availableOnly && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <CheckCircle size={13} className={filters.availableOnly ? 'text-emerald-600' : 'text-gray-400'} />
            <span className="text-sm text-gray-700 flex-1">Available only</span>
            <span className="text-xs text-gray-400">{availableCount}</span>
          </label>
        </div>

        {/* Quarter Type */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Quarter type</label>
          <div className="space-y-2">
            {QUARTER_TYPES.map((t) => (
              <CheckboxRow
                key={t}
                checked={filters.quarterTypes.includes(t)}
                onToggle={() => toggleMulti('quarterTypes', t)}
                label={t}
                count={countByType(allQuarters, t)}
              />
            ))}
          </div>
        </div>

        {/* Quarter Type */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Quarter Type</label>
          <div className="space-y-2">
            {QUARTER_TYPE_OPTIONS.map((b) => (
              <CheckboxRow
                key={b}
                checked={filters.bhkConfigs.includes(b)}
                onToggle={() => toggleMulti('bhkConfigs', b)}
                label={b}
                count={countByBhk(allQuarters, b)}
              />
            ))}
          </div>
        </div>

        {/* Furnishing */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Furnishing</label>
          <div className="space-y-2">
            {FURNISHING_OPTIONS.map((f) => (
              <CheckboxRow
                key={f}
                checked={filters.furnishingStatuses.includes(f)}
                onToggle={() => toggleMulti('furnishingStatuses', f)}
                label={f}
                count={countByFurnishing(allQuarters, f)}
              />
            ))}
          </div>
        </div>

        {/* Toilet Type */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Toilet Type</label>
          <div className="space-y-2">
            {['Indian', 'Western', 'Both'].map((t) => (
              <CheckboxRow
                key={t}
                checked={filters.toiletTypes.includes(t)}
                onToggle={() => toggleMulti('toiletTypes', t)}
                label={t}
                count={allQuarters.filter(q => q.toilet_type === t).length}
              />
            ))}
          </div>
        </div>

        {/* Floor */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Floor</label>
          <div className="space-y-2">
            {[
              { value: 0, label: 'Ground Floor' },
              { value: 1, label: '1st Floor' },
              { value: 2, label: '2nd Floor' },
              { value: 3, label: '3rd Floor' },
              { value: 4, label: '4th Floor+' },
            ].map(({ value, label }) => {
              const count = value === 4
                ? allQuarters.filter(q => q.floor_number >= 4).length
                : allQuarters.filter(q => q.floor_number === value).length;
              if (count === 0) return null;
              const checked = filters.floorNumbers.includes(value);
              return (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                  onClick={() => {
                    const current = filters.floorNumbers;
                    const next = current.includes(value)
                      ? current.filter(v => v !== value)
                      : [...current, value];
                    onChange({ floorNumbers: next });
                  }}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400 bg-white'
                  }`}>
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{label}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Clear all */}
        {activeCount > 0 && (
          <div className="pb-2">
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <RotateCcw size={13} />
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
