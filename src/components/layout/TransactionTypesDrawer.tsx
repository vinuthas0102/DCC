import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface DemoTxnType {
  code: string;
  label: string;
  description: string;
  dot: string;
  cardBg: string;
  cardBorder: string;
}

const DEMO_TXN_TYPES: DemoTxnType[] = [
  { code: 'LOAN',         label: 'Loan Installment',  description: 'Recurring loan repayment installments',          dot: 'bg-blue-500',      cardBg: 'bg-blue-50',      cardBorder: 'border-blue-200' },
  { code: 'INSURANCE',    label: 'Insurance',         description: 'Premium collections for insurance policies',      dot: 'bg-teal-500',      cardBg: 'bg-teal-50',      cardBorder: 'border-teal-200' },
  { code: 'PROPERTY_TAX', label: 'Property Tax',      description: 'Annual or quarterly property tax demands',       dot: 'bg-amber-500',     cardBg: 'bg-amber-50',      cardBorder: 'border-amber-200' },
  { code: 'MAINTENANCE',  label: 'Maintenance',       description: 'Routine maintenance and upkeep charges',          dot: 'bg-rose-500',      cardBg: 'bg-rose-50',       cardBorder: 'border-rose-200' },
  { code: 'RENT',         label: 'Rent',              description: 'Monthly rent collection for leased assets',       dot: 'bg-emerald-500',   cardBg: 'bg-emerald-50',    cardBorder: 'border-emerald-200' },
  { code: 'SECURITY',     label: 'Security Deposit',  description: 'Refundable security deposit demands',             dot: 'bg-slate-500',     cardBg: 'bg-slate-50',      cardBorder: 'border-slate-200' },
];

export const TransactionTypesDrawer: React.FC = () => {
  const { txnTypesDrawerOpen, closeTxnTypesDrawer } = useUIStore();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!txnTypesDrawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTxnTypesDrawer(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [txnTypesDrawerOpen, closeTxnTypesDrawer]);

  useEffect(() => {
    document.body.style.overflow = txnTypesDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [txnTypesDrawerOpen]);

  useEffect(() => {
    if (!txnTypesDrawerOpen) setSelectedCode(null);
  }, [txnTypesDrawerOpen]);

  return (
    <AnimatePresence>
      {txnTypesDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeTxnTypesDrawer}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 flex flex-col bg-white shadow-2xl h-full w-full max-w-[400px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={17} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">Transaction Types</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Demo showcase — no actions attached</p>
                </div>
              </div>
              <button
                onClick={closeTxnTypesDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                aria-label="Close transaction types"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-header banner */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Browse the available transaction categories used across the Demand &amp; Collection Center. Select any item to highlight it — this is a demo view only.
              </p>
            </div>

            {/* Transaction type list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/40">
              {DEMO_TXN_TYPES.map((txn, idx) => {
                const isSelected = selectedCode === txn.code;
                return (
                  <motion.button
                    key={txn.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCode(isSelected ? null : txn.code)}
                    className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? `${txn.cardBg} ${txn.cardBorder} ring-2 ring-offset-1 ring-blue-400/30 shadow-sm`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Color dot */}
                    <span className={`mt-0.5 w-3 h-3 rounded-full ${txn.dot} shrink-0 ring-2 ring-white shadow-sm`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-900 leading-tight">{txn.label}</span>
                        <span className="text-[9px] font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{txn.code}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{txn.description}</p>
                    </div>

                    {/* Selected indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 shrink-0 mt-0.5"
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-100 flex-shrink-0">
              <button
                onClick={closeTxnTypesDrawer}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
              >
                <X size={14} /> Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
