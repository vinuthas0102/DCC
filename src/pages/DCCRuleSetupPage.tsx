import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Plus, Search, Trash2, Save, X, ChevronDown,
  ChevronRight, Percent, IndianRupee, Calendar, AlertCircle, Loader2,
  CheckCircle2, Clock, Layers, Tag, Building2, User, ArrowLeft,
  TrendingUp, Upload, Zap,
} from 'lucide-react';
import { payableCriteriaService } from '../services/payableCriteriaService';
import { dccService } from '../services/dccService';
import type {
  PayableCriteria,
  PayableCriteriaInput,
  PayableTransactionType,
  PaymentMode,
  ReferenceDateType,
  DiscountSlabRow,
  PayablePenaltySlab,
  PayableIncreaseSpec,
  PayableInstalmentGridRow,
  PayableCollectionException,
  CollectionExceptionType,
  PctBasis,
  DueDateReference,
} from '../types/payableCriteria';
import {
  PAYABLE_TRANSACTION_TYPES,
  PAYABLE_TRANSACTION_TYPE_LABELS,
  ALL_PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  ALL_REFERENCE_DATES,
  REFERENCE_DATE_LABELS,
  FREQUENCY_CODES,
  frequencyCodeLabel,
  isInstalmentCode,
  isFixedDateCode,
  computeNextRunDate,
  COLLECTION_EXCEPTION_TYPES,
  COLLECTION_EXCEPTION_TYPE_LABELS,
  DUE_DATE_REFERENCE_LABELS,
} from '../types/payableCriteria';
import type { DccDemandType, DccObjectOwner } from '../types/dcc';
import { ROUTES } from '../constants/routes';
import { useNavigate } from 'react-router-dom';
import { CollectionExceptionRow } from '../components/dcc/CollectionExceptionRow';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyDiscountSlab = (): DiscountSlabRow => ({
  days_offset: 0,
  discount_pct: 0,
  discount_amount: 0,
  applicable_days: 0,
});

const emptyPenaltySlab = (row: number): PayablePenaltySlab => ({
  slab_row: row,
  penalty_type: 'PERCENTAGE',
  penalty_value: 0,
  late_days: 0,
});

const emptyIncreaseSpec = (): PayableIncreaseSpec => ({
  increase_after_months: 12,
  increase_pct: 0,
  increase_min: null,
  increase_max: null,
  alert_message_hook: '',
});

const emptyGridRow = (seq: number): PayableInstalmentGridRow => ({
  object_id: null,
  instalment_seq: seq,
  instalment_date: null,
  instalment_amount: 0,
  next_run_date: null,
});

const emptyException = (type: CollectionExceptionType, seq: number): PayableCollectionException => ({
  exception_type: type,
  seq_no: seq,
  demand_slab_min: null,
  demand_slab_max: null,
  offset_days: 0,
  applicable_pct: 0,
  pct_basis: 'Monthly',
  pct_min: null,
  pct_max: null,
  actual_amount: null,
  message_hook: '',
});

const OBJECT_TYPES = ['PROPERTY', 'QUARTER', 'CAR', 'LOAN', 'ASSET', 'OTHER'];
const IMPORT_SOURCES: { value: PayableCriteriaInput['import_source']; label: string }[] = [
  { value: 'TPA', label: 'Third-Party API (TPA)' },
  { value: 'EXCEL', label: 'Excel Upload' },
  { value: 'AUTO', label: 'Auto-Generation' },
  { value: 'MANUAL', label: 'Manual' },
];

const emptyInput = (): PayableCriteriaInput => ({
  dept: 'DCC',
  subdept: '',
  module_id: 'DCC',
  location: '',
  grade_designation: 'ALL',
  payable_transaction_type: 'RENT',
  first_btm_run_date: null,
  subsequent_btm_run_day: '1',
  next_run_date: null,
  available_payment_modes: ['EPAY'],
  include_gst: false,
  is_active: true,
  demand_type_id: null,
  object_type: null,
  object_owner_id: null,
  import_source: 'AUTO',
  generation_frequency_code: 1,
  default_demand_amount: null,
  default_gst_pct: null,
  due_date_reference: null,
  grace_period_days: 0,
  tpa_url_id: null,
  full_payment_spec: {
    reference_date: 'allotted_date',
    days_offset: 0,
    discount_slabs: [emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab()],
  },
  advance_spec: {
    advance_type: 'PERCENTAGE',
    advance_value: 0,
    reference_date: 'allotted_date',
    days_offset: 0,
  },
  installment_spec: {
    installment_type: 'PERCENTAGE',
    installment_value: 0,
    reference_date: 'allotted_date',
    days_offset: 0,
  },
  penalty_slabs: [1, 2, 3, 4, 5].map((n) => emptyPenaltySlab(n)),
  alert_spec: {
    days_before_due: 7,
    message_hook: '',
  },
  increase_spec: emptyIncreaseSpec(),
  instalment_grid: [],
  collection_exceptions: [],
});

