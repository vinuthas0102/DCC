import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, Users, Calendar, AlertTriangle, CheckCircle2, Wallet, Download,
  Loader2, X, Layers, AlertCircle, History,
  MessageSquareWarning, MessageCircle, Send,
  CreditCard, Smartphone, Building, Banknote, Lock,
  CheckSquare, Square, ChevronDown, ChevronRight,
} from 'lucide-react';
import { dccService } from '../../services/dccService';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { generatePaymentReceipt, receiptNumber } from '../../utils/dccReceipt';
import type { DccTile, DccPayment, DccDemand, DccDemandDispute, DccDemandAuditEntry, DccDemandRunLog, DccInstallmentPlan, DccInstallmentRow } from '../../types/dcc';
import type { PaymentMode } from '../../types/payableCriteria';
import { PAYMENT_MODE_LABELS } from '../../types/payableCriteria';
import {
  DCC_STATUS, DCC_INPUT_CLS, DCC_LABEL_CLS,
  fmtINR, fmtDateShort, fmtDateTimeDDMMYYYY, computeGst,
  getDemandTypeBadgeStyle,
} from '../../constants/dccTheme';
import { getDemandComponentConfig } from '../../constants/demandComponents';
import type { DemandComponent } from '../../constants/demandComponents';

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

interface DemandFinancialBreakdown {
  baseAmount: number;
  penalty: number;
  gstAmount: number;
  discount: number;
  totalDue: number;
}

const calculateDemandFinancials = (tile: DccTile, paymentDate: string): DemandFinancialBreakdown => {
  const baseAmount = Math.max(tile.amount_due, 0);
  const penalty = tile.status === 'OVERDUE' ? Math.round(baseAmount * 0.02) : 0;
  const earlyDiscount = computeEarlyPayDiscount(tile.due_date, paymentDate, baseAmount);
  const gst = computeGst(baseAmount, tile.gst_pct, tile.gst_type, tile.include_gst);
  const discountedAmount = earlyDiscount.adjusted;
  const totalDue = discountedAmount + penalty + (tile.include_gst && tile.gst_type === 'exclusive' ? gst.gstAmount : 0);

  return {
    baseAmount,
    penalty,
    gstAmount: gst.gstAmount,
    discount: earlyDiscount.discount,
    totalDue,
  };
};

const INSTALLMENT_DEMAND_CODES = new Set(['LOAN']);
const isInstalmentType = (code: string): boolean => INSTALLMENT_DEMAND_CODES.has(code);

interface TxnTypeGroup {
  code: string;
  label: string;
  tiles: DccTile[];
  pendingTiles: DccTile[];
  totalPending: number;
  totalCollected: number;
  totalDemand: number;
}

function groupByTxnType(tiles: DccTile[]): TxnTypeGroup[] {
  const map = new Map<string, TxnTypeGroup>();
  for (const t of tiles) {
    const code = t.demand_type_code || 'UNKNOWN';
    const label = t.demand_type_label || t.demand_type_code || 'Unknown';
    const isPending = t.status === 'DUE' || t.status === 'OVERDUE';
    const entry = map.get(code) ?? {
      code, label, tiles: [], pendingTiles: [], totalPending: 0, totalCollected: 0, totalDemand: 0,
    };
    entry.tiles.push(t);
    entry.totalDemand += t.total_amount;
    entry.totalCollected += t.amount_paid;
    if (isPending) {
      entry.pendingTiles.push(t);
      entry.totalPending += t.amount_due;
    }
    map.set(code, entry);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => b.totalPending - a.totalPending);
  return groups;
}

// Merge component configs from multiple tiles of the same transaction type so all charge columns appear
function mergeComponents(tiles: DccTile[], txnCode: string): DemandComponent[] {
  const seen = new Map<string, DemandComponent>();
  for (const tile of tiles) {
    const cfg = getDemandComponentConfig(txnCode, tile.object_type);
    for (const comp of cfg.components) {
      if (!seen.has(comp.key)) seen.set(comp.key, comp);
    }
  }
  return Array.from(seen.values());
}

