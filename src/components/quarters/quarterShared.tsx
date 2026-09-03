import React from 'react';
import {
  CheckCircle, XCircle, ChevronDown, MapPin, Paperclip,
  Phone, Mail, CreditCard, UserCheck, UserPlus,
  Clock, Send, ThumbsUp, ThumbsDown, RefreshCw, ArrowRightCircle,
  LogOut, ArrowLeftRight, AlertTriangle, Ruler,
} from 'lucide-react';
import { Quarter, QuarterRequest } from '../../services/quartersService';
import type { MedicalCriticality } from '../../types/quarters';
import { UserDTO } from '../../types';

export const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
];

export function parseQuarterImages(q: Quarter): string[] {
  let images: unknown = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images as string); } catch {
      images = (images as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) return images as string[];
  return PLACEHOLDER_IMAGES;
}

export function getImage(q: Quarter, idx: number) {
  const imgs = parseQuarterImages(q);
  return imgs[0] !== PLACEHOLDER_IMAGES[0] ? imgs[0] : PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}

export function resolveAllImages(q: Quarter): string[] {
  return parseQuarterImages(q);
}

export function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN'); }

export function statusAccentColor(status: string): string {
  if (status === 'DRAFT') return 'bg-amber-400';
  if (status === 'SUBMITTED') return 'bg-blue-500';
  if (status === 'ALLOTTED' || status === 'UPGRADE_REQUESTED') return 'bg-emerald-500';
  if (status === 'ACKNOWLEDGED') return 'bg-teal-500';
  if (status === 'EXTEND_REQUESTED' || status === 'VACATE_REQUESTED') return 'bg-orange-400';
  if (status === 'EXCHANGE_REQUESTED') return 'bg-teal-400';
  if (status === 'VACATED' || status === 'WITHDRAWN' || status === 'REJECTED') return 'bg-gray-300';
  return 'bg-gray-300';
}

