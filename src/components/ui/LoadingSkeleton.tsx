import React from 'react';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const FormLoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div>
      <LoadingSkeleton className="h-6 w-48 mb-2" />
      <LoadingSkeleton className="h-4 w-96 mb-6" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <LoadingSkeleton className="h-5 w-32 mb-2" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
      <div>
        <LoadingSkeleton className="h-5 w-32 mb-2" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
    </div>

    <div>
      <LoadingSkeleton className="h-5 w-32 mb-2" />
      <LoadingSkeleton className="h-10 w-full" />
    </div>

    <div>
      <LoadingSkeleton className="h-5 w-32 mb-2" />
      <LoadingSkeleton className="h-24 w-full" />
    </div>
  </div>
);

export const SelectLoadingSkeleton: React.FC = () => (
  <div className="space-y-2">
    <LoadingSkeleton className="h-5 w-24" />
    <LoadingSkeleton className="h-10 w-full" />
    <LoadingSkeleton className="h-3 w-64" />
  </div>
);
