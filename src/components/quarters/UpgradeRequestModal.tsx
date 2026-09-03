import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Send, Search, Filter, Building2, X, ArrowRightCircle,
  CalendarDays, Paperclip, Bed, Ruler, Layers, IndianRupee, CheckCircle2, MapPin,
  FileText, UploadCloud,
} from 'lucide-react';
import { Quarter } from '../../services/quartersService';
import { UserDTO } from '../../types';
import { QUARTER_TYPE_OPTIONS } from '../../utils/quarterDisplay';
import { fmtINR, getImage } from './quarterShared';

type UpgradeMode = 'AUTO' | 'SELECTED';

interface UpgradeSubmitInput {
  reason: string;
  remarks: string;
  required_bhk_config: string;
  move_in_date: string;
  document_url?: string;
  upgrade_mode: UpgradeMode;
  target_quarter_id: string | null;
}

interface Props {
  user: UserDTO | null;
  currentQuarter: Quarter | null;
  availableQuarters: Quarter[];
  quartersLoading: boolean;
  onClose: () => void;
  onSubmit: (input: UpgradeSubmitInput) => Promise<void>;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export const UpgradeRequestModal: React.FC<Props> = ({
  user, currentQuarter, availableQuarters, quartersLoading,
  onClose, onSubmit, addToast,
}) => {
  const [upgradeMode, setUpgradeMode] = useState<UpgradeMode>('AUTO');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [requiredBhk, setRequiredBhk] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterBhk, setFilterBhk] = useState('');
  const [filterFurnishing, setFilterFurnishing] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = availableQuarters
    .filter(q => {
      if (search) {
        const s = search.toLowerCase();
        if (!q.quarter_number?.toLowerCase().includes(s) && !q.block_name?.toLowerCase().includes(s) &&
          !q.address?.toLowerCase().includes(s) && !q.quarter_type?.toLowerCase().includes(s)) return false;
      }
      if (filterBhk && q.quarter_type !== filterBhk) return false;
      if (filterFurnishing && q.furnishing_status !== filterFurnishing) return false;
      return true;
    })
    .sort((a, b) => {
      if (filterSortBy === 'rent_asc') return a.monthly_rent - b.monthly_rent;
      if (filterSortBy === 'rent_desc') return b.monthly_rent - a.monthly_rent;
      return 0;
    });

  const canSubmit = reason.trim().length > 0 && (upgradeMode === 'AUTO' || selectedQuarter !== null);

