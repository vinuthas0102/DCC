import React, { useState } from 'react';
import {
  HardHat, X, User, FileText, CheckSquare, Square,
  ChevronDown, Droplets, Zap, PlayCircle,
} from 'lucide-react';
import { buildDefaultChecklist, ChecklistItemDraft } from '../../constants/inspectionChecklist';

const CONDITIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS REPAIR'] as const;
type Condition = typeof CONDITIONS[number];

const CONDITION_STYLE: Record<Condition, string> = {
  EXCELLENT:    'bg-emerald-600 text-white border-emerald-600',
  GOOD:         'bg-teal-600   text-white border-teal-600',
  FAIR:         'bg-amber-500  text-white border-amber-500',
  POOR:         'bg-orange-600 text-white border-orange-600',
  'NEEDS REPAIR': 'bg-red-600  text-white border-red-600',
};

interface Props {
  requestRef?: string;
  quarterRef?: string;
  inspectorName: string;
  openingRemarks: string;
  condition: string;
  checklist: ChecklistItemDraft[];
  submitting: boolean;
  onInspectorNameChange: (v: string) => void;
  onOpeningRemarksChange: (v: string) => void;
  onConditionChange: (v: string) => void;
  onChecklistChange: (items: ChecklistItemDraft[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function ChecklistSection({
  title,
  icon,
  color,
  items,
  onChange,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: ChecklistItemDraft[];
  onChange: (items: ChecklistItemDraft[]) => void;
}) {
  const setItem = (idx: number, patch: Partial<ChecklistItemDraft>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2.5 ${color}`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
        <span className="ml-auto text-[10px] font-medium opacity-70">{items.filter(i => i.is_checked).length}/{items.length} verified</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[20px_1fr_72px_1fr] gap-x-3 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div />
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Item</div>
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Qty</div>
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Remarks</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {items.map((item, idx) => (
          <div
            key={item.item_name}
            className={`grid grid-cols-[20px_1fr_72px_1fr] gap-x-3 items-center px-3 py-2.5 transition-colors ${item.is_checked ? 'bg-green-50/50' : 'hover:bg-gray-50/60'}`}
          >
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => setItem(idx, { is_checked: !item.is_checked })}
              className="flex items-center justify-center shrink-0"
            >
              {item.is_checked
                ? <CheckSquare size={16} className="text-emerald-600" />
                : <Square size={16} className="text-gray-300 hover:text-gray-400 transition-colors" />
              }
            </button>

            {/* Item name */}
            <span className={`text-sm leading-tight ${item.is_checked ? 'text-gray-700' : 'text-gray-600'}`}>
              {item.item_name}
            </span>

            {/* Quantity */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={item.actual_qty ?? ''}
                onChange={e => setItem(idx, { actual_qty: e.target.value === '' ? null : parseInt(e.target.value) })}
                placeholder="—"
                className="w-full text-center text-xs font-semibold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 placeholder-gray-300"
              />
            </div>

            {/* Remarks */}
            <input
              type="text"
              value={item.remarks}
              onChange={e => setItem(idx, { remarks: e.target.value })}
              placeholder="Add remark…"
              className="text-xs border border-gray-100 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-white placeholder-gray-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InspectionFormModal({
  requestRef,
  quarterRef,
  inspectorName,
  openingRemarks,
  condition,
  checklist,
  submitting,
  onInspectorNameChange,
  onOpeningRemarksChange,
  onConditionChange,
  onChecklistChange,
  onClose,
  onSubmit,
}: Props) {
  const civilItems = checklist.filter(i => i.category === 'CIVIL');
  const electricalItems = checklist.filter(i => i.category === 'ELECTRICAL');

  const setCivilItems = (items: ChecklistItemDraft[]) =>
    onChecklistChange([...items, ...electricalItems]);
  const setElectricalItems = (items: ChecklistItemDraft[]) =>
    onChecklistChange([...civilItems, ...items]);

  const totalChecked = checklist.filter(i => i.is_checked).length;
  const totalItems = checklist.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        {/* ── Sticky Header ─────────────────────────── */}
        <div className="shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <HardHat size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">New Inspection</h2>
              {(requestRef || quarterRef) && (
                <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                  {[requestRef, quarterRef].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-4"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100 shrink-0">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: totalItems > 0 ? `${(totalChecked / totalItems) * 100}%` : '0%' }}
          />
        </div>

        {/* ── Scrollable Body ───────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Inspector Details */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Inspection Details</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Inspector Name
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={inspectorName}
                  onChange={e => onInspectorNameChange(e.target.value)}
                  placeholder="Full name of the inspecting officer"
                  className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opening Remarks</label>
              <div className="relative">
                <FileText size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                <textarea
                  value={openingRemarks}
                  onChange={e => onOpeningRemarksChange(e.target.value)}
                  rows={3}
                  placeholder="Describe the purpose of this inspection, any pre-existing damage, or special notes…"
                  className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 resize-none placeholder-gray-300 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Initial Condition */}
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Initial Condition</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onConditionChange(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    condition === c
                      ? CONDITION_STYLE[c]
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist Header */}
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                Fittings Checklist — {totalChecked}/{totalItems} Verified
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Tick each item to confirm it is present and in working condition. Adjust quantities to match actual count. Add remarks for any discrepancy.
            </p>
          </div>

          {/* Civil Items */}
          <ChecklistSection
            title="Civil Items"
            icon={<Droplets size={13} className="text-blue-200" />}
            color="bg-blue-700 text-blue-50"
            items={civilItems}
            onChange={setCivilItems}
          />

          {/* Electrical Items */}
          <ChecklistSection
            title="Electrical Items"
            icon={<Zap size={13} className="text-yellow-200" />}
            color="bg-amber-700 text-amber-50"
            items={electricalItems}
            onChange={setElectricalItems}
          />

        </div>

        {/* ── Sticky Footer ─────────────────────────── */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3">
          <div className="flex-1 text-xs text-gray-400">
            {totalChecked > 0
              ? <span className="text-emerald-600 font-semibold">{totalChecked} item{totalChecked !== 1 ? 's' : ''} verified</span>
              : 'No items verified yet'
            }
            {' '}· {totalItems - totalChecked} remaining
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !inspectorName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold hover:bg-slate-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Starting…
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                Start Inspection
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// Helper to build a fresh default checklist (re-exported for convenience)
export { buildDefaultChecklist };
export type { ChecklistItemDraft };
