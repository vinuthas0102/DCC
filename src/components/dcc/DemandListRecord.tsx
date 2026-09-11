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

const Metric: React.FC<{ label: string; value: React.ReactNode; valueCls?: string; width?: string }> = ({
  label, value, valueCls = VALUE_CLS, width = 'w-16',
}) => (
  <div className={`flex ${width} shrink-0 flex-col justify-center border-r border-slate-100 pr-2 overflow-hidden`}>
    <div className={LABEL_CLS}>{label}</div>
    <div className={`mt-0.5 whitespace-nowrap truncate ${valueCls}`}>{value || '—'}</div>
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
      className="group flex items-stretch rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
    >
      <div className="flex min-w-0 flex-1 items-center overflow-x-auto px-2.5 py-1.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        <div className="flex min-w-max items-center">

        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-900">
          <ObjectIcon size={11} strokeWidth={1.8} />
        </div>

        <div className="flex w-40 shrink-0 flex-col justify-center border-r border-slate-100 pl-2 pr-3 overflow-hidden" title={tile.object_description || tile.object_ref}>
          <div className={LABEL_CLS}>Object</div>
          <div className="mt-0.5 truncate text-[10px] font-bold leading-tight text-slate-900">{tile.object_description || tile.object_ref}</div>
        </div>

        <div className="flex w-28 shrink-0 flex-col justify-center border-r border-slate-100 pl-2 pr-3 overflow-hidden" title={tile.owner_name}>
          <div className={LABEL_CLS}>Client</div>
          <div className="mt-0.5 truncate text-[10px] font-semibold leading-tight text-slate-700">{tile.owner_name}</div>
        </div>

        <Metric label="Run Date" value={fmtDateShort(tile.demand_run_date)} valueCls="text-[10px] font-bold text-slate-600 tabular-nums" width="w-16" />
        <Metric label="Due Date" value={fmtDateShort(tile.due_date)} valueCls={`text-[10px] font-bold tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} width="w-16" />
        <Metric label="Base Amt" value={fmtINR(tile.total_amount)} valueCls="text-[10px] font-bold text-slate-700 tabular-nums" width="w-20" />
        <Metric
          label="GST"
          value={tile.include_gst && tile.gst_amount > 0 ? fmtINR(tile.gst_amount) : '—'}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.include_gst && tile.gst_amount > 0 ? 'text-slate-600' : 'text-slate-300'}`}
          width="w-16"
        />
        <Metric
          label="Late Fee"
          value={tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-slate-300'}`}
          width="w-16"
        />
        <Metric
          label="Payable"
          value={fmtINR(tile.amount_due)}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.amount_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}
          width="w-20"
        />

        <div className="flex shrink-0 items-center gap-1.5 pl-6">
          <div className="flex w-20 shrink-0 justify-start overflow-hidden">
            <span className="max-w-full truncate whitespace-nowrap rounded bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold text-blue-800" title={tile.object_type}>
              {tile.object_type}
            </span>
          </div>
          <div className="flex w-24 shrink-0 justify-start overflow-hidden">
            <span className="max-w-full truncate whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-600" title={tile.demand_type_label}>
              {tile.demand_type_label}
            </span>
          </div>
          <div className="flex w-24 shrink-0 justify-start overflow-hidden">
            <span className={`inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap ${st.bg} ${st.text} ${st.border}`}>
              <span className={`h-1 w-1 shrink-0 rounded-full ${st.dot}`} />
              <span className="truncate">{st.label}{odText && <span className="opacity-75"> ·{odText}</span>}</span>
            </span>
          </div>
        </div>

        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 bg-slate-50/40 px-2.5 py-1.5">
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
          className="flex shrink-0 items-center gap-0.5 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          View demands <ChevronRight size={10} />
        </button>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
