import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Wallet, CalendarDays, ChevronRight,
  ChevronDown, ChevronUp, Phone, MapPin, Users, Building2,
  Car, FileText, Home, Landmark, CircleDollarSign,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import { DCC_STATUS, fmtINR, fmtINRShort, fmtDateShort } from '../../constants/dccTheme';

const LV: React.FC<{ label: string; value: React.ReactNode; valueCls?: string }> = ({ label, value, valueCls = 'text-slate-800' }) => (
  <div className="min-w-[70px]">
    <div className="text-[10px] font-medium text-slate-500 leading-none">{label}</div>
    <div className={`mt-1 text-sm font-bold tabular-nums leading-tight ${valueCls}`}>{value || '—'}</div>
  </div>
);

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
  const ObjectIcon = getObjectIcon(tile.object_type);
  const canPay = (tile.status === 'DUE' || tile.status === 'OVERDUE') && canRecordPayment;
  const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';
  const statusMessage = tile.status === 'OVERDUE'
    ? `${tile.avg_overdue_days || 0}d overdue`
    : tile.status === 'DUE'
      ? `${tile.avg_overdue_days > 0 ? tile.avg_overdue_days + 'd left' : 'Due soon'}`
      : tile.status === 'PAID' ? 'Completed' : st.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, delay: Math.min(idx * 0.012, 0.08) }}
      className="group overflow-hidden rounded-xl border border-blue-100 bg-white shadow-[0_4px_16px_rgba(30,64,175,0.06)] transition-all hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(30,64,175,0.1)]"
    >
      <div className="flex min-w-[980px] items-stretch">
        <div className={`flex w-[116px] shrink-0 flex-col justify-center border-r border-white/60 px-4 py-3 ${st.bg}`}>
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold ${st.text} ${st.border}`}>
            <span className={`h-2 w-2 rounded-full ${st.dot}`} /> {st.label}
          </span>
          <span className={`mt-2 text-[11px] font-bold ${st.text}`}>{statusMessage}</span>
        </div>

        <div className="flex flex-1 items-center gap-0 px-3 py-3">
          <div className="flex w-[285px] shrink-0 items-center gap-3 border-r border-blue-100 pr-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
              <ObjectIcon size={23} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold text-slate-900">{tile.object_description || tile.object_ref}</div>
              <div className="mt-1 truncate text-[11px] text-slate-500">{tile.object_ref}</div>
              <div className="mt-1 flex gap-1.5 overflow-hidden">
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">{tile.object_type}</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">{tile.demand_type_label}</span>
              </div>
            </div>
          </div>

          <div className="flex w-[220px] shrink-0 items-center gap-2 border-r border-blue-100 px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{tile.owner_name?.charAt(0).toUpperCase() || '?'}</div>
            <div className="min-w-0 text-[11px] text-slate-600">
              <div className="truncate font-bold text-slate-800"><Users size={12} className="mr-1 inline" />{tile.owner_name}</div>
              <div className="truncate"><MapPin size={12} className="mr-1 inline text-blue-600" />{tile.region || tile.owner_address || '—'}</div>
              <div className="truncate"><Phone size={12} className="mr-1 inline text-blue-600" />{tile.owner_contact || '—'}</div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-around gap-4 px-5">
            <LV label="Total" value={fmtINR(tile.total_amount)} />
            <LV label="Paid" value={tile.amount_paid > 0 ? fmtINR(tile.amount_paid) : '—'} valueCls="text-emerald-600" />
            <LV label="Pending" value={tile.amount_due > 0 ? fmtINR(tile.amount_due) : '—'} valueCls={tile.amount_due > 0 ? 'text-red-600' : 'text-slate-400'} />
            <div className="min-w-[98px]">
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500"><CalendarDays size={12} className="text-blue-700" />Due Date</div>
              <div className={`mt-1 text-sm font-bold ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-800'}`}>{fmtDateShort(tile.due_date)}</div>
            </div>
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${tile.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : tile.status === 'DUE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'}</span>
          </div>

          <div className="flex w-[116px] shrink-0 items-center justify-end gap-1.5 pl-3">
            {canPay && onPay && <button onClick={(e) => { e.stopPropagation(); onPay(tile); }} title="Pay Now" className="rounded-md bg-emerald-600 p-2 text-white hover:bg-emerald-700"><Wallet size={13} /></button>}
            {canShowDue && !canPay && onShowDuePayment && <button onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }} title="Due Payment" className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-700 hover:bg-amber-100"><CalendarDays size={13} /></button>}
            {onChat && <button onClick={(e) => { e.stopPropagation(); onChat(tile); }} title="Chat" className={`rounded-md p-2 ${isChatActive ? 'bg-slate-800 text-white' : 'border border-blue-100 text-slate-500 hover:bg-blue-50'}`}><MessageSquare size={13} /></button>}
            <button onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100">Details <ChevronRight size={13} /></button>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }} title={expanded ? 'Collapse' : 'Expand'} className="rounded-md p-2 text-slate-400 hover:bg-blue-50">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-blue-100 bg-blue-50/40 px-5 py-3 text-[11px] text-slate-600">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <span><b className="text-slate-400">Run date:</b> {fmtDateShort(tile.demand_run_date)}</span>
            <span><b className="text-slate-400">Penalty:</b> <span className="text-red-600">{tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}</span></span>
            <span><b className="text-slate-400">Last paid:</b> {tile.last_paid_date ? `${fmtINR(tile.last_paid_amount ?? 0)} on ${fmtDateShort(tile.last_paid_date)}` : '—'}</span>
            <span><b className="text-slate-400">Group:</b> {tile.group_name || '—'} / {tile.subgroup || '—'}</span>
            <span className="flex items-start gap-1"><Phone size={12} /> {tile.owner_contact || '—'} <MapPin size={12} className="ml-2" /> {tile.owner_address || '—'}</span>
          </div>
        </motion.div>}
      </AnimatePresence>
    </motion.div>
  );
};

export default DemandListRecord;
