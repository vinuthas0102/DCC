import React from 'react';
import {
  HallDetails, HallFacilities,
} from '../../types';
import {
  Users, UtensilsCrossed, BedDouble, Car, ChefHat,
  Phone, Receipt, Zap, Music, Droplets, Shield,
  Camera, Flame, Fan, Thermometer, FileText, Wrench,
  CheckCircle, XCircle,
} from 'lucide-react';

interface HallDetailsDisplayProps {
  hall: HallDetails;
  hallCode?: string;
}

const FACILITY_ROWS: {
  key: keyof HallFacilities;
  label: string;
  remark?: string;
  Icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { key: 'musicSystem',      label: 'Music System',       remark: '8am – 10pm',         Icon: Music },
  { key: 'waterSupply',      label: 'Water Supply',        remark: 'Full day',            Icon: Droplets },
  { key: 'electricityDG',    label: 'Electricity / DG',   remark: 'Full day',            Icon: Zap },
  { key: 'bathroomFacility', label: 'Bathroom Facility',   remark: 'Full day',            Icon: Wrench },
  { key: 'kitchenAccess',    label: 'Kitchen Access',      remark: 'Full day',            Icon: ChefHat },
  { key: 'centralAC',        label: 'Central AC',          remark: 'On request',          Icon: Thermometer },
  { key: 'cctvMonitoring',   label: 'CCTV Monitoring',     remark: 'Full day',            Icon: Camera },
  { key: 'fireSafetySystem', label: 'Fire Safety System',  remark: 'Full day',            Icon: Flame },
  { key: 'physicalSecurity', label: 'Physical Security',   remark: 'Full day',            Icon: Shield },
  { key: 'fans',             label: 'Fans',                remark: 'Sufficient numbers',  Icon: Fan },
];

const CAPACITY_ROWS: {
  key: keyof HallDetails['capacity'];
  label: string;
  unit: string;
  Icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { key: 'mainHallSeating',    label: 'Main Hall Seating',     unit: 'seats',   Icon: Users },
  { key: 'diningCapacity',     label: 'Dining Capacity',       unit: 'covers',  Icon: UtensilsCrossed },
  { key: 'guestRooms',         label: 'Guest Rooms',           unit: 'rooms',   Icon: BedDouble },
  { key: 'twoWheelerParking',  label: '2-Wheeler Parking',     unit: 'slots',   Icon: Car },
  { key: 'fourWheelerParking', label: '4-Wheeler Parking',     unit: 'slots',   Icon: Car },
  { key: 'kitchenSizeSqft',    label: 'Kitchen Size',          unit: 'sq.ft',   Icon: ChefHat },
];

export const HallDetailsDisplay: React.FC<HallDetailsDisplayProps> = ({ hall, hallCode }) => {
  const card = (children: React.ReactNode) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">{children}</div>
  );
  const sectionTitle = (label: string) => (
    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">{label}</h4>
  );

  return (
    <div className="space-y-4">

      {/* Hall Code + Contact */}
      {(hallCode || hall.contactDetails) && card(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hallCode && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hall Code</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{hallCode}</p>
            </div>
          )}
          {hall.contactDetails && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Phone size={10} /> Contact
              </p>
              <p className="text-sm font-medium text-gray-900">{hall.contactDetails}</p>
            </div>
          )}
        </div>
      )}

      {/* Capacity */}
      {card(
        <>
          {sectionTitle('Capacity & Other Details')}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CAPACITY_ROWS.map(({ key, label, unit, Icon }) => {
              const val = hall.capacity[key];
              return (
                <div
                  key={key}
                  className="flex items-start gap-2.5 p-3 bg-blue-50/60 border border-blue-100 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">{label}</p>
                    <p className="text-lg font-black text-gray-900 leading-tight">{val > 0 ? val.toLocaleString() : '—'}</p>
                    <p className="text-[9px] text-gray-400">{unit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Billing */}
      {hall.billing.some(b => b.amount) && card(
        <>
          {sectionTitle('Itemised Billing Master')}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 w-6">#</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 pl-2">Description</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 pl-4">Rate</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 pl-2">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hall.billing.map((item, i) => (
                  <tr key={i} className={item.amount ? '' : 'opacity-40'}>
                    <td className="py-2 pr-2 text-[10px] text-gray-400 font-mono align-middle">{i + 1}</td>
                    <td className="py-2 pr-4 align-middle">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-800">
                        <Receipt size={10} className="text-gray-400 shrink-0" />{item.label}
                      </span>
                    </td>
                    <td className="py-2 pl-4 pr-2 align-middle">
                      {item.amount ? (
                        <span className="text-xs font-bold text-gray-900">
                          {item.amount.match(/^\d/) ? `₹${item.amount}` : item.amount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 align-middle">
                      <span className="text-[11px] text-gray-500">{item.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Facilities */}
      {card(
        <>
          {sectionTitle('Available Facilities')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {FACILITY_ROWS.map(({ key, label, remark, Icon }) => {
              const available = hall.facilities[key];
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                    available
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${available ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                    <Icon size={13} className={available ? 'text-emerald-700' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${available ? 'text-emerald-900' : 'text-gray-600'}`}>{label}</p>
                    {remark && <p className="text-[10px] text-gray-400">{remark}</p>}
                  </div>
                  {available
                    ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    : <XCircle size={14} className="text-gray-400 shrink-0" />
                  }
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Terms */}
      {(hall.terms.cancellationRules || hall.terms.bookingRules || hall.terms.termsAndConditions) && card(
        <>
          {sectionTitle('Standard Terms & Conditions')}
          <div className="space-y-4">
            {hall.terms.cancellationRules && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cancellation Rules</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  {hall.terms.cancellationRules}
                </p>
              </div>
            )}
            {hall.terms.bookingRules && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Booking Rules</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  {hall.terms.bookingRules}
                </p>
              </div>
            )}
            {hall.terms.termsAndConditions && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Terms & Conditions</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  {hall.terms.termsAndConditions}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
