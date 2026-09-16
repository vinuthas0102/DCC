import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ObjectSummaryModal } from './ObjectSummaryView';
import { DemandSummaryModal } from './DemandSummaryView';
import {
  Users, ChevronRight, Phone, MapPin,
  LayoutGrid, List, Table2,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import { fmtINR, fmtDateShort, DCC_STATUS } from '../../constants/dccTheme';

export interface ClientGroup {
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

export function groupByClient(tiles: DccTile[]): ClientGroup[] {
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

function dateRange(min: string | null, max: string | null): string {
  if (!min) return '—';
  return `${fmtDateShort(min)}${max && min !== max ? `–${fmtDateShort(max)}` : ''}`;
}

// ── Card layout (client summary as cards) ──────────────────────────────────────
const ClientCard: React.FC<{
  group: ClientGroup;
  idx: number;
  onViewDetails: () => void;
}> = ({ group, idx, onViewDetails }) => {
  const collectionPct = group.totalDemand > 0 ? Math.round((group.totalPaid / group.totalDemand) * 100) : 0;
  const runDateRange = dateRange(group.runDateMin, group.runDateMax);
  const dueDateRange = dateRange(group.dueDateMin, group.dueDateMax);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.15) }}
      whileHover={{ scale: 1.01 }}
      onClick={onViewDetails}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all text-left overflow-hidden"
    >
      <div className={`h-0.5 ${STRIP[group.overallStatus]} shrink-0`} />
      <div className="px-3 py-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {group.ownerName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Client</span>
          </div>
          <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">{group.ownerName}</h3>
          <p className="text-[10px] text-slate-500 truncate flex items-center gap-0.5">
            <Phone size={8} /> {group.ownerContact || '—'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
            group.overallStatus === 'OVERDUE' ? 'bg-red-50 text-red-600 border border-red-200' :
            group.overallStatus === 'DUE' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
            'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            {group.overallStatus}
          </span>
          <div className="text-[10px] font-bold text-slate-900 tabular-nums leading-tight">{fmtINR(group.totalOutstanding)}</div>
          <div className="text-[9px] text-slate-400">of {fmtINR(group.totalDemand)}</div>
        </div>
      </div>
      <div className="px-3 pb-2 pt-1 grid grid-cols-3 md:grid-cols-6 gap-x-2 gap-y-1.5 border-t border-slate-100">
        <Field label="Run Date" value={runDateRange} width="w-full" />
        <Field label="Due Date" value={dueDateRange} valueCls={group.overallStatus === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-900'} width="w-full" />
        <Field label="Total" value={fmtINR(group.totalDemand)} width="w-full" />
        <Field label="Paid" value={group.totalPaid > 0 ? fmtINR(group.totalPaid) : '—'} valueCls="text-emerald-600" width="w-full" />
        <Field label="Pending" value={group.totalOutstanding > 0 ? fmtINR(group.totalOutstanding) : '—'} valueCls="text-red-600" width="w-full" />
        <Field label="Penalty" value={group.overdueAmount > 0 ? fmtINR(group.overdueAmount) : '—'} valueCls="text-red-600" width="w-full" />
      </div>
      <div className="px-3 pb-2.5 pt-1 grid grid-cols-3 md:grid-cols-6 gap-x-2 gap-y-1.5 border-t border-slate-100 bg-slate-50/50">
        <Field label="Props" value={group.propertyCount} valueCls="text-blue-700" width="w-full" />
        <Field label="Demands" value={group.demandCount} valueCls="text-slate-700" width="w-full" />
        <Field label="Coll %" value={`${collectionPct}%`} valueCls="text-slate-700" width="w-full" />
        <div className="col-span-3 flex items-center gap-1 overflow-hidden">
          {group.demandTypes.slice(0, 3).map((dt) => (
            <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[8px] font-semibold shrink-0 whitespace-nowrap truncate max-w-[80px]">
              {dt.label}: {dt.count}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
};

// ── List layout (compact horizontal row) ───────────────────────────────────────
const ClientListRow: React.FC<{
  group: ClientGroup;
  idx: number;
  onViewDetails: () => void;
}> = ({ group, idx, onViewDetails }) => {
  const collectionPct = group.totalDemand > 0 ? Math.round((group.totalPaid / group.totalDemand) * 100) : 0;
  const runDateRange = dateRange(group.runDateMin, group.runDateMax);
  const dueDateRange = dateRange(group.dueDateMin, group.dueDateMax);

  const outstandingCls =
    group.totalOutstanding > 0
      ? group.overallStatus === 'OVERDUE'
        ? { bg: 'bg-red-50', border: 'border-red-200', label: 'text-red-500', value: 'text-red-700' }
        : { bg: 'bg-amber-50', border: 'border-amber-200', label: 'text-amber-500', value: 'text-amber-700' }
      : { bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'text-emerald-500', value: 'text-emerald-700' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.1) }}
      className="flex relative bg-white rounded-xl border border-slate-200 shadow-[0_4px_16px_rgba(30,64,175,0.06)] overflow-hidden hover:shadow-[0_8px_24px_rgba(30,64,175,0.1)] transition-all"
    >
      <div className={`w-1 shrink-0 ${STRIP[group.overallStatus]}`} />
      <button
        onClick={onViewDetails}
        className="flex-1 flex items-center min-w-0 py-2 px-2.5 gap-2 text-left"
      >
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {group.ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col leading-tight min-w-0 w-[120px] shrink-0">
            <span className="text-[11px] font-bold text-slate-900 truncate">{group.ownerName}</span>
            <span className="flex items-center gap-0.5 text-[8px] text-slate-400 truncate">
              <Phone size={7} /> {group.ownerContact || '—'}
            </span>
          </div>
          <div className="flex flex-col leading-tight shrink-0 w-[52px] pl-2 border-l border-slate-100">
            <span className={LABEL_CLS}>Props</span>
            <span className="mt-0.5 text-[10px] font-bold text-blue-700 tabular-nums">{group.propertyCount}</span>
          </div>
          <div className="flex flex-col leading-tight shrink-0 w-[58px] pl-2 border-l border-slate-100">
            <span className={LABEL_CLS}>Demands</span>
            <span className="mt-0.5 text-[10px] font-bold text-slate-700 tabular-nums">{group.demandCount}</span>
          </div>
        </div>
        <div className="flex items-center min-w-0 overflow-hidden">
          <Field label="Run Date" value={runDateRange} valueCls="text-slate-600" width="w-[80px]" />
          <Field label="Due Date" value={dueDateRange} valueCls={group.overallStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'} width="w-[80px]" />
          <Field label="Demand" value={fmtINR(group.totalDemand)} valueCls="text-slate-800" width="w-[78px]" />
          <Field label="Paid" value={fmtINR(group.totalPaid)} valueCls="text-emerald-600" width="w-[72px]" />
          {group.overdueAmount > 0 && (
            <Field label="Overdue" value={fmtINR(group.overdueAmount)} valueCls="text-red-600" width="w-[72px]" />
          )}
          <Field label="Coll %" value={`${collectionPct}%`} valueCls="text-slate-700" width="w-[48px]" />
          <div className="flex items-center gap-1 min-w-0 overflow-hidden pl-2 border-l border-slate-100">
            {group.demandTypes.slice(0, 2).map((dt) => (
              <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[8px] font-semibold shrink-0 whitespace-nowrap max-w-[80px] truncate">
                {dt.label}: {dt.count}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className={`flex flex-col items-end leading-tight px-2 py-1 rounded-lg border shrink-0 ${outstandingCls.bg} ${outstandingCls.border}`}>
            <span className={`text-[8px] font-semibold uppercase tracking-wider leading-none ${outstandingCls.label}`}>Outstanding</span>
            <span className={`mt-0.5 text-[10px] font-bold tabular-nums leading-tight ${outstandingCls.value}`}>
              {fmtINR(group.totalOutstanding)}
            </span>
          </div>
          <span className="flex items-center gap-0.5 px-2 py-1.5 rounded-md text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap shrink-0">
            View Object <ChevronRight size={10} />
          </span>
        </div>
      </button>
    </motion.div>
  );
};

// ── Table layout ───────────────────────────────────────────────────────────────
const ClientTable: React.FC<{
  groups: ClientGroup[];
  onRowClick: (group: ClientGroup) => void;
}> = ({ groups, onRowClick }) => {
  const TH = 'py-2 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap';
  const TD = 'py-1.5 px-3 text-[10px] align-middle';

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 'minmax(160px,1.5fr)' }} />
            <col className="w-[100px]" />
            <col className="w-[60px]" />
            <col className="w-[60px]" />
            <col className="w-[90px]" />
            <col className="w-[90px]" />
            <col className="w-[95px]" />
            <col className="w-[85px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[90px]" />
            <col className="w-[90px]" />
            <col className="w-[70px]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className={`${TH} text-left`}>Client</th>
              <th className={`${TH} text-left`}>Contact</th>
              <th className={`${TH} text-center`}>Props</th>
              <th className={`${TH} text-center`}>Demands</th>
              <th className={`${TH} text-left`}>Run Date</th>
              <th className={`${TH} text-left`}>Due Date</th>
              <th className={`${TH} text-right`}>Total Demand</th>
              <th className={`${TH} text-right`}>Paid</th>
              <th className={`${TH} text-right`}>Overdue</th>
              <th className={`${TH} text-right`}>Coll %</th>
              <th className={`${TH} text-right`}>Outstanding</th>
              <th className={`${TH} text-center`}>Status</th>
              <th className={`${TH} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.map((group, idx) => {
              const st = DCC_STATUS[group.overallStatus === 'DUE' ? 'DUE' : group.overallStatus === 'OVERDUE' ? 'OVERDUE' : 'PAID'];
              const collectionPct = group.totalDemand > 0 ? Math.round((group.totalPaid / group.totalDemand) * 100) : 0;
              const runDateRange = dateRange(group.runDateMin, group.runDateMax);
              const dueDateRange = dateRange(group.dueDateMin, group.dueDateMax);
              return (
                <tr
                  key={group.ownerId}
                  onClick={() => onRowClick(group)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                >
                  <td className={TD}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {group.ownerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-900 truncate">{group.ownerName}</span>
                    </div>
                  </td>
                  <td className={TD}>
                    <span className="text-[10px] text-slate-500 truncate">{group.ownerContact || '—'}</span>
                  </td>
                  <td className={`${TD} text-center`}>
                    <span className="text-[10px] font-bold text-blue-700 tabular-nums">{group.propertyCount}</span>
                  </td>
                  <td className={`${TD} text-center`}>
                    <span className="text-[10px] font-bold text-slate-700 tabular-nums">{group.demandCount}</span>
                  </td>
                  <td className={TD}>
                    <span className="text-[10px] text-slate-600 whitespace-nowrap">{runDateRange}</span>
                  </td>
                  <td className={TD}>
                    <span className={`text-[10px] whitespace-nowrap ${group.overallStatus === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                      {dueDateRange}
                    </span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <span className="text-[10px] font-semibold text-slate-700 tabular-nums whitespace-nowrap">{fmtINR(group.totalDemand)}</span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <span className="text-[10px] font-semibold text-emerald-600 tabular-nums whitespace-nowrap">{fmtINR(group.totalPaid)}</span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <span className="text-[10px] font-semibold text-red-600 tabular-nums whitespace-nowrap">{group.overdueAmount > 0 ? fmtINR(group.overdueAmount) : '—'}</span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <span className="text-[10px] font-semibold text-slate-700 tabular-nums whitespace-nowrap">{collectionPct}%</span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <span className="text-[10px] font-bold text-slate-900 tabular-nums whitespace-nowrap">{fmtINR(group.totalOutstanding)}</span>
                  </td>
                  <td className={`${TD} text-center`}>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className={`${TD} text-center`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRowClick(group); }}
                      className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0 whitespace-nowrap"
                    >
                      View <ChevronRight size={10} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  viewMode?: 'card' | 'table' | 'list';
}

export const ClientWiseView: React.FC<ClientWiseViewProps> = ({ tiles, viewMode = 'list' }) => {
  const clientGroups = useMemo(() => groupByClient(tiles), [tiles]);
  const [selectedClient, setSelectedClient] = useState<ClientGroup | null>(null);
  const [demandObjectId, setDemandObjectId] = useState<string | null>(null);
  const [demandObjectRef, setDemandObjectRef] = useState('');

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
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {clientGroups.map((group, idx) => (
            <ClientCard
              key={group.ownerId}
              group={group}
              idx={idx}
              onViewDetails={() => setSelectedClient(group)}
            />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <ClientTable groups={clientGroups} onRowClick={(g) => setSelectedClient(g)} />
      ) : (
        clientGroups.map((group, idx) => (
          <ClientListRow
            key={group.ownerId}
            group={group}
            idx={idx}
            onViewDetails={() => setSelectedClient(group)}
          />
        ))
      )}

      <AnimatePresence>
        {selectedClient && !demandObjectId && (
          <ObjectSummaryModal
            ownerId={selectedClient.ownerId}
            ownerName={selectedClient.ownerName}
            ownerContact={selectedClient.ownerContact}
            ownerAddress={selectedClient.ownerAddress}
            onClose={() => setSelectedClient(null)}
            onViewObject={(objId, objRef) => { setDemandObjectId(objId); setDemandObjectRef(objRef); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedClient && demandObjectId && (
          <DemandSummaryModal
            ownerId={selectedClient.ownerId}
            ownerName={selectedClient.ownerName}
            ownerContact={selectedClient.ownerContact}
            ownerAddress={selectedClient.ownerAddress}
            objectId={demandObjectId}
            objectRef={demandObjectRef}
            onBack={() => { setDemandObjectId(null); setDemandObjectRef(''); }}
            onClose={() => { setDemandObjectId(null); setDemandObjectRef(''); setSelectedClient(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientWiseView;
