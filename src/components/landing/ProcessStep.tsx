import React from 'react';

interface ProcessStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  index: number;
  isVisible: boolean;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({
  icon,
  title,
  description,
  color,
  index,
  isVisible,
}) => {
  return (
    <div
      className={`relative text-center group ${
        isVisible ? 'animate-scaleIn' : 'opacity-0'
      }`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className={`inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg relative z-10`}>
        <div className={`text-${color}-600`}>{icon}</div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-900 shadow-md">
          {index + 1}
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};
