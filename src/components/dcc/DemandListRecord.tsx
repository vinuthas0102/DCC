import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Wallet, CalendarDays, ChevronRight,
  ChevronDown, ChevronUp, Phone, MapPin, Users,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDateShort,
} from '../../constants/dccTheme';

// ── Compact label-value pill ──────────────────────────────────────────────────
const LV: React.FC<{
  label: string;
  value: React.ReactNode;
  valueCls?: string;
}> = ({ label, value, valueCls = 'text-slate-800' }) => (
  <div className="flex items-baseline gap-1 min-w-0 shrink-0">
    <span className="text-[8px] font-bold uppercase tracking-wide text-slate-400 leading-none shrink-0">{label}</span>
    <span className={`text-[10px] font-semibold tabular-nums truncate leading-tight ${valueCls}`}>{value || '—'}</span>
  </div>
);

// ── Vertical separator ───────────────────────────────────────────────────────
const Sep: React.FC = () => <span className="w-px h-7 bg-slate-200 shrink-0" />;

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
  const [expanded, setExpanded] = useState(false);
  const st = DCC_STATUS[tile.status];
  const canPay = (tile.status === 'DUE' || tile.status === 'OVERDUE') && canRecordPayment;
  const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: Math.min(idx * 0.015, 0.08) }}
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
    >
      <div className="flex items-stretch gap-0">
        {/* Status strip */}
        <div className={`w-1 shrink-0 ${st.dot}`} />

        <div className="flex-1 px-3 py-2 min-w-0">
          {/* ── Row 1: Identity + Outstanding ─────────────────────────────── */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Status badge */}
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border} shrink-0`}>
              {st.label}
            </span>

            {/* Identity group */}
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-col min-w-0 shrink-0">
                <span className="text-[11px] font-bold text-slate-900 truncate leading-tight max-w-[200px]">
                  {tile.object_description || tile.object_ref}
                </span>
                <span className="text-[9px] text-slate-400 truncate leading-tight">
                  {tile.demand_type_label} · {tile.object_ref}
                </span>
              </div>
            </div>

            <Sep />

            {/* Client group */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700 shrink-0">
                  {tile.owner_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[120px]">{tile.owner_name}</span>
                  <span className="text-[9px] text-slate-400 truncate max-w-[120px]">{tile.owner_contact || '—'}</span>
                </div>
              </div>
            </div>

            <Sep />

            {/* Date group */}
            <div className="flex items-center gap-2 shrink-0">
              <LV label="Due" value={fmtDateShort(tile.due_date)} valueCls={tile.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-slate-700'} />
              <LV label="Run" value={fmtDateShort(tile.demand_run_date)} valueCls="text-slate-500" />
            </div>

            <Sep />

            {/* Outstanding amount — prominent right side */}
            <div className="text-right shrink-0 ml-auto">
              <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400 leading-none">Outstanding</div>
              <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(tile.amount_due)}</div>
              <div className="text-[8px] text-slate-400 leading-none">of {fmtINRShort(tile.total_amount)}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {canPay && onPay && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPay(tile); }}
                  title="Pay Now"
                  className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <Wallet size={10} /> Pay
                </button>
              )}
              {canShowDue && !canPay && onShowDuePayment && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }}
                  title="Due Payment"
                  className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <CalendarDays size={10} /> Due
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
                  <MessageSquare size={11} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }}
                title="View Details"
                className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Details <ChevronRight size={10} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                title={expanded ? 'Collapse' : 'Expand'}
                className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* ── Row 2: Financial summary ──────────────────────────────────── */}
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-100">
            <LV label="Total" value={fmtINRShort(tile.total_amount)} valueCls="text-slate-700" />
            <Sep />
            <LV label="Paid" value={tile.amount_paid > 0 ? fmtINRShort(tile.amount_paid) : '—'} valueCls="text-emerald-600" />
            <Sep />
            <LV label="Pending" value={tile.amount_due > 0 ? fmtINRShort(tile.amount_due) : '—'} valueCls="text-red-600" />
            <Sep />
            <LV label="Penalty" value={tile.overdue_amount > 0 ? fmtINRShort(tile.overdue_amount) : '—'} valueCls="text-red-600" />
            <Sep />
            <LV label="Last Paid" value={tile.last_paid_date ? fmtDateShort(tile.last_paid_date) : '—'} valueCls="text-slate-500" />
            <Sep />
            <LV label="Last Amt" value={tile.last_paid_amount && tile.last_paid_amount > 0 ? fmtINRShort(tile.last_paid_amount) : '—'} valueCls="text-emerald-600" />
            <Sep />
            <LV label="OD Days" value={tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'} valueCls={tile.avg_overdue_days > 0 ? 'text-red-600 font-bold' : 'text-slate-400'} />

            {/* Tags for region/group */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
              {tile.region && (
                <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-semibold">
                  {tile.region}
                </span>
              )}
              {tile.group_name && (
                <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-semibold">
                  {tile.group_name}
                </span>
              )}
              {tile.subgroup && (
                <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-semibold">
                  {tile.subgroup}
                </span>
              )}
            </div>
          </div>

          {/* ── Expandable detail ─────────────────────────────────────────── */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[10px] text-slate-600 bg-slate-50/40 px-2 py-2 rounded-b">
                  <div className="flex items-center gap-1">
                    <Phone size={10} className="text-slate-400" />
                    <span className="text-slate-400 font-bold uppercase text-[8px]">Contact</span>
                    <span className="font-semibold truncate">{tile.owner_contact || '—'}</span>
                  </div>
                  <div className="flex items-start gap-1 col-span-2">
                    <MapPin size={10} className="text-slate-400 mt-0.5" />
                    <span className="text-slate-400 font-bold uppercase text-[8px] shrink-0">Address</span>
                    <span className="font-medium truncate">{tile.owner_address || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={10} className="text-slate-400" />
                    <span className="text-slate-400 font-bold uppercase text-[8px]">Type</span>
                    <span className="font-semibold truncate">{tile.object_type}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
