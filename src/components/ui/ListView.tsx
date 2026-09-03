import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ListViewItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  rightContent?: React.ReactNode;
  onClick?: () => void;
}

export const ListViewItem: React.FC<ListViewItemProps> = ({
  icon,
  title,
  subtitle,
  badge,
  rightContent,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 bg-white border-b border-gray-100 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-blue-50' : ''
      }`}
    >
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-gray-600 truncate mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {rightContent}
        {onClick && <ChevronRight size={18} className="text-gray-400" />}
      </div>
    </div>
  );
};

interface ListViewProps {
  children: React.ReactNode;
  emptyMessage?: string;
}

export const ListView: React.FC<ListViewProps> = ({
  children,
  emptyMessage = 'No items to display',
}) => {
  const hasChildren = React.Children.count(children) > 0;

  if (!hasChildren) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
      {children}
    </div>
  );
};
