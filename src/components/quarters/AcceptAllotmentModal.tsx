import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ThumbsUp, X, CheckCircle } from 'lucide-react';

const TERMS: string[] = [
  'The allotment of government quarter is made as per eligibility and availability, and is subject to change based on administrative requirements.',
  'The allottee shall use the quarter solely for residential purposes and shall not sublet, assign, or part with possession of the quarter.',
  'The allottee is responsible for maintaining the quarter in good condition and shall not carry out any structural alterations without prior written approval.',
  'Rent and other dues shall be paid regularly as per the prescribed schedule. Failure to pay dues may result in cancellation of allotment.',
  'The allottee shall vacate the quarter immediately upon transfer, retirement, resignation, or cessation of government service.',
  'Any damage to government property beyond normal wear and tear shall be recovered from the allottee.',
  'The allottee must ensure that no unauthorized occupants reside in the quarter.',
  'The allotment is liable to be cancelled if the allottee is found to have obtained it by furnishing false information.',
  'The allottee shall abide by all rules and regulations issued by the Estate Office from time to time regarding use and maintenance of the quarter.',
  'Acceptance of this allotment is deemed to constitute full agreement with all terms and conditions laid down by the competent authority.',
];

interface Props {
  reqId: string | null;
  remarks: string;
  submitting: boolean;
  onClose: () => void;
  onRemarksChange: (v: string) => void;
  onConfirm: () => void;
}

export function AcceptAllotmentModal({ reqId, remarks, submitting, onClose, onRemarksChange, onConfirm }: Props) {
  const [agreed, setAgreed] = useState(false);

  if (!reqId) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <ThumbsUp size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">Accept Allotment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Please review and accept the terms and conditions before confirming</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* T&C list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Terms &amp; Conditions</p>
          <ol className="space-y-2.5">
            {TERMS.map((term, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[12px] text-gray-700 leading-relaxed">{term}</p>
              </li>
            ))}
          </ol>

          {/* Remarks */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Remarks <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={e => onRemarksChange(e.target.value)}
              rows={2}
              placeholder="Any remarks on acceptance…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/20 resize-none"
            />
          </div>

          {/* Agreement checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div
              onClick={() => setAgreed(v => !v)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${agreed ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 bg-white'}`}
            >
              {agreed && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-[12px] text-emerald-800 font-medium leading-relaxed">
              I hereby accept the above terms and conditions and confirm my acceptance of the allotted government quarter.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex gap-2.5 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!agreed || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Confirming…' : <><CheckCircle size={14} /> Confirm Accept</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
