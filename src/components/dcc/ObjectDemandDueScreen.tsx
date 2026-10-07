import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, MapPin, Building2, Receipt, ChevronLeft, ChevronRight,
  Wallet, CheckCircle2, AlertTriangle, Loader2,
  CreditCard, Smartphone, Building, Banknote,
  CheckSquare, Square, ArrowRight,
} from 'lucide-react';
import { dccService } from '../../services/dccService';
import { useAuthStore } from '../../stores/authStore';
import type { DccTile } from '../../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtDateShort,
  getDemandTypeBadgeStyle,
} from '../../constants/dccTheme';

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

interface TxnTypeGroup {
  code: string;
  label: string;
  tiles: DccTile[];
  totalPending: number;
  pendingCount: number;
}

function groupByTxnType(tiles: DccTile[]): TxnTypeGroup[] {
  const map = new Map<string, TxnTypeGroup>();
  for (const t of tiles) {
    const code = t.demand_type_code || 'UNKNOWN';
    const label = t.demand_type_label || t.demand_type_code || 'Unknown';
    const pending = t.status === 'DUE' || t.status === 'OVERDUE';
    const entry = map.get(code) ?? { code, label, tiles: [], totalPending: 0, pendingCount: 0 };
    entry.tiles.push(t);
    if (pending) {
      entry.totalPending += t.amount_due;
      entry.pendingCount++;
    }
    map.set(code, entry);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => b.totalPending - a.totalPending);
  return groups;
}

const PAYMENT_METHODS = [
  { key: 'UPI', label: 'UPI', icon: Smartphone, desc: 'Pay via UPI' },
  { key: 'NETBANKING', label: 'Net Banking', icon: Building, desc: 'Bank transfer' },
  { key: 'CARD', label: 'Card', icon: CreditCard, desc: 'Debit / Credit' },
  { key: 'CHEQUE', label: 'Cheque', icon: Banknote, desc: 'Cheque payment' },
] as const;

