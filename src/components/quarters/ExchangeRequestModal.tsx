import React, { useRef, useState } from 'react';
import {
  ArrowLeftRight, X, Building2, FileText, Paperclip,
  CheckCircle2, Loader2, Info, ChevronDown, Settings2,
} from 'lucide-react';
import type { QuarterApprovalWorkflow } from '../../types/quarters';

interface Props {
  myQuarterNumber: string;
  myOccupantName: string;
  allotmentId: string;
  isEO: boolean;
  workflows: QuarterApprovalWorkflow[];
  submitting: boolean;
  onClose: () => void;
  onLookupPartnerQuarter: (quarterNo: string) => string | null;
  onSubmit: (data: {
    partnerQuarterNumber: string;
    reason: string;
    remarks: string;
    docFile: File | null;
    workflowId: string | null;
  }) => void;
}

export function ExchangeRequestModal({
  myQuarterNumber,
  myOccupantName,
  isEO,
  workflows,
  submitting,
  onClose,
  onLookupPartnerQuarter,
  onSubmit,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [partnerQuarterNumber, setPartnerQuarterNumber] = useState('');
  const [partnerOccupantName, setPartnerOccupantName] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(
    workflows.length > 0 ? workflows[0].id : null,
  );
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [validationError, setValidationError] = useState('');

  function handlePartnerQuarterChange(val: string) {
    setPartnerQuarterNumber(val);
    setPartnerOccupantName(null);
  }

  function handlePartnerQuarterBlur() {
    const trimmed = partnerQuarterNumber.trim();
    if (trimmed) {
      setPartnerOccupantName(onLookupPartnerQuarter(trimmed));
    }
  }

  function handleSubmit() {
    if (!partnerQuarterNumber.trim()) {
      setValidationError('Please enter the partner quarter number.');
      return;
    }
    if (partnerQuarterNumber.trim().toUpperCase() === myQuarterNumber.toUpperCase()) {
      setValidationError("Partner quarter cannot be the same as your own quarter.");
      return;
    }
    if (!reason.trim()) {
      setValidationError('Please provide a reason for the exchange.');
      return;
    }
    setValidationError('');
    onSubmit({ partnerQuarterNumber: partnerQuarterNumber.trim(), reason, remarks, docFile, workflowId });
  }

  const selectedWorkflow = workflows.find(w => w.id === workflowId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
            <ArrowLeftRight size={17} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 leading-tight">Exchange Request</h2>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">
              Swap your quarter with another occupant — both parties keep their rank
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Parties panel */}
          <div className="grid grid-cols-2 gap-3">
            {/* My quarter */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-2">
                <Building2 size={10} /> Party A (You)
              </div>
              <div className="text-sm font-bold text-teal-900">{myQuarterNumber || '—'}</div>
              <div className="text-[11px] font-semibold text-teal-700 mt-1 truncate">{myOccupantName || '—'}</div>
              <div className="text-[10px] text-teal-500 mt-0.5">Your current quarter</div>
            </div>

            {/* Partner quarter input */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Building2 size={10} /> Party B
              </div>
              <input
                value={partnerQuarterNumber}
                onChange={e => handlePartnerQuarterChange(e.target.value)}
                onBlur={handlePartnerQuarterBlur}
                placeholder="Enter quarter no."
                className="w-full text-sm font-semibold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
              />
              {partnerOccupantName !== null ? (
                <div className="text-[11px] font-semibold text-gray-700 mt-1 truncate">{partnerOccupantName}</div>
              ) : partnerQuarterNumber.trim() ? (
                <div className="text-[10px] text-gray-400 mt-1 italic">Unknown occupant</div>
              ) : null}
              <div className="text-[10px] text-gray-400 mt-0.5">Partner's quarter</div>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full">
              <div className="text-right">
                <div className="text-xs font-bold text-teal-700 leading-tight">{myQuarterNumber || 'Your Quarter'}</div>
                {myOccupantName && <div className="text-[10px] text-teal-500 leading-tight">{myOccupantName}</div>}
              </div>
              <ArrowLeftRight size={13} className="text-teal-500 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-teal-700 leading-tight">{partnerQuarterNumber || 'Partner Quarter'}</div>
                {partnerOccupantName && <div className="text-[10px] text-teal-500 leading-tight">{partnerOccupantName}</div>}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Reason for Exchange <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why you wish to exchange quarters (e.g., location preference, family needs, proximity to workplace)…"
              className="w-full px-4 py-3 text-sm text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 resize-none placeholder-gray-300 transition-colors"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Additional Remarks
              <span className="ml-1.5 text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any other details…"
              className="w-full px-4 py-3 text-sm text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-colors"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Justification Document <span className="text-red-500">*</span>
            </label>
            {docFile ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{docFile.name}</p>
                  <p className="text-xs text-gray-400">{(docFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDocFile(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                  <Paperclip size={17} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 group-hover:text-teal-700 transition-colors">
                    Upload justification document
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — up to 10 MB</p>
                </div>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; setDocFile(f); e.target.value = ''; }}
            />
          </div>

          {/* Approval Workflow — EO only */}
          {isEO && <div>
            <button
              type="button"
              onClick={() => setShowWorkflow(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Settings2 size={14} className="text-gray-500 shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Approval Workflow</span>
                {selectedWorkflow && (
                  <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                    {selectedWorkflow.workflow_name}
                  </span>
                )}
                {!selectedWorkflow && (
                  <span className="text-xs text-gray-400 font-medium">None selected</span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${showWorkflow ? 'rotate-180' : ''}`}
              />
            </button>

            {showWorkflow && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                {workflows.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-4 text-xs text-gray-500">
                    <Info size={13} className="text-gray-400 shrink-0" />
                    No approval workflows configured. The EO will handle approval directly.
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setWorkflowId(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-gray-100 text-left ${
                        !workflowId ? 'bg-gray-50 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${!workflowId ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                        {!workflowId && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      Direct EO Approval (no workflow)
                    </button>
                    {workflows.map(wf => (
                      <button
                        key={wf.id}
                        type="button"
                        onClick={() => setWorkflowId(wf.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-0 text-left ${
                          workflowId === wf.id ? 'bg-teal-50 font-semibold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${workflowId === wf.id ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                          {workflowId === wf.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className={`leading-tight ${workflowId === wf.id ? 'text-teal-900' : 'text-gray-800'}`}>
                            {wf.workflow_name}
                          </div>
                          {wf.description && (
                            <div className="text-xs text-gray-400 mt-0.5 leading-snug">{wf.description}</div>
                          )}
                          {wf.levels && wf.levels.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {wf.levels.map((lvl, i) => (
                                <React.Fragment key={lvl.level}>
                                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                                    L{lvl.level}: {lvl.approver_title}
                                  </span>
                                  {i < wf.levels.length - 1 && (
                                    <span className="text-gray-300 text-[10px]">→</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>}

          {/* Validation error */}
          {validationError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <Info size={14} className="shrink-0" />
              {validationError}
            </div>
          )}

          {/* Info notice */}
          <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              After submission the Estate Officer will verify the partner quarter, confirm mutual
              consent, and route the request through the selected approval workflow. Both parties
              will receive notification once the exchange is confirmed.
            </p>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Submit Exchange Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
