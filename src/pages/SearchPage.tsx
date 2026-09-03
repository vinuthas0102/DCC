import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, Building2, Map, List, Navigation, X, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { useSearchStore } from '../stores/searchStore';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { SkeletonCard } from '../components/ui/Loading';
import { MapSearchView } from '../components/search/MapSearchView';
import { requiresLoginForBooking } from '../utils/moduleHelpers';
import { ROUTES } from '../constants/routes';
import { PropertyListCard } from '../components/property/PropertyListCard';
import { PropertyDTO } from '../types';
import { PropertyDetailModal } from '../components/property/PropertyDetailModal';
import SplitLayout from '../components/ui/SplitLayout';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { results, loading, setFilters, search } = useSearchStore();
  const { modules, propertyTypes, roomTypes, amenities, fetchModules, fetchPropertyTypes, fetchRoomTypes, fetchAmenities } = usePropertyStore();

  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [propertyTypeId, setPropertyTypeId] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [proximityCenter, setProximityCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [proximityRadiusKm, setProximityRadiusKm] = useState(10);
  const [proximityLoading, setProximityLoading] = useState(false);

  const AMENITY_OPTIONS = ['Swimming Pool', 'Lounge', 'Bath Tub', 'Garden View', 'Mountain View', 'Living Room'];

  useEffect(() => {
    fetchModules();
    fetchRoomTypes();
    fetchAmenities();
  }, []);

  useEffect(() => {
    if (moduleId) {
      fetchPropertyTypes(moduleId);
      setPropertyTypeId('');
    } else {
      fetchPropertyTypes();
    }
  }, [moduleId]);

  useEffect(() => {
    const urlLocation = searchParams.get('location');
    const urlCheckIn = searchParams.get('checkIn');
    const urlCheckOut = searchParams.get('checkOut');
    const urlFacilityType = searchParams.get('facilityType');

    if ((urlLocation || urlCheckIn || urlCheckOut || urlFacilityType) && !hasAutoSearched) {
      if (urlLocation) setLocation(urlLocation);
      if (urlCheckIn) setCheckIn(urlCheckIn);
      if (urlCheckOut) setCheckOut(urlCheckOut);

      setFilters({
        location: urlLocation || '',
        checkInDate: urlCheckIn || '',
        checkOutDate: urlCheckOut || '',
        moduleId: '',
        propertyTypeId: '',
        roomTypeId: '',
      });

      search();
      setHasAutoSearched(true);
    }
  }, [searchParams, hasAutoSearched]);

  const handleSearch = () => {
    setFilters({
      location,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      moduleId,
      propertyTypeId,
      roomTypeId,
      amenities: amenityFilters.length > 0 ? amenityFilters : undefined,
      latitude: proximityCenter ? proximityCenter.lat : undefined,
      longitude: proximityCenter ? proximityCenter.lng : undefined,
      radius: proximityCenter ? proximityRadiusKm : undefined,
    });
    search();
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setProximityLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProximityCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setProximityLoading(false);
      },
      () => setProximityLoading(false)
    );
  };

  const handleBookNow = (e: React.MouseEvent, property: PropertyDTO) => {
    e.stopPropagation();
    const moduleCode = property.module?.code;
    const needsLogin = requiresLoginForBooking(moduleCode);
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('tab', 'booking');
    const queryString = params.toString();
    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?${queryString}`);
      return;
    }
    navigate(`/properties/${property.id}?${queryString}`);
  };

  const optionalFilterCount = (moduleId ? 1 : 0) + (propertyTypeId ? 1 : 0) + (roomTypeId ? 1 : 0) + amenityFilters.length + (proximityCenter ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blue-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-1 animate-fadeIn">Find Your Perfect Facility</h1>
          <p className="text-sm text-blue-100 mb-5 animate-slideUp">
            Search from thousands of available properties across the region
          </p>

          {/* Mandatory search bar */}
          <MandatorySearchBar
            fields={[
              {
                key: 'location',
                label: 'Location',
                type: 'text',
                placeholder: 'City, property name or area...',
                value: location,
                onChange: setLocation,
                icon: <MapPin size={14} />,
              },
              {
                key: 'checkin',
                label: 'Check-in',
                type: 'date',
                value: checkIn,
                onChange: setCheckIn,
              },
              {
                key: 'checkout',
                label: 'Check-out',
                type: 'date',
                value: checkOut,
                onChange: setCheckOut,
              },
            ]}
            onSearch={handleSearch}
            searchLabel="Search"
            filterCount={optionalFilterCount}
            onFilterOpen={() => setIsFilterOpen(true)}
          />
        </div>
      </div>

      {/* Optional filter drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
        activeFilterCount={optionalFilterCount}
        onClearAll={() => {
          setModuleId('');
          setPropertyTypeId('');
          setRoomTypeId('');
          setAmenityFilters([]);
          setProximityCenter(null);
        }}
      >
        <div className="space-y-6">

          {/* Proximity Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-blue-500" /> Proximity Search
            </label>
            <div className={`rounded-xl border p-4 transition-all ${proximityCenter ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin size={12} className="text-blue-500 flex-shrink-0" />
                      <span>Location set</span>
                    </div>
                    <button
                      onClick={() => setProximityCenter(null)}
                      className="text-gray-400 hover:text-gray-600"
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
                  <p className="text-xs text-blue-600 font-medium">Click Search to apply</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Facility Type</label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              <option value="">All Facility Types</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
            <select
              value={propertyTypeId}
              onChange={(e) => setPropertyTypeId(e.target.value)}
              disabled={!moduleId && propertyTypes.length === 0}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{moduleId ? 'All Property Types' : 'Select facility type first'}</option>
              {propertyTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              <option value="">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>

          {/* Amenities */}
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
              <p className="text-xs text-gray-400 mt-2">Showing properties with ALL selected amenities · Click Search to apply</p>
            )}
          </div>
        </div>
      </FilterDrawer>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col" style={{ minHeight: '60vh' }}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or use More Filters</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {results.length} {results.length === 1 ? 'Property' : 'Properties'} Found
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <List size={15} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Map size={15} />
                  <span>Map</span>
                </button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <MapSearchView properties={results} checkIn={checkIn} checkOut={checkOut} />
            ) : (
              <div style={{ height: '70vh' }}>
                <SplitLayout
                  storageKey="searchSplit"
                  defaultSplit={55}
                  minLeft={35}
                  maxLeft={75}
                  onClose={() => setSelectedPropertyId(null)}
                  right={selectedPropertyId ? (
                    <PropertyDetailModal
                      isOpen={true}
                      onClose={() => setSelectedPropertyId(null)}
                      propertyId={selectedPropertyId}
                      inline
                    />
                  ) : null}
                  left={
                    <div className="space-y-4 pr-1 overflow-y-auto h-full">
                      {results.map((property) => (
                        <PropertyListCard
                          key={property.id}
                          property={property}
                          checkIn={checkIn}
                          checkOut={checkOut}
                          isLoggedIn={!!user}
                          onBookClick={handleBookNow}
                          onCardClick={(p) => setSelectedPropertyId(p.id)}
                          allAmenities={amenities}
                          isSelected={selectedPropertyId === property.id}
                        />
                      ))}
                    </div>
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
