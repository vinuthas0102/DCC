import React, { useState, useEffect } from 'react';
import { X, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ImageCarousel } from '../ui/ImageCarousel';
import { PropertyDetailsCollapsible } from './PropertyDetailsCollapsible';
import { PropertyDTO, BlockDTO, FloorDTO, RoomDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { requiresLoginForBooking, getBookingButtonText, getModuleBadgeText, getModuleBadgeStyles } from '../../utils/moduleHelpers';
import { ROUTES } from '../../constants/routes';

interface PropertyQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDTO;
}

export const PropertyQuickViewModal: React.FC<PropertyQuickViewModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [blocks, setBlocks] = useState<BlockDTO[]>([]);
  const [floors, setFloors] = useState<FloorDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const moduleCode = property.module?.code;
  const isAuthenticated = !!user;
  const needsLogin = requiresLoginForBooking(moduleCode);
  const buttonText = getBookingButtonText(moduleCode, isAuthenticated);
  const badgeText = getModuleBadgeText(moduleCode);
  const badgeStyles = getModuleBadgeStyles(moduleCode);

  useEffect(() => {
    if (isOpen && property) {
      loadPropertyDetails();
    }
  }, [isOpen, property]);

  const loadPropertyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await propertyService.getPropertyHierarchy(property.id);
      setBlocks(data.blocks);
      setFloors(data.floors);
      setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to load property details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullDetails = () => {
    navigate(`/properties/${property.id}`);
    onClose();
  };

  const handleBookNow = () => {
    if (needsLogin && !isAuthenticated) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      onClose();
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" noPadding>
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{property.name}</h2>
              <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'}>
                {property.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {property.module && (
                <Badge variant="default">
                  {property.module.name}
                </Badge>
              )}
              {property.propertyType && (
                <Badge variant="success">
                  {property.propertyType.name}
                </Badge>
              )}
              {badgeText && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyles}`}>
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-gray-600">{property.address}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {property.images.length > 0 && (
            <div className="mb-6">
              <ImageCarousel
                images={property.images}
                alt={property.name}
                className="h-64 rounded-lg"
                autoPlay={false}
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Details</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPropertyDetails} size="sm">Try Again</Button>
            </div>
          ) : (
            <PropertyDetailsCollapsible
              property={property}
              blocks={blocks}
              floors={floors}
              rooms={rooms}
            />
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <Button
            variant="outline"
            onClick={handleViewFullDetails}
            icon={<ExternalLink size={20} />}
            className="flex-1"
          >
            View Full Details
          </Button>
          <Button
            onClick={handleBookNow}
            icon={<Calendar size={20} />}
            className="flex-1"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
