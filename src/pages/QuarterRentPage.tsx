import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home, ChevronRight, IndianRupee, Building2,
  Phone, User, MapPin, Calendar, CheckCircle2, AlertTriangle,
  Clock, Receipt, TrendingUp, Send, ChevronDown,
  BarChart2, LayoutGrid, CreditCard, TableProperties,
  MessageSquare, Eye, Wallet, Undo2, Search, X,
  Download, MoreVertical, Shield, Wrench, Zap, Layers,
  Plus, Percent, FileText, ChevronUp, BarChart, CheckSquare, ClipboardList, Tag,
  SlidersHorizontal, CalendarDays, Share2,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { quartersService } from '../services/quartersService';
import type {
  RentTile, RentDueDetail, RentPayment, RentClarification, RentTrackerSummary,
  InstallmentPlan, InstallmentRow,
} from '../services/quartersService';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import SplitLayout from '../components/ui/SplitLayout';
import { LogDetailsModal } from '../components/ui/LogDetailsModal';
import type { LogEntry } from '../components/ui/LogDetailsModal';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { ChatDeliveryModePicker } from '../components/ui/ChatDeliveryModePicker';
import type { ChatDeliveryMode } from '../types/quarters';
import { useAuthStore } from '../stores/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};
const fmtMonthFull = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

