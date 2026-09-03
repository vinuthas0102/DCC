import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, RotateCcw, Search, Check, ChevronDown, Calendar,
} from 'lucide-react';
import type {
  DccTile, DccDemandFilters, DccDemandType, DccObjectOwner,
} from '../../types/dcc';
import {
  fmtINRShort,
} from '../../constants/dccTheme';

// ── Region row computed from tiles ──────────────────────────────────────────────
interface RegionRow {
  region: string;
  activeDemands: number;
  totalValue: number;
  avgDuePct: number;
  overdueCount: number;
}

// ── Date range presets ────────────────────────────────────────────────────────────
type DatePresetKey = 'this_month' | 'last_quarter' | 'ytd' | 'custom';

const DATE_PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_quarter', label: 'Last Quarter' },
  { key: 'ytd', label: 'YTD' },
  { key: 'custom', label: 'Custom' },
];

function presetRange(key: DatePresetKey): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from = '';
  if (key === 'this_month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  } else if (key === 'last_quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const qStart = new Date(now.getFullYear(), q * 3 - 3, 1);
    const qEnd = new Date(now.getFullYear(), q * 3, 0);
    from = qStart.toISOString().slice(0, 10);
    return { from, to: qEnd.toISOString().slice(0, 10) };
  } else if (key === 'ytd') {
    from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  }
  return { from, to };
}

// ── Status options ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: NonNullable<DccDemandFilters['status']>; label: string }[] = [
  { value: 'DUE', label: 'Due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
  { value: 'EXEMPTED', label: 'Exempted' },
];

