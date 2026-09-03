import React from 'react';
import { Modal } from '../ui/Modal';
import { PropertyAvailabilityCalendar } from './PropertyAvailabilityCalendar';
import { PropertyDTO } from '../../types';

interface AvailabilityCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDTO;
  onDateSelect?: (date: string) => void;
  selectedStartDate?: string;
  selectedEndDate?: string;
}

export const AvailabilityCalendarModal: React.FC<AvailabilityCalendarModalProps> = ({
  isOpen,
  onClose,
  property,
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${property.name} - Availability`} size="lg">
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 border border-blue-100">
          <h4 className="font-semibold text-gray-900 mb-1">{property.name}</h4>
          <p className="text-sm text-gray-600">{property.address}</p>
          {property.estate && (
            <p className="text-sm text-gray-500 mt-1">
              {property.estate.city}, {property.estate.state}
            </p>
          )}
        </div>

        <PropertyAvailabilityCalendar
          propertyId={property.id}
          onDateSelect={onDateSelect}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
        />

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900 mb-2">Booking Tips:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Click on available dates (green) to select your booking period</li>
            <li>Red dates are fully booked and unavailable</li>
            <li>Yellow dates have limited availability</li>
            <li>Gray dates are blocked for special events</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
