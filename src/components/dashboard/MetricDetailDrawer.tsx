import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MetricDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  color?: string;
}

export const MetricDetailDrawer: React.FC<MetricDetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  color = 'blue',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const colorClasses = {
    blue: 'pastel-blue-gradient',
    teal: 'pastel-teal-gradient',
    green: 'pastel-green-gradient',
    orange: 'pastel-coral-gradient',
    coral: 'pastel-coral-gradient',
    lavender: 'pastel-lavender-gradient',
    yellow: 'pastel-yellow-gradient',
    pink: 'pastel-pink-gradient',
    cyan: 'pastel-cyan-gradient',
  };

  const bgClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className={`${bgClass} p-6 border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100%-88px)]">
          {children}
        </div>
      </div>
    </>
  );
};
