import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

interface FacilityCardProps {
  icon: React.ReactNode;
  title: string;
  features: string[];
  gradient: string;
  delay: string;
  isVisible: boolean;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  icon,
  title,
  features,
  gradient,
  delay,
  isVisible,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 border border-gray-100 ${
        isVisible ? 'animate-slideUp' : 'opacity-0'
      }`}
      style={{ animationDelay: delay }}
    >
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2 mb-4">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-gray-600">
            <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate(ROUTES.SEARCH)}
        className={`w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${gradient} hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
      >
        Check Availability
      </button>
    </div>
  );
};
