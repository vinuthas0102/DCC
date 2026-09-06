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
      className="group flex items-center min-w-0 h-[52px] py-2 px-3.5 gap-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
    >
      {/* Status pill */}
      <div className="shrink-0">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${st.bg} ${st.text} ${st.border} whitespace-nowrap`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {st.label}
          {odText && <span className="opacity-75">· {odText}</span>}
        </span>
      </div>

      {/* Asset icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-900">
        <ObjectIcon size={16} strokeWidth={1.8} />
      </div>

      {/* Asset title & code — expands to fill */}
      <div className="flex-1 min-w-[200px] min-w-0 overflow-hidden">
        <div className="truncate text-[11px] font-bold text-slate-900 leading-tight">{tile.object_description || tile.object_ref}</div>
        <div className="truncate text-[10px] text-slate-400 leading-tight">{tile.object_ref}</div>
      </div>

      {/* Divider: Asset & Client | Type badges */}
      <div className="flex items-center gap-1.5 shrink-0 border-r border-slate-100 pr-3">
        <div className="flex flex-col min-w-0 max-w-[140px]">
          <span className={LABEL_CLS}>CLIENT</span>
          <span className="mt-0.5 truncate text-[11px] font-semibold text-slate-700 leading-tight">{tile.owner_name}</span>
        </div>
      </div>

      {/* Type badges */}
      <div className="flex items-center gap-1 shrink-0 border-r border-slate-100 pr-3">
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800 whitespace-nowrap">{tile.object_type}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 whitespace-nowrap">{tile.demand_type_label}</span>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-3 shrink-0 border-r border-slate-100 pr-3">
        <Metric label="RUN" value={fmtDateShort(tile.demand_run_date)} valueCls="text-[11px] font-bold text-slate-600 tabular-nums" />
        <Metric label="DUE" value={fmtDateShort(tile.due_date)} valueCls={`text-[11px] font-bold tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} />
      </div>

      {/* Financial breakdown */}
      <div className="flex items-center gap-3 shrink-0 border-r border-slate-100 pr-3">
        <Metric label="BASE" value={fmtINR(tile.total_amount)} valueCls="text-[11px] font-bold text-slate-700 tabular-nums" />
        <Metric
          label="GST"
          value={tile.include_gst && tile.gst_amount > 0 ? fmtINR(tile.gst_amount) : '—'}
          valueCls={`text-[11px] font-bold tabular-nums ${tile.include_gst && tile.gst_amount > 0 ? 'text-slate-600' : 'text-slate-300'}`}
        />
        <Metric
          label="LATE FEE"
          value={tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
          valueCls={`text-[11px] font-bold tabular-nums ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-slate-300'}`}
        />
        <Metric
          label="PAYABLE"
          value={fmtINR(tile.amount_due)}
          valueCls={`text-[11px] font-bold tabular-nums ${tile.amount_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}
        />
      </div>

      {/* Actions — pinned right */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {canShowDue && onShowDuePayment && (
          <button
            onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }}
            className="rounded px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            Pay
          </button>
        )}
        {onChat && (
          <button
            onClick={(e) => { e.stopPropagation(); onChat(tile); }}
            title="Chat"
            className={`rounded p-1.5 shrink-0 transition-colors ${isChatActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
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
