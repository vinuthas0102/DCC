import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { HorizontalSlider } from '../components/ui/HorizontalSlider';
import { Plus, CreditCard as Edit, Settings, Box, MapPin, Building2, Calendar, Award, Layers } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { RegionDTO, EstateDTO, AssetTypeDTO, ModuleDTO, PropertyTypeDTO } from '../types';
import { useUIStore } from '../stores/uiStore';
import { DateBlocksManagement } from '../components/admin/DateBlocksManagement';
import { DesignationManagement } from '../components/admin/DesignationManagement';
import { EstateFormModal, EstateFormData } from '../components/admin/EstateFormModal';
import { RegionFormModal, RegionFormData } from '../components/admin/RegionFormModal';
import { AssetTypeFormModal, AssetTypeFormData } from '../components/admin/AssetTypeFormModal';
import { FadeIn } from '../components/animations/FadeIn';

export const AdminPage: React.FC = () => {
  const addToast = useUIStore((state) => state.addToast);
  const [regions, setRegions] = useState<RegionDTO[]>([]);
  const [estates, setEstates] = useState<EstateDTO[]>([]);
  const [modules, setModules] = useState<ModuleDTO[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDTO[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');

  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionDTO | null>(null);

  const [isEstateModalOpen, setIsEstateModalOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateDTO | null>(null);

  const [isAssetTypeModalOpen, setIsAssetTypeModalOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetTypeDTO | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [regionsData, estatesData, modulesData, propertyTypesData, assetTypesData] = await Promise.all([
        propertyService.getRegions(),
        propertyService.getEstates(),
        propertyService.getModules(),
        propertyService.getPropertyTypes(),
        propertyService.getAssetTypes(),
      ]);
      setRegions(regionsData);
      setEstates(estatesData);
      setModules(modulesData);
      setPropertyTypes(propertyTypesData);
      setAssetTypes(assetTypesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegionModal = (region?: RegionDTO) => {
    setSelectedRegion(region || null);
    setIsRegionModalOpen(true);
  };

  const handleSaveRegion = async (formData: RegionFormData) => {
    try {
      if (selectedRegion) {
        await propertyService.updateRegion(selectedRegion.id, formData);
        addToast('Region updated successfully', 'success');
      } else {
        await propertyService.createRegion(formData);
        addToast('Region created successfully', 'success');
      }
      await loadData();
    } catch (error) {
      console.error('Failed to save region:', error);
      addToast('Failed to save region', 'error');
      throw error;
    }
  };

  const handleOpenEstateModal = (estate?: EstateDTO) => {
    setSelectedEstate(estate || null);
    setIsEstateModalOpen(true);
  };

  const handleSaveEstate = async (formData: EstateFormData) => {
    try {
      if (selectedEstate) {
        await propertyService.updateEstate(selectedEstate.id, formData);
        addToast('Estate updated successfully', 'success');
      } else {
        await propertyService.createEstate(formData);
        addToast('Estate created successfully', 'success');
      }
      await loadData();
    } catch (error) {
      console.error('Failed to save estate:', error);
      addToast('Failed to save estate', 'error');
      throw error;
    }
  };

  const handleOpenAssetTypeModal = (assetType?: AssetTypeDTO) => {
    setSelectedAssetType(assetType || null);
    setIsAssetTypeModalOpen(true);
  };

  const handleSaveAssetType = async (formData: AssetTypeFormData) => {
    try {
      if (selectedAssetType) {
        await propertyService.updateAssetType(selectedAssetType.id, formData);
        addToast('Asset type updated successfully', 'success');
      } else {
        await propertyService.createAssetType(formData);
        addToast('Asset type created successfully', 'success');
      }
      await loadData();
    } catch (error) {
      console.error('Failed to save asset type:', error);
      addToast('Failed to save asset type', 'error');
      throw error;
    }
  };

  const sliderItems = [
    { id: 'modules', label: 'Modules', icon: <Layers size={16} />, color: 'cyan' },
    { id: 'property-types', label: 'Property Types', icon: <Building2 size={16} />, color: 'lavender' },
    { id: 'date-blocks', label: 'Date Blocks', icon: <Calendar size={16} />, color: 'yellow' },
    { id: 'designations', label: 'Designations', icon: <Award size={16} />, color: 'pink' },
    { id: 'regions', label: 'Regions', icon: <MapPin size={16} />, color: 'blue' },
    { id: 'estates', label: 'Estates', icon: <Building2 size={16} />, color: 'green' },
    { id: 'asset-types', label: 'Asset Types', icon: <Box size={16} />, color: 'coral' },
  ];

  const renderModules = () => (
    <div className="space-y-4">
      <FadeIn delay={0}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Modules</h3>
            <p className="text-sm text-gray-500 mt-1">System-wide modules configuration</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-3">
        {modules.map((module, index) => (
          <FadeIn key={module.id} delay={index * 50}>
            <div className="pastel-cyan-gradient p-4 rounded-xl card-interactive">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold text-gray-900">{module.name}</p>
                    <span className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-0.5 rounded">
                      {module.code}
                    </span>
                  </div>
                  {module.description && (
                    <p className="text-sm text-gray-600">{module.description}</p>
                  )}
                </div>
                <Badge variant={module.isActive ? 'success' : 'error'} className="ml-4">
                  {module.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
  const renderPropertyTypes = () => (
    <div className="space-y-4">
      <FadeIn delay={0}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Property Types</h3>
            <p className="text-sm text-gray-500 mt-1">Configure property type classifications</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-3">
        {propertyTypes.map((propertyType, index) => (
          <FadeIn key={propertyType.id} delay={index * 50}>
            <div className="pastel-lavender-gradient p-4 rounded-xl card-interactive">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-gray-900">{propertyType.name}</p>
                    <span className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-0.5 rounded">
                      {propertyType.code}
                    </span>
                    {propertyType.module && (
                      <Badge variant="default" className="text-xs">
                        {propertyType.module.name}
                      </Badge>
                    )}
                  </div>
                  {propertyType.description && (
                    <p className="text-sm text-gray-600">{propertyType.description}</p>
                  )}
                </div>
                <Badge variant={propertyType.isActive ? 'success' : 'error'} className="ml-4">
                  {propertyType.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
  const renderDateBlocks = () => (
    <div className="pastel-yellow-gradient p-6 rounded-xl">
      <DateBlocksManagement />
    </div>
  );

  const renderDesignations = () => (
    <div className="pastel-pink-gradient p-6 rounded-xl">
      <DesignationManagement />
    </div>
  );

  const renderRegions = () => (
    <div className="space-y-4">
      <FadeIn delay={0}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Regions</h3>
            <p className="text-sm text-gray-500 mt-1">Geographic regions management</p>
          </div>
          <Button size="sm" onClick={() => handleOpenRegionModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Region
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-3">
        {regions.map((region, index) => (
          <FadeIn key={region.id} delay={index * 50}>
            <div className="pastel-blue-gradient p-4 rounded-xl card-interactive">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold text-gray-900">{region.name}</p>
                    <span className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-0.5 rounded">
                      {region.code}
                    </span>
                  </div>
                  {region.description && (
                    <p className="text-sm text-gray-600">{region.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={region.isActive ? 'success' : 'error'}>
                    {region.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenRegionModal(region)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
  const renderEstates = () => (
    <div className="space-y-4">
      <FadeIn delay={0}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Estates</h3>
            <p className="text-sm text-gray-500 mt-1">Property estates and locations</p>
          </div>
          <Button size="sm" onClick={() => handleOpenEstateModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Estate
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-3">
        {estates.map((estate, index) => (
          <FadeIn key={estate.id} delay={index * 50}>
            <div className="pastel-green-gradient p-4 rounded-xl card-interactive">
              <div className="flex items-start gap-4">
                {estate.images && estate.images.length > 0 && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    <img
                      src={estate.images[0]}
                      alt={estate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold text-gray-900">{estate.name}</p>
                    <span className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-0.5 rounded">
                      {estate.code}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
                      {estate.city}, {estate.state}
                    </span>
                    {estate.region && (
                      <span className="text-xs bg-white/60 px-2 py-0.5 rounded">
                        {estate.region.name}
                      </span>
                    )}
                    {estate.latitude && estate.longitude && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-700">
                        <MapPin size={12} />
                        Geo Located
                      </span>
                    )}
                    {estate.images && estate.images.length > 0 && (
                      <span className="text-xs bg-purple-100 px-2 py-0.5 rounded text-purple-700">
                        {estate.images.length} {estate.images.length === 1 ? 'image' : 'images'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={estate.isActive ? 'success' : 'error'}>
                    {estate.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenEstateModal(estate)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );

  const renderAssetTypes = () => (
    <div className="space-y-4">
      <FadeIn delay={0}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Asset Types</h3>
            <p className="text-sm text-gray-500 mt-1">Configure asset type classifications</p>
          </div>
          <Button size="sm" onClick={() => handleOpenAssetTypeModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset Type
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-3">
        {assetTypes.map((assetType, index) => (
          <FadeIn key={assetType.id} delay={index * 50}>
            <div className="pastel-coral-gradient p-4 rounded-xl card-interactive">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">{assetType.name}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-2">
                    <span className="bg-white/60 px-2 py-0.5 rounded">
                      {assetType.subtype}
                    </span>
                    <span className="bg-white/60 px-2 py-0.5 rounded">
                      {assetType.category}
                    </span>
                  </div>
                  {assetType.description && (
                    <p className="text-sm text-gray-600 mt-2">{assetType.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={assetType.isActive ? 'success' : 'error'}>
                    {assetType.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenAssetTypeModal(assetType)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'modules':
        return renderModules();
      case 'property-types':
        return renderPropertyTypes();
      case 'date-blocks':
        return renderDateBlocks();
      case 'designations':
        return renderDesignations();
      case 'regions':
        return renderRegions();
      case 'estates':
        return renderEstates();
      case 'asset-types':
        return renderAssetTypes();
      default:
        return renderModules();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">
      {/* Frozen hero header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <Settings className="w-7 h-7 text-white" />
              </div>
              System Administration
            </h1>
            <p className="text-gray-600">Manage modules, property types, regions, estates, and asset types</p>
          </div>

          {!loading && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/80 p-3">
              <HorizontalSlider
                items={sliderItems}
                selectedId={activeTab}
                onSelect={setActiveTab}
              />
            </div>
          )}
        </div>
      </div>

      {/* Scrollable data area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : (
            <div className="animate-fadeIn">
              {renderActiveContent()}
            </div>
          )}
        </div>
      </div>

      <RegionFormModal
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        onSave={handleSaveRegion}
        region={selectedRegion}
      />

      <EstateFormModal
        isOpen={isEstateModalOpen}
        onClose={() => setIsEstateModalOpen(false)}
        onSave={handleSaveEstate}
        estate={selectedEstate}
        regions={regions}
      />

      <AssetTypeFormModal
        isOpen={isAssetTypeModalOpen}
        onClose={() => setIsAssetTypeModalOpen(false)}
        onSave={handleSaveAssetType}
        assetType={selectedAssetType}
        modules={modules}
      />
    </div>
  );
};
