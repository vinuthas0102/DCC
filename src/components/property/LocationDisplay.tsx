import React from 'react';
import { PropertyDTO } from '../../types';
import { MapPin, Building, Navigation } from 'lucide-react';

interface LocationDisplayProps {
  property: PropertyDTO;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({ property }) => {
  return (
    <div className="space-y-3">
      {property.estate && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Building className="w-4 h-4" />
            <span>Estate</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{property.estate.name}</p>
          <p className="text-sm text-gray-600">
            {property.estate.city}, {property.estate.state} - {property.estate.pincode}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>Address</span>
        </div>
        <p className="text-base text-gray-900">{property.address}</p>
      </div>

      {property.latitude && property.longitude && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Navigation className="w-4 h-4" />
            <span>Coordinates</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Latitude</p>
              <p className="text-sm font-mono text-gray-900">{property.latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Longitude</p>
              <p className="text-sm font-mono text-gray-900">{property.longitude.toFixed(6)}</p>
            </div>
          </div>
        </div>
      )}

      {property.estate && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Estate Contact</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Contact Person:</span>
              <span className="font-medium text-gray-900">{property.estate.contactPerson}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{property.estate.contactEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium text-gray-900">{property.estate.contactPhone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
