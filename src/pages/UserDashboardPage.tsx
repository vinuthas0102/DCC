import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Camera,
  History,
  ChevronRight,
  Shield,
  Users,
  Home,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { SkeletonCard } from '../components/ui/Loading';
import { FadeIn } from '../components/animations/FadeIn';
import { DataTable, Column } from '../components/ui/DataTable';
import { PropertyListCard } from '../components/property/PropertyListCard';
import { FilterSidebarState, SortOrder } from '../components/property/FilterSidebar';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { useViewPreference } from '../hooks/useViewPreference';
import { propertyService } from '../services/propertyService';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { usePropertyStore } from '../stores/propertyStore';
import { PropertyDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';
import { requiresLoginForBooking, getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';
import { PropertyDetailModal } from '../components/property/PropertyDetailModal';
import { formatCurrency } from '../utils/formatters';
import { VIEW_MODE_OPTIONS } from '../components/ui/ViewModeIcons';

// ── Types ────────────────────────────────────────────────────────

type ViewMode = 'card' | 'list' | 'table';

// ── Constants ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  A: { label: 'Category A', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  B: { label: 'Category B', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  C: { label: 'Category C', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const ROLE_WELCOME: Record<string, {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}> = {
  govt_official: {
    title: 'Facility Management',
    icon: <Shield className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800',
    iconBg: 'bg-gradient-to-br from-blue-950 to-blue-800',
  },
  dept_user: {
    title: 'Department User Portal',
    icon: <Users className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800',
    iconBg: 'bg-gradient-to-br from-blue-950 to-blue-800',
  },
  public: {
    title: 'Community Facilities',
    icon: <Home className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800',
    iconBg: 'bg-gradient-to-br from-blue-950 to-blue-800',
  },
};

// ── Default filter state ─────────────────────────────────────────

function defaultFilters(priceMin = 0, priceMax = 99999): FilterSidebarState {
  return {
    searchQuery: '',
    moduleFilter: 'all',
    categoryFilter: 'all',
    cityFilter: 'all',
    amenityFilters: [],
    minPriceFilter: priceMin,
    maxPriceFilter: priceMax,
    sortOrder: 'top_picks' as SortOrder,
  };
}

// ── Amenity keyword matching ─────────────────────────────────────

const AMENITY_KEY_MAP: Record<string, string[]> = {
  ac:        ['ac', 'air condition', 'cooling', 'hvac'],
  wifi:      ['wifi', 'wi-fi', 'internet', 'wireless'],
  parking:   ['parking', 'car park', 'garage'],
  breakfast: ['breakfast', 'dining', 'restaurant'],
  pool:      ['pool', 'swimming'],
};

function propertyHasAmenity(property: PropertyDTO, key: string): boolean {
  const keywords = AMENITY_KEY_MAP[key];
  if (!keywords) return false;
  return (property.amenities || []).some((a) =>
    keywords.some((kw) => a.toLowerCase().includes(kw))
  );
}

// ── Page component ────────────────────────────────────────────────

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const { amenities, fetchAmenities } = usePropertyStore();
  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('dashboardView', 'list') as [ViewMode, (v: ViewMode) => void];
  const [modalPropertyId, setModalPropertyId] = useState<string | null>(null);

  const [availableModules, setAvailableModules] = useState<{ id: string; name: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 99999 });
  const [filters, setFilters] = useState<FilterSidebarState>(() => defaultFilters(0, 99999));
  const [availableOnly, setAvailableOnly] = useState(false);


  const roleKey = user?.role || 'public';
  const welcomeInfo = ROLE_WELCOME[roleKey] || ROLE_WELCOME.public;

  useEffect(() => {
    loadProperties();
    fetchAmenities();
  }, [user]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await propertyService.getProperties({
        status: 'PUBLISHED',
        isExempt: false,
        userRole: user?.role,
      });
      setProperties(data);

      const modulesMap = new Map<string, { id: string; name: string }>();
      const citiesSet = new Set<string>();
      let minP = Infinity;
      let maxP = 0;

      data.forEach((p) => {
        if (p.module) modulesMap.set(p.module.id, { id: p.module.id, name: p.module.name });
        if (p.estate?.city) citiesSet.add(p.estate.city);
        if (p.minPrice != null && p.minPrice < minP) minP = p.minPrice;
        if (p.maxPrice != null && p.maxPrice > maxP) maxP = p.maxPrice;
        if (p.minPrice != null && p.minPrice > maxP) maxP = p.minPrice;
      });

      const pMin = minP === Infinity ? 0 : minP;
      const pMax = maxP === 0 ? 99999 : maxP;

      setAvailableModules(Array.from(modulesMap.values()));
      setAvailableCities(Array.from(citiesSet).sort());
      setPriceRange({ min: pMin, max: pMax });
      setFilters(defaultFilters(pMin, pMax));
    } catch {
      addToast('Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ────────────────────────────────────────────────

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.estate?.city?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.moduleFilter !== 'all' && p.module?.id !== filters.moduleFilter) return false;
      if (filters.categoryFilter !== 'all' && p.assetType?.category !== filters.categoryFilter) return false;
      if (filters.cityFilter !== 'all' && p.estate?.city !== filters.cityFilter) return false;
      if (filters.amenityFilters.length > 0) {
        if (!filters.amenityFilters.every((k) => propertyHasAmenity(p, k))) return false;
      }
      if (priceRange.max > priceRange.min) {
        const price = p.minPrice ?? p.maxPrice;
        if (price != null && (price < filters.minPriceFilter || price > filters.maxPriceFilter)) return false;
      }
      if (availableOnly && p.minPrice == null) return false;
      return true;
    });
  }, [properties, filters, priceRange, availableOnly]);

  // ── Sorting ──────────────────────────────────────────────────

  const displayProperties = useMemo(() => {
    const arr = [...filteredProperties];
    switch (filters.sortOrder) {
      case 'price_asc':  return arr.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
      case 'price_desc': return arr.sort((a, b) => (b.minPrice ?? -1) - (a.minPrice ?? -1));
      case 'name_asc':   return arr.sort((a, b) => a.name.localeCompare(b.name));
      default:           return arr;
    }
  }, [filteredProperties, filters.sortOrder]);

  // ── Actions ──────────────────────────────────────────────────

  const handleBookClick = (e: React.MouseEvent, property: PropertyDTO) => {
    e.stopPropagation();
    const needsLogin = requiresLoginForBooking(property.module?.code);
    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
  };


  // ── Table columns ─────────────────────────────────────────────

  const tableColumns: Column<PropertyDTO>[] = [
    {
      key: 'name',
      label: 'Property',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images.length > 0 ? (
            <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">{p.estate?.city || p.address || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'module',
      label: 'Type',
      render: (p) => p.module ? (
        <Badge variant="default" className="text-xs">{p.module.name}</Badge>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (p) => {
        const cat = p.assetType?.category;
        const info = cat ? CATEGORY_LABELS[cat] : null;
        return info ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
            {info.label}
          </span>
        ) : <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      key: 'totalRooms',
      label: 'Rooms',
      sortable: true,
      render: (p) => <span className="text-sm text-gray-700">{p.totalRooms ?? '—'}</span>,
    },
    {
      key: 'minPrice',
      label: 'From',
      sortable: true,
      render: (p) => p.minPrice != null ? (
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.minPrice)}</span>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <button
          onClick={(e) => handleBookClick(e, p)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        >
          <Calendar size={12} />
          Book
        </button>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      {/* ── Sticky header ────────────────────────────────────── */}
      <div className="flex-none z-20">
        {/* Banner */}
        <div className={`relative ${welcomeInfo.gradient} overflow-hidden shadow-md`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-white rounded-full" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 py-2.5">
              {/* Left: identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 ${welcomeInfo.iconBg} rounded-lg shadow-md flex-shrink-0`}>
                  {welcomeInfo.icon}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-sm font-bold text-white leading-none whitespace-nowrap">
                    {welcomeInfo.title}
                  </h1>
                  {user && (
                    <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30 text-white whitespace-nowrap">
                      {ROLE_LABELS[user.role]}
                    </span>
                  )}
                  {user && (
                    <span className="hidden lg:inline text-white/70 text-xs truncate">
                      {user.fullName || user.email}
                    </span>
                  )}
                  {!loading && (
                    <span className="hidden sm:inline text-white/60 text-xs whitespace-nowrap">
                      — {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'}
                      {displayProperties.length < properties.length ? ` of ${properties.length}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* View toggle */}
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 p-0.5 gap-0.5">
                  {VIEW_MODE_OPTIONS.map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      title={label}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === mode
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
                  onClick={() => navigate(ROUTES.BOOKINGS)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white rounded-lg font-medium text-xs transition-all duration-200 whitespace-nowrap"
                >
                  <History size={13} />
                  <span className="hidden sm:inline">My Bookings</span>
                  <ChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Facility stats cards ──────────────────────────── */}
        {!loading && (
          <div className="bg-white border-b border-gray-200/60 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryStatsCard
                  label="All Available"
                  value={properties.length}
                  icon={Building2}
                  gradient="bg-gradient-to-br from-blue-600 to-teal-500"
                  delay={0}
                  subtitle="Published &amp; active"
                  secondaryValue={displayProperties.length}
                  secondaryLabel="Matching"
                />
                <SummaryStatsCard
                  label="Govt Facilities"
                  value={properties.filter(p => p.module?.code === 'GOVT_FAC').length}
                  icon={Shield}
                  gradient="bg-gradient-to-br from-sky-500 to-blue-600"
                  delay={80}
                  subtitle="Government facilities"
                  secondaryValue={properties.filter(p => p.module?.code === 'GOVT_FAC' && p.assetType?.category === 'A').length}
                  secondaryLabel="Cat A"
                />
                <SummaryStatsCard
                  label="Other Facilities"
                  value={properties.filter(p => p.module?.code === 'OTHER_FAC').length}
                  icon={Home}
                  gradient="bg-gradient-to-br from-emerald-500 to-cyan-500"
                  delay={160}
                  subtitle="Open &amp; public facilities"
                />
                <SummaryStatsCard
                  label="Total Rooms"
                  value={properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0)}
                  icon={Users}
                  gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                  delay={240}
                  subtitle="Across all facilities"
                  secondaryValue={properties.length > 0 ? Math.round(properties.reduce((s, p) => s + (p.totalRooms || 0), 0) / properties.length) : 0}
                  secondaryLabel="Avg/facility"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mandatory search bar */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <MandatorySearchBar
              fields={[
                {
                  key: 'search',
                  label: 'Search',
                  type: 'text',
                  placeholder: 'Search by name, location...',
                  value: filters.searchQuery,
                  onChange: (v) => setFilters((prev) => ({ ...prev, searchQuery: v })),
                  icon: <Search size={14} />,
                },
                {
                  key: 'module',
                  label: 'Facility Type',
                  type: 'select',
                  value: filters.moduleFilter,
                  onChange: (v) => setFilters((prev) => ({ ...prev, moduleFilter: v })),
                  options: [
                    { value: 'all', label: 'All Types' },
                    ...availableModules.map((m) => ({ value: m.id, label: m.name })),
                  ],
                },
                {
                  key: 'category',
                  label: 'Category',
                  type: 'chips',
                  value: filters.categoryFilter,
                  onChange: (v) => setFilters((prev) => ({ ...prev, categoryFilter: v })),
                  options: [
                    { value: 'all', label: 'All' },
                    { value: 'A', label: 'Cat A' },
                    { value: 'B', label: 'Cat B' },
                    { value: 'C', label: 'Cat C' },
                  ],
                },
              ]}
              filterCount={[filters.cityFilter !== 'all', filters.sortOrder !== 'top_picks', filters.amenityFilters.length > 0, availableOnly].filter(Boolean).length}
              onFilterOpen={() => setIsFilterOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Advanced filter drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
        activeFilterCount={[filters.cityFilter !== 'all', filters.sortOrder !== 'top_picks', filters.amenityFilters.length > 0, availableOnly].filter(Boolean).length}
        onClearAll={() => {
          setFilters((prev) => ({
            ...prev,
            cityFilter: 'all',
            sortOrder: 'top_picks',
            amenityFilters: [],
            minPriceFilter: priceRange.min,
            maxPriceFilter: priceRange.max,
          }));
          setAvailableOnly(false);
        }}
      >
        <div className="space-y-6">
          {/* Available Only toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                availableOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm font-medium">Show Available Only</span>
              <div className={`w-10 h-5 rounded-full transition-all relative ${availableOnly ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${availableOnly ? 'left-5' : 'left-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Location */}
          {availableCities.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <select
                value={filters.cityFilter}
                onChange={(e) => setFilters((prev) => ({ ...prev, cityFilter: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="all">All Locations</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="space-y-2">
              {[
                { value: 'top_picks', label: 'Top Picks' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
                { value: 'name_asc', label: 'Name A–Z' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilters((prev) => ({ ...prev, sortOrder: value as SortOrder }))}
                  className={`w-full flex items-center px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
                    filters.sortOrder === value
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

      {/* ── Scrollable content area ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          {/* Main property list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : displayProperties.length === 0 ? (
              <FadeIn delay={200}>
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
                  <p className="text-sm text-gray-500">
                    {filters.searchQuery || filters.moduleFilter !== 'all' || filters.categoryFilter !== 'all' || filters.cityFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No properties are available for your access level'}
                  </p>
                </div>
              </FadeIn>
            ) : viewMode === 'table' ? (
              <FadeIn delay={50}>
                <DataTable
                  columns={tableColumns}
                  data={displayProperties}
                  keyExtractor={(p) => p.id}
                  onRowClick={(p) => setModalPropertyId(p.id)}
                  emptyMessage="No properties found"
                />
              </FadeIn>
            ) : viewMode === 'list' ? (
              /* ── Booking.com-style list (all roles) ── */
              <FadeIn delay={50}>
                <div className="space-y-4">
                  {displayProperties.map((property) => (
                    <PropertyListCard
                      key={property.id}
                      property={property}
                      isLoggedIn={!!user}
                      onBookClick={handleBookClick}
                      onCardClick={(p) => setModalPropertyId(p.id)}
                      allAmenities={amenities}
                    />
                  ))}
                </div>
              </FadeIn>
            ) : (
              /* ── Card grid ─────────────────────────────────── */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayProperties.map((property, index) => {
                  const category = property.assetType?.category;
                  const categoryInfo = category ? CATEGORY_LABELS[category] : null;
                  const moduleBadgeText = getModuleBadgeText(property.module?.code);
                  const moduleBadgeStyles = getModuleBadgeStyles(property.module?.code);

                  return (
                    <FadeIn key={property.id} delay={index * 50}>
                      <div
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                        onClick={() => setModalPropertyId(property.id)}
                      >
                        <div className="h-36 relative overflow-hidden bg-gray-100">
                          {property.images.length > 0 ? (
                            <>
                              <ImageCarousel
                                images={property.images}
                                alt={property.name}
                                className="h-36"
                                autoPlay={true}
                                autoPlayInterval={4000}
                              />
                              {property.images.length > 1 && (
                                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-white" />
                                  <span className="text-white text-xs font-medium">{property.images.length}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <Building2 size={48} className="text-gray-300" />
                            </div>
                          )}
                          {categoryInfo && (
                            <div className="absolute top-3 right-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryInfo.color}`}>
                                {categoryInfo.label}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {property.module && (
                              <Badge variant="default" className="text-xs">{property.module.name}</Badge>
                            )}
                            {property.propertyType && (
                              <Badge variant="success" className="text-xs">{property.propertyType.name}</Badge>
                            )}
                            {moduleBadgeText && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${moduleBadgeStyles}`}>
                                {moduleBadgeText}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {property.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                            {property.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{property.estate?.city || property.address}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              {property.minPrice != null && (
                                <p className="text-sm font-semibold text-gray-900">
                                  From {formatCurrency(property.minPrice)}
                                  <span className="text-xs font-normal text-gray-500"> / night</span>
                                </p>
                              )}
                              {property.totalRooms != null && property.totalRooms > 0 && (
                                <p className="text-xs text-gray-500">{property.totalRooms} rooms</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleBookClick(e, property)}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-md"
                            >
                              <Calendar size={14} />
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            )}

            {/* Bottom bookings CTA */}
            {!loading && properties.length > 0 && (
              <FadeIn delay={300}>
                <div className="mt-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <History size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">View Your Bookings</h3>
                      <p className="text-xs text-gray-500">Track your upcoming and past reservations</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(ROUTES.BOOKINGS)}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <History size={16} />
                    My Booking History
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>

      {/* Property detail modal */}
      {modalPropertyId && (
        <PropertyDetailModal
          isOpen={!!modalPropertyId}
          onClose={() => setModalPropertyId(null)}
          propertyId={modalPropertyId}
        />
      )}
    </div>
  );
};
