import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DCCClientDueSummaryModal } from '../../pages/DCCClientDueSummaryPage';
import {
  Users, ChevronDown, ChevronUp,
  MessageSquare, Eye, ChevronRight,
  Phone, Building2, FileText,
  CalendarDays, AlertTriangle, TrendingUp, Wallet,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtDateShort,
} from '../../constants/dccTheme';

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function computeOverallStatus(tiles: DccTile[]): 'PAID' | 'DUE' | 'OVERDUE' {
  const hasOverdue = tiles.some((t) => t.status === 'OVERDUE');
  if (hasOverdue) return 'OVERDUE';
  const allPaid = tiles.every((t) => t.status === 'PAID' || t.status === 'EXEMPTED');
  if (allPaid) return 'PAID';
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

// ── Status strip color ───────────────────────────────────────────────────────
const STRIP: Record<'PAID' | 'DUE' | 'OVERDUE', string> = {
  PAID: 'bg-emerald-500',
  DUE: 'bg-amber-400',
  OVERDUE: 'bg-red-500',
};

// ── Label-Value pair ──────────────────────────────────────────────────────────
const LABEL_CLS = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none';
const VALUE_CLS = 'text-xs font-bold text-slate-800 tabular-nums leading-tight';

const Metric: React.FC<{
  label: string;
  value: React.ReactNode;
  valueCls?: string;
  icon?: React.ReactNode;
}> = ({ label, value, valueCls = VALUE_CLS, icon }) => (
  <div className="flex flex-col justify-center min-w-0 px-2.5 border-r border-slate-100 last:border-r-0">
    <span className="flex items-center gap-0.5">
      {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
      <span className={LABEL_CLS}>{label}</span>
    </span>
    <span className={`mt-0.5 truncate whitespace-nowrap ${valueCls}`}>{value || '—'}</span>
  </div>
);

// ── Client summary card ──────────────────────────────────────────────────────
const ClientSummaryCard: React.FC<{
  group: ClientGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
}> = ({ group, isExpanded, onToggle, onViewDetails }) => {
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
      {/* Left status strip */}
      <div className={`w-1 shrink-0 ${STRIP[group.overallStatus]}`} />

      {/* Grid: [auto — left block] [1fr — center block] [auto — right block] */}
      <div
        className="flex-1 grid items-center min-w-0 py-2 px-3 gap-2"
        style={{ gridTemplateColumns: 'auto 1fr auto' }}
      >
        {/* ── Left Block: Identity & Counts ── */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {group.ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col leading-tight min-w-0 shrink-0">
            <span className="text-[12px] font-bold text-slate-900 truncate max-w-[130px]">{group.ownerName}</span>
            <span className="flex items-center gap-0.5 text-[9px] text-slate-400 truncate max-w-[130px]">
              <Phone size={8} /> {group.ownerContact || '—'}
            </span>
          </div>
          <div className="flex flex-col leading-tight shrink-0 pl-2.5 border-l border-slate-100">
            <span className={LABEL_CLS}>PROP</span>
            <span className="mt-0.5 text-xs font-bold text-blue-700 tabular-nums">{group.propertyCount}</span>
          </div>
          <div className="flex flex-col leading-tight shrink-0">
            <span className={LABEL_CLS}>DEM</span>
            <span className="mt-0.5 text-xs font-bold text-slate-700 tabular-nums">{group.demandCount}</span>
          </div>
        </div>

        {/* ── Center Block: Dates, Financial Metrics & Tags ── */}
        <div className="flex items-center min-w-0 overflow-hidden">
          <Metric label="RUN" value={runDateRange} icon={<CalendarDays size={10} />} valueCls="text-[11px] font-bold text-slate-600 tabular-nums" />
          <Metric label="DUE" value={dueDateRange} icon={<CalendarDays size={10} />} valueCls={`text-[11px] font-bold tabular-nums ${group.overallStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} />
          <Metric label="DEMAND" value={fmtINR(group.totalDemand)} icon={<Wallet size={10} />} valueCls="text-[11px] font-bold text-slate-800 tabular-nums" />
          <Metric label="PAID" value={fmtINR(group.totalPaid)} icon={<TrendingUp size={10} />} valueCls="text-[11px] font-bold text-emerald-600 tabular-nums" />
          {group.overdueAmount > 0 && (
            <Metric label="OD" value={fmtINR(group.overdueAmount)} icon={<AlertTriangle size={10} />} valueCls="text-[11px] font-bold text-red-600 tabular-nums" />
          )}
          <Metric label="COLL" value={`${collectionPct}%`} valueCls="text-[11px] font-bold text-slate-700 tabular-nums" />
          {/* Transaction type pills */}
          <div className="flex items-center gap-1 min-w-0 overflow-hidden pl-2.5">
            {group.demandTypes.slice(0, 2).map((dt) => (
              <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-semibold shrink-0 whitespace-nowrap">
                {dt.label}: {dt.count}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right Block: Outstanding + Controls ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Outstanding badge */}
          <div className={`flex flex-col items-end leading-tight px-2.5 py-1 rounded-lg border shrink-0 ${outstandingCls.bg} ${outstandingCls.border}`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider leading-none ${outstandingCls.label}`}>Outstanding</span>
            <span className={`mt-0.5 text-xs font-extrabold tabular-nums leading-tight ${outstandingCls.value}`}>
              {fmtINR(group.totalOutstanding)}
            </span>
          </div>

          {/* Expand/collapse chevron */}
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-100 transition-colors shrink-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Details button */}
          <button
            onClick={onViewDetails}
            className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
            title="View Details"
          >
            Details <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Demand details table ──────────────────────────────────────────────────────
const ClientDemandTable: React.FC<{
  tiles: DccTile[];
  onViewDetails: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
  chatTileId: string | null;
}> = ({ tiles, onViewDetails, onChat, onShowDuePayment, chatTileId }) => {
  return (
    <div className="overflow-x-auto bg-slate-50/50">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wide">Property / Description</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wide">Type</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wide">Run Date</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wide">Due Date</th>
            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500 tracking-wide">Total</th>
            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500 tracking-wide">Paid</th>
            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500 tracking-wide">Balance</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase text-slate-500 tracking-wide">Status</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase text-slate-500 tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tiles.map((tile) => {
            const st = DCC_STATUS[tile.status];
            const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';
            return (
              <tr key={tile.id} className="hover:bg-white transition-colors">
                <td className="px-3 py-2">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[220px]">{tile.object_description || tile.object_ref}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[220px]">{tile.object_ref} · {tile.object_type}</div>
                </td>
                <td className="px-3 py-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{tile.demand_type_label}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-[11px] text-slate-600 tabular-nums">{fmtDateShort(tile.demand_run_date)}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-[11px] font-medium tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`}>
                    {fmtDateShort(tile.due_date)}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{fmtINR(tile.total_amount)}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="text-[11px] font-semibold text-emerald-600 tabular-nums">{fmtINR(tile.amount_paid)}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="text-xs font-bold text-slate-900 tabular-nums">{fmtINR(tile.amount_due)}</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                    {st.label}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onViewDetails(tile)}
                      title="View Details"
                      className="p-1.5 rounded text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <Eye size={13} />
                    </button>
                    {canShowDue && (
                      <button
                        onClick={() => onShowDuePayment(tile)}
                        title="Due Payment"
                        className="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <ChevronDown size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => onChat(tile)}
                      title="Chat"
                      className={`p-1.5 rounded transition-colors ${chatTileId === tile.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
export interface ClientWiseViewProps {
  tiles: DccTile[];
  onViewDetails: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
  chatTileId: string | null;
}

export const ClientWiseView: React.FC<ClientWiseViewProps> = ({
  tiles, onViewDetails, onChat, onShowDuePayment, chatTileId,
}) => {
  const clientGroups = useMemo(() => groupByClient(tiles), [tiles]);

  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [summaryOwnerId, setSummaryOwnerId] = useState<string | null>(null);

  const toggleClient = (id: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      {clientGroups.map((group) => {
        const isExpanded = expandedClients.has(group.ownerId);
        return (
          <motion.div
            key={group.ownerId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-xl border border-slate-200 shadow-[0_4px_16px_rgba(30,64,175,0.06)] overflow-hidden hover:shadow-[0_8px_24px_rgba(30,64,175,0.1)] transition-all"
          >
            <ClientSummaryCard
              group={group}
              isExpanded={isExpanded}
              onToggle={() => toggleClient(group.ownerId)}
              onViewDetails={() => setSummaryOwnerId(group.ownerId)}
            />

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-200"
                >
                  <ClientDemandTable
                    tiles={group.tiles}
                    onViewDetails={onViewDetails}
                    onChat={onChat}
                    onShowDuePayment={onShowDuePayment}
                    chatTileId={chatTileId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

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
