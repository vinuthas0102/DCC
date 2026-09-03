import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Home,
  MapPin, ChevronRight, Plus, Eye, SlidersHorizontal,
  RotateCcw, Shield, History, Search, Navigation, X, Download,
} from 'lucide-react';
import { ViewMode } from '../components/ui/ViewSwitcher';
import { QuarterListCard } from '../components/quarters/QuarterListCard';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import {
  QuarterFilterSidebar,
  QuarterSidebarFilters,
  QuarterSortOrder,
} from '../components/quarters/QuarterFilterSidebar';
import { quartersService, Quarter } from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';
import SplitLayout from '../components/ui/SplitLayout';
import { QuarterDetailModal } from '../components/quarters/QuarterDetailModal';
import { QuarterCard } from '../components/quarters/QuarterCard';
import { VIEW_MODE_OPTIONS } from '../components/ui/ViewModeIcons';
import { downloadPageAsHtml } from '../utils/downloadHtml';
import { QUARTER_TYPE_OPTIONS } from '../utils/quarterDisplay';

// ── Role-aware welcome banner config ────────────────────────────

const QUARTERS_WELCOME: Record<string, {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}> = {
  govt_official: {
    title: 'Quarters Allotment',
    icon: <Shield className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800',
    iconBg: 'bg-gradient-to-br from-blue-950 to-blue-800',
  },
  dept_user: {
    title: 'Browse Government Quarters',
    icon: <Home className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800',
    iconBg: 'bg-gradient-to-br from-blue-950 to-blue-800',
  },
  public: {
    title: 'Government Quarters Directory',
    icon: <Building2 className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800',
    iconBg: 'bg-gradient-to-br from-blue-950 to-blue-800',
  },
};

const QUARTERS_WELCOME_DEFAULT = {
  title: 'Browse Quarters',
  icon: <Home className="w-5 h-5 text-white" />,
  gradient: 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800',
  iconBg: 'bg-gradient-to-br from-blue-950 to-blue-800',
};

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}



