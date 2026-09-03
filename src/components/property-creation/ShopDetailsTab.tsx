import React from 'react';
import { Toggle } from '../ui/Toggle';
import {
  ShopDetails, DEFAULT_SHOP_DETAILS,
} from '../../types';
import {
  Ruler, Car, Compass, Layers, Droplets, Zap,
  Camera, Flame, Shield, Wifi, Settings, FileText,
  IndianRupee, Percent, CalendarDays, User, Phone, MapPin,
  CreditCard, AtSign, Building2, Hash,
} from 'lucide-react';

interface ShopDetailsTabProps {
  formData: { shopDetails: ShopDetails };
  updateFormData: (updates: { shopDetails: ShopDetails }) => void;
}

const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';
const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-white transition-colors';
const selectCls = inputCls;

const sectionHeading = (label: string, sub?: string) => (
  <div className="mb-4">
    <h4 className="text-sm font-bold text-gray-900">{label}</h4>
    {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const card = (children: React.ReactNode) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">{children}</div>
);

const FACING_OPTIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];

const BOOL_ROWS: { key: keyof ShopDetails; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'roofing',              label: 'Roofing / Shed',              Icon: Layers },
  { key: 'slidingDoors',        label: 'Sliding Doors',               Icon: Settings },
  { key: 'washroomFacility',    label: 'Washroom Facility',           Icon: Droplets },
  { key: 'displayElectricMeter',label: 'Display Electric Meter',      Icon: Zap },
  { key: 'dedicatedConnection', label: 'Dedicated Power Connection',  Icon: Wifi },
  { key: 'photoConnection',     label: 'Photo Connection',            Icon: Camera },
  { key: 'backupGenerator',     label: 'Backup Generator',            Icon: Zap },
  { key: 'waterConnection',     label: 'Water Connection',            Icon: Droplets },
  { key: 'cctvConnection',      label: 'CCTV Connection',             Icon: Camera },
  { key: 'commonMonitoring',    label: 'Common Area Monitoring',      Icon: Shield },
  { key: 'fireSafetySystem',    label: 'Fire Safety System',          Icon: Flame },
];

