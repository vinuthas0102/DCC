import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, Trash2, Building } from 'lucide-react';

interface Block {
  tempId: string;
  name: string;
  code: string;
  floors: number;
}

interface BlocksFloorsTabProps {
  formData: {
    blocks: Block[];
  };
  updateFormData: (updates: any) => void;
}

export const BlocksFloorsTab: React.FC<BlocksFloorsTabProps> = ({ formData, updateFormData }) => {
  const blocks = formData?.blocks || [];

  const addBlock = () => {
    const newBlock: Block = {
      tempId: `temp_${Date.now()}`,
      name: '',
      code: '',
      floors: 1,
    };
    updateFormData({ blocks: [...blocks, newBlock] });
  };

  const removeBlock = (tempId: string) => {
    updateFormData({
      blocks: blocks.filter((b) => b.tempId !== tempId),
    });
  };

  const updateBlock = (tempId: string, updates: Partial<Block>) => {
    updateFormData({
      blocks: blocks.map((b) =>
        b.tempId === tempId ? { ...b, ...updates } : b
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Blocks & Floors Structure</h3>
        <p className="text-sm text-gray-600 mb-6">
          Define the physical structure of your property. Add blocks (buildings) and specify the number of floors in each.
        </p>
      </div>

      <Button onClick={addBlock} variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        Add Block
      </Button>

      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No blocks added yet</p>
            <p className="text-sm text-gray-500">Click "Add Block" to start building your property structure</p>
          </div>
        ) : (
          blocks.map((block, index) => (
            <div
              key={block.tempId}
              className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900">Block {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlock(block.tempId)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block Name *
                  </label>
                  <Input
                    type="text"
                    value={block.name}
                    onChange={(e) => updateBlock(block.tempId, { name: e.target.value })}
                    placeholder="e.g., Main Block"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block Code *
                  </label>
                  <Input
                    type="text"
                    value={block.code}
                    onChange={(e) => updateBlock(block.tempId, { code: e.target.value.toUpperCase() })}
                    placeholder="e.g., BLK-A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Floors *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={block.floors}
                    onChange={(e) => updateBlock(block.tempId, { floors: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">
                  This block will have {block.floors} floor{block.floors !== 1 ? 's' : ''} (Floor 1 to Floor {block.floors})
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {blocks.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900">
            Total Structure: {blocks.length} block{blocks.length !== 1 ? 's' : ''} with{' '}
            {blocks.reduce((sum, b) => sum + b.floors, 0)} total floors
          </p>
        </div>
      )}
    </div>
  );
};