  const handleSubmit = async () => {
    if (!reason.trim()) { addToast('Please provide a reason for the upgrade', 'warning'); return; }
    if (upgradeMode === 'SELECTED' && !selectedQuarter) { addToast('Please select a target quarter', 'warning'); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        reason, remarks, required_bhk_config: requiredBhk, move_in_date: moveInDate,
        document_url: docFile?.name,
        upgrade_mode: upgradeMode,
        target_quarter_id: upgradeMode === 'SELECTED' ? (selectedQuarter?.id ?? null) : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveFilters = !!(filterBhk || filterFurnishing || filterSortBy);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white" style={{ fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={15} /><span>Back</span>
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center shrink-0">
            <ArrowRightCircle size={12} className="text-white" />
          </div>
          <h1 className="text-sm font-bold text-gray-900">Upgrade Quarter Request</h1>
        </div>

        {user && (
          <div className="hidden sm:flex items-center gap-0 divide-x divide-sky-200 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl shrink-0">
            <div className="flex items-center gap-2 pr-3">
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {user.fullName?.charAt(0) ?? 'U'}
              </div>
              <div>
                <div className="text-[12px] font-semibold text-sky-900 whitespace-nowrap leading-tight">{user.fullName}</div>
                <div className="text-[10px] text-sky-500 whitespace-nowrap leading-tight">{user.govtDepartment || '—'}</div>
              </div>
            </div>
            {user.govtEmployeeId && (
              <div className="px-3">
                <div className="text-[9px] text-sky-400 uppercase tracking-wider font-semibold">EMP ID</div>
                <div className="text-[11px] font-semibold text-sky-900">{user.govtEmployeeId}</div>
              </div>
            )}
            {user.projectLocation && (
              <div className="px-3">
                <div className="text-[9px] text-sky-400 uppercase tracking-wider font-semibold">Location</div>
                <div className="text-[11px] font-semibold text-sky-900">{user.projectLocation}</div>
              </div>
            )}
            {user.sapId && (
              <div className="pl-3">
                <div className="text-[9px] text-sky-400 uppercase tracking-wider font-semibold">SAP ID</div>
                <div className="text-[11px] font-semibold text-sky-900">{user.sapId}</div>
              </div>
            )}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting || !canSubmit}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0">
          <Send size={13} />{submitting ? 'Submitting…' : 'Submit Upgrade Request'}
        </button>
      </div>

      {/* ── Form band — compact single strip ── */}
      <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-5 py-3">

        {/* Row 1: mode toggle + fields in one horizontal line */}
        <div className="flex items-end gap-3 flex-wrap">

          {/* Mode toggle */}
          <div className="shrink-0">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Upgrade Mode <span className="text-red-500">*</span></div>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <button onClick={() => { setUpgradeMode('AUTO'); setSelectedQuarter(null); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${upgradeMode === 'AUTO' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Building2 size={12} />Auto-assign
              </button>
              <button onClick={() => setUpgradeMode('SELECTED')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 border-l border-gray-200 ${upgradeMode === 'SELECTED' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Search size={12} />I'll pick a quarter
              </button>
            </div>
          </div>

          {/* Reason */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Upgrade Reason <span className="text-red-500">*</span></label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Family size increase"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white" />
          </div>

          {/* Quarter type */}
          <div className="w-36">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Quarter Type</label>
            <select value={requiredBhk} onChange={e => setRequiredBhk(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white">
              <option value="">Any</option>
              {QUARTER_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Move-in date */}
          <div className="w-36">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Move-in Date</label>
            <div className="relative">
              <CalendarDays size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white" />
            </div>
          </div>

          {/* Remarks */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Remarks</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white" />
          </div>

          {/* Compact doc attach */}
          <div className="shrink-0">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Document</label>
            {docFile ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 max-w-[180px]">
                <FileText size={11} className="text-blue-500 shrink-0" />
                <span className="truncate flex-1 min-w-0">{docFile.name}</span>
                <button onClick={() => setDocFile(null)} className="text-blue-400 hover:text-red-500 transition-colors shrink-0"><X size={11} /></button>
              </div>
            ) : (
              <button onClick={() => docInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-colors bg-white">
                <Paperclip size={11} />Attach file
              </button>
            )}
            <input ref={docInputRef} type="file" accept="application/pdf,image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; setDocFile(f); e.target.value = ''; }} />
          </div>
        </div>

        {/* Mode hint */}
        {upgradeMode === 'SELECTED'
          ? <p className="text-[11px] text-sky-600 mt-2">Browse available quarters below and select your preferred upgrade target.</p>
          : <p className="text-[11px] text-gray-400 mt-2">The Estate Manager will assign a suitable available quarter on your behalf.</p>
        }
      </div>

      {/* ── Body ── */}
      {upgradeMode === 'SELECTED' ? (
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">

          {/* Col A: available quarters */}
          <div className="flex flex-col border-r border-gray-200 min-h-0">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 flex-1">
                  <Search size={12} className="text-gray-500" />Available Quarters
                  <span className="font-normal text-gray-400">({filtered.length})</span>
                </h2>
                <div className="relative" ref={filterRef}>
                  <button onClick={() => setFilterOpen(v => !v)}
                    className={`relative flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                      hasActiveFilters ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <Filter size={11} />Filters
                    {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 absolute -top-0.5 -right-0.5" />}
                  </button>
                  {filterOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-3 space-y-3">
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quarter Type</div>
                        <div className="flex flex-wrap gap-1">
                          {(['', ...QUARTER_TYPE_OPTIONS] as string[]).map(v => (
                            <button key={v} onClick={() => setFilterBhk(v)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${filterBhk === v ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                              {v || 'Any'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Furnishing</div>
                        <div className="flex flex-wrap gap-1">
                          {['', 'Furnished', 'Semi-Furnished', 'Unfurnished'].map(v => (
                            <button key={v} onClick={() => setFilterFurnishing(v)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${filterFurnishing === v ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                              {v || 'Any'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sort by</div>
                        <div className="flex flex-wrap gap-1">
                          {[{ value: '', label: 'Default' }, { value: 'rent_asc', label: 'Rent ↑' }, { value: 'rent_desc', label: 'Rent ↓' }].map(({ value, label }) => (
                            <button key={value} onClick={() => setFilterSortBy(value)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${filterSortBy === value ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button onClick={() => { setFilterBhk(''); setFilterFurnishing(''); setFilterSortBy(''); }}
                          className="text-[10px] text-gray-500 hover:text-gray-800 transition-colors">Clear all</button>
                        <button onClick={() => setFilterOpen(false)}
                          className="px-2.5 py-1 bg-sky-600 text-white text-[10px] font-medium rounded-lg hover:bg-sky-700 transition-colors">Done</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by number, block, address…"
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {quartersLoading ? (
                Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
                  <Building2 size={28} className="mb-2 opacity-30" />
                  <p className="text-xs">No available quarters found</p>
                </div>
              ) : filtered.map((q, i) => {
                const isSelected = selectedQuarter?.id === q.id;
                return (
                  <div key={q.id} onClick={() => setSelectedQuarter(isSelected ? null : q)}
                    className={`flex items-center gap-2.5 border rounded-xl p-2 cursor-pointer transition-all ${
                      isSelected ? 'bg-sky-50 border-sky-300 shadow-sm ring-1 ring-sky-300' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}>
                    <img src={getImage(q, i)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-xs">{q.quarter_number}</div>
                      <div className="text-[10px] text-gray-500 truncate">{q.address || (q.block_name ? `Block ${q.block_name}` : '')}</div>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0 text-[10px] text-gray-600 mt-0.5">
                        {q.quarter_type && <span className="font-medium text-gray-700">{q.quarter_type}</span>}
                        {q.floor_number != null && <span>Fl. {q.floor_number}</span>}
                        <span className="font-semibold text-gray-800">{fmtINR(q.monthly_rent)}</span>
                      </div>
                    </div>
                    {isSelected
                      ? <CheckCircle2 size={16} className="text-sky-600 shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col B: comparison */}
          <div className="flex flex-col min-h-0 bg-white">
            <div className="px-4 py-2.5 border-b border-gray-100 shrink-0">
              <h2 className="text-xs font-bold text-gray-800">Upgrade Comparison</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Your current quarter vs. your selected target</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Current (FROM)</div>
                {currentQuarter
                  ? <ComparisonCard quarter={currentQuarter} index={0} variant="from" />
                  : <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-xs text-gray-400">No current quarter data</div>
                }
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Target (TO)</span>
                  {selectedQuarter && (
                    <button onClick={() => setSelectedQuarter(null)} className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-0.5 text-[9px] font-medium">
                      <X size={9} /> Clear
                    </button>
                  )}
                </div>
                {selectedQuarter
                  ? <ComparisonCard quarter={selectedQuarter} index={1} variant="to" />
                  : (
                    <div className="rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-5 text-center">
                      <Search size={20} className="mx-auto mb-1.5 text-sky-300" />
                      <p className="text-xs font-medium text-sky-600">Select a quarter from the list</p>
                      <p className="text-[10px] text-sky-400 mt-0.5">Click any available quarter on the left</p>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} className="text-sky-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Estate Manager Will Assign</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your upgrade request will be reviewed by the Estate Manager, who will assign an appropriate available quarter based on your entitlement and availability.
            </p>
            <div className="mt-3 flex flex-col items-center gap-1.5">
              {requiredBhk && (
                <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
                  <Bed size={10} /> Preferred: {requiredBhk}
                </div>
              )}
              {moveInDate && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CalendarDays size={10} /> Move-in by: {moveInDate}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

const ComparisonCard: React.FC<{ quarter: Quarter; index: number; variant: 'from' | 'to' }> = ({ quarter, index, variant }) => (
  <div className={`rounded-xl border bg-white overflow-hidden shadow-sm ${variant === 'to' ? 'border-sky-300 ring-1 ring-sky-200' : 'border-gray-200'}`}>
    <div className="relative">
      <img src={getImage(quarter, index)} alt="" className="w-full h-20 object-cover" />
      <div className={`absolute top-1.5 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow ${variant === 'to' ? 'bg-sky-600' : 'bg-gray-700'}`}>
        {variant === 'to' ? 'Target' : 'Current'}
      </div>
    </div>
    <div className="p-2.5 space-y-1">
      <div className="font-semibold text-gray-900 text-xs">{quarter.quarter_number}</div>
      {quarter.address && (
        <div className="flex items-start gap-1 text-[10px] text-gray-500">
          <MapPin size={9} className="mt-0.5 shrink-0" /><span className="line-clamp-1">{quarter.address}</span>
        </div>
      )}
      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-[10px]">
        {quarter.quarter_type && <span className="flex items-center gap-0.5 text-gray-700 font-medium"><Bed size={9} />{quarter.quarter_type}</span>}
        {quarter.area_sqft > 0 && <span className="flex items-center gap-0.5 text-gray-600"><Ruler size={9} />{quarter.area_sqft} sq.ft</span>}
        {quarter.floor_number != null && <span className="flex items-center gap-0.5 text-gray-600"><Layers size={9} />Fl. {quarter.floor_number}</span>}
        <span className={`flex items-center gap-0.5 font-semibold ${variant === 'to' ? 'text-sky-700' : 'text-gray-800'}`}>
          <IndianRupee size={9} />{fmtINR(quarter.monthly_rent).replace('₹', '')}/mo
        </span>
      </div>
      {quarter.furnishing_status && (
        <span className="inline-block text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{quarter.furnishing_status}</span>
      )}
    </div>
  </div>
);
