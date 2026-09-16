import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Phone, MapPin, Building2, Receipt,
  Calendar, Clock, Wallet, CheckCircle2, AlertTriangle,
  Loader2, ChevronRight, LayoutGrid, List, Table2,
  Filter, RotateCcw, Search, TrendingUp, ChevronLeft,
  Car, FileText, Home, Landmark, CircleDollarSign, Eye,
} from 'lucide-react';
import { dccService } from '../../services/dccService';
import type { DccTile, DccDemandStatus } from '../../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtDateShort,
} from '../../constants/dccTheme';

type ViewMode = 'card' | 'list' | 'table';
type KpiKey = 'ALL' | 'PAID' | 'OUTSTANDING' | 'OVERDUE';

interface ObjectGroup {
  objectId: string;
  objectRef: string;
  objectDescription: string;
  objectType: string;
  region: string | null;
  groupName: string | null;
  tiles: DccTile[];
  totalDemand: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
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

function groupByObject(tiles: DccTile[]): ObjectGroup[] {
  const map = new Map<string, DccTile[]>();
  for (const t of tiles) {
    const arr = map.get(t.object_id) ?? [];
    arr.push(t);
    map.set(t.object_id, arr);
  }

  const groups: ObjectGroup[] = [];
  for (const [objectId, objTiles] of map) {
    const first = objTiles[0];
    const totalDemand = objTiles.reduce((s, t) => s + t.total_amount, 0);
    const totalPaid = objTiles.reduce((s, t) => s + t.amount_paid, 0);
    const totalOutstanding = objTiles.reduce((s, t) => s + t.amount_due, 0);
    const overdueAmount = objTiles.reduce((s, t) => s + t.overdue_amount, 0);

    const dtMap = new Map<string, { label: string; count: number; amount: number }>();
    for (const t of objTiles) {
      const key = t.demand_type_label || t.demand_type_code;
      const entry = dtMap.get(key) ?? { label: key, count: 0, amount: 0 };
      entry.count++;
      entry.amount += t.total_amount;
      dtMap.set(key, entry);
    }

    const runDates = objTiles.map((t) => t.demand_run_date).filter(Boolean) as string[];
    const dueDates = objTiles.map((t) => t.due_date).filter(Boolean) as string[];

    groups.push({
      objectId,
      objectRef: first.object_ref,
      objectDescription: first.object_description,
      objectType: first.object_type,
      region: first.region,
      groupName: first.group_name,
      tiles: objTiles,
      totalDemand,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      demandCount: objTiles.length,
      demandTypes: Array.from(dtMap.values()),
      runDateMin: runDates.length ? runDates.sort()[0] : null,
      runDateMax: runDates.length ? runDates.sort().at(-1) ?? null : null,
      dueDateMin: dueDates.length ? dueDates.sort()[0] : null,
      dueDateMax: dueDates.length ? dueDates.sort().at(-1) ?? null : null,
      overallStatus: computeOverallStatus(objTiles),
    });
  }

  groups.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  return groups;
}

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

const STRIP: Record<'PAID' | 'DUE' | 'OVERDUE', string> = {
  PAID: 'bg-emerald-500',
  DUE: 'bg-amber-400',
  OVERDUE: 'bg-red-500',
};

const STATUS_OPTIONS: { value: DccDemandStatus; label: string }[] = [
  { value: 'DUE', label: 'Due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
  { value: 'EXEMPTED', label: 'Exempted' },
];

interface LocalFilterState {
  statuses: DccDemandStatus[];
  demandTypeCodes: string[];
  searchText: string;
}

const emptyFilterState: LocalFilterState = {
  statuses: [],
  demandTypeCodes: [],
  searchText: '',
};

const toggleArray = <T,>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

const countActiveFilters = (s: LocalFilterState): number => {
  let n = 0;
  n += s.statuses.length;
  n += s.demandTypeCodes.length;
  if (s.searchText.trim()) n++;
  return n;
};

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

const LV: React.FC<{ label: string; value: React.ReactNode; valueCls?: string; width?: string }> = ({
  label, value, valueCls = 'text-slate-900', width = 'w-[80px]',
}) => (
  <div className={`flex flex-col justify-center shrink-0 ${width} border-r border-slate-100 pr-2 overflow-hidden`}>
    <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider leading-none">{label}</span>
    <span className={`mt-0.5 truncate whitespace-nowrap text-[10px] font-bold tabular-nums leading-tight ${valueCls}`}>{value || '—'}</span>
  </div>
);

interface ObjectSummaryModalProps {
  ownerId: string;
  ownerName: string;
  ownerContact: string;
  ownerAddress: string;
  onClose: () => void;
  onViewObject: (objectId: string, objectRef: string) => void;
}

export const ObjectSummaryModal: React.FC<ObjectSummaryModalProps> = ({
  ownerId, ownerName, ownerContact, ownerAddress, onClose, onViewObject,
}) => {
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeKpi, setActiveKpi] = useState<KpiKey>('ALL');
  const [filterState, setFilterState] = useState<LocalFilterState>(emptyFilterState);
  const [showFilter, setShowFilter] = useState(false);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const allTiles = await dccService.getTiles();
      const ownerTiles = allTiles.filter((t) => t.owner_id === ownerId);
      setTiles(ownerTiles);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load objects');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const demandTypeOptions = useMemo(() => {
    const map = new Map<string, string>();
    tiles.forEach(t => { if (t.demand_type_code) map.set(t.demand_type_code, t.demand_type_label || t.demand_type_code); });
    return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
  }, [tiles]);

  const objectGroups = useMemo(() => groupByObject(tiles), [tiles]);

  const filteredGroups = useMemo(() => {
    let groups = objectGroups;

    if (activeKpi === 'PAID') groups = groups.filter(g => g.overallStatus === 'PAID');
    else if (activeKpi === 'OUTSTANDING') groups = groups.filter(g => g.overallStatus === 'DUE' || g.overallStatus === 'OVERDUE');
    else if (activeKpi === 'OVERDUE') groups = groups.filter(g => g.overallStatus === 'OVERDUE');

    if (filterState.statuses.length > 0) {
      groups = groups.filter(g => g.tiles.some(t => filterState.statuses.includes(t.status)));
    }
    if (filterState.demandTypeCodes.length > 0) {
      groups = groups.filter(g => g.tiles.some(t => filterState.demandTypeCodes.includes(t.demand_type_code)));
    }
    const q = filterState.searchText.trim().toLowerCase();
    if (q) {
      groups = groups.filter(g =>
        (g.objectDescription || '').toLowerCase().includes(q) ||
        (g.objectRef || '').toLowerCase().includes(q) ||
        (g.objectType || '').toLowerCase().includes(q)
      );
    }

    return groups;
  }, [objectGroups, activeKpi, filterState]);

  const totalDemand = tiles.reduce((s, t) => s + t.total_amount, 0);
  const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
  const totalOutstanding = tiles.reduce((s, t) => s + t.amount_due, 0);
  const overdueAmount = tiles.reduce((s, t) => s + t.overdue_amount, 0);
  const objectCount = new Set(tiles.map((t) => t.object_id)).size;
  const collectionRate = totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 100) : 0;

  const activeFilterCount = countActiveFilters(filterState);

  const handleClearFilters = () => {
    setFilterState(emptyFilterState);
    setActiveKpi('ALL');
  };

  // ── Card view ──────────────────────────────────────────────────────────────
  const CardView: React.FC<{ group: ObjectGroup; idx: number }> = ({ group, idx }) => {
    const Icon = getObjectIcon(group.objectType);
    const collectionPct = group.totalDemand > 0 ? Math.round((group.totalPaid / group.totalDemand) * 100) : 0;
    const runDateRange = group.runDateMin
      ? `${fmtDateShort(group.runDateMin)}${group.runDateMax && group.runDateMin !== group.runDateMax ? `–${fmtDateShort(group.runDateMax)}` : ''}`
      : '—';
    const dueDateRange = group.dueDateMin
      ? `${fmtDateShort(group.dueDateMin)}${group.dueDateMax && group.dueDateMin !== group.dueDateMax ? `–${fmtDateShort(group.dueDateMax)}` : ''}`
      : '—';

    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.15) }}
        whileHover={{ scale: 1.01 }}
        onClick={() => onViewObject(group.objectId, group.objectRef)}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all text-left overflow-hidden group"
      >
        <div className={`h-0.5 ${STRIP[group.overallStatus]} shrink-0`} />
        <div className="px-3 py-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon size={12} className="text-slate-400" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{group.objectType}</span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">
              {group.objectDescription || group.objectRef}
            </h3>
            <p className="text-[10px] text-slate-500 truncate">{group.objectRef}</p>
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
          <LV label="Run Date" value={runDateRange} />
          <LV label="Due Date" value={dueDateRange} valueCls={group.overallStatus === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-900'} />
          <LV label="Total" value={fmtINR(group.totalDemand)} />
          <LV label="Paid" value={group.totalPaid > 0 ? fmtINR(group.totalPaid) : '—'} valueCls="text-emerald-600" />
          <LV label="Pending" value={group.totalOutstanding > 0 ? fmtINR(group.totalOutstanding) : '—'} valueCls="text-red-600" />
          <LV label="Penalty" value={group.overdueAmount > 0 ? fmtINR(group.overdueAmount) : '—'} valueCls="text-red-600" />
        </div>
        <div className="px-3 pb-2.5 pt-1 grid grid-cols-3 md:grid-cols-6 gap-x-2 gap-y-1.5 border-t border-slate-100 bg-slate-50/50">
          <LV label="Demands" value={group.demandCount} valueCls="text-slate-700" />
          <LV label="Coll %" value={`${collectionPct}%`} valueCls="text-slate-700" />
          <LV label="Region" value={group.region || '—'} valueCls="text-slate-500" />
          <LV label="Group" value={group.groupName || '—'} valueCls="text-slate-500" />
          <div className="col-span-2 flex items-center gap-1 overflow-hidden">
            {group.demandTypes.slice(0, 2).map((dt) => (
              <span key={dt.label} className="inline-flex px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[8px] font-semibold shrink-0 whitespace-nowrap truncate max-w-[80px]">
                {dt.label}: {dt.count}
              </span>
            ))}
          </div>
        </div>
      </motion.button>
    );
  };

  // ── List view ───────────────────────────────────────────────────────────────
  const ListView: React.FC<{ group: ObjectGroup; idx: number }> = ({ group, idx }) => {
    const Icon = getObjectIcon(group.objectType);
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
          onClick={() => onViewObject(group.objectId, group.objectRef)}
          className="flex-1 flex items-center min-w-0 py-2 px-2.5 gap-2 text-left"
        >
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Icon size={13} className="text-blue-700" />
            </div>
            <div className="flex flex-col leading-tight min-w-0 w-[120px] shrink-0">
              <span className="text-[10px] font-bold text-slate-900 truncate">{group.objectDescription || group.objectRef}</span>
              <span className="text-[8px] text-slate-400 truncate">{group.objectRef} · {group.objectType}</span>
            </div>
            <div className="flex flex-col leading-tight shrink-0 w-[52px] pl-2 border-l border-slate-100">
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Demands</span>
              <span className="mt-0.5 text-[10px] font-bold text-slate-700 tabular-nums">{group.demandCount}</span>
            </div>
          </div>
          <div className="flex items-center min-w-0 overflow-hidden">
            <LV label="Run Date" value={runDateRange} valueCls="text-slate-600" width="w-[80px]" />
            <LV label="Due Date" value={dueDateRange} valueCls={group.overallStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'} width="w-[80px]" />
            <LV label="Demand" value={fmtINR(group.totalDemand)} valueCls="text-slate-800" width="w-[78px]" />
            <LV label="Paid" value={fmtINR(group.totalPaid)} valueCls="text-emerald-600" width="w-[72px]" />
            {group.overdueAmount > 0 && (
              <LV label="Overdue" value={fmtINR(group.overdueAmount)} valueCls="text-red-600" width="w-[72px]" />
            )}
            <LV label="Coll %" value={`${collectionPct}%`} valueCls="text-slate-700" width="w-[48px]" />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className={`flex flex-col items-end leading-tight px-2 py-1 rounded-lg border shrink-0 ${outstandingCls.bg} ${outstandingCls.border}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider leading-none ${outstandingCls.label}`}>Outstanding</span>
              <span className={`mt-0.5 text-[10px] font-bold tabular-nums leading-tight ${outstandingCls.value}`}>
                {fmtINR(group.totalOutstanding)}
              </span>
            </div>
            <span className="flex items-center gap-0.5 px-2 py-1.5 rounded-md text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap shrink-0">
              View Demand <ChevronRight size={10} />
            </span>
          </div>
        </button>
      </motion.div>
    );
  };

  // ── Table view ──────────────────────────────────────────────────────────────
  const TableView: React.FC = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-bold text-slate-600">Object / Description</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Type</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Run Date</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Due Date</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Total</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Paid</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Pending</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Penalty</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Demands</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Status</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map(group => {
              const st = DCC_STATUS[group.overallStatus === 'DUE' ? 'DUE' : group.overallStatus === 'OVERDUE' ? 'OVERDUE' : 'PAID'];
              const runDateRange = group.runDateMin
                ? `${fmtDateShort(group.runDateMin)}${group.runDateMax && group.runDateMin !== group.runDateMax ? `–${fmtDateShort(group.runDateMax)}` : ''}`
                : '—';
              const dueDateRange = group.dueDateMin
                ? `${fmtDateShort(group.dueDateMin)}${group.dueDateMax && group.dueDateMin !== group.dueDateMax ? `–${fmtDateShort(group.dueDateMax)}` : ''}`
                : '—';
              return (
                <tr
                  key={group.objectId}
                  onClick={() => onViewObject(group.objectId, group.objectRef)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-1.5 px-3">
                    <div className="text-[10px] font-semibold text-slate-900 truncate max-w-[200px]">{group.objectDescription || group.objectRef}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[200px]">{group.objectRef}</div>
                  </td>
                  <td className="py-1.5 px-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{group.objectType}</span>
                  </td>
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
                  <td className="py-1.5 px-3 text-center font-semibold text-slate-700 tabular-nums">{group.demandCount}</td>
                  <td className="py-1.5 px-3 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewObject(group.objectId, group.objectRef); }}
                      title="View Demands"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all"
                    >
                      <Eye size={13} />
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

  const ViewModeSelector: React.FC = () => {
    const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
      { mode: 'list', icon: <List size={16} />, label: 'List View' },
      { mode: 'card', icon: <LayoutGrid size={16} />, label: 'Card View' },
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
        {/* Breadcrumb Header */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-800 border-b border-blue-900 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-blue-700 transition-colors shrink-0"
            title="Back to Client Summary"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-300">
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
              <KpiCard icon={<Receipt size={12} className="text-white" />} label="Total Demand" value={fmtINR(totalDemand)} subValue={`${tiles.length} demands`} active={activeKpi === 'ALL'} onClick={() => setActiveKpi(prev => prev === 'ALL' ? 'ALL' : 'ALL')} iconBg="bg-blue-500" activeRing="ring-2 ring-blue-400" delay={0} />
              <KpiCard icon={<CheckCircle2 size={12} className="text-white" />} label="Total Paid" value={fmtINR(totalPaid)} subValue="Collected" active={activeKpi === 'PAID'} onClick={() => setActiveKpi(prev => prev === 'PAID' ? 'ALL' : 'PAID')} iconBg="bg-emerald-500" activeRing="ring-2 ring-emerald-400" delay={0.04} />
              <KpiCard icon={<Wallet size={12} className="text-white" />} label="Outstanding" value={fmtINR(totalOutstanding)} subValue="Pending" active={activeKpi === 'OUTSTANDING'} onClick={() => setActiveKpi(prev => prev === 'OUTSTANDING' ? 'ALL' : 'OUTSTANDING')} iconBg="bg-amber-500" activeRing="ring-2 ring-amber-400" delay={0.08} />
              <KpiCard icon={<AlertTriangle size={12} className="text-white" />} label="Overdue" value={fmtINR(overdueAmount)} subValue="Penalty" active={activeKpi === 'OVERDUE'} onClick={() => setActiveKpi(prev => prev === 'OVERDUE' ? 'ALL' : 'OVERDUE')} iconBg="bg-red-500" activeRing="ring-2 ring-red-400" delay={0.12} />
              <KpiCard icon={<TrendingUp size={12} className="text-white" />} label="Collection Rate" value={`${collectionRate}%`} subValue={`${objectCount} objects`} active={activeKpi === 'ALL'} onClick={() => setActiveKpi('ALL')} iconBg="bg-slate-700" activeRing="ring-2 ring-slate-500" delay={0.16} />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 shrink-0">
                  <button onClick={onClose} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate max-w-[120px]">{ownerName}</button>
                  <ChevronRight size={10} className="text-slate-400 shrink-0" />
                  <span className="text-slate-800">Object Summary</span>
                </div>
                <span className="text-slate-300 shrink-0">|</span>
                {(activeFilterCount > 0 || activeKpi !== 'ALL') && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <X size={12} /> Clear all
                  </button>
                )}
                <span
                  onClick={activeFilterCount > 0 ? () => setShowFilter(true) : undefined}
                  className={`text-[11px] shrink-0 ${
                    activeFilterCount > 0
                      ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                      : 'text-slate-400'
                  }`}
                >
                  {filteredGroups.length} of {objectGroups.length} objects
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ViewModeSelector />
                <button
                  onClick={() => setShowFilter(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <Filter size={13} /> Filter
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Object List */}
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
                {objectGroups.length === 0 ? 'No objects found for this client' : 'No objects match the selected filters'}
              </div>
              {(activeFilterCount > 0 || activeKpi !== 'ALL') && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw size={12} /> Clear filters
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-2">
              {filteredGroups.map((group, idx) => <ListView key={group.objectId} group={group} idx={idx} />)}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredGroups.map((group, idx) => <CardView key={group.objectId} group={group} idx={idx} />)}
            </div>
          ) : (
            <TableView />
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
                  <h2 className="text-sm font-bold text-white">Filter Objects</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterState(emptyFilterState)}
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
                        onChange={e => setFilterState(d => ({ ...d, searchText: e.target.value }))}
                        placeholder="Object reference, description, or type..."
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setFilterState(d => ({ ...d, statuses: toggleArray(d.statuses, s.value) }))}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            filterState.statuses.includes(s.value)
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Demand Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {demandTypeOptions.map(dt => (
                        <button
                          key={dt.code}
                          onClick={() => setFilterState(d => ({ ...d, demandTypeCodes: toggleArray(d.demandTypeCodes, dt.code) }))}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            filterState.demandTypeCodes.includes(dt.code)
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                          }`}
                        >
                          {dt.label}
                        </button>
                      ))}
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
    </>
  );
};

export default ObjectSummaryModal;