export const ObjectDemandDueScreen: React.FC<ObjectDemandDueScreenProps> = ({
  ownerId, ownerName, ownerContact, ownerAddress,
  objectId, objectRef,
  onBack, onClose,
}) => {
  const { user } = useAuthStore();
  const canRecordPayment = user?.role === 'manager' || user?.role === 'admin';

  const [allTiles, setAllTiles] = useState<DccTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTxnCode, setActiveTxnCode] = useState<string | null>(null);
  const [selectedDemandIds, setSelectedDemandIds] = useState<Set<string>>(new Set());
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMode, setPayMode] = useState<string>('UPI');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

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

  // Auto-select first transaction type with pending demands
  useEffect(() => {
    if (!activeTxnCode && txnGroups.length > 0) {
      const firstPending = txnGroups.find(g => g.pendingCount > 0);
      setActiveTxnCode(firstPending?.code ?? txnGroups[0].code);
    }
  }, [txnGroups, activeTxnCode]);

  const activeGroup = useMemo(
    () => txnGroups.find(g => g.code === activeTxnCode) ?? null,
    [txnGroups, activeTxnCode],
  );

  const pendingTiles = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.tiles
      .filter(t => t.status === 'DUE' || t.status === 'OVERDUE')
      .sort((a, b) => {
        if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
        if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [activeGroup]);

  // Default: select all pending demands
  useEffect(() => {
    if (pendingTiles.length > 0) {
      setSelectedDemandIds(new Set(pendingTiles.map(t => t.id)));
    } else {
      setSelectedDemandIds(new Set());
    }
  }, [activeTxnCode, pendingTiles]);

  const selectedTiles = useMemo(
    () => pendingTiles.filter(t => selectedDemandIds.has(t.id)),
    [pendingTiles, selectedDemandIds],
  );

  const selectedTotal = useMemo(
    () => selectedTiles.reduce((s, t) => s + t.amount_due, 0),
    [selectedTiles],
  );

  const totalPendingAll = useMemo(
    () => txnGroups.reduce((s, g) => s + g.totalPending, 0),
    [txnGroups],
  );

  const toggleDemand = (id: string) => {
    setSelectedDemandIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedDemandIds.size === pendingTiles.length) {
      setSelectedDemandIds(new Set());
    } else {
      setSelectedDemandIds(new Set(pendingTiles.map(t => t.id)));
    }
  };

  const handlePay = async () => {
    if (selectedTiles.length === 0 || selectedTotal <= 0) return;
    setPaying(true);
    setPayError(null);
    setPaySuccess(null);
    try {
      if (canRecordPayment) {
        for (const tile of selectedTiles) {
          await dccService.submitPayment(
            tile.id,
            tile.object_id,
            tile.amount_due,
            payMode,
            payDate,
            payRef || undefined,
            payRemarks || `Bulk payment for ${selectedTiles.length} demand(s) — ${activeGroup?.label ?? ''}`,
          );
        }
        setPaySuccess(`Payment of ${fmtINR(selectedTotal)} recorded for ${selectedTiles.length} demand(s).`);
        setShowPayModal(false);
        setPayRef('');
        setPayRemarks('');
        setSelectedDemandIds(new Set());
        await load();
      } else {
        setPaySuccess(`Payment of ${fmtINR(selectedTotal)} initiated for ${selectedTiles.length} demand(s).`);
        setShowPayModal(false);
      }
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const allSelected = pendingTiles.length > 0 && selectedDemandIds.size === pendingTiles.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 top-10 z-[51] flex flex-col bg-slate-50 rounded-t-2xl shadow-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-800 to-blue-900 border-b border-blue-900 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-blue-700 transition-colors shrink-0"
            title="Back to Object Summary"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <Receipt size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base font-bold text-white truncate" title={objectRef}>{objectRef}</span>
              <span className="text-slate-400 shrink-0">·</span>
              <span className="text-sm font-semibold text-slate-200 truncate" title={ownerName}>{ownerName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Phone size={11} /> {ownerContact || '—'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={11} /> <span className="truncate max-w-[240px]">{ownerAddress || '—'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={11} /> {allTiles.length} demands
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Pending</span>
            <span className="text-lg font-extrabold text-amber-400 tabular-nums leading-tight">{fmtINR(totalPendingAll)}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-blue-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Transaction Type Tabs ── */}
        {!loading && !error && txnGroups.length > 0 && (
          <div className="px-5 py-2.5 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {txnGroups.map(g => {
                const isActive = g.code === activeTxnCode;
                const db = getDemandTypeBadgeStyle(g.code);
                return (
                  <button
                    key={g.code}
                    onClick={() => setActiveTxnCode(g.code)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${isActive ? 'bg-white' : db.dot}`} />
                    {g.label}
                    {g.pendingCount > 0 && (
                      <span className={`inline-flex items-center justify-center px-1.5 py-0 rounded-full text-[9px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {g.pendingCount}
                      </span>
                    )}
                    {g.pendingCount > 0 && (
                      <span className={`text-[10px] tabular-nums ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {fmtINR(g.totalPending)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Active Transaction Summary Bar ── */}
        {!loading && !error && activeGroup && (
          <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-bold text-slate-800 truncate">{activeGroup.label}</span>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {pendingTiles.length} pending {pendingTiles.length !== activeGroup.tiles.length && `of ${activeGroup.tiles.length} total`}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Pending Total</span>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(activeGroup.totalPending)}</span>
                </div>
                <div className="w-px h-8 bg-slate-300" />
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider leading-none">Selected ({selectedTiles.length})</span>
                  <span className="text-sm font-extrabold text-blue-700 tabular-nums leading-tight">{fmtINR(selectedTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Demand List ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-2 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <AlertTriangle size={28} className="mb-2" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          ) : pendingTiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <CheckCircle2 size={36} className="text-emerald-400 mb-3" />
              <div className="text-sm font-medium text-slate-600">
                No pending demands for {activeGroup?.label ?? 'this transaction type'}
              </div>
              <div className="text-xs text-slate-400 mt-1">All demands are paid or exempted.</div>
            </div>
          ) : (
            <>
              {/* Select All bar */}
              <div className="flex items-center justify-between mb-2 px-1">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
                >
                  {allSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-[11px] text-slate-400">
                  {selectedDemandIds.size} of {pendingTiles.length} selected
                </span>
              </div>

              {/* Demand rows */}
              <div className="space-y-2">
                {pendingTiles.map((tile, idx) => {
                  const isSelected = selectedDemandIds.has(tile.id);
                  const st = DCC_STATUS[tile.status];
                  return (
                    <motion.div
                      key={tile.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.1) }}
                      className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-400 ring-1 ring-blue-200 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                      onClick={() => toggleDemand(tile.id)}
                    >
                      {/* Checkbox */}
                      <div className="shrink-0">
                        {isSelected
                          ? <CheckSquare size={18} className="text-blue-600" />
                          : <Square size={18} className="text-slate-300" />}
                      </div>

                      {/* Status dot */}
                      <div className={`w-1.5 h-10 rounded-full shrink-0 ${st.dot}`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {fmtDateShort(tile.demand_run_date)}
                          </span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border} shrink-0`}>
                            {st.label}
                          </span>
                          {tile.overdue_amount > 0 && (
                            <span className="text-[10px] font-semibold text-red-500 shrink-0">
                              +{fmtINR(tile.overdue_amount)} penalty
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            Due: <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                              {fmtDateShort(tile.due_date)}
                            </span>
                          </span>
                          {tile.include_gst && tile.gst_amount > 0 && (
                            <span>GST: {fmtINR(tile.gst_amount)}</span>
                          )}
                          {tile.amount_paid > 0 && (
                            <span className="text-emerald-600">Paid: {fmtINR(tile.amount_paid)}</span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Pending</span>
                        <span className={`text-sm font-extrabold tabular-nums leading-tight ${
                          isSelected ? 'text-blue-700' : 'text-slate-900'
                        }`}>
                          {fmtINR(tile.amount_due)}
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">of {fmtINR(tile.total_amount)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Payment Bar ── */}
        {!loading && !error && pendingTiles.length > 0 && (
          <div className="px-5 py-3 bg-white border-t border-slate-200 shrink-0 shadow-lg">
            {payError && (
              <div className="mb-2 text-xs font-medium text-red-600 flex items-center gap-1.5">
                <AlertTriangle size={14} /> {payError}
              </div>
            )}
            {paySuccess && (
              <div className="mb-2 text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {paySuccess}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                    {selectedTiles.length} demand{selectedTiles.length !== 1 ? 's' : ''} selected
                  </span>
                  <span className="text-xl font-extrabold text-blue-700 tabular-nums leading-tight">
                    {fmtINR(selectedTotal)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:block">
                  Payable amount
                </span>
              </div>
              <button
                onClick={() => {
                  setPayError(null);
                  setPaySuccess(null);
                  setShowPayModal(true);
                }}
                disabled={selectedTiles.length === 0 || selectedTotal <= 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Wallet size={18} />
                Pay {fmtINR(selectedTotal)}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Payment Modal ── */}
        <AnimatePresence>
          {showPayModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                onClick={() => !paying && setShowPayModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                  {/* Modal header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <Wallet size={18} className="text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Payment Checkout</h3>
                    </div>
                    <button
                      onClick={() => !paying && setShowPayModal(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Amount summary */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                          {activeGroup?.label} · {selectedTiles.length} demand{selectedTiles.length !== 1 ? 's' : ''}
                        </span>
                        <Receipt size={14} className="text-blue-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-blue-800 tabular-nums">
                        {fmtINR(selectedTotal)}
                      </div>
                    </div>

                    {/* Payment method */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Payment Method</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.map(m => {
                          const Icon = m.icon;
                          const isActive = payMode === m.key;
                          return (
                            <button
                              key={m.key}
                              onClick={() => setPayMode(m.key)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-1 ring-emerald-200'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <Icon size={16} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date + reference */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Payment Date</p>
                        <input
                          type="date"
                          value={payDate}
                          onChange={e => setPayDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reference No.</p>
                        <input
                          type="text"
                          value={payRef}
                          onChange={e => setPayRef(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Remarks</p>
                      <input
                        type="text"
                        value={payRemarks}
                        onChange={e => setPayRemarks(e.target.value)}
                        placeholder="Optional notes"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {payError && (
                      <div className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> {payError}
                      </div>
                    )}

                    {/* Pay button */}
                    <button
                      onClick={handlePay}
                      disabled={paying || selectedTotal <= 0}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paying ? (
                        <><Loader2 size={18} className="animate-spin" /> Processing...</>
                      ) : (
                        <><Wallet size={18} /> Pay {fmtINR(selectedTotal)}</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ObjectDemandDueScreen;
