import React from 'react';
import { Eye } from 'lucide-react';
import type { QuarterAllotmentCycle } from '../../../services/quartersService';

interface Props {
  cycles: QuarterAllotmentCycle[];
  cycleStatusBadge: (status: string) => string;
  onViewCycle: (cycle: QuarterAllotmentCycle) => void;
}

export const CyclesTabContent: React.FC<Props> = ({ cycles, cycleStatusBadge, onViewCycle }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {['Cycle', 'Code', 'Period', 'Closes', 'Status', ''].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {cycles.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No allotment cycles found</td></tr>
          ) : cycles.map(cycle => (
            <tr key={cycle.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 font-semibold text-gray-900">{cycle.cycle_name}</td>
              <td className="px-5 py-4 font-mono text-xs text-gray-500">{cycle.cycle_code}</td>
              <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                {new Date(cycle.start_date).toLocaleDateString('en-IN')} — {new Date(cycle.end_date).toLocaleDateString('en-IN')}
              </td>
              <td className="px-5 py-4 text-gray-600">{new Date(cycle.end_date).toLocaleDateString('en-IN')}</td>
              <td className="px-5 py-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cycleStatusBadge(cycle.status)}`}>
                  {cycle.status}
                </span>
              </td>
              <td className="px-5 py-4">
                <button
                  onClick={() => onViewCycle(cycle)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={12} /> View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
