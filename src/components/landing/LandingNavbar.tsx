import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ROUTES } from '../../constants/routes';

interface LandingNavbarProps {
  isScrolled: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ isScrolled }) => {
  const navigate = useNavigate();

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(ROUTES.LANDING)}>
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-2 rounded-lg">
              <Building2 className="text-white" size={28} />
            </div>
            <span className="text-2xl font-bold text-gray-900">FMS</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
              Services
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
              Destinations
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
              FAQs
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
              Contact Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              Login / Register
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
