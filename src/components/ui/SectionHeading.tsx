import React from 'react';

interface SectionHeadingProps {
  icon: React.ReactNode;
  label: string;
  count?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, label, count }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-0.5 h-6 bg-teal-600 rounded-full flex-shrink-0" />
    <div className="flex items-center gap-2 text-gray-900">
      {icon}
      <h3 className="text-base font-bold">{label}</h3>
    </div>
    {count && <span className="ml-auto text-xs text-gray-400">{count}</span>}
  </div>
);