// ── Collapsible Section ────────────────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        {open ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
        {icon}
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{title}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div>
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white text-slate-700 transition-colors';

// ── Main Page ──────────────────────────────────────────────────────────────────
export const DCCRuleSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PayableCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PayableCriteria | null>(null);
  const [form, setForm] = useState<PayableCriteriaInput>(emptyInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // DCC reference data
  const [demandTypes, setDemandTypes] = useState<DccDemandType[]>([]);
  const [owners, setOwners] = useState<DccObjectOwner[]>([]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Load reference data independently so dropdowns always populate
    // even if the rules list query fails
    dccService.listDemandTypes().then(setDemandTypes).catch(() => {});
    dccService.listObjectOwners().then(setOwners).catch(() => {});

    try {
      const data = await payableCriteriaService.listWithSpecs();
      const dccRules = data.filter(r => r.demand_type_id !== null || r.object_type !== null);
      setRecords(dccRules);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demand rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterType !== 'ALL' && r.payable_transaction_type !== filterType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const ownerName = owners.find(o => o.id === r.object_owner_id)?.name ?? '';
      const dtLabel = demandTypes.find(d => d.id === r.demand_type_id)?.label ?? '';
      return (
        (r.object_type ?? '').toLowerCase().includes(q) ||
        ownerName.toLowerCase().includes(q) ||
        dtLabel.toLowerCase().includes(q) ||
        r.payable_transaction_type.toLowerCase().includes(q)
      );
    });
  }, [records, search, filterType, owners, demandTypes]);

  const handleSelect = (rec: PayableCriteria) => {
    setSelectedId(rec.id);
    setEditing(rec);
    setShowNew(false);
    setForm({
      dept: rec.dept,
      subdept: rec.subdept,
      module_id: rec.module_id,
      location: rec.location,
      grade_designation: rec.grade_designation,
      payable_transaction_type: rec.payable_transaction_type,
      first_btm_run_date: rec.first_btm_run_date,
      subsequent_btm_run_day: rec.subsequent_btm_run_day,
      next_run_date: rec.next_run_date,
      available_payment_modes: rec.available_payment_modes,
      include_gst: rec.include_gst,
      is_active: rec.is_active,
      demand_type_id: rec.demand_type_id ?? null,
      object_type: rec.object_type ?? null,
      object_owner_id: rec.object_owner_id ?? null,
      import_source: rec.import_source ?? null,
      generation_frequency_code: rec.generation_frequency_code ?? 1,
      default_demand_amount: rec.default_demand_amount ?? null,
      default_gst_pct: rec.default_gst_pct ?? null,
      due_date_reference: rec.due_date_reference ?? null,
      grace_period_days: rec.grace_period_days ?? 0,
      tpa_url_id: rec.tpa_url_id ?? null,
      full_payment_spec: rec.full_payment_spec ?? {
        reference_date: 'allotted_date',
        days_offset: 0,
        discount_slabs: [emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab()],
      },
      advance_spec: rec.advance_spec ?? {
        advance_type: 'PERCENTAGE',
        advance_value: 0,
        reference_date: 'allotted_date',
        days_offset: 0,
      },
      installment_spec: rec.installment_spec ?? {
        installment_type: 'PERCENTAGE',
        installment_value: 0,
        reference_date: 'allotted_date',
        days_offset: 0,
      },
      penalty_slabs: rec.penalty_slabs?.length
        ? [1, 2, 3, 4, 5].map((n) => rec.penalty_slabs!.find((s) => s.slab_row === n) ?? emptyPenaltySlab(n))
        : [1, 2, 3, 4, 5].map((n) => emptyPenaltySlab(n)),
      alert_spec: rec.alert_spec ?? {
        days_before_due: 7,
        message_hook: '',
      },
      increase_spec: rec.increase_spec ?? emptyIncreaseSpec(),
      instalment_grid: rec.instalment_grid ?? [],
      collection_exceptions: rec.collection_exceptions ?? [],
    });
  };

  const handleNew = () => {
    setShowNew(true);
    setSelectedId(null);
    setEditing(null);
    setForm(emptyInput());
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await payableCriteriaService.update(editing.id, form);
      } else {
        await payableCriteriaService.create(form);
      }
      await loadList();
      setShowNew(false);
      setEditing(null);
      setSelectedId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this demand rule? This cannot be undone.')) return;
    try {
      await payableCriteriaService.remove(id);
      if (selectedId === id) {
        setSelectedId(null);
        setEditing(null);
      }
      await loadList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const togglePaymentMode = (mode: PaymentMode) => {
    setForm((f) => ({
      ...f,
      available_payment_modes: f.available_payment_modes.includes(mode)
        ? f.available_payment_modes.filter((m) => m !== mode)
        : [...f.available_payment_modes, mode],
    }));
  };

  const updateDiscountSlab = (idx: number, field: keyof DiscountSlabRow, value: number) => {
    setForm((f) => {
      const slabs = [...f.full_payment_spec.discount_slabs];
      slabs[idx] = { ...slabs[idx], [field]: value };
      return { ...f, full_payment_spec: { ...f.full_payment_spec, discount_slabs: slabs } };
    });
  };

  const updatePenaltySlab = (idx: number, field: keyof PayablePenaltySlab, value: string | number) => {
    setForm((f) => {
      const slabs = [...f.penalty_slabs];
      slabs[idx] = { ...slabs[idx], [field]: value } as PayablePenaltySlab;
      return { ...f, penalty_slabs: slabs };
    });
  };

  // ── Collection exception helpers ──────────────────────────────────────────────
  const addException = (type: CollectionExceptionType) => {
    setForm((f) => {
      const seq = f.collection_exceptions.filter((e) => e.exception_type === type).length + 1;
      return { ...f, collection_exceptions: [...f.collection_exceptions, emptyException(type, seq)] };
    });
  };

  const updateException = (idx: number, field: string, value: string) => {
    setForm((f) => {
      const excs = [...f.collection_exceptions];
      const exc = { ...excs[idx] };
      if (field === 'demand_slab_min' || field === 'demand_slab_max' || field === 'pct_min' || field === 'pct_max' || field === 'actual_amount') {
        (exc as Record<string, unknown>)[field] = value === '' ? null : Number(value);
      } else if (field === 'offset_days' || field === 'applicable_pct' || field === 'seq_no') {
        (exc as Record<string, unknown>)[field] = value === '' ? 0 : Number(value);
      } else {
        (exc as Record<string, unknown>)[field] = value;
      }
      excs[idx] = exc;
      return { ...f, collection_exceptions: excs };
    });
  };

  const removeException = (idx: number) => {
    setForm((f) => ({
      ...f,
      collection_exceptions: f.collection_exceptions.filter((_, i) => i !== idx),
    }));
  };

  // ── Instalment grid helpers ────────────────────────────────────────────────────
  const addGridRow = () => {
    setForm((f) => ({
      ...f,
      instalment_grid: [...f.instalment_grid, emptyGridRow(f.instalment_grid.length + 1)],
    }));
  };

  const updateGridRow = (idx: number, field: keyof PayableInstalmentGridRow, value: string | number | null) => {
    setForm((f) => {
      const grid = [...f.instalment_grid];
      grid[idx] = { ...grid[idx], [field]: value };
      return { ...f, instalment_grid: grid };
    });
  };

  const removeGridRow = (idx: number) => {
    setForm((f) => ({
      ...f,
      instalment_grid: f.instalment_grid.filter((_, i) => i !== idx),
    }));
  };

  const handleGridExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simple CSV parse for instalment grid: seq,date,amount
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? '');
      const lines = text.split('\n').filter((l) => l.trim());
      const rows: PayableInstalmentGridRow[] = [];
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < 3) continue;
        const seq = parseInt(parts[0], 10);
        if (isNaN(seq)) continue;
        rows.push({
          object_id: null,
          instalment_seq: seq,
          instalment_date: parts[1] || null,
          instalment_amount: parseFloat(parts[2]) || 0,
          next_run_date: parts[1] || null,
        });
      }
      if (rows.length > 0) {
        setForm((f) => ({ ...f, instalment_grid: rows }));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Frequency code change handler ──────────────────────────────────────────────
  const handleFrequencyCodeChange = (code: number) => {
    setForm((f) => {
      const nextRun = computeNextRunDate(code);
      return { ...f, generation_frequency_code: code, next_run_date: nextRun ?? f.next_run_date };
    });
  };

  // ── Computed next instalment seq for display ────────────────────────────────────
  const nextInstalmentSeq = useMemo(() => {
    if (!isInstalmentCode(form.generation_frequency_code)) return null;
    if (form.instalment_grid.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = form.instalment_grid
      .filter((r) => r.instalment_date && r.instalment_date >= today)
      .sort((a, b) => (a.instalment_date ?? '').localeCompare(b.instalment_date ?? ''));
    return upcoming[0]?.instalment_seq ?? null;
  }, [form.generation_frequency_code, form.instalment_grid]);

  const computedNextRun = useMemo(() => {
    if (isInstalmentCode(form.generation_frequency_code) && form.instalment_grid.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = form.instalment_grid
        .filter((r) => r.instalment_date && r.instalment_date >= today)
        .sort((a, b) => (a.instalment_date ?? '').localeCompare(b.instalment_date ?? ''));
      return upcoming[0]?.instalment_date ?? null;
    }
    return computeNextRunDate(form.generation_frequency_code);
  }, [form.generation_frequency_code, form.instalment_grid]);

  const showForm = showNew || editing !== null;
  const showInstalmentGrid = isInstalmentCode(form.generation_frequency_code);
  const showTPAField = form.import_source === 'TPA';
  const showFixedDate = isFixedDateCode(form.generation_frequency_code);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Page header — Deep Slate Navy */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
        <button
          onClick={() => navigate(ROUTES.DCC)}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <SlidersHorizontal size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white">Demand Rule Setup</h1>
          <p className="text-[10px] text-slate-400">Master rule engine for demand generation and collection</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={13} /> New Rule
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}

      <div className="flex-1 flex gap-3 p-3 min-h-0">
        {/* Left: List */}
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-w-0">
          {/* Filters */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 shrink-0">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by demand type, object type, owner…"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 bg-white"
            >
              <option value="ALL">All Types</option>
              {PAYABLE_TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PAYABLE_TRANSACTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* List body */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-emerald-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <SlidersHorizontal size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No demand rules found</p>
                <p className="text-xs mt-1">Click "New Rule" to create one</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map((rec) => {
                  const isActive = selectedId === rec.id;
                  const hasRun = rec.next_run_date !== null;
                  const dtLabel = demandTypes.find(d => d.id === rec.demand_type_id)?.label ?? '—';
                  const ownerName = owners.find(o => o.id === rec.object_owner_id)?.name ?? '—';
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleSelect(rec)}
                      className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isActive ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {rec.payable_transaction_type}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate">{dtLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-0.5"><Building2 size={10} />{rec.object_type ?? '—'}</span>
                          <span className="flex items-center gap-0.5"><User size={10} />{ownerName}</span>
                          <span className="flex items-center gap-0.5"><Tag size={10} />{rec.import_source ?? '—'}</span>
                          <span className="flex items-center gap-0.5 text-emerald-600"><Zap size={10} />{frequencyCodeLabel(rec.generation_frequency_code ?? 1)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className={`flex items-center gap-0.5 ${hasRun ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {hasRun ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                            {hasRun ? `Next run: ${fmtDate(rec.next_run_date)}` : 'No run yet'}
                          </span>
                          {rec.last_run_date && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">Last: {fmtDate(rec.last_run_date)}</span>
                            </>
                          )}
                          {rec.next_instalment_seq != null && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span className="text-sky-600 font-medium">Inst #{rec.next_instalment_seq}</span>
                            </>
                          )}
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{rec.available_payment_modes.length} mode{rec.available_payment_modes.length !== 1 ? 's' : ''}</span>
                          {rec.include_gst && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span className="text-emerald-600 font-medium">GST</span>
                            </>
                          )}
                          {!rec.is_active && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span className="text-red-500 font-medium">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                        className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Form panel */}
        {showForm && (
          <div className="w-[520px] shrink-0 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-800 shrink-0">
              <span className="text-xs font-bold text-white">{editing ? 'Edit Rule' : 'New Rule'}</span>
              <button
                onClick={() => { setShowNew(false); setEditing(null); setSelectedId(null); }}
                className="ml-auto p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* DCC Keying */}
              <Section title="Demand Key" icon={<Tag size={13} className="text-emerald-500" />} defaultOpen>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Demand Type" required>
                    <select
                      className={inputCls}
                      value={form.demand_type_id ?? ''}
                      onChange={(e) => setForm({ ...form, demand_type_id: e.target.value || null })}
                    >
                      <option value="">Select…</option>
                      {demandTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Object Type" required>
                    <select
                      className={inputCls}
                      value={form.object_type ?? ''}
                      onChange={(e) => setForm({ ...form, object_type: e.target.value || null })}
                    >
                      <option value="">Select…</option>
                      {OBJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Object Owner">
                    <select
                      className={inputCls}
                      value={form.object_owner_id ?? ''}
                      onChange={(e) => setForm({ ...form, object_owner_id: e.target.value || null })}
                    >
                      <option value="">All Owners</option>
                      {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Import Source">
                    <select
                      className={inputCls}
                      value={form.import_source ?? ''}
                      onChange={(e) => setForm({ ...form, import_source: (e.target.value || null) as PayableCriteriaInput['import_source'] })}
                    >
                      <option value="">Select…</option>
                      {IMPORT_SOURCES.map(s => <option key={s.value ?? 'none'} value={s.value ?? ''}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Transaction Type" required>
                    <select className={inputCls} value={form.payable_transaction_type} onChange={(e) => setForm({ ...form, payable_transaction_type: e.target.value as PayableTransactionType })}>
                      {PAYABLE_TRANSACTION_TYPES.map((t) => (
                        <option key={t} value={t}>{PAYABLE_TRANSACTION_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </Field>
                  {showTPAField && (
                    <Field label="TPA URL ID">
                      <input
                        className={inputCls}
                        value={form.tpa_url_id ?? ''}
                        onChange={(e) => setForm({ ...form, tpa_url_id: e.target.value || null })}
                        placeholder="e.g. TPA_PROP_TAX_API"
                      />
                    </Field>
                  )}
                </div>
              </Section>

              {/* Generation Schedule */}
              <Section title="Generation Schedule" icon={<Calendar size={13} className="text-amber-500" />} defaultOpen>
                <Field label="Generation Frequency Code" required>
                  <select
                    className={inputCls}
                    value={form.generation_frequency_code}
                    onChange={(e) => handleFrequencyCodeChange(Number(e.target.value))}
                  >
                    {FREQUENCY_CODES.map((f) => (
                      <option key={f.code} value={f.code}>{f.label}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Run Date">
                    <input type="date" className={inputCls} value={form.first_btm_run_date ?? ''} onChange={(e) => setForm({ ...form, first_btm_run_date: e.target.value || null })} />
                  </Field>
                  <Field label="Subsequent Run Day (legacy)">
                    <select className={inputCls} value={form.subsequent_btm_run_day} onChange={(e) => setForm({ ...form, subsequent_btm_run_day: e.target.value })}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>Day {d}</option>
                      ))}
                      <option value="EOM">End of Month (EOM)</option>
                    </select>
                  </Field>
                  <Field label="Next Run Date">
                    <input
                      type="date"
                      className={inputCls}
                      value={form.next_run_date ?? ''}
                      onChange={(e) => setForm({ ...form, next_run_date: e.target.value || null })}
                      disabled={!showFixedDate}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {showFixedDate ? 'Enter the fixed generation date' : `Auto-computed: ${computedNextRun ?? 'N/A'}`}
                    </p>
                  </Field>
                  <Field label="Default Demand Amount">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.default_demand_amount ?? ''}
                      onChange={(e) => setForm({ ...form, default_demand_amount: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="Fallback if TPA/Excel omits amount"
                    />
                  </Field>
                  <Field label="Default GST %">
                    <input
                      type="number"
                      step="0.01"
                      className={inputCls}
                      value={form.default_gst_pct ?? ''}
                      onChange={(e) => setForm({ ...form, default_gst_pct: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="Fallback GST %"
                    />
                  </Field>
                  <Field label="Due Date Reference">
                    <select
                      className={inputCls}
                      value={form.due_date_reference ?? ''}
                      onChange={(e) => setForm({ ...form, due_date_reference: (e.target.value || null) as DueDateReference | null })}
                    >
                      <option value="">Select…</option>
                      {Object.entries(DUE_DATE_REFERENCE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Grace Period (days)">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.grace_period_days}
                      onChange={(e) => setForm({ ...form, grace_period_days: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                {form.due_date_reference && (
                  <div className="px-3 py-2 bg-emerald-50 rounded-md text-[11px] text-emerald-700 font-medium">
                    Due date = {form.due_date_reference} date + {form.grace_period_days} days
                  </div>
                )}
              </Section>

              {/* Demand Increase */}
              <Section title="Demand Increase" icon={<TrendingUp size={13} className="text-emerald-500" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Increase After (months)">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.increase_spec.increase_after_months}
                      onChange={(e) => setForm({ ...form, increase_spec: { ...form.increase_spec, increase_after_months: Number(e.target.value) } })}
                    />
                  </Field>
                  <Field label="Increase %">
                    <input
                      type="number"
                      step="0.01"
                      className={inputCls}
                      value={form.increase_spec.increase_pct}
                      onChange={(e) => setForm({ ...form, increase_spec: { ...form.increase_spec, increase_pct: Number(e.target.value) } })}
                    />
                  </Field>
                  <Field label="Min Increase Amount">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.increase_spec.increase_min ?? ''}
                      onChange={(e) => setForm({ ...form, increase_spec: { ...form.increase_spec, increase_min: e.target.value === '' ? null : Number(e.target.value) } })}
                    />
                  </Field>
                  <Field label="Max Increase Amount">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.increase_spec.increase_max ?? ''}
                      onChange={(e) => setForm({ ...form, increase_spec: { ...form.increase_spec, increase_max: e.target.value === '' ? null : Number(e.target.value) } })}
                    />
                  </Field>
                </div>
                <Field label="Alert Message Hook">
                  <input
                    className={inputCls}
                    value={form.increase_spec.alert_message_hook}
                    onChange={(e) => setForm({ ...form, increase_spec: { ...form.increase_spec, alert_message_hook: e.target.value } })}
                    placeholder="e.g. HOOK_DEMAND_INCREASE_ALERT"
                  />
                </Field>
                <p className="text-[10px] text-slate-400">
                  After {form.increase_spec.increase_after_months} months, {form.increase_spec.increase_pct}% increase applied to last demand.
                  Repeats every {form.increase_spec.increase_after_months} months thereafter (compounded).
                </p>
              </Section>

              {/* Instalment Grid (frequency code 95 only) */}
              {showInstalmentGrid && (
                <Section title="Instalment Grid" icon={<Layers size={13} className="text-sky-500" />} defaultOpen>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={addGridRow}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-semibold hover:bg-sky-100 transition-colors"
                    >
                      <Plus size={12} /> Add Row
                    </button>
                    <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-50 text-slate-600 text-[11px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer">
                      <Upload size={12} /> Upload CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleGridExcelUpload} />
                    </label>
                    <div className="ml-auto flex items-center gap-3 text-[10px]">
                      {nextInstalmentSeq != null && (
                        <span className="text-sky-600 font-semibold">Next Instalment: #{nextInstalmentSeq}</span>
                      )}
                      {computedNextRun && (
                        <span className="text-gray-500">Next Run: {fmtDate(computedNextRun)}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {form.instalment_grid.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-2">No instalment rows defined. Add rows manually or upload a CSV (seq,date,amount).</p>
                    ) : (
                      form.instalment_grid.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                          <input
                            type="number"
                            placeholder="Seq"
                            className={`${inputCls} col-span-2`}
                            value={row.instalment_seq}
                            onChange={(e) => updateGridRow(idx, 'instalment_seq', Number(e.target.value))}
                          />
                          <input
                            type="date"
                            placeholder="Date"
                            className={`${inputCls} col-span-4`}
                            value={row.instalment_date ?? ''}
                            onChange={(e) => updateGridRow(idx, 'instalment_date', e.target.value || null)}
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            className={`${inputCls} col-span-4`}
                            value={row.instalment_amount}
                            onChange={(e) => updateGridRow(idx, 'instalment_amount', Number(e.target.value))}
                          />
                          <button
                            onClick={() => removeGridRow(idx)}
                            className="col-span-2 flex items-center justify-center p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Section>
              )}

              {/* Collection Rules */}
              <Section title="Collection Controls & Allowed Modes" icon={<IndianRupee size={13} className="text-emerald-500" />}>
                <Field label="Allowed Payment Modes" required>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PAYMENT_MODES.map((mode) => {
                      const sel = form.available_payment_modes.includes(mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => togglePaymentMode(mode)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${sel ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                        >
                          {PAYMENT_MODE_LABELS[mode]}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.include_gst} onChange={(e) => setForm({ ...form, include_gst: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700">Include GST</span>
                  </label>
                </div>
              </Section>

              {/* Full Payment Specs */}
              <Section title="Full Payment & Discount Grid" icon={<CheckCircle2 size={13} className="text-emerald-500" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reference Date" required>
                    <select className={inputCls} value={form.full_payment_spec.reference_date} onChange={(e) => setForm({ ...form, full_payment_spec: { ...form.full_payment_spec, reference_date: e.target.value as ReferenceDateType } })}>
                      {ALL_REFERENCE_DATES.map((d) => (
                        <option key={d} value={d}>{REFERENCE_DATE_LABELS[d]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Days Offset (due = ref + offset)">
                    <input type="number" className={inputCls} value={form.full_payment_spec.days_offset} onChange={(e) => setForm({ ...form, full_payment_spec: { ...form.full_payment_spec, days_offset: Number(e.target.value) } })} />
                  </Field>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Discount Slabs (up to 5 rows)</div>
                  <div className="space-y-1.5">
                    {form.full_payment_spec.discount_slabs.map((slab, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-1.5">
                        <input type="number" placeholder="Days Offset" className={inputCls} value={slab.days_offset} onChange={(e) => updateDiscountSlab(idx, 'days_offset', Number(e.target.value))} />
                        <input type="number" placeholder="Disc %" className={inputCls} value={slab.discount_pct} onChange={(e) => updateDiscountSlab(idx, 'discount_pct', Number(e.target.value))} />
                        <input type="number" placeholder="Disc Amt" className={inputCls} value={slab.discount_amount} onChange={(e) => updateDiscountSlab(idx, 'discount_amount', Number(e.target.value))} />
                        <input type="number" placeholder="Applic. Days" className={inputCls} value={slab.applicable_days} onChange={(e) => updateDiscountSlab(idx, 'applicable_days', Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Example: ref date + 45 days, 2% discount if paid within 15 days, 1% if within 30 days.</p>
                </div>
              </Section>

              {/* Advance Payment */}
              <Section title="Advance Payment" icon={<IndianRupee size={13} className="text-amber-500" />}>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Advance Type">
                    <select className={inputCls} value={form.advance_spec.advance_type} onChange={(e) => setForm({ ...form, advance_spec: { ...form.advance_spec, advance_type: e.target.value as 'PERCENTAGE' | 'AMOUNT' } })}>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="AMOUNT">Exact Amount</option>
                    </select>
                  </Field>
                  <Field label="Advance Value">
                    <input type="number" className={inputCls} value={form.advance_spec.advance_value} onChange={(e) => setForm({ ...form, advance_spec: { ...form.advance_spec, advance_value: Number(e.target.value) } })} />
                  </Field>
                  <Field label="Days Offset">
                    <input type="number" className={inputCls} value={form.advance_spec.days_offset} onChange={(e) => setForm({ ...form, advance_spec: { ...form.advance_spec, days_offset: Number(e.target.value) } })} />
                  </Field>
                </div>
                <Field label="Reference Date" required>
                  <select className={inputCls} value={form.advance_spec.reference_date} onChange={(e) => setForm({ ...form, advance_spec: { ...form.advance_spec, reference_date: e.target.value as ReferenceDateType } })}>
                    {ALL_REFERENCE_DATES.map((d) => (
                      <option key={d} value={d}>{REFERENCE_DATE_LABELS[d]}</option>
                    ))}
                  </select>
                </Field>
              </Section>

              {/* Installment Payment */}
              <Section title="Instalment Payment" icon={<Layers size={13} className="text-sky-500" />}>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Instalment Type">
                    <select className={inputCls} value={form.installment_spec.installment_type} onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, installment_type: e.target.value as 'PERCENTAGE' | 'AMOUNT' } })}>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="AMOUNT">Exact Amount</option>
                    </select>
                  </Field>
                  <Field label="Instalment Value">
                    <input type="number" className={inputCls} value={form.installment_spec.installment_value} onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, installment_value: Number(e.target.value) } })} />
                  </Field>
                  <Field label="Days Offset">
                    <input type="number" className={inputCls} value={form.installment_spec.days_offset} onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, days_offset: Number(e.target.value) } })} />
                  </Field>
                </div>
                <Field label="Reference Date (first instalment only)" required>
                  <select className={inputCls} value={form.installment_spec.reference_date} onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, reference_date: e.target.value as ReferenceDateType } })}>
                    {ALL_REFERENCE_DATES.map((d) => (
                      <option key={d} value={d}>{REFERENCE_DATE_LABELS[d]}</option>
                    ))}
                  </select>
                </Field>
                <p className="text-[10px] text-slate-400"># of instalments is auto-calculated: (payable amount - advance) / instalment amount</p>
              </Section>

              {/* Penalty Slabs */}
              <Section title="Penalty Slabs Grid" icon={<Percent size={13} className="text-red-500" />}>
                <div className="space-y-1.5">
                  {form.penalty_slabs.map((slab, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-400">Row {slab.slab_row}</span>
                      <select className={inputCls} value={slab.penalty_type} onChange={(e) => updatePenaltySlab(idx, 'penalty_type', e.target.value)}>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="AMOUNT">Amount</option>
                      </select>
                      <input type="number" placeholder="Value" className={inputCls} value={slab.penalty_value} onChange={(e) => updatePenaltySlab(idx, 'penalty_value', Number(e.target.value))} />
                      <input type="number" placeholder="Late Days" className={inputCls} value={slab.late_days} onChange={(e) => updatePenaltySlab(idx, 'late_days', Number(e.target.value))} />
                    </div>
                  ))}
                </div>
              </Section>

              {/* Alert Criteria */}
              <Section title="Alert Criteria & Exception Grid" icon={<AlertCircle size={13} className="text-amber-500" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Days Before Due Date">
                    <input type="number" className={inputCls} value={form.alert_spec.days_before_due} onChange={(e) => setForm({ ...form, alert_spec: { ...form.alert_spec, days_before_due: Number(e.target.value) } })} />
                  </Field>
                  <Field label="Message Hook #">
                    <input className={inputCls} value={form.alert_spec.message_hook} onChange={(e) => setForm({ ...form, alert_spec: { ...form.alert_spec, message_hook: e.target.value } })} placeholder="e.g. HOOK_PAYABLE_DUE_REMINDER" />
                  </Field>
                </div>
              </Section>

              {/* Collection Exception Grid */}
              <Section title="Collection Exception Grid" icon={<SlidersHorizontal size={13} className="text-slate-500" />}>
                <div className="flex items-center gap-2 mb-2">
                  {COLLECTION_EXCEPTION_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addException(type)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-50 text-slate-600 text-[11px] font-semibold hover:bg-slate-100 transition-colors"
                    >
                      <Plus size={12} /> {COLLECTION_EXCEPTION_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
                {form.collection_exceptions.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">
                    No exception rules defined. Add Instalment, Discount, Penalty, or Alert rules with demand slabs and offset days.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-1.5 px-2 text-[9px] font-bold uppercase text-slate-400">
                      <span className="col-span-2">Type</span>
                      <span className="col-span-1">Slab Min</span>
                      <span className="col-span-1">Slab Max</span>
                      <span className="col-span-1">Offset</span>
                      <span className="col-span-1">App %</span>
                      <span className="col-span-1">Basis</span>
                      <span className="col-span-1">Min</span>
                      <span className="col-span-1">Max</span>
                      <span className="col-span-1">Actual</span>
                      <span className="col-span-1">Hook</span>
                      <span className="col-span-1"></span>
                    </div>
                    {form.collection_exceptions.map((exc, idx) => (
                      <CollectionExceptionRow
                        key={idx}
                        exceptionType={exc.exception_type}
                        seqNo={exc.seq_no}
                        demandSlabMin={exc.demand_slab_min?.toString() ?? ''}
                        demandSlabMax={exc.demand_slab_max?.toString() ?? ''}
                        offsetDays={exc.offset_days.toString()}
                        applicablePct={exc.applicable_pct.toString()}
                        pctBasis={exc.pct_basis}
                        pctMin={exc.pct_min?.toString() ?? ''}
                        pctMax={exc.pct_max?.toString() ?? ''}
                        actualAmount={exc.actual_amount?.toString() ?? ''}
                        messageHook={exc.message_hook}
                        onChange={(field, value) => updateException(idx, field, value)}
                        onRemove={() => removeException(idx)}
                      />
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  Define demand slabs, offset days, and applicable % for instalment, discount, penalty, and alert exceptions.
                  Actual amount overrules % based amount when specified.
                </p>
              </Section>

              {/* Active toggle */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700">Active</span>
                </label>
              </div>
            </div>

            {/* Save bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !form.demand_type_id || !form.object_type}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {editing ? 'Update' : 'Create'} Rule
              </button>
              <button
                onClick={() => { setShowNew(false); setEditing(null); setSelectedId(null); }}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DCCRuleSetupPage;
