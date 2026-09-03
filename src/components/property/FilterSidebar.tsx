import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  RotateCcw,
  X,
  Wifi,
  Car,
  Utensils,
  Waves,
  Wind,
} from 'lucide-react';
import { PropertyDTO } from '../../types';
import { MiniMapComponent } from '../maps/MiniMapComponent';

export type SortOrder = 'top_picks' | 'price_asc' | 'price_desc' | 'name_asc';

export interface FilterSidebarState {
  searchQuery: string;
  moduleFilter: string;
  categoryFilter: string;
  cityFilter: string;
  amenityFilters: string[];
  minPriceFilter: number;
  maxPriceFilter: number;
  sortOrder: SortOrder;
}

interface FilterSidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  filters: FilterSidebarState;
  onChange: (patch: Partial<FilterSidebarState>) => void;
  onClear: () => void;
  properties: PropertyDTO[];
  priceRange: { min: number; max: number };
  availableModules: { id: string; name: string }[];
  availableCities: string[];
  mapCenter: { lat: number; lng: number } | null;
}

const AMENITY_OPTIONS: { key: string; label: string; icon: React.ReactNode; keywords: string[] }[] = [
  { key: 'ac',        label: 'Air conditioning', icon: <Wind size={14} />,    keywords: ['ac', 'air condition', 'cooling'] },
  { key: 'wifi',      label: 'Free WiFi',         icon: <Wifi size={14} />,    keywords: ['wifi', 'wi-fi', 'internet'] },
  { key: 'parking',   label: 'Free parking',      icon: <Car size={14} />,     keywords: ['parking', 'car park'] },
  { key: 'breakfast', label: 'Breakfast',          icon: <Utensils size={14} />, keywords: ['breakfast', 'dining'] },
  { key: 'pool',      label: 'Swimming pool',      icon: <Waves size={14} />,   keywords: ['pool', 'swimming'] },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'top_picks',  label: 'Our top picks' },
  { value: 'price_asc',  label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc',   label: 'Name A–Z' },
];

const CATEGORY_OPTS = [
  { value: 'A', label: 'Category A', cls: 'text-amber-700' },
  { value: 'B', label: 'Category B', cls: 'text-blue-700' },
  { value: 'C', label: 'Category C', cls: 'text-gray-600' },
];

function countWithAmenity(props: PropertyDTO[], keywords: string[]): number {
  return props.filter((p) =>
    (p.amenities || []).some((a) => keywords.some((kw) => a.toLowerCase().includes(kw)))
  ).length;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  collapsed,
  onCollapse,
  filters,
  onChange,
  onClear,
  properties,
  priceRange,
  availableModules,
  availableCities,
  mapCenter,
}) => {
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.searchQuery) n++;
    if (filters.moduleFilter !== 'all') n++;
    if (filters.categoryFilter !== 'all') n++;
    if (filters.cityFilter !== 'all') n++;
    if (filters.amenityFilters.length > 0) n += filters.amenityFilters.length;
    if (priceRange.max > priceRange.min) {
      if (filters.minPriceFilter > priceRange.min || filters.maxPriceFilter < priceRange.max) n++;
    }
    return n;
  }, [filters, priceRange]);

  const toggleAmenity = (key: string) => {
    const next = filters.amenityFilters.includes(key)
      ? filters.amenityFilters.filter((k) => k !== key)
      : [...filters.amenityFilters, key];
    onChange({ amenityFilters: next });
  };

  const toggleCategory = (val: string) => {
    onChange({ categoryFilter: filters.categoryFilter === val ? 'all' : val });
  };

  const toggleModule = (id: string) => {
    onChange({ moduleFilter: filters.moduleFilter === id ? 'all' : id });
  };

  const toggleCity = (city: string) => {
    onChange({ cityFilter: filters.cityFilter === city ? 'all' : city });
  };

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
    <div className="flex-shrink-0 w-72 flex flex-col">
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
          <button
            onClick={() => onCollapse(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Collapse"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
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
              label="Properties area"
              height="160px"
            />
            <button
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mx-auto"
              onClick={() => window.open(`https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}`, '_blank')}
            >
              <MapPin size={12} />
              Show on map
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-100 h-36 flex items-center justify-center border border-gray-200">
            <div className="text-center">
              <MapPin size={28} className="text-gray-300 mx-auto mb-1" />
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
              placeholder="Name, location..."
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
            onChange={(e) => onChange({ sortOrder: e.target.value as SortOrder })}
            className="w-full py-2 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Budget per night */}
        {priceRange.max > priceRange.min && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Budget per night</label>
            <div className="text-xs text-gray-500 mb-3">
              ₹{filters.minPriceFilter.toLocaleString('en-IN')} – ₹{filters.maxPriceFilter.toLocaleString('en-IN')}
              {filters.maxPriceFilter >= priceRange.max ? '+' : ''}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8 text-right">Min</span>
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  step={Math.max(1, Math.floor((priceRange.max - priceRange.min) / 100))}
                  value={filters.minPriceFilter}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v <= filters.maxPriceFilter) onChange({ minPriceFilter: v });
                  }}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8 text-right">Max</span>
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  step={Math.max(1, Math.floor((priceRange.max - priceRange.min) / 100))}
                  value={filters.maxPriceFilter}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= filters.minPriceFilter) onChange({ maxPriceFilter: v });
                  }}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Popular Filters (Amenities) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Popular filters</label>
          <div className="space-y-2">
            {AMENITY_OPTIONS.map(({ key, label, icon, keywords }) => {
              const count = countWithAmenity(properties, keywords);
              if (count === 0) return null;
              const checked = filters.amenityFilters.includes(key);
              return (
                <label
                  key={key}
                  className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                  onClick={() => toggleAmenity(key)}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400 bg-white'
                  }`}>
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-500 flex-shrink-0">{icon}</span>
                  <span className="text-sm text-gray-700 flex-1">{label}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Property Type / Module */}
        {availableModules.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Property type</label>
            <div className="space-y-2">
              {availableModules.map((mod) => {
                const count = properties.filter((p) => p.module?.id === mod.id).length;
                const checked = filters.moduleFilter === mod.id;
                return (
                  <label
                    key={mod.id}
                    className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                    onClick={() => toggleModule(mod.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400 bg-white'
                    }`}>
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{mod.name}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Category</label>
          <div className="space-y-2">
            {CATEGORY_OPTS.map(({ value, label, cls }) => {
              const count = properties.filter((p) => p.assetType?.category === value).length;
              if (count === 0) return null;
              const checked = filters.categoryFilter === value;
              return (
                <label
                  key={value}
                  className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                  onClick={() => toggleCategory(value)}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400 bg-white'
                  }`}>
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium flex-1 ${cls}`}>{label}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Location */}
        {availableCities.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Location</label>
            <div className="space-y-2">
              {availableCities.map((city) => {
                const count = properties.filter((p) => p.estate?.city === city).length;
                const checked = filters.cityFilter === city;
                return (
                  <label
                    key={city}
                    className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                    onClick={() => toggleCity(city)}
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400 bg-white'
                    }`}>
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1">{city}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

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
