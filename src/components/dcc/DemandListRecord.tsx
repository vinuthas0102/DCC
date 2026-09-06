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
      className="group flex items-center min-w-0 h-[52px] px-2 gap-2 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
    >
      {/* Status pill */}
      <span className={`inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-md text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
        {st.label}
        {odText && <span className="opacity-75">· {odText}</span>}
      </span>

      {/* Asset icon + title + ref */}
      <div className="flex items-center gap-2 min-w-0 w-[200px] shrink-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-900">
          <ObjectIcon size={15} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold text-slate-900 leading-tight">{tile.object_description || tile.object_ref}</div>
          <div className="truncate text-[10px] text-slate-400 leading-tight">{tile.object_ref}</div>
        </div>
      </div>

      {/* Type badges */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800">{tile.object_type}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">{tile.demand_type_label}</span>
      </div>

      {/* Client name */}
      <div className="min-w-0 w-[130px] shrink-0">
        <div className="truncate text-[11px] font-semibold text-slate-700">{tile.owner_name}</div>
      </div>

      {/* Run date */}
      <div className="shrink-0 text-[10px] text-slate-500 tabular-nums w-[60px] text-right">{fmtDateShort(tile.demand_run_date)}</div>

      {/* Due date */}
      <div className={`shrink-0 text-[10px] font-semibold tabular-nums w-[60px] text-right ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`}>{fmtDateShort(tile.due_date)}</div>

      {/* Base amount */}
      <div className="shrink-0 text-[11px] font-semibold text-slate-700 tabular-nums w-[80px] text-right">{fmtINR(tile.total_amount)}</div>

      {/* GST */}
      <div className={`shrink-0 text-[10px] tabular-nums w-[70px] text-right ${tile.include_gst && tile.gst_amount > 0 ? 'text-slate-600' : 'text-slate-300'}`}>
        {tile.include_gst && tile.gst_amount > 0 ? fmtINR(tile.gst_amount) : '—'}
      </div>

      {/* Penalty */}
      <div className={`shrink-0 text-[10px] tabular-nums w-[70px] text-right ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-slate-300'}`}>
        {tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
      </div>

      {/* Net outstanding */}
      <div className={`shrink-0 text-[11px] font-bold tabular-nums w-[90px] text-right ${tile.amount_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
        {fmtINR(tile.amount_due)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-auto pl-2">
        {onChat && (
          <button onClick={(e) => { e.stopPropagation(); onChat(tile); }} title="Chat" className={`rounded p-1.5 ${isChatActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
            <MessageSquare size={12} />
          </button>
        )}
        {canShowDue && onShowDuePayment && (
          <button onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }} title="Due Payment" className="rounded px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors whitespace-nowrap">
            Pay
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }} className="flex items-center gap-0.5 rounded px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap">
          View <ChevronRight size={11} />
        </button>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
