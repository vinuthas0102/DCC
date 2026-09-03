import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { RegionDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { FormLoadingSkeleton } from '../ui/LoadingSkeleton';

interface EstateBasicInfoTabProps {
  formData: {
    regionId: string;
    name: string;
    code: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive?: boolean;
  };
  updateFormData: (updates: any) => void;
  errors?: Record<string, string>;
  isEditMode?: boolean;
}

export const EstateBasicInfoTab: React.FC<EstateBasicInfoTabProps> = ({
  formData,
  updateFormData,
  errors = {},
  isEditMode = false
}) => {
  const [regions, setRegions] = useState<RegionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRegions();
  }, []);

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

  if (loading) {
    return <FormLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide the essential details for this estate. Estates are groups of properties like apartments, commercial buildings, etc.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={loadRegions}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estate Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Enter estate name"
            error={errors.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estate Code <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.code}
            onChange={(e) => updateFormData({ code: e.target.value })}
            placeholder="Enter estate code"
            error={errors.code}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Region <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.regionId}
          onChange={(e) => updateFormData({ regionId: e.target.value })}
          error={errors.regionId}
          disabled={loading}
        >
          <option value="">Select region...</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name} ({region.code})
            </option>
          ))}
        </Select>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Person
            </label>
            <Input
              value={formData.contactPerson || ''}
              onChange={(e) => updateFormData({ contactPerson: e.target.value })}
              placeholder="Enter contact person"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <Input
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => updateFormData({ contactEmail: e.target.value })}
              placeholder="Enter contact email"
              error={errors.contactEmail}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <Input
              value={formData.contactPhone || ''}
              onChange={(e) => updateFormData({ contactPhone: e.target.value })}
              placeholder="Enter contact phone"
            />
          </div>
        </div>
      </div>

      {isEditMode && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-2">
            <Toggle
              checked={formData.isActive || false}
              onChange={(checked) => updateFormData({ isActive: checked })}
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>
      )}
    </div>
  );
};
