import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Phone, MapPin, Building2, Receipt,
  Calendar, Wallet, CheckCircle2, AlertTriangle,
  Loader2, ChevronRight, LayoutGrid, List, Table2,
  Filter, RotateCcw, Search, TrendingUp, ChevronLeft,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { ObjectSummaryModal } from '../components/dcc/ObjectSummaryView';
import { DemandSummaryModal } from '../components/dcc/DemandSummaryView';
import type { DccTile } from '../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtDateShort,
} from '../constants/dccTheme';

type ViewMode = 'card' | 'list' | 'table';
type KpiKey = 'ALL' | 'PAID' | 'OUTSTANDING' | 'OVERDUE';

// ── Client group type ──────────────────────────────────────────────────────────
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

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  active: boolean;
  onClick: () => void;
  iconBg: string;
  activeRing: string;
  delay: number;
}> = ({ icon, label, value, subValue, active, onClick, iconBg, activeRing, delay }) => (
  <motion.button
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative bg-white rounded-lg border shadow-sm overflow-hidden text-left transition-all duration-200 hover:shadow-md ${
      active ? `${activeRing} border-2` : 'border-slate-200 hover:border-slate-300'
    }`}
  >
    <div className="px-2.5 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`w-6 h-6 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500 leading-tight truncate">{label}</span>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-xs font-extrabold text-slate-900 tabular-nums leading-none">{value}</span>
        {subValue && (
          <span className="text-[8px] text-slate-400 leading-tight mt-0.5 whitespace-nowrap">{subValue}</span>
        )}
      </div>
    </div>
  </motion.button>
);

