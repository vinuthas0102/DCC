import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AvailabilityCalendarModal } from '../availability/AvailabilityCalendarModal';
import { PropertyDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { availabilityService } from '../../services/availabilityService';
import { useAuthStore } from '../../stores/authStore';
import { requiresLoginForBooking, getBookingButtonText, getModuleBadgeText, getModuleBadgeStyles } from '../../utils/moduleHelpers';
import { ROUTES } from '../../constants/routes';

interface PropertyAvailabilitySummary {
  property: PropertyDTO;
  availableDays: number;
  totalDays: number;
  availabilityPercentage: number;
  nextAvailableDate: string | null;
}

export const AvailabilityWidget: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [_properties, setProperties] = useState<PropertyDTO[]>([]);
  const [availabilitySummaries, setAvailabilitySummaries] = useState<PropertyAvailabilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  useEffect(() => {
    loadPropertiesWithAvailability();
  }, []);

  const loadPropertiesWithAvailability = async () => {
    try {
      setLoading(true);
      const allProperties = await propertyService.getProperties({ status: 'ACTIVE' });

      const featuredProperties = allProperties.filter(p => p.latitude && p.longitude).slice(0, 6);
      setProperties(featuredProperties);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

      const summaries = await Promise.all(
        featuredProperties.map(async (property) => {
          try {
            const availability = await availabilityService.getPropertyAvailability(
              property.id,
              currentMonth,
              currentYear
            );

            const availableDays = availability.filter(day => day.status === 'available').length;
            const nextAvailable = availability.find(day =>
              day.status === 'available' && new Date(day.date) >= currentDate
            );

            return {
              property,
              availableDays,
              totalDays: daysInMonth,
              availabilityPercentage: Math.round((availableDays / daysInMonth) * 100),
              nextAvailableDate: nextAvailable?.date || null,
            };
          } catch (error) {
            console.error(`Failed to load availability for ${property.name}:`, error);
            return {
              property,
              availableDays: 0,
              totalDays: daysInMonth,
              availabilityPercentage: 0,
              nextAvailableDate: null,
            };
          }
        })
      );

      setAvailabilitySummaries(summaries);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getAvailabilityBarColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleViewCalendar = (property: PropertyDTO) => {
    setSelectedProperty(property);
    setShowCalendarModal(true);
  };

  const handleBookNow = (property: PropertyDTO) => {
    const moduleCode = property.module?.code;
    const needsLogin = requiresLoginForBooking(moduleCode);

    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`}>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Check Property Availability</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View real-time availability for our featured facilities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availabilitySummaries.map((summary) => (
            <Card
              key={summary.property.id}
              className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="h-36 bg-gradient-to-br from-blue-400 to-teal-400 relative overflow-hidden">
                {summary.property.images && summary.property.images.length > 0 ? (
                  <img
                    src={summary.property.images[0]}
                    alt={summary.property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Building2 size={64} className="text-white opacity-50" />
                  </div>
                )}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold border ${getAvailabilityColor(summary.availabilityPercentage)}`}>
                  {summary.availabilityPercentage}% Available
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex-1">
                    {summary.property.name}
                  </h3>
                  {getModuleBadgeText(summary.property.module?.code) && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getModuleBadgeStyles(summary.property.module?.code)}`}>
                      {getModuleBadgeText(summary.property.module?.code)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <MapPin size={16} />
                  <span>{summary.property.estate?.city || summary.property.address}</span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-semibold text-gray-900">
                      {summary.availableDays} / {summary.totalDays} days
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${getAvailabilityBarColor(summary.availabilityPercentage)} transition-all duration-500`}
                      style={{ width: `${summary.availabilityPercentage}%` }}
                    />
                  </div>
                </div>

                {summary.nextAvailableDate && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">Next Available</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(summary.nextAvailableDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleBookNow(summary.property)}
                  >
                    {getBookingButtonText(summary.property.module?.code, !!user)}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      icon={<Calendar size={16} />}
                      onClick={() => handleViewCalendar(summary.property)}
                    >
                      Calendar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => navigate(`/properties/${summary.property.id}`)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedProperty && (
        <AvailabilityCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          property={selectedProperty}
          onDateSelect={(date) => {
            navigate(`/properties/${selectedProperty.id}?checkIn=${date}`);
          }}
        />
      )}
    </>
  );
};
