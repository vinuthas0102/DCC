import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { ROUTES } from '../../constants/routes';

interface CTASectionProps {
  visibleSections: Set<string>;
}

export const CTASection: React.FC<CTASectionProps> = ({ visibleSections }) => {
  const navigate = useNavigate();

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-teal-600 to-blue-700 text-white relative overflow-hidden" data-animate id="cta">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className={`max-w-4xl mx-auto text-center relative z-10 ${visibleSections.has('cta') ? 'animate-zoomIn' : 'opacity-0'}`}>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg mb-6 text-blue-100 leading-relaxed">
          Join thousands of satisfied users managing facility bookings efficiently and securely
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl"
            onClick={() => navigate(ROUTES.SEARCH)}
            icon={<Search size={20} />}
          >
            Start Booking Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 transform hover:scale-105 transition-all"
            onClick={() => navigate(ROUTES.LOGIN)}
            icon={<ChevronRight size={20} />}
          >
            Access Dashboard
          </Button>
        </div>
      </div>
    </section>
  );
};
