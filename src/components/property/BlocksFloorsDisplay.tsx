import React from 'react';
import { BlockDTO } from '../../types';
import { Building, Layers } from 'lucide-react';

interface BlocksFloorsDisplayProps {
  blocks: BlockDTO[];
}

export const BlocksFloorsDisplay: React.FC<BlocksFloorsDisplayProps> = ({ blocks }) => {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No blocks configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">{block.name}</h4>
              </div>
              {block.isActive && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3 font-mono">{block.code}</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Layers className="w-4 h-4 text-gray-400" />
              <span>
                {block.floors} {block.floors === 1 ? 'Floor' : 'Floors'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Total Blocks</span>
          <span className="text-xl font-bold text-blue-700">{blocks.length}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-blue-900">Total Floors</span>
          <span className="text-xl font-bold text-blue-700">
            {blocks.reduce((sum, block) => sum + block.floors, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
