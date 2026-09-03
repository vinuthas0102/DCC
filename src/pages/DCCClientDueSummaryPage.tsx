import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Phone, MapPin, Building2, Receipt,
  Calendar, Clock, Wallet, CheckCircle2, AlertTriangle,
  Loader2, ChevronRight, LayoutGrid, List, Table2,
  Filter, RotateCcw, Search, TrendingUp, Eye,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { DCCDemandDetailModal } from './DCCDemandDetailPage';
import { DemandListRecord } from '../components/dcc/DemandListRecord';
import type { DccTile, DccDemandStatus } from '../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDateShort,
} from '../constants/dccTheme';

type ViewMode = 'card' | 'list' | 'table';
type KpiKey = 'ALL' | 'PAID' | 'OUTSTANDING' | 'OVERDUE';

interface LocalFilterState {
  statuses: DccDemandStatus[];
  demandTypeCodes: string[];
  objectTypes: string[];
  runDateFrom: string;
  runDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
  searchText: string;
}

const emptyFilterState: LocalFilterState = {
  statuses: [],
  demandTypeCodes: [],
  objectTypes: [],
  runDateFrom: '',
  runDateTo: '',
  dueDateFrom: '',
  dueDateTo: '',
  searchText: '',
};

const STATUS_OPTIONS: { value: DccDemandStatus; label: string }[] = [
  { value: 'DUE', label: 'Due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
  { value: 'EXEMPTED', label: 'Exempted' },
];

const toggleArray = <T,>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

const countActiveFilters = (s: LocalFilterState): number => {
  let n = 0;
  n += s.statuses.length;
  n += s.demandTypeCodes.length;
  n += s.objectTypes.length;
  if (s.runDateFrom || s.runDateTo) n++;
  if (s.dueDateFrom || s.dueDateTo) n++;
  if (s.searchText.trim()) n++;
  return n;
};

// ── Label-value pair helper ──────────────────────────────────────────────────
const LV: React.FC<{ label: string; value: React.ReactNode; valueCls?: string }> = ({
  label, value, valueCls = 'text-slate-900',
}) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <span className={`text-xs font-semibold tabular-nums truncate ${valueCls}`}>{value}</span>
  </div>
);

