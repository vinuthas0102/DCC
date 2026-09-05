import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, RotateCcw, Search, Check, ChevronDown,
} from 'lucide-react';
import type { DccDemandType, DccObjectOwner } from '../../types/dcc';

export interface RuleFilterState {
  objectTypes: string[];
  importSources: string[];
  ownerIds: string[];
  demandTypeIds: string[];
  activeOnly: boolean | null;
  includeGst: boolean | null;
}

export const emptyRuleFilterState: RuleFilterState = {
  objectTypes: [],
  importSources: [],
  ownerIds: [],
  demandTypeIds: [],
  activeOnly: null,
  includeGst: null,
};

export function countActiveRuleFilters(s: RuleFilterState): number {
  let n = 0;
  n += s.objectTypes.length;
  n += s.importSources.length;
  n += s.ownerIds.length;
  n += s.demandTypeIds.length;
  if (s.activeOnly !== null) n++;
  if (s.includeGst !== null) n++;
  return n;
}

const IMPORT_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'AUTO', label: 'Auto-Generation' },
  { value: 'TPA', label: 'Third-Party API' },
  { value: 'EXCEL', label: 'Excel Upload' },
  { value: 'MANUAL', label: 'Manual' },
];

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

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-1.5">
    <div className="w-1 h-3.5 rounded-full bg-emerald-500" />
    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{children}</h3>
  </div>
);

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
                placeholder="Search owners..."
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

interface RuleFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: { object_type?: string | null; import_source?: string | null; object_owner_id?: string | null; demand_type_id?: string | null; is_active: boolean; include_gst: boolean }[];
  demandTypes: DccDemandType[];
  owners: DccObjectOwner[];
  state: RuleFilterState;
  onApply: (s: RuleFilterState) => void;
}

export const RuleFilterModal: React.FC<RuleFilterModalProps> = ({
  isOpen, onClose, records, demandTypes, owners, state, onApply,
}) => {
  const [draft, setDraft] = useState<RuleFilterState>(state);

  useEffect(() => { setDraft(state); }, [state, isOpen]);

  const objectTypes = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.object_type) set.add(r.object_type); });
    return Array.from(set).sort();
  }, [records]);

  const toggleArray = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const handleReset = () => setDraft({ ...emptyRuleFilterState });

  const handleSearch = () => {
    onApply(draft);
    onClose();
  };

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
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-slate-50 shadow-2xl z-[61] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white">Filter Rules</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Narrow rules by object type, source, owner, and more
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

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Section 1: Object Type & Import Source */}
              <div>
                <SectionHeader>1. Object Type &amp; Import Source</SectionHeader>
                <div className="space-y-2.5">
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
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Import Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {IMPORT_SOURCE_OPTIONS.map(s => (
                        <Chip
                          key={s.value}
                          label={s.label}
                          active={draft.importSources.includes(s.value)}
                          onClick={() => setDraft(d => ({ ...d, importSources: toggleArray(d.importSources, s.value) }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Demand Type & Owner */}
              <div>
                <SectionHeader>2. Demand Type &amp; Owner</SectionHeader>
                <div className="space-y-2.5">
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Demand Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {demandTypes.length === 0 ? (
                        <span className="text-[11px] text-slate-400">No demand types available</span>
                      ) : demandTypes.map(dt => (
                        <Chip
                          key={dt.id}
                          label={dt.label}
                          active={draft.demandTypeIds.includes(dt.id)}
                          onClick={() => setDraft(d => ({ ...d, demandTypeIds: toggleArray(d.demandTypeIds, dt.id) }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Object Owner
                    </label>
                    <OwnerMultiSelect
                      owners={owners}
                      selected={draft.ownerIds}
                      onChange={ids => setDraft(d => ({ ...d, ownerIds: ids }))}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Status & GST */}
              <div>
                <SectionHeader>3. Status &amp; GST</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Active Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        label="Active"
                        active={draft.activeOnly === true}
                        onClick={() => setDraft(d => ({ ...d, activeOnly: d.activeOnly === true ? null : true }))}
                      />
                      <Chip
                        label="Inactive"
                        active={draft.activeOnly === false}
                        onClick={() => setDraft(d => ({ ...d, activeOnly: d.activeOnly === false ? null : false }))}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">GST</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        label="GST Applied"
                        active={draft.includeGst === true}
                        onClick={() => setDraft(d => ({ ...d, includeGst: d.includeGst === true ? null : true }))}
                      />
                      <Chip
                        label="No GST"
                        active={draft.includeGst === false}
                        onClick={() => setDraft(d => ({ ...d, includeGst: d.includeGst === false ? null : false }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-teal-900 border-t border-slate-700 shrink-0">
              <button
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition-all duration-200 hover:shadow-emerald-500/20"
              >
                <Search size={16} /> Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
