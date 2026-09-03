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
  <div className="flex flex-col gap-0 min-w-0">
    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">{label}</span>
    <span className={`text-[11px] font-semibold tabular-nums truncate leading-tight ${valueCls}`}>{value || '—'}</span>
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.1) }}
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
    >
      <div className="flex items-stretch gap-0">
        <div className={`w-1 shrink-0 ${st.dot}`} />

        <div className="flex-1 px-3 py-2">
          {/* ── Row 1: Identity + related details + amount/actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,1.1fr)_minmax(430px,2fr)_auto] items-center gap-x-3 gap-y-2">
            <div className="min-w-0 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                    {st.label}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate">{tile.demand_type_label}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">{tile.object_description || tile.object_ref}</h3>
                <p className="text-[10px] text-slate-500 truncate">{tile.object_ref} · {tile.object_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 lg:gap-x-4 gap-y-1 min-w-0">
              <LV label="Client" value={tile.owner_name} />
              <LV label="Contact" value={tile.owner_contact} valueCls="text-slate-600" />
              <LV label="Region" value={tile.region} valueCls="text-slate-600" />
              <LV label="Group" value={tile.group_name || tile.subgroup} valueCls="text-slate-600" />
            </div>

            <div className="text-right shrink-0 flex items-center justify-end">
              <div>
                <div className="text-base font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(tile.amount_due)}</div>
                <div className="text-[9px] text-slate-400">of {fmtINRShort(tile.total_amount)}</div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Label-value grid ── */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-1 border-t border-slate-100 pt-1.5 mt-1.5">
            <LV label="Run Date" value={fmtDateShort(tile.demand_run_date)} />
            <LV label="Due Date" value={fmtDateShort(tile.due_date)} valueCls={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-900'} />
            <LV label="Total" value={fmtINRShort(tile.total_amount)} />
            <LV label="Paid" value={tile.amount_paid > 0 ? fmtINRShort(tile.amount_paid) : '—'} valueCls="text-emerald-600" />
            <LV label="Pending" value={tile.amount_due > 0 ? fmtINRShort(tile.amount_due) : '—'} valueCls="text-red-600" />
            <LV label="Penalty" value={tile.overdue_amount > 0 ? fmtINRShort(tile.overdue_amount) : '—'} valueCls="text-red-600" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 border-t border-slate-100 pt-1.5 mt-1.5">
            <LV label="Last Paid" value={tile.last_paid_date ? fmtDateShort(tile.last_paid_date) : '—'} />
            <LV label="Last Amount" value={tile.last_paid_amount && tile.last_paid_amount > 0 ? fmtINRShort(tile.last_paid_amount) : '—'} valueCls="text-emerald-600" />
            <LV label="Subgroup" value={tile.subgroup} valueCls="text-slate-600" />
            <LV label="Overdue Days" value={tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'} valueCls={tile.avg_overdue_days > 0 ? 'text-red-600' : 'text-slate-500'} />
          </div>

          {/* ── Row 3: Actions at bottom-right ── */}
          <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-1.5 mt-1.5">
            {canPay && onPay && (
              <button
                onClick={(e) => { e.stopPropagation(); onPay(tile); }}
                title="Pay Now"
                className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <Wallet size={11} /> Pay
              </button>
            )}
            {canShowDue && !canPay && onShowDuePayment && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }}
                title="Due Payment"
                className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <CalendarDays size={11} /> Due
              </button>
            )}
            {onChat && (
              <button
                onClick={(e) => { e.stopPropagation(); onChat(tile); }}
                title="Chat"
                className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                  isChatActive ? 'bg-slate-800 text-white' : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={12} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }}
              title="View Details"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              View Details <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
