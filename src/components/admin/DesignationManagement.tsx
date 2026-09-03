import React, { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useUIStore } from '../../stores/uiStore';
import { designationService as dateBlockService } from '../../services/designationService';
import { DesignationDTO } from '../../types';

export const DesignationManagement: React.FC = () => {
  const addToast = useUIStore((state) => state.addToast);
  const [designations, setDesignations] = useState<DesignationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: 1,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dateBlockService.getDesignations();
      setDesignations(data);
    } catch (error) {
      console.error('Failed to load designations:', error);
      addToast('Failed to load designations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    try {
      if (editingId) {
        await dateBlockService.updateDesignation(editingId, {
          name: formData.name,
          code: formData.code,
          level: formData.level,
          description: formData.description,
        });
        addToast('Designation updated successfully', 'success');
      } else {
        await dateBlockService.createDesignation(
          formData.name,
          formData.code,
          formData.level,
          formData.description
        );
        addToast('Designation created successfully', 'success');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', code: '', level: 1, description: '' });
      loadData();
    } catch (error: any) {
      addToast(error.message || 'Failed to save designation', 'error');
    }
  };

  const handleEdit = (designation: DesignationDTO) => {
    setEditingId(designation.id);
    setFormData({
      name: designation.designationName,
      code: designation.designationCode,
      level: designation.level,
      description: designation.description,
    });
    setShowModal(true);
  };

  const handleToggleActive = async (designation: DesignationDTO) => {
    try {
      await dateBlockService.updateDesignation(designation.id, {
        isActive: !designation.isActive,
      });
      addToast(`Designation ${designation.isActive ? 'deactivated' : 'activated'}`, 'success');
      loadData();
    } catch (error: any) {
      addToast(error.message || 'Failed to update designation', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Manage Designations</h3>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Designation
        </Button>
      </div>

      <div className="space-y-3">
        {designations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Award size={48} className="mx-auto mb-3 opacity-30" />
            <p>No designations configured yet</p>
          </div>
        ) : (
          designations.map((designation) => (
            <div
              key={designation.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900">{designation.designationName}</h4>
                    <Badge variant="info">Level {designation.level}</Badge>
                    <Badge variant={designation.isActive ? 'success' : 'error'}>
                      {designation.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Code: {designation.designationCode}</p>
                  {designation.description && (
                    <p className="text-xs text-gray-500 mt-1">{designation.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(designation)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggleActive(designation)}>
                    <Award className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
          setFormData({ name: '', code: '', level: 1, description: '' });
        }}
        title={editingId ? 'Edit Designation' : 'Create Designation'}
      >
        <div className="space-y-4">
          <Input
            label="Designation Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Chief Executive Officer"
          />

          <Input
            label="Designation Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., CEO"
          />

          <Input
            type="number"
            label="Hierarchy Level (1 = Highest)"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
            min={1}
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this designation"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
                setFormData({ name: '', code: '', level: 1, description: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Update' : 'Create'} Designation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
