import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { EstateDTO, RegionDTO } from '../../types';
import { EstateBasicInfoTab } from '../estate-creation/EstateBasicInfoTab';
import { EstateLocationTab } from '../estate-creation/EstateLocationTab';
import { EstateImagesTab } from '../estate-creation/EstateImagesTab';
import { Info, MapPin, Image } from 'lucide-react';

interface EstateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (estate: EstateFormData) => Promise<void>;
  estate?: EstateDTO | null;
  regions: RegionDTO[];
}

export interface EstateFormData {
  regionId: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export const EstateFormModal: React.FC<EstateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  estate,
  regions: _regions,
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<EstateFormData>({
    regionId: '',
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
    pincode: '',
    latitude: undefined,
    longitude: undefined,
    images: [],
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (estate) {
      setFormData({
        regionId: estate.regionId,
        name: estate.name,
        code: estate.code,
        city: estate.city,
        state: estate.state,
        address: estate.address || '',
        pincode: estate.pincode || '',
        latitude: estate.latitude,
        longitude: estate.longitude,
        images: estate.images || [],
        contactPerson: estate.contactPerson || '',
        contactEmail: estate.contactEmail || '',
        contactPhone: estate.contactPhone || '',
        isActive: estate.isActive,
      });
    } else {
      setFormData({
        regionId: '',
        name: '',
        code: '',
        city: '',
        state: '',
        address: '',
        pincode: '',
        latitude: undefined,
        longitude: undefined,
        images: [],
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        isActive: true,
      });
    }
    setErrors({});
    setActiveTab('basic');
  }, [estate, isOpen]);

  const updateFormData = (updates: Partial<EstateFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Estate name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Estate code is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.regionId) {
      newErrors.regionId = 'Region is required';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
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
      console.error('Failed to save estate:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <Info className="w-4 h-4" /> },
    { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
    { id: 'images', label: 'Images', icon: <Image className="w-4 h-4" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <EstateBasicInfoTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            isEditMode={!!estate}
          />
        );
      case 'location':
        return (
          <EstateLocationTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 'images':
        return (
          <EstateImagesTab
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={estate ? 'Edit Estate' : 'Create Estate'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : estate ? 'Update Estate' : 'Create Estate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
