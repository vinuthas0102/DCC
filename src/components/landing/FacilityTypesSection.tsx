import React from 'react';
import { Building2, Users, Award, MapPin } from 'lucide-react';
import { FacilityCard } from './FacilityCard';

interface FacilityTypesSectionProps {
  visibleSections: Set<string>;
}

export const FacilityTypesSection: React.FC<FacilityTypesSectionProps> = ({ visibleSections }) => {
  const facilities = [
    {
      icon: <Building2 size={36} />,
      title: 'Guest Houses',
      features: ['Premium guest houses', 'Complete amenities'],
      gradient: 'from-blue-500 to-blue-600',
      delay: '0s',
    },
    {
      icon: <Users size={36} />,
      title: 'Conference Halls',
      features: ['Podiums halls', 'Meeting Room'],
      gradient: 'from-teal-500 to-teal-600',
      delay: '0.1s',
    },
    {
      icon: <Award size={36} />,
      title: 'Convention Centers',
      features: ['Exhibition hall', 'Exhibition and stage'],
      gradient: 'from-blue-600 to-teal-600',
      delay: '0.2s',
    },
    {
      icon: <MapPin size={36} />,
      title: 'Parks & Recreation',
      features: ['Trees & public ravation', 'Park & Recreation'],
      gradient: 'from-green-500 to-green-600',
      delay: '0.3s',
    },
  ];

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white" data-animate id="features">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-8 ${visibleSections.has('features') ? 'animate-fadeIn' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Explore Our Facilities</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from a wide range of facilities across the country
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {facilities.map((facility, index) => (
            <FacilityCard
              key={index}
              {...facility}
              isVisible={visibleSections.has('features')}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
