import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useUIStore } from '../../stores/uiStore';
import { dateBlockService } from '../../services/dateBlockService';
import { designationService } from '../../services/designationService';
import { propertyService } from '../../services/propertyService';
import { DateBlockDTO, DesignationDTO, AssetTypeDTO, RoomTypeDTO } from '../../types';

export const DateBlocksManagement: React.FC = () => {
  const addToast = useUIStore((state) => state.addToast);
  const [dateBlocks, setDateBlocks] = useState<DateBlockDTO[]>([]);
  const [designations, setDesignations] = useState<DesignationDTO[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetTypeDTO[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    blockName: '',
    description: '',
    startDate: '',
    endDate: '',
    assetTypeId: '',
    roomTypeIds: [] as string[],
    allowedDesignations: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [blocksData, designationsData, assetTypesData, roomTypesData] = await Promise.all([
        dateBlockService.getDateBlocks(),
        designationService.getDesignations(),
        propertyService.getAssetTypes(),
        propertyService.getRoomTypes(),
      ]);
      setDateBlocks(blocksData);
      setDesignations(designationsData);
      setAssetTypes(assetTypesData);
      setRoomTypes(roomTypesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast('Failed to load date blocks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async () => {
    if (!formData.blockName || !formData.startDate || !formData.endDate || !formData.assetTypeId) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    try {
      await dateBlockService.createDateBlock({
        blockName: formData.blockName,
        description: formData.description,
        ranges: [{ startDate: formData.startDate, endDate: formData.endDate }],
        rules: [
          {
            assetTypeId: formData.assetTypeId,
            roomTypeIds: formData.roomTypeIds,
            allowedDesignations: formData.allowedDesignations,
          },
        ],
      });
      addToast('Date block created successfully', 'success');
      setShowModal(false);
      setFormData({
        blockName: '',
        description: '',
        startDate: '',
        endDate: '',
        assetTypeId: '',
        roomTypeIds: [],
        allowedDesignations: [],
      });
      loadData();
    } catch (error: any) {
      addToast(error.message || 'Failed to create date block', 'error');
    }
  };

  const handleToggleActive = async (block: DateBlockDTO) => {
    try {
      await dateBlockService.updateDateBlock(block.id, { isActive: !block.isActive });
      addToast(`Date block ${block.isActive ? 'deactivated' : 'activated'}`, 'success');
      loadData();
    } catch (error: any) {
      addToast(error.message || 'Failed to update date block', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this date block?')) return;

    try {
      await dateBlockService.deleteDateBlock(id);
      addToast('Date block deleted successfully', 'success');
      loadData();
    } catch (error: any) {
      addToast(error.message || 'Failed to delete date block', 'error');
    }
  };

  const handleRoomTypeToggle = (roomTypeId: string) => {
    setFormData((prev) => ({
      ...prev,
      roomTypeIds: prev.roomTypeIds.includes(roomTypeId)
        ? prev.roomTypeIds.filter((id) => id !== roomTypeId)
        : [...prev.roomTypeIds, roomTypeId],
    }));
  };

  const handleDesignationToggle = (designationId: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedDesignations: prev.allowedDesignations.includes(designationId)
        ? prev.allowedDesignations.filter((id) => id !== designationId)
        : [...prev.allowedDesignations, designationId],
    }));
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
        <h3 className="text-lg font-semibold text-gray-900">Manage Special Date Blocks</h3>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Date Block
        </Button>
      </div>

      <div className="space-y-3">
        {dateBlocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p>No date blocks configured yet</p>
          </div>
        ) : (
          dateBlocks.map((block) => (
            <div
              key={block.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{block.blockName}</h4>
                    <Badge variant={block.isActive ? 'success' : 'error'}>
                      {block.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{block.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(block)}
                    title={block.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(block.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {block.ranges && block.ranges.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Date Ranges:</p>
                  <div className="flex flex-wrap gap-2">
                    {block.ranges.map((range) => (
                      <Badge key={range.id} variant="info">
                        {new Date(range.startDate).toLocaleDateString()} -{' '}
                        {new Date(range.endDate).toLocaleDateString()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {block.rules && block.rules.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Affected Asset Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {block.rules.map((rule) => (
                      <Badge key={rule.id} variant="warning">
                        {rule.assetType?.name || 'Unknown'} (Category {rule.assetType?.category})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Date Block">
        <div className="space-y-4">
          <Input
            label="Block Name"
            value={formData.blockName}
            onChange={(e) => setFormData({ ...formData, blockName: e.target.value })}
            placeholder="e.g., Republic Day 2026"
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the purpose of this block"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate}
            />
          </div>

          <Select
            label="Asset Type"
            value={formData.assetTypeId}
            onChange={(e) => setFormData({ ...formData, assetTypeId: e.target.value })}
            options={[
              { value: '', label: 'Select asset type' },
              ...assetTypes.map((at) => ({
                value: at.id,
                label: `${at.name} (Category ${at.category})`,
              })),
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restricted Room Types
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {roomTypes.map((rt) => (
                <label key={rt.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roomTypeIds.includes(rt.id)}
                    onChange={() => handleRoomTypeToggle(rt.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{rt.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Designations
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {designations.map((d) => (
                <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowedDesignations.includes(d.id)}
                    onChange={() => handleDesignationToggle(d.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {d.designationName} (Level {d.level})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBlock}>Create Date Block</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
