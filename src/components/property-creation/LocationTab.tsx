import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { propertyService } from '../../services/propertyService';
import { RegionDTO, EstateDTO } from '../../types';
import { MapPin, Navigation } from 'lucide-react';
import { FormLoadingSkeleton } from '../ui/LoadingSkeleton';

interface LocationTabProps {
  formData: {
    estateId: string | null;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  updateFormData: (updates: any) => void;
}

export const LocationTab: React.FC<LocationTabProps> = ({ formData, updateFormData }) => {
  const [regions, setRegions] = useState<RegionDTO[]>([]);
  const [estates, setEstates] = useState<EstateDTO[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      loadEstates(selectedRegion);
    }
  }, [selectedRegion]);

  const loadRegions = async () => {
    try {
      setError('');
      const data = await propertyService.getRegions();
      setRegions(data);
    } catch (error: any) {
      console.error('Failed to load regions:', error);
      setError(error.message || 'Failed to load regions. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadEstates = async (regionId: string) => {
    try {
      setError('');
      const data = await propertyService.getEstates(regionId);
      setEstates(data);
    } catch (error: any) {
      console.error('Failed to load estates:', error);
      setError(error.message || 'Failed to load estates. Please try again.');
    }
  };

  const handleEstateChange = (estateId: string) => {
    const sanitizedEstateId = estateId || null;
    updateFormData({ estateId: sanitizedEstateId });
    const selectedEstate = estates.find((e) => e.id === estateId);
    if (selectedEstate) {
      updateFormData({ address: selectedEstate.address });
    }
  };

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

  if (loading) {
    return <FormLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
        <p className="text-sm text-gray-600 mb-6">
          Specify the property's physical location. Optionally, you can associate it with an estate in the organizational hierarchy.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => selectedRegion ? loadEstates(selectedRegion) : loadRegions()}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Region
        </label>
        <Select
          value={selectedRegion}
          onChange={(e) => {
            setSelectedRegion(e.target.value);
            updateFormData({ estateId: null });
          }}
          disabled={loading}
        >
          <option value="">No region (standalone property)</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name} ({region.code})
            </option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Select a region if this property belongs to an organizational estate structure
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estate
        </label>
        <Select
          value={formData.estateId || ''}
          onChange={(e) => handleEstateChange(e.target.value)}
          disabled={!selectedRegion || estates.length === 0}
        >
          <option value="">No estate (standalone property)</option>
          {estates.map((estate) => (
            <option key={estate.id} value={estate.id}>
              {estate.name} ({estate.code}) - {estate.city}
            </option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Leave empty for independent properties not part of an estate
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Physical Address *
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="Enter complete address with landmarks..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">GPS Coordinates</h4>
            <p className="text-xs text-gray-600 mt-1">Optional but helpful for mapping features</p>
          </div>
          <Button
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
