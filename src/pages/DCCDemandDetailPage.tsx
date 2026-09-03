import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, MapPin, Users, Building2,
  Calendar, Clock, AlertTriangle, CheckCircle2, Wallet, Download,
  Loader2, X, Layers, AlertCircle, History,
  MessageSquareWarning, Receipt,
  Plus, Save, FileSpreadsheet, Filter, CalendarDays,
  CreditCard, Smartphone, Building, Banknote, Lock,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { ROUTES } from '../constants/routes';
import type { DccTile, DccPayment, DccDemand, DccInstallmentPlan, DccInstallmentRow } from '../types/dcc';
import type { PaymentMode } from '../types/payableCriteria';
import { ALL_PAYMENT_MODES, PAYMENT_MODE_LABELS } from '../types/payableCriteria';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { generatePaymentReceipt, receiptNumber } from '../utils/dccReceipt';
import {
  DCC_STATUS, DCC_INPUT_CLS, DCC_LABEL_CLS,
  fmtINR, fmtDate, fmtDateShort,
} from '../constants/dccTheme';
import { getDemandComponentConfig } from '../constants/demandComponents';

type StatusKey = DccTile['status'];

// Demand type codes that use the Instalment view as their primary (and only) transaction tab.
// All other codes (RENT, PROPERTY_TAX, MAINTENANCE, INSURANCE, SD, ADVANCE) use the Demand Due view.
const INSTALLMENT_DEMAND_CODES = new Set(['LOAN']);
const isInstalmentType = (code: string): boolean => INSTALLMENT_DEMAND_CODES.has(code);

// Early-payment discount matrix: >=15 days early = 5%, >=7 days early = 2.5%
const computeEarlyPayDiscount = (dueDate: string, paymentDate: string, grossAmount: number): { pct: number; discount: number; adjusted: number; daysEarly: number } => {
  const due = new Date(dueDate);
  const paid = new Date(paymentDate);
  const diffMs = due.getTime() - paid.getTime();
  const daysEarly = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (daysEarly >= 15) {
    const disc = Math.round(grossAmount * 0.05);
    return { pct: 5, discount: disc, adjusted: grossAmount - disc, daysEarly };
  }
  if (daysEarly >= 7) {
    const disc = Math.round(grossAmount * 0.025);
    return { pct: 2.5, discount: disc, adjusted: grossAmount - disc, daysEarly };
  }
  return { pct: 0, discount: 0, adjusted: grossAmount, daysEarly };
};

// Context-driven tabs: Demand Due OR Instalment (mutually exclusive), plus Paid History and Dispute Log
type Tab = 'demand_due' | 'installments' | 'paid_history' | 'dispute';

interface DCCDemandDetailModalProps {
  demandId: string;
  onClose: () => void;
  initialTab?: Tab;
}

