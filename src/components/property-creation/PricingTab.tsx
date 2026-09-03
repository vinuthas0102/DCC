import React, { useEffect, useState } from 'react';
import { propertyService } from '../../services/propertyService';
import { AmenityDTO } from '../../types';
import { DollarSign } from 'lucide-react';

interface PricingTabProps {
  formData: {
    amenities: string[];
    rooms: Array<{ roomNumber: string; roomTypeId: string | null; basePrice: number }>;
  };
  updateFormData: (updates: any) => void;
}

export const PricingTab: React.FC<PricingTabProps> = ({ formData, updateFormData }) => {
  const [amenities, setAmenities] = useState<AmenityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      setError('');
      const data = await propertyService.getAmenities();
      setAmenities(data);
    } catch (error: any) {
      console.error('Failed to load amenities:', error);
      setError(error.message || 'Failed to load amenities. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    const currentAmenities = formData?.amenities || [];
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter((a) => a !== amenityId)
      : [...currentAmenities, amenityId];
    updateFormData({ amenities: newAmenities });
  };

  const groupedAmenities = (amenities || []).reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, AmenityDTO[]>);

  const totalRooms = (formData?.rooms || []).length;
  const avgPrice = totalRooms > 0
    ? (formData?.rooms || []).reduce((sum, r) => sum + (r?.basePrice || 0), 0) / totalRooms
    : 0;
  const minPrice = totalRooms > 0
    ? Math.min(...(formData?.rooms || []).map((r) => r?.basePrice || 0))
    : 0;
  const maxPrice = totalRooms > 0
    ? Math.max(...(formData?.rooms || []).map((r) => r?.basePrice || 0))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Amenities</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select property-level amenities and review pricing summary based on your room configurations.
        </p>
      </div>

      {totalRooms > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Price Range</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()}
            </p>
            <p className="text-xs text-blue-700 mt-1">per night</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Average Price</span>
            </div>
            <p className="text-2xl font-bold text-green-900">₹{avgPrice.toLocaleString()}</p>
            <p className="text-xs text-green-700 mt-1">per night</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-900">Total Rooms</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRooms}</p>
            <p className="text-xs text-gray-700 mt-1">available for booking</p>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-4">Property Amenities</h4>
        <p className="text-sm text-gray-600 mb-4">
          Select general amenities available at the property level (not room-specific)
        </p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={loadAmenities}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Loading amenities...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
              <div key={category}>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {category}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryAmenities.map((amenity) => (
                    <label
                      key={amenity.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(formData?.amenities || []).includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">{amenity.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(formData?.amenities || []).length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900">
            {(formData?.amenities || []).length} amenity selected
          </p>
        </div>
      )}
    </div>
  );
};