// ── Client Card View ────────────────────────────────────────────────────────────
const ClientCardView: React.FC<{
  group: ClientGroup;
  idx: number;
  onViewObject: () => void;
}> = ({ group, idx, onViewObject }) => {
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
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.15) }}
      whileHover={{ scale: 1.01 }}
      onClick={onViewObject}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all text-left overflow-hidden group"
    >
      <div className={`h-0.5 ${STRIP[group.overallStatus]} shrink-0`} />
      <div className="px-3 py-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {group.ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">{group.ownerName}</h3>
              <p className="text-[10px] text-slate-500 truncate">
                <Phone size={8} className="inline mr-1" />{group.ownerContact || '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
            group.overallStatus === 'OVERDUE' ? 'bg-red-50 text-red-600 border border-red-200' :
            group.overallStatus === 'DUE' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
            'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            {group.overallStatus}
          </span>
          <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(group.totalOutstanding)}</div>
          <div className="text-[9px] text-slate-400">of {fmtINR(group.totalDemand)}</div>
        </div>
      </div>
      <div className="px-3 pb-2 pt-1 grid grid-cols-3 md:grid-cols-6 gap-x-2 gap-y-1.5 border-t border-slate-100">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Run Date</span>
          <span className="text-xs font-semibold tabular-nums truncate text-slate-600">{runDateRange}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Due Date</span>
          <span className={`text-xs font-semibold tabular-nums truncate ${group.overallStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`}>{dueDateRange}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Demand</span>
          <span className="text-xs font-semibold tabular-nums truncate text-slate-800">{fmtINR(group.totalDemand)}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Paid</span>
          <span className="text-xs font-semibold tabular-nums truncate text-emerald-600">{fmtINR(group.totalPaid)}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Penalty</span>
          <span className="text-xs font-semibold tabular-nums truncate text-red-600">{group.overdueAmount > 0 ? fmtINR(group.overdueAmount) : '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Coll %</span>
          <span className="text-xs font-semibold tabular-nums truncate text-slate-700">{collectionPct}%</span>
        </div>
      </div>
      <div className="px-3 pb-2.5 pt-1 flex items-center gap-2 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{group.propertyCount} {group.propertyCount === 1 ? 'Object' : 'Objects'}</span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">· {group.demandCount} {group.demandCount === 1 ? 'Demand' : 'Demands'}</span>
        {group.demandTypes.slice(0, 2).map((dt) => (
          <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[8px] font-semibold shrink-0 whitespace-nowrap max-w-[80px] truncate">
            {dt.label}: {dt.count}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-bold text-white bg-blue-600 group-hover:bg-blue-700 transition-colors shrink-0">
          View Object <ChevronRight size={10} />
        </span>
      </div>
    </motion.button>
  );
};

// ── Client List View ────────────────────────────────────────────────────────────
const ClientListView: React.FC<{
  group: ClientGroup;
  idx: number;
  onViewObject: () => void;
}> = ({ group, idx, onViewObject }) => {
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
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.1) }}
      className="flex relative bg-white rounded-xl border border-slate-200 shadow-[0_4px_16px_rgba(30,64,175,0.06)] overflow-hidden hover:shadow-[0_8px_24px_rgba(30,64,175,0.1)] transition-all"
    >
      <div className={`w-1 shrink-0 ${STRIP[group.overallStatus]}`} />
      <button
        onClick={onViewObject}
        className="flex-1 flex items-center min-w-0 py-2 px-2.5 gap-2 text-left"
      >
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
            <span className={LABEL_CLS}>Objects</span>
            <span className="mt-0.5 text-[11px] font-bold text-blue-700 tabular-nums">{group.propertyCount}</span>
          </div>
          <div className="flex flex-col leading-tight shrink-0 w-[58px] pl-2 border-l border-slate-100">
            <span className={LABEL_CLS}>Demands</span>
            <span className="mt-0.5 text-[11px] font-bold text-slate-700 tabular-nums">{group.demandCount}</span>
          </div>
        </div>
        <div className="flex items-center min-w-0 overflow-hidden">
          <Field label="Run Date" value={runDateRange} valueCls="text-[10px] font-bold text-slate-600 tabular-nums" width="w-[80px]" />
          <Field label="Due Date" value={dueDateRange} valueCls={`text-[10px] font-bold tabular-nums ${group.overallStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`} width="w-[80px]" />
          <Field label="Demand Amt" value={fmtINR(group.totalDemand)} valueCls="text-[10px] font-bold text-slate-800 tabular-nums" width="w-[78px]" />
          <Field label="Paid Amt" value={fmtINR(group.totalPaid)} valueCls="text-[10px] font-bold text-emerald-600 tabular-nums" width="w-[72px]" />
          {group.overdueAmount > 0 && (
            <Field label="Overdue" value={fmtINR(group.overdueAmount)} valueCls="text-[10px] font-bold text-red-600 tabular-nums" width="w-[72px]" />
          )}
          <Field label="Coll %" value={`${collectionPct}%`} valueCls="text-[10px] font-bold text-slate-700 tabular-nums" width="w-[48px]" />
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
            <span className={`mt-0.5 text-[11px] font-extrabold tabular-nums leading-tight ${outstandingCls.value}`}>
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

