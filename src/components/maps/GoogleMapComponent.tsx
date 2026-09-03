import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { AlertCircle } from 'lucide-react';

interface GoogleMapComponentProps {
  latitude: number;
  longitude: number;
  propertyName?: string;
  propertyAddress?: string;
  height?: string;
  markers?: Array<{
    lat: number;
    lng: number;
    title: string;
    icon?: string;
    color?: string;
    propertyId?: string;
  }>;
  onMarkerClick?: (marker: any) => void;
  enableLocationSearch?: boolean;
  onLocationSearch?: (lat: number, lng: number, address: string) => void;
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  latitude,
  longitude,
  propertyName,
  propertyAddress,
  height = '500px',
  markers = [],
  onMarkerClick,
  enableLocationSearch = false,
  onLocationSearch,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [searchMarker, setSearchMarker] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [map, markers]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      setLoading(true);
      const google = await loadGoogleMaps();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 14,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      const mainMarker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance,
        title: propertyName || 'Property Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      if (propertyName && propertyAddress) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px; color: #111827;">${propertyName}</h3>
              <p style="font-size: 14px; color: #6b7280;">${propertyAddress}</p>
            </div>
          `,
        });

        mainMarker.addListener('click', () => {
          infoWindow.open(mapInstance, mainMarker);
        });
      }

      setMap(mapInstance);
      setError(null);

      if (enableLocationSearch && searchInputRef.current) {
        const searchBox = new google.maps.places.SearchBox(searchInputRef.current);

        mapInstance.addListener('bounds_changed', () => {
          searchBox.setBounds(mapInstance.getBounds() as google.maps.LatLngBounds);
        });

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();

          if (!places || places.length === 0) return;

          const place = places[0];

          if (!place.geometry || !place.geometry.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          if (searchMarker) {
            searchMarker.setMap(null);
          }

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            title: place.formatted_address || 'Search Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });

          setSearchMarker(marker);

          mapInstance.setCenter({ lat, lng });
          mapInstance.setZoom(13);

          if (onLocationSearch) {
            onLocationSearch(lat, lng, place.formatted_address || '');
          }
        });
      }
    } catch (err: any) {
      console.error('Failed to load Google Maps:', err);
      setError(err.message || 'Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkers = async () => {
    if (!map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const google = await loadGoogleMaps();

    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: map,
        title: markerData.title,
        icon: markerData.icon
          ? {
              url: markerData.icon,
              scaledSize: new google.maps.Size(30, 30),
            }
          : {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: markerData.color || '#10b981',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
      });

      if (onMarkerClick) {
        marker.addListener('click', () => onMarkerClick(markerData));
      }

      markersRef.current.push(marker);
    });
  };

  if (error) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-600"
        style={{ height }}
      >
        <AlertCircle size={48} className="mb-3 text-gray-400" />
        <p className="text-sm font-medium">Map Unavailable</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
        <p className="text-xs text-gray-500 mt-3">
          Configure VITE_GOOGLE_MAPS_API_KEY in .env to enable maps
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {enableLocationSearch && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-md px-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs text-gray-600">
            Search for a location to find nearby properties
          </div>
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
