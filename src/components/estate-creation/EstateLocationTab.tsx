import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MapPin, Navigation } from 'lucide-react';

interface EstateLocationTabProps {
  formData: {
    address?: string;
    city: string;
    state: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  updateFormData: (updates: any) => void;
  errors?: Record<string, string>;
}

export const EstateLocationTab: React.FC<EstateLocationTabProps> = ({
  formData,
  updateFormData,
  errors = {}
}) => {
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateFormData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide the physical location and address details for this estate.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={formData.address || ''}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="Enter complete address with landmarks..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            placeholder="Enter city"
            error={errors.city}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.state}
            onChange={(e) => updateFormData({ state: e.target.value })}
            placeholder="Enter state"
            error={errors.state}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode
          </label>
          <Input
            value={formData.pincode || ''}
            onChange={(e) => updateFormData({ pincode: e.target.value })}
            placeholder="Enter pincode"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">GPS Coordinates</h4>
            <p className="text-xs text-gray-600 mt-1">Optional but helpful for mapping features</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Get Current Location
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <Input
              type="number"
              step="0.000001"
              value={formData.latitude || ''}
              onChange={(e) => updateFormData({ latitude: parseFloat(e.target.value) || undefined })}
              placeholder="28.6139"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <Input
              type="number"
              step="0.000001"
              value={formData.longitude || ''}
              onChange={(e) => updateFormData({ longitude: parseFloat(e.target.value) || undefined })}
              placeholder="77.2090"
            />
          </div>
        </div>

        {formData.latitude && formData.longitude && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Location Set</p>
              <p className="text-xs text-blue-700 mt-1">
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