export const DCCDemandDetailModal: React.FC<DCCDemandDetailModalProps> = ({ demandId, onClose, initialTab }) => {

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const [demand, setDemand] = useState<DccDemand | null>(null);
  const [tile, setTile] = useState<DccTile | null>(null);
  const [payments, setPayments] = useState<DccPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Installment plan state (loaded for all demands, but only shown for instalment-type demands)
  const [instPlan, setInstPlan] = useState<DccInstallmentPlan | null>(null);
  const [instRows, setInstRows] = useState<DccInstallmentRow[]>([]);
 const [instLoading, setInstLoading] = useState(false);
  const [instError, setInstError] = useState<string | null>(null);

  // Default tab is set after load once we know the demand type code
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'demand_due');

  // Payment form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<string>('EPAY');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [paying, setPaying] = useState(false);

  // Dispute form
  const [disputeDate, setDisputeDate] = useState(new Date().toISOString().slice(0, 10));
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeRemarks, setDisputeRemarks] = useState('');
  const [disputing, setDisputing] = useState(false);

  // Installment plan form
  const [showInstForm, setShowInstForm] = useState(false);
  const [payingRowId, setPayingRowId] = useState<string | null>(null);

  // Role-based permissions
  const { user } = useAuthStore();
  const canManagePlan = user?.role === 'manager' || user?.role === 'admin';
  const canRecordPayment = user?.role === 'manager' || user?.role === 'admin';
  const isGovtOfficial = user?.role === 'govt_official' || user?.role === 'dept_user' || user?.role === 'public';

  // Unified payment modal (handles both manager record-payment and demo mock payment)
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalMode, setPayModalMode] = useState<string>('UPI');
  const [payModalStep, setPayModalStep] = useState<'select' | 'processing' | 'done'>('select');
  const [payModalAmount, setPayModalAmount] = useState(0);
  const [payModalLabel, setPayModalLabel] = useState<string>('');
  const [payModalRowId, setPayModalRowId] = useState<string | null>(null);
  const [payModalRef, setPayModalRef] = useState('');
  const [payModalRemarks, setPayModalRemarks] = useState('');
  const [payModalDate, setPayModalDate] = useState(new Date().toISOString().slice(0, 10));
  const [payModalRecording, setPayModalRecording] = useState(false);

  const PAY_MODAL_METHODS = [
    { key: 'UPI', label: 'UPI', icon: Smartphone, desc: 'Pay via UPI ID or QR' },
    { key: 'NETBANKING', label: 'Net Banking', icon: Building, desc: 'Bank transfer' },
    { key: 'CARD', label: 'Debit / Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
    { key: 'WALLET', label: 'Wallet', icon: Wallet, desc: 'Paytm, PhonePe, etc.' },
    { key: 'CHEQUE', label: 'Cheque', icon: Banknote, desc: 'Cheque payment' },
  ] as const;

  // Installment form fields
  const [instStartDate, setInstStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [instLateFee, setInstLateFee] = useState('0');
  const [instDueDaysLate, setInstDueDaysLate] = useState('0');
  const [instInterestPct, setInstInterestPct] = useState('0.00');
  const [instDiscountFullPct, setInstDiscountFullPct] = useState('0.00');
  const [instGstPct, setInstGstPct] = useState('0.00');
  const [instGstType, setInstGstType] = useState<'inclusive' | 'exclusive'>('inclusive');
  const [instNumInstallments, setInstNumInstallments] = useState(2);
  const [instRowFilter, setInstRowFilter] = useState<'ALL' | 'PENDING'>('ALL');
  const [instSuccess, setInstSuccess] = useState<string | null>(null);

  // Bulk select for demand due
  const [selectedDueRows, setSelectedDueRows] = useState<Set<number>>(new Set());
  const [bulkPaying, setBulkPaying] = useState(false);

  // Demand Details popover

  // Receipt download
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const balancePayment = tile?.amount_due ?? 0;

  // Editable installment schedule rows
  const [instEditRows, setInstEditRows] = useState<Array<{
    row_number: number; label: string; percentage: number; amount: number;
    discount: number; penalty: number; gst_amount: number; net_payable: number;
    due_date: string; due_with_late_fee: string | null;
  }>>([]);

  const regenerateSchedule = useCallback(() => {
    const total = balancePayment;
    const n = instNumInstallments;
    if (n <= 0 || total <= 0) { setInstEditRows([]); return; }
    const perPct = 100 / n;
    const perAmt = total / n;
    const isExcl = instGstType === 'exclusive';
    const gstRate = parseFloat(instGstPct) || 0;
    const lateFee = parseFloat(instLateFee) || 0;
    const dueDays = parseInt(instDueDaysLate) || 0;
    const discFullPct = parseFloat(instDiscountFullPct) || 0;

    const rows: typeof instEditRows = [];
    const fullDisc = Math.round(total * discFullPct / 100);
    const fullGst = isExcl ? Math.round((total - fullDisc) * gstRate / 100) : 0;
    rows.push({
      row_number: 0, label: 'Full Payment', percentage: 100, amount: total,
      discount: fullDisc, penalty: 0, gst_amount: fullGst,
      net_payable: total - fullDisc + fullGst,
      due_date: instStartDate, due_with_late_fee: null,
    });
    for (let i = 1; i <= n; i++) {
      const due = new Date(instStartDate);
      due.setMonth(due.getMonth() + (i - 1));
      const dueWithLate = new Date(due);
      dueWithLate.setDate(dueWithLate.getDate() + dueDays);
      const instGst = isExcl ? Math.round(perAmt * gstRate / 100) : 0;
      rows.push({
        row_number: i, label: `Installment ${i}`, percentage: perPct, amount: perAmt,
        discount: 0, penalty: lateFee, gst_amount: instGst,
        net_payable: perAmt + instGst,
        due_date: due.toISOString().split('T')[0],
        due_with_late_fee: dueDays > 0 ? dueWithLate.toISOString().split('T')[0] : null,
      });
    }
    setInstEditRows(rows);
  }, [balancePayment, instNumInstallments, instGstType, instGstPct, instLateFee, instDueDaysLate, instDiscountFullPct, instStartDate]);

  useEffect(() => { regenerateSchedule(); }, [regenerateSchedule]);

  const updateInstRow = (idx: number, field: 'percentage' | 'amount' | 'due_date', value: string) => {
    setInstEditRows(prev => {
      const next = [...prev];
      if (field === 'due_date') {
        next[idx] = { ...next[idx], due_date: value };
      } else {
        const numVal = parseFloat(value) || 0;
        next[idx] = { ...next[idx], [field]: numVal };
        if (field === 'percentage' && next[idx].row_number > 0 && numVal > 0) {
          next[idx].amount = Math.round((balancePayment * numVal / 100) * 100) / 100;
        }
        const isExcl = instGstType === 'exclusive';
        const gstRate = parseFloat(instGstPct) || 0;
        next[idx].gst_amount = isExcl ? Math.round(next[idx].amount * gstRate / 100) : 0;
        next[idx].net_payable = next[idx].amount + next[idx].gst_amount - (next[idx].discount || 0);
      }
      return next;
    });
  };

  const instPctTotal = instEditRows.filter(r => r.row_number > 0).reduce((s, r) => s + r.percentage, 0);
  const instPctValid = Math.abs(instPctTotal - 100) < 0.01;
  const instAmtTotal = instEditRows.filter(r => r.row_number > 0).reduce((s, r) => s + r.amount, 0);
  const instAmtValid = Math.abs(instAmtTotal - balancePayment) < 0.50;

  const load = useCallback(async () => {
    if (!demandId) return;
    setLoading(true);
    setError(null);
    try {
      const [allTiles, pays, instData] = await Promise.all([
        dccService.getTiles({ object_id: undefined }),
        dccService.getPayments(demandId),
        dccService.getInstallmentPlan(demandId),
      ]);
      const foundTile = allTiles.find(t => t.id === demandId);
      setTile(foundTile ?? null);

      const { data: demandData } = await supabase
        .from('dcc_demands')
        .select('*, object:object_id(*, owner:owner_id(*)), owner:owner_id(*), demand_type:demand_type_id(*)')
        .eq('id', demandId)
        .maybeSingle();
      setDemand(demandData as DccDemand | null);

      setPayments(pays);
      setInstPlan(instData.plan);
      setInstRows(instData.rows);
      if (foundTile) {
        setPayAmount(foundTile.amount_due);
        // Set default tab based on demand type code (only if no explicit initialTab was passed)
        if (!initialTab) {
          setActiveTab(isInstalmentType(foundTile.demand_type_code) ? 'installments' : 'demand_due');
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demand');
    } finally {
      setLoading(false);
    }
  }, [demandId]);

  const loadInstallments = useCallback(async () => {
    if (!demandId) return;
    setInstLoading(true);
    setInstError(null);
    try {
      const instData = await dccService.getInstallmentPlan(demandId);
      setInstPlan(instData.plan);
      setInstRows(instData.rows);
    } catch (e: unknown) {
      setInstError(e instanceof Error ? e.message : 'Failed to load installment plan');
    } finally {
      setInstLoading(false);
    }
  }, [demandId]);

  const handleCreatePlan = async () => {
    if (!demandId || !tile || !canManagePlan) return;
    if (!instStartDate) { setError('Installment start date is required'); return; }
    if (instNumInstallments < 1) { setError('Number of installments must be at least 1'); return; }
    if (!instPctValid) { setError(`Installment percentages must total 100% (currently ${instPctTotal.toFixed(2)}%)`); return; }
    if (!instAmtValid) { setError(`Installment amounts must total ${fmtINR(balancePayment)} (currently ${fmtINR(instAmtTotal)})`); return; }
    setInstLoading(true);
    setActionError(null);
    setInstSuccess(null);
    try {
      const config = {
        noOfInstallments: instNumInstallments,
        installmentStartDate: instStartDate,
        lateFee: parseFloat(instLateFee) || 0,
        dueDaysWithLateFee: parseInt(instDueDaysLate) || 0,
        interestPctPa: parseFloat(instInterestPct) || 0,
        discountFullPaymentPct: parseFloat(instDiscountFullPct) || 0,
        gstPct: parseFloat(instGstPct) || 0,
        gstType: instGstType,
        balancePayment,
      };
      const customRows = instEditRows.map(r => ({
        row_number: r.row_number,
        label: r.label,
        percentage: r.percentage,
        amount: r.amount,
        due_date: r.due_date,
        late_fee: r.penalty,
        due_date_with_late_fee: r.due_with_late_fee,
        gst_amount: r.gst_amount,
      }));
      await dccService.createInstallmentPlan(demandId, config, customRows);
      setShowInstForm(false);
      setInstSuccess('Installment plan created successfully.');
      await loadInstallments();
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to create installment plan');
    } finally {
      setInstLoading(false);
    }
  };

  const handlePayInstallment = async (row: DccInstallmentRow) => {
    if (!demandId || !tile) return;
    setPayModalAmount(row.remaining_amount);
    setPayModalLabel(row.label);
    setPayModalRowId(row.id);
    setPayModalStep('select');
    setPayModalMode('UPI');
    setPayModalRef('');
    setPayModalRemarks('');
    setPayModalDate(new Date().toISOString().slice(0, 10));
    setShowPayModal(true);
  };

  const handleConfirmPayModal = async () => {
    if (!demandId || !tile || !payModalRowId) return;
    if (canRecordPayment) {
      setPayModalRecording(true);
      setActionError(null);
      try {
        await dccService.payInstallmentRow(payModalRowId, payModalAmount, payModalDate);
        await dccService.submitPayment(
          demandId,
          tile.object_id,
          payModalAmount,
          payModalMode,
          payModalDate,
          payModalRef || undefined,
          payModalRemarks || undefined,
        );
        setShowPayModal(false);
        setPayModalStep('select');
        await loadInstallments();
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : 'Failed to record payment');
      } finally {
        setPayModalRecording(false);
      }
    } else {
      setPayModalStep('processing');
      setTimeout(() => setPayModalStep('done'), 2000);
    }
  };

  useEffect(() => { load(); }, [load]);

  const handlePay = async () => {
    if (!demandId || !tile || payAmount <= 0) return;
    if (!canRecordPayment) {
      setPayModalAmount(payAmount);
      setPayModalLabel('Full Payment');
      setPayModalRowId(null);
      setPayModalStep('select');
      setPayModalMode('UPI');
      setPayModalRef('');
      setPayModalRemarks('');
      setPayModalDate(new Date().toISOString().slice(0, 10));
      setShowPayModal(true);
      return;
    }
    setPaying(true);
    setActionError(null);
    try {
      await dccService.submitPayment(
        demandId,
        tile.object_id,
        payAmount,
        payMode,
        payDate,
        payRef || undefined,
        payRemarks || undefined,
      );
      setShowPayForm(false);
      setPayRef('');
      setPayRemarks('');
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleBulkPay = async () => {
    if (!demandId || !tile || selectedDueRows.size === 0) return;
    const config = getDemandComponentConfig(tile.demand_type_code, tile.object_type);
    const isMonthly = config.cadence === 'monthly';
    const penaltyPct = 0.02;

    const allRows = isMonthly ? (() => {
      const runDate = new Date(tile.demand_run_date);
      const monthlyAmount = Math.round(tile.total_amount / 12);
      const out: Array<{ sno: number; total: number; status: typeof tile.status }> = [];
      for (let i = 0; i < 12; i++) {
        const isPaid = i < Math.floor((tile.amount_paid / tile.total_amount) * 12);
        const isOverdue = !isPaid && new Date(tile.due_date) < new Date();
        const status = isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'DUE';
        const charges: Record<string, number> = {};
        for (const comp of config.components) {
          charges[comp.key] = Math.round(monthlyAmount * comp.ratio);
        }
        charges['penalty'] = status === 'OVERDUE' ? Math.round(monthlyAmount * penaltyPct) : 0;
        out.push({ sno: i + 1, total: Object.values(charges).reduce((s, v) => s + v, 0), status });
      }
      return out;
    })() : [{ sno: 1, total: tile.amount_due, status: tile.status }];

    const selectedTotal = allRows.filter(r => selectedDueRows.has(r.sno) && r.status !== 'PAID').reduce((s, r) => s + r.total, 0);
    if (selectedTotal <= 0) return;

    if (!canRecordPayment) {
      setPayModalAmount(selectedTotal);
      setPayModalLabel(`${selectedDueRows.size} selected entries`);
      setPayModalRowId(null);
      setPayModalStep('select');
      setPayModalMode('UPI');
      setPayModalRef('');
      setPayModalRemarks('');
      setPayModalDate(new Date().toISOString().slice(0, 10));
      setShowPayModal(true);
      return;
    }
    setBulkPaying(true);
    setActionError(null);
    try {
      await dccService.submitPayment(
        demandId,
        tile.object_id,
        selectedTotal,
        payMode,
        new Date().toISOString().slice(0, 10),
        `Bulk payment for ${selectedDueRows.size} entries`,
        undefined,
      );
      setSelectedDueRows(new Set());
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Bulk payment failed');
    } finally {
      setBulkPaying(false);
    }
  };

  const handleDispute = async () => {
    if (!demandId || !disputeReason.trim()) return;
    setDisputing(true);
    setActionError(null);
    try {
      await dccService.setDispute(demandId, disputeDate, disputeReason, disputeRemarks);
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to set dispute');
    } finally {
      setDisputing(false);
    }
  };

  const handleDownload = () => {
    if (!tile) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Demand Statement — ${tile.object_ref}</title>
    <style>body{font-family:sans-serif;font-size:13px;color:#1e293b;margin:32px}h2{margin:0 0 4px;color:#1e293b}p{margin:2px 0;color:#64748b;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}.footer{margin-top:12px;text-align:right;font-weight:700;font-size:14px;color:#b45309}</style></head>
    <body><h2>Demand Statement — ${tile.object_ref}</h2>
    <p>Owner: ${tile.owner_name} · ${tile.owner_contact}</p>
    <p>Type: ${tile.demand_type_label} · Run Date: ${fmtDate(tile.demand_run_date)}</p>
    <table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
    <tr><td>Total Amount</td><td>${fmtINR(tile.total_amount)}</td></tr>
    <tr><td>Amount Paid</td><td>${fmtINR(tile.amount_paid)}</td></tr>
    <tr><td>Amount Due</td><td>${fmtINR(tile.amount_due)}</td></tr>
    <tr><td>Due Date</td><td>${fmtDate(tile.due_date)}</td></tr>
    <tr><td>Overdue Amount</td><td>${fmtINR(tile.overdue_amount)}</td></tr>
    <tr><td>Last Paid</td><td>${tile.last_paid_date ? fmtINR(tile.last_paid_amount ?? 0) + ' on ' + fmtDate(tile.last_paid_date) : '—'}</td></tr>
    </tbody></table>
    <div class="footer">Total Outstanding: ${fmtINR(tile.amount_due)}</div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Demand_${tile.object_ref}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  if (error || !tile) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center">
          <AlertTriangle size={28} className="mb-2 text-red-400" />
          <span className="text-sm font-medium text-slate-600">{error ?? 'Demand not found'}</span>
          <button onClick={onClose} className="mt-3 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  const st = DCC_STATUS[tile.status];
  const isPaidOrExempted = tile.status === 'PAID' || tile.status === 'EXEMPTED';
  const hasDispute = !!(demand?.dispute_date);

  // Context-driven tabs: Demand Due OR Instalment (mutually exclusive), based on demand type code
  const demandTypeCode = tile?.demand_type_code ?? '';
  const showInstalmentTab = isInstalmentType(demandTypeCode);
  const showDemandDueTab = !showInstalmentTab;

  const TABS: { key: Tab; label: string; icon: typeof History }[] = [
    ...(showDemandDueTab ? [{ key: 'demand_due' as Tab, label: 'Demand Due', icon: CalendarDays }] : []),
    ...(showInstalmentTab ? [{ key: 'installments' as Tab, label: 'Instalment', icon: Layers }] : []),
    { key: 'paid_history', label: `Demand Paid History (${payments.length})`, icon: History },
    { key: 'dispute', label: hasDispute ? 'Dispute Log (Active)' : 'Dispute Log', icon: MessageSquareWarning },
  ];

  // Ensure active tab is valid
  const effectiveTab = TABS.some(t => t.key === activeTab) ? activeTab : TABS[0]?.key ?? 'demand_due';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-2xl w-full max-w-[1000px] max-h-[86vh] flex flex-col overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
        {/* Line 1: Title block | Owner + Statement + Close */}
        <div className="flex items-center gap-2 mb-1.5">
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
            <ArrowLeft size={16} />
          </button>
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
            {st.label}
          </span>
          <h1 className="text-sm font-bold text-white truncate">{tile.object_description || tile.object_ref}</h1>
          <span className="text-[10px] text-slate-400 shrink-0">· {tile.object_ref}</span>
          <span className="text-[10px] text-slate-500 shrink-0">· {tile.demand_type_label}</span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Users size={11} /> {tile.owner_name}
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 text-[10px] font-semibold hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <Download size={11} /> Statement
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {/* Line 2: Flat metric text blocks */}
        <div className="flex items-end gap-6 pl-7">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Outstanding</span>
            <span className="text-amber-400 text-xs font-semibold tabular-nums leading-tight">{fmtINR(tile.amount_due)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Last Paid</span>
            <span className="text-white text-xs font-semibold tabular-nums leading-tight">{tile.last_paid_date ? `${fmtINR(tile.last_paid_amount ?? 0)} · ${fmtDateShort(tile.last_paid_date)}` : '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Run Date</span>
            <span className="text-white text-xs font-semibold tabular-nums leading-tight">{fmtDateShort(tile.demand_run_date)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Due Date</span>
            <span className={`text-xs font-semibold tabular-nums leading-tight ${tile.status === 'OVERDUE' ? 'text-red-400' : 'text-white'}`}>{fmtDateShort(tile.due_date)}</span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700">
          <AlertCircle size={13} className="shrink-0" /> {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto p-0.5 text-red-400 hover:text-red-600 transition-colors shrink-0">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Payment form (collapsible) */}
      <AnimatePresence>
        {showPayForm && !isPaidOrExempted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-2 bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-600">
                <Wallet size={14} className="text-white" />
                <span className="text-xs font-bold text-white">Record Payment</span>
                <button onClick={() => setShowPayForm(false)} className="ml-auto p-0.5 text-white/70 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className={DCC_LABEL_CLS}>Amount *</label>
                    <input type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} className={DCC_INPUT_CLS} />
                  </div>
                  <div>
                    <label className={DCC_LABEL_CLS}>Payment Mode *</label>
                    <select value={payMode} onChange={e => setPayMode(e.target.value)} className={DCC_INPUT_CLS}>
                      {ALL_PAYMENT_MODES.map(m => <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={DCC_LABEL_CLS}>Payment Date *</label>
                    <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className={DCC_INPUT_CLS} />
                  </div>
                  <div>
                    <label className={DCC_LABEL_CLS}>Reference #</label>
                    <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Optional" className={DCC_INPUT_CLS} />
                  </div>
                </div>
                <div>
                  <label className={DCC_LABEL_CLS}>Remarks</label>
                  <input value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="Optional notes" className={DCC_INPUT_CLS} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handlePay}
                    disabled={paying || payAmount <= 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                  >
                    {paying ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    {paying ? 'Recording…' : 'Record Payment'}
                  </button>
                  <button onClick={() => setShowPayForm(false)} className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Context-Driven Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-4 border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = effectiveTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                active ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
        {/* ═══ Tab 1: Demand Due ═══════════════════════════════════════════════════ */}
        {effectiveTab === 'demand_due' && (() => {
          const config = getDemandComponentConfig(tile.demand_type_code, tile.object_type);
          const isMonthly = config.cadence === 'monthly';
          const penaltyPct = 0.02;

          const rows = isMonthly ? (() => {
            const runDate = new Date(tile.demand_run_date);
            const monthlyAmount = Math.round(tile.total_amount / 12);
            const out: Array<{ sno: number; label: string; charges: Record<string, number>; total: number; status: typeof tile.status }> = [];
            for (let i = 0; i < 12; i++) {
              const d = new Date(runDate.getFullYear(), runDate.getMonth() + i, 1);
              const isPaid = i < Math.floor((tile.amount_paid / tile.total_amount) * 12);
              const isOverdue = !isPaid && new Date(tile.due_date) < new Date();
              const status = isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'DUE';
              const charges: Record<string, number> = {};
              for (const comp of config.components) {
                charges[comp.key] = Math.round(monthlyAmount * comp.ratio);
              }
              charges['penalty'] = status === 'OVERDUE' ? Math.round(monthlyAmount * penaltyPct) : 0;
              const total = Object.values(charges).reduce((s, v) => s + v, 0);
              out.push({ sno: i + 1, label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), charges, total, status });
            }
            return out;
          })() : (() => {
            const charges: Record<string, number> = {};
            const baseAmount = tile.status === 'OVERDUE' ? tile.amount_due : tile.total_amount;
            for (const comp of config.components) {
              charges[comp.key] = Math.round(baseAmount * comp.ratio);
            }
            charges['penalty'] = tile.status === 'OVERDUE' ? Math.round(tile.amount_due * penaltyPct) : 0;
            const total = tile.amount_due;
            const periodLabel = (() => {
              const runDate = new Date(tile.demand_run_date);
              if (isNaN(runDate.getTime())) return 'One-Time / Initial Deposit';
              return runDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            })();
            return [{ sno: 1, label: periodLabel, charges, total, status: tile.status }];
          })();

          const openRows = rows.filter(r => r.status !== 'PAID');
          const allOpenCount = openRows.length;
          const isSingleOpen = allOpenCount === 1;

          const earlyDisc = computeEarlyPayDiscount(tile.due_date, new Date().toISOString().slice(0, 10), tile.amount_due);
          const netPayable = earlyDisc.pct > 0 ? earlyDisc.adjusted : tile.amount_due;

          const penaltyAmount = openRows.reduce((sum, row) => sum + (row.charges['penalty'] ?? 0), 0);
          const appliedPenaltyPct = penaltyAmount > 0 ? penaltyPct * 100 : 0;

          return (
            <div className="space-y-3">
              {/* ── Line-Item Table ────────────────────────────────────────────── */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-2 px-3 text-left font-bold text-slate-600 border-b border-slate-200">Sl No</th>
                        <th className="py-2 px-3 text-left font-bold text-slate-600 border-b border-slate-200">Period</th>
                        {config.components.map(comp => (
                          <th key={comp.key} className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">{comp.label}</th>
                        ))}
                        <th className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">Total Line Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openRows.map(m => (
                        <tr key={m.sno} className={`border-b border-slate-100 ${m.status === 'OVERDUE' ? 'bg-red-50/30' : ''}`}>
                          <td className="py-1.5 px-3 font-semibold text-slate-800 text-left">{m.sno}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-800 text-left">{m.label}</td>
                          {config.components.map(comp => (
                            <td key={comp.key} className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                              {(m.charges[comp.key] ?? 0) > 0 ? fmtINR(m.charges[comp.key]) : '—'}
                            </td>
                          ))}
                          <td className="py-1.5 px-3 text-right">
                            <span className="font-mono font-bold text-slate-900">{fmtINR(m.total)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={config.components.length + 2} className="py-1.5 px-3 text-right font-bold text-slate-700">Total Outstanding:</td>
                        <td className="py-1.5 px-3 text-right font-mono font-extrabold text-red-600">{fmtINR(tile.amount_due)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Amount Summary and Pay Outstanding ──────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Outstanding</span>
                    <span className="text-base font-black text-red-600 tabular-nums">{fmtINR(tile.amount_due)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 text-xs">
                    <span className="text-slate-500">Penalty ({appliedPenaltyPct}%)</span>
                    <span className="font-semibold text-red-700 tabular-nums">{penaltyAmount > 0 ? fmtINR(penaltyAmount) : '—'}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 text-xs">
                    <span className="text-slate-500">Early Discount ({earlyDisc.pct}%)</span>
                    <span className="font-semibold text-emerald-700 tabular-nums">{earlyDisc.discount > 0 ? `-${fmtINR(earlyDisc.discount)}` : '—'}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-t border-slate-100 pt-1.5 text-xs">
                    <span className="font-bold text-slate-700">Final Amount Payable</span>
                    <span className="font-black text-slate-900 tabular-nums">{fmtINR(netPayable)}</span>
                  </div>
                </div>
                {!isPaidOrExempted && (canRecordPayment || isGovtOfficial) && (
                  <div className="flex justify-end border-t border-slate-100 pt-3">
                    <button
                      onClick={() => canRecordPayment ? setShowPayForm(v => !v) : (isGovtOfficial ? (() => { setPayModalAmount(netPayable); setPayModalLabel('Full Payment'); setPayModalRowId(null); setPayModalStep('select'); setPayModalMode('UPI'); setPayModalRef(''); setPayModalRemarks(''); setPayModalDate(new Date().toISOString().slice(0, 10)); setShowPayModal(true); })() : undefined)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-md shadow-sm transition-colors"
                    >
                      <Wallet size={14} /> Pay Outstanding: {fmtINR(netPayable)}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Dispute Management (below payment) ─────────────────────────── */}
              {canRecordPayment && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquareWarning size={13} className="text-orange-500" />
                    <span className="text-xs font-bold text-slate-700">Dispute Management</span>
                  </div>
                  {hasDispute && (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-2.5 space-y-1 text-[11px] text-slate-600">
                      <div><span className="text-slate-400">Date:</span> {fmtDate(demand?.dispute_date ?? null)}</div>
                      <div><span className="text-slate-400">Reason:</span> {demand?.dispute_reason}</div>
                      {demand?.dispute_remarks && <div><span className="text-slate-400">Remarks:</span> {demand.dispute_remarks}</div>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={DCC_LABEL_CLS}>Dispute Date *</label>
                      <input type="date" value={disputeDate} onChange={e => setDisputeDate(e.target.value)} className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`} />
                    </div>
                    <div>
                      <label className={DCC_LABEL_CLS}>Reason *</label>
                      <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`}>
                        <option value="">Select reason…</option>
                        <option value="Wrong amount">Wrong amount</option>
                        <option value="Already paid">Already paid</option>
                        <option value="Invalid demand">Invalid demand</option>
                        <option value="Calculation error">Calculation error</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={DCC_LABEL_CLS}>Remarks</label>
                    <textarea value={disputeRemarks} onChange={e => setDisputeRemarks(e.target.value)} placeholder="Additional details" className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5 h-14 resize-none`} />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleDispute}
                      disabled={disputing || !disputeReason.trim()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-orange-600 text-white text-[10px] font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors"
                    >
                      {disputing ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                      {hasDispute ? 'Update Dispute' : 'Mark as Disputed'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ Tab 2: Instalment ══════════════════════════════════════════════════ */}
        {effectiveTab === 'installments' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900">Instalment Plan</h3>
              {isPaidOrExempted && instRows.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                  <History size={11} /> Read-Only
                </span>
              )}
              {canManagePlan && !isPaidOrExempted && !showInstForm && (
                <button
                  onClick={() => setShowInstForm(true)}
                  className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
                >
                  <Plus size={12} /> {instPlan ? 'Recreate Plan' : 'Create Plan'}
                </button>
              )}
            </div>

            {instSuccess && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-700">
                <CheckCircle2 size={13} className="shrink-0" /> {instSuccess}
              </div>
            )}

            {/* Create / Recreate form */}
            <AnimatePresence>
              {showInstForm && canManagePlan && !isPaidOrExempted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className={DCC_LABEL_CLS}>Start Date *</label>
                        <input type="date" value={instStartDate} onChange={e => setInstStartDate(e.target.value)} className={DCC_INPUT_CLS} />
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>Late Fee (₹)</label>
                        <input type="number" min={0} value={instLateFee} onChange={e => setInstLateFee(e.target.value)} className={DCC_INPUT_CLS} />
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>Due Days Late Fee</label>
                        <select value={instDueDaysLate} onChange={e => setInstDueDaysLate(e.target.value)} className={DCC_INPUT_CLS}>
                          {[0, 5, 7, 10, 15, 20, 30].map(d => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>Interest % p.a.</label>
                        <input type="number" step="0.01" min={0} value={instInterestPct} onChange={e => setInstInterestPct(e.target.value)} className={DCC_INPUT_CLS} />
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>Full Pay Disc %</label>
                        <input type="number" step="0.01" min={0} max={100} value={instDiscountFullPct} onChange={e => setInstDiscountFullPct(e.target.value)} className={DCC_INPUT_CLS} />
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>GST %</label>
                        <input type="number" step="0.01" min={0} max={100} value={instGstPct} onChange={e => setInstGstPct(e.target.value)} className={DCC_INPUT_CLS} />
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>GST Type</label>
                        <select value={instGstType} onChange={e => setInstGstType(e.target.value as 'inclusive' | 'exclusive')} className={DCC_INPUT_CLS}>
                          <option value="inclusive">Inclusive</option>
                          <option value="exclusive">Exclusive</option>
                        </select>
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>Balance Payment</label>
                        <div className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 rounded-md border border-slate-200">{fmtINR(balancePayment)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className={DCC_LABEL_CLS}>Term:</label>
                      <select value={instNumInstallments} onChange={e => setInstNumInstallments(Number(e.target.value))} className={`${DCC_INPUT_CLS} w-28`}>
                        {[1, 2, 3, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600">
                            <th className="px-1.5 py-1 text-left font-bold">Instalment</th>
                            <th className="px-1.5 py-1 text-right font-bold">Percentage</th>
                            <th className="px-1.5 py-1 text-right font-bold">Amount</th>
                            <th className="px-1.5 py-1 text-right font-bold">Discount</th>
                            <th className="px-1.5 py-1 text-right font-bold">Penalty</th>
                            <th className="px-1.5 py-1 text-right font-bold">GST Amt</th>
                            <th className="px-1.5 py-1 text-right font-bold">Net Payable</th>
                            <th className="px-1.5 py-1 text-left font-bold">Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {instEditRows.map((r, idx) => (
                            <tr key={r.row_number} className={r.row_number === 0 ? 'bg-emerald-50/50' : ''}>
                              <td className="px-1.5 py-1 font-semibold text-slate-700">{r.label}</td>
                              <td className="px-1.5 py-1 text-right">
                                <input type="number" step="0.01" min="0" max="100" value={r.percentage} onChange={e => updateInstRow(idx, 'percentage', e.target.value)} disabled={r.row_number === 0} className="w-14 px-1.5 py-0.5 text-right tabular-nums text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-slate-50 disabled:text-slate-400" />
                              </td>
                              <td className="px-1.5 py-1 text-right">
                                <input type="number" step="0.01" min="0" value={r.amount} onChange={e => updateInstRow(idx, 'amount', e.target.value)} disabled={r.row_number === 0} className="w-20 px-1.5 py-0.5 text-right tabular-nums text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-slate-50 disabled:text-slate-400" />
                              </td>
                              <td className="px-1.5 py-1 text-right tabular-nums">{r.discount > 0 ? fmtINR(r.discount) : '—'}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums">{r.penalty > 0 ? fmtINR(r.penalty) : '—'}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums">{r.gst_amount > 0 ? fmtINR(r.gst_amount) : '—'}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums font-bold text-emerald-700">{fmtINR(r.net_payable)}</td>
                              <td className="px-1.5 py-1">
                                <input type="date" value={r.due_date} onChange={e => updateInstRow(idx, 'due_date', e.target.value)} className="w-32 px-1.5 py-0.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {!instPctValid && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-[10px] text-amber-700">
                        <AlertTriangle size={12} /> Percentages total {instPctTotal.toFixed(2)}% — must equal 100%.
                      </div>
                    )}
                    {!instAmtValid && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-[10px] text-amber-700">
                        <AlertTriangle size={12} /> Amounts total {fmtINR(instAmtTotal)} — must equal {fmtINR(balancePayment)}.
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={handleCreatePlan} disabled={instLoading || !instPctValid || !instAmtValid || !instStartDate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                        {instLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {instLoading ? 'Creating…' : instPlan ? 'Recreate Plan' : 'Create Plan'}
                      </button>
                      <button onClick={() => { setShowInstForm(false); setInstSuccess(null); }} className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Read-only plan view */}
            {instLoading && !instPlan ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-emerald-500" />
              </div>
            ) : instError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
                <p className="text-xs font-medium text-red-600">{instError}</p>
                <button onClick={loadInstallments} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-colors">
                  <Loader2 size={12} /> Retry
                </button>
              </div>
            ) : instRows.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Layers size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No instalment plan created yet.</p>
                {canManagePlan ? (
                  <p className="text-[10px] mt-1">Click "Create Plan" to split this demand into instalments.</p>
                ) : (
                  <p className="text-[10px] mt-1">An Estate Manager has not created a plan for this demand yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Enterprise Parameter Bar */}
                {instPlan && (
                  <div className="flex items-stretch gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    {/* Key-value grid */}
                    <div className="flex-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-2 content-center">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Start Date</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">{fmtDateShort(instPlan.installment_start_date)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Late Fee</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">₹{instPlan.late_fee}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Grace Period</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">{instPlan.due_days_with_late_fee} Days</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Interest Rate</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">{instPlan.interest_pct_pa}% p.a.</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Full Pay Disc</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">{instPlan.discount_full_payment_pct}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">GST</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">{instPlan.gst_pct}% ({instPlan.gst_type === 'inclusive' ? 'incl.' : 'excl.'})</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Balance</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">{fmtINR(instPlan.balance_payment)}</span>
                      </div>
                    </div>
                    {/* Status metrics summary card */}
                    <div className="flex items-stretch gap-0 border border-slate-300 rounded-md overflow-hidden shrink-0">
                      <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-white">
                        <span className="text-[8px] font-medium uppercase tracking-wider text-slate-400">Total Inst.</span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums leading-tight">{instPlan.no_of_installments}</span>
                      </div>
                      <div className="w-px bg-slate-200" />
                      <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-emerald-50">
                        <span className="text-[8px] font-medium uppercase tracking-wider text-emerald-500">Paid</span>
                        <span className="text-sm font-bold text-emerald-700 tabular-nums leading-tight">{instPlan.installments_paid}</span>
                      </div>
                      <div className="w-px bg-slate-200" />
                      <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-amber-50">
                        <span className="text-[8px] font-medium uppercase tracking-wider text-amber-500">Due</span>
                        <span className="text-sm font-bold text-amber-700 tabular-nums leading-tight">{instPlan.installments_due}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggle: All vs Pending Only */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex bg-slate-100 rounded-md p-0.5">
                    <button
                      onClick={() => setInstRowFilter('ALL')}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${instRowFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                    >
                      All Instalments
                    </button>
                    <button
                      onClick={() => setInstRowFilter('PENDING')}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${instRowFilter === 'PENDING' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                    >
                      Pending Only
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const csv = ['Action,Instalment,Total Amount,Discount,Penalty,GST Amount,Due Date,Due w/ Late Fee,Paid Date,Paid Amount,Remaining,Status'];
                      instRows.forEach(r => {
                        csv.push([r.row_number === 0 ? 'Full Pay' : 'Pay', r.label, r.amount, r.late_fee > 0 ? r.late_fee : '', r.late_fee, r.gst_amount, r.due_date || '', r.due_date_with_late_fee || '', r.paid_date || '', r.paid_amt, r.remaining_amount, r.status].join(','));
                      });
                      const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `Instalments_${tile?.object_ref ?? 'plan'}.csv`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <FileSpreadsheet size={11} /> Export
                  </button>
                </div>

                {/* Dense instalment table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="px-1.5 py-1 text-left font-bold">Action</th>
                        <th className="px-1.5 py-1 text-left font-bold">Seq</th>
                        <th className="px-1.5 py-1 text-right font-bold">Total Amt</th>
                        <th className="px-1.5 py-1 text-right font-bold">Discount</th>
                        <th className="px-1.5 py-1 text-right font-bold">Penalty</th>
                        <th className="px-1.5 py-1 text-right font-bold">GST Amt</th>
                        <th className="px-1.5 py-1 text-left font-bold">Due Date</th>
                        <th className="px-1.5 py-1 text-left font-bold">Due w/ Late</th>
                        <th className="px-1.5 py-1 text-left font-bold">Paid Date</th>
                        <th className="px-1.5 py-1 text-right font-bold">Paid Amt</th>
                        <th className="px-1.5 py-1 text-right font-bold">Remaining</th>
                        <th className="px-1.5 py-1 text-center font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instRows
                        .filter(r => {
                          if (instRowFilter === 'PENDING') return r.status !== 'PAID' && r.status !== 'EXEMPTED';
                          return true;
                        })
                        .map(row => {
                          const isPaid = row.status === 'PAID';
                          const isFullPayment = row.row_number === 0;
                          const sequentialRows = instRows.filter(r => r.row_number > 0 && r.status !== 'PAID' && r.status !== 'EXEMPTED');
                          const earliestUnpaidRowNumber = sequentialRows.length > 0 ? Math.min(...sequentialRows.map(r => r.row_number)) : null;
                          const canPayManager = !isPaid && row.remaining_amount > 0 && !isPaidOrExempted && canRecordPayment && (isFullPayment || row.row_number === earliestUnpaidRowNumber);
                          const canPayGovt = !isPaid && row.remaining_amount > 0 && !isPaidOrExempted && isGovtOfficial && (isFullPayment || row.row_number === earliestUnpaidRowNumber);
                          const isLocked = !isPaid && row.remaining_amount > 0 && !isPaidOrExempted && (canRecordPayment || isGovtOfficial) && row.row_number > 0 && earliestUnpaidRowNumber !== null && row.row_number !== earliestUnpaidRowNumber;
                          const canPayThis = canPayManager || canPayGovt;

                          return (
                            <tr key={row.id} className={isPaid ? 'bg-emerald-50/40' : row.status === 'OVERDUE' ? 'bg-red-50/30' : isFullPayment ? 'bg-emerald-50/20' : ''}>
                              <td className="px-1.5 py-1">
                                {canPayThis ? (
                                  <button onClick={() => handlePayInstallment(row)} disabled={payingRowId === row.id} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                                    {payingRowId === row.id ? <Loader2 size={10} className="animate-spin" /> : <Wallet size={10} />}
                                    {payingRowId === row.id ? 'Paying…' : 'Pay'}
                                  </button>
                                ) : isLocked ? (
                                  <span className="inline-flex items-center gap-0.5 text-slate-400 text-[9px]" title="Pay the previous instalment first">
                                    <Lock size={10} /> Locked
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-1.5 py-1 font-semibold text-slate-700">{row.label}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums font-bold">{fmtINR(row.amount)}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums text-slate-400">{row.late_fee > 0 && row.row_number === 0 ? fmtINR(0) : '—'}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums text-slate-400">{row.late_fee > 0 && row.row_number > 0 ? fmtINR(row.late_fee) : '—'}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums text-slate-400">{row.gst_amount > 0 ? fmtINR(row.gst_amount) : '—'}</td>
                              <td className="px-1.5 py-1 text-left text-slate-500">{fmtDateShort(row.due_date)}</td>
                              <td className="px-1.5 py-1 text-left text-slate-500">{fmtDateShort(row.due_date_with_late_fee)}</td>
                              <td className="px-1.5 py-1 text-left text-slate-500">{fmtDateShort(row.paid_date)}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums text-emerald-600 font-semibold">{row.paid_amt > 0 ? fmtINR(row.paid_amt) : '—'}</td>
                              <td className="px-1.5 py-1 text-right tabular-nums font-semibold text-slate-700">{row.remaining_amount > 0 ? fmtINR(row.remaining_amount) : '—'}</td>
                              <td className="px-1.5 py-1 text-center">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  isPaid ? 'bg-emerald-100 text-emerald-700' :
                                  row.status === 'EXEMPTED' ? 'bg-slate-200 text-slate-600' :
                                  row.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                  row.status === 'DUE' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-500'
                                }`}>{row.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Tab 3: Demand Paid History ══════════════════════════════════════════ */}
        {effectiveTab === 'paid_history' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <History size={14} className="text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900">Demand Paid History</h3>
              <span className="ml-auto text-[10px] text-slate-400">
                {payments.length} payment{payments.length !== 1 ? 's' : ''}
                {payments.length > 0 && ` · Total: ${fmtINR(payments.reduce((s, p) => s + p.amount, 0))}`}
              </span>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Receipt size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No payments recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="px-1.5 py-1 text-left font-bold">Receipt No</th>
                      <th className="px-1.5 py-1 text-left font-bold">Date</th>
                      <th className="px-1.5 py-1 text-left font-bold">Mode</th>
                      <th className="px-1.5 py-1 text-left font-bold">Reference</th>
                      <th className="px-1.5 py-1 text-right font-bold">Amount</th>
                      <th className="px-1.5 py-1 text-left font-bold">Remarks</th>
                      <th className="px-1.5 py-1 text-center font-bold">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...payments].reverse().map(p => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-1.5 py-1"><span className="font-bold text-emerald-700">{receiptNumber(p.id)}</span></td>
                        <td className="px-1.5 py-1 text-slate-600">{fmtDate(p.payment_date)}</td>
                        <td className="px-1.5 py-1">
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">
                            {PAYMENT_MODE_LABELS[p.payment_mode as PaymentMode] ?? p.payment_mode}
                          </span>
                        </td>
                        <td className="px-1.5 py-1 text-slate-500">{p.reference_number || '—'}</td>
                        <td className="px-1.5 py-1 text-right tabular-nums font-bold text-emerald-700">{fmtINR(p.amount)}</td>
                        <td className="px-1.5 py-1 text-slate-400 max-w-[160px] truncate" title={p.remarks ?? ''}>{p.remarks || '—'}</td>
                        <td className="px-1.5 py-1 text-center">
                          <button
                            onClick={() => {
                              if (!tile) return;
                              setDownloadingReceiptId(p.id);
                              try { generatePaymentReceipt({ payment: p, tile, demand }); } catch { setActionError('Failed to generate receipt'); } finally { setDownloadingReceiptId(null); }
                            }}
                            disabled={downloadingReceiptId === p.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-semibold hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                          >
                            {downloadingReceiptId === p.id ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
                            {downloadingReceiptId === p.id ? 'Gen…' : 'Download'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={4} className="px-1.5 py-1.5 text-right font-bold text-slate-700">Total Collected:</td>
                      <td className="px-1.5 py-1.5 text-right tabular-nums font-extrabold text-emerald-700">{fmtINR(payments.reduce((s, p) => s + p.amount, 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ Tab 4: Dispute Log ══════════════════════════════════════════════════ */}
        {effectiveTab === 'dispute' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquareWarning size={14} className="text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900">Dispute Log</h3>
            </div>
            {hasDispute ? (
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle size={13} className="text-orange-600" />
                    <span className="font-bold text-orange-700">Active Dispute</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div><span className="text-slate-400">Dispute Date:</span> {fmtDate(demand?.dispute_date ?? null)}</div>
                    <div><span className="text-slate-400">Reason:</span> {demand?.dispute_reason}</div>
                    {demand?.dispute_remarks && <div><span className="text-slate-400">Remarks:</span> {demand.dispute_remarks}</div>}
                  </div>
                </div>
                {canRecordPayment && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] text-slate-500 mb-2">Update dispute details:</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className={DCC_LABEL_CLS}>Dispute Date *</label>
                        <input type="date" value={disputeDate} onChange={e => setDisputeDate(e.target.value)} className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`} />
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>Reason *</label>
                        <input value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="e.g. Wrong amount" className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`} />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className={DCC_LABEL_CLS}>Remarks</label>
                      <textarea value={disputeRemarks} onChange={e => setDisputeRemarks(e.target.value)} placeholder="Additional details" className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5 h-16 resize-none`} />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handleDispute} disabled={disputing || !disputeReason.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors">
                        {disputing ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {disputing ? 'Saving…' : 'Update Dispute'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">Mark this demand as disputed if the owner contests the amount or validity.</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={DCC_LABEL_CLS}>Dispute Date *</label>
                    <input type="date" value={disputeDate} onChange={e => setDisputeDate(e.target.value)} className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`} />
                  </div>
                  <div>
                    <label className={DCC_LABEL_CLS}>Reason *</label>
                    <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`}>
                      <option value="">Select reason…</option>
                      <option value="Wrong amount">Wrong amount</option>
                      <option value="Already paid">Already paid</option>
                      <option value="Invalid demand">Invalid demand</option>
                      <option value="Calculation error">Calculation error</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={DCC_LABEL_CLS}>Remarks</label>
                  <textarea value={disputeRemarks} onChange={e => setDisputeRemarks(e.target.value)} placeholder="Additional details" className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5 h-16 resize-none`} />
                </div>
                <div className="flex justify-end">
                  <button onClick={handleDispute} disabled={disputing || !disputeReason.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors">
                    {disputing ? <Loader2 size={13} className="animate-spin" /> : <MessageSquareWarning size={13} />}
                    {disputing ? 'Saving…' : 'Mark as Disputed'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Unified Payment Modal — Manager record-payment + Demo mock payment */}
      {showPayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => { if (!payModalRecording && payModalStep !== 'processing') setShowPayModal(false); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${canRecordPayment ? 'bg-emerald-600' : 'bg-slate-800'}`}>
              <div className="flex items-center gap-2">
                {canRecordPayment ? <Wallet size={16} className="text-white" /> : <Lock size={16} className="text-emerald-400" />}
                <h3 className="text-sm font-bold text-white">
                  {canRecordPayment ? 'Record Payment' : 'Demo Payment Gateway'}
                </h3>
              </div>
              {payModalStep !== 'processing' && !payModalRecording && (
                <button onClick={() => setShowPayModal(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
              )}
            </div>

            {payModalStep === 'select' && (
              <div className="px-4 py-4 space-y-3">
                {/* Info banner */}
                {!canRecordPayment && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[11px] text-amber-700 flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" /> This is a demo payment screen. No real payment will be processed.
                  </div>
                )}

                {/* Amount + label summary */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {canRecordPayment ? 'Record Amount' : 'Outstanding'}
                    </span>
                    <span className="text-lg font-black text-slate-900 tabular-nums leading-tight">{fmtINR(payModalAmount || tile.amount_due)}</span>
                  </div>
                  {payModalLabel && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">For</span>
                      <span className="text-xs font-bold text-emerald-700">{payModalLabel}</span>
                    </div>
                  )}
                </div>

                {/* Payment type selection */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Select Payment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAY_MODAL_METHODS.map(m => {
                      const Icon = m.icon;
                      const active = payModalMode === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setPayModalMode(m.key)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all text-left ${active ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            <Icon size={18} className={active ? 'text-emerald-600' : 'text-slate-400'} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-700 truncate">{m.label}</span>
                            <span className="text-[10px] text-slate-400 truncate">{m.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manager: reference + remarks + date fields */}
                {canRecordPayment && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={DCC_LABEL_CLS}>Payment Date *</label>
                        <input type="date" value={payModalDate} onChange={e => setPayModalDate(e.target.value)} className={DCC_INPUT_CLS} />
                      </div>
                      <div>
                        <label className={DCC_LABEL_CLS}>Reference #</label>
                        <input value={payModalRef} onChange={e => setPayModalRef(e.target.value)} placeholder="Optional" className={DCC_INPUT_CLS} />
                      </div>
                    </div>
                    <div>
                      <label className={DCC_LABEL_CLS}>Remarks</label>
                      <input value={payModalRemarks} onChange={e => setPayModalRemarks(e.target.value)} placeholder="Optional notes" className={DCC_INPUT_CLS} />
                    </div>
                  </div>
                )}

                {/* Confirm / Pay button */}
                <button
                  onClick={handleConfirmPayModal}
                  disabled={canRecordPayment ? payModalRecording : false}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                >
                  {canRecordPayment ? (
                    payModalRecording ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />
                  ) : (
                    <Wallet size={16} />
                  )}
                  {canRecordPayment
                    ? (payModalRecording ? 'Recording…' : `Record ${fmtINR(payModalAmount || tile.amount_due)} via ${PAY_MODAL_METHODS.find(m => m.key === payModalMode)?.label}`)
                    : `Pay ${fmtINR(payModalAmount || tile.amount_due)} via ${PAY_MODAL_METHODS.find(m => m.key === payModalMode)?.label}`
                  }
                </button>
              </div>
            )}

            {/* Processing step (demo only) */}
            {payModalStep === 'processing' && (
              <div className="px-4 py-16 flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
                <p className="text-sm font-semibold text-slate-600">Processing {payModalMode} payment…</p>
              </div>
            )}

            {/* Done step (demo only) */}
            {payModalStep === 'done' && (
              <div className="px-4 py-10 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Demo Payment Successful</h3>
                <p className="text-xs text-slate-500 text-center max-w-xs">
                  This was a simulated payment of {fmtINR(payModalAmount || tile.amount_due)} via {payModalMode}. No actual payment was recorded — demand and instalment balances remain unchanged.
                </p>
                <button onClick={() => { setShowPayModal(false); setPayModalStep('select'); }} className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
    </div>
  );
};

// Route-based wrapper for direct URL access
const DCCDemandDetailPage: React.FC = () => {
  const { demandId } = useParams<{ demandId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const validTabs: Tab[] = ['demand_due', 'installments', 'paid_history', 'dispute'];
  const initialTab: Tab | undefined = tab && validTabs.includes(tab as Tab) ? (tab as Tab) : undefined;

  if (!demandId) return null;

  return (
    <DCCDemandDetailModal
      demandId={demandId}
      onClose={() => navigate(ROUTES.DCC)}
      initialTab={initialTab}
    />
  );
};

export default DCCDemandDetailPage;