export const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  DRAFT:              { label: 'Draft',           cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <Clock size={11} /> },
  SUBMITTED:         { label: 'Submitted',        cls: 'bg-blue-50 text-blue-700 border border-blue-200',       icon: <Send size={11} /> },
  ALLOTTED:          { label: 'Allotted',         cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={11} /> },
  ACKNOWLEDGED:      { label: 'Occupied',         cls: 'bg-teal-50 text-teal-700 border border-teal-200',       icon: <ThumbsUp size={11} /> },
  REJECTED:          { label: 'Rejected',         cls: 'bg-red-50 text-red-700 border border-red-200',          icon: <ThumbsDown size={11} /> },
  EXTEND_REQUESTED:   { label: 'Extension Req.',  cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
  UPGRADE_REQUESTED:  { label: 'Upgrade Req.',    cls: 'bg-sky-50 text-sky-700 border border-sky-200',          icon: <ArrowRightCircle size={11} /> },
  VACATE_REQUESTED:   { label: 'Vacate Req.',     cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <LogOut size={11} /> },
  EXCHANGE_REQUESTED: { label: 'Exchange Req.',   cls: 'bg-teal-50 text-teal-700 border border-teal-200',       icon: <ArrowLeftRight size={11} /> },
  VACATED:           { label: 'Vacated',          cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
  WITHDRAWN:         { label: 'Withdrawn',        cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
  ON_HOLD:           { label: 'On Hold',          cls: 'bg-slate-50 text-slate-700 border border-slate-200',    icon: <Clock size={11} /> },
};
export function statusConfig(status: string) { return STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT; }

export const TENANT_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border border-red-200' },
  WITHDRAWN: { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};
export function tenantStatusConfig(status: string) { return TENANT_STATUS_CONFIG[status] ?? TENANT_STATUS_CONFIG.PENDING; }

export const SERVICE_TYPE_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  EXTEND:      { label: 'Extension',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',   icon: <RefreshCw size={11} /> },
  UPGRADE:     { label: 'Upgrade',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',          icon: <ArrowRightCircle size={11} /> },
  VACATE:      { label: 'Vacate',      cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <LogOut size={11} /> },
  GRIEVANCE:   { label: 'Grievance',   cls: 'bg-rose-50 text-rose-700 border border-rose-200',       icon: <XCircle size={11} /> },
  MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-50 text-slate-700 border border-slate-200',    icon: <RefreshCw size={11} /> },
  EXCHANGE:    { label: 'Exchange',    cls: 'bg-teal-50 text-teal-700 border border-teal-200',       icon: <ArrowLeftRight size={11} /> },
};
export function serviceTypeConfig(type: string) { return SERVICE_TYPE_CONFIG[type] ?? SERVICE_TYPE_CONFIG.EXTEND; }

export const ALLOTTED_STATUSES = ['ALLOTTED', 'UPGRADE_REQUESTED'] as const;
export const OCCUPIED_STATUSES = ['ACKNOWLEDGED', 'EXTEND_REQUESTED', 'VACATE_REQUESTED', 'EXCHANGE_REQUESTED'] as const;
export const ACCEPTED_STATUSES = [...ALLOTTED_STATUSES, ...OCCUPIED_STATUSES] as const;

export function isAllottedStatus(s: string) { return (ALLOTTED_STATUSES as readonly string[]).includes(s); }
export function isOccupiedStatus(s: string) { return (OCCUPIED_STATUSES as readonly string[]).includes(s); }
export function isAcceptedStatus(s: string) { return (ACCEPTED_STATUSES as readonly string[]).includes(s); }

export function getRequestForBadgeCls(rf: string) {
  return rf === 'SELF' ? 'bg-teal-50 text-teal-700' : rf === 'EMPLOYEE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700';
}
export function getRequestForLabel(rf: string) {
  return rf === 'SELF' ? 'Self' : rf === 'EMPLOYEE' ? 'On Behalf' : 'Third Party';
}

export const ChatBubble = ({ chat, isSelf, roleLabel }: {
  chat: { id: string; message: string; author_role: string; document_urls: string[]; created_at: string };
  isSelf: boolean;
  roleLabel?: string;
}) => (
  <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[82%] rounded-xl px-3 py-2 ${
      isSelf ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
    }`}>
      {!isSelf && roleLabel && (
        <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{roleLabel}</div>
      )}
      <p className="text-[12px] leading-snug whitespace-pre-wrap break-words">{chat.message}</p>
      {chat.document_urls?.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {chat.document_urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${isSelf ? 'text-teal-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'}`}>
              <Paperclip size={9} />Attachment {i + 1}
            </a>
          ))}
        </div>
      )}
      <div className={`text-[9px] mt-1 text-right ${isSelf ? 'text-teal-200/70' : 'text-gray-400'}`}>
        {new Date(chat.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  </div>
);

export const CompactQuarterRow = ({ q, accentCls }: { q: Quarter; accentCls: string }) => {
  const img = getImage(q, 0);
  const occLabel = q.occupancy_status === 'OCCUPIED' ? 'Occupied' : q.occupancy_status === 'AVAILABLE' ? 'Available' : q.occupancy_status;
  return (
    <div className="flex items-stretch gap-2.5 px-3.5 py-2 border-b border-gray-100 bg-white">
      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        <img src={img} alt={q.quarter_number} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-gray-900 text-xs">{q.quarter_number}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${accentCls}`}>{occLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-gray-500">
          <span className="font-medium text-gray-600 bg-gray-100 border border-gray-200 px-1 py-0.5 rounded">{q.bhk_config}</span>
          <span className="flex items-center gap-0.5"><Ruler size={8} />{q.area_sqft} sq.ft</span>
          {q.furnishing_status && <span className="hidden sm:inline">{q.furnishing_status}</span>}
        </div>
        <div className="text-[10px] text-gray-500 truncate">{q.address ?? `Block ${q.block_name}, Fl. ${q.floor_number}`}</div>
      </div>
      <div className="flex flex-col items-end justify-center shrink-0">
        <span className="text-xs font-bold text-gray-900">{fmtINR(q.monthly_rent)}</span>
        <span className="text-[9px] text-gray-400 font-normal">/mo</span>
      </div>
    </div>
  );
};

export const QuarterSummaryPanel = ({ q }: { q: Quarter }) => {
  const [expanded, setExpanded] = React.useState(false);

  const boolChip = (val: boolean, label: string, trueColor: string, falseColor: string) =>
    val ? (
      <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trueColor}`}>
        <CheckCircle size={9} /> {label}
      </span>
    ) : (
      <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${falseColor}`}>
        <XCircle size={9} /> {label}
      </span>
    );

  const fieldRow = (label: string, value: string | number | null | undefined) => {
    if (!value && value !== 0) return null;
    return (
      <div key={label} className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide leading-tight">{label}</span>
        <span className="text-xs font-semibold text-gray-800 mt-0.5 leading-snug">{value}</span>
      </div>
    );
  };

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-white">
      <div className="grid grid-cols-3 gap-2 mb-3">
        {fieldRow('Unit No.', q.unit_number || q.quarter_number)}
        {fieldRow('Quarter Type', q.quarter_type)}
        {fieldRow('Block', q.block_name)}
        {fieldRow('Floor', q.floor_number > 0 ? `${q.floor_number}${q.total_floors > 0 ? ` of ${q.total_floors}` : ''}` : null)}
        {fieldRow('BHK Config', q.bhk_config)}
        {fieldRow('Housing Style', q.housing_style)}
      </div>

      {(q.location_area || q.region || q.district) && (
        <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            {[q.location_area, q.district, q.region, q.pin_code].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="col-span-1 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
          <div className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Monthly Rent</div>
          <div className="text-sm font-bold text-blue-900 mt-0.5">{fmtINR(q.monthly_rent)}</div>
        </div>
        {q.electricity_rate > 0 && (
          <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            <div className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Elect. Rate</div>
            <div className="text-xs font-bold text-amber-900 mt-0.5">₹{q.electricity_rate}/unit</div>
          </div>
        )}
        {q.water_charges > 0 && (
          <div className="bg-cyan-50 rounded-lg px-3 py-2 border border-cyan-100">
            <div className="text-[10px] text-cyan-500 font-medium uppercase tracking-wide">Water</div>
            <div className="text-xs font-bold text-cyan-900 mt-0.5">{fmtINR(q.water_charges)}/mo</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {boolChip(q.balcony, 'Balcony', 'bg-green-50 text-green-700 border-green-200', 'bg-gray-50 text-gray-400 border-gray-200')}
        {boolChip(q.pooja_room, 'Pooja Room', 'bg-orange-50 text-orange-700 border-orange-200', 'bg-gray-50 text-gray-400 border-gray-200')}
        {boolChip(q.lift_access, 'Lift Access', 'bg-teal-50 text-teal-700 border-teal-200', 'bg-gray-50 text-gray-400 border-gray-200')}
        {boolChip(q.power_backup, 'Power Backup', 'bg-yellow-50 text-yellow-700 border-yellow-200', 'bg-gray-50 text-gray-400 border-gray-200')}
        {boolChip(q.kitchen_exhaust, 'Kitchen Exhaust', 'bg-slate-50 text-slate-700 border-slate-200', 'bg-gray-50 text-gray-400 border-gray-200')}
        {q.toilet_western && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
            <CheckCircle size={9} /> Western Toilet
          </span>
        )}
        {q.toilet_indian && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
            <CheckCircle size={9} /> Indian Toilet
          </span>
        )}
      </div>

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors py-1"
      >
        <span>{expanded ? 'Show less' : 'Show all details'}</span>
        <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {fieldRow('Quota', q.quota)}
            {fieldRow('Counter No.', q.counter_no)}
            {fieldRow('Resident Type', q.resident_type)}
            {fieldRow('Facing', q.facing)}
            {fieldRow('Total Area', q.total_area_sqft > 0 ? `${q.total_area_sqft} sq.ft` : null)}
            {fieldRow('Unit Area', `${q.area_sqft} sq.ft`)}
            {fieldRow('Water Heating', q.water_heating)}
            {fieldRow('Renovation', q.renovation_status)}
            {fieldRow('Elec. Fixtures', q.electrical_fixtures)}
            {fieldRow('Avail. Status', q.current_availability_status || q.occupancy_status)}
          </div>

          {q.parking_details && (
            <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Parking</div>
              <div className="text-xs text-gray-700 leading-relaxed">{q.parking_details}</div>
            </div>
          )}

          {q.penalty_terms && (
            <div className="bg-red-50 rounded-lg px-3 py-2.5 border border-red-100">
              <div className="text-[10px] text-red-400 font-medium uppercase tracking-wide mb-1">Penalty Terms</div>
              <div className="text-xs text-red-800 leading-relaxed">{q.penalty_terms}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RequestSummaryBlock = ({ req, user }: { req: QuarterRequest; user: UserDTO | null }) => {
  const reqPrefs = req.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];
  const rf = req.request_for ?? 'SELF';
  return (
    <div className="px-5 py-4 border-b border-gray-100 space-y-3">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Request Summary</div>

      <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-800 leading-tight">{user?.fullName ?? '—'}</div>
            <div className="text-[10px] text-gray-400">{user?.govtEmployeeId ?? user?.email ?? '—'}</div>
          </div>
          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${getRequestForBadgeCls(rf)}`}>
            {getRequestForLabel(rf)}
          </span>
        </div>
        {user?.govtDepartment && <div className="text-[10px] text-gray-500">{user.govtDepartment}</div>}
      </div>

      {rf === 'EMPLOYEE' && req.on_behalf_employee_name && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 px-3 py-2.5">
          <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><UserCheck size={10} />Requested For (Employee)</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {req.on_behalf_employee_name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-900">{req.on_behalf_employee_name}</div>
              <div className="text-[10px] text-blue-500">{req.on_behalf_employee_id}{req.on_behalf_employee_dept ? ` · ${req.on_behalf_employee_dept}` : ''}</div>
            </div>
          </div>
        </div>
      )}

      {rf === 'TP' && req.tp_name && (
        <div className="bg-amber-50 rounded-xl border border-amber-100 px-3 py-2.5 space-y-1.5">
          <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1"><UserPlus size={10} />Third Party Beneficiary</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {req.tp_name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-900">{req.tp_name}</div>
              {req.tp_organization && <div className="text-[10px] text-amber-600">{req.tp_organization}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {req.tp_mobile && <div className="flex items-center gap-1 text-[10px] text-amber-700"><Phone size={9} />{req.tp_mobile}</div>}
            {req.tp_email && <div className="flex items-center gap-1 text-[10px] text-amber-700 truncate"><Mail size={9} />{req.tp_email}</div>}
            {req.tp_pan && <div className="flex items-center gap-1 text-[10px] text-amber-700"><CreditCard size={9} />PAN: {req.tp_pan}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 col-span-2">
          <div className="text-[10px] text-gray-400 mb-0.5">Request Reason</div>
          <div className="font-semibold text-gray-800">{req.request_reason || '—'}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">BHK Required</div>
          <div className="font-semibold text-gray-800">{req.required_bhk_config || '—'}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Pref. Location</div>
          <div className="font-semibold text-gray-800 truncate">{req.preferred_location || '—'}</div>
        </div>
        {req.move_in_date && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <div className="text-[10px] text-gray-400 mb-0.5">Move-in Date</div>
            <div className="font-semibold text-gray-800">{fmtDate(req.move_in_date)}</div>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Family Members</div>
          <div className="font-semibold text-gray-800">{req.family_member_count ?? 1}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Requested On</div>
          <div className="font-semibold text-gray-800">{fmtDate(req.created_at)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Preferences</div>
          <div className="font-semibold text-gray-800">{reqPrefs.length} submitted</div>
        </div>
        {req.sub_status && (
          <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100 col-span-2">
            <div className="text-[10px] text-red-400 mb-0.5">Sub Status</div>
            <div className="font-semibold text-red-700">{req.sub_status}</div>
          </div>
        )}
        {req.request_type === 'MEDICAL' && (() => {
          const crit = (req as QuarterRequest & { medical_criticality?: MedicalCriticality | null }).medical_criticality ?? null;
          const clsMap: Record<MedicalCriticality, string> = {
            HIGH:   'bg-red-50 border-red-200 text-red-700',
            MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700',
            LOW:    'bg-emerald-50 border-emerald-200 text-emerald-700',
          };
          return (
            <div className={`rounded-lg px-3 py-2 border col-span-2 flex items-center gap-2 ${crit ? clsMap[crit] : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              <AlertTriangle size={12} className={crit === 'HIGH' ? 'text-red-500' : crit === 'MEDIUM' ? 'text-amber-500' : crit === 'LOW' ? 'text-emerald-500' : 'text-gray-400'} />
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">Medical Criticality</div>
                <div className="font-semibold text-sm">{crit ?? <span className="text-gray-400 font-normal text-xs italic">Not assessed</span>}</div>
              </div>
            </div>
          );
        })()}
      </div>
      {req.employee_notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs">
          <div className="text-[10px] text-amber-500 font-semibold mb-0.5 flex items-center gap-1"><Paperclip size={9} />Employee Notes</div>
          <div className="text-amber-900">{req.employee_notes}</div>
        </div>
      )}
    </div>
  );
};
