import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { ROUTES } from '../../constants/routes';

interface HeroSectionProps {
  onScrollToBooking: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToBooking }) => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-12 pb-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <div className="absolute inset-0">
        <svg className="absolute top-0 right-0 w-1/2 h-full opacity-10" viewBox="0 0 400 800">
          <path
            d="M 0,400 Q 200,200 400,400 T 400,800"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          <div className="animate-slideInLeft">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold animate-slideDown">
              Trusted Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              FACILITIES
              <span className="block mt-2 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                & BOOKING SYSTEM
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-5 leading-relaxed">
              Book Guest Houses, Conference Halls, Conventions, & Parks seamlessly.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={onScrollToBooking}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transform hover:scale-105 transition-all shadow-lg"
                icon={<Search size={20} />}
              >
                Book Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(ROUTES.MAP_SEARCH)}
                className="border-2 hover:bg-gray-50 transform hover:scale-105 transition-all"
                icon={<MapPin size={20} />}
              >
                Search on Map
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(ROUTES.BOOKING_TRACKING)}
                className="border-2 hover:bg-gray-50 transform hover:scale-105 transition-all"
              >
                Track Booking
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">500+</div>
                <div className="text-sm text-gray-600">Facilities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">50K+</div>
                <div className="text-sm text-gray-600">Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">200+</div>
                <div className="text-sm text-gray-600">Cities</div>
              </div>
            </div>
          </div>

          <div className="relative animate-zoomIn" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -top-6 -left-6 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
            <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>

            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                  <img
                    src="/hero-conference-hall.webp"
                    alt="Conference Hall"
                    className="w-full h-40 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="font-semibold">Conference Halls</div>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                  <img
                    src="/hero-convention-center.webp"
                    alt="Convention Center"
                    className="w-full h-32 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="font-semibold">Convention Centers</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                  <img
                    src="/hero-guest-house.webp"
                    alt="Guest House"
                    className="w-full h-32 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="font-semibold">Guest Houses</div>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                  <img
                    src="/hero-park.webp"
                    alt="Parks & Recreation"
                    className="w-full h-40 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="font-semibold">Parks & Recreation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
};
