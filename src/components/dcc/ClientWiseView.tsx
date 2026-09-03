import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DCCClientDueSummaryModal } from '../../pages/DCCClientDueSummaryPage';
import {
  Users, Phone, MapPin, Building2, Receipt, Calendar, Wallet,
  CheckCircle2, AlertTriangle, Clock, ChevronDown, ChevronUp,
  MessageSquare, Eye, ChevronRight,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDate, fmtDateShort,
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

    // Demand type breakdown
    const dtMap = new Map<string, { label: string; count: number; amount: number }>();
    for (const t of ownerTiles) {
      const key = t.demand_type_label || t.demand_type_code;
      const entry = dtMap.get(key) ?? { label: key, count: 0, amount: 0 };
      entry.count++;
      entry.amount += t.total_amount;
      dtMap.set(key, entry);
    }

    // Date ranges
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

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: 'PAID' | 'DUE' | 'OVERDUE' }> = ({ status }) => {
  const config = {
    PAID: { label: 'PAID', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    DUE: { label: 'DUE', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
    OVERDUE: { label: 'OVERDUE', cls: 'bg-red-100 text-red-700 border-red-300' },
  };
  const s = config[status];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ── Client summary card (4-column high-density) ──────────────────────────────
const ClientSummaryCard: React.FC<{
  group: ClientGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
}> = ({ group, isExpanded, onToggle, onViewDetails }) => {
  const initials = group.ownerName.charAt(0).toUpperCase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
      {/* Column 1: Client Info */}
      <div className="bg-white px-3 py-2.5 flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-slate-900 truncate leading-tight">{group.ownerName}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
            <Phone size={9} className="shrink-0" />
            <span className="truncate">{group.ownerContact || '—'}</span>
          </div>
          <div className="flex items-start gap-1 mt-0.5 text-[10px] text-slate-500">
            <MapPin size={9} className="shrink-0 mt-0.5" />
            <span className="truncate">{group.ownerAddress || '—'}</span>
          </div>
          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">
            <Building2 size={9} /> {group.propertyCount} {group.propertyCount === 1 ? 'Property' : 'Properties'}
          </span>
        </div>
      </div>

      {/* Column 2: Demand Overview */}
      <div className="bg-white px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Receipt size={11} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Demand Overview</span>
        </div>
        <div className="text-sm font-extrabold text-slate-900 tabular-nums">{group.demandCount} Demands</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {group.demandTypes.slice(0, 4).map((dt) => (
            <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">
              {dt.label} · {dt.count}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
          <Calendar size={9} />
          <span>
            Run: {fmtDateShort(group.runDateMin)}{group.runDateMax && group.runDateMin !== group.runDateMax ? `–${fmtDateShort(group.runDateMax)}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock size={9} />
          <span>
            Due: {fmtDateShort(group.dueDateMin)}{group.dueDateMax && group.dueDateMin !== group.dueDateMax ? `–${fmtDateShort(group.dueDateMax)}` : ''}
          </span>
        </div>
      </div>

      {/* Column 3: Financial Breakdown */}
      <div className="bg-white px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Wallet size={11} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Financial Breakdown</span>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Total Demand</span>
            <span className="text-xs font-bold text-slate-900 tabular-nums">{fmtINR(group.totalDemand)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <CheckCircle2 size={9} className="text-emerald-500" /> Total Paid
            </span>
            <span className="text-xs font-bold text-emerald-600 tabular-nums">{fmtINR(group.totalPaid)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Outstanding</span>
            <span className="text-sm font-extrabold text-red-600 tabular-nums">{fmtINR(group.totalOutstanding)}</span>
          </div>
          {group.overdueAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <AlertTriangle size={9} className="text-red-500" /> Overdue
              </span>
              <span className="text-xs font-bold text-red-700 tabular-nums">{fmtINR(group.overdueAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Column 4: Status & Actions */}
      <div className="bg-white px-3 py-2.5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={group.overallStatus} />
          <button
            onClick={onToggle}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <div className="text-[9px] text-slate-400">
          Collection: {group.totalDemand > 0 ? Math.round((group.totalPaid / group.totalDemand) * 100) : 0}%
        </div>
        {/* View Details button at bottom-right */}
        <div className="mt-auto flex justify-end">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            title="View Details"
          >
            View Details <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Demand details table ──────────────────────────────────────────────────────
const ClientDemandTable: React.FC<{
  tiles: DccTile[];
  onPay: (tile: DccTile) => void;
  onViewDetails: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
  canRecordPayment: boolean;
  chatTileId: string | null;
}> = ({ tiles, onPay, onViewDetails, onChat, onShowDuePayment, canRecordPayment, chatTileId }) => {
  return (
    <div className="overflow-x-auto bg-slate-50/40">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-3 py-1.5 text-left text-[9px] font-bold uppercase text-slate-500 tracking-wide">Property / Description</th>
            <th className="px-3 py-1.5 text-left text-[9px] font-bold uppercase text-slate-500 tracking-wide">Demand Type</th>
            <th className="px-3 py-1.5 text-left text-[9px] font-bold uppercase text-slate-500 tracking-wide">Run Date</th>
            <th className="px-3 py-1.5 text-left text-[9px] font-bold uppercase text-slate-500 tracking-wide">Due Date</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold uppercase text-slate-500 tracking-wide">Total</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold uppercase text-slate-500 tracking-wide">Paid</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold uppercase text-slate-500 tracking-wide">Balance</th>
            <th className="px-3 py-1.5 text-center text-[9px] font-bold uppercase text-slate-500 tracking-wide">Status</th>
            <th className="px-3 py-1.5 text-center text-[9px] font-bold uppercase text-slate-500 tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tiles.map((tile) => {
            const st = DCC_STATUS[tile.status];
            const canPay = (tile.status === 'DUE' || tile.status === 'OVERDUE') && canRecordPayment;
            const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';
            return (
              <tr key={tile.id} className="hover:bg-white transition-colors">
                <td className="px-3 py-1.5">
                  <div className="text-[11px] font-semibold text-slate-900 truncate max-w-[180px]">{tile.object_description || tile.object_ref}</div>
                  <div className="text-[9px] text-slate-400 truncate max-w-[180px]">{tile.object_ref} · {tile.object_type}</div>
                </td>
                <td className="px-3 py-1.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{tile.demand_type_label}</span>
                </td>
                <td className="px-3 py-1.5">
                  <span className="text-[10px] text-slate-600">{fmtDateShort(tile.demand_run_date)}</span>
                </td>
                <td className="px-3 py-1.5">
                  <span className={`text-[10px] font-medium ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`}>
                    {fmtDateShort(tile.due_date)}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="text-[10px] font-semibold text-slate-700 tabular-nums">{fmtINR(tile.total_amount)}</span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="text-[10px] font-semibold text-emerald-600 tabular-nums">{fmtINR(tile.amount_paid)}</span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="text-[11px] font-bold text-slate-900 tabular-nums">{fmtINR(tile.amount_due)}</span>
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                    {st.label}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onViewDetails(tile)}
                      title="View Details"
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <Eye size={11} />
                    </button>
                    {canPay && (
                      <button
                        onClick={() => onPay(tile)}
                        title="Pay Now"
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Wallet size={11} />
                      </button>
                    )}
                    {canShowDue && !canPay && (
                      <button
                        onClick={() => onShowDuePayment(tile)}
                        title="Due Payment"
                        className="p-1 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Clock size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => onChat(tile)}
                      title="Chat"
                      className={`p-1 rounded transition-colors ${chatTileId === tile.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      <MessageSquare size={11} />
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
  onPay: (tile: DccTile) => void;
  onViewDetails: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
  canRecordPayment: boolean;
  chatTileId: string | null;
}

export const ClientWiseView: React.FC<ClientWiseViewProps> = ({
  tiles, onPay, onViewDetails, onChat, onShowDuePayment, canRecordPayment, chatTileId,
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
    <div className="flex flex-col gap-3">
      {/* Client groups */}
      {clientGroups.map((group) => {
        const isExpanded = expandedClients.has(group.ownerId);
        return (
          <motion.div
            key={group.ownerId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Summary card */}
            <ClientSummaryCard
              group={group}
              isExpanded={isExpanded}
              onToggle={() => toggleClient(group.ownerId)}
              onViewDetails={() => setSummaryOwnerId(group.ownerId)}
            />

            {/* Expanded demand details table */}
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
                    onPay={onPay}
                    onViewDetails={onViewDetails}
                    onChat={onChat}
                    onShowDuePayment={onShowDuePayment}
                    canRecordPayment={canRecordPayment}
                    chatTileId={chatTileId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Client Due Summary Overlay */}
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