// ── Client Table View ───────────────────────────────────────────────────────────
const ClientTableView: React.FC<{
  groups: ClientGroup[];
  onViewObject: (group: ClientGroup) => void;
}> = ({ groups, onViewObject }) => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="py-2 px-3 text-left font-bold text-slate-600">Client</th>
            <th className="py-2 px-3 text-left font-bold text-slate-600">Contact</th>
            <th className="py-2 px-3 text-center font-bold text-slate-600">Objects</th>
            <th className="py-2 px-3 text-center font-bold text-slate-600">Demands</th>
            <th className="py-2 px-3 text-left font-bold text-slate-600">Run Date</th>
            <th className="py-2 px-3 text-left font-bold text-slate-600">Due Date</th>
            <th className="py-2 px-3 text-right font-bold text-slate-600">Total Demand</th>
            <th className="py-2 px-3 text-right font-bold text-slate-600">Paid</th>
            <th className="py-2 px-3 text-right font-bold text-slate-600">Outstanding</th>
            <th className="py-2 px-3 text-right font-bold text-slate-600">Penalty</th>
            <th className="py-2 px-3 text-center font-bold text-slate-600">Status</th>
            <th className="py-2 px-3 text-center font-bold text-slate-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => {
            const st = DCC_STATUS[group.overallStatus === 'DUE' ? 'DUE' : group.overallStatus === 'OVERDUE' ? 'OVERDUE' : 'PAID'];
            const runDateRange = group.runDateMin
              ? `${fmtDateShort(group.runDateMin)}${group.runDateMax && group.runDateMin !== group.runDateMax ? `–${fmtDateShort(group.runDateMax)}` : ''}`
              : '—';
            const dueDateRange = group.dueDateMin
              ? `${fmtDateShort(group.dueDateMin)}${group.dueDateMax && group.dueDateMin !== group.dueDateMax ? `–${fmtDateShort(group.dueDateMax)}` : ''}`
              : '—';
            return (
              <tr
                key={group.ownerId}
                onClick={() => onViewObject(group)}
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                      {group.ownerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{group.ownerName}</span>
                  </div>
                </td>
                <td className="py-1.5 px-3 text-slate-500 text-[10px]">{group.ownerContact || '—'}</td>
                <td className="py-1.5 px-3 text-center font-semibold text-blue-700 tabular-nums">{group.propertyCount}</td>
                <td className="py-1.5 px-3 text-center font-semibold text-slate-700 tabular-nums">{group.demandCount}</td>
                <td className="py-1.5 px-3 text-slate-600">{runDateRange}</td>
                <td className="py-1.5 px-3">
                  <span className={group.overallStatus === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                    {dueDateRange}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-right font-semibold text-slate-700 tabular-nums">{fmtINR(group.totalDemand)}</td>
                <td className="py-1.5 px-3 text-right font-semibold text-emerald-600 tabular-nums">{fmtINR(group.totalPaid)}</td>
                <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">{fmtINR(group.totalOutstanding)}</td>
                <td className="py-1.5 px-3 text-right font-semibold text-red-600 tabular-nums">{group.overdueAmount > 0 ? fmtINR(group.overdueAmount) : '—'}</td>
                <td className="py-1.5 px-3 text-center">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                    {st.label}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewObject(group); }}
                    className="flex items-center gap-0.5 px-2 py-1 rounded text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    View Object <ChevronRight size={10} />
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

// ── Main Modal ──────────────────────────────────────────────────────────────────
interface DCCClientDueSummaryModalProps {
  ownerId: string;
  onClose: () => void;
}

export const DCCClientDueSummaryModal: React.FC<DCCClientDueSummaryModalProps> = ({ ownerId, onClose }) => {
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeKpi, setActiveKpi] = useState<KpiKey>('ALL');
  const [filterState, setFilterState] = useState({ searchText: '' });
  const [showFilter, setShowFilter] = useState(false);

  // Drill-down state
  const [objectModalOwnerId, setObjectModalOwnerId] = useState<string | null>(null);
  const [objectModalOwnerName, setObjectModalOwnerName] = useState('');
  const [objectModalOwnerContact, setObjectModalOwnerContact] = useState('');
  const [objectModalOwnerAddress, setObjectModalOwnerAddress] = useState('');
  const [demandModalObjectId, setDemandModalObjectId] = useState<string | null>(null);
  const [demandModalObjectRef, setDemandModalObjectRef] = useState('');

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const allTiles = await dccService.getTiles();
      const ownerTiles = allTiles.filter((t) => t.owner_id === ownerId);
      setTiles(ownerTiles);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load client summary');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const clientGroups = useMemo(() => groupByClient(tiles), [tiles]);

  // Since this modal is opened for a specific owner, there will be exactly 1 client group.
  // But we show it as a client summary screen with KPIs, views, and filter.
  const filteredGroups = useMemo(() => {
    let groups = clientGroups;
    if (activeKpi === 'PAID') groups = groups.filter(g => g.overallStatus === 'PAID');
    else if (activeKpi === 'OUTSTANDING') groups = groups.filter(g => g.overallStatus === 'DUE' || g.overallStatus === 'OVERDUE');
    else if (activeKpi === 'OVERDUE') groups = groups.filter(g => g.overallStatus === 'OVERDUE');

    const q = filterState.searchText.trim().toLowerCase();
    if (q) {
      groups = groups.filter(g =>
        (g.ownerName || '').toLowerCase().includes(q) ||
        (g.ownerContact || '').toLowerCase().includes(q)
      );
    }
    return groups;
  }, [clientGroups, activeKpi, filterState]);

  const first = tiles[0];
  const ownerName = first?.owner_name ?? 'Unknown Client';
  const ownerContact = first?.owner_contact ?? '';
  const ownerAddress = first?.owner_address ?? '';

  const totalDemand = tiles.reduce((s, t) => s + t.total_amount, 0);
  const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
  const totalOutstanding = tiles.reduce((s, t) => s + t.amount_due, 0);
  const overdueAmount = tiles.reduce((s, t) => s + t.overdue_amount, 0);
  const objectCount = new Set(tiles.map((t) => t.object_id)).size;
  const collectionRate = totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 100) : 0;

  const handleClearFilters = () => {
    setFilterState({ searchText: '' });
    setActiveKpi('ALL');
  };

  const handleViewObject = (group: ClientGroup) => {
    setObjectModalOwnerId(group.ownerId);
    setObjectModalOwnerName(group.ownerName);
    setObjectModalOwnerContact(group.ownerContact);
    setObjectModalOwnerAddress(group.ownerAddress);
  };

  const handleViewDemand = (objectId: string, objRef: string) => {
    setDemandModalObjectId(objectId);
    setDemandModalObjectRef(objRef);
  };

  const ViewModeSelector: React.FC = () => {
    const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
      { mode: 'card', icon: <LayoutGrid size={16} />, label: 'Card View' },
      { mode: 'list', icon: <List size={16} />, label: 'List View' },
      { mode: 'table', icon: <Table2 size={16} />, label: 'Table View' },
    ];
    return (
      <div className="inline-flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
        {modes.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`group relative flex items-center justify-center w-8 h-8 rounded-md transition-all ${
              viewMode === mode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 top-14 z-[51] flex flex-col bg-slate-50 rounded-t-2xl shadow-2xl overflow-hidden"
      >
        {/* Header — Client Summary */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-800 border-b border-blue-900 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <Users size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white">Client Due Summary</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-300 mt-0.5">
              <span className="font-semibold text-slate-200">{ownerName}</span>
              <span className="flex items-center gap-1">
                <Phone size={10} /> {ownerContact || '—'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={10} /> <span className="truncate max-w-[220px]">{ownerAddress || '—'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={10} /> {objectCount} {objectCount === 1 ? 'Object' : 'Objects'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-blue-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* KPI Cards + Controls */}
        {!loading && !error && tiles.length > 0 && (
          <div className="px-4 pt-3 pb-2 shrink-0 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <KpiCard icon={<Receipt size={12} className="text-white" />} label="Total Demand" value={fmtINR(totalDemand)} subValue={`${tiles.length} demands`} active={activeKpi === 'ALL'} onClick={() => setActiveKpi('ALL')} iconBg="bg-blue-500" activeRing="ring-2 ring-blue-400" delay={0} />
              <KpiCard icon={<CheckCircle2 size={12} className="text-white" />} label="Total Paid" value={fmtINR(totalPaid)} subValue="Collected" active={activeKpi === 'PAID'} onClick={() => setActiveKpi(prev => prev === 'PAID' ? 'ALL' : 'PAID')} iconBg="bg-emerald-500" activeRing="ring-2 ring-emerald-400" delay={0.04} />
              <KpiCard icon={<Wallet size={12} className="text-white" />} label="Outstanding" value={fmtINR(totalOutstanding)} subValue="Pending" active={activeKpi === 'OUTSTANDING'} onClick={() => setActiveKpi(prev => prev === 'OUTSTANDING' ? 'ALL' : 'OUTSTANDING')} iconBg="bg-amber-500" activeRing="ring-2 ring-amber-400" delay={0.08} />
              <KpiCard icon={<AlertTriangle size={12} className="text-white" />} label="Overdue" value={fmtINR(overdueAmount)} subValue="Penalty" active={activeKpi === 'OVERDUE'} onClick={() => setActiveKpi(prev => prev === 'OVERDUE' ? 'ALL' : 'OVERDUE')} iconBg="bg-red-500" activeRing="ring-2 ring-red-400" delay={0.12} />
              <KpiCard icon={<TrendingUp size={12} className="text-white" />} label="Collection Rate" value={`${collectionRate}%`} subValue={`${objectCount} objects`} active={activeKpi === 'ALL'} onClick={() => setActiveKpi('ALL')} iconBg="bg-slate-700" activeRing="ring-2 ring-slate-500" delay={0.16} />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(activeKpi !== 'ALL' || filterState.searchText) && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X size={12} /> Clear all
                  </button>
                )}
                <span className="text-[11px] text-slate-400">
                  Client — {activeKpi !== 'ALL' || filterState.searchText ? 'Filtered' : 'ALL'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ViewModeSelector />
                <button
                  onClick={() => setShowFilter(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <Filter size={13} /> Filter
                  {filterState.searchText && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                      1
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Client Summary Cards */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-emerald-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertTriangle size={28} className="mb-2" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <div className="text-sm font-medium text-slate-600">
                {tiles.length === 0 ? 'No demands found for this client' : 'No records match the selected filters'}
              </div>
              {(activeKpi !== 'ALL' || filterState.searchText) && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw size={12} /> Clear filters
                </button>
              )}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredGroups.map((group, idx) => (
                <ClientCardView key={group.ownerId} group={group} idx={idx} onViewObject={() => handleViewObject(group)} />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-2">
              {filteredGroups.map((group, idx) => (
                <ClientListView key={group.ownerId} group={group} idx={idx} onViewObject={() => handleViewObject(group)} />
              ))}
            </div>
          ) : (
            <ClientTableView groups={filteredGroups} onViewObject={handleViewObject} />
          )}
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilter && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                onClick={() => setShowFilter(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-slate-50 shadow-2xl z-[71] flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
                  <h2 className="text-sm font-bold text-white">Filter Clients</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterState({ searchText: '' })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Search</p>
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={filterState.searchText}
                        onChange={e => setFilterState({ searchText: e.target.value })}
                        placeholder="Client name or contact..."
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-teal-900 border-t border-slate-700 shrink-0">
                  <button
                    onClick={() => setShowFilter(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition-all"
                  >
                    <Search size={16} /> Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* HL2: Object Summary Modal */}
      <AnimatePresence>
        {objectModalOwnerId && !demandModalObjectId && (
          <ObjectSummaryModal
            ownerId={objectModalOwnerId}
            ownerName={objectModalOwnerName}
            ownerContact={objectModalOwnerContact}
            ownerAddress={objectModalOwnerAddress}
            onClose={() => setObjectModalOwnerId(null)}
            onViewObject={handleViewDemand}
          />
        )}
      </AnimatePresence>

      {/* HL3: Demand Summary Modal */}
      <AnimatePresence>
        {demandModalObjectId && (
          <DemandSummaryModal
            ownerId={objectModalOwnerId ?? ownerId}
            ownerName={objectModalOwnerName || ownerName}
            ownerContact={objectModalOwnerContact || ownerContact}
            ownerAddress={objectModalOwnerAddress || ownerAddress}
            objectId={demandModalObjectId}
            objectRef={demandModalObjectRef}
            onBack={() => { setDemandModalObjectId(null); setDemandModalObjectRef(''); }}
            onClose={() => {
              setDemandModalObjectId(null);
              setDemandModalObjectRef('');
              setObjectModalOwnerId(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DCCClientDueSummaryModal;