// ── KPI Card with gradient accent and animation ──────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  active: boolean;
  onClick: () => void;
  gradient: string;
  iconBg: string;
  activeRing: string;
  delay: number;
}> = ({ icon, label, value, subValue, active, onClick, gradient, iconBg, activeRing, delay }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative bg-white rounded-xl border shadow-sm overflow-hidden text-left transition-all duration-200 hover:shadow-lg ${
      active ? `${activeRing} border-2` : 'border-slate-200 hover:border-slate-300'
    }`}
  >
    <div className={`h-1 ${gradient} shrink-0`} />
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      </div>
      <div className="text-base font-extrabold text-slate-900 tabular-nums leading-tight">{value}</div>
      {subValue && (
        <div className="text-[10px] text-slate-400 mt-0.5">{subValue}</div>
      )}
    </div>
  </motion.button>
);

interface DCCClientDueSummaryModalProps {
  ownerId: string;
  onClose: () => void;
}

export const DCCClientDueSummaryModal: React.FC<DCCClientDueSummaryModalProps> = ({ ownerId, onClose }) => {
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailDemandId, setDetailDemandId] = useState<string | null>(null);
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
      setError(e instanceof Error ? e.message : 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const first = tiles[0];
  const ownerName = first?.owner_name ?? 'Unknown Client';
  const ownerContact = first?.owner_contact ?? '';
  const ownerAddress = first?.owner_address ?? '';

  const demandTypeOptions = useMemo(() => {
    const map = new Map<string, string>();
    tiles.forEach(t => { if (t.demand_type_code) map.set(t.demand_type_code, t.demand_type_label || t.demand_type_code); });
    return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
  }, [tiles]);

  const objectTypeOptions = useMemo(() => {
    const set = new Set<string>();
    tiles.forEach(t => { if (t.object_type) set.add(t.object_type); });
    return Array.from(set).sort();
  }, [tiles]);

  const filteredTiles = useMemo(() => {
    let result = tiles;

    if (activeKpi === 'PAID') result = result.filter(t => t.status === 'PAID');
    else if (activeKpi === 'OUTSTANDING') result = result.filter(t => t.status === 'DUE' || t.status === 'OVERDUE');
    else if (activeKpi === 'OVERDUE') result = result.filter(t => t.status === 'OVERDUE');

    if (filterState.statuses.length > 0) {
      result = result.filter(t => filterState.statuses.includes(t.status));
    }
    if (filterState.demandTypeCodes.length > 0) {
      result = result.filter(t => filterState.demandTypeCodes.includes(t.demand_type_code));
    }
    if (filterState.objectTypes.length > 0) {
      result = result.filter(t => filterState.objectTypes.includes(t.object_type));
    }
    if (filterState.runDateFrom) {
      result = result.filter(t => t.demand_run_date >= filterState.runDateFrom);
    }
    if (filterState.runDateTo) {
      result = result.filter(t => t.demand_run_date <= filterState.runDateTo);
    }
    if (filterState.dueDateFrom) {
      result = result.filter(t => t.due_date >= filterState.dueDateFrom);
    }
    if (filterState.dueDateTo) {
      result = result.filter(t => t.due_date <= filterState.dueDateTo);
    }
    const q = filterState.searchText.trim().toLowerCase();
    if (q) {
      result = result.filter(t =>
        (t.object_description || '').toLowerCase().includes(q) ||
        (t.object_ref || '').toLowerCase().includes(q) ||
        (t.demand_type_label || '').toLowerCase().includes(q) ||
        (t.demand_type_code || '').toLowerCase().includes(q)
      );
    }

    const statusRank: Record<string, number> = { OVERDUE: 0, DUE: 1, DISPUTED: 2, EXEMPTED: 3, PAID: 4 };
    result = [...result].sort((a, b) => {
      const ra = statusRank[a.status] ?? 5;
      const rb = statusRank[b.status] ?? 5;
      if (ra !== rb) return ra - rb;
      return (b.overdue_amount || 0) - (a.overdue_amount || 0);
    });

    return result;
  }, [tiles, activeKpi, filterState]);

  const totalDemand = tiles.reduce((s, t) => s + t.total_amount, 0);
  const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
  const totalOutstanding = tiles.reduce((s, t) => s + t.amount_due, 0);
  const overdueAmount = tiles.reduce((s, t) => s + t.overdue_amount, 0);
  const propertyCount = new Set(tiles.map((t) => t.object_id)).size;
  const collectionRate = totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 100) : 0;

  const activeFilterCount = countActiveFilters(filterState);

  const handleKpiClick = (key: KpiKey) => {
    setActiveKpi(prev => prev === key ? 'ALL' : key);
  };

  const handleClearFilters = () => {
    setFilterState(emptyFilterState);
    setActiveKpi('ALL');
  };

  // ── Card view (enriched 3-row layout) ──────────────────────────────────────
  const CardView: React.FC<{ tile: DccTile; idx: number }> = ({ tile, idx }) => {
    const st = DCC_STATUS[tile.status];
    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.15) }}
        whileHover={{ scale: 1.01 }}
        onClick={() => setDetailDemandId(tile.id)}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all text-left overflow-hidden group"
      >
        <div className={`h-0.5 ${st.dot} shrink-0`} />
        {/* Row 1: Identity + Status right + Amount */}
        <div className="px-3 py-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{tile.demand_type_label}</span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">
              {tile.object_description || tile.object_ref}
            </h3>
            <p className="text-[10px] text-slate-500 truncate">{tile.object_ref} · {tile.object_type}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
              {st.label}
            </span>
            <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(tile.amount_due)}</div>
            <div className="text-[9px] text-slate-400">of {fmtINRShort(tile.total_amount)}</div>
          </div>
        </div>
        {/* Row 2: 6-column label-value grid */}
        <div className="px-3 pb-2 pt-1 grid grid-cols-3 md:grid-cols-6 gap-x-2 gap-y-1.5 border-t border-slate-100">
          <LV label="Run Date" value={fmtDateShort(tile.demand_run_date)} />
          <LV label="Due Date" value={fmtDateShort(tile.due_date)} valueCls={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-900'} />
          <LV label="Total" value={fmtINRShort(tile.total_amount)} />
          <LV label="Paid" value={tile.amount_paid > 0 ? fmtINRShort(tile.amount_paid) : '—'} valueCls="text-emerald-600" />
          <LV label="Pending" value={tile.amount_due > 0 ? fmtINRShort(tile.amount_due) : '—'} valueCls="text-red-600" />
          <LV label="Penalty" value={tile.overdue_amount > 0 ? fmtINRShort(tile.overdue_amount) : '—'} valueCls="text-red-600" />
        </div>
        {/* Row 3: Transaction details when available */}
        <div className="px-3 pb-2.5 pt-1 grid grid-cols-3 md:grid-cols-6 gap-x-2 gap-y-1.5 border-t border-slate-100 bg-slate-50/50">
          <LV label="Txn Type" value={tile.demand_type_code} valueCls="text-slate-500" />
          <LV label="Last Paid" value={tile.last_paid_date ? fmtDateShort(tile.last_paid_date) : '—'} />
          <LV label="Last Amt" value={tile.last_paid_amount && tile.last_paid_amount > 0 ? fmtINRShort(tile.last_paid_amount) : '—'} valueCls="text-emerald-600" />
          <LV label="Avg OD Days" value={tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'} valueCls={tile.avg_overdue_days > 0 ? 'text-red-600' : 'text-slate-500'} />
          <LV label="Region" value={tile.region || '—'} valueCls="text-slate-500" />
          <LV label="Group" value={tile.group_name || '—'} valueCls="text-slate-500" />
        </div>
      </motion.button>
    );
  };

  // ── List view (shared label-value record) ───────────────────────────────────
  const ListView: React.FC<{ tile: DccTile; idx: number }> = ({ tile, idx }) => (
    <DemandListRecord
      tile={tile}
      idx={idx}
      onViewDetails={(t) => setDetailDemandId(t.id)}
    />
  );

  // ── Table view (status column last/right) ────────────────────────────────────
  const TableView: React.FC = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-bold text-slate-600">Property / Description</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Txn Type</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Run Date</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Due Date</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Total</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Paid</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Pending</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Penalty</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Status</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTiles.map(tile => {
              const st = DCC_STATUS[tile.status];
              return (
                <tr
                  key={tile.id}
                  onClick={() => setDetailDemandId(tile.id)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-1.5 px-3">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{tile.object_description || tile.object_ref}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[200px]">{tile.object_ref} · {tile.object_type}</div>
                  </td>
                  <td className="py-1.5 px-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{tile.demand_type_code}</span>
                  </td>
                  <td className="py-1.5 px-3 text-slate-600">{fmtDateShort(tile.demand_run_date)}</td>
                  <td className="py-1.5 px-3">
                    <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                      {fmtDateShort(tile.due_date)}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right font-semibold text-slate-700 tabular-nums">{fmtINR(tile.total_amount)}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-emerald-600 tabular-nums">{fmtINR(tile.amount_paid)}</td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">{fmtINR(tile.amount_due)}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-red-600 tabular-nums">{tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}</td>
                  <td className="py-1.5 px-3 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailDemandId(tile.id); }}
                      title="View Details"
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

  // ── Filter Drawer (always right, with search) ──────────────────────────────
  const FilterDrawer: React.FC = () => (
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
              <h2 className="text-sm font-bold text-white">Filter Demands</h2>
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
              {/* Search */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Search</p>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filterState.searchText}
                    onChange={e => setFilterState(d => ({ ...d, searchText: e.target.value }))}
                    placeholder="Property, reference, or demand type..."
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              {/* Status */}
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
              {/* Demand Type */}
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
              {/* Object Type */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Object Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {objectTypeOptions.map(ot => (
                    <button
                      key={ot}
                      onClick={() => setFilterState(d => ({ ...d, objectTypes: toggleArray(d.objectTypes, ot) }))}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                        filterState.objectTypes.includes(ot)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {ot}
                    </button>
                  ))}
                </div>
              </div>
              {/* Run Date Range */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Run Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filterState.runDateFrom}
                    onChange={e => setFilterState(d => ({ ...d, runDateFrom: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={filterState.runDateTo}
                    onChange={e => setFilterState(d => ({ ...d, runDateTo: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              {/* Due Date Range */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Due Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filterState.dueDateFrom}
                    onChange={e => setFilterState(d => ({ ...d, dueDateFrom: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={filterState.dueDateTo}
                    onChange={e => setFilterState(d => ({ ...d, dueDateTo: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
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
  );

  // ── View mode selector (icon-only with tooltips) ────────────────────────────
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
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]"
        onClick={onClose}
      />
      {/* Overlay panel — slides up from bottom, leaves dashboard header visible */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 top-14 z-[51] flex flex-col bg-slate-50 rounded-t-2xl shadow-2xl overflow-hidden"
      >
        {/* Header — screen name + client info */}
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
                <Building2 size={10} /> {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'}
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
          <div className="px-4 pt-3 pb-2 shrink-0 space-y-2.5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <KpiCard
                icon={<Receipt size={14} className="text-white" />}
                label="Total Demand"
                value={fmtINR(totalDemand)}
                subValue={`${tiles.length} demands`}
                active={activeKpi === 'ALL'}
                onClick={() => handleKpiClick('ALL')}
                gradient="bg-gradient-to-r from-blue-500 to-blue-600"
                iconBg="bg-blue-500"
                activeRing="ring-2 ring-blue-400"
                delay={0}
              />
              <KpiCard
                icon={<CheckCircle2 size={14} className="text-white" />}
                label="Total Paid"
                value={fmtINR(totalPaid)}
                subValue={`${collectionRate}% collection rate`}
                active={activeKpi === 'PAID'}
                onClick={() => handleKpiClick('PAID')}
                gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
                iconBg="bg-emerald-500"
                activeRing="ring-2 ring-emerald-400"
                delay={0.05}
              />
              <KpiCard
                icon={<Wallet size={14} className="text-white" />}
                label="Outstanding"
                value={fmtINR(totalOutstanding)}
                subValue="Pending payments"
                active={activeKpi === 'OUTSTANDING'}
                onClick={() => handleKpiClick('OUTSTANDING')}
                gradient="bg-gradient-to-r from-amber-500 to-orange-500"
                iconBg="bg-amber-500"
                activeRing="ring-2 ring-amber-400"
                delay={0.1}
              />
              <KpiCard
                icon={<AlertTriangle size={14} className="text-white" />}
                label="Overdue"
                value={fmtINR(overdueAmount)}
                subValue="Penalty accrued"
                active={activeKpi === 'OVERDUE'}
                onClick={() => handleKpiClick('OVERDUE')}
                gradient="bg-gradient-to-r from-red-500 to-red-600"
                iconBg="bg-red-500"
                activeRing="ring-2 ring-red-400"
                delay={0.15}
              />
            </div>

            {/* Controls row — filter right, view icons right */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(activeFilterCount > 0 || activeKpi !== 'ALL') && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X size={12} /> Clear all
                  </button>
                )}
                <span className="text-[11px] text-slate-400">
                  {filteredTiles.length} of {tiles.length} demands
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

        {/* Demand List */}
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
          ) : filteredTiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <div className="text-sm font-medium text-slate-600">
                {tiles.length === 0 ? 'No demands found for this client' : 'No demands match the selected filters'}
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
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredTiles.map((tile, idx) => <CardView key={tile.id} tile={tile} idx={idx} />)}
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-2">
              {filteredTiles.map((tile, idx) => <ListView key={tile.id} tile={tile} idx={idx} />)}
            </div>
          ) : (
            <TableView />
          )}
        </div>

        {/* Filter Drawer */}
        <FilterDrawer />
      </motion.div>

      {/* Demand Detail Modal */}
      {detailDemandId && (
        <DCCDemandDetailModal
          demandId={detailDemandId}
          onClose={() => setDetailDemandId(null)}
        />
      )}
    </>
  );
};

export default DCCClientDueSummaryModal;