export const QuarterFreeviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string | null>(null);

  // Unified filter drawer state (used across all view modes)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Unified filter state for all views
  const [rentRange, setRentRange] = useState({ min: 0, max: 99999 });
  const [sidebarFilters, setSidebarFilters] = useState<QuarterSidebarFilters>({
    searchQuery: '',
    quarterTypes: [],
    bhkConfigs: [],
    furnishingStatuses: [],
    toiletTypes: [],
    floorNumbers: [],
    availableOnly: false,
    minRent: 0,
    maxRent: 99999,
    sortOrder: 'default' as QuarterSortOrder,
  });

  // Proximity search state
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [proximityCenter, setProximityCenter] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [proximityRadiusKm, setProximityRadiusKm] = useState(10);
  const [proximityLoading, setProximityLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quartersService.getQuarters({});
      setQuarters(data);
      if (data.length > 0) {
        const rents = data.map(q => q.monthly_rent);
        const minR = Math.min(...rents);
        const maxR = Math.max(...rents);
        setRentRange({ min: minR, max: maxR });
        setSidebarFilters(prev => ({
          ...prev,
          minRent: prev.minRent === 0 ? minR : prev.minRent,
          maxRent: prev.maxRent === 99999 ? maxR : prev.maxRent,
        }));
      }
    } catch {
      addToast('Failed to load quarters', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const isListView = view === 'list';

  // Client-side filtering + sorting applied to all views
  const displayQuarters = useMemo(() => {
    const q = sidebarFilters.searchQuery.toLowerCase();
    let result = quarters.filter((quarter) => {
      if (sidebarFilters.searchQuery) {
        const match =
          quarter.quarter_number.toLowerCase().includes(q) ||
          quarter.block_name?.toLowerCase().includes(q) ||
          quarter.address?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (sidebarFilters.quarterTypes.length > 0 && !sidebarFilters.quarterTypes.includes(quarter.quarter_type)) return false;
      if (sidebarFilters.bhkConfigs.length > 0 && !sidebarFilters.bhkConfigs.includes(quarter.bhk_config)) return false;
      if (sidebarFilters.furnishingStatuses.length > 0 && !sidebarFilters.furnishingStatuses.includes(quarter.furnishing_status)) return false;
      if (sidebarFilters.toiletTypes.length > 0 && !sidebarFilters.toiletTypes.includes(quarter.toilet_type ?? 'Western')) return false;
      if (sidebarFilters.floorNumbers.length > 0) {
        const floorMatch = sidebarFilters.floorNumbers.some(f =>
          f === 4 ? quarter.floor_number >= 4 : quarter.floor_number === f
        );
        if (!floorMatch) return false;
      }
      if (sidebarFilters.availableOnly && quarter.occupancy_status !== 'AVAILABLE') return false;
      if (quarter.monthly_rent < sidebarFilters.minRent || quarter.monthly_rent > sidebarFilters.maxRent) return false;
      if (proximityEnabled && proximityCenter) {
        const lat = quarter.metadata?.latitude ? Number(quarter.metadata.latitude) : null;
        const lng = quarter.metadata?.longitude ? Number(quarter.metadata.longitude) : null;
        if (lat === null || lng === null) return false;
        if (haversineKm(proximityCenter.lat, proximityCenter.lng, lat, lng) > proximityRadiusKm) return false;
      }
      return true;
    });
    switch (sidebarFilters.sortOrder) {
      case 'rent_asc':  result = result.slice().sort((a, b) => a.monthly_rent - b.monthly_rent); break;
      case 'rent_desc': result = result.slice().sort((a, b) => b.monthly_rent - a.monthly_rent); break;
      case 'area_desc': result = result.slice().sort((a, b) => b.area_sqft - a.area_sqft); break;
    }
    return result;
  }, [quarters, sidebarFilters, proximityEnabled, proximityCenter, proximityRadiusKm]);

  const availableQuarterTypes = useMemo(() => (
    [...new Set(quarters.map(q => q.quarter_type).filter(Boolean))].sort()
  ), [quarters]);

  const availableFurnishingStatuses = useMemo(() => (
    [...new Set(quarters.map(q => q.furnishing_status).filter(Boolean))].sort()
  ), [quarters]);

  const mapCenter = useMemo(() => {
    const first = quarters.find(q => q.metadata?.latitude && q.metadata?.longitude);
    if (!first) return null;
    return { lat: Number(first.metadata.latitude), lng: Number(first.metadata.longitude) };
  }, [quarters]);

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setProximityLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProximityCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        });
        setProximityEnabled(true);
        setProximityLoading(false);
        addToast('Location set — showing quarters within radius', 'success');
      },
      () => {
        addToast('Could not get your location', 'error');
        setProximityLoading(false);
      }
    );
  };

  const handleViewQuarter = (q: Quarter) => {
    setSelectedQuarterId(q.id);
  };

  const handleCloseQuarterPanel = () => {
    setSelectedQuarterId(null);
  };

  const handleAddToRequest = (q: Quarter) => {
    navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: q } });
  };

  const clearFilters = () => {
    setSidebarFilters({
      searchQuery: '',
      quarterTypes: [],
      bhkConfigs: [],
      furnishingStatuses: [],
      toiletTypes: [],
      floorNumbers: [],
      availableOnly: false,
      minRent: rentRange.min,
      maxRent: rentRange.max,
      sortOrder: 'default' as QuarterSortOrder,
    });
    setProximityEnabled(false);
    setProximityCenter(null);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (sidebarFilters.searchQuery) n++;
    if (sidebarFilters.quarterTypes.length) n += sidebarFilters.quarterTypes.length;
    if (sidebarFilters.bhkConfigs.length) n += sidebarFilters.bhkConfigs.length;
    if (sidebarFilters.furnishingStatuses.length) n += sidebarFilters.furnishingStatuses.length;
    if (sidebarFilters.toiletTypes.length) n += sidebarFilters.toiletTypes.length;
    if (sidebarFilters.floorNumbers.length) n += sidebarFilters.floorNumbers.length;
    if (sidebarFilters.availableOnly) n++;
    if (rentRange.max > rentRange.min) {
      if (sidebarFilters.minRent > rentRange.min || sidebarFilters.maxRent < rentRange.max) n++;
    }
    if (proximityEnabled && proximityCenter) n++;
    return n;
  }, [sidebarFilters, rentRange, proximityEnabled, proximityCenter]);

  const welcomeInfo = (user?.role && QUARTERS_WELCOME[user.role]) ?? QUARTERS_WELCOME_DEFAULT;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">

          {/* ── Gradient welcome banner ── */}
          <div className={`relative ${welcomeInfo.gradient} rounded-2xl px-4 py-3 overflow-hidden shadow-lg`}>
            {/* Decorative circles */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-white rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-white rounded-full" />
            </div>

            <div className="relative flex items-center justify-between gap-3">
              {/* Left: icon + title + role badge */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 ${welcomeInfo.iconBg} rounded-lg shadow-md flex-shrink-0`}>
                  {welcomeInfo.icon}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <h1 className="text-base md:text-lg font-bold text-white leading-none whitespace-nowrap">
                    {welcomeInfo.title}
                  </h1>
                  {user && (
                    <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30 text-white whitespace-nowrap">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  )}
                  {user && (
                    <span className="hidden lg:inline text-white/70 text-xs truncate">
                      {user.fullName || user.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: view switcher + My Requests */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 p-1 gap-0.5">
                  {VIEW_MODE_OPTIONS.map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setView(mode)}
                      title={label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        view === mode
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      {icon}
                      <span className="hidden md:inline">{label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => downloadPageAsHtml('/quarters')}
                  title="Download Offline Copy"
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white rounded-xl font-medium text-xs md:text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white rounded-xl font-medium text-xs md:text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <History size={15} />
                  <span className="hidden sm:inline">My Requests</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Mandatory search bar */}
          <div className="mt-2.5">
            <MandatorySearchBar
              fields={[
                {
                  key: 'search',
                  label: 'Search',
                  type: 'text',
                  placeholder: 'Quarter number, block or address...',
                  value: sidebarFilters.searchQuery,
                  onChange: (v) => setSidebarFilters(prev => ({ ...prev, searchQuery: v })),
                  icon: <Search size={14} />,
                },
                {
                  key: 'available',
                  label: 'Availability',
                  type: 'chips',
                  value: sidebarFilters.availableOnly ? 'available' : 'all',
                  onChange: (v) => setSidebarFilters(prev => ({ ...prev, availableOnly: v === 'available' })),
                  options: [
                    { value: 'all', label: 'All' },
                    { value: 'available', label: 'Available Only' },
                  ],
                },
                {
                  key: 'bhk',
                  label: 'Quarter Type',
                  type: 'chips',
                  value: sidebarFilters.bhkConfigs.length === 1 ? sidebarFilters.bhkConfigs[0] : 'all',
                  onChange: (v) => setSidebarFilters(prev => ({
                    ...prev,
                    bhkConfigs: v === 'all' ? [] : [v],
                  })),
                  options: [
                    { value: 'all', label: 'All' },
                    ...QUARTER_TYPE_OPTIONS.map(t => ({ value: t, label: t })),
                  ],
                },
              ]}
              filterCount={activeFilterCount}
              onFilterOpen={() => setFilterDrawerOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Advanced filter drawer (right-side, consistent with other pages) */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Advanced Filters"
        activeFilterCount={activeFilterCount}
        onClearAll={() => {
          setSidebarFilters(prev => ({
            ...prev,
            quarterTypes: [],
            furnishingStatuses: [],
            toiletTypes: [],
            floorNumbers: [],
            sortOrder: 'default' as QuarterSortOrder,
            minRent: rentRange.min,
            maxRent: rentRange.max,
          }));
          setProximityEnabled(false);
          setProximityCenter(null);
        }}
      >
        <div className="space-y-6">

          {/* ── Proximity / Map Search ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-blue-500" /> Proximity Search
            </label>
            <div className={`rounded-xl border p-4 transition-all ${proximityEnabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              {!proximityCenter ? (
                <button
                  onClick={handleUseMyLocation}
                  disabled={proximityLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50"
                >
                  <Navigation size={14} className="text-blue-500" />
                  {proximityLoading ? 'Getting location…' : 'Use My Location'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin size={12} className="text-blue-500 flex-shrink-0" />
                      <span className="truncate">{proximityCenter.address}</span>
                    </div>
                    <button
                      onClick={() => { setProximityCenter(null); setProximityEnabled(false); }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Radius</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[5, 10, 20, 50].map(r => (
                        <button
                          key={r}
                          onClick={() => setProximityRadiusKm(r)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            proximityRadiusKm === r
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quarter Type */}
          {availableQuarterTypes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quarter Type</label>
              <div className="flex flex-wrap gap-2">
                {availableQuarterTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSidebarFilters(prev => ({
                      ...prev,
                      quarterTypes: prev.quarterTypes.includes(type)
                        ? prev.quarterTypes.filter(t => t !== type)
                        : [...prev.quarterTypes, type],
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      sidebarFilters.quarterTypes.includes(type)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Furnishing */}
          {availableFurnishingStatuses.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Furnishing</label>
              <div className="flex flex-wrap gap-2">
                {availableFurnishingStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSidebarFilters(prev => ({
                      ...prev,
                      furnishingStatuses: prev.furnishingStatuses.includes(status)
                        ? prev.furnishingStatuses.filter(s => s !== status)
                        : [...prev.furnishingStatuses, status],
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      sidebarFilters.furnishingStatuses.includes(status)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toilet Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Toilet Type</label>
            <div className="flex flex-wrap gap-2">
              {['Indian', 'Western', 'Both'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSidebarFilters(prev => ({
                    ...prev,
                    toiletTypes: prev.toiletTypes.includes(t)
                      ? prev.toiletTypes.filter(v => v !== t)
                      : [...prev.toiletTypes, t],
                  }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    sidebarFilters.toiletTypes.includes(t)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Floor Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Floor</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: 'Ground' },
                { value: 1, label: '1st' },
                { value: 2, label: '2nd' },
                { value: 3, label: '3rd' },
                { value: 4, label: '4th+' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSidebarFilters(prev => ({
                    ...prev,
                    floorNumbers: prev.floorNumbers.includes(value)
                      ? prev.floorNumbers.filter(v => v !== value)
                      : [...prev.floorNumbers, value],
                  }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    sidebarFilters.floorNumbers.includes(value)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="space-y-2">
              {[
                { value: 'default', label: 'Default' },
                { value: 'rent_asc', label: 'Rent: Low to High' },
                { value: 'rent_desc', label: 'Rent: High to Low' },
                { value: 'area_desc', label: 'Area: Largest First' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSidebarFilters(prev => ({ ...prev, sortOrder: value as QuarterSortOrder }))}
                  className={`w-full flex items-center px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
                    sidebarFilters.sortOrder === value
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterDrawer>

      {/* ── Split content area ──────────────────────────────── */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 py-4">
        <SplitLayout
          storageKey="qrFreeviewSplit"
          defaultSplit={65}
          minLeft={40}
          maxLeft={80}
          onClose={handleCloseQuarterPanel}
          right={selectedQuarterId ? (
            <QuarterDetailModal
              isOpen={true}
              onClose={handleCloseQuarterPanel}
              quarterId={selectedQuarterId}
              inline
            />
          ) : null}
          left={
        <div className="overflow-y-auto h-full pr-1">
        <div className="max-w-7xl mx-auto py-1">


              {/* Count row */}
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-gray-500">
                  <span className="font-semibold text-gray-900">{displayQuarters.length}</span> quarters found
                  {displayQuarters.length < quarters.length && (
                    <span className="text-xs text-gray-400 ml-1">(filtered from {quarters.length})</span>
                  )}
                  {sidebarFilters.availableOnly && (
                    <> · <span className="text-emerald-700 font-medium">available only</span></>
                  )}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <RotateCcw size={12} /> Clear filters
                  </button>
                )}
              </div>

              {loading ? (
                isListView ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse flex h-40 overflow-hidden">
                        <div className="w-48 bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-2/3" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                        <div className="w-44 p-4 space-y-3 border-l border-gray-100">
                          <div className="h-6 bg-gray-200 rounded w-full" />
                          <div className="h-10 bg-gray-200 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                        <div className="bg-gray-200 aspect-[4/3]" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : displayQuarters.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                  <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="text-base font-semibold text-gray-700 mb-1">No quarters found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                  <button onClick={clearFilters} className="mt-4 text-sm text-blue-600 hover:underline">Clear filters</button>
                </div>
              ) : isListView ? (
                <div className="space-y-4">
                  {displayQuarters.map((q, i) => (
                    <QuarterListCard key={q.id} quarter={q} idx={i} onView={handleViewQuarter} onAddToRequest={handleAddToRequest} />
                  ))}
                </div>
              ) : view === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayQuarters.map((q, i) => (
                    <QuarterCard key={q.id} quarter={q} idx={i} onView={handleViewQuarter} onAddToRequest={handleAddToRequest} isSelected={selectedQuarterId === q.id} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {['Quarter No.', 'Type', 'Config', 'Area', 'Block/Floor', 'Furnishing', 'Monthly Rent', 'Status', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {displayQuarters.map((q) => (
                          <tr key={q.id} onClick={() => handleViewQuarter(q)} className={`cursor-pointer transition-colors ${selectedQuarterId === q.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{q.quarter_number}</td>
                            <td className="px-4 py-3 text-gray-600">{q.quarter_type}</td>
                            <td className="px-4 py-3 text-gray-600">{q.bhk_config}</td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{q.area_sqft} sq.ft</td>
                            <td className="px-4 py-3 text-gray-600">{q.block_name}/{q.floor_number}</td>
                            <td className="px-4 py-3 text-gray-600">{q.furnishing_status}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmtINR(q.monthly_rent)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getOccupancyBadge(q.occupancy_status)}`}>
                                {q.occupancy_status === 'AVAILABLE' ? 'Available' : 'Occupied'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleViewQuarter(q)} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors"><Eye size={13} /></button>
                                {q.occupancy_status === 'AVAILABLE' && (
                                  <button onClick={() => handleAddToRequest(q)} className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                                    <Plus size={11} /> Add
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
        </div>
        </div>
          }
        />
      </div>
    </div>
  );
};
