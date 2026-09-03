import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-2 rounded-lg">
                <Building2 className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-white">FMS</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Professional facilities management for organizations and public use. Trusted, secure, and efficient.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Shield size={16} className="text-green-400" />
              <span className="text-green-400 font-semibold">SSL Secure</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => navigate(ROUTES.SEARCH)}
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                >
                  Search Facilities
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate(ROUTES.BOOKING_TRACKING)}
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                >
                  Track Booking
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Facilities
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-lg">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-lg">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              Facilities Management System - Professional Booking Platform
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                <Shield size={20} className="text-green-400" />
                <span className="text-sm font-semibold text-gray-300">SSL SECURE</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500">
            © 2026 Facilities Management System. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
