import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DCCClientDueSummaryModal } from '../../pages/DCCClientDueSummaryPage';
import {
  Users, Wallet, ChevronDown, ChevronUp,
  MessageSquare, Eye, ChevronRight,
  Phone, MapPin, Building2, FileText,
  CalendarDays, AlertTriangle, TrendingUp,
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

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: 'PAID' | 'DUE' | 'OVERDUE' }> = ({ status }) => {
  const config = {
    PAID: { label: 'PAID', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    DUE: { label: 'DUE', cls: 'bg-amber-50 text-amber-700 border-amber-300' },
    OVERDUE: { label: 'OVERDUE', cls: 'bg-red-50 text-red-700 border-red-300' },
  };
  const s = config[status];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${s.cls} shrink-0`}>
      {s.label}
    </span>
  );
};

// ── Data point with icon ─────────────────────────────────────────────────────
const DataPoint: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueCls?: string;
}> = ({ icon, label, value, valueCls = 'text-slate-800' }) => (
  <div className="flex items-center gap-1 min-w-0 shrink-0">
    <span className="text-slate-400 shrink-0">{icon}</span>
    <div className="flex flex-col leading-tight min-w-0">
      <span className="text-[8px] font-bold uppercase tracking-wide text-slate-400 leading-none">{label}</span>
      <span className={`text-[10px] font-bold tabular-nums truncate leading-tight whitespace-nowrap ${valueCls}`}>{value || '—'}</span>
    </div>
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
    ? `${fmtDateShort(group.runDateMin)}${group.runDateMax && group.runDateMin !== group.runDateMax ? ` – ${fmtDateShort(group.runDateMax)}` : ''}`
    : '—';
  const dueDateRange = group.dueDateMin
    ? `${fmtDateShort(group.dueDateMin)}${group.dueDateMax && group.dueDateMin !== group.dueDateMax ? ` – ${fmtDateShort(group.dueDateMax)}` : ''}`
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
      <div className={`w-1.5 shrink-0 ${STRIP[group.overallStatus]}`} />

      {/* Outstanding panel — top-right corner */}
      <div className={`absolute top-2 right-2 z-10 flex flex-col items-end justify-center px-2.5 py-1 rounded-lg border ${outstandingCls.bg} ${outstandingCls.border}`}>
        <span className={`text-[8px] font-bold uppercase tracking-wide leading-none ${outstandingCls.label}`}>
          Outstanding
        </span>
        <span className={`text-sm font-extrabold tabular-nums leading-tight ${outstandingCls.value}`}>
          {fmtINR(group.totalOutstanding)}
        </span>
        <span className="text-[8px] text-slate-400 leading-none">{collectionPct}% collected</span>
      </div>

      <div className="flex-1 px-4 py-2">
        {/* ── Row 1: Client identity + data points + actions ── */}
        <div className="flex items-center gap-3 min-w-0 pr-32">
          {/* Avatar + Client name */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {group.ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{group.ownerName}</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[160px]">
                <Phone size={9} /> {group.ownerContact || '—'}
              </span>
            </div>
          </div>

          {/* Data points — single row, no wrapping */}
          <div className="flex items-center gap-2.5 flex-nowrap overflow-hidden min-w-0 flex-1">
            <DataPoint
              icon={<Building2 size={11} />}
              label="Properties"
              value={group.propertyCount}
              valueCls="text-blue-700"
            />
            <DataPoint
              icon={<FileText size={11} />}
              label="Demands"
              value={group.demandCount}
              valueCls="text-slate-700"
            />
            <DataPoint
              icon={<CalendarDays size={11} />}
              label="Run Date"
              value={runDateRange}
              valueCls="text-slate-600"
            />
            <DataPoint
              icon={<CalendarDays size={11} />}
              label="Due Date"
              value={dueDateRange}
              valueCls={group.overallStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}
            />
            {/* Demand type tags */}
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              {group.demandTypes.slice(0, 2).map((dt) => (
                <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-semibold shrink-0 whitespace-nowrap">
                  {dt.label} · {dt.count}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              title="View Details"
            >
              Details <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* ── Row 2: Financial summary ── */}
        <div className="flex items-center gap-2.5 mt-1.5 pt-1.5 border-t border-slate-100 pr-32">
          <DataPoint
            icon={<Wallet size={11} />}
            label="Total Demand"
            value={fmtINR(group.totalDemand)}
            valueCls="text-slate-800"
          />

          <DataPoint
            icon={<TrendingUp size={11} />}
            label="Paid"
            value={fmtINR(group.totalPaid)}
            valueCls="text-emerald-600"
          />

          {group.overdueAmount > 0 && (
            <DataPoint
              icon={<AlertTriangle size={11} />}
              label="Overdue"
              value={fmtINR(group.overdueAmount)}
              valueCls="text-red-600"
            />
          )}

          <DataPoint
            icon={<TrendingUp size={11} />}
            label="Collected"
            value={`${collectionPct}%`}
            valueCls="text-slate-700"
          />
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
    <div className="flex flex-col gap-2.5">
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
