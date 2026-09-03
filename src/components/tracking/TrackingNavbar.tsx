import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ROUTES } from '../../constants/routes';

export const TrackingNavbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <Building2 className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">FMS</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(ROUTES.SEARCH)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Search Facilities
            </button>
            <Button onClick={() => navigate(ROUTES.LOGIN)} size="sm">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
