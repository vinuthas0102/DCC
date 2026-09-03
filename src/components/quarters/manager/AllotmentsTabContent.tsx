import React from 'react';
import { Building2, RefreshCw, Settings, Search } from 'lucide-react';
import { MandatorySearchBar } from '../../ui/MandatorySearchBar';
import type { QuarterAllotment, Quarter, QuarterRequest } from '../../../services/quartersService';

interface Props {
  cycleAllotments: QuarterAllotment[];
  cycleRequests: QuarterRequest[];
  allotSearch: string;
  setAllotSearch: (v: string) => void;
  loadingCycleData: boolean;
  onFinaliseCycle: () => void;
  onOverride: (allot: QuarterAllotment) => void;
  getImage: (q: Quarter, idx: number) => string;
  fmtINR: (n: number) => string;
}

export const AllotmentsTabContent: React.FC<Props> = ({
  cycleAllotments, cycleRequests, allotSearch, setAllotSearch,
  loadingCycleData, onFinaliseCycle, onOverride, getImage, fmtINR,
}) => {
  const visibleAllotments = allotSearch
    ? cycleAllotments.filter(a => {
        const q = a.quarter as Quarter | undefined;
        const req = a.request as QuarterRequest | undefined;
        const s = allotSearch.toLowerCase();
        return (
          q?.quarter_number?.toLowerCase().includes(s) ||
          req?.request_number?.toLowerCase().includes(s)
        );
      })
    : cycleAllotments;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {cycleAllotments.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-100">
          <MandatorySearchBar
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Quarter number or request no…',
                value: allotSearch,
                onChange: setAllotSearch,
                icon: <Search size={14} />,
              },
            ]}
          />
        </div>
      )}
      {loadingCycleData ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
      ) : cycleAllotments.length === 0 && cycleRequests.length > 0 ? (
        <div className="py-16 text-center">
          <Building2 size={36} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">No allotments generated yet</h3>
          <p className="text-sm text-gray-500 mb-5">Run the auto-allotment to assign quarters based on preferences.</p>
          <button
            onClick={onFinaliseCycle}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={15} /> Run Auto-Allotment
          </button>
        </div>
      ) : cycleAllotments.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No allotments for this cycle. Select a cycle with requests first.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Sl. No.', 'Allotted Quarter', 'Request No.', 'Pref Used', 'Allotted On', 'Overridden', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleAllotments.map((allot, i) => {
                const q = allot.quarter as Quarter | undefined;
                const req = allot.request as QuarterRequest | undefined;
                const prefUsed = req?.preferences?.find(p => p.quarter_id === q?.id)?.preference_rank;
                return (
                  <tr key={allot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      {q ? (
                        <div className="flex items-center gap-3">
                          <img src={getImage(q, i)} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                            <div className="text-xs text-gray-500">{q.bhk_config} · {fmtINR(q.monthly_rent)}</div>
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{req?.request_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      {prefUsed !== undefined ? (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">P-{prefUsed}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(allot.allotment_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {allot.is_overridden ? (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Overridden</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        allot.approval_status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : allot.approval_status === 'ACKNOWLEDGED'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {allot.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onOverride(allot)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                      >
                        <Settings size={12} /> Override
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
