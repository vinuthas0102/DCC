import React from 'react';
import { createPortal } from 'react-dom';
import { ThumbsDown, X } from 'lucide-react';
import { DocUpload } from '../ui/DocUpload';

interface Props {
  reqId: string | null;
  remarks: string;
  docUrl: File | null;
  submitting: boolean;
  onClose: () => void;
  onRemarksChange: (v: string) => void;
  onDocChange: (f: File | null) => void;
  onDecline: (andCancel: boolean) => void;
}

export function DeclineAllotmentModal({
  reqId, remarks, docUrl, submitting, onClose, onRemarksChange, onDocChange, onDecline,
}: Props) {
  if (!reqId) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <ThumbsDown size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">Decline Allotment</h3>
            <p className="text-xs text-red-500 mt-0.5">Please note: Once you decline the allotted quarter, the allotment will be cancelled, and you will not be eligible for any allotment for the next two years from the date of rejection.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Decline Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={e => onRemarksChange(e.target.value)}
              rows={4}
              placeholder="Please state your reason for declining this allotment…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
              autoFocus
            />
          </div>
          <DocUpload value={docUrl} onChange={onDocChange} label="Supporting Document" optional />
          <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Please note: This action is final and cannot be undone once submitted.
          </p>
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onDecline(false)}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving…' : 'Decline'}
          </button>
          <button
            onClick={() => onDecline(true)}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? '…' : 'Decline & Cancel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
