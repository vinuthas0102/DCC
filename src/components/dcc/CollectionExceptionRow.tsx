import React from 'react';

interface Props {
  exceptionType: string;
  seqNo: number;
  demandSlabMin: string;
  demandSlabMax: string;
  offsetDays: string;
  applicablePct: string;
  pctBasis: string;
  pctMin: string;
  pctMax: string;
  actualAmount: string;
  messageHook: string;
  onChange: (field: string, value: string) => void;
  onRemove: () => void;
}

const inputCls =
  'w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-white text-gray-700 transition-colors';

const EXCEPTION_COLORS: Record<string, string> = {
  Installment: 'bg-sky-100 text-sky-700',
  Discount: 'bg-emerald-100 text-emerald-700',
  Penalty: 'bg-red-100 text-red-700',
  Alert: 'bg-amber-100 text-amber-700',
};

export const CollectionExceptionRow: React.FC<Props> = ({
  exceptionType,
  seqNo,
  demandSlabMin,
  demandSlabMax,
  offsetDays,
  applicablePct,
  pctBasis,
  pctMin,
  pctMax,
  actualAmount,
  messageHook,
  onChange,
  onRemove,
}) => {
  return (
    <div className="grid grid-cols-12 gap-1.5 items-center p-2 bg-gray-50 rounded-lg">
      <div className="col-span-2 flex items-center gap-1">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${EXCEPTION_COLORS[exceptionType] ?? 'bg-gray-100 text-gray-600'}`}>
          {exceptionType}
        </span>
        <span className="text-[10px] text-gray-400">#{seqNo}</span>
      </div>
      <input
        type="number"
        placeholder="Slab Min"
        className={`${inputCls} col-span-1`}
        value={demandSlabMin}
        onChange={(e) => onChange('demand_slab_min', e.target.value)}
      />
      <input
        type="number"
        placeholder="Slab Max"
        className={`${inputCls} col-span-1`}
        value={demandSlabMax}
        onChange={(e) => onChange('demand_slab_max', e.target.value)}
      />
      <input
        type="number"
        placeholder="Offset Days"
        className={`${inputCls} col-span-1`}
        value={offsetDays}
        onChange={(e) => onChange('offset_days', e.target.value)}
      />
      <input
        type="number"
        placeholder="App %"
        className={`${inputCls} col-span-1`}
        value={applicablePct}
        onChange={(e) => onChange('applicable_pct', e.target.value)}
      />
      <select
        className={`${inputCls} col-span-1`}
        value={pctBasis}
        onChange={(e) => onChange('pct_basis', e.target.value)}
      >
        <option value="Daily">Daily</option>
        <option value="Monthly">Monthly</option>
        <option value="Yearly">Yearly</option>
      </select>
      <input
        type="number"
        placeholder="Min"
        className={`${inputCls} col-span-1`}
        value={pctMin}
        onChange={(e) => onChange('pct_min', e.target.value)}
      />
      <input
        type="number"
        placeholder="Max"
        className={`${inputCls} col-span-1`}
        value={pctMax}
        onChange={(e) => onChange('pct_max', e.target.value)}
      />
      <input
        type="number"
        placeholder="Actual Amt"
        className={`${inputCls} col-span-1`}
        value={actualAmount}
        onChange={(e) => onChange('actual_amount', e.target.value)}
      />
      <input
        placeholder="Hook"
        className={`${inputCls} col-span-1`}
        value={messageHook}
        onChange={(e) => onChange('message_hook', e.target.value)}
      />
      <button
        onClick={onRemove}
        className="col-span-1 flex items-center justify-center p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>
  );
};

export default CollectionExceptionRow;
