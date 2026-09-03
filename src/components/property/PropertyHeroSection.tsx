import React from 'react';
import { MapPin, Building2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface PropertyHeroSectionProps {
  name: string;
  address: string;
  city?: string;
  status: string;
  images: string[];
}

export const PropertyHeroSection: React.FC<PropertyHeroSectionProps> = ({
  name,
  address,
  city,
  status,
  images,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-blue-400 to-teal-400 relative">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 size={96} className="text-white opacity-50" />
          </div>
        )}
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {name}
            </h1>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={18} />
              <span>{city || address}</span>
            </div>
          </div>
          <Badge variant={status === 'PUBLISHED' ? 'success' : 'warning'}>
            {status}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
