import React, { useEffect, useState } from 'react';
import { Select } from '../ui/Select';
import { propertyService } from '../../services/propertyService';
import { ModuleDTO, PropertyTypeDTO, RegionDTO } from '../../types';
import { Toggle } from '../ui/Toggle';
import { FormLoadingSkeleton } from '../ui/LoadingSkeleton';
import {
  AlertCircle, CheckCircle, Building2, MapPin, Phone, User,
  Store, Ruler, Tag, AreaChart,
} from 'lucide-react';
import { isHallPropertyType, isShopPropertyType } from '../../utils/moduleHelpers';
import { SHOP_TYPE_OPTIONS } from '../../types';

interface BasicInfoTabProps {
  formData: {
    name: string;
    code: string;
    moduleId: string | null;
    propertyTypeId: string | null;
    propertyTypeCode?: string | null;
    assetTypeId: string | null;
    isExempt: boolean;
    description: string;
    region: string;
    sector: string;
    state: string;
    district: string;
    landmark: string;
    inchargeName: string;
    contactDetails: string;
    shopType: string;
    totalAreaSqft: number;
    auxiliaryAreaSqft: number;
  };
  updateFormData: (updates: any) => void;
}

const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';
const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors';
const hintCls = 'text-xs text-gray-500 mt-1';
const errorCls = 'text-xs text-red-600 mt-1';

const SectionCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
    <div className="mb-2">
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ formData, updateFormData }) => {
  const [modules, setModules] = useState<ModuleDTO[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDTO[]>([]);
  const [regions, setRegions] = useState<RegionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);
  const [error, setError] = useState<string>('');
  const [codeValidation, setCodeValidation] = useState<{ checking: boolean; exists: boolean; error: string }>({
    checking: false, exists: false, error: '',
  });
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const isHall = isHallPropertyType(formData.propertyTypeCode);
  const isShop = isShopPropertyType(formData.propertyTypeCode);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (formData.moduleId) {
      loadPropertyTypes(formData.moduleId);
    } else {
      setPropertyTypes([]);
    }
  }, [formData.moduleId]);

  const loadInitialData = async () => {
    try {
      setError('');
      const [modulesData, regionsData] = await Promise.all([
        propertyService.getModules(),
        propertyService.getRegions(),
      ]);
      // Filter out Quarters module — not applicable to property creation
      setModules(modulesData.filter(m => !m.name.toLowerCase().includes('quarter')));
      setRegions(regionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const loadPropertyTypes = async (moduleId: string) => {
    try {
      setLoadingPropertyTypes(true);
      setPropertyTypes(await propertyService.getPropertyTypes(moduleId));
    } catch (err: any) {
      setError(err.message || 'Failed to load property types.');
    } finally {
      setLoadingPropertyTypes(false);
    }
  };

  const handleModuleChange = (moduleId: string) => {
    updateFormData({ moduleId: moduleId || null, propertyTypeId: null, propertyTypeCode: null });
  };

  const handleBlur = (field: string) => setTouchedFields(prev => ({ ...prev, [field]: true }));
  const showErr = (field: string, value: any) => touchedFields[field] && !value;

  useEffect(() => {
    if (!formData.code || formData.code.length < 2) {
      setCodeValidation({ checking: false, exists: false, error: '' });
      return;
    }
    const timerId = setTimeout(async () => {
      setCodeValidation({ checking: true, exists: false, error: '' });
      try {
        const exists = await propertyService.checkPropertyCodeExists(formData.code);
        setCodeValidation({ checking: false, exists, error: '' });
      } catch {
        setCodeValidation({ checking: false, exists: false, error: 'Validation failed' });
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [formData.code]);

  if (loading) return <FormLoadingSkeleton />;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">General & Basic Information</h3>
        <p className="text-sm text-gray-500">
          Fields marked <span className="text-red-500 font-medium">*</span> are required.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={loadInitialData} className="mt-1 text-xs text-red-600 underline">Retry</button>
          </div>
        </div>
      )}

      {/* ── Property Classification ───────────────────────────── */}
      <SectionCard title="Property Classification" subtitle="Select the module and type before filling other details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Module <span className="text-red-500">*</span></label>
            <Select
              value={formData.moduleId || ''}
              onChange={e => handleModuleChange(e.target.value)}
              onBlur={() => handleBlur('moduleId')}
              disabled={loading}
              className={showErr('moduleId', formData.moduleId) ? 'border-red-300' : ''}
            >
              <option value="">Select module…</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
            {showErr('moduleId', formData.moduleId)
              ? <p className={errorCls}>Module is required</p>
              : <p className={hintCls}>Choose the category of facility</p>}
          </div>

          <div>
            <label className={labelCls}>Property Type <span className="text-red-500">*</span></label>
            <Select
              value={formData.propertyTypeId || ''}
              onChange={e => {
                const selected = propertyTypes.find(t => t.id === e.target.value);
                updateFormData({ propertyTypeId: e.target.value || null, propertyTypeCode: selected?.code || null });
              }}
              onBlur={() => handleBlur('propertyTypeId')}
              disabled={!formData.moduleId || loadingPropertyTypes}
              className={showErr('propertyTypeId', formData.propertyTypeId) ? 'border-red-300' : ''}
            >
              <option value="">{!formData.moduleId ? 'Select module first…' : 'Select property type…'}</option>
              {propertyTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            {showErr('propertyTypeId', formData.propertyTypeId)
              ? <p className={errorCls}>Property type is required</p>
              : <p className={hintCls}>{loadingPropertyTypes ? 'Loading types…' : 'Select module first'}</p>}
          </div>
        </div>
      </SectionCard>

      {/* ── Property Identity ─────────────────────────────────── */}
      <SectionCard
        title="Property Identity"
        subtitle={isShop ? 'Shop code and unit name' : 'Unique code and display name for this property'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              {isShop ? 'Shop Code' : 'Property Code'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className={`${inputCls} pr-9 ${
                  codeValidation.exists || showErr('code', formData.code)
                    ? 'border-red-400 focus:border-red-400'
                    : formData.code && !codeValidation.checking && !codeValidation.exists
                    ? 'border-green-400 focus:border-green-400'
                    : ''
                }`}
                value={formData.code}
                onChange={e => updateFormData({ code: e.target.value.toUpperCase() })}
                onBlur={() => handleBlur('code')}
                placeholder={isShop ? 'e.g., CS-BCL-001' : isHall ? 'e.g., MH-BCL-001' : 'e.g., GH-001'}
              />
              {codeValidation.checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              )}
              {!codeValidation.checking && formData.code && !codeValidation.exists && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
              {!codeValidation.checking && codeValidation.exists && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              )}
            </div>
            {codeValidation.exists
              ? <p className={errorCls}>This code already exists</p>
              : showErr('code', formData.code)
              ? <p className={errorCls}>Code is required</p>
              : <p className={hintCls}>Unique identifier — auto-uppercased</p>}
          </div>

          <div>
            <label className={labelCls}>
              {isShop ? 'Shop / Unit Name' : 'Property Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`${inputCls} ${showErr('name', formData.name) ? 'border-red-400' : ''}`}
              value={formData.name}
              onChange={e => updateFormData({ name: e.target.value })}
              onBlur={() => handleBlur('name')}
              placeholder={
                isShop ? 'e.g., Bacheli General Store Unit-01'
                : isHall ? 'e.g., Narmada Marriage Hall'
                : 'e.g., Delhi Circuit House'
              }
            />
            {showErr('name', formData.name)
              ? <p className={errorCls}>Name is required</p>
              : <p className={hintCls}>Full display name</p>}
          </div>
        </div>
      </SectionCard>

      {/* ── Administrative Location ───────────────────────────── */}
      <SectionCard
        title="Administrative Location"
        subtitle="Region, sector, state and district as per master data records"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><MapPin size={11} />Region</span>
            </label>
            {regions.length > 0 ? (
              <Select
                value={formData.region}
                onChange={e => updateFormData({ region: e.target.value })}
              >
                <option value="">Select region…</option>
                {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </Select>
            ) : (
              <input
                type="text" className={inputCls} placeholder="e.g., Bacheli"
                value={formData.region}
                onChange={e => updateFormData({ region: e.target.value })}
              />
            )}
            <p className={hintCls}>NMDC mining region / project area</p>
          </div>
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Tag size={11} />Sector</span>
            </label>
            <input
              type="text" className={inputCls} placeholder="e.g., Sector 2"
              value={formData.sector}
              onChange={e => updateFormData({ sector: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input
              type="text" className={inputCls} placeholder="e.g., Chhattisgarh"
              value={formData.state}
              onChange={e => updateFormData({ state: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>District</label>
            <input
              type="text" className={inputCls} placeholder="e.g., Dantewada"
              value={formData.district}
              onChange={e => updateFormData({ district: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Building2 size={11} />Location / Landmark</span>
            </label>
            <input
              type="text" className={inputCls}
              placeholder="e.g., Near SBI bank, opp KV school"
              value={formData.landmark}
              onChange={e => updateFormData({ landmark: e.target.value })}
            />
            <p className={hintCls}>Short landmark reference — separate from the full address</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Hall contact + Auxiliary Area ─────────────────────── */}
      {isHall && (
        <SectionCard title="Contact Details & Area" subtitle="Incharge contact and auxiliary area for this hall">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><User size={11} />Incharge Name</span>
              </label>
              <input
                type="text" className={inputCls} placeholder="e.g., Shri R.K. Sharma"
                value={formData.inchargeName}
                onChange={e => updateFormData({ inchargeName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Phone size={11} />Contact Number / Email</span>
              </label>
              <input
                type="text" className={inputCls} placeholder="e.g., 02321-2784939"
                value={formData.contactDetails}
                onChange={e => updateFormData({ contactDetails: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><AreaChart size={11} />Auxiliary Area (Sq. Ft)</span>
              </label>
              <input
                type="number" min={0} className={inputCls} placeholder="e.g., 5000"
                value={formData.auxiliaryAreaSqft || ''}
                onChange={e => updateFormData({ auxiliaryAreaSqft: parseInt(e.target.value) || 0 })}
              />
              <p className={hintCls}>Total auxiliary / surrounding area in square feet</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Shop basic specs ──────────────────────────────────── */}
      {isShop && (
        <SectionCard title="Shop Specifications" subtitle="Type of business and total floor area">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Store size={11} />Type of Shop</span>
              </label>
              <select
                className={inputCls}
                value={formData.shopType}
                onChange={e => updateFormData({ shopType: e.target.value })}
              >
                <option value="">Select shop type…</option>
                {SHOP_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Ruler size={11} />Total Area (Sq. Ft)</span>
              </label>
              <input
                type="number" min={0} className={inputCls} placeholder="e.g., 600"
                value={formData.totalAreaSqft || ''}
                onChange={e => updateFormData({ totalAreaSqft: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Description ───────────────────────────────────────── */}
      <SectionCard title="Description">
        <textarea
          value={formData.description}
          onChange={e => updateFormData({ description: e.target.value })}
          placeholder="Provide a brief description of this property…"
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </SectionCard>

      {/* ── Exempt toggle ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <div>
          <p className="text-sm font-semibold text-gray-900">Exempt from Booking Rules</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Enable if this property should bypass standard booking restrictions
          </p>
        </div>
        <Toggle
          checked={formData.isExempt}
          onChange={checked => updateFormData({ isExempt: checked })}
        />
      </div>
    </div>
  );
};
