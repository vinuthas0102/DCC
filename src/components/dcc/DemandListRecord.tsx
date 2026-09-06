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

const LABEL_CLS = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none';
const VALUE_CLS = 'text-[11px] font-bold text-slate-800 tabular-nums leading-tight';

const Metric: React.FC<{ label: string; value: React.ReactNode; valueCls?: string }> = ({
  label, value, valueCls = VALUE_CLS,
}) => (
  <div className="flex flex-col justify-center min-w-0 text-right">
    <span className={LABEL_CLS}>{label}</span>
    <span className={`mt-0.5 truncate ${valueCls}`}>{value || '—'}</span>
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
      className="group grid grid-cols-12 items-center gap-2 px-3.5 py-2.5 w-full h-[52px] rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
    >
      {/* Col 1-2: Status pill + Asset icon */}
      <div className="col-span-2 flex items-center gap-2 min-w-0">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${st.bg} ${st.text} ${st.border} whitespace-nowrap`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {st.label}
          {odText && <span className="opacity-75">· {odText}</span>}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-900 shrink-0">
          <ObjectIcon size={16} strokeWidth={1.8} />
        </div>
      </div>

      {/* Col 3-5: Asset title & code */}
      <div className="col-span-3 min-w-0 overflow-hidden border-r border-slate-100 pr-2">
        <div className="truncate text-[11px] font-bold text-slate-900 leading-tight">{tile.object_description || tile.object_ref}</div>
        <div className="truncate text-[10px] text-slate-400 leading-tight">{tile.object_ref}</div>
      </div>

      {/* Col 6-7: Client label & name */}
      <div className="col-span-2 min-w-0 border-r border-slate-100 pr-2">
        <span className={LABEL_CLS}>CLIENT</span>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-700 leading-tight">{tile.owner_name}</div>
      </div>

      {/* Col 8: Category & type badges */}
      <div className="col-span-1 flex flex-col gap-1 min-w-0 border-r border-slate-100 pr-2">
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800 whitespace-nowrap truncate text-center">{tile.object_type}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 whitespace-nowrap truncate text-center">{tile.demand_type_label}</span>
      </div>

      {/* Col 9: Dates */}
      <div className="col-span-1 flex flex-col justify-center gap-1 min-w-0 border-r border-slate-100 pr-2">
        <Metric label="RUN" value={fmtDateShort(tile.demand_run_date)} valueCls="text-[10px] font-bold text-slate-600 tabular-nums" />
        <Metric label="DUE" value={fmtDateShort(tile.due_date)} valueCls={`text-[10px] font-bold tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} />
      </div>

      {/* Col 10-11: Financial breakdown */}
      <div className="col-span-2 flex items-center gap-2 min-w-0 border-r border-slate-100 pr-2">
        <Metric label="BASE" value={fmtINR(tile.total_amount)} valueCls="text-[10px] font-bold text-slate-700 tabular-nums" />
        <Metric
          label="GST"
          value={tile.include_gst && tile.gst_amount > 0 ? fmtINR(tile.gst_amount) : '—'}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.include_gst && tile.gst_amount > 0 ? 'text-slate-600' : 'text-slate-300'}`}
        />
        <Metric
          label="LATE"
          value={tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-slate-300'}`}
        />
        <Metric
          label="PAYABLE"
          value={fmtINR(tile.amount_due)}
          valueCls={`text-[10px] font-bold tabular-nums ${tile.amount_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}
        />
      </div>

      {/* Col 12: Actions */}
      <div className="col-span-1 flex items-center justify-end gap-1.5 whitespace-nowrap">
        {onChat && (
          <button
            onClick={(e) => { e.stopPropagation(); onChat(tile); }}
            title="Chat"
            className={`rounded p-1.5 transition-colors ${isChatActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <MessageSquare size={13} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }}
          className="flex items-center gap-0.5 rounded px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap"
        >
          View <ChevronRight size={11} />
        </button>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
