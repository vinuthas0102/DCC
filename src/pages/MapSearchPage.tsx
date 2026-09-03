import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { PropertyDTO } from '../types';
import { locationSearchService } from '../services/locationSearchService';
import { propertyService } from '../services/propertyService';
import { usePropertyStore } from '../stores/propertyStore';
import { Building2, MapPin, Calendar, Navigation, SlidersHorizontal } from 'lucide-react';
import { AvailabilityCalendarModal } from '../components/availability/AvailabilityCalendarModal';

const AMENITY_OPTIONS = ['Swimming Pool', 'Lounge', 'Bath Tub', 'Garden View', 'Mountain View', 'Living Room'];

export const MapSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { modules, propertyTypes, fetchModules, fetchPropertyTypes } = usePropertyStore();
  const [_properties, setProperties] = useState<PropertyDTO[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyDTO[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarProperty, setCalendarProperty] = useState<PropertyDTO | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);

  const defaultLat = parseFloat(searchParams.get('lat') || '28.6139');
  const defaultLng = parseFloat(searchParams.get('lng') || '77.209');

  useEffect(() => {
    loadAllProperties();
    fetchModules();
  }, []);

  useEffect(() => {
    if (moduleFilter) {
      fetchPropertyTypes(moduleFilter);
      setPropertyTypeFilter('');
    } else {
      fetchPropertyTypes();
    }
  }, [moduleFilter]);

  useEffect(() => {
    if (searchLocation) {
      handleLocationSearch(searchLocation.lat, searchLocation.lng);
    }
  }, [searchLocation, radiusKm, moduleFilter, propertyTypeFilter]);

  const loadAllProperties = async () => {
    try {
      setLoading(true);
      const allProperties = await propertyService.getProperties({ status: 'ACTIVE' });
      const propertiesWithCoords = allProperties.filter(p => p.latitude && p.longitude);
      setProperties(propertiesWithCoords);
      setFilteredProperties(propertiesWithCoords);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const nearbyProperties = await locationSearchService.searchPropertiesByLocation({
        latitude: lat,
        longitude: lng,
        radiusKm,
        moduleId: moduleFilter || undefined,
        propertyTypeId: propertyTypeFilter || undefined,
      });
      setFilteredProperties(nearbyProperties);
    } catch (error) {
      console.error('Failed to search properties by location:', error);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSearchLocation({ lat, lng, address: 'Your Location' });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const displayProperties = useMemo(() => {
    if (amenityFilters.length === 0) return filteredProperties;
    return filteredProperties.filter(p =>
      amenityFilters.every(a => p.amenities?.includes(a))
    );
  }, [filteredProperties, amenityFilters]);

  const drawerActiveCount = (moduleFilter ? 1 : 0) + (propertyTypeFilter ? 1 : 0) + amenityFilters.length;

  const centerLat = searchLocation?.lat || defaultLat;
  const centerLng = searchLocation?.lng || defaultLng;

  const markers = displayProperties.map((p) => ({
    lat: parseFloat(p.latitude as any),
    lng: parseFloat(p.longitude as any),
    title: p.name,
    propertyId: p.id,
    color: '#2563eb',
  }));

  const handleMarkerClick = (marker: any) => {
    const property = displayProperties.find((p) => p.id === marker.propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };

  const handleViewCalendar = (property: PropertyDTO) => {
    setCalendarProperty(property);
    setShowCalendarModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Map Search</h1>
          <p className="text-gray-600">Find properties by location</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Button
            onClick={handleUseMyLocation}
            icon={<Navigation size={18} />}
            variant="outline"
          >
            Use My Location
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Search Radius:</span>
            <Select
              value={radiusKm.toString()}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </Select>
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              drawerActiveCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {drawerActiveCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {drawerActiveCount}
              </span>
            )}
          </button>

          <Badge className="bg-blue-100 text-blue-800">
            {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'} found
          </Badge>
        </div>

        {/* Advanced filter drawer */}
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          title="Map Filters"
          activeFilterCount={drawerActiveCount}
          onClearAll={() => { setModuleFilter(''); setPropertyTypeFilter(''); setAmenityFilters([]); }}
        >
          <div className="space-y-6">
            {modules.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Facility Type</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="">All Facility Types</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {propertyTypes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                <select
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  disabled={!moduleFilter}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{moduleFilter ? 'All Property Types' : 'Select facility type first'}</option>
                  {propertyTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
              </div>
            )}

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
          </div>
        </FilterDrawer>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GoogleMapComponent
              latitude={centerLat}
              longitude={centerLng}
              height="700px"
              markers={markers}
              onMarkerClick={handleMarkerClick}
              enableLocationSearch={true}
              onLocationSearch={(lat, lng, address) => {
                setSearchLocation({ lat, lng, address });
              }}
            />
          </div>

          <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
                <p className="mt-4 text-gray-600">Loading properties...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No properties found in this area</p>
                  <p className="text-sm text-gray-500 mt-2">Try increasing the search radius</p>
                </div>
              </Card>
            ) : selectedProperty ? (
              <Card className="sticky top-4">
                <div className="h-40 bg-gradient-to-br from-blue-400 to-teal-400 relative overflow-hidden">
                  {selectedProperty.images.length > 0 ? (
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 size={48} className="text-white opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedProperty.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {selectedProperty.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin size={16} />
                    <span>{selectedProperty.estate?.city || selectedProperty.address}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      icon={<Calendar size={16} />}
                      onClick={() => handleViewCalendar(selectedProperty)}
                    >
                      Check Calendar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/properties/${selectedProperty.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Click a marker to view property details</p>
                </div>
              </Card>
            )}

            {!selectedProperty && displayProperties.length > 0 && (
              <div className="space-y-3">
                {displayProperties.slice(0, 10).map((property) => (
                  <Card
                    key={property.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{property.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{property.estate?.city}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {calendarProperty && (
        <AvailabilityCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          property={calendarProperty}
          onDateSelect={(date) => {
            navigate(`/properties/${calendarProperty.id}?checkIn=${date}`);
          }}
        />
      )}
    </div>
  );
};
