import React from 'react';
import { BookingFormWidget } from '../components/landing/BookingFormWidget';
import { AvailabilityWidget } from '../components/landing/AvailabilityWidget';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FacilityTypesSection } from '../components/landing/FacilityTypesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { WhyChooseSection } from '../components/landing/WhyChooseSection';
import { CTASection } from '../components/landing/CTASection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const LandingPage: React.FC = () => {
  const { isScrolled, visibleSections } = useScrollAnimation();

  const scrollToBooking = () => {
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar isScrolled={isScrolled} />
      <HeroSection onScrollToBooking={scrollToBooking} />

      <section id="booking-form" className="relative -mt-12 px-4 sm:px-6 lg:px-8 pb-10" data-animate>
        <div className="max-w-4xl mx-auto">
          <BookingFormWidget className={`${visibleSections.has('booking-form') ? 'animate-slideUpBig' : 'opacity-0'}`} />
        </div>
      </section>

      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-gray-50" data-animate id="availability">
        <div className="max-w-7xl mx-auto">
          <AvailabilityWidget className={`${visibleSections.has('availability') ? 'animate-fadeIn' : 'opacity-0'}`} />
        </div>
      </section>

      <FacilityTypesSection visibleSections={visibleSections} />
      <HowItWorksSection visibleSections={visibleSections} />
      <WhyChooseSection visibleSections={visibleSections} />
      <CTASection visibleSections={visibleSections} />
      <LandingFooter />
    </div>
  );
};
