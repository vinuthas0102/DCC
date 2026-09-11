import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, ChevronRight,
  Car, FileText, Home, Landmark, CircleDollarSign, Building2,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import { DCC_STATUS, fmtINR, fmtDateShort } from '../../constants/dccTheme';

const getObjectIcon = (objectType: string) => {
  const type = objectType.toLowerCase();
  if (type.includes('car') || type.includes('vehicle')) return Car;
  if (type.includes('house') || type.includes('home') || type.includes('quarter')) return Home;
  if (type.includes('building') || type.includes('office') || type.includes('property')) return Building2;
  if (type.includes('loan')) return CircleDollarSign;
  if (type.includes('license') || type.includes('document')) return FileText;
  if (type.includes('equipment') || type.includes('asset')) return Landmark;
  return FileText;
};

const LABEL_CLS = 'text-[8px] font-semibold text-slate-400 uppercase tracking-wider leading-none';
const VALUE_CLS = 'text-[10px] font-bold text-slate-800 tabular-nums leading-tight';

const Metric: React.FC<{ label: string; value: React.ReactNode; valueCls?: string }> = ({
  label, value, valueCls = VALUE_CLS,
}) => (
  <div className="min-w-0 border-r border-slate-100 pr-2 last:border-r-0 last:pr-0">
    <div className={LABEL_CLS}>{label}</div>
    <div className={`mt-0.5 truncate whitespace-nowrap ${valueCls}`}>{value || '—'}</div>
  </div>
);

export interface DemandListRecordProps {
  tile: DccTile;
  idx: number;
  onViewDetails: (tile: DccTile) => void;
  onChat?: (tile: DccTile) => void;
  isChatActive?: boolean;
}

export const DemandListRecord: React.FC<DemandListRecordProps> = ({
  tile, idx, onViewDetails, onChat, isChatActive,
}) => {
  const st = DCC_STATUS[tile.status];
  const ObjectIcon = getObjectIcon(tile.object_type);
  const odText = tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: Math.min(idx * 0.01, 0.06) }}
      className="group flex min-w-0 flex-col gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
    >
      {/* Row 1: identity and actions */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`inline-flex items-center gap-1 shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap ${st.bg} ${st.text} ${st.border}`}>
          <span className={`h-1 w-1 rounded-full ${st.dot}`} />
          {st.label}
          {odText && <span className="opacity-75">·{odText}</span>}
        </span>

        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-900">
          <ObjectIcon size={13} strokeWidth={1.8} />
        </div>

        <div className="min-w-[150px] flex-1 overflow-hidden">
          <div className="truncate text-[10px] font-bold leading-tight text-slate-900">{tile.object_description || tile.object_ref}</div>
          <div className="truncate text-[9px] leading-tight text-slate-400">{tile.object_ref}</div>
        </div>

        <div className="min-w-[110px] max-w-[190px] border-l border-slate-100 pl-2">
          <div className={LABEL_CLS}>Client</div>
          <div className="mt-0.5 truncate text-[10px] font-semibold leading-tight text-slate-700">{tile.owner_name}</div>
        </div>

        <div className="flex min-w-0 max-w-[190px] items-center gap-1 border-l border-slate-100 pl-2">
          <span className="max-w-[86px] truncate rounded bg-blue-50 px-1 py-0.5 text-[8px] font-semibold text-blue-800">{tile.object_type}</span>
          <span className="max-w-[86px] truncate rounded bg-slate-100 px-1 py-0.5 text-[8px] font-semibold text-slate-600">{tile.demand_type_label}</span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {onChat && (
            <button
              onClick={(e) => { e.stopPropagation(); onChat(tile); }}
              title="Chat"
              className={`rounded p-1 transition-colors ${isChatActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <MessageSquare size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }}
            className="flex shrink-0 items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            View <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* Row 2: label-value details; wraps to one additional row only when needed */}
      <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-1 border-t border-slate-100 pt-1 sm:grid-cols-4 lg:grid-cols-6">
        <Metric label="Run Date" value={fmtDateShort(tile.demand_run_date)} valueCls="text-[10px] font-bold text-slate-600 tabular-nums" />
        <Metric label="Due Date" value={fmtDateShort(tile.due_date)} valueCls={`text-[10px] font-bold tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} />
        <Metric label="Base Amt" value={fmtINR(tile.total_amount)} valueCls="text-[10px] font-bold text-slate-700 tabular-nums" />
        <Metric
          label="GST"
          value={tile.include_gst && tile.gst_amount > 0 ? fmtINR(tile.gst_amount) : '—'}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.include_gst && tile.gst_amount > 0 ? 'text-slate-600' : 'text-slate-300'}`}
        />
        <Metric
          label="Late Fee"
          value={tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-slate-300'}`}
        />
        <Metric
          label="Payable"
          value={fmtINR(tile.amount_due)}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.amount_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}
        />
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
