import React from 'react';
import { Toggle } from '../ui/Toggle';
import {
  HallDetails, HallBillingItem, HallFacilities,
  DEFAULT_HALL_DETAILS,
} from '../../types';
import {
  Users, UtensilsCrossed, BedDouble, Car, ChefHat,
  Receipt, Zap, Music, Droplets, Shield,
  Camera, Flame, Fan, Thermometer, FileText, Wrench,
  Snowflake,
} from 'lucide-react';

interface HallDetailsTabProps {
  formData: {
    hallDetails: HallDetails;
    name?: string;
    code?: string;
    address?: string;
  };
  updateFormData: (updates: { hallDetails: HallDetails }) => void;
}

const FACILITY_ROWS: { key: keyof HallFacilities; label: string; remark?: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'musicSystem',      label: 'Music System',       remark: '8am – 10pm',         Icon: Music },
  { key: 'waterSupply',      label: 'Water Supply',        remark: 'Full day',            Icon: Droplets },
  { key: 'electricityDG',   label: 'Electricity / DG',   remark: 'Full day',            Icon: Zap },
  { key: 'bathroomFacility', label: 'Bathroom Facility',  remark: 'Full day',            Icon: Wrench },
  { key: 'kitchenAccess',    label: 'Kitchen Access',      remark: 'Full day',            Icon: ChefHat },
  { key: 'centralAC',        label: 'Central AC',          remark: 'On request',          Icon: Thermometer },
  { key: 'cctvMonitoring',   label: 'CCTV Monitoring',    remark: 'Full day',            Icon: Camera },
  { key: 'fireSafetySystem', label: 'Fire Safety System',  remark: 'Full day',            Icon: Flame },
  { key: 'physicalSecurity', label: 'Physical Security',   remark: 'Full day',            Icon: Shield },
  { key: 'fans',             label: 'Fans',                remark: 'Sufficient numbers',  Icon: Fan },
];

export const HallDetailsTab: React.FC<HallDetailsTabProps> = ({ formData, updateFormData }) => {
  const hall = formData.hallDetails ?? DEFAULT_HALL_DETAILS;

  const update = (patch: Partial<HallDetails>) => {
    updateFormData({ hallDetails: { ...hall, ...patch } });
  };

  const updateCapacity = (key: keyof typeof hall.capacity, value: number) => {
    update({ capacity: { ...hall.capacity, [key]: value } });
  };

  const updateBillingItem = (index: number, patch: Partial<HallBillingItem>) => {
    const next = hall.billing.map((item, i) => i === index ? { ...item, ...patch } : item);
    update({ billing: next });
  };

  const updateFacility = (key: keyof HallFacilities, value: boolean) => {
    update({ facilities: { ...hall.facilities, [key]: value } });
  };

  const updateTerms = (key: keyof typeof hall.terms, value: string) => {
    update({ terms: { ...hall.terms, [key]: value } });
  };

  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white transition-colors';
  const sectionHeading = (label: string, sub?: string) => (
    <div className="mb-4">
      <h4 className="text-sm font-bold text-gray-900">{label}</h4>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
  const card = (children: React.ReactNode) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">{children}</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Hall Details</h3>
        <p className="text-sm text-gray-500">
          Enter capacity, itemised charges, available facilities, and standard terms for this hall.
        </p>
      </div>

      {/* ── Capacity ─────────────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Capacity & Infrastructure', 'Physical capacity and room figures for the hall')}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Users size={11} /> Main Hall Seating</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 500"
                value={hall.capacity.mainHallSeating || ''}
                onChange={e => updateCapacity('mainHallSeating', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Numbers</p>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><UtensilsCrossed size={11} /> Dining Capacity</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 200"
                value={hall.capacity.diningCapacity || ''}
                onChange={e => updateCapacity('diningCapacity', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Numbers</p>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><BedDouble size={11} /> Guest Rooms</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 5"
                value={hall.capacity.guestRooms || ''}
                onChange={e => updateCapacity('guestRooms', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Numbers</p>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Snowflake size={11} /> AC Rooms</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 2"
                value={hall.capacity.acRooms ?? ''}
                onChange={e => updateCapacity('acRooms', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Numbers</p>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Fan size={11} /> Non-AC Rooms</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 3"
                value={hall.capacity.nonAcRooms ?? ''}
                onChange={e => updateCapacity('nonAcRooms', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Numbers</p>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Car size={11} /> Two Wheeler Parking</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 100"
                value={hall.capacity.twoWheelerParking || ''}
                onChange={e => updateCapacity('twoWheelerParking', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Numbers</p>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Car size={11} /> Four Wheeler Parking</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 50"
                value={hall.capacity.fourWheelerParking || ''}
                onChange={e => updateCapacity('fourWheelerParking', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Slots</p>
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><ChefHat size={11} /> Kitchen Size</span></label>
              <input type="number" min={0} className={inputCls} placeholder="e.g., 500"
                value={hall.capacity.kitchenSizeSqft || ''}
                onChange={e => updateCapacity('kitchenSizeSqft', parseInt(e.target.value) || 0)} />
              <p className="text-[10px] text-gray-400 mt-1">Sq. Ft</p>
            </div>
          </div>
        </>
      )}

      {/* ── Billing ───────────────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Itemised Billing Master', 'Charges per item — leave amount blank if not applicable')}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 w-6">#</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 pl-2">Charge</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 pl-2 w-40">Amount / Rate</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 pl-2 w-36">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hall.billing.map((item, i) => (
                  <tr key={i} className="group">
                    <td className="py-2 pr-2 text-[10px] text-gray-400 font-mono align-middle">{i + 1}</td>
                    <td className="py-2 pr-2 align-middle">
                      <span className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                        <Receipt size={11} className="text-gray-400 shrink-0" />{item.label}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 align-middle">
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white"
                        placeholder="e.g., 10000"
                        value={item.amount}
                        onChange={e => updateBillingItem(i, { amount: e.target.value })}
                      />
                    </td>
                    <td className="py-1.5 align-middle">
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white"
                        placeholder="unit"
                        value={item.unit}
                        onChange={e => updateBillingItem(i, { unit: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Facilities ────────────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Available Facilities', 'Toggle each facility available at this hall')}
          <div className="divide-y divide-gray-50">
            {FACILITY_ROWS.map(({ key, label, remark, Icon }) => (
              <div key={key} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {remark && <p className="text-[10px] text-gray-400">{remark}</p>}
                  </div>
                </div>
                <Toggle
                  checked={hall.facilities[key]}
                  onChange={val => updateFacility(key, val)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Terms & Conditions ────────────────────────────────── */}
      {card(
        <>
          {sectionHeading('Standard Terms & Conditions')}
          <div className="space-y-4">
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><FileText size={11} /> Cancellation Rules</span></label>
              <textarea
                rows={3} className={inputCls + ' resize-none'}
                placeholder="Describe the cancellation policy…"
                value={hall.terms.cancellationRules}
                onChange={e => updateTerms('cancellationRules', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><FileText size={11} /> Booking Rules</span></label>
              <textarea
                rows={3} className={inputCls + ' resize-none'}
                placeholder="Describe booking rules and restrictions…"
                value={hall.terms.bookingRules}
                onChange={e => updateTerms('bookingRules', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><FileText size={11} /> Terms and Conditions</span></label>
              <textarea
                rows={4} className={inputCls + ' resize-none'}
                placeholder="General terms and conditions of use…"
                value={hall.terms.termsAndConditions}
                onChange={e => updateTerms('termsAndConditions', e.target.value)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
