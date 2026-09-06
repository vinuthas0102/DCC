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
const VALUE_CLS = 'text-xs font-bold text-slate-800 tabular-nums leading-tight';

const LV: React.FC<{ label: string; value: React.ReactNode; valueCls?: string; align?: string }> = ({
  label, value, valueCls = VALUE_CLS, align = 'text-right',
}) => (
  <div className={`flex flex-col justify-center min-w-0 ${align}`}>
    <span className={LABEL_CLS}>{label}</span>
    <span className={`mt-0.5 truncate ${valueCls}`}>{value || '—'}</span>
  </div>
);

export interface DemandListRecordProps {
  tile: DccTile;
  idx: number;
  onViewDetails: (tile: DccTile) => void;
  onChat?: (tile: DccTile) => void;
  onShowDuePayment?: (tile: DccTile) => void;
  isChatActive?: boolean;
}

export const DemandListRecord: React.FC<DemandListRecordProps> = ({
  tile, idx, onViewDetails, onChat, onShowDuePayment, isChatActive,
}) => {
  const st = DCC_STATUS[tile.status];
  const ObjectIcon = getObjectIcon(tile.object_type);
  const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';
  const odText = tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: Math.min(idx * 0.01, 0.06) }}
      className="group grid items-center min-w-0 h-[54px] px-3 py-2 gap-1 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
      style={{
        gridTemplateColumns:
          '85px minmax(140px,1fr) 100px 120px 65px 65px 80px 70px 70px 90px 110px',
      }}
    >
      {/* Col 1: Status pill */}
      <div className="flex items-center justify-start min-w-0">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${st.bg} ${st.text} ${st.border} whitespace-nowrap`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {st.label}
          {odText && <span className="opacity-75">· {odText}</span>}
        </span>
      </div>

      {/* Col 2: Asset icon + title + ref */}
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-900">
          <ObjectIcon size={15} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 overflow-hidden">
          <div className="truncate text-[11px] font-bold text-slate-900 leading-tight">{tile.object_description || tile.object_ref}</div>
          <div className="truncate text-[10px] text-slate-400 leading-tight">{tile.object_ref}</div>
        </div>
      </div>

      {/* Col 3: Type badges */}
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800 whitespace-nowrap shrink-0">{tile.object_type}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 whitespace-nowrap shrink-0">{tile.demand_type_label}</span>
      </div>

      {/* Col 4: Client name */}
      <div className="min-w-0 overflow-hidden">
        <div className="truncate text-[11px] font-semibold text-slate-700">{tile.owner_name}</div>
      </div>

      {/* Col 5: Run date */}
      <LV label="RUN" value={fmtDateShort(tile.demand_run_date)} valueCls="text-[11px] font-bold text-slate-600 tabular-nums" />

      {/* Col 6: Due date */}
      <LV label="DUE" value={fmtDateShort(tile.due_date)} valueCls={`text-[11px] font-bold tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} />

      {/* Col 7: Base amount */}
      <LV label="BASE" value={fmtINR(tile.total_amount)} valueCls="text-[11px] font-bold text-slate-700 tabular-nums" />

      {/* Col 8: GST */}
      <LV
        label="GST"
        value={tile.include_gst && tile.gst_amount > 0 ? fmtINR(tile.gst_amount) : '—'}
        valueCls={`text-[11px] font-bold tabular-nums ${tile.include_gst && tile.gst_amount > 0 ? 'text-slate-600' : 'text-slate-300'}`}
      />

      {/* Col 9: Late fee */}
      <LV
        label="LATE FEE"
        value={tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
        valueCls={`text-[11px] font-bold tabular-nums ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-slate-300'}`}
      />

      {/* Col 10: Payable */}
      <LV
        label="PAYABLE"
        value={fmtINR(tile.amount_due)}
        valueCls={`text-[11px] font-bold tabular-nums ${tile.amount_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}
      />

      {/* Col 11: Actions */}
      <div className="flex items-center justify-end gap-1 shrink-0">
        {onChat && (
          <button onClick={(e) => { e.stopPropagation(); onChat(tile); }} title="Chat" className={`rounded p-1.5 shrink-0 ${isChatActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
            <MessageSquare size={12} />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }} className="flex items-center gap-0.5 rounded px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0">
          View <ChevronRight size={11} />
        </button>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
