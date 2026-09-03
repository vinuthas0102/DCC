import React from 'react';
import { Search } from 'lucide-react';
import { MandatorySearchBar } from '../../ui/MandatorySearchBar';
import type { QuarterRequest, Quarter, MedicalCriticality } from '../../../services/quartersService';

function criticalityBadge(c: MedicalCriticality | null | undefined) {
  if (!c) return null;
  const map: Record<MedicalCriticality, string> = {
    HIGH:   'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${map[c]}`}>{c}</span>
  );
}

interface StatusOption {
  value: string;
  label: string;
}

interface ReqStatusConfig {
  cls: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  filteredAllRequests: QuarterRequest[];
  allReqCounts: Record<string, number>;
  allReqSearch: string;
  setAllReqSearch: (v: string) => void;
  allReqStatus: string;
  setAllReqStatus: (v: string) => void;
  loadingAll: boolean;
  statusOptions: StatusOption[];
  reqStatusConfig: (status: string) => ReqStatusConfig;
  getImage: (q: Quarter, idx: number) => string;
  fmtDate: (d: string) => string;
}

const STATUS_TILES = [
  { key: 'SUBMITTED',        label: 'Submitted',   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  { key: 'ALLOTTED',         label: 'Allotted',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'ACKNOWLEDGED',     label: 'Occupied',    color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200' },
  { key: 'VACATE_REQUESTED', label: 'Vacate Req.', color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
  { key: 'EXTEND_REQUESTED', label: 'Extend Req.', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  { key: 'UPGRADE_REQUESTED',label: 'Upgrade Req.',color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200' },
];

export const AllRequestsTabContent: React.FC<Props> = ({
  filteredAllRequests, allReqCounts, allReqSearch, setAllReqSearch,
  allReqStatus, setAllReqStatus, loadingAll, statusOptions, reqStatusConfig, getImage, fmtDate,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {STATUS_TILES.map(s => (
        <button
          key={s.key}
          onClick={() => setAllReqStatus(allReqStatus === s.key ? 'ALL' : s.key)}
          className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
            allReqStatus === s.key
              ? `${s.bg} ring-2 ring-offset-1 ring-current ${s.color}`
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className={`text-2xl font-bold ${allReqStatus === s.key ? s.color : 'text-gray-800'}`}>
            {allReqCounts[s.key] ?? 0}
          </span>
          <span className={`text-[10px] font-medium mt-0.5 ${allReqStatus === s.key ? s.color : 'text-gray-500'}`}>
            {s.label}
          </span>
        </button>
      ))}
    </div>

    <MandatorySearchBar
      fields={[
        {
          key: 'search',
          label: 'Search',
          type: 'text',
          placeholder: 'Request no., BHK, location…',
          value: allReqSearch,
          onChange: setAllReqSearch,
          icon: <Search size={14} />,
        },
        {
          key: 'status',
          label: 'Status',
          type: 'chips',
          value: allReqStatus,
          onChange: setAllReqStatus,
          options: statusOptions.map(s => ({ value: s.value, label: s.label })),
        },
      ]}
      className="mb-0"
    />

    {loadingAll ? (
      <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">Loading…</div>
    ) : (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Request No.', 'Quarter Allotted', 'BHK / Location', 'Move-in', 'Family', 'Status', 'Updated'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAllRequests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No requests match the current filter</td></tr>
              ) : filteredAllRequests.map((req, i) => {
                const sc = reqStatusConfig(req.request_status);
                const q = req.allotment?.quarter;
                return (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-xs text-gray-700">{req.request_number}</div>
                      {req.request_type === 'MEDICAL' && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">Medical</span>
                          {criticalityBadge((req as QuarterRequest & { medical_criticality?: MedicalCriticality | null }).medical_criticality)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {q ? (
                        <div className="flex items-center gap-2">
                          <img src={getImage(q, i)} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-gray-800">{q.quarter_number}</div>
                            <div className="text-[10px] text-gray-400">{q.bhk_config}</div>
                          </div>
                        </div>
                      ) : <span className="text-xs text-gray-400">Not allotted</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{req.required_bhk_config || '—'}</div>
                      <div className="text-gray-400">{req.preferred_location || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {req.move_in_date ? fmtDate(req.move_in_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{req.family_member_count ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${sc.cls}`}>
                        {sc.icon}{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(req.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);
