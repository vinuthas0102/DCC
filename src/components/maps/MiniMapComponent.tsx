import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { MapPin } from 'lucide-react';

interface MiniMapComponentProps {
  latitude: number;
  longitude: number;
  label?: string;
  height?: string;
}

export const MiniMapComponent: React.FC<MiniMapComponentProps> = ({
  latitude,
  longitude,
  label,
  height = '180px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!mapRef.current) return;
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 12,
          disableDefaultUI: true,
          gestureHandling: 'none',
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });

        new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstance,
          title: label || 'Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  if (error) {
    return (
      <div
        className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex flex-col items-center justify-center gap-2"
        style={{ height }}
      >
        <MapPin size={28} className="text-gray-400" />
        <span className="text-xs text-gray-400">Map unavailable</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 relative" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      {label && !loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 pointer-events-none">
          <div className="flex items-center gap-1.5 text-white text-xs font-medium">
            <MapPin size={12} />
            <span className="truncate">{label}</span>
          </div>
        </div>
      )}
    </div>
  );
};
