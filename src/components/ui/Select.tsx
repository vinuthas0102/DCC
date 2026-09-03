import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        className={`block w-full rounded-lg border ${
          error ? 'border-red-300' : 'border-gray-300'
        } px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 ${className}`}
        {...props}
      >
        {options ? options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )) : children}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
