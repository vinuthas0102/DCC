import React from 'react';
import { LayoutGrid, List, Table } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ViewToggle: React.FC = () => {
  const { viewMode, setViewMode } = useUIStore();

  const views = [
    { id: 'cards' as const, icon: LayoutGrid, label: 'Cards' },
    { id: 'table' as const, icon: Table, label: 'Table' },
    { id: 'list' as const, icon: List, label: 'List' },
  ];

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      {views.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setViewMode(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-150 ${
            viewMode === id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title={label}
        >
          <Icon size={18} />
          <span className="text-sm font-medium hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
