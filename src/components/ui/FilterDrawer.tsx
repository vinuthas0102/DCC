import React from 'react';
import { X, Filter as FilterIcon } from 'lucide-react';
import { Button } from './Button';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  onClearAll?: () => void;
  activeFilterCount?: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title = 'Filters',
  onClearAll,
  activeFilterCount = 0,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <FilterIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              {activeFilterCount > 0 && (
                <p className="text-xs text-gray-500">
                  {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">{children}</div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          {onClearAll && activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={onClearAll}
              className="flex-1"
            >
              Clear All
            </Button>
          )}
          <Button onClick={onClose} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
};
