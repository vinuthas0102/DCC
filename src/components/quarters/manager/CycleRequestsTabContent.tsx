import React from 'react';
import { Eye, Search } from 'lucide-react';
import { MandatorySearchBar } from '../../ui/MandatorySearchBar';
import type { QuarterRequest } from '../../../services/quartersService';

interface Props {
  cycleRequests: QuarterRequest[];
  cycleReqSearch: string;
  setCycleReqSearch: (v: string) => void;
  loadingCycleData: boolean;
  onGoToAllotments: () => void;
  fmtDate: (d: string) => string;
}

export const CycleRequestsTabContent: React.FC<Props> = ({
  cycleRequests, cycleReqSearch, setCycleReqSearch, loadingCycleData, onGoToAllotments, fmtDate,
}) => {
  const submittedRequests = cycleRequests.filter(r => r.request_status === 'SUBMITTED');
  const visibleCycleReqs = cycleReqSearch
    ? submittedRequests.filter(r =>
        r.request_number?.toLowerCase().includes(cycleReqSearch.toLowerCase()) ||
        r.required_bhk_config?.toLowerCase().includes(cycleReqSearch.toLowerCase()) ||
        r.preferred_location?.toLowerCase().includes(cycleReqSearch.toLowerCase())
      )
    : submittedRequests;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-900">Submitted Requests</span>
        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
          {visibleCycleReqs.length}
        </span>
      </div>
      <div className="px-5 py-3 border-b border-gray-100">
        <MandatorySearchBar
          fields={[
            {
              key: 'search',
              label: 'Search',
              type: 'text',
              placeholder: 'Request no., BHK, preferred location…',
              value: cycleReqSearch,
              onChange: setCycleReqSearch,
              icon: <Search size={14} />,
            },
          ]}
        />
      </div>
      {loadingCycleData ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Sl. No.', 'Request No.', 'Requested For', 'Reason', 'BHK Required', 'Preferred Location', 'Preferences', 'Move-in', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleCycleReqs.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No submitted requests for this cycle</td></tr>
              ) : visibleCycleReqs.map((req, idx) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{req.request_number}</td>
                  <td className="px-4 py-3">
                    {req.request_for === 'EMPLOYEE' && req.on_behalf_employee_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{req.on_behalf_employee_name.charAt(0)}</div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-blue-900 truncate max-w-[100px]">{req.on_behalf_employee_name}</div>
                          <div className="text-[10px] text-blue-500">{req.on_behalf_employee_id}</div>
                        </div>
                      </div>
                    ) : req.request_for === 'TP' && req.tp_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{req.tp_name.charAt(0)}</div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-amber-900 truncate max-w-[100px]">{req.tp_name}</div>
                          <div className="text-[10px] text-amber-600 truncate max-w-[100px]">{req.tp_organization}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Self</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{req.request_reason || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{req.required_bhk_config || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{req.preferred_location || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {req.preferences?.length ?? 0} prefs
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {req.move_in_date ? fmtDate(req.move_in_date) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={onGoToAllotments}
                      className="text-xs px-2.5 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={12} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