const PAY_MODAL_METHODS = [
  { key: 'UPI', label: 'UPI', icon: Smartphone, desc: 'Pay via UPI ID or QR' },
  { key: 'NETBANKING', label: 'Net Banking', icon: Building, desc: 'Bank transfer' },
  { key: 'CARD', label: 'Debit / Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
  { key: 'WALLET', label: 'Wallet', icon: Wallet, desc: 'Paytm, PhonePe, etc.' },
  { key: 'CHEQUE', label: 'Cheque', icon: Banknote, desc: 'Cheque payment' },
] as const;

type Tab = 'demand_due' | 'installments' | 'paid_history';

interface SelectedInstallment {
  demandId: string;
  rowId: string;
  amount: number;
  label: string;
  tile: DccTile;
}

interface ObjectDemandDueScreenProps {
  ownerId: string;
  ownerName: string;
  ownerContact: string;
  ownerAddress: string;
  objectId: string;
  objectRef: string;
  onBack: () => void;
  onClose: () => void;
}

export const ObjectDemandDueScreen: React.FC<ObjectDemandDueScreenProps> = ({
  ownerId, ownerName, ownerContact, ownerAddress,
  objectId, objectRef,
  onBack, onClose,
}) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const { user } = useAuthStore();
  const canRecordPayment = user?.role === 'manager' || user?.role === 'admin';
  const isGovtOfficial = user?.role === 'govt_official' || user?.role === 'dept_user' || user?.role === 'public';

  const [allTiles, setAllTiles] = useState<DccTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [activeTxnCode, setActiveTxnCode] = useState<string | null>(null);

  const [demandDataMap, setDemandDataMap] = useState<Record<string, { demand: DccDemand | null; payments: DccPayment[]; auditLog: DccDemandAuditEntry[]; disputes: DccDemandDispute[]; runLog: DccDemandRunLog | null; instPlan: DccInstallmentPlan | null; instRows: DccInstallmentRow[] }>>({});

  const [activeTab, setActiveTab] = useState<Tab>('demand_due');

  // Multi-select for demand due
  const [selectedDemandIds, setSelectedDemandIds] = useState<Set<string>>(new Set());

  // Multi-select for installments
  const [selectedInstRows, setSelectedInstRows] = useState<Set<string>>(new Set());

  // Expanded demand detail rows
  const [expandedDemandIds, setExpandedDemandIds] = useState<Set<string>>(new Set());

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalMode, setPayModalMode] = useState<string>('UPI');
  const [payModalStep, setPayModalStep] = useState<'select' | 'processing' | 'done'>('select');
  const [payModalRef, setPayModalRef] = useState('');
  const [payModalRemarks, setPayModalRemarks] = useState('');
  const [payModalDate, setPayModalDate] = useState(new Date().toISOString().slice(0, 10));
  const [payModalRecording, setPayModalRecording] = useState(false);
  // What the payment modal is paying: 'demands' or 'installments'
  const [payModalContext, setPayModalContext] = useState<'demands' | 'installments'>('demands');

  // Dispute panel
  const [disputePanelOpen, setDisputePanelOpen] = useState(false);
  const [disputePanelDemandId, setDisputePanelDemandId] = useState<string | null>(null);
  const [disputePanelRow, setDisputePanelRow] = useState<number | null>(null);
  const [disputePanelLabel, setDisputePanelLabel] = useState('');
  const [disputeDate, setDisputeDate] = useState(new Date().toISOString().slice(0, 10));
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeRemarks, setDisputeRemarks] = useState('');
  const [disputing, setDisputing] = useState(false);

  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!ownerId || !objectId) return;
    setLoading(true);
    setError(null);
    try {
      const all = await dccService.getTiles();
      const objTiles = all.filter(t => t.owner_id === ownerId && t.object_id === objectId);
      setAllTiles(objTiles);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [ownerId, objectId]);

  useEffect(() => { load(); }, [load]);

  const txnGroups = useMemo(() => groupByTxnType(allTiles), [allTiles]);

  useEffect(() => {
    if (!activeTxnCode && txnGroups.length > 0) {
      const firstPending = txnGroups.find(g => g.pendingTiles.length > 0);
      setActiveTxnCode(firstPending?.code ?? txnGroups[0].code);
    }
  }, [txnGroups, activeTxnCode]);

  const activeGroup = useMemo(
    () => txnGroups.find(g => g.code === activeTxnCode) ?? null,
    [txnGroups, activeTxnCode],
  );

  const showInstalmentTab = activeGroup ? isInstalmentType(activeGroup.code) : false;
  const showDemandDueTab = !showInstalmentTab;

  // Merged components across all tiles in the active group — ensures all charge columns show
  const mergedComponents = useMemo(() => {
    if (!activeGroup) return [];
    return mergeComponents(activeGroup.tiles, activeGroup.code);
  }, [activeGroup]);

  const pendingTiles = useMemo(() => {
    if (!activeGroup) return [];
    return [...activeGroup.pendingTiles].sort((a, b) => {
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [activeGroup]);

  useEffect(() => {
    setSelectedDemandIds(new Set(pendingTiles.map(t => t.id)));
  }, [activeTxnCode, pendingTiles]);

  // Reset installment selection when txn type changes
  useEffect(() => {
    setSelectedInstRows(new Set());
  }, [activeTxnCode]);

  const selectedTiles = useMemo(
    () => pendingTiles.filter(t => selectedDemandIds.has(t.id)),
    [pendingTiles, selectedDemandIds],
  );

  // ── Load per-demand detail ────────────────────────────────────────────────────
  const loadDemandDetail = useCallback(async (demandId: string) => {
    setDemandDataMap(prev => {
      if (prev[demandId]) return prev;
      return prev;
    });
    if (demandDataMap[demandId]) return;
    try {
      const [pays, dispData, auditData] = await Promise.all([
        dccService.getPayments(demandId),
        dccService.getDisputes(demandId),
        dccService.getDemandAuditLog(demandId),
      ]);
      const { data: demandData } = await supabase
        .from('dcc_demands')
        .select('*, object:object_id(*, owner:owner_id(*)), owner:owner_id(*), demand_type:demand_type_id(*)')
        .eq('id', demandId)
        .maybeSingle();

      let runLog: DccDemandRunLog | null = null;
      const runLogId = (demandData as DccDemand | null)?.run_log_id;
      if (runLogId) {
        const { data: rlog } = await supabase
          .from('dcc_demand_run_log')
          .select('*')
          .eq('id', runLogId)
          .maybeSingle();
        runLog = (rlog as DccDemandRunLog | null) ?? null;
      }

      let instPlan: DccInstallmentPlan | null = null;
      let instRows: DccInstallmentRow[] = [];
      try {
        const instData = await dccService.getInstallmentPlan(demandId);
        instPlan = instData.plan;
        instRows = instData.rows;
      } catch { /* not all demands have installment plans */ }

      setDemandDataMap(prev => ({
        ...prev,
        [demandId]: {
          demand: (demandData as DccDemand | null) ?? null,
          payments: pays,
          auditLog: auditData,
          disputes: dispData,
          runLog,
          instPlan,
          instRows,
        },
      }));
    } catch { /* silent */ }
  }, [demandDataMap]);

  useEffect(() => {
    if (activeGroup) {
      activeGroup.tiles.forEach(t => loadDemandDetail(t.id));
    }
  }, [activeTxnCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Aggregate financials ──────────────────────────────────────────────────────
  const aggregateOutstanding = activeGroup?.totalPending ?? 0;
  const aggregateCollected = activeGroup?.totalCollected ?? 0;
  const aggregateDemand = activeGroup?.totalDemand ?? 0;
  const allPaidOrExempted = activeGroup ? activeGroup.pendingTiles.length === 0 : false;

  const selectedFinancials = useMemo(() => {
    const paymentDate = new Date().toISOString().slice(0, 10);
    return selectedTiles.reduce((totals, tile) => {
      const breakdown = calculateDemandFinancials(tile, paymentDate);
      return {
        totalOutstanding: totals.totalOutstanding + breakdown.baseAmount,
        totalPenalty: totals.totalPenalty + breakdown.penalty,
        totalDiscount: totals.totalDiscount + breakdown.discount,
        totalGst: totals.totalGst + breakdown.gstAmount,
        totalFinalPayable: totals.totalFinalPayable + breakdown.totalDue,
      };
    }, { totalOutstanding: 0, totalPenalty: 0, totalDiscount: 0, totalGst: 0, totalFinalPayable: 0 });
  }, [selectedTiles]);

  // ── Installment selection ─────────────────────────────────────────────────────
  const allInstRows = useMemo(() => {
    if (!activeGroup) return [];
    const rows: { row: DccInstallmentRow; demandId: string; tile: DccTile }[] = [];
    for (const tile of activeGroup.pendingTiles) {
      const dd = demandDataMap[tile.id];
      if (!dd?.instRows) continue;
      for (const row of dd.instRows) {
        if (row.status === 'PAID' || row.status === 'EXEMPTED') continue;
        rows.push({ row, demandId: tile.id, tile });
      }
    }
    return rows;
  }, [activeGroup, demandDataMap]);

  const selectedInstallments = useMemo(() => {
    return allInstRows
      .filter(({ row }) => selectedInstRows.has(row.id))
      .map(({ row, demandId, tile }) => ({
        demandId,
        rowId: row.id,
        amount: row.remaining_amount,
        label: row.label,
        tile,
      }));
  }, [allInstRows, selectedInstRows]);

  const selectedInstTotal = useMemo(
    () => selectedInstallments.reduce((s, si) => s + si.amount, 0),
    [selectedInstallments],
  );

  const toggleInstRow = (rowId: string) => {
    setSelectedInstRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
      return next;
    });
  };

  const toggleAllInst = () => {
    const pendingIds = allInstRows.map(({ row }) => row.id);
    if (selectedInstRows.size === pendingIds.length && pendingIds.length > 0) {
      setSelectedInstRows(new Set());
    } else {
      setSelectedInstRows(new Set(pendingIds));
    }
  };

  // ── Demand due multi-select ───────────────────────────────────────────────────
  const toggleDemand = (id: string) => {
    setSelectedDemandIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Expand/collapse demand detail ─────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedDemandIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Payment handlers ──────────────────────────────────────────────────────────
  const handlePayNow = () => {
    if (effectiveTab === 'installments') {
      if (selectedInstallments.length === 0 || selectedInstTotal <= 0) {
        setActionError('Select at least one installment to pay.');
        return;
      }
      setPayModalContext('installments');
    } else {
      if (selectedTiles.length === 0 || selectedFinancials.totalFinalPayable <= 0) {
        setActionError('Select at least one demand to pay.');
        return;
      }
      setPayModalContext('demands');
    }
    setActionError(null);
    setPayModalStep('select');
    setPayModalMode('UPI');
    setPayModalRef('');
    setPayModalRemarks('');
    setPayModalDate(new Date().toISOString().slice(0, 10));
    setShowPayModal(true);
  };

  const handleConfirmPayModal = async () => {
    if (canRecordPayment) {
      setPayModalRecording(true);
      setActionError(null);
      try {
        if (payModalContext === 'installments') {
          for (const si of selectedInstallments) {
            await dccService.payInstallmentRow(si.rowId, si.amount, payModalDate);
          }
        } else {
          for (const tile of selectedTiles) {
            await dccService.submitPayment(
              tile.id,
              tile.object_id,
              calculateDemandFinancials(tile, payModalDate).totalDue,
              payModalMode,
              payModalDate,
              payModalRef || undefined,
              payModalRemarks || `Bulk payment for ${selectedTiles.length} demand(s) — ${activeGroup?.label ?? ''}`,
            );
          }
        }
        setShowPayModal(false);
        setPayModalStep('select');
        setSelectedDemandIds(new Set());
        setSelectedInstRows(new Set());
        setDemandDataMap(prev => {
          const next = { ...prev };
          if (payModalContext === 'demands') {
            selectedTiles.forEach(t => { delete next[t.id]; });
          } else {
            selectedInstallments.forEach(si => { delete next[si.demandId]; });
          }
          return next;
        });
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

  // ── Dispute handler ───────────────────────────────────────────────────────────
  const handleDispute = async () => {
    if (!disputePanelDemandId || !disputeReason.trim() || disputePanelRow === null) return;
    setDisputing(true);
    setActionError(null);
    try {
      const author = user?.fullName ?? user?.email ?? undefined;
      await dccService.createDispute(disputePanelDemandId, disputePanelRow, disputeDate, disputeReason, disputeRemarks, author);
      setDisputeReason('');
      setDisputeRemarks('');
      setDemandDataMap(prev => { const next = { ...prev }; delete next[disputePanelDemandId]; return next; });
      await loadDemandDetail(disputePanelDemandId);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to add dispute');
    } finally {
      setDisputing(false);
    }
  };

  // ── Download statement ────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!activeGroup) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Demand Statement — ${objectRef} — ${activeGroup.label}</title>
    <style>body{font-family:sans-serif;font-size:13px;color:#1e293b;margin:32px}h2{margin:0 0 4px;color:#1e293b}p{margin:2px 0;color:#64748b;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}.footer{margin-top:12px;text-align:right;font-weight:700;font-size:14px;color:#b45309}</style></head>
    <body><h2>Demand Statement — ${objectRef}</h2>
    <p>Owner: ${ownerName} · ${ownerContact}</p>
    <p>Transaction Type: ${activeGroup.label}</p>
    <table><thead><tr><th>Run Date</th><th>Due Date</th><th>Status</th><th>Total</th><th>Paid</th><th>Outstanding</th></tr></thead><tbody>
    ${activeGroup.tiles.map(t => `<tr><td>${fmtDateShort(t.demand_run_date)}</td><td>${fmtDateShort(t.due_date)}</td><td>${t.status}</td><td>${fmtINR(t.total_amount)}</td><td>${fmtINR(t.amount_paid)}</td><td>${fmtINR(t.amount_due)}</td></tr>`).join('')}
    </tbody></table>
    <div class="footer">Total Outstanding: ${fmtINR(activeGroup.totalPending)}</div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Demand_${objectRef}_${activeGroup.label}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Tabs definition ───────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string; icon: typeof History }[] = [
    ...(showDemandDueTab && !allPaidOrExempted ? [{ key: 'demand_due' as Tab, label: 'Demand Due', icon: Calendar }] : []),
    ...(showInstalmentTab && !allPaidOrExempted ? [{ key: 'installments' as Tab, label: 'Installment Plan', icon: Layers }] : []),
    { key: 'paid_history' as Tab, label: 'Demand History', icon: History },
  ];
  const effectiveTab = TABS.some(t => t.key === activeTab) ? activeTab : TABS[0]?.key ?? 'paid_history';

  // Active payable amount for header summary — depends on which tab is active
  const headerPayableAmount = effectiveTab === 'installments' ? selectedInstTotal : selectedFinancials.totalFinalPayable;
  const headerSelectedCount = effectiveTab === 'installments' ? selectedInstallments.length : selectedTiles.length;
  const headerOutstanding = effectiveTab === 'installments' ? selectedInstTotal : selectedFinancials.totalOutstanding;

  // Aggregate activity timeline for history tab
  const allActivities = useMemo(() => {
    type ActivityKind = 'payment' | 'created' | 'modified' | 'dispute' | 'approved' | 'amended';
    interface ActivityEntry { id: string; kind: ActivityKind; timestamp: string; orderTimestamp: string; rank: number; demandId: string; tile: DccTile; }
    const activities: ActivityEntry[] = [];
    for (const tile of (activeGroup?.tiles ?? [])) {
      const dd = demandDataMap[tile.id];
      if (!dd) continue;
      dd.payments.forEach(p => activities.push({ id: `pay-${p.id}`, kind: 'payment', timestamp: p.payment_date, orderTimestamp: p.created_at || p.payment_date, rank: 60, demandId: tile.id, tile }));
      dd.auditLog.forEach(e => {
        const createdAt = typeof e.new_values.created_at === 'string' ? e.new_values.created_at : e.created_at;
        activities.push({
          id: `audit-${e.id}`,
          kind: e.event_type === 'CREATED' ? 'created' : 'modified',
          timestamp: e.event_type === 'CREATED' ? createdAt : e.created_at,
          orderTimestamp: e.created_at,
          rank: e.event_type === 'CREATED' ? 10 : 40,
          demandId: tile.id,
          tile,
        });
      });
      dd.disputes.forEach(d => activities.push({ id: `disp-${d.id}`, kind: 'dispute', timestamp: d.dispute_date, orderTimestamp: d.created_at || d.dispute_date, rank: 30, demandId: tile.id, tile }));
      if (dd.runLog) {
        if (dd.runLog.approved_at) activities.push({ id: `appr-${dd.runLog.id}`, kind: 'approved', timestamp: dd.runLog.approved_at, orderTimestamp: dd.runLog.approved_at, rank: 50, demandId: tile.id, tile });
        if (dd.runLog.amended_at) activities.push({ id: `ramend-${dd.runLog.id}`, kind: 'amended', timestamp: dd.runLog.amended_at, orderTimestamp: dd.runLog.amended_at, rank: 55, demandId: tile.id, tile });
      }
    }
    activities.sort((a, b) => {
      const rankDiff = b.rank - a.rank;
      if (rankDiff !== 0) return rankDiff;
      const dateDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = new Date(b.orderTimestamp).getTime() - new Date(a.orderTimestamp).getTime();
      return timeDiff !== 0 ? timeDiff : b.id.localeCompare(a.id);
    });
    return activities;
  }, [activeGroup, demandDataMap]);

  const totalPaymentsCount = useMemo(() => {
    return (activeGroup?.tiles ?? []).reduce((s, t) => s + (demandDataMap[t.id]?.payments.length ?? 0), 0);
  }, [activeGroup, demandDataMap]);

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !activeGroup) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center">
          <AlertTriangle size={28} className="mb-2 text-red-400" />
          <span className="text-sm font-medium text-slate-600">{error ?? 'No demands found for this object.'}</span>
          <button onClick={onBack} className="mt-3 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700">
            Back
          </button>
        </div>
      </div>
    );
  }

  const headerTile = pendingTiles[0] ?? activeGroup.tiles[0];
  const headerStatus = allPaidOrExempted ? 'PAID' : (pendingTiles[0]?.status ?? 'PAID');
  const st = DCC_STATUS[headerStatus as keyof typeof DCC_STATUS] ?? DCC_STATUS.PAID;
  const txnBadge = getDemandTypeBadgeStyle(activeGroup.code);

  const historyTabLabel = `Demand History (${totalPaymentsCount + allActivities.filter(a => a.kind !== 'payment').length})`;
  const tabsWithCount = TABS.map(t => t.key === 'paid_history' ? { ...t, label: historyTabLabel } : t);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-[1280px] max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <button onClick={onBack} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0" title="Back to Object Summary">
              <ArrowLeft size={16} />
            </button>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
              {allPaidOrExempted ? 'Fully Paid' : st.label}
            </span>
            <h1 className="text-sm font-bold text-white truncate">{objectRef}</h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${txnBadge.bg} ${txnBadge.text} border ${txnBadge.border} shrink-0`}>
              <span className={`h-1.5 w-1.5 rounded-full ${txnBadge.dot}`} />
              {activeGroup.label}
            </span>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Users size={11} /> {ownerName}
              </span>
              <button
                onClick={handleDownload}
                title="Download Statement"
                className="flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700"
              >
                <Download size={13} />
              </button>
              <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 pl-7 flex-wrap">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Owner</span>
                <span className="text-white text-xs font-semibold truncate max-w-[140px]">{ownerName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Contact</span>
                <span className="text-white text-xs font-semibold tabular-nums leading-tight flex items-center gap-1"><Phone size={9} />{ownerContact || '—'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Demands</span>
                <span className="text-white text-xs font-semibold tabular-nums leading-tight">{activeGroup.tiles.length} total · {pendingTiles.length} pending</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {allPaidOrExempted ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600/20 border border-emerald-500/30">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-emerald-300 text-xs font-bold uppercase tracking-wide">All Cleared</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Total Demand</span>
                    <span className="text-white text-xs font-semibold tabular-nums leading-tight">{fmtINR(aggregateDemand)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Collected</span>
                    <span className="text-emerald-400 text-xs font-bold tabular-nums leading-tight">{fmtINR(aggregateCollected)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Outstanding</span>
                    <span className="text-amber-400 text-xs font-semibold tabular-nums leading-tight">{fmtINR(headerOutstanding)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Penalty</span>
                    <span className="text-red-400 text-xs font-semibold tabular-nums leading-tight">{selectedFinancials.totalPenalty > 0 ? fmtINR(selectedFinancials.totalPenalty) : '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Early Disc</span>
                    <span className="text-emerald-400 text-xs font-semibold tabular-nums leading-tight">{selectedFinancials.totalDiscount > 0 ? `-${fmtINR(selectedFinancials.totalDiscount)}` : '—'}</span>
                  </div>
                  {selectedFinancials.totalGst > 0 && (
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[9px] uppercase font-bold">GST</span>
                      <span className="text-slate-300 text-xs font-semibold tabular-nums leading-tight">{fmtINR(selectedFinancials.totalGst)}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Final Payable</span>
                    <span className="text-white text-sm font-black tabular-nums leading-tight">{fmtINR(headerPayableAmount)}</span>
                  </div>
                  {(canRecordPayment || isGovtOfficial) && (
                    <button
                      onClick={handlePayNow}
                      disabled={headerSelectedCount === 0}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-md shadow-sm transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Wallet size={13} /> Pay Now {headerSelectedCount > 0 && `(${headerSelectedCount})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Transaction Type Toggle Tabs ─────────────────────────────────────────── */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {txnGroups.map(g => {
              const isActive = g.code === activeTxnCode;
              const db = getDemandTypeBadgeStyle(g.code);
              return (
                <button
                  key={g.code}
                  onClick={() => { setActiveTxnCode(g.code); setActiveTab('demand_due'); }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${isActive ? 'bg-white' : db.dot}`} />
                  {g.label}
                  {g.pendingTiles.length > 0 && (
                    <span className={`inline-flex items-center justify-center px-1.5 py-0 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {g.pendingTiles.length}
                    </span>
                  )}
                  {g.pendingTiles.length > 0 && (
                    <span className={`text-[10px] tabular-nums ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                      {fmtINR(g.totalPending)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {actionError && (
          <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700 shrink-0">
            <AlertCircle size={13} className="shrink-0" /> {actionError}
            <button onClick={() => setActionError(null)} className="ml-auto p-0.5 text-red-400 hover:text-red-600 transition-colors shrink-0">
              <X size={12} />
            </button>
          </div>
        )}

        {/* ── Context Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 px-4 border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
          {tabsWithCount.map(tab => {
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

        {/* ── Tab Content ──────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={effectiveTab + (activeTxnCode ?? '')}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* ═══ Tab 1: Demand Due ════════════════════════════════════════════════ */}
              {effectiveTab === 'demand_due' && !allPaidOrExempted && (() => {
                const config = { components: mergedComponents, cadence: getDemandComponentConfig(activeGroup.code, headerTile.object_type).cadence } as const;
                const isMonthly = config.cadence === 'monthly';
                return (
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-end px-1">
                        <span className="text-[11px] text-slate-400">
                          {selectedDemandIds.size} selected · {fmtINR(selectedFinancials.totalOutstanding)}
                        </span>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-2 px-3 text-center font-bold text-slate-600 border-b border-slate-200 w-8" aria-label="Select demand" />
                                <th className="py-2 px-3 text-left font-bold text-slate-600 border-b border-slate-200">Sl No</th>
                                <th className="py-2 px-3 text-left font-bold text-slate-600 border-b border-slate-200">Period / Run Date</th>
                                {config.components.map(comp => (
                                  <th key={comp.key} className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">{comp.label}</th>
                                ))}
                                <th className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">Total Amount</th>
                                <th className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">Penalty</th>
                                <th className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">GST</th>
                                <th className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">Discount</th>
                                <th className="py-2 px-3 text-right font-bold text-slate-600 border-b border-slate-200">Total Due</th>
                                <th className="py-2 px-3 text-center font-bold text-slate-600 border-b border-slate-200">Dispute Date</th>
                                <th className="py-2 px-3 text-center font-bold text-slate-600 border-b border-slate-200">Dispute</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingTiles.map((tile, idx) => {
                                const isSelected = selectedDemandIds.has(tile.id);
                                const isExpanded = expandedDemandIds.has(tile.id);
                                const dd = demandDataMap[tile.id];
                                const disputes = dd?.disputes ?? [];
                                const dCount = disputes.filter(d => d.row_number === 1).length;
                                const isActive = disputePanelOpen && disputePanelDemandId === tile.id && disputePanelRow === 1;
                                const rowDisputes = disputes.filter(d => d.row_number === 1);
                                const latestDispute = rowDisputes.length > 0 ? rowDisputes.reduce((a, b) => a.dispute_date > b.dispute_date ? a : b) : null;

                                const tileConfig = getDemandComponentConfig(activeGroup.code, tile.object_type);
                                const baseAmount = tile.status === 'OVERDUE' ? tile.amount_due : tile.total_amount;
                                const charges: Record<string, number> = {};
                                for (const comp of tileConfig.components) {
                                  charges[comp.key] = Math.round(baseAmount * comp.ratio);
                                }
                                const breakdown = calculateDemandFinancials(tile, new Date().toISOString().slice(0, 10));

                                const periodLabel = (() => {
                                  const runDate = new Date(tile.demand_run_date);
                                  if (isNaN(runDate.getTime())) return 'One-Time';
                                  if (isMonthly) return runDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                                  return runDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                })();

                                return (
                                  <React.Fragment key={tile.id}>
                                    <tr
                                      className={`border-b border-slate-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/40' : ''} ${tile.status === 'OVERDUE' ? 'bg-red-50/20' : ''} ${isActive ? 'bg-orange-50/40' : ''} hover:bg-slate-50`}
                                      onClick={() => toggleDemand(tile.id)}
                                    >
                                      <td className="py-1.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => toggleDemand(tile.id)} className="flex items-center justify-center">
                                          {isSelected ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-slate-300" />}
                                        </button>
                                      </td>
                                      <td className="py-1.5 px-3 font-semibold text-slate-800 text-left">
                                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(tile.id); }} className="flex items-center gap-1 hover:text-blue-700 transition-colors">
                                          {isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                                          {idx + 1}
                                        </button>
                                      </td>
                                      <td className="py-1.5 px-3 font-semibold text-slate-800 text-left">
                                        <div className="flex flex-col">
                                          <span>{periodLabel}</span>
                                          <span className="text-[9px] text-slate-400">
                                            Run: {fmtDateShort(tile.demand_run_date)} · Due: {fmtDateShort(tile.due_date)}
                                            {tile.run_number != null && ` · Run #${tile.run_number}`}
                                          </span>
                                        </div>
                                      </td>
                                      {config.components.map(comp => (
                                        <td key={comp.key} className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                                          {(charges[comp.key] ?? 0) > 0 ? fmtINR(charges[comp.key]) : '—'}
                                        </td>
                                      ))}
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                                        {fmtINR(tile.total_amount)}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-red-600">
                                        {breakdown.penalty > 0 ? fmtINR(breakdown.penalty) : '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-700">
                                        {breakdown.gstAmount > 0 ? fmtINR(breakdown.gstAmount) : '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                                        {breakdown.discount > 0 ? `−${fmtINR(breakdown.discount)}` : '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                                        {fmtINR(breakdown.totalDue)}
                                      </td>
                                      <td className="py-1.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                                        {latestDispute ? (
                                          <span className="inline-flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] font-semibold text-orange-700 tabular-nums">{fmtDateShort(latestDispute.dispute_date)}</span>
                                            {rowDisputes.length > 1 && <span className="text-[8px] text-orange-400">({rowDisputes.length})</span>}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 text-[10px]">--</span>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                                        <button
                                          onClick={() => {
                                            if (isActive) {
                                              setDisputePanelOpen(false);
                                              setDisputePanelDemandId(null);
                                              setDisputePanelRow(null);
                                            } else {
                                              setDisputePanelOpen(true);
                                              setDisputePanelDemandId(tile.id);
                                              setDisputePanelRow(1);
                                              setDisputePanelLabel(periodLabel);
                                              setDisputeDate(new Date().toISOString().slice(0, 10));
                                              setDisputeReason('');
                                              setDisputeRemarks('');
                                            }
                                          }}
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${isActive ? 'bg-orange-600 text-white' : dCount > 0 ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                          title={dCount > 0 ? `${dCount} dispute(s) — click to view` : 'Raise a dispute'}
                                        >
                                          <MessageCircle size={12} />
                                          {dCount > 0 ? dCount : ''}
                                        </button>
                                      </td>
                                    </tr>
                                    {/* ── Expanded demand detail ───────────────────────────── */}
                                    {isExpanded && (
                                      <tr className="bg-slate-50/60">
                                        <td colSpan={config.components.length + 10} className="py-2.5 px-6">
                                          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[10px]">
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Demand ID</span>
                                              <span className="text-slate-600 font-mono">{tile.id.slice(0, 8).toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Run Date</span>
                                              <span className="text-slate-600">{fmtDateShort(tile.demand_run_date)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Due Date</span>
                                              <span className="text-slate-600">{fmtDateShort(tile.due_date)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Status</span>
                                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text}`}>{tile.status}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Object Type</span>
                                              <span className="text-slate-600">{tile.object_type}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Total Amount</span>
                                              <span className="text-slate-700 font-bold tabular-nums">{fmtINR(tile.total_amount)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Paid</span>
                                              <span className="text-emerald-600 font-semibold tabular-nums">{fmtINR(tile.amount_paid)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Outstanding</span>
                                              <span className="text-red-600 font-bold tabular-nums">{fmtINR(tile.amount_due)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">GST</span>
                                              <span className="text-slate-600">{tile.include_gst ? `${tile.gst_pct}% (${tile.gst_type})` : 'Not applicable'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Overdue Days</span>
                                              <span className="text-slate-600">{tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days} days` : '—'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-slate-400 font-bold uppercase">Last Paid</span>
                                              <span className="text-slate-600">{tile.last_paid_date ? `${fmtDateShort(tile.last_paid_date)} (${fmtINR(tile.last_paid_amount ?? 0)})` : '—'}</span>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 border-t-2 border-slate-200">
                                <td colSpan={config.components.length + 7} className="py-1.5 px-3 text-right font-bold text-slate-700">
                                  Selected Total Due ({selectedTiles.length}):
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono font-extrabold text-red-600">{fmtINR(selectedFinancials.totalFinalPayable)}</td>
                                <td colSpan={2} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* ── Dispute Conversation Panel ────────────────────────────── */}
                    <AnimatePresence>
                      {disputePanelOpen && disputePanelDemandId && disputePanelRow !== null && (() => {
                        const dd = demandDataMap[disputePanelDemandId];
                        const disputes = dd?.disputes ?? [];
                        const rowDisputes = disputes.filter(d => d.row_number === disputePanelRow);
                        return (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 overflow-hidden"
                          >
                            <div className="w-80 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col" style={{ maxHeight: '60vh' }}>
                              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-200 rounded-t-lg">
                                <MessageSquareWarning size={14} className="text-orange-600" />
                                <span className="text-xs font-bold text-slate-800 truncate">Disputes — {disputePanelLabel}</span>
                                <button
                                  onClick={() => { setDisputePanelOpen(false); setDisputePanelDemandId(null); setDisputePanelRow(null); }}
                                  className="ml-auto p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50">
                                {rowDisputes.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <MessageCircle size={24} className="text-slate-300 mb-2" />
                                    <p className="text-[11px] text-slate-400">No disputes raised for this entry yet.</p>
                                  </div>
                                ) : (
                                  rowDisputes.map(d => (
                                    <div key={d.id} className="flex flex-col">
                                      <div className="bg-orange-100 border border-orange-200 rounded-lg rounded-br-sm px-3 py-2 max-w-[90%] self-end">
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 mb-1">
                                          <span className="font-semibold">{fmtDateShort(d.dispute_date)}</span>
                                          {d.author_name && <span>· {d.author_name}</span>}
                                        </div>
                                        <div className="text-xs font-bold text-slate-800">{d.reason}</div>
                                        {d.remarks && <div className="text-[11px] text-slate-600 mt-0.5">{d.remarks}</div>}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="border-t border-slate-200 p-3 space-y-2 bg-white rounded-b-lg">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className={DCC_LABEL_CLS}>Date *</label>
                                    <input type="date" value={disputeDate} onChange={e => setDisputeDate(e.target.value)} className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`} />
                                  </div>
                                  <div>
                                    <label className={DCC_LABEL_CLS}>Reason *</label>
                                    <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5`}>
                                      <option value="">Select…</option>
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
                                  <textarea value={disputeRemarks} onChange={e => setDisputeRemarks(e.target.value)} placeholder="Additional details" className={`${DCC_INPUT_CLS} text-xs py-1.5 px-2.5 h-12 resize-none`} />
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    onClick={handleDispute}
                                    disabled={disputing || !disputeReason.trim()}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-orange-600 text-white text-[10px] font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors"
                                  >
                                    {disputing ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                                    {disputing ? 'Sending…' : 'Add Dispute'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                );
              })()}

              {/* ═══ Tab 2: Installments ═══════════════════════════════════════════════ */}
              {effectiveTab === 'installments' && !allPaidOrExempted && (
                <div className="space-y-3">
                  {/* Selection bar */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      onClick={toggleAllInst}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
                    >
                      {allInstRows.length > 0 && selectedInstRows.size === allInstRows.length ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                      Select All Pending
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {selectedInstRows.size} of {allInstRows.length} selected · {fmtINR(selectedInstTotal)}
                    </span>
                  </div>

                  {pendingTiles.map(tile => {
                    const dd = demandDataMap[tile.id];
                    const instRows = dd?.instRows ?? [];
                    const instPlan = dd?.instPlan;
                    if (instRows.length === 0) return null;
                    const pendingInstRows = instRows.filter(r => r.status !== 'PAID' && r.status !== 'EXEMPTED');

                    return (
                      <div key={tile.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-2">
                        {/* Demand details header for this grid */}
                        <div className="flex items-center gap-2 flex-wrap pb-1.5 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800">{fmtDateShort(tile.demand_run_date)}</span>
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">{tile.status}</span>
                          <span className="text-[10px] text-slate-400">Due: {fmtDateShort(tile.due_date)}</span>
                          <span className="text-[10px] font-semibold text-amber-600">Outstanding: {fmtINR(tile.amount_due)}</span>
                          <span className="text-[10px] text-slate-400">Demand: {tile.id.slice(0, 8).toUpperCase()}</span>
                          {tile.run_number != null && <span className="text-[10px] text-slate-400">Run #{tile.run_number}</span>}
                          {instPlan && (
                            <span className="ml-auto text-[10px] text-slate-400">{instPlan.no_of_installments} installments · Balance: {fmtINR(instPlan.balance_payment)}</span>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600">
                                <th className="px-1.5 py-1 text-center font-bold w-8">
                                  {pendingInstRows.length > 0 && (
                                    <button onClick={() => {
                                      const ids = pendingInstRows.map(r => r.id);
                                      const allSel = ids.every(id => selectedInstRows.has(id));
                                      setSelectedInstRows(prev => {
                                        const next = new Set(prev);
                                        if (allSel) { ids.forEach(id => next.delete(id)); } else { ids.forEach(id => next.add(id)); }
                                        return next;
                                      });
                                    }} className="flex items-center justify-center">
                                      {pendingInstRows.length > 0 && pendingInstRows.every(r => selectedInstRows.has(r.id)) ? <CheckSquare size={12} className="text-blue-600" /> : <Square size={12} className="text-slate-300" />}
                                    </button>
                                  )}
                                </th>
                                <th className="px-1.5 py-1 text-left font-bold">Seq</th>
                                <th className="px-1.5 py-1 text-right font-bold">Total Amt</th>
                                <th className="px-1.5 py-1 text-right font-bold">Discount</th>
                                <th className="px-1.5 py-1 text-right font-bold">Penalty</th>
                                <th className="px-1.5 py-1 text-right font-bold">GST</th>
                                <th className="px-1.5 py-1 text-left font-bold">Due Date</th>
                                <th className="px-1.5 py-1 text-left font-bold">Paid Date</th>
                                <th className="px-1.5 py-1 text-right font-bold">Paid</th>
                                <th className="px-1.5 py-1 text-right font-bold">Remaining</th>
                                <th className="px-1.5 py-1 text-center font-bold">Status</th>
                                <th className="px-1.5 py-1 text-center font-bold">Dispute Date</th>
                                <th className="px-1.5 py-1 text-center font-bold">Dispute</th>
                              </tr>
                            </thead>
                            <tbody>
                              {instRows.map(row => {
                                const isSelectable = row.status !== 'PAID' && row.status !== 'EXEMPTED' && row.remaining_amount > 0;
                                const isSel = selectedInstRows.has(row.id);
                                const dd2 = demandDataMap[tile.id];
                                const rowDisputes = (dd2?.disputes ?? []).filter(d => d.row_number === row.row_number);
                                const dCount = rowDisputes.length;
                                const latestDispute = rowDisputes.length > 0 ? rowDisputes.reduce((a, b) => a.dispute_date > b.dispute_date ? a : b) : null;
                                const isActiveRow = disputePanelOpen && disputePanelDemandId === tile.id && disputePanelRow === row.row_number;

                                return (
                                  <tr key={row.id} className={`${row.status === 'PAID' ? 'bg-emerald-50/40' : row.status === 'OVERDUE' ? 'bg-red-50/30' : ''} ${isSel ? 'bg-blue-50/40' : ''} ${isActiveRow ? 'bg-orange-50/40' : ''}`}>
                                    <td className="px-1.5 py-1 text-center">
                                      {isSelectable && (
                                        <button onClick={() => toggleInstRow(row.id)} className="flex items-center justify-center">
                                          {isSel ? <CheckSquare size={12} className="text-blue-600" /> : <Square size={12} className="text-slate-300" />}
                                        </button>
                                      )}
                                    </td>
                                    <td className="px-1.5 py-1 font-semibold text-slate-700">{row.label}</td>
                                    <td className="px-1.5 py-1 text-right tabular-nums font-bold">{fmtINR(row.amount)}</td>
                                    <td className="px-1.5 py-1 text-right tabular-nums text-slate-400">{row.row_number === 0 && row.late_fee > 0 ? fmtINR(0) : '—'}</td>
                                    <td className="px-1.5 py-1 text-right tabular-nums text-slate-400">{row.late_fee > 0 && row.row_number > 0 ? fmtINR(row.late_fee) : '—'}</td>
                                    <td className="px-1.5 py-1 text-right tabular-nums text-slate-400">{row.gst_amount > 0 ? fmtINR(row.gst_amount) : '—'}</td>
                                    <td className="px-1.5 py-1 text-left text-slate-500">{fmtDateShort(row.due_date)}</td>
                                    <td className="px-1.5 py-1 text-left text-slate-500">{fmtDateShort(row.paid_date)}</td>
                                    <td className="px-1.5 py-1 text-right tabular-nums text-emerald-600 font-semibold">{row.paid_amt > 0 ? fmtINR(row.paid_amt) : '—'}</td>
                                    <td className="px-1.5 py-1 text-right tabular-nums font-semibold text-slate-700">{row.remaining_amount > 0 ? fmtINR(row.remaining_amount) : '—'}</td>
                                    <td className="px-1.5 py-1 text-center">
                                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        row.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                        row.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>{row.status}</span>
                                    </td>
                                    <td className="px-1.5 py-1 text-center">
                                      {latestDispute ? (
                                        <span className="inline-flex flex-col items-center gap-0.5">
                                          <span className="text-[9px] font-semibold text-orange-700 tabular-nums">{fmtDateShort(latestDispute.dispute_date)}</span>
                                          {rowDisputes.length > 1 && <span className="text-[8px] text-orange-400">({rowDisputes.length})</span>}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[9px]">--</span>
                                      )}
                                    </td>
                                    <td className="px-1.5 py-1 text-center">
                                      <button
                                        onClick={() => {
                                          if (isActiveRow) {
                                            setDisputePanelOpen(false);
                                            setDisputePanelDemandId(null);
                                            setDisputePanelRow(null);
                                          } else {
                                            setDisputePanelOpen(true);
                                            setDisputePanelDemandId(tile.id);
                                            setDisputePanelRow(row.row_number);
                                            setDisputePanelLabel(row.label);
                                            setDisputeDate(new Date().toISOString().slice(0, 10));
                                            setDisputeReason('');
                                            setDisputeRemarks('');
                                          }
                                        }}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${isActiveRow ? 'bg-orange-600 text-white' : dCount > 0 ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                        title={dCount > 0 ? `${dCount} dispute(s) — click to view` : 'Raise a dispute'}
                                      >
                                        <MessageCircle size={12} />
                                        {dCount > 0 ? dCount : ''}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  {pendingTiles.every(t => (demandDataMap[t.id]?.instRows ?? []).length === 0) && (
                    <div className="text-center py-8 text-slate-400">
                      <Layers size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No installment plans created yet for these demands.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ Tab 3: Demand History ════════════════════════════════════════════ */}
              {effectiveTab === 'paid_history' && (() => {
                const isFullyPaid = aggregateOutstanding <= 0;
                const badgeCls: Record<string, string> = {
                  payment: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                  created: 'bg-blue-50 text-blue-700 border border-blue-200',
                  modified: 'bg-amber-50 text-amber-700 border border-amber-200',
                  dispute: 'bg-orange-50 text-orange-700 border border-orange-200',
                  approved: 'bg-teal-50 text-teal-700 border border-teal-200',
                  amended: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
                };
                const badgeText: Record<string, string> = {
                  payment: 'Payment', created: 'Created', modified: 'Modified',
                  dispute: 'Dispute', approved: 'Approved', amended: 'Amended',
                };

                return (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className={`h-1 ${isFullyPaid ? 'bg-emerald-500' : st.dot} shrink-0`} />
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Total Demand:</span>
                        <span className="text-sm font-extrabold text-slate-900 tabular-nums">{fmtINR(aggregateDemand)}</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200" />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Collected ({totalPaymentsCount}):</span>
                        <span className="text-sm font-extrabold text-emerald-600 tabular-nums">{fmtINR(aggregateCollected)}</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200" />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Outstanding:</span>
                        <span className={`text-sm font-extrabold tabular-nums ${isFullyPaid ? 'text-emerald-600' : 'text-red-600'}`}>{fmtINR(aggregateOutstanding)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-2">· {activeGroup.label}</span>
                    </div>
                    {allActivities.length === 0 ? (
                      <div className="border-t border-slate-100 text-center py-8 text-slate-400">
                        <History size={24} className="mx-auto mb-1.5 opacity-30" />
                        <p className="text-xs">No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
                        {allActivities.map(act => {
                          const dd = demandDataMap[act.demandId];
                          const p = act.kind === 'payment' ? dd?.payments.find(pay => pay.id === act.id.slice(4)) : null;
                          const a = act.kind === 'created' || act.kind === 'modified' ? dd?.auditLog.find(e => e.id === act.id.slice(6)) : null;
                          const d = act.kind === 'dispute' ? dd?.disputes.find(disp => disp.id === act.id.slice(5)) : null;
                          const runLog = dd?.runLog;
                          return (
                            <div key={act.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
                              <div className="flex flex-col gap-2 text-[10px]">
                                <div className="flex items-center gap-2">
                                  <span className={`self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold ${badgeCls[act.kind]}`}>
                                    {badgeText[act.kind]}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    {fmtDateShort(act.tile.demand_run_date)} · {act.tile.demand_type_label}
                                  </span>
                                </div>
                                {act.kind === 'payment' && p && (
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                    <span className="text-slate-400 shrink-0">Receipt: <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">{receiptNumber(p.id)}</span></span>
                                    <span className="text-slate-400 inline-flex items-center gap-1 shrink-0"><Calendar size={9} className="opacity-50" />Date: <span className="text-slate-600 font-medium">{fmtDateTimeDDMMYYYY(act.timestamp)}</span></span>
                                    <span className="text-slate-400 shrink-0">Mode: <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">{PAYMENT_MODE_LABELS[p.payment_mode as PaymentMode] ?? p.payment_mode}</span></span>
                                    <span className="text-slate-400 shrink-0">Amount: <span className="text-sm font-extrabold text-emerald-700 tabular-nums">{fmtINR(p.amount)}</span></span>
                                    <span className="text-slate-400 shrink-0">Reference: <span className="text-slate-600 font-medium">{p.reference_number || '—'}</span></span>
                                    {p.remarks && <span className="text-slate-400 max-w-[260px] truncate">Remarks: <span className="text-slate-600 font-medium" title={p.remarks}>{p.remarks}</span></span>}
                                    <button
                                      onClick={() => { if (!act.tile) return; setDownloadingReceiptId(p.id); try { generatePaymentReceipt({ payment: p, tile: act.tile, demand: dd?.demand ?? null }); } catch { setActionError('Failed to generate receipt'); } finally { setDownloadingReceiptId(null); } }}
                                      disabled={downloadingReceiptId === p.id}
                                      className="ml-1 inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-semibold hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                                    >
                                      {downloadingReceiptId === p.id ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
                                      {downloadingReceiptId === p.id ? 'Gen…' : 'Receipt'}
                                    </button>
                                  </div>
                                )}
                                {act.kind === 'created' && a && (
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                    <span className="text-slate-400 inline-flex items-center gap-1 shrink-0"><Calendar size={9} className="opacity-50" />Date: <span className="text-slate-600 font-medium">{fmtDateTimeDDMMYYYY(act.timestamp)}</span></span>
                                    <span className="text-slate-400 shrink-0">Amount: <span className="text-slate-700 font-bold">{fmtINR(act.tile.total_amount)}</span></span>
                                    <span className="text-slate-400 shrink-0">Due: <span className="text-slate-700 font-bold">{fmtDateShort(act.tile.due_date)}</span></span>
                                    <span className="text-slate-400 shrink-0">By: <span className="text-slate-600 font-medium">{a.actor_label}</span></span>
                                  </div>
                                )}
                                {act.kind === 'modified' && a && (() => {
                                  const amendFields = a.changed_fields.filter(f => f !== 'updated_at');
                                  return (
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                      <span className="text-slate-400 inline-flex items-center gap-1 shrink-0"><Calendar size={9} className="opacity-50" />Date: <span className="text-slate-600 font-medium">{fmtDateTimeDDMMYYYY(act.timestamp)}</span></span>
                                      {amendFields.length === 0 ? (
                                        <span className="text-slate-500">General details updated</span>
                                      ) : amendFields.map(f => (
                                        <span key={f} className="text-slate-400 shrink-0">{f.replace(/_/g, ' ')}: <span className="text-slate-700 font-bold">{String(a.new_values[f] ?? '—')}</span></span>
                                      ))}
                                      <span className="text-slate-400 shrink-0">By: <span className="text-slate-600 font-medium">{a.actor_label}</span></span>
                                    </div>
                                  );
                                })()}
                                {act.kind === 'dispute' && d && (
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                    <span className="text-slate-400 inline-flex items-center gap-1 shrink-0"><Calendar size={9} className="opacity-50" />Date: <span className="text-slate-600 font-medium">{fmtDateTimeDDMMYYYY(act.timestamp)}</span></span>
                                    <span className="text-slate-400 shrink-0">Reason: <span className="text-orange-700 font-bold">{d.reason}</span></span>
                                    {d.remarks && <span className="text-slate-400 max-w-[260px] truncate">Remarks: <span className="text-slate-600 font-medium" title={d.remarks}>{d.remarks}</span></span>}
                                    <span className="text-slate-400 shrink-0">By: <span className="text-slate-600 font-medium">{d.author_name || '—'}</span></span>
                                  </div>
                                )}
                                {act.kind === 'approved' && runLog && (
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                    <span className="text-slate-400 inline-flex items-center gap-1 shrink-0"><Calendar size={9} className="opacity-50" />Date: <span className="text-slate-600 font-medium">{fmtDateTimeDDMMYYYY(act.timestamp)}</span></span>
                                    <span className="text-slate-400 shrink-0">Status: <span className="text-teal-700 font-bold">{runLog.approval_status}</span></span>
                                    <span className="text-slate-400 shrink-0">Run: <span className="text-slate-600 font-medium">#{runLog.run_number}</span></span>
                                    <span className="text-slate-400 shrink-0">By: <span className="text-slate-600 font-medium">{runLog.approved_by || '—'}</span></span>
                                  </div>
                                )}
                                {act.kind === 'amended' && runLog && (
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                    <span className="text-slate-400 inline-flex items-center gap-1 shrink-0"><Calendar size={9} className="opacity-50" />Date: <span className="text-slate-600 font-medium">{fmtDateTimeDDMMYYYY(act.timestamp)}</span></span>
                                    <span className="text-slate-400 shrink-0">Run: <span className="text-slate-600 font-medium">#{runLog.run_number}</span></span>
                                    <span className="text-slate-400 shrink-0">By: <span className="text-slate-600 font-medium">{runLog.amended_by || '—'}</span></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Unified Payment Modal ─────────────────────────────────────────────── */}
        {showPayModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => { if (!payModalRecording && payModalStep !== 'processing') setShowPayModal(false); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
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
                  {!canRecordPayment && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[11px] text-amber-700 flex items-center gap-1.5">
                      <AlertCircle size={13} className="shrink-0" /> This is a demo payment screen. No real payment will be processed.
                    </div>
                  )}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {canRecordPayment ? 'Record Amount' : 'Outstanding'}
                      </span>
                      <span className="text-lg font-black text-slate-900 tabular-nums leading-tight">
                        {fmtINR(payModalContext === 'installments' ? selectedInstTotal : selectedFinancials.totalFinalPayable)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">For</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {payModalContext === 'installments'
                          ? `${selectedInstallments.length} installment${selectedInstallments.length !== 1 ? 's' : ''}`
                          : `${selectedTiles.length} demand${selectedTiles.length !== 1 ? 's' : ''} · ${activeGroup.label}`}
                      </span>
                    </div>
                  </div>
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
                      ? (payModalRecording ? 'Recording…' : `Record ${fmtINR(payModalContext === 'installments' ? selectedInstTotal : selectedFinancials.totalFinalPayable)} via ${PAY_MODAL_METHODS.find(m => m.key === payModalMode)?.label}`)
                      : `Pay ${fmtINR(payModalContext === 'installments' ? selectedInstTotal : selectedFinancials.totalFinalPayable)} via ${PAY_MODAL_METHODS.find(m => m.key === payModalMode)?.label}`
                    }
                  </button>
                </div>
              )}
              {payModalStep === 'processing' && (
                <div className="px-4 py-16 flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-600">Processing {payModalMode} payment…</p>
                </div>
              )}
              {payModalStep === 'done' && (
                <div className="px-4 py-10 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Demo Payment Successful</h3>
                  <p className="text-xs text-slate-500 text-center max-w-xs">
                    This was a simulated payment of {fmtINR(payModalContext === 'installments' ? selectedInstTotal : selectedFinancials.totalFinalPayable)} via {payModalMode}. No actual payment was recorded — demand balances remain unchanged.
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

export default ObjectDemandDueScreen;
