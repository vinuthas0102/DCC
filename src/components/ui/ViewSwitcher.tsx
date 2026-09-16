import React from 'react';
import { LayoutGrid, List, Table2 } from 'lucide-react';

export type ViewMode = 'card' | 'table' | 'list';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className = '',
}) => {
  const views: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'card', icon: <LayoutGrid size={18} />, label: 'Cards' },
    { mode: 'table', icon: <Table2 size={18} />, label: 'Table' },
    { mode: 'list', icon: <List size={18} />, label: 'List' },
  ];

  return (
    <div className={`inline-flex items-center bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 p-1 ${className}`}>
      {views.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
            ${
              currentView === mode
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
            }
          `}
          title={label}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
