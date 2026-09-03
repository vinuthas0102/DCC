import React, { useEffect, useState } from 'react';
import { MapPin, Star, Cross, Plane, Brain as Train, Building2, Utensils } from 'lucide-react';
import { nearbyPlacesService, NearbyPlace, PlaceCategory } from '../../services/nearbyPlacesService';

interface NearbyPlacesPanelProps {
  latitude: number;
  longitude: number;
  onPlaceClick?: (place: NearbyPlace) => void;
}

const CATEGORY_CONFIG: Record<
  PlaceCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  hospital: {
    label: 'Hospitals',
    icon: <Cross size={18} />,
    color: 'text-red-600',
  },
  airport: {
    label: 'Airports',
    icon: <Plane size={18} />,
    color: 'text-blue-600',
  },
  railway_station: {
    label: 'Railway Stations',
    icon: <Train size={18} />,
    color: 'text-green-600',
  },
  government_office: {
    label: 'Government Offices',
    icon: <Building2 size={18} />,
    color: 'text-gray-600',
  },
  restaurant: {
    label: 'Restaurants',
    icon: <Utensils size={18} />,
    color: 'text-orange-600',
  },
};

export const NearbyPlacesPanel: React.FC<NearbyPlacesPanelProps> = ({
  latitude,
  longitude,
  onPlaceClick,
}) => {
  const [places, setPlaces] = useState<Record<PlaceCategory, NearbyPlace[]>>({
    hospital: [],
    airport: [],
    railway_station: [],
    government_office: [],
    restaurant: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<PlaceCategory[]>([
    'hospital',
    'airport',
    'railway_station',
    'government_office',
    'restaurant',
  ]);

  useEffect(() => {
    loadNearbyPlaces();
  }, [latitude, longitude]);

  const loadNearbyPlaces = async () => {
    setLoading(true);
    try {
      const categories: PlaceCategory[] = [
        'hospital',
        'airport',
        'railway_station',
        'government_office',
        'restaurant',
      ];

      const results = await Promise.all(
        categories.map(async (category) => ({
          category,
          places: await nearbyPlacesService.getNearbyPlaces(latitude, longitude, category),
        }))
      );

      const placesMap: Record<PlaceCategory, NearbyPlace[]> = {
        hospital: [],
        airport: [],
        railway_station: [],
        government_office: [],
        restaurant: [],
      };

      results.forEach(({ category, places: categoryPlaces }) => {
        placesMap[category] = categoryPlaces;
      });

      setPlaces(placesMap);
    } catch (error) {
      console.error('Failed to load nearby places:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: PlaceCategory) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Places</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin size={20} className="text-blue-600" />
        Nearby Places
      </h3>

      <div className="space-y-1 mb-4">
        {(Object.keys(CATEGORY_CONFIG) as PlaceCategory[]).map((category) => (
          <label key={category} className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={activeCategories.includes(category)}
              onChange={() => toggleCategory(category)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className={`${CATEGORY_CONFIG[category].color}`}>
              {React.cloneElement(CATEGORY_CONFIG[category].icon as React.ReactElement)}
            </span>
            <span className="text-sm text-gray-700">{CATEGORY_CONFIG[category].label}</span>
            <span className="text-xs text-gray-500">({places[category].length})</span>
          </label>
        ))}
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activeCategories.map((category) => {
          const categoryPlaces = places[category];
          if (categoryPlaces.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className={CATEGORY_CONFIG[category].color}>
                  {React.cloneElement(CATEGORY_CONFIG[category].icon as React.ReactElement)}
                </span>
                {CATEGORY_CONFIG[category].label}
              </h4>
              <div className="space-y-2">
                {categoryPlaces.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => onPlaceClick && onPlaceClick(place)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">{place.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{place.address}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-blue-600 font-medium">
                        {place.distance.toFixed(1)} km away
                      </span>
                      {place.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-gray-600">{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