export const ShopDetailsTab: React.FC<ShopDetailsTabProps> = ({ formData, updateFormData }) => {
  const shop = formData.shopDetails ?? DEFAULT_SHOP_DETAILS;

  const update = (patch: Partial<ShopDetails>) => {
    updateFormData({ shopDetails: { ...shop, ...patch } });
  };

  const numField = (
    key: keyof ShopDetails,
    label: string,
    placeholder: string,
    unit?: string,
    Icon?: React.FC<any>,
    step?: number,
  ) => (
    <div>
      <label className={labelCls}>
        <span className="flex items-center gap-1.5">
          {Icon && <Icon size={11} />} {label}
        </span>
      </label>
      <input
        type="number" min={0} step={step ?? 1}
        className={inputCls}
        placeholder={placeholder}
        value={(shop[key] as number) || ''}
        onChange={e => update({ [key]: parseFloat(e.target.value) || 0 } as Partial<ShopDetails>)}
      />
      {unit && <p className="text-[10px] text-gray-400 mt-1">{unit}</p>}
    </div>
  );

  const textField = (
    key: keyof ShopDetails,
    label: string,
    placeholder: string,
    Icon?: React.FC<any>,
    hint?: string,
  ) => (
    <div>
      <label className={labelCls}>
        <span className="flex items-center gap-1.5">
          {Icon && <Icon size={11} />} {label}
        </span>
      </label>
      <input
        type="text"
        className={inputCls}
        placeholder={placeholder}
        value={(shop[key] as string) || ''}
        onChange={e => update({ [key]: e.target.value } as Partial<ShopDetails>)}
      />
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  const dateField = (
    key: keyof ShopDetails,
    label: string,
    Icon?: React.FC<any>,
  ) => (
    <div>
      <label className={labelCls}>
        <span className="flex items-center gap-1.5">
          {Icon && <Icon size={11} />} {label}
        </span>
      </label>
      <input
        type="date"
        className={inputCls}
        value={(shop[key] as string) || ''}
        onChange={e => update({ [key]: e.target.value } as Partial<ShopDetails>)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Commercial Shop Details</h3>
        <p className="text-sm text-gray-500">
          Enter layout specifications, amenities, and lease / tariff details for this shop unit.
        </p>
      </div>

      {/* ── Basic Layout ─────────────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Shop Layout & Specifications', 'Physical dimensions and layout details')}
          <div className="grid grid-cols-2 gap-4">
            {numField('frontageWidth',  'Frontage Width',      'e.g., 10',   'Feet',    Ruler)}

            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Compass size={11} /> Main Door Facing</span></label>
              <select className={selectCls} value={shop.mainDoorFacing} onChange={e => update({ mainDoorFacing: e.target.value })}>
                <option value="">Select direction…</option>
                {FACING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Layers size={11} /> Floor Details</span></label>
              <input
                type="text" className={inputCls} placeholder="e.g., Ground Floor"
                value={shop.floorDetails}
                onChange={e => update({ floorDetails: e.target.value })}
              />
            </div>

            {numField('twoWheelerParking',  'Two Wheeler Parking',  'e.g., 10', 'Slots', Car)}
            {numField('fourWheelerParking', 'Four Wheeler Parking', 'e.g., 2',  'Slots', Car)}
          </div>
        </>
      )}

      {/* ── Technical Amenities ───────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Standard Shop Amenities', 'Toggle each facility available at this unit')}
          <div className="divide-y divide-gray-50">
            {BOOL_ROWS.map(({ key, label, Icon }) => (
              <div key={key} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-teal-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                </div>
                <Toggle
                  checked={!!shop[key]}
                  onChange={val => update({ [key]: val } as Partial<ShopDetails>)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Lease Financials ──────────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Lease Financials & Tariff Master', 'Rent, deposits and billing parameters')}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}><span className="flex items-center gap-1.5"><FileText size={11} /> Lease / Rent Type</span></label>
              <div className="flex gap-3">
                {(['MONTHLY', 'ANNUAL'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update({ leaseType: opt })}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      shop.leaseType === opt
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    {opt === 'MONTHLY' ? 'Monthly Rent' : 'Annual Lease'}
                  </button>
                ))}
              </div>
            </div>

            {dateField('leaseCommencementDate', 'Lease / Rent Commencement Date', CalendarDays)}
            {dateField('leaseAgreementDate',    'Lease Agreement Date',           CalendarDays)}

            {numField('monthlyRent',               'Monthly Rent',               'e.g., 5000',  '₹ per month',   IndianRupee)}
            {numField('leaseAmount',               'Total Lease Amount',          'e.g., 60000', '₹ total',       IndianRupee)}
            {numField('maintenanceCharges',        'Maintenance Charges',         'e.g., 1000',  '₹ per month',   IndianRupee)}
            {numField('securityDeposit',           'Security Deposit',            'e.g., 10000', '₹ flat',        IndianRupee)}
            {numField('electricityRatePerUnit',    'Electricity Rate / Unit',     'e.g., 0.18',  '₹ per unit',    Zap, 0.01)}
            {numField('electricityPaymentPercent', 'Electricity Payment %',       'e.g., 2',     '% of bill',     Percent)}
            {numField('latePaymentPercent',        'Late Payment Penalty',        'e.g., 2',     '% per month',   Percent)}
            {numField('rentLeasePeriodYears',      'Lease Period',                'e.g., 11',    'Years',         CalendarDays)}
            {numField('escalationPercent',         'Rent Escalation',             'e.g., 6',     '% per year',    Percent)}
            {numField('vacancyNoticePeriodDays',   'Vacancy Notice Period',       'e.g., 30',    'Days',          CalendarDays)}

            <div className="col-span-2 flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">GST Applicable</p>
                <p className="text-[10px] text-gray-400">Toggle and enter the applicable GST percentage</p>
              </div>
              <Toggle checked={shop.gstApplicable} onChange={val => update({ gstApplicable: val })} />
            </div>

            {shop.gstApplicable && (
              <div className="col-span-2">
                {numField('gstPercentage', 'GST Percentage', 'e.g., 18', '%', Percent)}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Lease Terms & Vendor ─────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Standard Lease Terms & Conditions')}
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><FileText size={11} /> Standard Lease Terms</span></label>
            <textarea
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Describe the standard lease terms and conditions…"
              value={shop.standardLeaseTerms}
              onChange={e => update({ standardLeaseTerms: e.target.value })}
            />
          </div>
        </>
      )}

      {/* ── Vendor / Company Details ─────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Vendor / Company Details', 'Details of the current tenant or lessee')}
          <div className="grid grid-cols-2 gap-4">
            {textField('vendorName',    'Vendor / Company Name',      'Full name or firm name',     User)}
            {textField('vendorContact', 'Contact Number',             'e.g., 9876543210',           Phone)}
            {textField('vendorPanNo',   'PAN Number',                 'e.g., ABCDE1234F',           CreditCard, '10-character PAN')}
            {textField('vendorAadhaar', 'Aadhaar (Authorized Person)','12-digit Aadhaar number',    Hash)}
            {textField('vendorGstNo',   'GST Number',                 'e.g., 27ABCDE1234F1Z5',      Building2)}
            {textField('vendorEmail',   'Company Email ID',           'e.g., company@example.com',  AtSign)}
            <div className="col-span-2">
              {textField('vendorTempAddress', 'Temporary Address', 'Current / temporary address of vendor', MapPin)}
            </div>
            <div className="col-span-2">
              {textField('vendorAddress', 'Permanent Address', 'Permanent address of vendor / company', MapPin)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
