import React from 'react';

interface SpecTileProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
}

export const SpecTile: React.FC<SpecTileProps> = ({ icon, label, value, accent }) => (
  <div className={`rounded-xl border p-4 ${accent ?? 'bg-white border-gray-200'} shadow-sm`}>
    <div className="flex items-center gap-1.5 text-gray-400 mb-2">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="text-sm font-bold text-gray-900">{value}</div>
  </div>
);
