import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DCCClientDueSummaryModal } from '../../pages/DCCClientDueSummaryPage';
import {
  Users, ChevronRight, Phone,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import { fmtINR, fmtDateShort } from '../../constants/dccTheme';

interface ClientGroup {
  ownerId: string;
  ownerName: string;
  ownerContact: string;
  ownerAddress: string;
  tiles: DccTile[];
  totalDemand: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  propertyCount: number;
  demandCount: number;
  demandTypes: { label: string; count: number; amount: number }[];
  runDateMin: string | null;
  runDateMax: string | null;
  dueDateMin: string | null;
  dueDateMax: string | null;
  overallStatus: 'PAID' | 'DUE' | 'OVERDUE';
}

function computeOverallStatus(tiles: DccTile[]): 'PAID' | 'DUE' | 'OVERDUE' {
  if (tiles.some((t) => t.status === 'OVERDUE')) return 'OVERDUE';
  if (tiles.every((t) => t.status === 'PAID' || t.status === 'EXEMPTED')) return 'PAID';
  return 'DUE';
}

function groupByClient(tiles: DccTile[]): ClientGroup[] {
  const map = new Map<string, DccTile[]>();
  for (const t of tiles) {
    const arr = map.get(t.owner_id) ?? [];
    arr.push(t);
    map.set(t.owner_id, arr);
  }

  const groups: ClientGroup[] = [];
  for (const [ownerId, ownerTiles] of map) {
    const first = ownerTiles[0];
    const totalDemand = ownerTiles.reduce((s, t) => s + t.total_amount, 0);
    const totalPaid = ownerTiles.reduce((s, t) => s + t.amount_paid, 0);
    const totalOutstanding = ownerTiles.reduce((s, t) => s + t.amount_due, 0);
    const overdueAmount = ownerTiles.reduce((s, t) => s + t.overdue_amount, 0);
    const propertyIds = new Set(ownerTiles.map((t) => t.object_id));

    const dtMap = new Map<string, { label: string; count: number; amount: number }>();
    for (const t of ownerTiles) {
      const key = t.demand_type_label || t.demand_type_code;
      const entry = dtMap.get(key) ?? { label: key, count: 0, amount: 0 };
      entry.count++;
      entry.amount += t.total_amount;
      dtMap.set(key, entry);
    }

    const runDates = ownerTiles.map((t) => t.demand_run_date).filter(Boolean) as string[];
    const dueDates = ownerTiles.map((t) => t.due_date).filter(Boolean) as string[];

    groups.push({
      ownerId,
      ownerName: first.owner_name,
      ownerContact: first.owner_contact || '',
      ownerAddress: first.owner_address || '',
      tiles: ownerTiles,
      totalDemand,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      propertyCount: propertyIds.size,
      demandCount: ownerTiles.length,
      demandTypes: Array.from(dtMap.values()),
      runDateMin: runDates.length ? runDates.sort()[0] : null,
      runDateMax: runDates.length ? runDates.sort().at(-1) ?? null : null,
      dueDateMin: dueDates.length ? dueDates.sort()[0] : null,
      dueDateMax: dueDates.length ? dueDates.sort().at(-1) ?? null : null,
      overallStatus: computeOverallStatus(ownerTiles),
    });
  }

  groups.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  return groups;
}

const STRIP: Record<'PAID' | 'DUE' | 'OVERDUE', string> = {
  PAID: 'bg-emerald-500',
  DUE: 'bg-amber-400',
  OVERDUE: 'bg-red-500',
};

const LABEL_CLS = 'text-[8px] font-semibold text-slate-400 uppercase tracking-wider leading-none';
const VALUE_CLS = 'text-[10px] font-bold text-slate-800 tabular-nums leading-tight';

const Field: React.FC<{
  label: string;
  value: React.ReactNode;
  valueCls?: string;
  width?: string;
}> = ({ label, value, valueCls = VALUE_CLS, width = 'w-[72px]' }) => (
  <div className={`flex flex-col justify-center shrink-0 ${width} border-r border-slate-100 pr-2`}>
    <span className={LABEL_CLS}>{label}</span>
    <span className={`mt-0.5 truncate whitespace-nowrap ${valueCls}`}>{value || '—'}</span>
  </div>
);

const ClientSummaryCard: React.FC<{
  group: ClientGroup;
  onViewDetails: () => void;
}> = ({ group, onViewDetails }) => {
  const collectionPct = group.totalDemand > 0 ? Math.round((group.totalPaid / group.totalDemand) * 100) : 0;
  const runDateRange = group.runDateMin
    ? `${fmtDateShort(group.runDateMin)}${group.runDateMax && group.runDateMin !== group.runDateMax ? `–${fmtDateShort(group.runDateMax)}` : ''}`
    : '—';
  const dueDateRange = group.dueDateMin
    ? `${fmtDateShort(group.dueDateMin)}${group.dueDateMax && group.dueDateMin !== group.dueDateMax ? `–${fmtDateShort(group.dueDateMax)}` : ''}`
    : '—';

  const outstandingCls =
    group.totalOutstanding > 0
      ? group.overallStatus === 'OVERDUE'
        ? { bg: 'bg-red-50', border: 'border-red-200', label: 'text-red-500', value: 'text-red-700' }
        : { bg: 'bg-amber-50', border: 'border-amber-200', label: 'text-amber-500', value: 'text-amber-700' }
      : { bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'text-emerald-500', value: 'text-emerald-700' };

  return (
    <div className="flex relative">
      <div className={`w-1 shrink-0 ${STRIP[group.overallStatus]}`} />

      <div className="flex-1 flex items-center min-w-0 py-2 px-2.5 gap-2">
        {/* Left: Identity + counts — fixed block */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {group.ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col leading-tight min-w-0 w-[110px] shrink-0">
            <span className="text-[11px] font-bold text-slate-900 truncate">{group.ownerName}</span>
            <span className="flex items-center gap-0.5 text-[8px] text-slate-400 truncate">
              <Phone size={7} /> {group.ownerContact || '—'}
            </span>
          </div>
          <div className="flex flex-col leading-tight shrink-0 w-[52px] pl-2 border-l border-slate-100">
            <span className={LABEL_CLS}>Props</span>
            <span className="mt-0.5 text-[11px] font-bold text-blue-700 tabular-nums">{group.propertyCount}</span>
          </div>
          <div className="flex flex-col leading-tight shrink-0 w-[58px] pl-2 border-l border-slate-100">
            <span className={LABEL_CLS}>Demands</span>
            <span className="mt-0.5 text-[11px] font-bold text-slate-700 tabular-nums">{group.demandCount}</span>
          </div>
        </div>

        {/* Center: Fixed-width metric fields — aligned across all rows */}
        <div className="flex items-center min-w-0 overflow-hidden">
          <Field label="Run Date" value={runDateRange} valueCls="text-[10px] font-bold text-slate-600 tabular-nums" width="w-[80px]" />
          <Field label="Due Date" value={dueDateRange} valueCls={`text-[10px] font-bold tabular-nums ${group.overallStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} width="w-[80px]" />
          <Field label="Demand Amt" value={fmtINR(group.totalDemand)} valueCls="text-[10px] font-bold text-slate-800 tabular-nums" width="w-[78px]" />
          <Field label="Paid Amt" value={fmtINR(group.totalPaid)} valueCls="text-[10px] font-bold text-emerald-600 tabular-nums" width="w-[72px]" />
          {group.overdueAmount > 0 && (
            <Field label="Overdue" value={fmtINR(group.overdueAmount)} valueCls="text-[10px] font-bold text-red-600 tabular-nums" width="w-[72px]" />
          )}
          <Field label="Coll %" value={`${collectionPct}%`} valueCls="text-[10px] font-bold text-slate-700 tabular-nums" width="w-[48px]" />
          {/* Transaction type pills — own bordered section */}
          <div className="flex items-center gap-1 min-w-0 overflow-hidden pl-2 border-l border-slate-100">
            {group.demandTypes.slice(0, 2).map((dt) => (
              <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[8px] font-semibold shrink-0 whitespace-nowrap max-w-[80px] truncate">
                {dt.label}: {dt.count}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Outstanding + button — fixed block */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className={`flex flex-col items-end leading-tight px-2 py-1 rounded-lg border shrink-0 ${outstandingCls.bg} ${outstandingCls.border}`}>
            <span className={`text-[8px] font-semibold uppercase tracking-wider leading-none ${outstandingCls.label}`}>Outstanding</span>
            <span className={`mt-0.5 text-[11px] font-extrabold tabular-nums leading-tight ${outstandingCls.value}`}>
              {fmtINR(group.totalOutstanding)}
            </span>
          </div>

          <button
            onClick={onViewDetails}
            className="flex items-center gap-0.5 px-2 py-1.5 rounded-md text-[9px] font-bold text-white bg-blue-500/20 backdrop-blur-md border border-blue-400/40 hover:bg-blue-500/30 hover:border-blue-400/60 transition-colors shadow-sm whitespace-nowrap shrink-0"
            title="View Demand"
          >
            View Demand <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ClientWiseViewProps {
  tiles: DccTile[];
  onViewDetails: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
  chatTileId: string | null;
}

export const ClientWiseView: React.FC<ClientWiseViewProps> = ({ tiles }) => {
  const clientGroups = useMemo(() => groupByClient(tiles), [tiles]);
  const [summaryOwnerId, setSummaryOwnerId] = useState<string | null>(null);

  if (clientGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Users size={32} className="mb-2 opacity-30" />
        <div className="text-sm font-medium text-slate-600">No client records found</div>
        <div className="text-xs mt-1">Try adjusting your filters.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {clientGroups.map((group) => (
        <motion.div
          key={group.ownerId}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-xl border border-slate-200 shadow-[0_4px_16px_rgba(30,64,175,0.06)] overflow-hidden hover:shadow-[0_8px_24px_rgba(30,64,175,0.1)] transition-all"
        >
          <ClientSummaryCard
            group={group}
            onViewDetails={() => setSummaryOwnerId(group.ownerId)}
          />
        </motion.div>
      ))}

      <AnimatePresence>
        {summaryOwnerId && (
          <DCCClientDueSummaryModal
            ownerId={summaryOwnerId}
            onClose={() => setSummaryOwnerId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientWiseView;
