import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { RegionDTO } from '../../types';

interface RegionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (region: RegionFormData) => Promise<void>;
  region?: RegionDTO | null;
}

export interface RegionFormData {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export const RegionFormModal: React.FC<RegionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  region,
}) => {
  const [formData, setFormData] = useState<RegionFormData>({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (region) {
      setFormData({
        name: region.name,
        code: region.code,
        description: region.description || '',
        isActive: region.isActive,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [region, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Region name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Region code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save region:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={region ? 'Edit Region' : 'Add Region'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter region name"
            error={errors.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region Code <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Enter region code"
            error={errors.code}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
          />
        </div>

        {region && (
          <div className="flex items-center gap-2">
            <Toggle
              checked={formData.isActive ?? true}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : region ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
