import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Loader2, AlertTriangle, FileText, Users, CheckCircle2,
  Calendar, ChevronDown, ChevronUp, Clock, Plus, Trash2, Pause, Play,
  X, Filter, Zap, List, Settings2,
} from 'lucide-react';
import { dccService } from '../../services/dccService';
import type {
  DccReportRow, DccOwnerReportRow, DccTile, DccDemandType, DccObjectOwner,
  DccDemandFilters, DccDemandStatus, DccReportType, DccReportRecurrence,
  DccReportSchedule, DccReportScheduleInput,
} from '../../types/dcc';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtINRShort = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (d: string) => {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const STATUS_OPTIONS: { value: DccDemandStatus; label: string }[] = [
  { value: 'DUE', label: 'Due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
  { value: 'EXEMPTED', label: 'Exempted' },
];

const REPORT_TYPES: { key: DccReportType; label: string; icon: typeof FileText; desc: string }[] = [
  { key: 'by_type', label: 'By Demand Type', icon: FileText, desc: 'Aggregate totals grouped by demand type' },
  { key: 'by_owner', label: 'By Owner', icon: Users, desc: 'Collection breakdown per object owner' },
  { key: 'overdue', label: 'Overdue Exceptions', icon: AlertTriangle, desc: 'Only demands past their due date' },
  { key: 'detailed', label: 'Detailed Ledger', icon: List, desc: 'Row-by-row demand ledger with all fields' },
];

const RECURRENCE_OPTIONS: { value: DccReportRecurrence; label: string }[] = [
  { value: 'one-time', label: 'One-Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

// ── Criteria state ─────────────────────────────────────────────────────────────
interface ReportCriteria {
  reportType: DccReportType;
  runDateFrom: string;
  runDateTo: string;
  payDateFrom: string;
  payDateTo: string;
  demandTypeCode: string;
  objectType: string;
  ownerId: string;
  status: DccDemandStatus | '';
}

const defaultCriteria: ReportCriteria = {
  reportType: 'by_type',
  runDateFrom: '',
  runDateTo: '',
  payDateFrom: '',
  payDateTo: '',
  demandTypeCode: '',
  objectType: '',
  ownerId: '',
  status: '',
};

function criteriaToFilters(c: ReportCriteria): DccDemandFilters {
  const f: DccDemandFilters = {};
  if (c.runDateFrom) f.run_date_from = c.runDateFrom;
  if (c.runDateTo) f.run_date_to = c.runDateTo;
  if (c.payDateFrom) f.payment_date_from = c.payDateFrom;
  if (c.payDateTo) f.payment_date_to = c.payDateTo;
  if (c.demandTypeCode) f.demand_type_code = c.demandTypeCode;
  if (c.ownerId) f.owner_id = c.ownerId;
  if (c.status) f.status = c.status;
  return f;
}

// ── Field components ───────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-500 transition-colors';

// ── Schedule modal ──────────────────────────────────────────────────────────────
const ScheduleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  criteria: ReportCriteria;
  onSaved: () => void;
}> = ({ isOpen, onClose, criteria, onSaved }) => {
  const [name, setName] = useState('');
  const [recurrence, setRecurrence] = useState<DccReportRecurrence>('one-time');
  const [runDate, setRunDate] = useState('');
  const [runTime, setRunTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setRecurrence('one-time');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setRunDate(tomorrow.toISOString().slice(0, 10));
      setRunTime('09:00');
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a report name'); return; }
    if (!runDate) { setError('Please select a date'); return; }
    setSaving(true);
    setError(null);
    try {
      const nextRunAt = new Date(`${runDate}T${runTime}:00`).toISOString();
      const input: DccReportScheduleInput = {
        name: name.trim(),
        report_type: criteria.reportType,
        criteria: criteriaToFilters(criteria),
        recurrence,
        next_run_at: nextRunAt,
      };
      await dccService.createSchedule(input);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-800">
          <Clock size={16} className="text-white" />
          <span className="text-sm font-bold text-white">Schedule Report</span>
          <button onClick={onClose} className="ml-auto p-1 text-white/70 hover:text-white rounded transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700">
              <AlertTriangle size={13} /> {error}
            </div>
          )}
          <Field label="Report Name *">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Property Tax Report" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Recurrence">
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as DccReportRecurrence)} className={inputCls}>
                {RECURRENCE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Report Type">
              <div className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md">
                {REPORT_TYPES.find((r) => r.key === criteria.reportType)?.label ?? criteria.reportType}
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Run Date *">
              <input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Run Time">
              <input type="time" value={runTime} onChange={(e) => setRunTime(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700 mb-1">Criteria Summary</p>
            <p className="text-[11px] text-slate-600">
              {criteria.runDateFrom && `Run: ${criteria.runDateFrom}→${criteria.runDateTo || '…'}`}
              {criteria.demandTypeCode && ` · ${criteria.demandTypeCode}`}
              {criteria.status && ` · ${criteria.status}`}
              {criteria.ownerId && ' · Owner filtered'}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Scheduled reports list ──────────────────────────────────────────────────────
const ScheduledReportsList: React.FC<{
  schedules: DccReportSchedule[];
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}> = ({ schedules, onToggle, onDelete }) => {
  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400">
        <Clock size={24} className="mb-1.5 opacity-30" />
        <p className="text-xs font-medium">No scheduled reports</p>
        <p className="text-[11px] mt-0.5">Click "Schedule Report" to create one</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {schedules.map((s) => {
        const rt = REPORT_TYPES.find((r) => r.key === s.report_type);
        return (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.is_active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
              <Clock size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">{s.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{s.recurrence}</span>
                {!s.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Paused</span>}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span>{rt?.label ?? s.report_type}</span>
                <span>·</span>
                <span>Next: {fmtDateTime(s.next_run_at)}</span>
                {s.last_run_at && (
                  <>
                    <span>·</span>
                    <span>Last: {fmtDate(s.last_run_at)}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => onToggle(s.id, !s.is_active)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              title={s.is_active ? 'Pause' : 'Resume'}
            >
              {s.is_active ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              onClick={() => onDelete(s.id)}
              className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Result tables ───────────────────────────────────────────────────────────────
const ByTypeTable: React.FC<{ rows: DccReportRow[] }> = ({ rows }) => (
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Demand Type</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Count</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Total Demand</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Collected</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Outstanding</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Overdue</th>
          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase text-slate-500">Rate</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-xs font-semibold text-slate-900">{r.demand_type_label}</td>
            <td className="px-3 py-2 text-xs text-right text-slate-600">{r.demand_count}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-slate-900">{fmtINR(r.total_demand)}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-emerald-700">{fmtINR(r.total_collected)}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-amber-700">{fmtINR(r.total_outstanding)}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-red-700">{fmtINR(r.overdue_amount)}</td>
            <td className="px-3 py-2 text-center">
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                r.collection_rate >= 75 ? 'bg-emerald-50 text-emerald-700' :
                r.collection_rate >= 50 ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              }`}>{r.collection_rate}%</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ByOwnerTable: React.FC<{ rows: DccOwnerReportRow[] }> = ({ rows }) => (
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Owner</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Demands</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Total Demand</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Collected</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Outstanding</th>
          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Overdue</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-xs font-semibold text-slate-900">{r.owner_name}</td>
            <td className="px-3 py-2 text-xs text-right text-slate-600">{r.demand_count}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-slate-900">{fmtINR(r.total_demand)}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-emerald-700">{fmtINR(r.total_collected)}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-amber-700">{fmtINR(r.total_outstanding)}</td>
            <td className="px-3 py-2 text-xs text-right font-semibold text-red-700">{fmtINR(r.overdue_amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DetailedTable: React.FC<{ rows: DccTile[] }> = ({ rows }) => (
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Object Ref</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Owner</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Demand Type</th>
            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Total</th>
            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Paid</th>
            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Due</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Due Date</th>
            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((t, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 text-xs font-semibold text-slate-900">{t.object_ref}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{t.owner_name}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{t.demand_type_label}</td>
              <td className="px-3 py-2 text-xs text-right font-semibold text-slate-900">{fmtINRShort(t.total_amount)}</td>
              <td className="px-3 py-2 text-xs text-right font-semibold text-emerald-700">{fmtINRShort(t.amount_paid)}</td>
              <td className="px-3 py-2 text-xs text-right font-semibold text-amber-700">{fmtINRShort(t.amount_due)}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{fmtDate(t.due_date)}</td>
              <td className="px-3 py-2 text-center">
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  t.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                  t.status === 'OVERDUE' ? 'bg-red-50 text-red-700' :
                  t.status === 'EXEMPTED' ? 'bg-slate-100 text-slate-500' :
                  'bg-amber-50 text-amber-700'
                }`}>{t.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────────
export const DCCReportsTab: React.FC = () => {
  const [criteria, setCriteria] = useState<ReportCriteria>(defaultCriteria);
  const [criteriaOpen, setCriteriaOpen] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result data
  const [byTypeRows, setByTypeRows] = useState<DccReportRow[]>([]);
  const [byOwnerRows, setByOwnerRows] = useState<DccOwnerReportRow[]>([]);
  const [detailedRows, setDetailedRows] = useState<DccTile[]>([]);

  // Reference data
  const [demandTypes, setDemandTypes] = useState<DccDemandType[]>([]);
  const [owners, setOwners] = useState<DccObjectOwner[]>([]);
  const [objectTypes, setObjectTypes] = useState<string[]>([]);

  // Schedules
  const [schedules, setSchedules] = useState<DccReportSchedule[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Load reference data
  useEffect(() => {
    (async () => {
      try {
        const [dt, ow, objs] = await Promise.all([
          dccService.listDemandTypes(),
          dccService.listObjectOwners(),
          dccService.listObjects(),
        ]);
        setDemandTypes(dt);
        setOwners(ow);
        const types = new Set<string>();
        objs.forEach((o) => { if (o.object_type) types.add(o.object_type); });
        setObjectTypes(Array.from(types).sort());
      } catch (e) {
        // silently fail — reference data will be empty
      }
    })();
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      const s = await dccService.listSchedules();
      setSchedules(s);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const activeCriteriaCount = useMemo(() => {
    let n = 0;
    if (criteria.runDateFrom || criteria.runDateTo) n++;
    if (criteria.payDateFrom || criteria.payDateTo) n++;
    if (criteria.demandTypeCode) n++;
    if (criteria.objectType) n++;
    if (criteria.ownerId) n++;
    if (criteria.status) n++;
    return n;
  }, [criteria]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGenerated(true);
    try {
      const filters = criteriaToFilters(criteria);
      if (criteria.reportType === 'by_type') {
        const rows = await dccService.getReportByDemandType(filters);
        setByTypeRows(rows);
      } else if (criteria.reportType === 'by_owner') {
        const rows = await dccService.getReportByOwner(filters);
        setByOwnerRows(rows);
      } else if (criteria.reportType === 'overdue') {
        const rows = await dccService.getReportByOwner({ ...filters, status: 'OVERDUE' });
        setByOwnerRows(rows.filter((r) => r.overdue_count > 0));
      } else if (criteria.reportType === 'detailed') {
        const rows = await dccService.getDetailedLedger(filters);
        setDetailedRows(rows);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCriteria(defaultCriteria);
    setGenerated(false);
    setError(null);
  };

  const handleExport = () => {
    let title = '';
    let headers: string[] = [];
    let rows: string[][] = [];

    if (criteria.reportType === 'by_type') {
      title = 'MIS Report — By Demand Type';
      headers = ['Demand Type', 'Count', 'Total Demand', 'Collected', 'Outstanding', 'Overdue Amt', 'Collection Rate'];
      rows = byTypeRows.map((r) => [
        r.demand_type_label, String(r.demand_count), fmtINR(r.total_demand),
        fmtINR(r.total_collected), fmtINR(r.total_outstanding), fmtINR(r.overdue_amount),
        `${r.collection_rate}%`,
      ]);
    } else if (criteria.reportType === 'by_owner' || criteria.reportType === 'overdue') {
      title = criteria.reportType === 'overdue'
        ? 'Exception Report — Overdue Demands'
        : 'MIS Report — By Owner';
      headers = ['Owner', 'Demands', 'Total Demand', 'Collected', 'Outstanding', 'Overdue Amt'];
      rows = byOwnerRows.map((r) => [
        r.owner_name, String(r.demand_count), fmtINR(r.total_demand),
        fmtINR(r.total_collected), fmtINR(r.total_outstanding), fmtINR(r.overdue_amount),
      ]);
    } else {
      title = 'Detailed Demand Ledger';
      headers = ['Object Ref', 'Owner', 'Demand Type', 'Total', 'Paid', 'Due', 'Due Date', 'Status'];
      rows = detailedRows.map((t) => [
        t.object_ref, t.owner_name, t.demand_type_label,
        fmtINR(t.total_amount), fmtINR(t.amount_paid), fmtINR(t.amount_due),
        fmtDate(t.due_date), t.status,
      ]);
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:sans-serif;font-size:13px;color:#1f2937;margin:32px}h2{margin:0 0 4px}p{margin:2px 0;color:#6b7280;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #f3f4f6}</style></head>
    <body><h2>${title}</h2><p>Generated: ${new Date().toLocaleString('en-IN')}</p>
    <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleToggleSchedule = async (id: string, active: boolean) => {
    try {
      await dccService.updateSchedule(id, { is_active: active });
      await loadSchedules();
    } catch {
      // ignore
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await dccService.deleteSchedule(id);
      await loadSchedules();
    } catch {
      // ignore
    }
  };

  const currentReportType = REPORT_TYPES.find((r) => r.key === criteria.reportType);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-2.5 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setCriteriaOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
        >
          <Filter size={12} /> Criteria
          {activeCriteriaCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
              {activeCriteriaCount}
            </span>
          )}
          {criteriaOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <Clock size={12} /> Schedule Report
        </button>
        {generated && (
          <button
            onClick={handleExport}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-700 text-white text-[11px] font-semibold hover:bg-blue-800 transition-colors"
          >
            <Download size={12} /> Export
          </button>
        )}
      </div>

      {/* Criteria panel */}
      <AnimatePresence>
        {criteriaOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden shrink-0"
          >
            <div className="mx-4 mb-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {/* Report type selector */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 size={13} className="text-blue-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">Report Type</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {REPORT_TYPES.map((rt) => {
                    const Icon = rt.icon;
                    const active = criteria.reportType === rt.key;
                    return (
                      <button
                        key={rt.key}
                        onClick={() => setCriteria({ ...criteria, reportType: rt.key })}
                        className={`text-left rounded-lg border-2 p-2.5 transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon size={14} className={active ? 'text-blue-600' : 'text-slate-400'} />
                          <span className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{rt.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{rt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter fields */}
              <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Field label="Run Date From">
                  <input type="date" value={criteria.runDateFrom} onChange={(e) => setCriteria({ ...criteria, runDateFrom: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Run Date To">
                  <input type="date" value={criteria.runDateTo} onChange={(e) => setCriteria({ ...criteria, runDateTo: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Payment Date From">
                  <input type="date" value={criteria.payDateFrom} onChange={(e) => setCriteria({ ...criteria, payDateFrom: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Payment Date To">
                  <input type="date" value={criteria.payDateTo} onChange={(e) => setCriteria({ ...criteria, payDateTo: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Demand Type">
                  <select value={criteria.demandTypeCode} onChange={(e) => setCriteria({ ...criteria, demandTypeCode: e.target.value })} className={inputCls}>
                    <option value="">All Types</option>
                    {demandTypes.map((dt) => <option key={dt.id} value={dt.code}>{dt.label}</option>)}
                  </select>
                </Field>
                <Field label="Object Type">
                  <select value={criteria.objectType} onChange={(e) => setCriteria({ ...criteria, objectType: e.target.value })} className={inputCls}>
                    <option value="">All Objects</option>
                    {objectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Owner">
                  <select value={criteria.ownerId} onChange={(e) => setCriteria({ ...criteria, ownerId: e.target.value })} className={inputCls}>
                    <option value="">All Owners</option>
                    {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={criteria.status} onChange={(e) => setCriteria({ ...criteria, status: e.target.value as DccDemandStatus | '' })} className={inputCls}>
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
              </div>

              {/* Action buttons */}
              <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-40 transition-colors"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                  {loading ? 'Generating…' : 'Generate Report'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Reset Criteria
                </button>
                {currentReportType && (
                  <span className="ml-auto text-[10px] text-slate-400">{currentReportType.desc}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle size={28} className="mb-2" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : !generated ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText size={32} className="mb-2 opacity-30" />
            <p className="text-sm font-medium text-slate-600">No report generated yet</p>
            <p className="text-xs mt-1">Select your criteria above and click "Generate Report"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Result header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{currentReportType?.label}</span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-500">
                {criteria.reportType === 'by_type' && `${byTypeRows.length} demand type${byTypeRows.length !== 1 ? 's' : ''}`}
                {(criteria.reportType === 'by_owner' || criteria.reportType === 'overdue') && `${byOwnerRows.length} owner${byOwnerRows.length !== 1 ? 's' : ''}`}
                {criteria.reportType === 'detailed' && `${detailedRows.length} record${detailedRows.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Result tables */}
            {criteria.reportType === 'by_type' && (
              byTypeRows.length === 0
                ? <EmptyResults />
                : <ByTypeTable rows={byTypeRows} />
            )}
            {(criteria.reportType === 'by_owner' || criteria.reportType === 'overdue') && (
              byOwnerRows.length === 0
                ? <EmptyResults />
                : <ByOwnerTable rows={byOwnerRows} />
            )}
            {criteria.reportType === 'detailed' && (
              detailedRows.length === 0
                ? <EmptyResults />
                : <DetailedTable rows={detailedRows} />
            )}

            {/* Scheduled reports section */}
            <div className="mt-4 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <Clock size={14} className="text-blue-600" />
                <h3 className="text-xs font-bold text-slate-700">Scheduled Reports</h3>
                <span className="ml-auto text-[10px] text-slate-400">{schedules.length} schedule{schedules.length !== 1 ? 's' : ''}</span>
              </div>
              <ScheduledReportsList
                schedules={schedules}
                onToggle={handleToggleSchedule}
                onDelete={handleDeleteSchedule}
              />
            </div>
          </div>
        )}
      </div>

      {/* Schedule modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        criteria={criteria}
        onSaved={loadSchedules}
      />
    </div>
  );
};

const EmptyResults: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <CheckCircle2 size={28} className="mb-2 text-emerald-400" />
    <span className="text-sm">No records match the selected criteria</span>
    <span className="text-xs mt-1">Try adjusting your filters and regenerate</span>
  </div>
);

export default DCCReportsTab;
