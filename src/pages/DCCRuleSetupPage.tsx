import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Plus, Search, Trash2, Save, X, ChevronDown,
  ChevronRight, Percent, IndianRupee, Calendar, AlertCircle, Loader2,
  CheckCircle2, Layers, Tag, Building2, ArrowLeft,
  TrendingUp, Upload, Filter, LogOut, Lock, Power,
} from 'lucide-react';
import { payableCriteriaService } from '../services/payableCriteriaService';
import { dccService } from '../services/dccService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROLE_LABELS } from '../constants/roles';
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
  PayableInstalmentLine,
  InstalmentMode,
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
import { RuleFilterModal, emptyRuleFilterState, countActiveRuleFilters, type RuleFilterState } from '../components/dcc/RuleFilterModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtINR = (n: number | null) =>
  n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

const SOURCE_BADGE: Record<string, string> = {
  TPA: 'bg-blue-100 text-blue-700 border border-blue-200',
  EXCEL: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  AUTO: 'bg-amber-100 text-amber-700 border border-amber-200',
  MANUAL: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const SOURCE_ROW_STYLE: Record<string, string> = {
  TPA: 'bg-blue-50/55 border-l-blue-400',
  EXCEL: 'bg-emerald-50/55 border-l-emerald-400',
  AUTO: 'bg-amber-50/55 border-l-amber-400',
  MANUAL: 'bg-slate-50/80 border-l-slate-400',
};

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
  interest_pct: 0,
  defaulted_interest_pct: 0,
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

const emptyInstalmentLine = (seq: number): PayableInstalmentLine => ({
  seq,
  amount: 0,
  due_date_reference: 'payable_generation_date',
  days_offset: 0,
  interest_pct: 0,
  defaulted_interest_pct: 0,
});

const computeAutoInstalmentLines = (
  instalmentAmount: number,
  totalDue: number,
  count: number | null,
  refDate: string,
  initialOffset: number,
  intervalDays: number,
  interestPct: number,
  defaultedInterestPct: number,
): PayableInstalmentLine[] => {
  if (instalmentAmount <= 0) return [];
  let n = count;
  if (!n || n <= 0) {
    n = Math.ceil(totalDue / instalmentAmount);
  }
  if (n <= 0) return [];
  const lines: PayableInstalmentLine[] = [];
  let remaining = totalDue;
  for (let i = 1; i <= n; i++) {
    const isLast = i === n;
    let amt = instalmentAmount;
    if (isLast) {
      amt = Math.max(remaining, instalmentAmount);
    }
    remaining -= instalmentAmount;
    lines.push({
      seq: i,
      amount: Math.round(amt * 100) / 100,
      due_date_reference: refDate as ReferenceDateType,
      days_offset: initialOffset + (i - 1) * intervalDays,
      interest_pct: interestPct,
      defaulted_interest_pct: defaultedInterestPct,
    });
  }
  return lines;
};

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
    instalment_mode: 'AUTO_CALC' as InstalmentMode,
    instalment_count: null,
    interval_days: 30,
    instalment_lines: [] as PayableInstalmentLine[],
    default_interest_pct: 0,
    default_defaulted_interest_pct: 0,
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
const roInputCls =
  'w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed';

// ── Main Page ──────────────────────────────────────────────────────────────────
export const DCCRuleSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { openProfileDrawer } = useUIStore();
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [ruleFilters, setRuleFilters] = useState<RuleFilterState>(emptyRuleFilterState);
  const [usedRuleIds, setUsedRuleIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      const [data, usedIds] = await Promise.all([
        payableCriteriaService.listWithSpecs(),
        payableCriteriaService.getUsedCriteriaIds().catch(() => new Set<string>()),
      ]);
      const dccRules = data.filter(r => r.demand_type_id !== null || r.object_type !== null);
      setRecords(dccRules);
      setUsedRuleIds(usedIds);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demand rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const activeFilterCount = countActiveRuleFilters(ruleFilters);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterType !== 'ALL' && r.payable_transaction_type !== filterType) return false;
      if (ruleFilters.objectTypes.length > 0 && !ruleFilters.objectTypes.includes(r.object_type ?? '')) return false;
      if (ruleFilters.importSources.length > 0 && !ruleFilters.importSources.includes(r.import_source ?? '')) return false;
      if (ruleFilters.ownerIds.length > 0 && !ruleFilters.ownerIds.includes(r.object_owner_id ?? '')) return false;
      if (ruleFilters.demandTypeIds.length > 0 && !ruleFilters.demandTypeIds.includes(r.demand_type_id ?? '')) return false;
      if (ruleFilters.activeOnly !== null && r.is_active !== ruleFilters.activeOnly) return false;
      if (ruleFilters.includeGst !== null && r.include_gst !== ruleFilters.includeGst) return false;
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
  }, [records, search, filterType, owners, demandTypes, ruleFilters]);

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
      available_payment_modes: rec.available_payment_modes ?? [],
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
      full_payment_spec: {
        reference_date: rec.full_payment_spec?.reference_date ?? 'allotted_date',
        days_offset: rec.full_payment_spec?.days_offset ?? 0,
        discount_slabs: rec.full_payment_spec?.discount_slabs ?? [
          emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab(), emptyDiscountSlab(),
        ],
      },
      advance_spec: {
        advance_type: rec.advance_spec?.advance_type ?? 'PERCENTAGE',
        advance_value: rec.advance_spec?.advance_value ?? 0,
        reference_date: rec.advance_spec?.reference_date ?? 'allotted_date',
        days_offset: rec.advance_spec?.days_offset ?? 0,
      },
      installment_spec: {
        installment_type: rec.installment_spec?.installment_type ?? 'PERCENTAGE',
        installment_value: rec.installment_spec?.installment_value ?? 0,
        reference_date: rec.installment_spec?.reference_date ?? 'allotted_date',
        days_offset: rec.installment_spec?.days_offset ?? 0,
        instalment_mode: rec.installment_spec?.instalment_mode ?? 'AUTO_CALC',
        instalment_count: rec.installment_spec?.instalment_count ?? null,
        interval_days: rec.installment_spec?.interval_days ?? 30,
        instalment_lines: rec.installment_spec?.instalment_lines ?? [],
        default_interest_pct: rec.installment_spec?.default_interest_pct ?? 0,
        default_defaulted_interest_pct: rec.installment_spec?.default_defaulted_interest_pct ?? 0,
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

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const initials = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

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

  const handleToggleActive = async (id: string, makeActive: boolean) => {
    setTogglingId(id);
    try {
      await payableCriteriaService.toggleActive(id, makeActive);
      await loadList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to toggle rule');
    } finally {
      setTogglingId(null);
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

  // ── Instalment line helpers (new instalment mode system) ──────────────────────
  const addInstalmentLine = () => {
    setForm((f) => ({
      ...f,
      installment_spec: {
        ...f.installment_spec,
        instalment_lines: [...f.installment_spec.instalment_lines, emptyInstalmentLine(f.installment_spec.instalment_lines.length + 1)],
      },
    }));
  };

  const updateInstalmentLine = (idx: number, field: keyof PayableInstalmentLine, value: string | number) => {
    setForm((f) => {
      const lines = [...f.installment_spec.instalment_lines];
      lines[idx] = { ...lines[idx], [field]: value } as PayableInstalmentLine;
      return { ...f, installment_spec: { ...f.installment_spec, instalment_lines: lines } };
    });
  };

  const removeInstalmentLine = (idx: number) => {
    setForm((f) => ({
      ...f,
      installment_spec: {
        ...f.installment_spec,
        instalment_lines: f.installment_spec.instalment_lines
          .filter((_, i) => i !== idx)
          .map((l, i) => ({ ...l, seq: i + 1 })),
      },
    }));
  };

  // ── Computed instalment preview (auto-calc mode) ─────────────────────────────
  const instalmentPreview = useMemo(() => {
    const spec = form.installment_spec;
    if (spec.instalment_mode !== 'AUTO_CALC') return spec.instalment_lines;
    const advanceAmount =
      form.advance_spec.advance_type === 'AMOUNT'
        ? form.advance_spec.advance_value
        : (form.default_demand_amount ?? 0) * (form.advance_spec.advance_value / 100);
    const totalDue = Math.max(0, (form.default_demand_amount ?? 0) - advanceAmount);
    return computeAutoInstalmentLines(
      spec.installment_value,
      totalDue,
      spec.instalment_count,
      spec.reference_date,
      spec.days_offset,
      spec.interval_days,
      spec.default_interest_pct ?? 0,
      spec.default_defaulted_interest_pct ?? 0,
    );
  }, [form.installment_spec, form.advance_spec, form.default_demand_amount]);

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
  const isLocked = editing !== null && usedRuleIds.has(editing.id);
  const showInstalmentGrid = isInstalmentCode(form.generation_frequency_code);
  const showTPAField = form.import_source === 'TPA';
  const showFixedDate = isFixedDateCode(form.generation_frequency_code);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <RuleFilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        records={records}
        demandTypes={demandTypes}
        owners={owners}
        state={ruleFilters}
        onApply={setRuleFilters}
      />

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

        {/* New Rule action */}
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
        >
          <Plus size={13} /> New Rule
        </button>

        {/* User context — click to open profile */}
        {user && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={openProfileDrawer}
              title="View Profile"
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-700/40 hover:bg-blue-900/60 hover:border-emerald-500/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-[11px] font-semibold text-white whitespace-nowrap">{user.fullName || user.email}</div>
                <div className="text-[9px] text-emerald-300 font-medium whitespace-nowrap">{ROLE_LABELS[user.role]}</div>
              </div>
            </button>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
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
            <button
              onClick={() => setFilterOpen(true)}
              className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${activeFilterCount > 0 ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'}`}
            >
              <Filter size={13} />
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white text-emerald-700 text-[9px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <span
              onClick={activeFilterCount > 0 ? () => setFilterOpen(true) : undefined}
              className={`text-[11px] whitespace-nowrap ${
                activeFilterCount > 0
                  ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                  : 'text-slate-400'
              }`}
            >
              {filtered.length} of {records.length} rules
            </span>
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
              <div className="space-y-1.5 p-2">
                {filtered.map((rec, idx) => {
                  const isActive = selectedId === rec.id;
                  const isUsed = usedRuleIds.has(rec.id);
                  const hasRun = rec.next_run_date !== null;
                  const dtLabel = demandTypes.find(d => d.id === rec.demand_type_id)?.label ?? '—';
                  const ownerName = owners.find(o => o.id === rec.object_owner_id)?.name ?? '—';
                  const freqLabel = frequencyCodeLabel(rec.generation_frequency_code ?? 1);
                  const demandAmt = rec.default_demand_amount;
                  const fp = rec.full_payment_spec;
                  const adv = rec.advance_spec;
                  const inst = rec.installment_spec;
                  const pens = rec.penalty_slabs ?? [];
                  const alert = rec.alert_spec;
                  const inc = rec.increase_spec;
                  const grid = rec.instalment_grid ?? [];
                  const excs = rec.collection_exceptions ?? [];
                  const activePenaltySlabs = pens.filter(s => s.penalty_value > 0);
                  const activeDiscounts = fp?.discount_slabs?.filter(d => d.discount_pct > 0 || d.discount_amount > 0) ?? [];
                  const srcKey = (rec.import_source ?? 'MANUAL') as string;
                  const accentBorder = srcKey === 'TPA' ? 'border-l-blue-400'
                    : srcKey === 'EXCEL' ? 'border-l-emerald-400'
                    : srcKey === 'AUTO' ? 'border-l-amber-400'
                    : 'border-l-slate-400';

                  const specChips: { label: string; cls: string }[] = [];
                  rec.available_payment_modes.forEach(m =>
                    specChips.push({ label: PAYMENT_MODE_LABELS[m], cls: 'bg-blue-50 text-blue-700' })
                  );
                  if (adv && adv.advance_value > 0)
                    specChips.push({ label: `Adv ${adv.advance_type === 'PERCENTAGE' ? `${adv.advance_value}%` : `Rs${adv.advance_value}`}`, cls: 'bg-amber-50 text-amber-700' });
                  if (inst && inst.installment_value > 0) {
                    const modeLabel = inst.instalment_mode === 'MANUAL_LINES' ? 'Manual' : 'Auto';
                    const lineCount = inst.instalment_lines?.length ?? 0;
                    specChips.push({ label: `Inst ${inst.installment_type === 'PERCENTAGE' ? `${inst.installment_value}%` : `Rs${inst.installment_value}`}${lineCount > 0 ? ` (${lineCount}L ${modeLabel})` : ''}`, cls: 'bg-violet-50 text-violet-700' });
                  }
                  if (activePenaltySlabs.length > 0)
                    specChips.push({ label: `Penalty ${activePenaltySlabs.length}`, cls: 'bg-red-50 text-red-700' });
                  if (activeDiscounts.length > 0)
                    specChips.push({ label: `Disc ${activeDiscounts.length}`, cls: 'bg-emerald-50 text-emerald-700' });
                  if (alert && alert.days_before_due > 0)
                    specChips.push({ label: `Alert ${alert.days_before_due}d`, cls: 'bg-sky-50 text-sky-700' });
                  if (inc && inc.increase_pct > 0)
                    specChips.push({ label: `Inc +${inc.increase_pct}%/${inc.increase_after_months}mo`, cls: 'bg-teal-50 text-teal-700' });
                  if (grid.length > 0)
                    specChips.push({ label: `Grid ${grid.length}`, cls: 'bg-indigo-50 text-indigo-700' });
                  if (excs.length > 0)
                    specChips.push({ label: `Exc ${excs.length}`, cls: 'bg-slate-100 text-slate-600' });

                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleSelect(rec)}
                      className={`grid grid-cols-12 items-center gap-2 px-3.5 py-2.5 min-h-[56px] w-full border border-slate-200 border-l-[3px] ${accentBorder} rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isActive ? 'ring-2 ring-emerald-400/40 border-emerald-400' : ''} ${isUsed ? 'opacity-75' : ''}`}
                    >
                      {/* Cols 1-2: Rule # & Status Badge */}
                      <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                        <div className="text-xs font-bold text-blue-700 tabular-nums leading-tight">R{String(rec.rule_number ?? idx + 1).padStart(3, '0')}</div>
                        <div className="mt-1">
                          {isUsed ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-px rounded-full">
                              <CheckCircle2 size={8} /> Used
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-px rounded-full">
                              Unused
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cols 3-4: Demand Type & Object/Owner */}
                      <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">Demand Type</div>
                        <div className="text-xs font-bold text-slate-800 leading-tight mt-0.5 truncate flex items-center gap-1">
                          {dtLabel}
                          {rec.include_gst && (
                            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-px rounded shrink-0">GST</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <Building2 size={9} className="shrink-0 text-slate-400" />
                          <span className="truncate">{rec.object_type ?? '—'} · {ownerName}</span>
                        </div>
                      </div>

                      {/* Cols 5-6: Default Amount & Frequency */}
                      <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">Default Amount</div>
                        <div className="text-xs font-bold text-slate-800 tabular-nums leading-tight mt-0.5">{fmtINR(demandAmt)}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{freqLabel}</div>
                      </div>

                      {/* Cols 7-8: Next Run Date & Spec Chips */}
                      <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">Next Run Date</div>
                        <div className="text-[11px] font-semibold text-slate-700 tabular-nums leading-tight mt-0.5 truncate">{hasRun ? fmtDate(rec.next_run_date) : 'No run yet'}</div>
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {specChips.slice(0, 3).map((c, i) => (
                            <span key={i} className={`text-[8px] font-semibold px-1 py-px rounded shrink-0 ${c.cls}`}>
                              {c.label}
                            </span>
                          ))}
                          {specChips.length > 3 && (
                            <span className="text-[8px] font-semibold text-slate-400 px-1">+{specChips.length - 3}</span>
                          )}
                        </div>
                      </div>

                      {/* Cols 9-10: Source Badge & Active Toggle */}
                      <div className="col-span-2 min-w-0 flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 w-fit ${SOURCE_BADGE[srcKey] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                          {srcKey}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 w-fit ${rec.is_active ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' : 'text-slate-400 bg-slate-50 border border-slate-200'}`}>
                          {rec.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      {/* Cols 11-12: Action Buttons */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {isUsed && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-px rounded shrink-0" title="Rule is locked because demands have been generated using it">
                            <Lock size={9} /> Locked
                          </span>
                        )}
                        {rec.is_active ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(rec.id, false); }}
                            disabled={togglingId === rec.id}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap disabled:opacity-40"
                            title="Disable this rule"
                          >
                            {togglingId === rec.id ? <Loader2 size={11} className="animate-spin" /> : <Power size={11} />}
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(rec.id, true); }}
                            disabled={togglingId === rec.id}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors whitespace-nowrap disabled:opacity-40"
                            title="Enable this rule"
                          >
                            {togglingId === rec.id ? <Loader2 size={11} className="animate-spin" /> : <Power size={11} />}
                            Enable
                          </button>
                        )}
                        {!isUsed && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                            className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
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
              {isLocked ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Lock size={13} className="text-amber-400" />
                  View Rule R{String(editing.rule_number).padStart(3, '0')} — Used (Read Only)
                </span>
              ) : (
                <span className="text-xs font-bold text-white">{editing ? `Edit Rule R${String(editing.rule_number).padStart(3, '0')}` : 'New Rule'}</span>
              )}
              <button
                onClick={() => { setShowNew(false); setEditing(null); setSelectedId(null); }}
                className="ml-auto p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <fieldset disabled={isLocked} className="flex-1 overflow-y-auto p-4 space-y-3 border-0 m-0">
              {isLocked && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-700 font-medium">
                  <Lock size={13} className="shrink-0" />
                  This rule has been used to generate demands and cannot be edited. You can only enable or disable it from the list.
                </div>
              )}
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
                        <span className="text-gray-500">Next Run Date: {fmtDate(computedNextRun)}</span>
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
              <Section title="Instalment Payment" icon={<Layers size={13} className="text-sky-500" />} defaultOpen>
                {/* Mode Toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex rounded-md border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, installment_spec: { ...form.installment_spec, instalment_mode: 'MANUAL_LINES' } })}
                      className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${form.installment_spec.instalment_mode === 'MANUAL_LINES' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      Specify Lines
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, installment_spec: { ...form.installment_spec, instalment_mode: 'AUTO_CALC' } })}
                      className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${form.installment_spec.instalment_mode === 'AUTO_CALC' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      Auto-Calculate
                    </button>
                  </div>
                </div>

                {/* Common fields: instalment type and value */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Field label="Instalment Type">
                    <select className={inputCls} value={form.installment_spec.installment_type} onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, installment_type: e.target.value as 'PERCENTAGE' | 'AMOUNT' } })}>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="AMOUNT">Exact Amount</option>
                    </select>
                  </Field>
                  <Field label="Instalment Value / Amount">
                    <input type="number" className={inputCls} value={form.installment_spec.installment_value} onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, installment_value: Number(e.target.value) } })} />
                  </Field>
                  <Field label="Reference Date">
                    <select className={inputCls} value={form.installment_spec.reference_date} onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, reference_date: e.target.value as ReferenceDateType } })}>
                      {ALL_REFERENCE_DATES.map((d) => (
                        <option key={d} value={d}>{REFERENCE_DATE_LABELS[d]}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Mode A: Manual Lines */}
                {form.installment_spec.instalment_mode === 'MANUAL_LINES' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={addInstalmentLine}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-semibold hover:bg-sky-100 transition-colors"
                      >
                        <Plus size={12} /> Add Line
                      </button>
                      <span className="text-[10px] text-slate-400">Define each instalment line with its own amount and due-date criteria.</span>
                    </div>
                    <div className="space-y-1.5">
                      {form.installment_spec.instalment_lines.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-2">No instalment lines defined. Click "Add Line" to start.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-14 gap-1.5 px-1 text-[9px] font-bold uppercase text-slate-400">
                            <span className="col-span-1">Seq</span>
                            <span className="col-span-2">Amount</span>
                            <span className="col-span-3">Due Date Reference</span>
                            <span className="col-span-2">Days Offset</span>
                            <span className="col-span-2">Int % (On Demand)</span>
                            <span className="col-span-2">Def Int % (On Outstanding)</span>
                            <span className="col-span-2"></span>
                          </div>
                          {form.installment_spec.instalment_lines.map((line, idx) => (
                            <div key={idx} className="grid grid-cols-14 gap-1.5 items-center">
                              <span className="col-span-1 text-[11px] font-bold text-slate-500 text-center">{line.seq}</span>
                              <input
                                type="number"
                                placeholder="Amount"
                                className={`${inputCls} col-span-2`}
                                value={line.amount}
                                onChange={(e) => updateInstalmentLine(idx, 'amount', Number(e.target.value))}
                              />
                              <select
                                className={`${inputCls} col-span-3`}
                                value={line.due_date_reference}
                                onChange={(e) => updateInstalmentLine(idx, 'due_date_reference', e.target.value)}
                              >
                                {ALL_REFERENCE_DATES.map((d) => (
                                  <option key={d} value={d}>{REFERENCE_DATE_LABELS[d]}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                placeholder="Days"
                                className={`${inputCls} col-span-2`}
                                value={line.days_offset}
                                onChange={(e) => updateInstalmentLine(idx, 'days_offset', Number(e.target.value))}
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Int %"
                                className={`${inputCls} col-span-2`}
                                value={line.interest_pct}
                                onChange={(e) => updateInstalmentLine(idx, 'interest_pct', Number(e.target.value))}
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Def %"
                                className={`${inputCls} col-span-2`}
                                value={line.defaulted_interest_pct}
                                onChange={(e) => updateInstalmentLine(idx, 'defaulted_interest_pct', Number(e.target.value))}
                              />
                              <button
                                type="button"
                                onClick={() => removeInstalmentLine(idx)}
                                className="col-span-2 flex items-center justify-center p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode B: Auto-Calculate */}
                {form.installment_spec.instalment_mode === 'AUTO_CALC' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Number of Instalments (blank = auto-calc)">
                        <input
                          type="number"
                          className={inputCls}
                          value={form.installment_spec.instalment_count ?? ''}
                          onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, instalment_count: e.target.value === '' ? null : Number(e.target.value) } })}
                          placeholder="Auto"
                        />
                      </Field>
                      <Field label="Initial Days Offset">
                        <input
                          type="number"
                          className={inputCls}
                          value={form.installment_spec.days_offset}
                          onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, days_offset: Number(e.target.value) } })}
                        />
                      </Field>
                      <Field label="Interval Days Between Instalments">
                        <input
                          type="number"
                          className={inputCls}
                          value={form.installment_spec.interval_days}
                          onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, interval_days: Number(e.target.value) } })}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Default Interest % (On Demand)">
                        <input
                          type="number"
                          step="0.01"
                          className={inputCls}
                          value={form.installment_spec.default_interest_pct}
                          onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, default_interest_pct: Number(e.target.value) } })}
                          placeholder="0.00"
                        />
                      </Field>
                      <Field label="Default Defaulted Interest % (On Outstanding)">
                        <input
                          type="number"
                          step="0.01"
                          className={inputCls}
                          value={form.installment_spec.default_defaulted_interest_pct}
                          onChange={(e) => setForm({ ...form, installment_spec: { ...form.installment_spec, default_defaulted_interest_pct: Number(e.target.value) } })}
                          placeholder="0.00"
                        />
                      </Field>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Instalment Count = (Default Demand Amount - Advance) / Instalment Amount, rounded up.
                      Any remainder is added to the last instalment.
                    </p>
                    <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5">
                      Standard Interest % applies to the specific Demand Amount. Defaulted Interest % applies as an additional rate on the Total Outstanding Amount if overdue.
                    </p>
                  </div>
                )}

                {/* Live Preview Panel */}
                {instalmentPreview.length > 0 && (
                  <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Instalment Preview ({instalmentPreview.length} lines)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                            <th className="px-2.5 py-1.5 text-left">Seq</th>
                            <th className="px-2.5 py-1.5 text-right">Amount</th>
                            <th className="px-2.5 py-1.5 text-left">Due Date Reference</th>
                            <th className="px-2.5 py-1.5 text-right">Days Offset</th>
                            <th className="px-2.5 py-1.5 text-right">Int % (On Demand)</th>
                            <th className="px-2.5 py-1.5 text-right">Def Int % (On Outstanding)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {instalmentPreview.map((line, idx) => {
                            const isLast = idx === instalmentPreview.length - 1;
                            const prevAmount = idx > 0 ? instalmentPreview[idx - 1].amount : line.amount;
                            const hasRemainder = isLast && idx > 0 && line.amount !== prevAmount;
                            return (
                              <tr key={idx} className={`border-b border-slate-50 ${isLast ? 'bg-amber-50/40' : ''}`}>
                                <td className="px-2.5 py-1.5 font-semibold text-slate-600">{line.seq}</td>
                                <td className="px-2.5 py-1.5 text-right font-semibold text-slate-700" title={fmtINR(line.amount)}>
                                  {fmtINR(line.amount)}
                                  {hasRemainder && <span className="ml-1 text-[9px] text-amber-600 font-bold">(incl. remainder)</span>}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-600" title={line.due_date_reference}>
                                  {REFERENCE_DATE_LABELS[line.due_date_reference as ReferenceDateType] ?? line.due_date_reference}
                                </td>
                                <td className="px-2.5 py-1.5 text-right text-slate-600">{line.days_offset} days</td>
                                <td className="px-2.5 py-1.5 text-right text-slate-600">{line.interest_pct?.toFixed(2) ?? '0.00'}%</td>
                                <td className="px-2.5 py-1.5 text-right text-slate-600">{line.defaulted_interest_pct?.toFixed(2) ?? '0.00'}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Section>

              {/* Penalty Slabs */}
              <Section title="Penalty Slabs Grid" icon={<Percent size={13} className="text-red-500" />}>
                <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 mb-3">
                  Standard Interest % applies to the specific Demand Amount. Defaulted Interest % applies as an additional rate on the Total Outstanding Amount if overdue.
                </p>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-6 gap-1.5 px-1 text-[9px] font-bold uppercase text-slate-400">
                    <span>Row</span>
                    <span>Penalty Type</span>
                    <span>Value</span>
                    <span>Late Days</span>
                    <span>Interest % (On Demand)</span>
                    <span>Defaulted Int % (On Outstanding)</span>
                  </div>
                  {form.penalty_slabs.map((slab, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-400">Row {slab.slab_row}</span>
                      <select className={inputCls} value={slab.penalty_type} onChange={(e) => updatePenaltySlab(idx, 'penalty_type', e.target.value)}>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="AMOUNT">Amount</option>
                      </select>
                      <input type="number" placeholder="Value" className={inputCls} value={slab.penalty_value} onChange={(e) => updatePenaltySlab(idx, 'penalty_value', Number(e.target.value))} />
                      <input type="number" placeholder="Late Days" className={inputCls} value={slab.late_days} onChange={(e) => updatePenaltySlab(idx, 'late_days', Number(e.target.value))} />
                      <input type="number" step="0.01" placeholder="Int %" className={inputCls} value={slab.interest_pct} onChange={(e) => updatePenaltySlab(idx, 'interest_pct', Number(e.target.value))} />
                      <input type="number" step="0.01" placeholder="Def Int %" className={inputCls} value={slab.defaulted_interest_pct} onChange={(e) => updatePenaltySlab(idx, 'defaulted_interest_pct', Number(e.target.value))} />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Interest % (On Demand) applies directly to the demand amount for the active period. Defaulted Interest % (On Outstanding) applies as an additional penalty on the total outstanding balance once overdue.
                </p>
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
            </fieldset>

            {/* Save bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50 shrink-0">
              {!isLocked && (
                <button
                  onClick={handleSave}
                  disabled={saving || !form.demand_type_id || !form.object_type}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {editing ? 'Update' : 'Create'} Rule
                </button>
              )}
              {isLocked && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600">
                  <Lock size={13} /> Editing disabled — rule in use
                </span>
              )}
              <button
                onClick={() => { setShowNew(false); setEditing(null); setSelectedId(null); }}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DCCRuleSetupPage;
