import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Wallet, CalendarDays, ChevronRight,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDateShort,
} from '../../constants/dccTheme';

const LV: React.FC<{ label: string; value: React.ReactNode; valueCls?: string }> = ({
  label, value, valueCls = 'text-slate-900',
}) => (
  <div className="flex items-baseline gap-1 min-w-0">
    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none shrink-0">{label}</span>
    <span className={`text-[10px] font-semibold tabular-nums truncate leading-tight ${valueCls}`}>{value || '—'}</span>
  </div>
);

export interface DemandListRecordProps {
  tile: DccTile;
  idx: number;
  onViewDetails: (tile: DccTile) => void;
  onPay?: (tile: DccTile) => void;
  onChat?: (tile: DccTile) => void;
  onShowDuePayment?: (tile: DccTile) => void;
  isChatActive?: boolean;
  canRecordPayment?: boolean;
}

export const DemandListRecord: React.FC<DemandListRecordProps> = ({
  tile, idx, onViewDetails, onPay, onChat, onShowDuePayment, isChatActive, canRecordPayment,
}) => {
  const st = DCC_STATUS[tile.status];
  const canPay = (tile.status === 'DUE' || tile.status === 'OVERDUE') && canRecordPayment;
  const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';

  const initials = (tile.owner_name || '?')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: Math.min(idx * 0.015, 0.08) }}
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
    >
      <div className="flex items-stretch gap-0">
        <div className={`w-1 shrink-0 ${st.dot}`} />

        <div className="flex-1 px-2.5 py-1.5">
          {/* ── Row 1: Identity + client info + amount ── */}
          <div className="flex items-center gap-2 min-w-0">
            <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center shrink-0 text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
              {initials}
            </span>

            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border} shrink-0`}>
                {st.label}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate shrink-0">{tile.demand_type_label}</span>
              <h3 className="text-[11px] font-bold text-slate-900 truncate leading-tight min-w-0">{tile.object_description || tile.object_ref}</h3>
              <span className="text-[9px] text-slate-400 truncate shrink-0">{tile.object_ref} · {tile.object_type}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <LV label="Client" value={tile.owner_name} valueCls="text-slate-700" />
              <LV label="Contact" value={tile.owner_contact} valueCls="text-slate-600" />
              <LV label="Region" value={tile.region} valueCls="text-slate-600" />
              <LV label="Group" value={tile.group_name || tile.subgroup} valueCls="text-slate-600" />
            </div>

            <div className="text-right shrink-0 ml-1">
              <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(tile.amount_due)}</div>
              <div className="text-[8px] text-slate-400 leading-none">of {fmtINRShort(tile.total_amount)}</div>
            </div>
          </div>

          {/* ── Row 2: All financial/date fields + actions in one dense strip ── */}
          <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap mt-1 pt-1 border-t border-slate-100">
            <LV label="Run" value={fmtDateShort(tile.demand_run_date)} />
            <LV label="Due" value={fmtDateShort(tile.due_date)} valueCls={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-900'} />
            <LV label="Total" value={fmtINRShort(tile.total_amount)} />
            <LV label="Paid" value={tile.amount_paid > 0 ? fmtINRShort(tile.amount_paid) : '—'} valueCls="text-emerald-600" />
            <LV label="Pending" value={tile.amount_due > 0 ? fmtINRShort(tile.amount_due) : '—'} valueCls="text-red-600" />
            <LV label="Penalty" value={tile.overdue_amount > 0 ? fmtINRShort(tile.overdue_amount) : '—'} valueCls="text-red-600" />
            <LV label="Last Pd" value={tile.last_paid_date ? fmtDateShort(tile.last_paid_date) : '—'} />
            <LV label="Last Amt" value={tile.last_paid_amount && tile.last_paid_amount > 0 ? fmtINRShort(tile.last_paid_amount) : '—'} valueCls="text-emerald-600" />
            <LV label="Subgrp" value={tile.subgroup} valueCls="text-slate-600" />
            <LV label="OD Days" value={tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'} valueCls={tile.avg_overdue_days > 0 ? 'text-red-600' : 'text-slate-500'} />

            {/* Actions at right end of same row */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
              {canPay && onPay && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPay(tile); }}
                  title="Pay Now"
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <Wallet size={10} /> Pay
                </button>
              )}
              {canShowDue && !canPay && onShowDuePayment && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }}
                  title="Due Payment"
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <CalendarDays size={10} /> Due
                </button>
              )}
              {onChat && (
                <button
                  onClick={(e) => { e.stopPropagation(); onChat(tile); }}
                  title="Chat"
                  className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                    isChatActive ? 'bg-slate-800 text-white' : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare size={11} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }}
                title="View Details"
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Details <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