type StatusKey = RentTile['status'];
const STATUS: Record<StatusKey, { label: string; bg: string; text: string; border: string; dot: string }> = {
  DUE:      { label: 'Due',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400' },
  OVERDUE:  { label: 'Overdue',  bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
  PAID:     { label: 'Paid',     bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  EXEMPTED: { label: 'Exempted', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
};
const STATUS_LEFT: Record<StatusKey, string> = {
  DUE: 'bg-amber-400', OVERDUE: 'bg-red-500', PAID: 'bg-emerald-500', EXEMPTED: 'bg-slate-300',
};
const PAYMENT_MODES = ['ALL','ONLINE','CHEQUE','DD','CASH','AUTO_DEDUCTION','EXEMPTED'] as const;

// ── Show Due Payment Modal (tabbed: Due Summary + Installment Plan) ───────────
interface DueDetailsModalProps {
  tile: RentTile; detail: RentDueDetail; isEO: boolean;
  penaltyMaxDiscountPct: number;
  dpFilter: DpFilter;
  initialTab?: 'summary' | 'installment' | 'monthly';
  onClose: () => void; onSave: (override: number, remarks: string) => Promise<void>;
  onPayInstallment?: (planId: string, rowId: string, amount: number) => void;
  onPaySelected?: (amount: number) => void;
}
const DueDetailsModal: React.FC<DueDetailsModalProps> = ({ tile, detail, isEO, penaltyMaxDiscountPct, dpFilter, initialTab, onClose, onSave, onPayInstallment, onPaySelected }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'installment' | 'monthly'>(initialTab ?? 'summary');
  const [selectedMonthSls, setSelectedMonthSls] = useState<Set<number>>(new Set());
  const [seqWarning, setSeqWarning] = useState<string | null>(null);

  // ── Summary tab state ──────────────────────────────────────────────────────
  const [discountPct, setDiscountPct] = useState(0);
  const [remarks, setRemarks] = useState(detail.eo_remarks ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const penaltyBase = detail.penalty_amount;
  const discountAmt = Math.round(penaltyBase * discountPct / 100);
  const effectivePenalty = Math.max(0, penaltyBase - discountAmt);
  const overrideChanged = discountPct > 0;
  const canSave = !overrideChanged || remarks.trim().length > 0;
  const hasOverrideActive = detail.penalty_override !== null && detail.penalty_override < detail.penalty_amount;

  const subtotal = detail.base_rent + detail.water_charges
    + (tile.sd_amount ?? 0) + (tile.advance_amount ?? 0) + (tile.maintenance_charge ?? 0);
  const net = subtotal + effectivePenalty - detail.waiver_amount;
  const fullPaymentDiscount = detail.discount_full_payment_pct
    ? Math.round(net * detail.discount_full_payment_pct / 100)
    : 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave(effectivePenalty, remarks.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1400);
  };

  const downloadDueStatement = () => {
    const rows = detail.monthly_dues ?? [];
    const totalOutstanding = rows.filter(r => r.isPending).reduce((s, r) => s + r.due, 0);
    const tableRows = rows.map((r, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f9fafb';
      const dueCell = r.isPending ? `<td style="text-align:right;font-weight:700;color:#b45309">${r.due.toLocaleString('en-IN')}</td>` : `<td style="text-align:right;color:#059669">—</td>`;
      return `<tr style="background:${bg}">
        <td style="text-align:center">${i + 1}</td>
        <td>${r.date}</td>
        <td style="text-align:right">${r.rent.toLocaleString('en-IN')}</td>
        <td style="text-align:right">${r.waterCharges > 0 ? r.waterCharges.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align:right;color:#1d4ed8">${r.electricityCharges > 0 ? r.electricityCharges.toLocaleString('en-IN') : '-'}</td>
        <td style="text-align:right;color:#dc2626">${r.penalty > 0 ? r.penalty.toLocaleString('en-IN') : ''}</td>
        <td style="text-align:right">${r.maintenance > 0 ? r.maintenance.toLocaleString('en-IN') : '0'}</td>
        <td style="text-align:right;font-weight:700">${r.total.toLocaleString('en-IN')}</td>
        ${dueCell}
        <td><span style="padding:2px 8px;border-radius:9999px;font-size:11px;background:${r.statusColor?.includes('emerald') ? '#d1fae5' : r.statusColor?.includes('red') ? '#fee2e2' : '#fef3c7'};color:${r.statusColor?.includes('emerald') ? '#065f46' : r.statusColor?.includes('red') ? '#991b1b' : '#92400e'}">${r.statusLabel}</span></td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Due Statement — ${tile.quarter_number}</title>
    <style>body{font-family:sans-serif;font-size:13px;color:#1f2937;margin:32px}h2{margin:0 0 4px}p{margin:2px 0;color:#6b7280;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0f766e;color:#fff;padding:8px 10px;text-align:left;font-size:12px;white-space:nowrap}td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:12px}.footer{margin-top:12px;text-align:right;font-weight:700;font-size:14px;color:#b45309}</style></head>
    <body><h2>Due Statement — ${tile.quarter_number} (${tile.bhk_config})</h2>
    <p>Tenant: ${tile.tenant_name} &bull; ${tile.tenant_designation} &bull; ${tile.tenant_dept}</p>
    <p>Location: ${tile.block_name}, ${tile.location_area} &bull; Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
    <table><thead><tr><th>Sl No</th><th>Month</th><th>Rent</th><th>Water</th><th>Electricity</th><th>Penalty</th><th>Maintenance</th><th>Total</th><th>Due Amount</th><th>Status</th></tr></thead>
    <tbody>${tableRows}</tbody></table>
    <div class="footer">Total Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}</div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Due_Statement_${tile.quarter_number}_${tile.tenant_id}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shareDueStatement = async () => {
    const rows = detail.monthly_dues ?? [];
    const totalOutstanding = rows.filter(r => r.isPending).reduce((s, r) => s + r.due, 0);
    const pendingCount = rows.filter(r => r.isPending).length;
    const text = `Due Statement — ${tile.quarter_number} (${tile.bhk_config})\nTenant: ${tile.tenant_name}\nLocation: ${tile.block_name}, ${tile.location_area}\nPending Months: ${pendingCount}\nTotal Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}`;
    if (navigator.share) {
      await navigator.share({ title: `Due Statement — ${tile.quarter_number}`, text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  // ── Installment plan state ─────────────────────────────────────────────────
  const [plan, setPlan] = useState<InstallmentPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planMode, setPlanMode] = useState<'view' | 'setup'>('setup');
  const [filterInstalment, setFilterInstalment] = useState<number | 'all'>('all');
  // Setup form state
  const [startDate, setStartDate] = useState('');
  const [lateFee, setLateFee] = useState('0.00');
  const [dueDaysLate, setDueDaysLate] = useState('0');
  const [interestPct, setInterestPct] = useState('0.00');
  const [discountFullPct, setDiscountFullPct] = useState('0.00');
  const [gstPct, setGstPct] = useState('0.00');
  const [gstType, setGstType] = useState<'inclusive' | 'exclusive'>('inclusive');
  const [numInstals, setNumInstals] = useState(3);
  const [instalRows, setInstalRows] = useState<{ percentage: string; amount: string; due_date: string }[]>([]);
  const [planSaving, setPlanSaving] = useState(false);

  const balancePayment = tile.total_due;

  // Build instalment rows array when numInstals changes
  useEffect(() => {
    setInstalRows(Array.from({ length: numInstals }, (_, i) => {
      const existing = instalRows[i];
      const equalPct = (100 / numInstals).toFixed(2);
      const equalAmt = (balancePayment / numInstals).toFixed(2);
      return {
        percentage: existing?.percentage ?? equalPct,
        amount: existing?.amount ?? equalAmt,
        due_date: existing?.due_date ?? '',
      };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numInstals]);

  // Load plan when switching to installment tab
  useEffect(() => {
    if (activeTab !== 'installment') return;
    setPlanLoading(true);
    quartersService.getInstallmentPlan(tile.allotment_id, tile.month).then(p => {
      if (p) { setPlan(p); setPlanMode('view'); }
      else   { setPlan(null); setPlanMode('setup'); }
      setPlanLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const updateRow = (i: number, field: keyof typeof instalRows[0], val: string) => {
    setInstalRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };

  const totalPct = instalRows.reduce((s, r) => s + (parseFloat(r.percentage) || 0), 0);
  const totalAmt = instalRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const handleCreatePlan = async () => {
    if (!startDate) return;
    setPlanSaving(true);
    try {
      const config = {
        installment_start_date: startDate || null,
        late_fee: parseFloat(lateFee) || 0,
        due_days_with_late_fee: parseInt(dueDaysLate) || 0,
        interest_pct_pa: parseFloat(interestPct) || 0,
        discount_full_payment_pct: parseFloat(discountFullPct) || 0,
        gst_pct: parseFloat(gstPct) || 0,
        gst_type: gstType,
        balance_payment: balancePayment,
        no_of_installments: numInstals,
      };
      const rows: Pick<InstallmentRow,'row_number'|'label'|'percentage'|'amount'|'due_date'>[] = [
        { row_number: 0, label: 'Full Payment', percentage: 100, amount: balancePayment, due_date: startDate || null },
        ...instalRows.map((r, i) => ({
          row_number: i + 1,
          label: `${i + 1}${['st','nd','rd'][i] ?? 'th'} Installment`,
          percentage: parseFloat(r.percentage) || 0,
          amount: parseFloat(r.amount) || 0,
          due_date: r.due_date || null,
        })),
      ];
      const created = await quartersService.createInstallmentPlan(tile.allotment_id, tile.month, config, rows);
      setPlan(created); setPlanMode('view');
    } finally {
      setPlanSaving(false);
    }
  };

  const INSTALMENT_STATUS: Record<string, { bg: string; text: string }> = {
    PAID:    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    DUE:     { bg: 'bg-amber-100',   text: 'text-amber-700'   },
    PENDING: { bg: 'bg-gray-100',    text: 'text-gray-500'    },
    OVERDUE: { bg: 'bg-red-100',     text: 'text-red-700'     },
  };

  const visibleRows = plan
    ? (filterInstalment === 'all'
        ? plan.rows
        : plan.rows.filter(r => r.row_number === 0 || r.row_number === filterInstalment))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh] min-h-[70vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <IndianRupee size={16} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">Due Payment — {tile.quarter_number}</span>
              <span className="text-gray-300 select-none">·</span>
              <span className="text-xs text-gray-500 font-medium">{tile.tenant_name}</span>
              <span className="text-gray-300 select-none">·</span>
              <span className="text-xs text-gray-400">{fmtMonthFull(tile.month)}</span>
              <StatusBadge status={tile.status} />
            </div>
          </div>
          <button onClick={downloadDueStatement} title="Download PDF" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors" aria-label="Download statement">
            <Download size={15} />
          </button>
          <button onClick={shareDueStatement} title="Share" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors" aria-label="Share statement">
            <Share2 size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── Summary header ── */}
        {(() => {
          const posDate = tile.possession_date ?? tile.allotment_date;
          const pendingSince = posDate
            ? new Date(posDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
            : '—';
          const combinedOutstanding = detail.monthly_dues && detail.monthly_dues.length > 0
            ? detail.monthly_dues.reduce((s, d) => s + d.due, 0)
            : tile.total_due;
          const pendingMonthCount = detail.monthly_dues?.filter(d => d.isPending).length ?? 0;
          return (
            <div className="shrink-0 border-b border-gray-100 bg-gray-50/60 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-amber-100 px-3 py-2.5 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total Outstanding</span>
                <span className="text-xl font-extrabold text-amber-700 leading-tight">{fmtINR(combinedOutstanding)}</span>
                <span className="text-[10px] text-gray-400">{pendingMonthCount > 0 ? `Across ${pendingMonthCount} pending month${pendingMonthCount !== 1 ? 's' : ''}` : tile.amount_paid > 0 ? `${fmtINR(tile.amount_paid)} collected` : 'Nothing collected yet'}</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Last Paid</span>
                {tile.last_paid_date ? (
                  <>
                    <span className="text-base font-bold text-emerald-700 leading-tight">{fmtINR(tile.last_paid_amount ?? 0)}</span>
                    <span className="text-[10px] text-gray-400">{fmtDate(tile.last_paid_date)}</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-gray-400 mt-1">—</span>
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Pending Since</span>
                <span className="text-base font-bold text-gray-800 leading-tight">{pendingSince}</span>
                <span className="text-[10px] text-gray-400">{posDate ? `Occupied ${fmtDate(posDate)}` : 'No possession date'}</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Due Date</span>
                {tile.status === 'OVERDUE' ? (
                  <span className="text-base font-bold text-red-600 leading-tight">Immediate</span>
                ) : (
                  <span className="text-base font-bold text-gray-800 leading-tight">{fmtDate(tile.due_date)}</span>
                )}
                <StatusBadge status={tile.status} />
              </div>
            </div>
          );
        })()}

        {/* ── Tab strip ── */}
        <div className="shrink-0 flex items-center gap-1 px-6 pt-2 border-b border-gray-100 bg-white">
          {([
            { id: 'summary',     label: 'Due Summary',     icon: Receipt },
            { id: 'installment', label: 'Installment Plan', icon: CreditCard },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Monthly Rent Due Table or SD/Advance focused table ── */}
        {activeTab === 'summary' && (dpFilter === 'SD_PENDING' || dpFilter === 'ADVANCE_PENDING' ? (() => {
          const isSD = dpFilter === 'SD_PENDING';
          const chargeLabel = isSD ? 'Security Deposit' : 'Advance Deposit';
          const chargeAmount = isSD ? (tile.sd_amount ?? 0) : (tile.advance_amount ?? 0);
          const isPending = tile.status === 'DUE' || tile.status === 'OVERDUE';
          const statusLabel = isPending ? (tile.status === 'OVERDUE' ? 'Overdue' : 'Pending') : 'Paid';
          const statusColor = isPending ? (tile.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700') : 'bg-emerald-100 text-emerald-700';
          return (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-teal-600 text-white">
                      {['Sl No', 'Charge Type', 'Due Date', 'Amount', 'Due Amount', 'Payment Status'].map(h => (
                        <th key={h} className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-3 py-2 font-bold text-gray-600 text-center">1</td>
                      <td className="px-3 py-2 font-semibold text-gray-800">{chargeLabel}</td>
                      <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{fmtDate(tile.due_date)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">{chargeAmount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-700">{isPending ? chargeAmount.toLocaleString('en-IN') : '0'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-50 border-t-2 border-amber-200">
                      <td colSpan={4} className="px-3 py-2.5 font-bold text-amber-800 text-right text-xs">Total Outstanding</td>
                      <td className="px-3 py-2.5 font-extrabold text-amber-800 text-right">{fmtINR(tile.total_due)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })() : (() => {
          const isCommercial = tile.bhk_config === 'COMMERCIAL';
          const colCount = isCommercial ? 9 : 10;

          // Use monthly_dues from detail if available (all entries), otherwise fall back to single-tile loop
          type RowShape = { sl: number; date: string; rent: number; waterCharges: number; electricityCharges: number; penalty: number; maintenance: number; total: number; due: number; statusLabel: string; statusColor: string; isPending: boolean };
          let allRows: RowShape[];
          if (detail.monthly_dues && detail.monthly_dues.length > 0) {
            allRows = detail.monthly_dues.map((d, i) => ({
              sl: i + 1, date: d.date, rent: d.rent, waterCharges: d.waterCharges,
              electricityCharges: d.electricityCharges,
              penalty: d.penalty, maintenance: d.maintenance, total: d.total, due: d.due,
              statusLabel: d.statusLabel, statusColor: d.statusColor, isPending: d.isPending,
            }));
          } else {
            // Fallback: single tile month
            const [yr, mo] = tile.month.split('-');
            const dateStr = `01-${mo}-${yr}`;
            const rent = tile.base_rent;
            const waterCharges = tile.water_charges ?? 0;
            const electricityCharges = tile.utility_charges ?? 0;
            const penalty = tile.penalty_override ?? tile.penalty_amount;
            const maintenance = tile.maintenance_charge ?? 0;
            const total = rent + waterCharges + electricityCharges + penalty + maintenance;
            const due = Math.max(0, total - (tile.amount_paid ?? 0));
            const isPending = tile.status === 'DUE' || tile.status === 'OVERDUE';
            if (isPending && due > 0) {
              const statusLabel = 'Pending';
              const statusColor = tile.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
              allRows = [{ sl: 1, date: dateStr, rent, waterCharges, electricityCharges, penalty, maintenance, total, due, statusLabel, statusColor, isPending: true }];
            } else {
              allRows = [];
            }
          }
          // pendingRows is used for Pay Now selection logic only
          const pendingRows = allRows.filter(r => r.isPending);

          // A row can be toggled only if not EO (pending rows are always due > 0 here)
          const canSelectRow = () => !isEO;

          // Sequential enforcement: selected sls must always be a contiguous prefix of pendingRows
          const toggleRow = (sl: number) => {
            if (!canSelectRow()) return;
            setSeqWarning(null);
            const pendingSlsInOrder = pendingRows.map(pr => pr.sl);
            const idx = pendingSlsInOrder.indexOf(sl);
            setSelectedMonthSls(prev => {
              const next = new Set(prev);
              if (next.has(sl)) {
                const laterSelected = pendingSlsInOrder.slice(idx + 1).some(s => next.has(s));
                if (laterSelected) {
                  setSeqWarning('Please deselect later months first before removing this month.');
                  return prev;
                }
                next.delete(sl);
              } else {
                const earlierUnselected = pendingSlsInOrder.slice(0, idx).some(s => !next.has(s));
                if (earlierUnselected) {
                  const earliest = pendingRows.find(pr => !next.has(pr.sl));
                  setSeqWarning(`Please clear dues from ${earliest?.date ?? 'earlier months'} first before selecting this month.`);
                  return prev;
                }
                next.add(sl);
              }
              return next;
            });
          };

          const selectedTotal = pendingRows
            .filter(r => selectedMonthSls.has(r.sl))
            .reduce((sum, r) => sum + r.due, 0);

          const selectedPendingRows = pendingRows.filter(r => selectedMonthSls.has(r.sl));
          const selectionRangeLabel = selectedPendingRows.length > 0
            ? (selectedPendingRows.length === 1
                ? selectedPendingRows[0].date
                : `${selectedPendingRows[0].date} — ${selectedPendingRows[selectedPendingRows.length - 1].date}`)
            : '';
          return (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!isEO && (
                <div className="mb-3 text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-sm bg-teal-500" />
                  Showing <span className="font-semibold text-amber-700">{pendingRows.length}</span> pending month{pendingRows.length !== 1 ? 's' : ''} with dues. Select in order (oldest first), then click <span className="font-semibold text-teal-700">Pay Now</span>.
                </div>
              )}
              {seqWarning && (
                <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={13} className="text-amber-600 mt-0.5 shrink-0" />
                  <span className="text-xs text-amber-800 flex-1">{seqWarning}</span>
                  <button onClick={() => setSeqWarning(null)} className="shrink-0 text-amber-400 hover:text-amber-600"><X size={13} /></button>
                </div>
              )}
              {(isEO ? allRows.length === 0 : pendingRows.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                  <div className="text-sm font-medium text-emerald-700">No payment records</div>
                  <div className="text-xs mt-1">No months found for this allotment.</div>
                </div>
              ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-teal-600 text-white">
                      {!isEO && <th className="px-3 py-2.5 w-8" />}
                      {['Sl No', 'Month', 'Rent Amount', ...(!isCommercial ? ['Water Charges', 'Electricity Charges'] : []), 'Penalty Fee', 'Maint. Charges', 'Total Amount', 'Due Amount', 'Status'].map(h => (
                        <th key={h} className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map((r, i) => {
                      const hasEarlierPending = !r.isPending && allRows.slice(0, i).some(row => row.isPending);
                      return (
                      <tr key={r.sl} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} ${!isEO && r.isPending ? 'cursor-pointer hover:bg-teal-50/40' : ''} ${selectedMonthSls.has(r.sl) ? '!bg-teal-50' : ''} ${!r.isPending ? 'opacity-70' : ''}`}
                        onClick={() => r.isPending && toggleRow(r.sl)}>
                        {!isEO && (
                          <td className="px-3 py-2 text-center">
                            {r.isPending ? (
                              <input type="checkbox" checked={selectedMonthSls.has(r.sl)}
                                onChange={() => toggleRow(r.sl)}
                                onClick={e => e.stopPropagation()}
                                className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer" />
                            ) : (
                              <span className="inline-block w-3.5 h-3.5 rounded border border-gray-200 bg-gray-100" />
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2 font-bold text-gray-600 text-center">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{r.date}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{r.rent.toLocaleString('en-IN')}</td>
                        {!isCommercial && <td className="px-3 py-2 text-right text-gray-600">{r.waterCharges > 0 ? r.waterCharges.toLocaleString('en-IN') : '-'}</td>}
                        {!isCommercial && <td className="px-3 py-2 text-right text-blue-700">{r.electricityCharges > 0 ? r.electricityCharges.toLocaleString('en-IN') : '-'}</td>}
                        <td className="px-3 py-2 text-right text-red-600 font-medium">{r.penalty > 0 ? r.penalty.toLocaleString('en-IN') : ''}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{r.maintenance > 0 ? r.maintenance.toLocaleString('en-IN') : '0'}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-800">{r.total.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-700">{r.isPending ? r.due.toLocaleString('en-IN') : <span className="text-emerald-600">—</span>}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${r.statusColor}`}>
                            {r.statusLabel}
                            {hasEarlierPending && <AlertTriangle size={10} className="text-amber-600" title="An earlier month is still pending" />}
                          </span>
                          {hasEarlierPending && <div className="mt-1 text-[9px] text-amber-700 whitespace-nowrap">Earlier dues pending</div>}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-50 border-t-2 border-amber-200">
                      {!isEO && <td />}
                      <td colSpan={colCount - 2} className="px-3 py-2.5 font-bold text-amber-800 text-right text-xs">Total Outstanding</td>
                      <td className="px-3 py-2.5 font-extrabold text-amber-800 text-right">{fmtINR(pendingRows.reduce((s, r) => s + r.due, 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              )}
              {!isEO && selectedMonthSls.size > 0 && (
                <div className="mt-3 flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                  <div className="text-xs text-teal-800 min-w-0 mr-3">
                    <span className="font-semibold">{selectedMonthSls.size}</span> month{selectedMonthSls.size > 1 ? 's' : ''} selected
                    {selectionRangeLabel && <span className="text-teal-600"> ({selectionRangeLabel})</span>}
                    {' '}&mdash; <span className="font-bold">{fmtINR(selectedTotal)}</span>
                  </div>
                  <button
                    onClick={() => onPaySelected?.(selectedTotal)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
                  >
                    <Wallet size={11} /> Pay Now
                  </button>
                </div>
              )}
            </div>
          );
        })())}

        {/* ── Installment Plan Tab ── */}
        {activeTab === 'installment' && (
          <div className="flex-1 overflow-y-auto">
            {planLoading ? (
              <div className="flex items-center justify-center py-16">
                <span className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : planMode === 'setup' ? (
              /* ── Setup / Define mode ── */
              <div className="px-6 py-4 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Define Installment Plan</div>

                {/* Config grid */}
                <div className="grid grid-cols-4 gap-x-4 gap-y-3 bg-gray-50 rounded-xl border border-gray-200 p-4">
                  {/* Row 1 */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Installment Start Date <span className="text-red-500">*</span></label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Late Fee (₹)</label>
                    <input type="number" value={lateFee} onChange={e => setLateFee(e.target.value)} min={0} step="0.01"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Due Days with Late Fee</label>
                    <select value={dueDaysLate} onChange={e => setDueDaysLate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white">
                      {[0,5,7,10,15,20,30].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {/* Row 2 */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Interest (%)Pa</label>
                    <input type="number" value={interestPct} onChange={e => setInterestPct(e.target.value)} min={0} step="0.01"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Discount (If Full Payment) %</label>
                    <input type="number" value={discountFullPct} onChange={e => setDiscountFullPct(e.target.value)} min={0} max={100} step="0.01"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">GST (%)</label>
                    <div className="flex gap-1.5">
                      <input type="number" value={gstPct} onChange={e => setGstPct(e.target.value)} min={0} step="0.01"
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white min-w-0" />
                      <div className="flex items-center gap-1 text-[10px]">
                        {(['inclusive','exclusive'] as const).map(t => (
                          <label key={t} className="flex items-center gap-0.5 cursor-pointer">
                            <input type="radio" name="gst_type" value={t} checked={gstType === t} onChange={() => setGstType(t)} className="accent-teal-600" />
                            <span className="capitalize text-gray-600">{t.slice(0,3)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Row 3 */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Balance Payment (₹) <span className="text-red-500">*</span></label>
                    <input type="number" value={balancePayment} readOnly
                      className="w-full px-2 py-1.5 text-xs border border-gray-100 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Term No. of Installments <span className="text-red-500">*</span></label>
                    <select value={numInstals} onChange={e => setNumInstals(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white">
                      {[1,2,3,4,6,8,10,12].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {/* Installment rows table */}
                {(() => {
                  const gstPctNum = Number(gstPct) || 0;
                  const discountPctNum = Number(discountFullPct) || 0;
                  const lateFeeNum = Number(lateFee) || 0;
                  const calcGst = (amt: number) =>
                    gstType === 'exclusive'
                      ? amt * gstPctNum / 100
                      : amt - amt / (1 + gstPctNum / 100);
                  const fpDiscount = balancePayment * discountPctNum / 100;
                  const fpGst = calcGst(balancePayment - fpDiscount);
                  const fpNet = balancePayment - fpDiscount + fpGst;
                  const totalPenalty = instalRows.length * lateFeeNum;
                  const totalGst = instalRows.reduce((s, r) => s + calcGst(Number(r.amount) || 0), 0);
                  const totalNet = instalRows.reduce((s, r) => {
                    const a = Number(r.amount) || 0;
                    return s + a + lateFeeNum + calcGst(a);
                  }, 0);
                  return (
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Installment Schedule</div>
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {[
                                { label: 'Installments', cls: 'text-left' },
                                { label: 'Percentage',   cls: 'text-left' },
                                { label: 'Amount',       cls: 'text-left' },
                                { label: 'Discount',     cls: 'text-right text-emerald-700' },
                                { label: 'Penalty',      cls: 'text-right text-rose-600' },
                                { label: 'GST Amt',      cls: 'text-right text-blue-600' },
                                { label: 'Net Payable',  cls: 'text-right text-gray-800' },
                                { label: 'Due Date',     cls: 'text-left' },
                              ].map(({ label, cls }) => (
                                <th key={label} className={`px-3 py-2 font-semibold text-[10px] uppercase tracking-wide whitespace-nowrap ${cls}`}>{label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Full Payment row */}
                            <tr className="border-b border-gray-100 bg-teal-50/30">
                              <td className="px-3 py-2 font-semibold text-gray-700">Full Payment</td>
                              <td className="px-3 py-2 text-gray-600">100.00</td>
                              <td className="px-3 py-2 font-semibold text-gray-800">{balancePayment.toFixed(2)}</td>
                              <td className="px-3 py-2 text-emerald-700 font-medium text-right tabular-nums">
                                {fpDiscount > 0 ? fpDiscount.toFixed(2) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2 text-gray-300 text-right">—</td>
                              <td className="px-3 py-2 text-blue-600 font-medium text-right tabular-nums">
                                {fpGst > 0 ? fpGst.toFixed(2) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2 font-bold text-gray-900 text-right tabular-nums">{fpNet.toFixed(2)}</td>
                              <td className="px-3 py-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                  className="px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-teal-200 bg-white w-28" />
                              </td>
                            </tr>
                            {/* Numbered rows */}
                            {instalRows.map((row, i) => {
                              const amt = Number(row.amount) || 0;
                              const gstAmt = calcGst(amt);
                              const netPayable = amt + lateFeeNum + gstAmt;
                              return (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-3 py-2 font-medium text-gray-700">Installment {i + 1}</td>
                                  <td className="px-3 py-2">
                                    <input type="number" value={row.percentage} onChange={e => updateRow(i, 'percentage', e.target.value)}
                                      min={0} max={100} step="0.01"
                                      className="w-16 px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-teal-200 bg-white" />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input type="number" value={row.amount} onChange={e => updateRow(i, 'amount', e.target.value)}
                                      min={0} step="0.01"
                                      className="w-24 px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-teal-200 bg-white" />
                                  </td>
                                  <td className="px-3 py-2 text-gray-300 text-right">—</td>
                                  <td className="px-3 py-2 text-rose-600 font-medium text-right tabular-nums">
                                    {lateFeeNum > 0 ? lateFeeNum.toFixed(2) : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-3 py-2 text-blue-600 font-medium text-right tabular-nums">
                                    {gstAmt > 0 ? gstAmt.toFixed(2) : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-gray-900 text-right tabular-nums">{netPayable.toFixed(2)}</td>
                                  <td className="px-3 py-2">
                                    <input type="date" value={row.due_date} onChange={e => updateRow(i, 'due_date', e.target.value)}
                                      className="px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-teal-200 bg-white w-28" />
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Totals row */}
                            <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                              <td className="px-3 py-2 text-gray-700">Total</td>
                              <td className={`px-3 py-2 ${Math.abs(totalPct - 100) < 0.01 ? 'text-emerald-700' : 'text-red-600'}`}>{totalPct.toFixed(2)}</td>
                              <td className={`px-3 py-2 ${Math.abs(totalAmt - balancePayment) < 0.5 ? 'text-emerald-700' : 'text-red-600'}`}>{totalAmt.toFixed(2)}</td>
                              <td className="px-3 py-2 text-gray-400 text-right">—</td>
                              <td className="px-3 py-2 text-rose-600 text-right tabular-nums">{totalPenalty > 0 ? totalPenalty.toFixed(2) : '—'}</td>
                              <td className="px-3 py-2 text-blue-600 text-right tabular-nums">{totalGst > 0 ? totalGst.toFixed(2) : '—'}</td>
                              <td className="px-3 py-2 text-gray-900 text-right tabular-nums">{totalNet.toFixed(2)}</td>
                              <td className="px-3 py-2 text-gray-400">—</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {Math.abs(totalPct - 100) > 0.01 && (
                        <p className="text-[10px] text-red-500 mt-1">Percentages must sum to 100 (currently {totalPct.toFixed(2)})</p>
                      )}
                    </div>
                  );
                })()}

                <div className="flex gap-3 pt-1">
                  <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Go Back
                  </button>
                  {isEO && (
                    <button
                      onClick={handleCreatePlan}
                      disabled={planSaving || !startDate || Math.abs(totalPct - 100) > 0.01}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2"
                    >
                      {planSaving ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                      ) : <><Plus size={14} /> Submit Plan</>}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="px-6 py-4 space-y-4">
                {plan && (
                  <>
                    {/* Header config summary — horizontal chip strip */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                      <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-[11px]">
                        {[
                          { label: 'Start Date',            value: plan.installment_start_date ? fmtDate(plan.installment_start_date) : 'NA' },
                          { label: 'Late Fee',              value: `₹${plan.late_fee.toFixed(2)}` },
                          { label: 'Due Days (Late)',       value: String(plan.due_days_with_late_fee) },
                          { label: 'Interest %Pa',          value: plan.interest_pct_pa.toFixed(1) },
                          { label: 'Full Pmt Disc %',       value: plan.discount_full_payment_pct.toFixed(1) },
                          { label: `GST ${plan.gst_pct.toFixed(1)}%`, value: plan.gst_type === 'inclusive' ? 'Inclusive' : 'Exclusive' },
                          { label: 'Balance Pmt',           value: fmtINR(plan.balance_payment) },
                          { label: 'Installments',          value: String(plan.no_of_installments) },
                          { label: 'Paid',                  value: plan.installments_paid > 0 ? String(plan.installments_paid) : 'NA', valueClass: 'text-emerald-700' },
                          { label: 'Due',                   value: plan.installments_due > 0 ? String(plan.installments_due) : 'NA', valueClass: 'text-amber-700' },
                        ].map(({ label, value, valueClass }) => (
                          <div key={label} className="flex flex-col leading-tight">
                            <span className="text-gray-400 font-medium text-[10px]">{label}</span>
                            <span className={`font-semibold text-gray-800 ${valueClass ?? ''}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filter + Export controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={filterInstalment === 'all' ? 'all' : String(filterInstalment)}
                        onChange={e => setFilterInstalment(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-200"
                      >
                        <option value="all">All Installments</option>
                        {plan.rows.filter(r => r.row_number > 0).map(r => (
                          <option key={r.row_number} value={r.row_number}>{r.label}</option>
                        ))}
                      </select>
                      <button onClick={() => setFilterInstalment('all')} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors">Reset</button>
                      <div className="flex-1" />
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors">
                        <Download size={11} /> Export to Excel
                      </button>
                    </div>

                    {/* Installment table — dense, no horizontal scroll needed */}
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            {[
                              { label: 'Action',           cls: 'w-16' },
                              { label: 'Installment',      cls: '' },
                              { label: 'Total Amt',        cls: 'text-right' },
                              { label: 'Discount',         cls: 'text-right text-emerald-700' },
                              { label: 'Penalty',          cls: 'text-right text-rose-600' },
                              { label: 'GST Amt',          cls: 'text-right text-blue-600' },
                              { label: 'Due Date',         cls: '' },
                              { label: 'Due w/ Late Fee',  cls: '' },
                              { label: 'Paid Date',        cls: '' },
                              { label: 'Paid Amt',         cls: 'text-right text-emerald-700' },
                              { label: 'Remaining',        cls: 'text-right text-amber-700' },
                              { label: 'Status',           cls: 'text-center' },
                            ].map(({ label, cls }) => (
                              <th key={label} className={`px-2.5 py-2 font-semibold text-gray-500 whitespace-nowrap text-[10px] uppercase tracking-wide ${cls}`}>{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleRows.map((row, idx) => {
                            const st = INSTALMENT_STATUS[row.status] ?? INSTALMENT_STATUS.PENDING;
                            const rowDiscountAmt = row.row_number === 0 && plan.discount_full_payment_pct > 0
                              ? (row.amount * plan.discount_full_payment_pct / 100)
                              : 0;
                            return (
                              <tr key={row.row_number} className={`border-b border-gray-100 hover:bg-gray-50/70 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                                <td className="px-2.5 py-2">
                                  {row.row_number === 0 && row.paid_amt > 0 && (
                                    <button className="px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600 transition-colors">View</button>
                                  )}
                                  {!isEO && row.row_number > 0 && (row.status === 'DUE' || row.status === 'OVERDUE') && onPayInstallment && (
                                    <button
                                      onClick={() => onPayInstallment(plan.id, row.id, row.remaining_amount)}
                                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
                                    >
                                      <Wallet size={9} /> Pay
                                    </button>
                                  )}
                                </td>
                                <td className="px-2.5 py-2 font-medium text-gray-800 whitespace-nowrap">{row.label}</td>
                                <td className="px-2.5 py-2 font-semibold text-gray-900 text-right tabular-nums">{row.amount.toFixed(2)}</td>
                                <td className="px-2.5 py-2 text-emerald-700 font-medium text-right tabular-nums">
                                  {rowDiscountAmt > 0 ? rowDiscountAmt.toFixed(2) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-2.5 py-2 text-rose-600 font-medium text-right tabular-nums">
                                  {row.late_fee > 0 ? row.late_fee.toFixed(2) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-2.5 py-2 text-blue-600 font-medium text-right tabular-nums">
                                  {row.gst_amount > 0 ? row.gst_amount.toFixed(2) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-2.5 py-2 text-gray-600 whitespace-nowrap">{row.due_date ? fmtDate(row.due_date) : <span className="text-gray-300">—</span>}</td>
                                <td className="px-2.5 py-2 text-gray-600 whitespace-nowrap">{row.due_date_with_late_fee ? fmtDate(row.due_date_with_late_fee) : <span className="text-gray-300">—</span>}</td>
                                <td className="px-2.5 py-2 text-gray-600 whitespace-nowrap">{row.paid_date ? fmtDate(row.paid_date) : <span className="text-gray-300">—</span>}</td>
                                <td className="px-2.5 py-2 font-semibold text-emerald-700 text-right tabular-nums">{row.paid_amt.toFixed(2)}</td>
                                <td className="px-2.5 py-2 font-semibold text-amber-700 text-right tabular-nums">{row.remaining_amount.toFixed(2)}</td>
                                <td className="px-2.5 py-2 text-center">
                                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                                    {row.status === 'PENDING' ? '—' : row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Totals row */}
                          {(() => {
                            const instRows = plan.rows.filter(r => r.row_number > 0);
                            return (
                              <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold text-xs">
                                <td className="px-2.5 py-2 text-gray-500"></td>
                                <td className="px-2.5 py-2 text-gray-700">Total ({instRows.length})</td>
                                <td className="px-2.5 py-2 text-gray-900 text-right tabular-nums">{instRows.reduce((s, r) => s + r.amount, 0).toFixed(2)}</td>
                                <td className="px-2.5 py-2 text-gray-300 text-right">—</td>
                                <td className="px-2.5 py-2 text-rose-600 text-right tabular-nums">{instRows.reduce((s, r) => s + r.late_fee, 0).toFixed(2)}</td>
                                <td className="px-2.5 py-2 text-blue-600 text-right tabular-nums">{instRows.reduce((s, r) => s + r.gst_amount, 0).toFixed(2)}</td>
                                <td className="px-2.5 py-2 text-gray-300">—</td>
                                <td className="px-2.5 py-2 text-gray-300">—</td>
                                <td className="px-2.5 py-2 text-gray-300">—</td>
                                <td className="px-2.5 py-2 text-emerald-700 text-right tabular-nums">{instRows.reduce((s, r) => s + r.paid_amt, 0).toFixed(2)}</td>
                                <td className="px-2.5 py-2 text-amber-700 text-right tabular-nums">{instRows.reduce((s, r) => s + r.remaining_amount, 0).toFixed(2)}</td>
                                <td className="px-2.5 py-2 text-gray-300 text-center">—</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        {(
          <div className="flex justify-end gap-3 px-6 py-3 border-t border-gray-100 shrink-0">
            <button onClick={onClose} className="px-5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors">
              Close
            </button>
            {/* Apply Discount button hidden — code preserved */}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Pay Now Modal ─────────────────────────────────────────────────────────────
interface PayNowModalProps { tile: RentTile; lockedAmount?: number; onClose: () => void; onPay: (amount: number, mode: string) => void; }
const PAY_MODES = ['UPI','NET_BANKING','CARD','DD'] as const;
const PayNowModal: React.FC<PayNowModalProps> = ({ tile, lockedAmount, onClose, onPay }) => {
  const payableAmount = lockedAmount ?? (tile.total_due - tile.amount_paid);
  const [mode, setMode] = useState<string>('UPI');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-teal-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">Pay Now</div>
            <div className="text-xs text-gray-400">{tile.quarter_number} · {fmtMonthFull(tile.month)}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Payable (₹)</label>
            <div className="w-full px-3 py-2.5 text-lg font-bold border border-gray-100 rounded-xl bg-gray-50 text-teal-700 select-none">
              {fmtINR(payableAmount)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">This amount is fixed and cannot be changed here.</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {PAY_MODES.map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${mode === m ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
            <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wide mb-1">Demo Payment</div>
            <div className="text-xs text-teal-600">This is a demo payment screen. No real transaction will be processed.</div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onPay(payableAmount, mode)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-sm"
          >
            Pay {fmtINR(payableAmount)}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Undo Confirm Modal ────────────────────────────────────────────────────────
interface UndoModalProps { payment: RentPayment; onClose: () => void; onConfirm: (reason: string) => void; }
const UndoModal: React.FC<UndoModalProps> = ({ payment, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const canConfirm = reason.trim().length > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <Undo2 size={16} className="text-rose-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">Undo Payment</div>
            <div className="text-xs text-gray-400">Receipt: {payment.receipt_ref || '—'}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
            <p className="text-sm text-gray-700">Remove payment of <strong className="text-gray-900">{fmtINR(payment.amount)}</strong> made on <strong className="text-gray-900">{fmtDate(payment.payment_date)}</strong>?</p>
            <p className="text-xs text-rose-600 mt-1">Tile status will revert to <strong>Due</strong> depending on remaining payments.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason for reversal <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Wrong tenant, duplicate entry, incorrect amount…"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200/60 bg-white resize-none outline-none"
              autoFocus
            />
            {!canConfirm && <p className="text-[10px] text-gray-400 mt-0.5">Required before confirming reversal.</p>}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => canConfirm && onConfirm(reason.trim())}
            disabled={!canConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-sm font-bold transition-colors"
          >
            Undo Payment
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Bulk Pay Modal ────────────────────────────────────────────────────────────
interface BulkPayModalProps {
  tiles: RentTile[];
  onClose: () => void;
  onPay: (mode: string) => Promise<void>;
}
const PAY_MODES_BULK = ['UPI', 'NET_BANKING', 'CARD', 'DD'] as const;
const BulkPayModal: React.FC<BulkPayModalProps> = ({ tiles, onClose, onPay }) => {
  const [mode, setMode] = useState<string>('UPI');
  const [paying, setPaying] = useState(false);
  const total = tiles.reduce((s, t) => s + (t.total_due - t.amount_paid), 0);

  const handlePay = async () => {
    setPaying(true);
    try { await onPay(mode); } finally { setPaying(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-teal-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">Pay Multiple Dues</div>
            <div className="text-xs text-gray-400">{tiles.length} records selected · Total {fmtINR(total)}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
        </div>

        {/* Breakdown list */}
        <div className="px-6 pt-4 pb-2 max-h-52 overflow-y-auto space-y-1.5">
          {tiles.map(t => (
            <div key={t.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-gray-800">{t.quarter_number}</span>
                <span className="text-[10px] text-gray-400 ml-2">{fmtMonthFull(t.month)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={t.status} />
                <span className="text-xs font-bold text-gray-900 tabular-nums">{fmtINR(t.total_due - t.amount_paid)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mx-6 py-3 border-t-2 border-gray-200 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Total Payable</span>
          <span className="text-xl font-extrabold text-teal-700">{fmtINR(total)}</span>
        </div>

        {/* Payment mode */}
        <div className="px-6 pb-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-600">Payment Mode</label>
          <div className="grid grid-cols-4 gap-2">
            {PAY_MODES_BULK.map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${mode === m ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
            <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wide mb-0.5">Demo Payment</div>
            <div className="text-xs text-teal-600">This is a demo. No real transaction will be processed.</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {paying ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
            ) : <>Pay {fmtINR(total)}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Installment Pay Modal ─────────────────────────────────────────────────────
interface InstallmentPayModalProps {
  amount: number;
  onClose: () => void;
  onPay: (mode: string) => Promise<void>;
}
const PAY_MODES_INST = ['UPI', 'NET_BANKING', 'CARD', 'DD'] as const;
const InstallmentPayModal: React.FC<InstallmentPayModalProps> = ({ amount, onClose, onPay }) => {
  const [mode, setMode] = useState<string>('UPI');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try { await onPay(mode); } finally { setPaying(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-teal-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">Pay Installment</div>
            <div className="text-xs text-gray-400">Amount due: {fmtINR(amount)}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between bg-teal-50 rounded-xl p-4 border border-teal-100">
            <span className="text-sm font-semibold text-teal-800">Total Payable</span>
            <span className="text-2xl font-extrabold text-teal-700">{fmtINR(amount)}</span>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600">Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {PAY_MODES_INST.map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${mode === m ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">Demo Mode</div>
            <div className="text-xs text-amber-600">No real transaction will be processed.</div>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {paying ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
            ) : <>Pay {fmtINR(amount)}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: StatusKey }> = ({ status }) => {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Rent Chat Right Panel (replaces popup; lives inside SplitLayout) ──────────
const CLAR_MAX = 500;
interface RentChatPanelProps {
  tile: RentTile;
  clarifications: RentClarification[];
  clarMsg: string;
  isEO: boolean;
  controls: React.ReactNode;
  deliveryMode: ChatDeliveryMode[];
  onDeliveryModeChange: (modes: ChatDeliveryMode[]) => void;
  onChange: (v: string) => void;
  onSend: () => void;
}
const RentChatPanel: React.FC<RentChatPanelProps> = ({
  tile, clarifications, clarMsg, isEO, controls, deliveryMode, onDeliveryModeChange, onChange, onSend,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [clarifications]);
  const selfRole = isEO ? 'EO' : 'TENANT';
  const charCount = clarMsg.length;
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-teal-700 text-white shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <MessageSquare size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{tile.quarter_number} · {fmtMonthFull(tile.month)}</div>
          <div className="text-[10px] text-teal-200 truncate">{tile.tenant_name} · Clarifications</div>
        </div>
        {controls}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/30 min-h-0">
        {clarifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare size={24} className="text-gray-200" />
            <span className="text-xs text-gray-400">No messages yet. Start the conversation.</span>
          </div>
        ) : clarifications.map(c => {
          const isSelf = c.author_role === selfRole;
          return (
            <div key={c.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                isSelf ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}>
                {!isSelf && (
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{c.author_name}</div>
                )}
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{c.message}</p>
                <div className={`text-[10px] mt-1.5 ${isSelf ? 'text-teal-200' : 'text-gray-400'}`}>
                  {fmtDate(c.created_at.slice(0, 10))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input footer */}
      <div className="px-4 pt-3 pb-4 border-t border-gray-100 shrink-0 space-y-1.5 bg-white">
        <ChatDeliveryModePicker value={deliveryMode} onChange={onDeliveryModeChange} className="mb-2" />
        <div className="flex gap-2 items-end">
          <textarea
            value={clarMsg}
            onChange={e => onChange(e.target.value.slice(0, CLAR_MAX))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && clarMsg.trim()) { e.preventDefault(); onSend(); } }}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-300/40 bg-white outline-none resize-none"
            autoFocus
          />
          <button
            onClick={onSend}
            disabled={!clarMsg.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl disabled:opacity-40 hover:bg-teal-700 transition-colors shrink-0 self-end"
          >
            <Send size={14} />
          </button>
        </div>
        <div className={`text-[10px] text-right ${charCount > CLAR_MAX * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
          {charCount} / {CLAR_MAX}
        </div>
      </div>
    </div>
  );
};

// ── Tile Actions Menu — portal-based dropdown, immune to overflow-hidden ──────
interface TileActionsMenuProps {
  tile: RentTile;
  isEO: boolean;
  chatTileId: string | null;
  expandedId: string | null;
  activePanel: 'history' | null;
  onPayNow: (tile: RentTile) => void;
  onDueDetails: (tile: RentTile, initialTab?: 'summary' | 'installment' | 'monthly') => void;
  onHistoryPanel: (tile: RentTile) => void;
  onChatPanel: (tile: RentTile) => void;
  onLogDetails: (tile: RentTile) => void;
}
const TileActionsMenu: React.FC<TileActionsMenuProps> = ({
  tile, isEO, chatTileId, expandedId, activePanel,
  onPayNow, onDueDetails, onHistoryPanel, onChatPanel, onLogDetails,
}) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const hasDue = tile.status === 'DUE' || tile.status === 'OVERDUE';
  const hasPayments = tile.status === 'PAID';
  const showClar = tile.status !== 'EXEMPTED';
  const isHistoryOpen = expandedId === tile.id && activePanel === 'history';
  const isChatOpen = chatTileId === tile.id;

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const menuHeight = 120;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
      setMenuPos({ top, right: window.innerWidth - rect.right });
    }
    setOpen(true);
  };

  const close = () => setOpen(false);

  return (
    <div className="flex items-center gap-1.5">
      {/* Pay Now — opens monthly tab for sequential selection */}
      {!isEO && hasDue && (
        <button
          onClick={e => { e.stopPropagation(); onDueDetails(tile, 'monthly'); }}
          title="Pay Now"
          className="flex items-center justify-center p-1.5 rounded-lg bg-teal-600 text-white border border-teal-600 hover:bg-teal-700 transition-colors"
        >
          <Wallet size={12} />
        </button>
      )}

      {/* Inline chat icon */}
      {showClar && (
        <button
          onClick={e => { e.stopPropagation(); onChatPanel(tile); }}
          title="Clarifications"
          className={`p-1.5 rounded-lg border transition-colors ${
            isChatOpen
              ? 'bg-teal-600 text-white border-teal-600'
              : 'border-gray-200 text-gray-400 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200'
          }`}
        >
          <MessageSquare size={12} />
        </button>
      )}

      {/* Actions dropdown — always visible */}
      <>
        <button
          ref={btnRef}
          onClick={openMenu}
          title="Actions"
          className={`flex items-center justify-center p-1.5 rounded-lg border transition-colors ${
            open ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <MoreVertical size={13} />
        </button>

        {open && menuPos && createPortal(
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={close} />
            {/* Menu */}
            <div
              className="fixed z-[9999] bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 min-w-[170px]"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {hasPayments && (
              <button
                onClick={e => { e.stopPropagation(); close(); onHistoryPanel(tile); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors text-left ${
                  isHistoryOpen ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                <Receipt size={12} className="text-teal-500 shrink-0" />
                Paid History
              </button>
              )}
              {hasDue && (
              <button
                onClick={e => { e.stopPropagation(); close(); onDueDetails(tile); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors text-left"
              >
                <IndianRupee size={12} className="text-amber-500 shrink-0" />
                Show Due Payment
              </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); close(); onLogDetails(tile); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-slate-50 hover:text-slate-800 transition-colors text-left"
              >
                <ClipboardList size={12} className="text-slate-400 shrink-0" />
                Log Details
              </button>
            </div>
          </>,
          document.body
        )}
      </>
    </div>
  );
};

// ── Tenant Info Chip ──────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
//  Tenant Payment Profile Modal
// ─────────────────────────────────────────────────────────────────────────────
const TenantPaymentProfileModal: React.FC<{
  tenantId: string;
  tiles: RentTile[];
  onClose: () => void;
}> = ({ tenantId, tiles, onClose }) => {
  const tenantTiles = tiles.filter(t => t.tenant_id === tenantId).sort((a, b) => b.month.localeCompare(a.month));
  if (tenantTiles.length === 0) return null;
  const first = tenantTiles[0];
  const totalPending = tenantTiles
    .filter(t => t.status === 'DUE' || t.status === 'OVERDUE')
    .reduce((s, t) => s + t.total_due, 0);
  const totalPaid = tenantTiles.reduce((s, t) => s + t.amount_paid, 0);
  const unpaidCount = tenantTiles.filter(t => t.status === 'DUE' || t.status === 'OVERDUE').length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-base font-extrabold text-white">{first.tenant_name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{first.tenant_name}</div>
            <div className="text-[11px] text-slate-300 truncate">{first.tenant_designation}{first.tenant_dept ? ` · ${first.tenant_dept}` : ''}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-4 py-3 text-center">
            <div className="text-lg font-extrabold text-gray-900">{tenantTiles.length}</div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Total Records</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className={`text-lg font-extrabold ${unpaidCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmtINR(totalPending)}</div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Total Pending</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-lg font-extrabold text-emerald-600">{fmtINR(totalPaid)}</div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Total Paid</div>
          </div>
        </div>

        {/* Property list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {tenantTiles.map(t => {
            const s = STATUS[t.status];
            const pendingAmt = t.status === 'PAID' || t.status === 'EXEMPTED' ? 0 : t.total_due;
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className={`w-1 self-stretch shrink-0 rounded-full ${STATUS_LEFT[t.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-gray-900">{t.quarter_number}</span>
                    <span className="text-[9px] bg-gray-100 text-gray-500 rounded px-1 py-0.5 font-semibold">{t.bhk_config}</span>
                    <span className="text-[9px] text-gray-400">{t.block_name}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{fmtMonthFull(t.month)} · {t.location_area}</div>
                </div>
                <div className="shrink-0 text-right min-w-[80px]">
                  <div className={`text-sm font-extrabold ${s.text}`}>{fmtINR(t.total_due)}</div>
                  <div className="text-[9px] text-gray-400">total due</div>
                </div>
                <div className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg ${s.bg} ${s.text} ${s.border} border`}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer total */}
        {unpaidCount > 0 && (
          <div className="border-t border-gray-100 px-5 py-3 bg-amber-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">{unpaidCount} unpaid record{unpaidCount > 1 ? 's' : ''}</span>
            <span className="text-sm font-extrabold text-amber-700">{fmtINR(totalPending)} outstanding</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

const TenantChip: React.FC<{ tile: RentTile; onViewProfile?: (e: React.MouseEvent) => void }> = ({ tile, onViewProfile }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-teal-700">{tile.tenant_name[0]}</span>
    </div>
    <div className="min-w-0">
      <div className="text-xs font-semibold text-gray-900 truncate leading-tight">{tile.tenant_name}</div>
      <div className="text-[10px] text-gray-400 leading-tight truncate">{tile.tenant_designation}</div>
    </div>
    {onViewProfile && (
      <button
        onClick={onViewProfile}
        className="ml-0.5 w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-teal-600 hover:bg-teal-50 transition-colors shrink-0"
        title="View all payments for this tenant"
      >
        <Eye size={11} />
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────────────────────
type ViewMode = 'table' | 'tile' | 'card' | 'graph';
type DpFilter = 'all' | 'DUE' | 'OVERDUE' | 'EXEMPTED' | 'PAID'
  | 'RENT_OUTSTANDING' | 'SD_PENDING' | 'ADVANCE_PENDING';

function computeSummaryFromTiles(tiles: RentTile[]): RentTrackerSummary {
  let total_due_count = 0, total_due_amount = 0;
  let arrears_count = 0, arrears_amount = 0;
  let exempted_count = 0, exempted_amount = 0;
  let paid_count = 0, paid_amount = 0;
  let sd_pending_count = 0, sd_pending_amount = 0;
  let advance_pending_count = 0, advance_pending_amount = 0;
  let maintenance_arrears_count = 0, maintenance_arrears_amount = 0;
  let penalty_accumulated_count = 0, penalty_accumulated_amount = 0;

  for (const t of tiles) {
    if      (t.status === 'DUE')      { total_due_count++; total_due_amount += t.total_due; }
    else if (t.status === 'OVERDUE')  { arrears_count++;   arrears_amount   += t.total_due; }
    else if (t.status === 'EXEMPTED') { exempted_count++;  exempted_amount  += t.base_rent; }
    else if (t.status === 'PAID')     { paid_count++;      paid_amount      += t.amount_paid; }

    if ((t.sd_amount ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE')) {
      sd_pending_count++; sd_pending_amount += (t.sd_amount ?? 0);
    }
    if ((t.advance_amount ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE')) {
      advance_pending_count++; advance_pending_amount += (t.advance_amount ?? 0);
    }
    if ((t.maintenance_charge ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE')) {
      maintenance_arrears_count++; maintenance_arrears_amount += (t.maintenance_charge ?? 0);
    }
    if ((t.penalty_amount ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE')) {
      penalty_accumulated_count++; penalty_accumulated_amount += (t.penalty_override ?? t.penalty_amount ?? 0);
    }
  }

  const demand = total_due_amount + arrears_amount + paid_amount;
  const collection_rate = demand > 0 ? Math.round(paid_amount / demand * 100) : 0;

  const total_outstanding_count = total_due_count + arrears_count;
  const total_outstanding_amount = total_due_amount + arrears_amount;

  return {
    total_due_count, total_due_amount, arrears_count, arrears_amount,
    exempted_count, exempted_amount, paid_count, paid_amount,
    collection_rate,
    total_outstanding_count, total_outstanding_amount,
    sd_pending_count, sd_pending_amount,
    advance_pending_count, advance_pending_amount,
    maintenance_arrears_count, maintenance_arrears_amount,
    penalty_accumulated_count, penalty_accumulated_amount,
  };
}

export const QuarterRentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const isEO = user?.role === 'admin' || user?.role === 'manager';
  const isTenant = user?.role === 'govt_official' || user?.role === 'dept_user';
  // For demo: the govt_official logs in as EMP-1001 (Rajesh Kumar)
  const tenantScopeId = isTenant ? (quartersService.getDemoGovtOfficialTenantId()) : null;
  const filterAllotmentId = searchParams.get('allotmentId');

  // ── Data state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [tiles, setTiles] = useState<RentTile[]>([]);

  // ── Filter / view state ─────────────────────────────────────────────────────
  const [dpFilter, setDpFilter] = useState<DpFilter>('RENT_OUTSTANDING');
  const [outstandingExpanded, setOutstandingExpanded] = useState(true);
  const [paidExpanded, setPaidExpanded] = useState(false);
  const [collectionGraphOpen, setCollectionGraphOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [monthFrom, setMonthFrom] = useState('2026-05');
  const [monthTo, setMonthTo]     = useState('2026-05');
  const [locFilter, setLocFilter]    = useState('');
  const [modeFilter, setModeFilter]  = useState('ALL');
  const [tenantFilter, setTenantFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Panel / modal state ─────────────────────────────────────────────────────
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'history' | null>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const [expandedPaymentIds, setExpandedPaymentIds] = useState<Set<string>>(new Set());
  const [expandedInfoIds, setExpandedInfoIds] = useState<Set<string>>(new Set());
  const [dueModal, setDueModal]   = useState<{ tile: RentTile; detail: RentDueDetail; dpFilter: DpFilter; initialTab?: 'summary' | 'installment' | 'monthly' } | null>(null);
  const [chatTileId, setChatTileId] = useState<string | null>(null);
  const [payNowTile, setPayNowTile] = useState<RentTile | null>(null);
  const [undoPayment, setUndoPayment] = useState<{ tile: RentTile; payment: RentPayment } | null>(null);
  const [payments, setPayments]   = useState<RentPayment[]>([]);
  const [clarifications, setClarifications] = useState<RentClarification[]>([]);
  const [tenantProfileId, setTenantProfileId] = useState<string | null>(null);
  const [clarMsg, setClarMsg] = useState('');
  const [rentChatDeliveryMode, setRentChatDeliveryMode] = useState<ChatDeliveryMode[]>(['IN_APP']);
  const [paySuccess, setPaySuccess] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [penaltyMaxDiscountPct, setPenaltyMaxDiscountPct] = useState(25);
  const [logTile, setLogTile] = useState<RentTile | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    if (activePanel !== 'history') return;
    const handler = (e: MouseEvent) => {
      if (historyPanelRef.current && !historyPanelRef.current.contains(e.target as Node)) {
        setExpandedId(null);
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activePanel]);

  // ── Multi-select state (tenant bulk pay) ────────────────────────────────────
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  const [bulkPayOpen, setBulkPayOpen] = useState(false);

  const toggleTileSelect = useCallback((id: string) => {
    setSelectedTileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllDue = useCallback(() => {
    setSelectedTileIds(new Set(
      tiles.filter(t => t.status === 'DUE' || t.status === 'OVERDUE').map(t => t.id)
    ));
  }, [tiles]);

  const clearSelection = useCallback(() => setSelectedTileIds(new Set()), []);

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadTiles = useCallback(async () => {
    setLoading(true);
    try {
      const t = await quartersService.getRentTrackerTiles({
        monthFrom, monthTo,
        location: locFilter, paymentMode: modeFilter, tenant: tenantFilter,
        tenantId: tenantScopeId ?? undefined,
      });
      setTiles(t);
    } finally {
      setLoading(false);
    }
  }, [monthFrom, monthTo, locFilter, modeFilter, tenantFilter, tenantScopeId]);

  useEffect(() => { loadTiles(); }, [loadTiles]);

  useEffect(() => {
    quartersService.getPaymentConfig('penalty_max_discount_pct').then(v => setPenaltyMaxDiscountPct(v)).catch(() => {});
  }, []);

  useEffect(() => {
    if (dpFilter !== 'all' && viewMode === 'graph') setViewMode('tile');
  }, [dpFilter, viewMode]);

  // ── Summary derived from loaded tiles (always in sync with what is displayed) ─
  const summary = useMemo(() => tiles.length ? computeSummaryFromTiles(tiles) : null, [tiles]);

  // ── Filtered tiles ──────────────────────────────────────────────────────────
  const displayTiles = useMemo(() => {
    let t = tiles;
    if (filterAllotmentId && isTenant) t = t.filter(x => x.allotment_id === filterAllotmentId);
    if (dpFilter === 'DUE')                  t = t.filter(x => x.status === 'DUE');
    else if (dpFilter === 'OVERDUE')         t = t.filter(x => x.status === 'OVERDUE');
    else if (dpFilter === 'EXEMPTED')        t = t.filter(x => x.status === 'EXEMPTED');
    else if (dpFilter === 'PAID')            t = t.filter(x => x.status === 'PAID');
    else if (dpFilter === 'RENT_OUTSTANDING') t = t.filter(x => x.status === 'DUE' || x.status === 'OVERDUE');
    else if (dpFilter === 'SD_PENDING')      t = t.filter(x => (x.sd_amount ?? 0) > 0 && (x.status === 'DUE' || x.status === 'OVERDUE'));
    else if (dpFilter === 'ADVANCE_PENDING') t = t.filter(x => (x.advance_amount ?? 0) > 0 && (x.status === 'DUE' || x.status === 'OVERDUE'));
    return t;
  }, [tiles, dpFilter, filterAllotmentId, isTenant]);

  // ── Derived chat tile ───────────────────────────────────────────────────────
  const chatTile = useMemo(() => tiles.find(t => t.id === chatTileId) ?? null, [tiles, chatTileId]);

  // ── Graph data ──────────────────────────────────────────────────────────────
  const graphData = useMemo(() => {
    const byMonth: Record<string, { due: number; paid: number; exempted: number; overdue: number; count: number }> = {};
    for (const t of tiles) {
      if (!byMonth[t.month]) byMonth[t.month] = { due: 0, paid: 0, exempted: 0, overdue: 0, count: 0 };
      byMonth[t.month][t.status === 'DUE' ? 'due' : t.status === 'PAID' ? 'paid' : t.status === 'EXEMPTED' ? 'exempted' : 'overdue'] += t.total_due || t.base_rent;
      byMonth[t.month].count += 1;
    }
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({
      month,
      total: data.due + data.paid + data.exempted + data.overdue,
      ...data,
    }));
  }, [tiles]);

  const maxGraphVal = useMemo(() => Math.max(...graphData.map(g => g.total), 1), [graphData]);

  // ── Panel handlers ──────────────────────────────────────────────────────────
  const openHistoryPanel = useCallback(async (tile: RentTile) => {
    if (expandedId === tile.id && activePanel === 'history') {
      setExpandedId(null); setActivePanel(null); return;
    }
    setExpandedId(tile.id); setActivePanel('history');
    setExpandedPaymentIds(new Set());
    const p = await quartersService.getRentPaymentHistoryAll(tile.allotment_id);
    setPayments(p);
  }, [expandedId, activePanel]);

  const openChatPanel = useCallback(async (tile: RentTile) => {
    if (chatTileId === tile.id) { setChatTileId(null); setClarMsg(''); return; }
    const c = await quartersService.getRentClarifications(tile.allotment_id, tile.month);
    setClarifications(c);
    setChatTileId(tile.id);
    setClarMsg('');
  }, [chatTileId]);

  const openDueDetails = useCallback(async (tile: RentTile, initialTab?: 'summary' | 'installment' | 'monthly') => {
    const detail = await quartersService.getRentDueDetail(tile.id);
    setDueModal({ tile, detail, dpFilter, initialTab });
  }, [dpFilter]);
  const handleSaveOverride = useCallback(async (override: number, remarks: string) => {
    if (!dueModal) return;
    await quartersService.applyPenaltyOverride(dueModal.tile.id, override, remarks);
    loadTiles();
  }, [dueModal, loadTiles]);

  const sendClarification = useCallback(async (tile: RentTile) => {
    if (!clarMsg.trim()) return;
    const role = isEO ? 'EO' : 'TENANT';
    const name = isEO ? 'Estate Officer' : (user?.fullName ?? 'Tenant');
    const msg = await quartersService.postRentClarification(tile.allotment_id, tile.month, clarMsg.trim(), role, name);
    setClarifications(prev => [...prev, msg]);
    setClarMsg('');
  }, [clarMsg, isEO, user?.fullName]);

  const handleUndoPayment = useCallback(async (reason: string) => {
    if (!undoPayment) return;
    await quartersService.undoRentPayment(undoPayment.tile.allotment_id, undoPayment.tile.month, undoPayment.payment.id, reason);
    setUndoPayment(null);
    setExpandedId(null); setActivePanel(null);
    loadTiles();
    showToast('Payment reversed — tile status updated.');
  }, [undoPayment, loadTiles, showToast]);

  const handlePay = useCallback(async (amount: number, mode: string) => {
    if (!payNowTile) return;
    try {
      await quartersService.submitEPayment(payNowTile.allotment_id, payNowTile.month, amount, mode);
      setPayNowTile(null);
      setPayNowOverrideAmount(undefined);
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
      loadTiles();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Payment could not be recorded.');
    }
  }, [payNowTile, loadTiles, showToast]);

  const [payNowOverrideAmount, setPayNowOverrideAmount] = useState<number | undefined>(undefined);

  const handlePaySelected = useCallback((amount: number) => {
    if (!dueModal) return;
    setPayNowOverrideAmount(amount);
    setPayNowTile(dueModal.tile);
    setDueModal(null);
  }, [dueModal]);

  const [installmentPayModal, setInstallmentPayModal] = useState<{ planId: string; rowId: string; amount: number } | null>(null);

  const handleInstallmentPay = useCallback((planId: string, rowId: string, amount: number) => {
    setInstallmentPayModal({ planId, rowId, amount });
  }, []);

  const confirmInstallmentPay = useCallback(async (mode: string) => {
    if (!installmentPayModal || !dueModal) return;
    try {
      await quartersService.payInstallmentRow(installmentPayModal.planId, installmentPayModal.rowId, installmentPayModal.amount, mode);
      setInstallmentPayModal(null);
      const refreshed = await quartersService.getRentDueDetail(dueModal.tile.id);
      setDueModal(prev => prev ? { ...prev, detail: refreshed } : null);
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
      loadTiles();
      showToast('Installment payment recorded successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Payment could not be recorded.');
    }
  }, [installmentPayModal, dueModal, loadTiles, showToast]);

  const handleBulkPay = useCallback(async (mode: string) => {
    const toPayTiles = tiles.filter(t => selectedTileIds.has(t.id));
    try {
      for (const t of toPayTiles) {
        await quartersService.submitEPayment(t.allotment_id, t.month, t.total_due - t.amount_paid, mode);
      }
      setBulkPayOpen(false);
      setSelectedTileIds(new Set());
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
      loadTiles();
      showToast(`${toPayTiles.length} payment(s) recorded successfully.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Payment could not be recorded.');
    }
  }, [tiles, selectedTileIds, loadTiles, showToast]);

  const toggleInfo = useCallback((id: string) => {
    setExpandedInfoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Paid history inline panel ──────────────────────────────────────────────
  const renderPanel = (tile: RentTile) => {
    if (expandedId !== tile.id || activePanel !== 'history') return null;
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    const modeLabel: Record<string, string> = {
      ONLINE: 'Online (UPI / Net Banking)',
      CHEQUE: 'Cheque',
      DD: 'Demand Draft',
      CASH: 'Cash',
      AUTO_DEDUCTION: 'Auto Deduction',
      EXEMPTED: 'Exempted',
    };
    const modeIcon: Record<string, LucideIcon> = {
      ONLINE: CreditCard,
      CHEQUE: CheckSquare,
      DD: FileText,
      CASH: Wallet,
      AUTO_DEDUCTION: Zap,
      EXEMPTED: Shield,
    };

    const downloadReceipt = (p: RentPayment) => {
      const rows: [string, string][] = [
        ['Quarter', `${tile.quarter_number} (${tile.bhk_config}), ${tile.block_name}`],
        ['Tenant', `${tile.tenant_name} — ${tile.tenant_designation}`],
        ['Month', fmtMonthFull(tile.month)],
        ['Due Date', fmtDate(tile.due_date)],
        ['Payment Mode', modeLabel[p.payment_mode] ?? p.payment_mode],
        ['Payment Date', fmtDate(p.payment_date)],
        ['Receipt / Ref No.', p.receipt_ref || '—'],
      ];
      const breakdown: [string, number][] = ([
        ['Base Rent', tile.base_rent],
        tile.water_charges > 0   ? ['Water Charges', tile.water_charges]   : null,
        tile.maintenance_charge > 0 ? ['Maintenance', tile.maintenance_charge] : null,
        tile.penalty_amount > 0  ? ['Penalty', tile.penalty_override ?? tile.penalty_amount] : null,
      ] as ([string, number] | null)[]).filter(Boolean) as [string, number][];
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payment Receipt</title>
<style>
body{font-family:sans-serif;max-width:480px;margin:40px auto;color:#111;font-size:14px}
h2{color:#0d9488;margin-bottom:4px}
.sub{color:#6b7280;font-size:12px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
td{padding:6px 8px;border-bottom:1px solid #f3f4f6}
td:last-child{text-align:right;font-weight:600}
.total td{background:#f0fdf4;font-weight:700;color:#0d9488;font-size:15px}
.footer{font-size:11px;color:#9ca3af;margin-top:24px;text-align:center}
</style></head><body>
<h2>Payment Acknowledgement</h2>
<div class="sub">Facility &amp; Asset Management System</div>
<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
<table>
<tr><td colspan="2" style="font-weight:700;background:#f9fafb;color:#374151">Charge Breakdown</td></tr>
${breakdown.map(([k, v]) => `<tr><td>${k}</td><td>${fmtINR(v)}</td></tr>`).join('')}
<tr class="total"><td>Amount Paid</td><td>${fmtINR(p.amount)}</td></tr>
</table>
${p.remarks ? `<p style="font-size:12px;color:#6b7280;font-style:italic">Remarks: ${p.remarks}</p>` : ''}
<div class="footer">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &middot; System-generated acknowledgement</div>
</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${tile.quarter_number}_${tile.month}_${p.receipt_ref || p.id}.html`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const togglePayment = (id: string) => {
      setExpandedPaymentIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    };

    return (
      <div ref={historyPanelRef} className="relative ml-6 mt-2 mr-2 mb-2">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-200 rounded-full" />
        <div className="space-y-2 pl-5">
          {payments.length === 0 ? (
            <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
              <Receipt size={13} className="text-gray-300" />
              No payments recorded for this period.
            </div>
          ) : (
            <>
              {payments.map(p => {
                const ModeIconComp = modeIcon[p.payment_mode] ?? Receipt;
                const netPenalty = tile.penalty_amount > 0 ? (tile.penalty_override ?? tile.penalty_amount) : 0;
                const balance = tile.total_due - totalPaid;
                const isOpen = expandedPaymentIds.has(p.id);
                return (
                  <div key={p.id} className="relative">
                    <div className="absolute -left-5 top-3.5 w-4 h-0.5 bg-teal-300 rounded-full" />
                    <div className={`absolute -left-[22px] top-3 w-2.5 h-2.5 rounded-full border-2 bg-white transition-colors ${isOpen ? 'border-teal-500 bg-teal-100' : 'border-teal-300'}`} />
                    <div className={`rounded-xl border overflow-hidden shadow-sm transition-colors ${isOpen ? 'border-teal-300' : 'border-teal-100 bg-white'}`}>

                      {/* ── Compact single-row summary (always visible) ── */}
                      <button
                        onClick={() => togglePayment(p.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        {/* Mode icon */}
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <ModeIconComp size={13} className="text-emerald-600" />
                        </div>

                        {/* Amount — primary value */}
                        <span className="text-sm font-extrabold text-gray-900 shrink-0">{fmtINR(p.amount)}</span>

                        {/* Month badge */}
                        <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded px-1.5 py-0.5 shrink-0">{fmtMonthFull(p.month)}</span>

                        {/* Divider */}
                        <span className="text-gray-200 text-sm shrink-0">|</span>

                        {/* Mode label:value */}
                        <span className="flex items-baseline gap-1 shrink-0 min-w-0">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">Mode</span>
                          <span className="text-[11px] font-semibold text-gray-700 truncate">{modeLabel[p.payment_mode] ?? p.payment_mode}</span>
                        </span>

                        {/* Divider */}
                        <span className="text-gray-200 text-sm shrink-0 hidden sm:inline">|</span>

                        {/* Paid date label:value */}
                        <span className="flex items-baseline gap-1 shrink-0 hidden sm:flex">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Paid</span>
                          <span className="text-[11px] font-semibold text-gray-700">{fmtDate(p.payment_date)}</span>
                        </span>

                        {/* Ref label:value */}
                        {p.receipt_ref && (
                          <>
                            <span className="text-gray-200 text-sm shrink-0 hidden md:inline">|</span>
                            <span className="flex items-baseline gap-1 min-w-0 hidden md:flex">
                              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">Ref</span>
                              <span className="text-[11px] font-mono text-gray-600 truncate">{p.receipt_ref}</span>
                            </span>
                          </>
                        )}

                        {/* Spacer */}
                        <span className="flex-1" />

                        {/* Action buttons — stop propagation so they don't toggle the expand */}
                        <span className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          {isEO && (
                            <button
                              onClick={() => setUndoPayment({ tile, payment: p })}
                              className="flex items-center gap-1 text-[10px] text-rose-600 border border-rose-200 bg-white rounded-lg px-1.5 py-0.5 hover:bg-rose-50 font-semibold"
                            >
                              <Undo2 size={9} /> Undo
                            </button>
                          )}
                          <button
                            onClick={() => downloadReceipt(p)}
                            className="flex items-center gap-1 text-[10px] text-teal-700 border border-teal-200 bg-white rounded-lg px-1.5 py-0.5 hover:bg-teal-50 font-semibold"
                          >
                            <Download size={9} /> Receipt
                          </button>
                        </span>

                        {/* Chevron */}
                        <ChevronDown
                          size={13}
                          className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* ── Collapsible details ── */}
                      {isOpen && (
                        <div className="border-t border-teal-200 bg-teal-50/50 grid grid-cols-2 divide-x divide-teal-100">
                          {/* Left — instrument details */}
                          <div className="px-4 py-3 space-y-2 border-l-4 border-teal-400">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Payment Details</div>
                            <div className="flex items-start gap-2">
                              <Calendar size={11} className="text-gray-400 mt-0.5 shrink-0" />
                              <div>
                                <div className="text-[10px] text-gray-400">Paid On</div>
                                <div className="text-xs font-semibold text-gray-700">{fmtDate(p.payment_date)}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Calendar size={11} className="text-gray-400 mt-0.5 shrink-0" />
                              <div>
                                <div className="text-[10px] text-gray-400">Due Date</div>
                                <div className="text-xs font-semibold text-gray-700">{fmtDate(tile.due_date)}</div>
                              </div>
                            </div>
                            {p.receipt_ref && (
                              <div className="flex items-start gap-2">
                                <Receipt size={11} className="text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-[10px] text-gray-400">Ref / Receipt No.</div>
                                  <div className="text-xs font-mono font-semibold text-gray-700 break-all">{p.receipt_ref}</div>
                                </div>
                              </div>
                            )}
                            {p.remarks && (
                              <div className="text-[10px] text-gray-500 italic pt-1 border-t border-gray-100">{p.remarks}</div>
                            )}
                            {p.recorded_by && (
                              <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-0.5">
                                <User size={9} /> Recorded by: {p.recorded_by}
                              </div>
                            )}
                          </div>

                          {/* Right — charge breakdown */}
                          <div className="px-4 py-3 space-y-1.5 bg-teal-50/30">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Charge Breakdown</div>
                            {([
                              ['Base Rent', tile.base_rent],
                              tile.water_charges > 0      && ['Water Charges', tile.water_charges],
                              tile.maintenance_charge > 0 && ['Maintenance', tile.maintenance_charge],
                              tile.sd_amount > 0          && ['Security Deposit', tile.sd_amount],
                              tile.advance_amount > 0     && ['Advance', tile.advance_amount],
                              netPenalty > 0              && ['Penalty', netPenalty],
                              (tile.discount_amount ?? 0) > 0 && ['Discount', -(tile.discount_amount!)],
                            ] as (false | [string, number])[]).filter(Boolean).map(item => {
                              const [label, amt] = item as [string, number];
                              return (
                                <div key={label} className="flex items-center justify-between text-[11px]">
                                  <span className="text-gray-500">{label}</span>
                                  <span className={`font-semibold ${amt < 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                                    {amt < 0 ? `−${fmtINR(-amt)}` : fmtINR(amt)}
                                  </span>
                                </div>
                              );
                            })}
                            <div className="flex items-center justify-between text-[11px] pt-1.5 mt-0.5 border-t border-gray-100">
                              <span className="font-bold text-gray-700">Total Due</span>
                              <span className="font-extrabold text-gray-900">{fmtINR(tile.total_due)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-emerald-700 font-semibold">Paid (this txn)</span>
                              <span className="font-bold text-emerald-700">{fmtINR(p.amount)}</span>
                            </div>
                            {balance !== 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={`font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                  {balance > 0 ? 'Balance Due' : 'Excess Paid'}
                                </span>
                                <span className={`font-bold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                  {fmtINR(Math.abs(balance))}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {payments.length > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-teal-50 rounded-xl border border-teal-100">
                  <span className="text-xs font-semibold text-teal-700">Total Paid ({payments.length} payments · all months)</span>
                  <span className="text-sm font-extrabold text-teal-700">{fmtINR(totalPaid)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Tile view — compact 2-row summary + expand/collapse detail ───────────────
  const renderTileCard = (tile: RentTile) => {
    const accentBar = STATUS_LEFT[tile.status];
    const isOpen = expandedInfoIds.has(tile.id);
    return (
      <div key={tile.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* ── Always-visible compact row ── */}
        <div className="flex items-center">
          <div className={`w-1 self-stretch shrink-0 ${accentBar}`} />
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0 cursor-pointer select-none"
            onClick={() => toggleInfo(tile.id)}
          >
            {/* Multi-select checkbox (tenant only, DUE/OVERDUE) */}
            {isTenant && (tile.status === 'DUE' || tile.status === 'OVERDUE') && (
              <div
                className="shrink-0"
                onClick={e => { e.stopPropagation(); toggleTileSelect(tile.id); }}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                  selectedTileIds.has(tile.id)
                    ? 'bg-teal-600 border-teal-600'
                    : 'border-gray-300 hover:border-teal-400 bg-white'
                }`}>
                  {selectedTileIds.has(tile.id) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            )}
            {/* Quarter + BHK */}
            <div className="min-w-0 w-28 shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-gray-900 truncate">{tile.quarter_number}</span>
                <span className="text-[9px] bg-gray-100 text-gray-500 rounded px-1 py-0.5 font-semibold shrink-0">{tile.bhk_config}</span>
                {tile.penalty_override !== null && tile.penalty_override < tile.penalty_amount && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 rounded px-1 py-0.5 font-bold shrink-0">OVR</span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 truncate">{tile.block_name}</div>
            </div>
            {/* Tenant — fixed width so it doesn't steal all middle space */}
            <div className="w-44 shrink-0 hidden sm:block min-w-0">
              <TenantChip tile={tile} onViewProfile={e => { e.stopPropagation(); setTenantProfileId(tile.tenant_id); }} />
            </div>
            {/* Info strip — fills the blank middle area */}
            <div className="flex-1 min-w-0 hidden md:flex items-center gap-x-4 gap-y-0 flex-wrap">
              {([
                { label: 'Due',       value: fmtDate(tile.due_date) },
                { label: 'Base',      value: fmtINR(tile.base_rent) },
                { label: 'Last Paid', value: tile.last_paid_date ? fmtDate(tile.last_paid_date) : null },
                { label: 'Phone',     value: tile.tenant_phone || null },
                { label: 'Area',      value: tile.location_area || null },
                { label: 'Month',     value: fmtMonth(tile.month) },
              ] as { label: string; value: string | null }[]).filter(f => f.value !== null).map(f => (
                <span key={f.label} className="flex items-center gap-1 text-[10px] whitespace-nowrap">
                  <span className="text-gray-400">{f.label}:</span>
                  <span className="text-gray-600 font-semibold">{f.value}</span>
                </span>
              ))}
            </div>
            {/* Amount due */}
            <div className="shrink-0 text-right">
              <div className={`text-sm font-extrabold ${tile.status === 'PAID' ? 'text-emerald-700' : tile.status === 'EXEMPTED' ? 'text-slate-500' : 'text-amber-700'}`}>
                {fmtINR(tile.total_due)}
              </div>
              <div className="text-[9px] text-gray-400 mt-0.5">total due</div>
            </div>
            {/* Status badge */}
            <div className="shrink-0"><StatusBadge status={tile.status} /></div>
            {/* Actions — always visible on the row */}
            <div className="shrink-0" onClick={e => e.stopPropagation()}>
              <TileActionsMenu
                tile={tile} isEO={isEO} chatTileId={chatTileId}
                expandedId={expandedId} activePanel={activePanel}
                onPayNow={setPayNowTile} onDueDetails={openDueDetails}
                onHistoryPanel={openHistoryPanel} onChatPanel={openChatPanel}
                onLogDetails={setLogTile}
              />
            </div>
            {/* Expand toggle */}
            <button
              className="shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              onClick={e => { e.stopPropagation(); toggleInfo(tile.id); }}
              aria-label={isOpen ? 'Collapse' : 'Expand'}
            >
              <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Expanded detail section ── */}
        {isOpen && (
          <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/40">
            {/* Mobile-only tenant chip */}
            <div className="sm:hidden mb-2"><TenantChip tile={tile} /></div>

            {/* Compact property strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[10px] text-gray-500 bg-white rounded-lg border border-gray-100 px-3 py-2">
              <span className="flex items-center gap-1"><Building2 size={9} className="text-teal-500 shrink-0" /><span className="font-semibold text-gray-800">{tile.quarter_number}</span><span className="text-gray-400 ml-0.5">{tile.bhk_config}</span></span>
              <span className="flex items-center gap-1"><MapPin size={9} className="text-gray-400 shrink-0" />{tile.block_name}{tile.location_area ? `, ${tile.location_area}` : ''}</span>
              {(tile.possession_date ?? tile.allotment_date) && (
                <span className="flex items-center gap-1"><Home size={9} className="text-teal-400 shrink-0" />Occupied: <span className="font-medium text-gray-700 ml-0.5">{fmtDate((tile.possession_date ?? tile.allotment_date)!)}</span></span>
              )}
              <span className="flex items-center gap-1"><Calendar size={9} className="text-gray-400 shrink-0" />Due: <span className="font-medium text-gray-700 ml-0.5">{fmtDate(tile.due_date)}</span></span>
              {tile.last_paid_date && (
                <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-emerald-400 shrink-0" />Last Paid:{tile.last_paid_amount != null ? <span className="font-semibold text-emerald-700 ml-0.5">{fmtINR(tile.last_paid_amount)}</span> : null}<span className="ml-0.5">on {fmtDate(tile.last_paid_date)}</span></span>
              )}
              {tile.tenant_phone && (
                <span className="flex items-center gap-1"><Phone size={9} className="text-gray-400 shrink-0" />{tile.tenant_phone}</span>
              )}
            </div>
          </div>
        )}
        {/* Paid history panel — visible without requiring expand */}
        {renderPanel(tile)}
      </div>
    );
  };

  // ── Table row ──────────────────────────────────────────────────────────────
  const renderTableRow = (tile: RentTile) => (
    <React.Fragment key={tile.id}>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td className="px-4 py-3">
          <div className="text-xs font-bold text-gray-900">{tile.quarter_number}</div>
          <div className="text-[10px] text-gray-400">{tile.block_name} · {tile.location_area}</div>
        </td>
        <td className="px-4 py-3"><TenantChip tile={tile} onViewProfile={e => { e.stopPropagation(); setTenantProfileId(tile.tenant_id); }} /></td>
        <td className="px-4 py-3 text-xs font-medium text-gray-700">{fmtMonth(tile.month)}</td>
        <td className="px-4 py-3 text-xs font-semibold text-gray-900 text-right">{fmtINR(tile.base_rent)}</td>
        <td className="px-4 py-3 text-xs font-bold text-amber-700 text-right">{fmtINR(tile.total_due)}</td>
        <td className="px-4 py-3 text-xs font-semibold text-red-600 text-right">{tile.penalty_amount > 0 ? fmtINR(tile.penalty_override ?? tile.penalty_amount) : '—'}</td>
        <td className="px-4 py-3"><StatusBadge status={tile.status} /></td>
        <td className="px-4 py-3">
          <TileActionsMenu
            tile={tile} isEO={isEO} chatTileId={chatTileId}
            expandedId={expandedId} activePanel={activePanel}
            onPayNow={setPayNowTile} onDueDetails={openDueDetails}
            onHistoryPanel={openHistoryPanel} onChatPanel={openChatPanel}
            onLogDetails={setLogTile}
            onShowStat={t => setStatTileId(t.id)}
          />
        </td>
      </tr>
      {expandedId === tile.id && activePanel && (
        <tr className="bg-gray-50/50">
          <td colSpan={8} className="px-4 py-0 pb-3">{renderPanel(tile)}</td>
        </tr>
      )}
    </React.Fragment>
  );

  // ── Card view — compact 2-row header + always-visible info strip + expand ──
  const renderCardItem = (tile: RentTile) => {
    const accentBar = STATUS_LEFT[tile.status];
    const isOpen = expandedInfoIds.has(tile.id);
    const amtColor = tile.status === 'PAID' ? 'text-emerald-700' : tile.status === 'EXEMPTED' ? 'text-slate-500' : 'text-amber-700';

    return (
      <div key={tile.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
        {/* ── Compact header with left accent bar ── */}
        <div className="flex overflow-hidden">
          <div className={`w-1 shrink-0 ${accentBar}`} />
          <div className="flex-1 min-w-0 px-3 pt-2.5 pb-2 cursor-pointer select-none" onClick={() => toggleInfo(tile.id)}>
            {/* Row 1: Avatar + Tenant + Quarter badge + Status */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-extrabold text-gray-600">{tile.tenant_name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate leading-tight">{tile.tenant_name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setTenantProfileId(tile.tenant_id); }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-gray-300 hover:text-teal-600 hover:bg-teal-50 transition-colors shrink-0"
                    title="View all payments for this tenant"
                  >
                    <Eye size={10} />
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 truncate leading-tight">{tile.tenant_designation}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{tile.quarter_number} · {tile.bhk_config}</span>
                <StatusBadge status={tile.status} />
              </div>
            </div>
            {/* Row 2: Amount + block + actions */}
            <div className="flex items-center justify-between mt-1.5 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className={`text-sm font-extrabold ${amtColor}`}>{fmtINR(tile.total_due)}</span>
                <span className="text-[9px] text-gray-400">due {fmtMonth(tile.month)}</span>
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5 hidden sm:flex">
                  <Building2 size={9} />{tile.block_name}
                </span>
                {tile.location_area && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 hidden md:flex">
                    <MapPin size={9} />{tile.location_area}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <TileActionsMenu
                  tile={tile} isEO={isEO} chatTileId={chatTileId}
                  expandedId={expandedId} activePanel={activePanel}
                  onPayNow={setPayNowTile} onDueDetails={openDueDetails}
                  onHistoryPanel={openHistoryPanel} onChatPanel={openChatPanel}
                  onLogDetails={setLogTile}
                  onShowStat={t => setStatTileId(t.id)}
                />
                <button
                  className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  onClick={e => { e.stopPropagation(); toggleInfo(tile.id); }}
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                >
                  <ChevronDown size={11} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Always-visible tenant + payment info strip ── */}
        <div className="border-t border-gray-100 bg-gray-50/70 px-3 py-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
          {([
            { label: 'Base Rent', value: fmtINR(tile.base_rent) },
            { label: 'Collected',  value: tile.amount_paid > 0 ? fmtINR(tile.amount_paid) : null },
            { label: 'Due Date',  value: fmtDate(tile.due_date) },
            { label: 'Last Paid', value: tile.last_paid_date ? fmtDate(tile.last_paid_date) : null },
            { label: 'Phone',     value: tile.tenant_phone || null },
          ] as { label: string; value: string | null }[]).filter(f => f.value !== null).map(f => (
            <span key={f.label} className="flex items-center gap-1 text-[10px]">
              <span className="text-gray-400 font-medium">{f.label}:</span>
              <span className="text-gray-700 font-semibold">{f.value}</span>
            </span>
          ))}
        </div>

        {/* ── Expanded charges + tenant detail section ── */}
        {isOpen && (
          <div className="border-t border-gray-100 px-3 py-2.5 bg-white">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Charges</div>
                {([
                  { label: 'Water',    value: tile.water_charges,      show: tile.water_charges > 0 },
                  { label: 'Maint.',   value: tile.maintenance_charge, show: tile.maintenance_charge > 0 },
                  { label: 'Sec. Dep', value: tile.sd_amount,          show: tile.sd_amount > 0 },
                  { label: 'Advance',  value: tile.advance_amount,     show: tile.advance_amount > 0 },
                ] as { label: string; value: number; show: boolean }[]).filter(r => r.show).map(r => (
                  <div key={r.label} className="flex justify-between items-center text-[10px] py-0.5">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="font-semibold text-gray-700">{fmtINR(r.value)}</span>
                  </div>
                ))}
                {tile.penalty_amount > 0 && (tile.penalty_override === null || tile.penalty_override > 0) && (
                  <div className="flex justify-between items-center text-[10px] py-0.5 text-red-600">
                    <span className="flex items-center gap-0.5"><AlertTriangle size={9} />Penalty{tile.penalty_override !== null ? ' (OVR)' : ''}</span>
                    <span className="font-semibold">{fmtINR(tile.penalty_override ?? tile.penalty_amount)}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Tenant</div>
                <div className="flex items-start gap-1 text-[10px] py-0.5">
                  <span className="text-gray-400 shrink-0">Dept:</span>
                  <span className="text-gray-700 font-medium leading-tight">{tile.tenant_dept || '—'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] py-0.5">
                  <span className="text-gray-400">Receipt:</span>
                  <span className="text-gray-700 font-medium">{tile.receipt_ref || '—'}</span>
                </div>
                {tile.payment_mode && (
                  <div className="flex items-center gap-1 text-[10px] py-0.5">
                    <span className="text-gray-400">Mode:</span>
                    <span className="text-gray-700 font-medium">{tile.payment_mode}</span>
                  </div>
                )}
              </div>
            </div>
            {tile.exemption_reason && (
              <div className="mt-2 text-[10px] text-slate-500 italic bg-slate-50 border border-slate-100 rounded px-2 py-1">
                Exemption: {tile.exemption_reason}
              </div>
            )}
          </div>
        )}

        {renderPanel(tile)}
      </div>
    );
  };

  // ── Graph view ──────────────────────────────────────────────────────────────
  const renderGraph = () => {
    const BAR_GROUPS = [
      { key: 'due'      as const, label: 'Due',      color: 'bg-amber-400',   hoverColor: 'hover:bg-amber-500'   },
      { key: 'overdue'  as const, label: 'Overdue',  color: 'bg-red-500',     hoverColor: 'hover:bg-red-600'     },
      { key: 'paid'     as const, label: 'Paid',     color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-600' },
      { key: 'exempted' as const, label: 'Exempted', color: 'bg-slate-300',   hoverColor: 'hover:bg-slate-400'   },
    ] as { key: keyof typeof graphData[0]; label: string; color: string; hoverColor: string }[];

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 rounded-full bg-teal-600" />
          <h3 className="text-sm font-bold text-gray-800">Payment Collection — Monthly Overview</h3>
          <div className="ml-auto flex items-center gap-3 text-[10px]">
            {BAR_GROUPS.map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-gray-600 font-medium">{label}</span>
              </span>
            ))}
          </div>
        </div>

        {graphData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No data for selected range</div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(400, graphData.length * 120)}px` }}>
              <div className="flex gap-1 items-end h-64 mb-1">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-full pr-2 text-right shrink-0 w-12">
                  {[maxGraphVal, maxGraphVal * 0.75, maxGraphVal * 0.5, maxGraphVal * 0.25, 0].map((v, i) => (
                    <span key={i} className="text-[9px] text-gray-400 leading-none">
                      {v > 0 ? `₹${Math.round(v / 1000)}K` : '0'}
                    </span>
                  ))}
                </div>

                {/* Chart area */}
                <div className="flex-1 relative h-full">
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map(p => (
                    <div key={p} className="absolute w-full border-t border-gray-100" style={{ bottom: `${p}%` }} />
                  ))}

                  {/* Month groups */}
                  <div className="flex items-end h-full gap-3 relative z-10">
                    {graphData.map(g => (
                      <div
                        key={g.month}
                        className="flex-1 flex flex-col h-full cursor-pointer"
                        onClick={() => { setMonthFrom(g.month); setMonthTo(g.month); setViewMode('tile'); }}
                      >
                        {/* Bars area */}
                        <div className="flex-1 flex items-end gap-[3px]">
                          {BAR_GROUPS.map(({ key, label, color, hoverColor }) => {
                            const val = g[key] as number;
                            const heightPct = maxGraphVal > 0 ? (val / maxGraphVal) * 100 : 0;
                            return (
                              <div key={key} className="flex-1 flex flex-col items-center justify-end h-full group/bar relative">
                                {/* Tooltip */}
                                {val > 0 && (
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-20 bg-gray-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {fmtINR(val)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                                  </div>
                                )}
                                <div
                                  className={`w-full rounded-t-sm transition-all duration-200 ${color} ${hoverColor} ${val === 0 ? 'opacity-0' : ''}`}
                                  style={{ height: `${Math.max(heightPct, val > 0 ? 2 : 0)}%` }}
                                  title={`${label}: ${fmtINR(val)}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        {/* Month label */}
                        <div className="pt-2 text-center">
                          <span className="text-[10px] font-semibold text-gray-500">{fmtMonth(g.month)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-2 text-center">Click any month to view that month's data in tile view</p>
      </div>
    );
  };

  // ── DP cards config ─────────────────────────────────────────────────────────
  const SUB_FILTERS: DpFilter[] = ['RENT_OUTSTANDING','SD_PENDING','ADVANCE_PENDING'];
  const hasActiveSubFilter = SUB_FILTERS.includes(dpFilter);

  const handleOutstandingClick = () => {
    if (outstandingExpanded) {
      setOutstandingExpanded(false);
      setDpFilter('all');
    } else {
      setOutstandingExpanded(true);
      setPaidExpanded(false);
      setDpFilter('RENT_OUTSTANDING');
    }
    setCollectionGraphOpen(false);
  };

  const statusCards = summary ? [
    { label: 'Paid', value: summary.paid_count ?? 0, subtitle: fmtINR(summary.paid_amount ?? 0), gradient: 'bg-gradient-to-r from-emerald-500 to-teal-600', dp: 'PAID' as DpFilter, icon: TrendingUp, isAccordion: true },
    { label: 'Collection Rate',  value: summary.collection_rate, subtitle: 'of demand collected',            gradient: 'bg-gradient-to-r from-teal-600 to-emerald-600',  dp: 'all'      as DpFilter, icon: BarChart2, isAccordion: false },
  ] : [];

  // Sub-DP cards under "Paid"
  const paidSubCards = summary ? [
    { label: 'Paid',           value: summary.paid_count,     subtitle: fmtINR(summary.paid_amount),     dp: 'PAID'     as DpFilter, icon: CheckCircle2, accentClass: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100', textClass: 'text-emerald-700' },
    { label: 'Exempted',       value: summary.exempted_count, subtitle: fmtINR(summary.exempted_amount), dp: 'EXEMPTED' as DpFilter, icon: Receipt,      accentClass: 'border-slate-200  bg-slate-50  hover:bg-slate-100',   textClass: 'text-slate-700' },
  ] : [];

  // Sub-DP components under Total Outstanding
  const subDpCards = summary ? [
    { label: 'Rent Due',       value: summary.total_due_count + summary.arrears_count, subtitle: fmtINR(summary.total_due_amount + summary.arrears_amount), dp: 'RENT_OUTSTANDING'    as DpFilter, icon: IndianRupee,  accentClass: 'border-amber-200  bg-amber-50  hover:bg-amber-100',  textClass: 'text-amber-700',  barColor: 'bg-amber-400' },
    { label: 'SD Pending',     value: summary.sd_pending_count,          subtitle: fmtINR(summary.sd_pending_amount),          dp: 'SD_PENDING'          as DpFilter, icon: Shield,        accentClass: 'border-blue-200   bg-blue-50   hover:bg-blue-100',   textClass: 'text-blue-700',   barColor: 'bg-blue-400' },
    { label: 'Adv. Pending',   value: summary.advance_pending_count,     subtitle: fmtINR(summary.advance_pending_amount),     dp: 'ADVANCE_PENDING'     as DpFilter, icon: Zap,           accentClass: 'border-violet-200 bg-violet-50 hover:bg-violet-100', textClass: 'text-violet-700', barColor: 'bg-violet-400' },
  ] : [];

  const views: { id: ViewMode; icon: LucideIcon; label: string }[] = [
    { id: 'table', icon: TableProperties, label: 'Table' },
    { id: 'tile',  icon: LayoutGrid,      label: 'Tile'  },
    { id: 'card',  icon: CreditCard,      label: 'Card'  },
    ...(dpFilter === 'all' ? [{ id: 'graph' as ViewMode, icon: BarChart2, label: 'Graph' }] : []),
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  const activeFilterCount = [
    locFilter,
    modeFilter !== 'ALL' ? modeFilter : '',
    tenantFilter,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setLocFilter('');
    setModeFilter('ALL');
    setTenantFilter('');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-teal-50/20">

      {/* ── Frozen header — breadcrumb, title, DP cards only ── */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
            <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-teal-600 transition-colors"><Home size={11} /></button>
            <ChevronRight size={10} />
            <button onClick={() => navigate(ROUTES.DASHBOARD)} className="text-gray-500 hover:text-teal-600 transition-colors">My Workspace</button>
            <ChevronRight size={10} />
            <span className="text-gray-700 font-medium">Payment Tracker</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-0.5 flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg">
                  <IndianRupee className="w-4 h-4 text-white" />
                </div>
                Payment Tracker
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 ml-9">Rent, SD, advances, maintenance &amp; penalties across all property types</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View switcher */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {views.map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setViewMode(id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === id ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Icon size={12} /> <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              {isEO && (
                <button
                  onClick={() => navigate(ROUTES.MT_SETUP)}
                  title="MT Setup — Payable Criteria"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
                >
                  <SlidersHorizontal size={12} /> MT Setup
                </button>
              )}
              <button className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          {/* DP Summary Cards — main row + expandable sub-DP accordion */}
          {loading ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />)}
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Total Outstanding — accordion trigger */}
                <div className="relative">
                  <button
                    onClick={handleOutstandingClick}
                    className={`w-full text-left rounded-xl overflow-hidden transition-all duration-200 group ${
                      outstandingExpanded
                        ? 'shadow-xl ring-2 ring-white ring-offset-1 ring-offset-gray-200 scale-[1.02]'
                        : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
                    } bg-gradient-to-r from-slate-800 to-gray-900 flex flex-row min-h-[80px]`}
                  >
                    {/* decorative overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full pointer-events-none" />
                    {/* Icon column */}
                    <div className="relative z-10 shrink-0 flex items-center justify-center px-3 border-r border-white/20">
                      <div className="p-2 bg-white/20 rounded-xl border border-white/30">
                        <Layers size={16} className="text-white" />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="relative z-10 flex-1 px-3 py-3 flex flex-col justify-center min-w-0 gap-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xl font-extrabold text-white leading-tight">{summary.total_outstanding_count}</p>
                        {/* Active sub-filter dot hint when collapsed */}
                        {!outstandingExpanded && hasActiveSubFilter && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="Sub-filter active" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/95 uppercase tracking-widest leading-tight truncate">Total Outstanding</p>
                        <p className="text-[10px] text-white/65 leading-tight mt-0.5 truncate">{fmtINR(summary.total_outstanding_amount)}</p>
                      </div>
                    </div>
                    {/* Chevron */}
                    <div className="relative z-10 shrink-0 flex items-center pr-3">
                      <ChevronDown
                        size={16}
                        className={`text-white/70 transition-transform duration-300 ${outstandingExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                    {/* Bottom active indicator */}
                    <div className={`absolute bottom-0 left-0 right-0 transition-all duration-200 ${outstandingExpanded ? 'h-1 bg-amber-400' : 'h-0.5 bg-white/20'}`} />
                  </button>
                  {/* Active outer ring when expanded */}
                  {outstandingExpanded && (
                    <>
                      <div className="absolute -inset-[3px] rounded-[14px] ring-2 ring-white pointer-events-none" />
                      <div className="absolute -inset-[5px] rounded-[16px] ring-2 ring-gray-800/30 pointer-events-none" />
                    </>
                  )}
                </div>

                {/* Status cards — Paid (accordion) + Collection Rate (graph toggle) */}
                {statusCards.map((c, i) => {
                  const isPaidCard = c.isAccordion;
                  const isCollRate = c.label === 'Collection Rate';
                  if (isPaidCard) {
                    return (
                      <div key={c.label} className="relative">
                        <button
                          onClick={() => {
                            const opening = !paidExpanded;
                            setPaidExpanded(opening);
                            setOutstandingExpanded(false);
                            setCollectionGraphOpen(false);
                            if (opening) setDpFilter('PAID'); else setDpFilter('all');
                          }}
                          className={`w-full text-left rounded-xl overflow-hidden transition-all duration-200 group ${
                            paidExpanded
                              ? 'shadow-xl ring-2 ring-white ring-offset-1 ring-offset-gray-200 scale-[1.02]'
                              : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
                          } ${c.gradient} flex flex-row min-h-[80px]`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
                          <div className="relative z-10 shrink-0 flex items-center justify-center px-3 border-r border-white/20">
                            <div className="p-2 bg-white/20 rounded-xl border border-white/30">
                              <TrendingUp size={16} className="text-white" />
                            </div>
                          </div>
                          <div className="relative z-10 flex-1 px-3 py-3 flex flex-col justify-center min-w-0 gap-1">
                            <p className="text-xl font-extrabold text-white leading-tight">{c.value}</p>
                            <div>
                              <p className="text-[10px] font-bold text-white/95 uppercase tracking-widest leading-tight truncate">{c.label}</p>
                              <p className="text-[10px] text-white/65 leading-tight mt-0.5 truncate">{c.subtitle}</p>
                            </div>
                          </div>
                          <div className="relative z-10 shrink-0 flex items-center pr-3">
                            <ChevronDown size={16} className={`text-white/70 transition-transform duration-300 ${paidExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          <div className={`absolute bottom-0 left-0 right-0 transition-all duration-200 ${paidExpanded ? 'h-1 bg-emerald-200' : 'h-0.5 bg-white/20'}`} />
                        </button>
                        {paidExpanded && (
                          <>
                            <div className="absolute -inset-[3px] rounded-[14px] ring-2 ring-white pointer-events-none" />
                            <div className="absolute -inset-[5px] rounded-[16px] ring-2 ring-emerald-800/20 pointer-events-none" />
                          </>
                        )}
                      </div>
                    );
                  }
                  if (isCollRate) {
                    return (
                      <SummaryStatsCard
                        key={c.label} label={c.label} value={c.value} icon={c.icon}
                        gradient={c.gradient} subtitle={c.subtitle} delay={(i + 1) * 50}
                        isActive={collectionGraphOpen}
                        onClick={() => {
                          const opening = !collectionGraphOpen;
                          setCollectionGraphOpen(opening);
                          setPaidExpanded(false);
                          setOutstandingExpanded(false);
                          if (opening) setDpFilter('all'); else setDpFilter('all');
                        }}
                      />
                    );
                  }
                  return (
                    <SummaryStatsCard
                      key={c.label} label={c.label} value={c.value} icon={c.icon}
                      gradient={c.gradient} subtitle={c.subtitle} delay={(i + 1) * 50}
                      isActive={dpFilter === c.dp}
                      onClick={() => { setCollectionGraphOpen(false); setDpFilter(dpFilter === c.dp ? 'all' : c.dp); }}
                    />
                  );
                })}
              </div>

              {/* ── Accordion sub-panel: slides open under Total Outstanding card ── */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  outstandingExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="relative pt-1 pb-2">
                  <div className="absolute top-0 left-0 right-0 h-px bg-slate-200" />
                  <div className="absolute -top-[5px] left-[10%] -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-200" />
                  <div className="absolute -top-[3px] left-[10%] -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[5px] border-l-transparent border-r-transparent border-b-white" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                  {subDpCards.map((c) => {
                    const Icon = c.icon;
                    const isActive = dpFilter === c.dp;
                    return (
                      <button
                        key={c.dp}
                        onClick={() => setDpFilter(dpFilter === c.dp ? 'RENT_OUTSTANDING' : c.dp)}
                        className={`text-left rounded-md px-2 py-1.5 border-2 transition-all duration-150 ${c.accentClass} ${
                          isActive ? 'shadow-md ring-2 ring-current/25 scale-[1.02]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon size={9} className={`${c.textClass} shrink-0`} />
                          <span className={`text-[8px] font-bold uppercase tracking-wide ${c.textClass} truncate`}>{c.label}</span>
                        </div>
                        <div className={`text-sm font-extrabold leading-tight ${c.textClass}`}>{c.value}</div>
                        <div className={`text-[8px] font-medium ${c.textClass} opacity-80 truncate`}>{c.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Accordion sub-panel: slides open under Paid card ── */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  paidExpanded ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="relative pt-1 pb-2">
                  <div className="absolute top-0 left-0 right-0 h-px bg-emerald-200" />
                  <div className="absolute -top-[5px] left-[50%] -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[6px] border-l-transparent border-r-transparent border-b-emerald-200" />
                  <div className="absolute -top-[3px] left-[50%] -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[5px] border-l-transparent border-r-transparent border-b-white" />
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-w-lg">
                  {paidSubCards.map((c) => {
                    const Icon = c.icon;
                    const isActive = dpFilter === c.dp;
                    return (
                      <button
                        key={c.dp}
                        onClick={() => setDpFilter(dpFilter === c.dp ? 'all' : c.dp)}
                        className={`text-left rounded-md px-2 py-1.5 border-2 transition-all duration-150 ${c.accentClass} ${
                          isActive ? 'shadow-md ring-2 ring-current/25 scale-[1.02]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon size={9} className={`${c.textClass} shrink-0`} />
                          <span className={`text-[8px] font-bold uppercase tracking-wide ${c.textClass} truncate`}>{c.label}</span>
                        </div>
                        <div className={`text-sm font-extrabold leading-tight ${c.textClass}`}>{c.value}</div>
                        <div className={`text-[8px] font-medium ${c.textClass} opacity-80 truncate`}>{c.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Mini bar chart — anchored below Collection Rate card ── */}


            </div>
          ) : null}
        </div>
      </div>

      {/* ── Scrollable body wrapped in SplitLayout for chat right panel ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SplitLayout
          storageKey="rentTrackerSplit"
          defaultSplit={65}
          minLeft={40}
          maxLeft={85}
          onClose={() => { setChatTileId(null); setClarMsg(''); }}
          renderRight={chatTileId && chatTile ? (controls) => (
            <RentChatPanel
              tile={chatTile}
              clarifications={clarifications}
              clarMsg={clarMsg}
              isEO={isEO}
              controls={controls}
              deliveryMode={rentChatDeliveryMode}
              onDeliveryModeChange={setRentChatDeliveryMode}
              onChange={setClarMsg}
              onSend={() => sendClarification(chatTile)}
            />
          ) : undefined}
          left={
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          {/* ── Filter bar — below DP cards ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-1.5">
            <div className="flex items-stretch divide-x divide-gray-100">

              {/* Search input */}
              <div className="px-4 py-2.5 flex flex-col gap-1 justify-center" style={{ minWidth: 180 }}>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold leading-none">Search</span>
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Tenant name or quarter…"
                    value={tenantFilter}
                    onChange={e => setTenantFilter(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') loadTiles(); }}
                    className="flex-1 min-w-0 text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:outline-none placeholder-gray-300"
                  />
                </div>
              </div>

              {/* Collection breakdown chip-bars — visible when Collection Rate DP is active */}
              {summary && collectionGraphOpen && (
                <div className="flex-1 flex items-center gap-1 px-3 py-2 min-w-0">
                  {([
                    { label: 'Due',      count: summary.total_due_count, amount: fmtINR(summary.total_due_amount), dp: 'DUE'      as DpFilter, fill: 'bg-amber-400',   text: 'text-amber-700',   activeBg: 'bg-amber-50',   activeBorder: 'border-amber-300'   },
                    { label: 'Overdue',  count: summary.arrears_count,   amount: fmtINR(summary.arrears_amount),   dp: 'OVERDUE'  as DpFilter, fill: 'bg-red-400',     text: 'text-red-700',     activeBg: 'bg-red-50',     activeBorder: 'border-red-300'     },
                    { label: 'Paid',     count: summary.paid_count,      amount: fmtINR(summary.paid_amount),      dp: 'PAID'     as DpFilter, fill: 'bg-emerald-400', text: 'text-emerald-700', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-300' },
                    { label: 'Exempted', count: summary.exempted_count,  amount: fmtINR(summary.exempted_amount),  dp: 'EXEMPTED' as DpFilter, fill: 'bg-slate-400',   text: 'text-slate-500',   activeBg: 'bg-slate-50',   activeBorder: 'border-slate-300'   },
                  ] as const).map(b => {
                    const isActive = dpFilter === b.dp;
                    const maxCount = Math.max(summary.total_due_count, summary.arrears_count, summary.paid_count, summary.exempted_count, 1);
                    const pct = Math.max((b.count / maxCount) * 100, b.count > 0 ? 5 : 0);
                    return (
                      <button
                        key={b.dp}
                        onClick={() => setDpFilter(dpFilter === b.dp ? 'all' : b.dp)}
                        title={`${b.label}: ${b.count} (${b.amount})`}
                        className={`flex-1 flex flex-col gap-0.5 rounded-lg px-2 py-1.5 border transition-all duration-150 min-w-0 ${
                          isActive ? `${b.activeBg} ${b.activeBorder}` : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-semibold leading-none truncate ${isActive ? b.text : 'text-gray-500'}`}>{b.label}</span>
                          <span className={`text-[9px] font-extrabold leading-none ml-1 shrink-0 ${b.text}`}>{b.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${b.fill} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[8px] leading-none truncate ${isActive ? b.text : 'text-gray-400'}`}>{b.amount}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Filter + Apply action buttons */}
              <div className="flex items-center gap-2 px-3 py-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFilters(f => !f)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium ${activeFilterCount > 0 ? 'border-blue-300 text-blue-600 bg-blue-50' : ''}`}
                  title="Filters"
                >
                  <SlidersHorizontal size={15} />
                  <span className="hidden sm:inline text-xs">Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={loadTiles}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  <Search size={15} />
                  <span className="hidden sm:inline">Apply</span>
                </button>
              </div>

            </div>
          </div>

            {/* Tenant bulk-select quick actions */}
            {isTenant && displayTiles.some(t => t.status === 'DUE' || t.status === 'OVERDUE') && (
              <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-2 mb-1.5">
                <button
                  onClick={selectAllDue}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-teal-200 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <CheckSquare size={11} /> Select All Due
                </button>
                {selectedTileIds.size > 0 && (
                  <>
                    <button
                      onClick={() => setBulkPayOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Wallet size={11} /> Pay {selectedTileIds.size} Selected
                    </button>
                    <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
                  </>
                )}
              </div>
            )}

            {/* Filter drawer — rich popup */}
            <FilterDrawer
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              title="Search Filters"
              activeFilterCount={activeFilterCount}
              onClearAll={clearAllFilters}
            >
              {/* Tenant / Quarter search */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Tenant / Quarter</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name or quarter number…"
                    value={tenantFilter}
                    onChange={e => setTenantFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-300 outline-none transition-all"
                  />
                  {tenantFilter && (
                    <button onClick={() => setTenantFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Location (Estate / Block)</label>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Block B, Sarojini Nagar…"
                    value={locFilter}
                    onChange={e => setLocFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-300 outline-none transition-all"
                  />
                  {locFilter && (
                    <button onClick={() => setLocFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Rent Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Rent Duration (Month Range)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-500 mb-1 block">From</span>
                    <input
                      type="month"
                      value={monthFrom}
                      onChange={e => setMonthFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 mb-1 block">To</span>
                    <input
                      type="month"
                      value={monthTo}
                      onChange={e => setMonthTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ALL', 'ONLINE', 'CHEQUE', 'DD', 'CASH', 'AUTO_DEDUCTION', 'EXEMPTED'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModeFilter(m)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        modeFilter === m
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'
                      }`}
                    >
                      {m === 'ALL' ? 'All Modes' : m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <button
                type="button"
                onClick={() => { loadTiles(); setShowFilters(false); }}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                Apply Filters
              </button>
            </FilterDrawer>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />)}
            </div>
          ) : displayTiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-16 text-center">
              <Receipt size={28} className="text-gray-200 mx-auto mb-3" />
              <div className="text-sm font-semibold text-gray-500">No rent records match the current filters</div>
              <button onClick={() => { setDpFilter('all'); setTenantFilter(''); setLocFilter(''); setModeFilter('ALL'); }}
                className="mt-4 text-xs text-teal-600 hover:underline font-medium">Clear all filters</button>
            </div>
          ) : viewMode === 'graph' ? renderGraph()
            : viewMode === 'table' ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Quarter','Tenant','Month','Rent','Total Due','Penalty','Status','Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>{displayTiles.map(renderTableRow)}</tbody>
                  </table>
                </div>
              </div>
            ) : viewMode === 'tile' ? (
              <div className="space-y-3">{displayTiles.map(t => renderTileCard(t))}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{displayTiles.map(t => renderCardItem(t))}</div>
            )}

        </div>
            </div>
          }
        />
      </div>

      {/* Toast notifications */}
      {paySuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500">
          <CheckCircle2 size={18} /> Payment recorded successfully
        </div>
      )}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-white ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'
        }`}>
          <CheckCircle2 size={18} /> {toast.msg}
        </div>
      )}

      {/* Modals */}
      {logTile && (
        <LogDetailsModal
          title={`Payment Log — ${logTile.quarter_number}`}
          subtitle={`${logTile.tenant_name} · ${logTile.location_area ?? ''} · ${fmtMonth(logTile.month)}`}
          entries={[
            ...(logTile.last_paid_date ? [{
              id: 'last-pay',
              timestamp: new Date(logTile.last_paid_date).toISOString(),
              actorRole: logTile.payment_mode ?? 'system',
              message: `Payment of ${fmtINR(logTile.last_paid_amount ?? logTile.amount_paid)} received via ${logTile.payment_mode ?? 'N/A'}${logTile.receipt_ref ? ` (Ref: ${logTile.receipt_ref})` : ''}.`,
              tag: logTile.status,
              tagColor: (logTile.status === 'PAID' ? 'emerald' : logTile.status === 'OVERDUE' ? 'red' : 'amber') as LogEntry['tagColor'],
            }] : []),
            ...(logTile.exemption_reason ? [{
              id: 'exemption',
              timestamp: logTile.allotment_date ?? new Date().toISOString(),
              actorRole: 'system',
              message: `Exempted: ${logTile.exemption_reason}`,
              tag: 'EXEMPTED',
              tagColor: 'gray' as LogEntry['tagColor'],
            }] : []),
          ]}
          onClose={() => setLogTile(null)}
        />
      )}
      {tenantProfileId && (
        <TenantPaymentProfileModal
          tenantId={tenantProfileId}
          tiles={tiles}
          onClose={() => setTenantProfileId(null)}
        />
      )}
      {dueModal && (
        <DueDetailsModal tile={dueModal.tile} detail={dueModal.detail} isEO={isEO}
          penaltyMaxDiscountPct={penaltyMaxDiscountPct}
          dpFilter={dueModal.dpFilter}
          initialTab={dueModal.initialTab}
          onClose={() => setDueModal(null)} onSave={handleSaveOverride}
          onPayInstallment={!isEO ? handleInstallmentPay : undefined}
          onPaySelected={!isEO ? handlePaySelected : undefined} />
      )}
      {installmentPayModal && (
        <InstallmentPayModal
          amount={installmentPayModal.amount}
          onClose={() => setInstallmentPayModal(null)}
          onPay={confirmInstallmentPay}
        />
      )}
      {payNowTile && (
        <PayNowModal tile={payNowTile} lockedAmount={payNowOverrideAmount} onClose={() => { setPayNowTile(null); setPayNowOverrideAmount(undefined); }} onPay={handlePay} />
      )}
      {undoPayment && (
        <UndoModal payment={undoPayment.payment} onClose={() => setUndoPayment(null)} onConfirm={handleUndoPayment} />
      )}
      {bulkPayOpen && selectedTileIds.size > 0 && (
        <BulkPayModal
          tiles={tiles.filter(t => selectedTileIds.has(t.id))}
          onClose={() => setBulkPayOpen(false)}
          onPay={handleBulkPay}
        />
      )}

      {/* ── Tenant floating bulk-pay action bar ── */}
      {isTenant && selectedTileIds.size > 0 && !bulkPayOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white rounded-2xl px-5 py-3 shadow-2xl border border-white/10 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-[10px] font-bold shrink-0">{selectedTileIds.size}</span>
            <span className="text-sm font-medium">
              {selectedTileIds.size} selected ·{' '}
              <span className="font-bold text-teal-300">
                {fmtINR(tiles.filter(t => selectedTileIds.has(t.id)).reduce((s, t) => s + (t.total_due - t.amount_paid), 0))}
              </span>
            </span>
          </div>
          <div className="h-5 w-px bg-white/20" />
          <button
            onClick={() => setBulkPayOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold transition-colors"
          >
            <Wallet size={12} /> Pay Selected
          </button>
          <button
            onClick={selectAllDue}
            className="text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            Select all due
          </button>
          <button
            onClick={clearSelection}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