// ── Chip pill ─────────────────────────────────────────────────────────────────────
const Chip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150 ${
      active
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
        : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'
    }`}
  >
    {label}
  </button>
);

// ── Owner multi-select dropdown ───────────────────────────────────────────────────
const OwnerMultiSelect: React.FC<{
  owners: DccObjectOwner[];
  selected: string[];
  onChange: (ids: string[]) => void;
}> = ({ owners, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = owners.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const label = selected.length === 0
    ? 'All Owners'
    : selected.length === 1
      ? owners.find(o => o.id === selected[0])?.name ?? '1 Owner'
      : `${selected.length} Owners`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 hover:border-slate-400 transition-colors"
      >
        <span className="truncate font-medium">{label}</span>
        <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-hidden flex flex-col"
          >
            <div className="p-1.5 border-b border-slate-100">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search owners…"
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="px-2.5 py-2 text-[11px] text-slate-400">No owners found</p>
              ) : filtered.map(o => {
                const isSel = selected.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors ${isSel ? 'text-emerald-700 font-semibold' : 'text-slate-700'}`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSel ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                      {isSel && <Check size={11} className="text-white" />}
                    </span>
                    <span className="truncate">{o.name}</span>
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 border-t border-slate-100 text-left"
              >
                Clear selection
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Date range with presets ────────────────────────────────────────────────────────
const DateRangePicker: React.FC<{
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}> = ({ from, to, onFromChange, onToChange }) => {
  const activePreset: DatePresetKey = useMemo(() => {
    if (!from && !to) return 'custom';
    const tm = presetRange('this_month');
    if (from === tm.from && to === tm.to) return 'this_month';
    const lq = presetRange('last_quarter');
    if (from === lq.from && to === lq.to) return 'last_quarter';
    const ytd = presetRange('ytd');
    if (from === ytd.from && to === ytd.to) return 'ytd';
    return 'custom';
  }, [from, to]);

  const applyPreset = (key: DatePresetKey) => {
    if (key === 'custom') return;
    const r = presetRange(key);
    onFromChange(r.from);
    onToChange(r.to);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {DATE_PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p.key)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
              activePreset === p.key
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="relative">
          <input
            type="date"
            value={from}
            onChange={e => onFromChange(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
          />
          <Calendar size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="relative">
          <input
            type="date"
            value={to}
            onChange={e => onToChange(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
          />
          <Calendar size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </div>
  );
};

// ── Section header ─────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-1.5">
    <div className="w-1 h-3.5 rounded-full bg-emerald-500" />
    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{children}</h3>
  </div>
);

// ── Main modal ─────────────────────────────────────────────────────────────────────
export interface DCCFilterState {
  regions: string[];
  objectTypes: string[];
  demandTypeCodes: string[];
  ownerIds: string[];
  statuses: NonNullable<DccDemandFilters['status']>[];
  runDateFrom: string;
  runDateTo: string;
  payDateFrom: string;
  payDateTo: string;
}

export const emptyFilterState: DCCFilterState = {
  regions: [],
  objectTypes: [],
  demandTypeCodes: [],
  ownerIds: [],
  statuses: [],
  runDateFrom: '',
  runDateTo: '',
  payDateFrom: '',
  payDateTo: '',
};

export function filterStateToFilters(s: DCCFilterState): DccDemandFilters {
  const f: DccDemandFilters = {};
  if (s.regions.length === 1) f.region = s.regions[0];
  if (s.demandTypeCodes.length === 1) f.demand_type_code = s.demandTypeCodes[0];
  if (s.ownerIds.length === 1) f.owner_id = s.ownerIds[0];
  if (s.statuses.length === 1) f.status = s.statuses[0];
  if (s.runDateFrom) f.run_date_from = s.runDateFrom;
  if (s.runDateTo) f.run_date_to = s.runDateTo;
  if (s.payDateFrom) f.payment_date_from = s.payDateFrom;
  if (s.payDateTo) f.payment_date_to = s.payDateTo;
  return f;
}

export function countActiveFilters(s: DCCFilterState): number {
  let n = 0;
  n += s.regions.length;
  n += s.objectTypes.length;
  n += s.demandTypeCodes.length;
  n += s.ownerIds.length;
  n += s.statuses.length;
  if (s.runDateFrom || s.runDateTo) n++;
  if (s.payDateFrom || s.payDateTo) n++;
  return n;
}

interface DCCFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: DccTile[];
  demandTypes: DccDemandType[];
  owners: DccObjectOwner[];
  state: DCCFilterState;
  onApply: (s: DCCFilterState) => void;
}

export const DCCFilterModal: React.FC<DCCFilterModalProps> = ({
  isOpen, onClose, tiles, demandTypes, owners, state, onApply,
}) => {
  const [draft, setDraft] = useState<DCCFilterState>(state);

  useEffect(() => { setDraft(state); }, [state, isOpen]);

  // Compute region rows from tiles
  const regionRows: RegionRow[] = useMemo(() => {
    const map: Record<string, RegionRow> = {};
    for (const t of tiles) {
      const r = t.region || 'Unspecified';
      if (!map[r]) map[r] = { region: r, activeDemands: 0, totalValue: 0, avgDuePct: 0, overdueCount: 0 };
      map[r].activeDemands++;
      map[r].totalValue += t.total_amount;
      if (t.status === 'OVERDUE') map[r].overdueCount++;
    }
    const rows = Object.values(map);
    for (const r of rows) {
      const regionTiles = tiles.filter(t => (t.region || 'Unspecified') === r.region);
      const totalDue = regionTiles.reduce((s, t) => s + t.amount_due, 0);
      const totalAmt = regionTiles.reduce((s, t) => s + t.total_amount, 0);
      r.avgDuePct = totalAmt > 0 ? Math.round((totalDue / totalAmt) * 100) : 0;
    }
    return rows.sort((a, b) => b.activeDemands - a.activeDemands);
  }, [tiles]);

  // Distinct object types
  const objectTypes = useMemo(() => {
    const set = new Set<string>();
    tiles.forEach(t => { if (t.object_type) set.add(t.object_type); });
    return Array.from(set).sort();
  }, [tiles]);

  const toggleArray = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const handleReset = () => setDraft({ ...emptyFilterState });

  const handleSearch = () => {
    onApply(draft);
    onClose();
  };

  const allDemandSelected = draft.demandTypeCodes.length === demandTypes.length && demandTypes.length > 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[640px] bg-slate-50 shadow-2xl z-[61] flex flex-col"
          >
            {/* Header — Deep Slate Navy */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white">Filter Conditions</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Enter filter conditions &amp; click Search Now to view filtered data
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <RotateCcw size={12} /> Reset
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

              {/* Section 1: Region & Group Filter */}
              <div>
                <SectionHeader>1. Region &amp; Group Filter</SectionHeader>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="px-2 py-1.5 text-left w-8">
                            <input
                              type="checkbox"
                              checked={draft.regions.length === regionRows.length && regionRows.length > 0}
                              onChange={e => setDraft(d => ({ ...d, regions: e.target.checked ? regionRows.map(r => r.region) : [] }))}
                              className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                            />
                          </th>
                          <th className="px-2 py-1.5 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wide">Region / State</th>
                          <th className="px-2 py-1.5 text-right text-[10px] font-bold uppercase text-slate-500 tracking-wide">Demands</th>
                          <th className="px-2 py-1.5 text-right text-[10px] font-bold uppercase text-slate-500 tracking-wide">Total Value</th>
                          <th className="px-2 py-1.5 text-right text-[10px] font-bold uppercase text-slate-500 tracking-wide">Avg Due %</th>
                          <th className="px-2 py-1.5 text-right text-[10px] font-bold uppercase text-slate-500 tracking-wide">Overdue</th>
                          <th className="px-2 py-1.5 text-center text-[10px] font-bold uppercase text-slate-500 tracking-wide">Select</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-2 py-4 text-center text-[11px] text-slate-400">No regions available</td>
                          </tr>
                        ) : regionRows.map(r => {
                          const isSel = draft.regions.includes(r.region);
                          return (
                            <tr
                              key={r.region}
                              className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${isSel ? 'bg-emerald-50/40' : ''}`}
                            >
                              <td className="px-2 py-1.5">
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={() => setDraft(d => ({ ...d, regions: toggleArray(d.regions, r.region) }))}
                                  className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                                />
                              </td>
                              <td className="px-2 py-1.5 font-semibold text-slate-700 truncate">{r.region}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{r.activeDemands}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-slate-700">{fmtINRShort(r.totalValue)}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{r.avgDuePct}%</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">
                                <span className={r.overdueCount > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}>{r.overdueCount}</span>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  onClick={() => setDraft(d => ({ ...d, regions: toggleArray(d.regions, r.region) }))}
                                  className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                >
                                  {isSel ? 'Selected' : 'Select'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 2: Object Type & Demand Type Filter */}
              <div>
                <SectionHeader>2. Object Type &amp; Demand Type Filter</SectionHeader>
                <div className="space-y-2.5">
                  {/* Group 1: Object Types */}
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Object Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {objectTypes.length === 0 ? (
                        <span className="text-[11px] text-slate-400">No object types available</span>
                      ) : objectTypes.map(ot => (
                        <Chip
                          key={ot}
                          label={ot}
                          active={draft.objectTypes.includes(ot)}
                          onClick={() => setDraft(d => ({ ...d, objectTypes: toggleArray(d.objectTypes, ot) }))}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Group 2: Demand Types */}
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Demand Types</p>
                      {demandTypes.length > 0 && (
                        <button
                          onClick={() => setDraft(d => ({
                            ...d,
                            demandTypeCodes: allDemandSelected ? [] : demandTypes.map(dt => dt.code),
                          }))}
                          className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          {allDemandSelected ? 'Clear All' : 'Select All'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {demandTypes.length === 0 ? (
                        <span className="text-[11px] text-slate-400">No demand types available</span>
                      ) : demandTypes.map(dt => (
                        <Chip
                          key={dt.code}
                          label={dt.label}
                          active={draft.demandTypeCodes.includes(dt.code)}
                          onClick={() => setDraft(d => ({ ...d, demandTypeCodes: toggleArray(d.demandTypeCodes, dt.code) }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Owner & Transaction Date Filters */}
              <div>
                <SectionHeader>3. Owner &amp; Transaction Date Filters</SectionHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Left: Owner multi-select */}
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Target Object Owner
                      </label>
                      <OwnerMultiSelect
                        owners={owners}
                        selected={draft.ownerIds}
                        onChange={ids => setDraft(d => ({ ...d, ownerIds: ids }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Status
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_OPTIONS.map(s => (
                          <Chip
                            key={s.value}
                            label={s.label}
                            active={draft.statuses.includes(s.value)}
                            onClick={() => setDraft(d => ({ ...d, statuses: toggleArray(d.statuses, s.value) }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date ranges */}
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Demand Run Date Range
                      </label>
                      <DateRangePicker
                        from={draft.runDateFrom}
                        to={draft.runDateTo}
                        onFromChange={v => setDraft(d => ({ ...d, runDateFrom: v }))}
                        onToChange={v => setDraft(d => ({ ...d, runDateTo: v }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Payment Date Range
                      </label>
                      <DateRangePicker
                        from={draft.payDateFrom}
                        to={draft.payDateTo}
                        onFromChange={v => setDraft(d => ({ ...d, payDateFrom: v }))}
                        onToChange={v => setDraft(d => ({ ...d, payDateTo: v }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer — Deep Teal / Navy */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-teal-900 border-t border-slate-700 shrink-0">
              <button
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition-all duration-200 hover:shadow-emerald-500/20"
              >
                <Search size={16} /> Search Now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
