import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export interface MandatoryField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'chips';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
}

interface MandatorySearchBarProps {
  fields: MandatoryField[];
  onSearch?: () => void;
  searchLabel?: string;
  filterCount?: number;
  onFilterOpen?: () => void;
  className?: string;
}

export const MandatorySearchBar: React.FC<MandatorySearchBarProps> = ({
  fields,
  onSearch,
  searchLabel = 'Search',
  filterCount = 0,
  onFilterOpen,
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) onSearch();
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-stretch divide-x divide-gray-100">
        {fields.map((field) => (
          <div key={field.key} className="flex-1 min-w-0">
            {field.type === 'chips' ? (
              <div className="px-4 py-2.5 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold leading-none">
                  {field.label}
                </span>
                <div className="flex items-center gap-1 flex-nowrap overflow-x-auto">
                  {(field.options || []).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                        field.value === opt.value
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : field.type === 'select' ? (
              <div className="px-4 py-2.5 flex flex-col gap-1 h-full justify-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold leading-none">
                  {field.label}
                </span>
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-full text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:outline-none cursor-pointer appearance-none truncate pr-4"
                >
                  {(field.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : field.type === 'date' ? (
              <div className="px-4 py-2.5 flex flex-col gap-1 h-full justify-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold leading-none">
                  {field.label}
                </span>
                <input
                  type="date"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:outline-none placeholder-gray-300"
                />
              </div>
            ) : (
              <div className="px-4 py-2.5 flex flex-col gap-1 h-full justify-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold leading-none">
                  {field.label}
                </span>
                <div className="flex items-center gap-2">
                  {field.icon && (
                    <span className="text-gray-400 flex-shrink-0">{field.icon}</span>
                  )}
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:outline-none placeholder-gray-300"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Action area */}
        <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0">
          {onFilterOpen && (
            <button
              type="button"
              onClick={onFilterOpen}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium"
              title="Filters"
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline text-xs">Filter</span>
              {filterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                  {filterCount}
                </span>
              )}
            </button>
          )}
          {onSearch && (
            <button
              type="button"
              onClick={onSearch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Search size={15} />
              <span className="hidden sm:inline">{searchLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
