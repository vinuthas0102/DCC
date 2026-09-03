import React from 'react';
import { PropertyDTO } from '../../types';
import { Badge } from '../ui/Badge';
import { Building2, Hash, FileText, Shield } from 'lucide-react';

interface BasicInfoDisplayProps {
  property: PropertyDTO;
}

export const BasicInfoDisplay: React.FC<BasicInfoDisplayProps> = ({ property }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Building2 className="w-4 h-4" />
            <span>Property Name</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{property.name}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Hash className="w-4 h-4" />
            <span>Property Code</span>
          </div>
          <p className="text-lg font-mono font-semibold text-gray-900">{property.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Building2 className="w-4 h-4" />
            <span>Module</span>
          </div>
          {property.module ? (
            <Badge variant="default" className="text-base">
              {property.module.name}
            </Badge>
          ) : (
            <span className="text-gray-500">Not specified</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Building2 className="w-4 h-4" />
            <span>Property Type</span>
          </div>
          {property.propertyType ? (
            <Badge variant="success" className="text-base">
              {property.propertyType.name}
            </Badge>
          ) : (
            <span className="text-gray-500">Not specified</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Building2 className="w-4 h-4" />
          <span>Asset Type</span>
        </div>
        <p className="text-base text-gray-900">
          {property.assetType ? (
            <span>
              {property.assetType.name} - {property.assetType.subtype}
              <Badge variant="default" className="ml-2">
                Category {property.assetType.category}
              </Badge>
            </span>
          ) : (
            <span className="text-gray-500">Not specified</span>
          )}
        </p>
      </div>

      {property.description && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Description</span>
          </div>
          <p className="text-base text-gray-700 leading-relaxed">{property.description}</p>
        </div>
      )}

      {property.amenities && property.amenities.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-500 mb-2">Amenities</div>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((amenity, index) => (
              <Badge key={index} variant="default">
                {amenity}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {property.isExempt && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <Shield className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Exempt from Booking Rules</p>
            <p className="text-xs text-amber-700">This property bypasses standard booking restrictions</p>
          </div>
        </div>
      )}
    </div>
  );
};
