import React from 'react';
import { Search, Calendar, CheckCircle, Shield } from 'lucide-react';
import { ProcessStep } from './ProcessStep';

interface HowItWorksSectionProps {
  visibleSections: Set<string>;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ visibleSections }) => {
  const steps = [
    {
      icon: <Search size={48} />,
      title: 'Search',
      description: 'Browse available facilities by location and dates',
      color: 'blue',
    },
    {
      icon: <Calendar size={48} />,
      title: 'Select',
      description: 'Choose your preferred facility type and dates',
      color: 'teal',
    },
    {
      icon: <CheckCircle size={48} />,
      title: 'Confirm',
      description: 'Complete booking and receive instant confirmation',
      color: 'green',
    },
    {
      icon: <Shield size={48} />,
      title: 'Check-In',
      description: 'Arrive and verify with your secure OTP code',
      color: 'blue',
    },
  ];

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50" data-animate id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-8 ${visibleSections.has('how-it-works') ? 'animate-fadeIn' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-lg text-gray-600">Simple, transparent booking process in 4 easy steps</p>
        </div>

        <div className="grid md:grid-cols-4 gap-5 relative">
          <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-teal-200 to-green-200"></div>

          {steps.map((step, index) => (
            <ProcessStep
              key={index}
              {...step}
              index={index}
              isVisible={visibleSections.has('how-it-works')}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
