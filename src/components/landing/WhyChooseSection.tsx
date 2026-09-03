import React from 'react';
import { Shield, TrendingUp, Star } from 'lucide-react';

interface WhyChooseSectionProps {
  visibleSections: Set<string>;
}

export const WhyChooseSection: React.FC<WhyChooseSectionProps> = ({ visibleSections }) => {
  const benefits = [
    {
      icon: <Shield size={40} />,
      title: 'Secure & Verified',
      description: 'Verified and secure platform with trusted payment processing and data protection',
      color: 'blue',
    },
    {
      icon: <TrendingUp size={40} />,
      title: 'Real-Time Availability',
      description: 'Instant availability updates and confirmations for all facilities',
      color: 'teal',
    },
    {
      icon: <Star size={40} />,
      title: 'Premium Support',
      description: '24/7 customer support to assist you throughout your booking journey',
      color: 'green',
    },
  ];

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white" data-animate id="why-choose">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-8 ${visibleSections.has('why-choose') ? 'animate-fadeIn' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Why Choose FMS?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The most trusted platform for facility bookings
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br from-gray-50 to-${benefit.color}-50 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 group ${
                visibleSections.has('why-choose') ? 'animate-slideUp' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-${benefit.color}-500 to-${benefit.color}-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:rotate-3`}>
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
