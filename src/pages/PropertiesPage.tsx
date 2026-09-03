import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, MapPin, Calendar, Camera, CheckCircle, Clock, Layers, Search, Navigation, X, Home, ChevronRight, ExternalLink, Images, Bed, Users, Wifi, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { DataTable } from '../components/ui/DataTable';
import { PropertyListCard } from '../components/property/PropertyListCard';
import { PhotoLightbox } from '../components/ui/PhotoGallery';
import SplitLayout from '../components/ui/SplitLayout';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { canManageProperties } from '../utils/permissions';
import { SkeletonCard } from '../components/ui/Loading';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { PropertyDetailModal } from '../components/property/PropertyDetailModal';
import { PropertyDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { FadeIn } from '../components/animations/FadeIn';
import { requiresLoginForBooking, getBookingButtonText, getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';
import { useViewPreference } from '../hooks/useViewPreference';

export const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { properties, loading, fetchProperties, amenities, fetchAmenities } = usePropertyStore();
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useViewPreference('propertiesView', 'list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'name_asc' | 'newest'>('default');
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [proximityCenter, setProximityCenter] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [proximityRadiusKm, setProximityRadiusKm] = useState(10);
  const [proximityLoading, setProximityLoading] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchAmenities();
  }, []);

  const canManage = user && canManageProperties(user.role);

  const handleCardClick = (property: PropertyDTO) => {
    // On desktop: open split panel. Modal fallback kept for table actions.
    setSelectedProperty(property);
    setSelectedPropertyId(property.id);
  };

  const handleClosePanel = () => {
    setSelectedProperty(null);
    setSelectedPropertyId(null);
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPropertyId(null);
  };

  const handleBookingClick = (e: React.MouseEvent, property: PropertyDTO) => {
    e.stopPropagation();
    const moduleCode = property.module?.code;
    const needsLogin = requiresLoginForBooking(moduleCode);

    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
  };

  const availableModules = useMemo(() => (
    [...new Map(properties.filter(p => p.module).map(p => [p.module!.id, p.module!])).values()]
  ), [properties]);

  const availableCities = useMemo(() => (
    [...new Set(properties.map(p => p.estate?.city).filter(Boolean) as string[])].sort()
  ), [properties]);

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { return; }
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
      },
      () => setProximityLoading(false)
    );
  };

  const AMENITY_OPTIONS = ['Swimming Pool', 'Lounge', 'Bath Tub', 'Garden View', 'Mountain View', 'Living Room'];

  const drawerActiveCount = (moduleFilter !== 'all' ? 1 : 0) + (cityFilter !== 'all' ? 1 : 0) + (sortOrder !== 'default' ? 1 : 0) + (amenityFilters.length > 0 ? amenityFilters.length : 0) + (proximityEnabled && proximityCenter ? 1 : 0);

  const filteredProperties = useMemo(() => {
    let result = properties.filter((property) => {
      const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
      const matchesSearch = !searchQuery ||
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.estate?.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = moduleFilter === 'all' || property.module?.id === moduleFilter;
      const matchesCity = cityFilter === 'all' || property.estate?.city === cityFilter;
      const matchesAmenities = amenityFilters.length === 0 ||
        amenityFilters.every(a => property.amenities?.includes(a));
      const matchesProximity = !proximityEnabled || !proximityCenter ||
        (property.latitude != null && property.longitude != null &&
          haversineKm(proximityCenter.lat, proximityCenter.lng, property.latitude, property.longitude) <= proximityRadiusKm);
      return matchesStatus && matchesSearch && matchesModule && matchesCity && matchesAmenities && matchesProximity;
    });
    if (sortOrder === 'name_asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [properties, filterStatus, searchQuery, moduleFilter, cityFilter, sortOrder, amenityFilters, proximityEnabled, proximityCenter, proximityRadiusKm]);

  const stats = {
    total: properties.length,
    published: properties.filter((p) => p.status === 'PUBLISHED').length,
    draft: properties.filter((p) => p.status === 'DRAFT').length,
    totalRooms: properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0),
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setModuleFilter('all');
    setCityFilter('all');
    setSortOrder('default');
    setAmenityFilters([]);
    setProximityEnabled(false);
    setProximityCenter(null);
  };

  const filterStatusLabel = filterStatus === 'all' ? null : filterStatus === 'PUBLISHED' ? 'Published' : 'Draft';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-green-50/20">

      {/* Frozen hero header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
            <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-blue-600 transition-colors"><Home size={11} /></button>
            <ChevronRight size={10} />
            <button onClick={() => navigate(ROUTES.DASHBOARD)} className="text-gray-500 hover:text-blue-600 transition-colors">My Workspace</button>
            <ChevronRight size={10} />
            <button
              onClick={() => { handleClosePanel(); setFilterStatus('all'); }}
              className="text-gray-600 font-medium hover:text-blue-600 transition-colors"
            >
              Properties
            </button>
            {filterStatusLabel && (
              <>
                <ChevronRight size={10} />
                <button
                  onClick={() => handleClosePanel()}
                  className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
                >
                  {filterStatusLabel}
                </button>
              </>
            )}
            {selectedProperty && (
              <>
                <ChevronRight size={10} />
                <span className="text-gray-700 font-medium truncate max-w-[160px]">{selectedProperty.name}</span>
              </>
            )}
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-0.5 flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                Property Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              {canManage && (
                <Button onClick={() => navigate(ROUTES.PROPERTY_CREATE)} icon={<Plus size={18} />} size="sm">
                  New Property
                </Button>
              )}
            </div>
          </div>

          {/* Mandatory search bar */}
          <MandatorySearchBar
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Property name or location...',
                value: searchQuery,
                onChange: setSearchQuery,
                icon: <Search size={14} />,
              },
              {
                key: 'status',
                label: 'Status',
                type: 'chips',
                value: filterStatus,
                onChange: setFilterStatus,
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'DRAFT', label: 'Draft' },
                ],
              },
            ]}
            filterCount={drawerActiveCount}
            onFilterOpen={() => setIsFilterOpen(true)}
            className="mb-3"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryStatsCard
              label="Total Properties"
              value={stats.total}
              icon={Building2}
              gradient="bg-gradient-to-r from-blue-600 to-teal-500"
              onClick={() => setFilterStatus('all')}
              isActive={filterStatus === 'all'}
              delay={100}
              subtitle="All facilities"
              secondaryValue={stats.published}
              secondaryLabel="Live"
            />
            <SummaryStatsCard
              label="Published"
              value={stats.published}
              icon={CheckCircle}
              gradient="bg-gradient-to-r from-emerald-500 to-cyan-500"
              onClick={() => setFilterStatus('PUBLISHED')}
              isActive={filterStatus === 'PUBLISHED'}
              delay={150}
              subtitle="Active & bookable"
              trend={stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}
            />
            <SummaryStatsCard
              label="Draft"
              value={stats.draft}
              icon={Clock}
              gradient="bg-gradient-to-r from-amber-500 to-orange-500"
              onClick={() => setFilterStatus('DRAFT')}
              isActive={filterStatus === 'DRAFT'}
              delay={200}
              subtitle="Pending publish"
              secondaryValue={stats.total > 0 ? Math.round((stats.draft / stats.total) * 100) : 0}
              secondaryLabel="%"
            />
            <SummaryStatsCard
              label="Total Rooms"
              value={stats.totalRooms}
              icon={Layers}
              gradient="bg-gradient-to-r from-sky-500 to-blue-600"
              delay={250}
              subtitle="Across all properties"
              secondaryValue={stats.total > 0 ? Math.round(stats.totalRooms / stats.total) : 0}
              secondaryLabel="Avg/prop"
            />
          </div>
        </div>
      </div>

      {/* Optional advanced filter drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
        activeFilterCount={drawerActiveCount}
        onClearAll={() => { setModuleFilter('all'); setCityFilter('all'); setSortOrder('default'); setAmenityFilters([]); setProximityEnabled(false); setProximityCenter(null); }}
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

          {availableModules.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Facility Type</label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="all">All Types</option>
                {availableModules.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {availableCities.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="all">All Locations</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Amenities ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => setAmenityFilters(prev =>
                    prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
                  )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    amenityFilters.includes(amenity)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
            {amenityFilters.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">Showing properties with ALL selected amenities</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="space-y-2">
              {[
                { value: 'default', label: 'Default' },
                { value: 'name_asc', label: 'Name A–Z' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortOrder(value as typeof sortOrder)}
                  className={`w-full flex items-center px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
                    sortOrder === value
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

      {/* Split-screen data area */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 py-4">
        <SplitLayout
          storageKey="propSplit"
          defaultSplit={65}
          minLeft={40}
          maxLeft={80}
          onClose={() => setSelectedProperty(null)}
          right={selectedProperty != null ? (
            <div className="flex flex-col">
              {/* Image tiles */}
              <div className="flex-none px-5 pt-4">
                {selectedProperty.images.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedProperty.images.slice(0, 5).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => { setLightboxImages(selectedProperty.images); setLightboxIndex(i); setLightboxOpen(true); }}
                        className="relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-all hover:shadow-md group"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        {i === 4 && selectedProperty.images.length > 5 && (
                          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-0.5">
                            <Images size={14} className="text-white" />
                            <span className="text-white text-xs font-bold">+{selectedProperty.images.length - 5}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <Building2 size={28} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Property info */}
              <div className="flex-1 px-5 py-4 space-y-4">
                {/* Name + location */}
                <div>
                  <div className="text-xs text-gray-400 truncate">{selectedProperty.estate?.name || selectedProperty.address}</div>
                  <h2 className="text-base font-bold text-gray-900 truncate">{selectedProperty.name}</h2>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={selectedProperty.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">{selectedProperty.status}</Badge>
                  {selectedProperty.module && <Badge variant="default" className="text-xs">{selectedProperty.module.name}</Badge>}
                  {selectedProperty.propertyType && <Badge variant="success" className="text-xs">{selectedProperty.propertyType.name}</Badge>}
                  {getModuleBadgeText(selectedProperty.module?.code) && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getModuleBadgeStyles(selectedProperty.module?.code)}`}>
                      {getModuleBadgeText(selectedProperty.module?.code)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {selectedProperty.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedProperty.description}</p>
                )}

                {/* Key specs grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: <MapPin size={13} />, label: 'Location', value: selectedProperty.estate?.city || selectedProperty.address || '—', color: 'text-blue-500' },
                    { icon: <Layers size={13} />, label: 'Total Rooms', value: selectedProperty.totalRooms ? `${selectedProperty.totalRooms} rooms` : '—', color: 'text-teal-500' },
                    { icon: <Building2 size={13} />, label: 'Estate', value: selectedProperty.estate?.name || '—', color: 'text-gray-500' },
                    { icon: <Calendar size={13} />, label: 'Bookable', value: requiresLoginForBooking(selectedProperty.module?.code) ? 'Login required' : 'Open booking', color: 'text-green-500' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100">
                      <div className={`flex items-center gap-1.5 ${item.color} mb-1`}>
                        {item.icon}
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{item.label}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-800 truncate">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Amenities */}
                {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProperty.amenities.map((a: string) => (
                        <span key={a} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={(e) => handleBookingClick(e as any, selectedProperty)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Calendar size={15} />
                    {requiresLoginForBooking(selectedProperty.module?.code) && !user ? 'Login to Book' : 'Book Now'}
                  </button>
                  <button
                    onClick={() => navigate(`/properties/${selectedProperty.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    <ExternalLink size={14} />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          left={
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredProperties.length === 0 ? (
              <FadeIn delay={300}>
                <div className="pastel-lavender-gradient rounded-xl p-12 text-center">
                  <Building2 className="mx-auto text-gray-400 mb-4 animate-pulse-slow" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-600 mb-6">{properties.length === 0 ? 'Create your first property to get started' : 'Try adjusting your filters'}</p>
                  {canManage && properties.length === 0 && (
                    <Button onClick={() => navigate('/properties/create')}>Create Property</Button>
                  )}
                </div>
              </FadeIn>
            ) : viewMode === 'card' ? (
              <div className={`grid gap-4 ${selectedProperty ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {filteredProperties.map((property, index) => {
                  const getGradientClass = () => {
                    if (property.status === 'PUBLISHED') return 'pastel-green-gradient';
                    if (property.status === 'DRAFT') return 'pastel-yellow-gradient';
                    return 'pastel-blue-gradient';
                  };
                  const isSelected = selectedProperty?.id === property.id;
                  return (
                    <FadeIn key={property.id} delay={index * 60}>
                      <div
                        onClick={() => handleCardClick(property)}
                        className={`${getGradientClass()} rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : 'hover:shadow-md'}`}
                      >
                        <div className="h-36 relative overflow-hidden">
                          {property.images.length > 0 ? (
                            <>
                              <ImageCarousel images={property.images} alt={property.name} className="h-36" autoPlay={true} autoPlayInterval={3000} />
                              {property.images.length > 1 && (
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-white" />
                                  <span className="text-white text-xs font-medium">{property.images.length}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className={`${getGradientClass()} flex items-center justify-center h-full`}>
                              <Building2 size={40} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                              {property.status}
                            </Badge>
                          </div>
                          <button
                            onClick={(e) => handleBookingClick(e, property)}
                            className="absolute bottom-2 right-2 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-2.5 py-1.5 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-1.5 text-xs font-medium"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{requiresLoginForBooking(property.module?.code) && !user ? 'Login' : 'Book'}</span>
                          </button>
                        </div>
                        <div className="p-3 bg-white">
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {property.module && <Badge variant="default" className="text-xs">{property.module.name}</Badge>}
                            {property.propertyType && <Badge variant="success" className="text-xs">{property.propertyType.name}</Badge>}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{property.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{property.estate?.city || property.address}</span>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            ) : viewMode === 'table' ? (
              <FadeIn delay={300}>
                <DataTable
                  columns={[
                    { key: 'name', label: 'Property Name', sortable: true, width: '25%' },
                    { key: 'module', label: 'Module', sortable: false, render: (p) => p.module?.name || 'N/A' },
                    { key: 'propertyType', label: 'Type', sortable: false, render: (p) => p.propertyType?.name || 'N/A' },
                    { key: 'location', label: 'Location', sortable: false, render: (p) => p.estate?.city || p.address || 'N/A' },
                    { key: 'totalRooms', label: 'Rooms', sortable: true, render: (p) => p.totalRooms || 0 },
                    {
                      key: 'status', label: 'Status', sortable: true,
                      render: (p) => <Badge variant={p.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">{p.status}</Badge>,
                    },
                    {
                      key: 'actions', label: 'Actions', sortable: false, width: '15%',
                      render: (p) => (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/properties/${p.id}`); }}>View</Button>
                          <Button size="sm" onClick={(e) => handleBookingClick(e as any, p)}>Book</Button>
                        </div>
                      ),
                    },
                  ]}
                  data={filteredProperties}
                  keyExtractor={(p) => p.id}
                  onRowClick={(p) => handleCardClick(p)}
                  emptyMessage="No properties found"
                />
              </FadeIn>
            ) : (
              <FadeIn delay={300}>
                <div className="space-y-3">
                  {filteredProperties.map((property) => {
                    const isSelected = selectedProperty?.id === property.id;
                    return (
                      <div
                        key={property.id}
                        onClick={() => handleCardClick(property)}
                        className={`cursor-pointer rounded-xl transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : 'hover:shadow-md'}`}
                      >
                        <PropertyListCard
                          property={property}
                          isLoggedIn={!!user}
                          onBookClick={handleBookingClick}
                          allAmenities={amenities}
                        />
                      </div>
                    );
                  })}
                </div>
              </FadeIn>
            )}
          </div>
          }
        />
      </div>

      {lightboxOpen && (
        <PhotoLightbox images={lightboxImages} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
};
