import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Search, Calendar } from 'lucide-react';
import type { DccDemandType } from '../../types/dcc';

export interface RunHistoryFilterState {
  source: string;
  demandTypeId: string;
  dateFrom: string;
  dateTo: string;
  objectRef: string;
}

export const emptyRunHistoryFilter: RunHistoryFilterState = {
  source: '',
  demandTypeId: '',
  dateFrom: '',
  dateTo: '',
  objectRef: '',
};

export function countActiveRunHistoryFilters(s: RunHistoryFilterState): number {
  let n = 0;
  if (s.source) n++;
  if (s.demandTypeId) n++;
  if (s.dateFrom || s.dateTo) n++;
  if (s.objectRef) n++;
  return n;
}

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'AUTO', label: 'Auto' },
  { value: 'TPA', label: 'TPA' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'MANUAL', label: 'Manual' },
];

const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
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

interface RunHistoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandTypes: DccDemandType[];
  state: RunHistoryFilterState;
  onApply: (s: RunHistoryFilterState) => void;
}

export const RunHistoryFilterModal: React.FC<RunHistoryFilterModalProps> = ({
  isOpen, onClose, demandTypes, state, onApply,
}) => {
  const [draft, setDraft] = useState<RunHistoryFilterState>(state);

  useEffect(() => { setDraft(state); }, [state, isOpen]);

  const handleReset = () => setDraft({ ...emptyRunHistoryFilter });

  const handleApply = () => {
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
                <h2 className="text-sm font-bold text-white">Filter Run History</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Narrow runs by source, demand type, and date range
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
              {/* Section 1: Source */}
              <div>
                <SectionHeader>1. Source</SectionHeader>
                <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Import Source</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SOURCE_OPTIONS.map(s => (
                      <Chip
                        key={s.value}
                        label={s.label}
                        active={draft.source === s.value}
                        onClick={() => setDraft(d => ({ ...d, source: d.source === s.value ? '' : s.value }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Demand Type */}
              <div>
                <SectionHeader>2. Demand Type</SectionHeader>
                <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Demand Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {demandTypes.length === 0 ? (
                      <span className="text-[11px] text-slate-400">No demand types available</span>
                    ) : demandTypes.map(dt => (
                      <Chip
                        key={dt.id}
                        label={dt.label}
                        active={draft.demandTypeId === dt.id}
                        onClick={() => setDraft(d => ({ ...d, demandTypeId: d.demandTypeId === dt.id ? '' : dt.id }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Date Range */}
              <div>
                <SectionHeader>3. Run Date Range</SectionHeader>
                <div className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">From</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={draft.dateFrom}
                          onChange={e => setDraft(d => ({ ...d, dateFrom: e.target.value }))}
                          className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                        <Calendar size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">To</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={draft.dateTo}
                          onChange={e => setDraft(d => ({ ...d, dateTo: e.target.value }))}
                          className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                        <Calendar size={11} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Object Reference Search */}
              <div>
                <SectionHeader>4. Object Reference</SectionHeader>
                <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Search</p>
                  <input
                    type="text"
                    value={draft.objectRef}
                    onChange={e => setDraft(d => ({ ...d, objectRef: e.target.value }))}
                    placeholder="Search by object reference..."
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-teal-900 border-t border-slate-700 shrink-0">
              <button
                onClick={handleApply}
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
