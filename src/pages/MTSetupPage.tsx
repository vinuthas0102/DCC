import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SlidersHorizontal, Plus, Search, Trash2, Save, X, ChevronDown,
  ChevronRight, Percent, IndianRupee, Calendar, AlertCircle, Loader2,
  CheckCircle2, Clock, Layers, Tag, Building2, MapPin, User,
} from 'lucide-react';
import { payableCriteriaService } from '../services/payableCriteriaService';
import { useAuthStore } from '../stores/authStore';
import type {
  PayableCriteria,
  PayableCriteriaInput,
  PayableTransactionType,
  PaymentMode,
  ReferenceDateType,
  DiscountSlabRow,
  PayablePenaltySlab,
} from '../types/payableCriteria';
import {
  PAYABLE_TRANSACTION_TYPES,
  PAYABLE_TRANSACTION_TYPE_LABELS,
  ALL_PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  ALL_REFERENCE_DATES,
  REFERENCE_DATE_LABELS,
} from '../types/payableCriteria';

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

const emptyInput = (): PayableCriteriaInput => ({
  dept: '',
  subdept: '',
  module_id: 'Quarter',
  location: '',
  grade_designation: '',
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
  import_source: null,
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
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        {icon}
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
};

// ── Field components ───────────────────────────────────────────────────────────
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
  'w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white text-gray-700 transition-colors';

// ── Main Page ──────────────────────────────────────────────────────────────────
export const MTSetupPage: React.FC = () => {
  const { user } = useAuthStore();
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

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await payableCriteriaService.listWithSpecs();
      setRecords(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load payable criteria');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterType !== 'ALL' && r.payable_transaction_type !== filterType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.dept.toLowerCase().includes(q) ||
        r.subdept.toLowerCase().includes(q) ||
        r.module_id.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.grade_designation.toLowerCase().includes(q) ||
        r.payable_transaction_type.toLowerCase().includes(q)
      );
    });
  }, [records, search, filterType]);

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
    } catch (e: any) {
      setError(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this payable criteria? This cannot be undone.')) return;
    try {
      await payableCriteriaService.remove(id);
      if (selectedId === id) {
        setSelectedId(null);
        setEditing(null);
      }
      await loadList();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete');
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

  const showForm = showNew || editing !== null;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <SlidersHorizontal size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900">MT Setup — Payable Criteria</h1>
          <p className="text-xs text-gray-500">Define and manage payable amount generation rules across all transaction types</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={14} /> New Criteria
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="flex-1 flex gap-3 p-4 min-h-0">
        {/* Left: List */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-w-0">
          {/* Filters */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by dept, module, location, grade…"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/20 bg-white"
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
              <div className="flex items-center justify-center py-20">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <SlidersHorizontal size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No payable criteria found</p>
                <p className="text-xs mt-1">Click "New Criteria" to create one</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((rec) => {
                  const isActive = selectedId === rec.id;
                  const hasRun = rec.next_run_date !== null;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleSelect(rec)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {rec.payable_transaction_type}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 truncate">{rec.dept}</span>
                          {rec.subdept && <span className="text-xs text-gray-400 truncate">/ {rec.subdept}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><Building2 size={11} />{rec.module_id}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} />{rec.location}</span>
                          <span className="flex items-center gap-1"><User size={11} />{rec.grade_designation}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                          <span className={`flex items-center gap-1 ${hasRun ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {hasRun ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                            {hasRun ? `Last run: ${fmtDate(rec.next_run_date)}` : 'No BTM run yet'}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{rec.available_payment_modes.length} payment mode{rec.available_payment_modes.length !== 1 ? 's' : ''}</span>
                          {rec.include_gst && (
                            <>
                              <span className="text-gray-400">·</span>
                              <span className="text-blue-600 font-medium">GST</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
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
          <div className="w-[480px] shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 shrink-0">
              <span className="text-sm font-bold text-white">{editing ? 'Edit Criteria' : 'New Criteria'}</span>
              <button
                onClick={() => { setShowNew(false); setEditing(null); setSelectedId(null); }}
                className="ml-auto p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Basic Info */}
              <Section title="Basic Info" icon={<Tag size={13} className="text-blue-500" />} defaultOpen>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Department" required>
                    <input className={inputCls} value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} placeholder="e.g. Estate Dept" />
                  </Field>
                  <Field label="Sub-Department">
                    <input className={inputCls} value={form.subdept} onChange={(e) => setForm({ ...form, subdept: e.target.value })} placeholder="e.g. Administration" />
                  </Field>
                  <Field label="Module ID" required>
                    <input className={inputCls} value={form.module_id} onChange={(e) => setForm({ ...form, module_id: e.target.value })} placeholder="e.g. Quarter, Facility" />
                  </Field>
                  <Field label="Location" required>
                    <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. HQ-Campus" />
                  </Field>
                  <Field label="Grade / Designation" required>
                    <input className={inputCls} value={form.grade_designation} onChange={(e) => setForm({ ...form, grade_designation: e.target.value })} placeholder="e.g. Grade-A or TP" />
                  </Field>
                  <Field label="Payable Transaction Type" required>
                    <select className={inputCls} value={form.payable_transaction_type} onChange={(e) => setForm({ ...form, payable_transaction_type: e.target.value as PayableTransactionType })}>
                      {PAYABLE_TRANSACTION_TYPES.map((t) => (
                        <option key={t} value={t}>{PAYABLE_TRANSACTION_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              {/* BTM Schedule */}
              <Section title="BTM Schedule" icon={<Calendar size={13} className="text-amber-500" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First BTM Run Date">
                    <input type="date" className={inputCls} value={form.first_btm_run_date ?? ''} onChange={(e) => setForm({ ...form, first_btm_run_date: e.target.value || null })} />
                  </Field>
                  <Field label="Subsequent BTM Run Day">
                    <select className={inputCls} value={form.subsequent_btm_run_day} onChange={(e) => setForm({ ...form, subsequent_btm_run_day: e.target.value })}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>Day {d}</option>
                      ))}
                      <option value="EOM">End of Month (EOM)</option>
                    </select>
                  </Field>
                  <Field label="Next Run Date">
                    <input type="date" className={inputCls} value={form.next_run_date ?? ''} onChange={(e) => setForm({ ...form, next_run_date: e.target.value || null })} />
                    <p className="text-[10px] text-gray-400 mt-1">Leave empty if no BTM run has been done yet (value = 0)</p>
                  </Field>
                </div>
              </Section>

              {/* Payment Modes & GST */}
              <Section title="Payment Modes & GST" icon={<IndianRupee size={13} className="text-emerald-500" />}>
                <Field label="Available Payment Modes" required>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PAYMENT_MODES.map((mode) => {
                      const sel = form.available_payment_modes.includes(mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => togglePaymentMode(mode)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                        >
                          {PAYMENT_MODE_LABELS[mode]}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.include_gst} onChange={(e) => setForm({ ...form, include_gst: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs font-semibold text-gray-700">Include GST</span>
                  </label>
                </div>
              </Section>

              {/* Full Payment Specs */}
              <Section title="Full Payment Specs" icon={<CheckCircle2 size={13} className="text-blue-500" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reference Date" required>
                    <select className={inputCls} value={form.full_payment_spec.reference_date} onChange={(e) => setForm({ ...form, full_payment_spec: { ...form.full_payment_spec, reference_date: e.target.value as ReferenceDateType } })}>
                      {ALL_REFERENCE_DATES.map((d) => (
                        <option key={d} value={d}>{REFERENCE_DATE_LABELS[d]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Days Offset (due date = ref + offset)">
                    <input type="number" className={inputCls} value={form.full_payment_spec.days_offset} onChange={(e) => setForm({ ...form, full_payment_spec: { ...form.full_payment_spec, days_offset: Number(e.target.value) } })} />
                  </Field>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Discount Slabs (up to 5 rows)</div>
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
                  <p className="text-[10px] text-gray-400 mt-2">Example: Allotted date, 45 days, (15 days, 2%), (30 days, 1%) → full payment within 45 days; 2% discount if paid within 15 days, 1% if within 30 days.</p>
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
              <Section title="Installment Payment" icon={<Layers size={13} className="text-sky-500" />}>
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
                <p className="text-[10px] text-gray-400"># of instalments is auto-calculated: (payable amount − advance) / instalment amount</p>
              </Section>

              {/* Penalty Slabs */}
              <Section title="Penalty Slabs" icon={<Percent size={13} className="text-red-500" />}>
                <div className="space-y-1.5">
                  {form.penalty_slabs.map((slab, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-gray-400">Row {slab.slab_row}</span>
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
              <Section title="Alert Criteria" icon={<AlertCircle size={13} className="text-amber-500" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Days Before Due Date">
                    <input type="number" className={inputCls} value={form.alert_spec.days_before_due} onChange={(e) => setForm({ ...form, alert_spec: { ...form.alert_spec, days_before_due: Number(e.target.value) } })} />
                  </Field>
                  <Field label="Message Hook #">
                    <input className={inputCls} value={form.alert_spec.message_hook} onChange={(e) => setForm({ ...form, alert_spec: { ...form.alert_spec, message_hook: e.target.value } })} placeholder="e.g. HOOK_PAYABLE_DUE_REMINDER" />
                  </Field>
                </div>
              </Section>

              {/* Active toggle */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs font-semibold text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Save bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !form.dept.trim() || !form.module_id.trim() || !form.location.trim() || !form.grade_designation.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editing ? 'Update' : 'Create'} Criteria
              </button>
              <button
                onClick={() => { setShowNew(false); setEditing(null); setSelectedId(null); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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

export default MTSetupPage;
