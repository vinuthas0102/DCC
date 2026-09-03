import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Home, FileText, XCircle, Key, MessageSquare, GitMerge, HardHat,
  X, Search, Building2, Send, Paperclip, Upload, Plus, ArrowLeft,
  PlayCircle, CheckSquare, SkipForward, ClipboardCheck, Handshake, Users,
  ChevronDown, Zap, Image as ImageIcon,
} from 'lucide-react';
import {
  Quarter, QuarterRequest, QuarterAllotment, QuarterAllotmentApproval,
  QuarterApprovalChat, QuarterRequestApproval, QuarterRequestApprovalChat,
  QuarterInspection, QuarterInspectionChat,
  QuarterHandover, QuarterGuestInfo, QuarterAllotmentChat, QuarterTenantRequest,
} from '../../services/quartersService';
import type { ChatDeliveryMode } from '../../types/quarters';
import { ChatDeliveryModePicker } from '../ui/ChatDeliveryModePicker';
import { UserDTO } from '../../types';
import { EORightMode } from '../../types/quarterRequests';
import { QuarterOverrideModal } from './QuarterOverrideModal';
import { InspectionFormModal } from './InspectionFormModal';
import {
  fmtINR, fmtDate, statusConfig, isAllottedStatus, isOccupiedStatus,
  ChatBubble, CompactQuarterRow, RequestSummaryBlock, getImage,
} from './quarterShared';

export type { EORightMode };

export interface EOActionPanelProps {
  selectedRequest: QuarterRequest;
  user: UserDTO | null;
  isEO: boolean;
  requests: QuarterRequest[];
  tenantRequests: QuarterTenantRequest[];

  // Right mode
  eoRightMode: EORightMode;
  setEoRightMode: (mode: EORightMode) => void;

  // Reject
  eoRejectReason: string;
  setEoRejectReason: (v: string) => void;
  eoRejectSubmitting: boolean;
  handleEORejectRequest: () => void;

  // Manual allot picker
  manualAllotPickerOpen: boolean;
  setManualAllotPickerOpen: (v: boolean) => void;
  manualAllotSearch: string;
  setManualAllotSearch: (v: string) => void;
  manualAllotQuarters: Quarter[];
  manualAllotLoading: boolean;
  manualAllotSubmitting: boolean;
  handleManualAllot: (quarterId: string) => void;

  // Override modal
  overrideAllotment: QuarterAllotment | null;
  overrideRequest: QuarterRequest | null;
  showOverrideModal: boolean;
  setOverrideAllotment: (a: QuarterAllotment | null) => void;
  setOverrideRequest: (r: QuarterRequest | null) => void;
  setShowOverrideModal: (v: boolean) => void;
  loadData: () => void;

  // Approval (allotment-level)
  approvalRecord: QuarterAllotmentApproval | null;
  approvalChats: QuarterApprovalChat[];
  approvalAction: 'approve' | 'clarify' | null;
  setApprovalAction: (v: 'approve' | 'clarify' | null) => void;
  approvalRemarks: string;
  setApprovalRemarks: (v: string) => void;
  approvalTargetLevel: number;
  setApprovalTargetLevel: (v: number) => void;
  approvalSubmitting: boolean;
  handleApproveLevel: () => void;
  handleSendClarification: () => void;
  handleSaveAllotmentWorkflow: (workflowId: string) => void;
  savingAllotmentWorkflow: boolean;
  handleInitiateAllotmentApproval: (workflowId: string) => void;
  initiatingAllotmentApproval: boolean;
  dpFilter: string;

  // Approval (request-level — for SUBMITTED records)
  requestApprovalRecord: QuarterRequestApproval | null;
  requestApprovalChats: QuarterRequestApprovalChat[];
  requestApprovalAction: 'approve' | 'clarify' | null;
  setRequestApprovalAction: (v: 'approve' | 'clarify' | null) => void;
  requestApprovalRemarks: string;
  setRequestApprovalRemarks: (v: string) => void;
  requestApprovalTargetLevel: number;
  setRequestApprovalTargetLevel: (v: number) => void;
  requestApprovalSubmitting: boolean;
  handleApproveRequestLevel: () => void;
  handleSendRequestClarification: () => void;
  handleInitiateRequestApproval: (workflowId: string | null) => void;
  requestApprovalWorkflows: import('../../types/quarters').QuarterApprovalWorkflow[];
  initiatingRequestApproval: boolean;

  // Inspection
  inspections: QuarterInspection[];
  inspectionChats: QuarterInspectionChat[];
  selectedInspectionId: string | null;
  setSelectedInspectionId: (id: string | null) => void;
  inspectionPanel: 'list' | 'chat' | 'new';
  setInspectionPanel: (v: 'list' | 'chat' | 'new') => void;
  inspectionOpeningRemark: string;
  setInspectionOpeningRemark: (v: string) => void;
  inspectionInspectorName: string;
  setInspectionInspectorName: (v: string) => void;
  inspectionInitialCondition: string;
  setInspectionInitialCondition: (v: string) => void;
  inspectionChecklist: import('../../constants/inspectionChecklist').ChecklistItemDraft[];
  setInspectionChecklist: (items: import('../../constants/inspectionChecklist').ChecklistItemDraft[]) => void;
  inspectionChatMsg: string;
  setInspectionChatMsg: (v: string) => void;
  inspectionSubmitting: boolean;
  inspectionCloseRemarks: string;
  setInspectionCloseRemarks: (v: string) => void;
  inspectionCondition: string;
  setInspectionCondition: (v: string) => void;
  handleStartInspection: () => void;
  handleSendInspectionChat: () => void;
  handleCloseInspection: () => void;
  inspectionChatMode: ChatDeliveryMode[];
  setInspectionChatMode: (m: ChatDeliveryMode[]) => void;

  // Handover
  handover: QuarterHandover | null;
  handoverKeyNo: string;
  setHandoverKeyNo: (v: string) => void;
  handoverRemarks: string;
  setHandoverRemarks: (v: string) => void;
  handoverDeadline: string;
  setHandoverDeadline: (v: string) => void;
  handoverInteriorFile: File | null;
  setHandoverInteriorFile: (f: File | null) => void;
  handoverReportFile: File | null;
  setHandoverReportFile: (f: File | null) => void;
  handoverSubmitting: boolean;
  handleCreateHandover: () => void;

  // Allotment chats (EO occupied chat)
  allotmentChats: Record<string, QuarterAllotmentChat[]>;
  allotmentChatMessage: string;
  setAllotmentChatMessage: (v: string) => void;
  allotmentChatFile: File | null;
  setAllotmentChatFile: (f: File | null) => void;
  allotmentChatSubmitting: boolean;
  handleSendAllotmentChat: () => void;
  allotmentChatMode: ChatDeliveryMode[];
  setAllotmentChatMode: (m: ChatDeliveryMode[]) => void;

  // Guest info
  showGuestInfoPopup: boolean;
  setShowGuestInfoPopup: (v: boolean) => void;
  guestForm: { name: string; mobile: string; email: string };
  setGuestForm: React.Dispatch<React.SetStateAction<{ name: string; mobile: string; email: string }>>;
  guestAadhaarFile: File | null;
  setGuestAadhaarFile: (f: File | null) => void;
  guestPanFile: File | null;
  setGuestPanFile: (f: File | null) => void;
  guestOtherFiles: File[];
  setGuestOtherFiles: (files: File[]) => void;
  guestSubmitting: boolean;
  handleAddGuestInfo: () => void;

  // Deallocate handler (inline in override tab)
  handleDeallocate: (allotmentId: string, requestId: string) => void;

  // Panel controls slot (close button etc.)
  panelControls?: React.ReactNode;
}

export const EOActionPanel: React.FC<EOActionPanelProps> = ({
  selectedRequest,
  user,
  isEO,
  requests,
  tenantRequests,
  eoRightMode,
  setEoRightMode,
  eoRejectReason,
  setEoRejectReason,
  eoRejectSubmitting,
  handleEORejectRequest,
  manualAllotPickerOpen,
  setManualAllotPickerOpen,
  manualAllotSearch,
  setManualAllotSearch,
  manualAllotQuarters,
  manualAllotLoading,
  manualAllotSubmitting,
  handleManualAllot,
  overrideAllotment,
  overrideRequest: _overrideRequest,
  showOverrideModal,
  setOverrideAllotment,
  setOverrideRequest,
  setShowOverrideModal,
  loadData,
  approvalRecord,
  approvalChats,
  approvalAction,
  setApprovalAction,
  approvalRemarks,
  setApprovalRemarks,
  approvalTargetLevel,
  setApprovalTargetLevel,
  approvalSubmitting,
  handleApproveLevel,
  handleSendClarification,
  handleSaveAllotmentWorkflow,
  savingAllotmentWorkflow,
  handleInitiateAllotmentApproval,
  initiatingAllotmentApproval,
  dpFilter,
  requestApprovalRecord,
  requestApprovalChats,
  requestApprovalAction,
  setRequestApprovalAction,
  requestApprovalRemarks,
  setRequestApprovalRemarks,
  requestApprovalTargetLevel,
  setRequestApprovalTargetLevel,
  requestApprovalSubmitting,
  handleApproveRequestLevel,
  handleSendRequestClarification,
  handleInitiateRequestApproval,
  requestApprovalWorkflows,
  initiatingRequestApproval,
  inspections,
  inspectionChats,
  selectedInspectionId,
  setSelectedInspectionId,
  inspectionPanel,
  setInspectionPanel,
  inspectionOpeningRemark,
  setInspectionOpeningRemark,
  inspectionChatMsg,
  setInspectionChatMsg,
  inspectionSubmitting,
  inspectionCloseRemarks,
  setInspectionCloseRemarks,
  inspectionCondition,
  setInspectionCondition,
  inspectionInspectorName,
  setInspectionInspectorName,
  inspectionInitialCondition,
  setInspectionInitialCondition,
  inspectionChecklist,
  setInspectionChecklist,
  handleStartInspection,
  handleSendInspectionChat,
  handleCloseInspection,
  inspectionChatMode,
  setInspectionChatMode,
  handover,
  handoverKeyNo,
  setHandoverKeyNo,
  handoverRemarks,
  setHandoverRemarks,
  handoverDeadline,
  setHandoverDeadline,
  handoverInteriorFile,
  setHandoverInteriorFile,
  handoverReportFile,
  setHandoverReportFile,
  handoverSubmitting,
  handleCreateHandover,
  allotmentChats,
  allotmentChatMessage,
  setAllotmentChatMessage,
  allotmentChatFile,
  setAllotmentChatFile,
  allotmentChatSubmitting,
  handleSendAllotmentChat,
  allotmentChatMode,
  setAllotmentChatMode,
  showGuestInfoPopup,
  setShowGuestInfoPopup,
  guestForm,
  setGuestForm,
  guestAadhaarFile,
  setGuestAadhaarFile,
  guestPanFile,
  setGuestPanFile,
  guestOtherFiles,
  setGuestOtherFiles,
  guestSubmitting,
  handleAddGuestInfo,
  handleDeallocate,
  panelControls,
}) => {
  const req = selectedRequest;
  const allotment = req.allotment as QuarterAllotment | null;
  const allottedQ = allotment?.quarter as Quarter | undefined;
  const s = req.request_status;
  const isSubmitted = s === 'SUBMITTED';
  const isAllotted = isAllottedStatus(s);
  const isPendingApproval = isAllotted && approvalRecord && approvalRecord.status === 'PENDING';
  const isAccepted = s === 'ACKNOWLEDGED';
  const isOccupied = isOccupiedStatus(s);

  const eoAllotChatFileRef = useRef<HTMLInputElement>(null);

  // Local state for WFL selector — allotment approval tab
  const [wflSelectedId, setWflSelectedId] = useState('');
  const [wflSubmitted, setWflSubmitted] = useState(false);

  // Local state for WFL selector — submitted DP approval tab
  const [reqWflSelectedId, setReqWflSelectedId] = useState('');
  const [reqWflSubmitted, setReqWflSubmitted] = useState(false);

  const accentCls = isAllotted || isOccupied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200';
  const headerColor = isSubmitted ? 'bg-blue-700' : isAllotted ? 'bg-emerald-700' : isOccupied ? 'bg-teal-700' : 'bg-slate-700';

  const isAllocatedStage = isAllotted && dpFilter === 'allocated_em' && isEO;
  const isUnapprovedStage = isAllotted && dpFilter === 'unapproved' && isEO;

  type TabEntry = { key: EORightMode; label: string; icon: React.ReactNode; show: boolean };
  const tabs: TabEntry[] = ([
    { key: 'detail' as EORightMode, label: 'Detail', icon: <FileText size={12} />, show: false },
    { key: 'approval_chat' as EORightMode, label: 'Approval', icon: <GitMerge size={12} />, show: isAllotted && isEO && (isAllocatedStage || isUnapprovedStage) },
    { key: 'request_approval_chat' as EORightMode, label: 'Approval', icon: <GitMerge size={12} />, show: isSubmitted && isEO },
    { key: 'inspection' as EORightMode, label: 'Inspection', icon: <HardHat size={12} />, show: isAccepted && !isOccupied && isEO },
    { key: 'inspection_chat' as EORightMode, label: 'Insp. Chat', icon: <MessageSquare size={12} />, show: isAccepted && !isOccupied && isEO && !!selectedInspectionId },
    { key: 'handover' as EORightMode, label: 'Handover', icon: <Key size={12} />, show: isAccepted && !isOccupied && isEO },
    { key: 'chat' as EORightMode, label: 'Chat', icon: <MessageSquare size={12} />, show: isOccupied || isSubmitted || isAllotted },
  ] as TabEntry[]).filter(t => t.show);

  // suppress unused warnings
  void isPendingApproval;
  void tenantRequests;
  void approvalRecord;
  void approvalChats;
  void approvalAction; void setApprovalAction;
  void approvalRemarks; void setApprovalRemarks;
  void approvalTargetLevel; void setApprovalTargetLevel;
  void approvalSubmitting;
  void handleApproveLevel;
  void handleSendClarification;
  void requestApprovalRecord;
  void requestApprovalChats;
  void requestApprovalAction; void setRequestApprovalAction;
  void requestApprovalRemarks; void setRequestApprovalRemarks;
  void requestApprovalTargetLevel; void setRequestApprovalTargetLevel;
  void requestApprovalSubmitting;
  void handleApproveRequestLevel;
  void handleSendRequestClarification;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ── Header ── */}
      <div className={`flex items-center gap-2 px-3 py-2.5 sticky top-0 z-10 rounded-t-xl ${headerColor}`}>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-xs font-semibold text-white truncate">{req.request_number}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs font-semibold text-white/90 truncate">
            {req.request_for === 'EMPLOYEE' ? req.on_behalf_employee_name : req.request_for === 'TP' ? req.tp_name : 'Self'}
          </span>
          {(() => {
            const sub = req.request_for === 'EMPLOYEE' ? req.on_behalf_employee_dept : req.request_for === 'TP' ? req.tp_organization : req.required_bhk_config;
            return sub ? <span className="text-[10px] text-white/60 truncate hidden sm:inline">{sub}</span> : null;
          })()}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${req.request_for === 'TP' ? 'bg-amber-400/30 text-amber-100' : req.request_for === 'EMPLOYEE' ? 'bg-blue-400/30 text-blue-100' : 'bg-white/20 text-white'}`}>
            {req.request_for ?? 'SELF'}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">{statusConfig(s).label}</span>
        {panelControls}
      </div>

      {/* ── Quarter row if allotted ── */}
      {allottedQ && <CompactQuarterRow q={allottedQ} accentCls={accentCls} />}

      {/* ── Sub-nav tabs ── */}
      {tabs.length >= 1 && (
        <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 border-b border-gray-100 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setEoRightMode(tab.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${eoRightMode === tab.key ? `${headerColor} text-white shadow-sm` : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat tab (occupied, submitted, or allotted/allocated) ── */}
      {eoRightMode === 'chat' && (isOccupied || isSubmitted || isAllotted) && (isOccupied ? !!allotment : true) && (() => {
        const chatKey = allotment?.id ?? req.id;
        const eoAllotChats = allotmentChats[chatKey] ?? [];
        return (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 min-h-0">
              {[...eoAllotChats].reverse().map(chat => (
                <ChatBubble key={chat.id} chat={chat} isSelf={chat.author_role === 'eo'}
                  roleLabel={chat.author_role !== 'eo' ? (chat.author_role === 'employee' ? 'Employee' : 'System') : undefined} />
              ))}
              {eoAllotChats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2.5">
                    <Send size={16} className="text-gray-300" />
                  </div>
                  <div className="text-[13px] font-semibold text-gray-500">No messages yet</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Start the conversation below</div>
                </div>
              )}
            </div>
            <div className="flex-none border-t border-gray-100 px-4 py-3 bg-white">
              <ChatDeliveryModePicker value={allotmentChatMode} onChange={setAllotmentChatMode} className="mb-2" />
              {allotmentChatFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                  <FileText size={13} className="text-blue-500 shrink-0" />
                  <span className="flex-1 min-w-0 text-[12px] font-medium text-blue-800 truncate">{allotmentChatFile.name}</span>
                  <button type="button" onClick={() => setAllotmentChatFile(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0"><X size={12} /></button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => eoAllotChatFileRef.current?.click()}
                  className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-colors" title="Attach file">
                  <Paperclip size={15} />
                </button>
                <input ref={eoAllotChatFileRef} type="file" accept="application/pdf,image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0] ?? null; setAllotmentChatFile(f); e.target.value = ''; }} />
                <textarea value={allotmentChatMessage} onChange={e => setAllotmentChatMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && allotmentChatMessage.trim()) { e.preventDefault(); handleSendAllotmentChat(); } }}
                  rows={1} placeholder="Type a message… (Enter to send)"
                  className="flex-1 px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-white leading-relaxed transition-colors"
                  style={{ minHeight: '40px', maxHeight: '80px' }} />
                <button onClick={handleSendAllotmentChat} disabled={!allotmentChatMessage.trim() || allotmentChatSubmitting}
                  className="flex-none p-2.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm" title="Send">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Tab content (non-chat tabs) ── */}
      <div className={`flex-1 overflow-y-auto ${eoRightMode === 'chat' ? 'hidden' : ''}`}>

        {/* Detail tab */}
        {eoRightMode === 'detail' && <RequestSummaryBlock req={req} user={user} />}

        {/* Approval tab — Allocated stage: choose WFL */}
        {eoRightMode === 'approval_chat' && isAllocatedStage && (() => {
          const savedWflId = allotment?.selected_workflow_id ?? '';
          const effectiveWflId = wflSelectedId || savedWflId;
          const isSaved = wflSubmitted || !!savedWflId;
          return (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <GitMerge size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Select Approval Workflow</p>
                  <p className="text-[10px] text-gray-400 leading-tight">Choose a workflow to route this allotment for approval</p>
                </div>
              </div>

              {!isSaved ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Select Workflow (WFL)
                    </label>
                    <div className="relative">
                      <select
                        value={wflSelectedId}
                        onChange={e => setWflSelectedId(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 pr-8 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-white text-gray-700"
                      >
                        <option value="">-- Select a Workflow --</option>
                        {requestApprovalWorkflows.map(wfl => (
                          <option key={wfl.id} value={wfl.id}>
                            {wfl.workflow_name} ({(wfl.levels as { level: number }[]).length} level{(wfl.levels as { level: number }[]).length !== 1 ? 's' : ''})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {wflSelectedId && (() => {
                    const wfl = requestApprovalWorkflows.find(w => w.id === wflSelectedId);
                    if (!wfl) return null;
                    return (
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Approval Levels</p>
                        {(wfl.levels as { level: number; approver_title?: string; approver_role?: string }[]).map(lvl => (
                          <div key={lvl.level} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center shrink-0">{lvl.level}</span>
                            <span className="text-[11px] text-gray-700 font-medium">{lvl.approver_title || lvl.approver_role || `Level ${lvl.level}`}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <button
                    onClick={async () => {
                      if (!wflSelectedId || !allotment) return;
                      await handleSaveAllotmentWorkflow(wflSelectedId);
                      setWflSubmitted(true);
                    }}
                    disabled={!wflSelectedId || savingAllotmentWorkflow}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingAllotmentWorkflow ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlayCircle size={13} />}
                    Confirm Workflow
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const wfl = requestApprovalWorkflows.find(w => w.id === effectiveWflId);
                    const levelCount = (wfl?.levels as { level: number }[] | undefined)?.length ?? 0;
                    return (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckSquare size={13} className="text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-emerald-800">Workflow Saved</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 ml-5">
                          {wfl?.workflow_name ?? 'Selected workflow'} — {levelCount} approval level{levelCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => { setWflSelectedId(''); setWflSubmitted(false); }}
                    className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                  >
                    Change workflow
                  </button>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-[11px] text-blue-700 font-medium">Workflow saved. Go to the <span className="font-bold">Unapproved Allotment</span> stage to initiate approval.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Approval tab — Unapproved stage: review confirmed workflow + initiate approval */}
        {eoRightMode === 'approval_chat' && isUnapprovedStage && (() => {
          const effectiveWflId = allotment?.selected_workflow_id ?? '';
          const wfl = requestApprovalWorkflows.find(w => w.id === effectiveWflId);
          const levelCount = (wfl?.levels as { level: number }[] | undefined)?.length ?? 0;
          return (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <GitMerge size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Approval Workflow</p>
                  <p className="text-[10px] text-gray-400 leading-tight">Review the confirmed workflow and initiate the approval process</p>
                </div>
              </div>

              {!effectiveWflId ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] text-amber-700 font-medium">No workflow has been confirmed yet. Go to the <span className="font-bold">Allocated</span> stage to select and confirm a workflow first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={13} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-800">Workflow Confirmed</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 ml-5">
                      {wfl?.workflow_name ?? 'Selected workflow'} — {levelCount} approval level{levelCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {wfl && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Approval Levels</p>
                      {(wfl.levels as { level: number; approver_title?: string; approver_role?: string }[]).map(lvl => (
                        <div key={lvl.level} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center shrink-0">{lvl.level}</span>
                          <span className="text-[11px] text-gray-700 font-medium">{lvl.approver_title || lvl.approver_role || `Level ${lvl.level}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {approvalRecord ? (
                    <button
                      onClick={() => {}}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors"
                    >
                      <GitMerge size={14} />
                      View Approval
                    </button>
                  ) : (
                    <button
                      onClick={() => {}}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-colors"
                    >
                      <Zap size={14} />
                      Initiate WFL
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Approval tab — legacy fallback (non-EO allotted) */}
        {eoRightMode === 'approval_chat' && !isAllocatedStage && !isUnapprovedStage && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <GitMerge size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Approval Workflow</p>
                <p className="text-[10px] text-gray-400 leading-tight">Select a workflow to route this allotment for approval</p>
              </div>
            </div>
          </div>
        )}

        {/* Request Approval tab (SUBMITTED records) — WFL selector */}
        {eoRightMode === 'request_approval_chat' && isSubmitted && isEO && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <GitMerge size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Approval Workflow</p>
                <p className="text-[10px] text-gray-400 leading-tight">Select a workflow to route this request for approval</p>
              </div>
            </div>

            {!reqWflSubmitted ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Select Workflow (WFL)
                  </label>
                  <div className="relative">
                    <select
                      value={reqWflSelectedId}
                      onChange={e => setReqWflSelectedId(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 pr-8 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white text-gray-700"
                    >
                      <option value="">-- Select a Workflow --</option>
                      {requestApprovalWorkflows.map(wfl => (
                        <option key={wfl.id} value={wfl.id}>
                          {wfl.workflow_name} ({(wfl.levels as { level: number }[]).length} level{(wfl.levels as { level: number }[]).length !== 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {reqWflSelectedId && (() => {
                  const wfl = requestApprovalWorkflows.find(w => w.id === reqWflSelectedId);
                  if (!wfl) return null;
                  return (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Approval Levels</p>
                      {(wfl.levels as { level: number; approver_title?: string; approver_role?: string }[]).map(lvl => (
                        <div key={lvl.level} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                            {lvl.level}
                          </span>
                          <span className="text-[11px] text-gray-700 font-medium">
                            {lvl.approver_title || lvl.approver_role || `Level ${lvl.level}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <button
                  onClick={() => { if (reqWflSelectedId) setReqWflSubmitted(true); }}
                  disabled={!reqWflSelectedId}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <PlayCircle size={13} /> Submit
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const wfl = requestApprovalWorkflows.find(w => w.id === reqWflSelectedId);
                  const levelCount = (wfl?.levels as { level: number }[] | undefined)?.length ?? 0;
                  return (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={13} className="text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-blue-800">Workflow Selected</span>
                      </div>
                      <p className="text-[11px] text-blue-700 ml-5">
                        {wfl?.workflow_name ?? 'Selected workflow'} — {levelCount} approval level{levelCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })()}

                <button
                  onClick={() => setReqWflSubmitted(false)}
                  className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                >
                  Change workflow
                </button>

                <button
                  onClick={() => handleInitiateRequestApproval(reqWflSelectedId)}
                  disabled={initiatingRequestApproval}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 disabled:opacity-50 transition-colors"
                >
                  <Zap size={14} /> {initiatingRequestApproval ? 'Starting…' : 'Initiate Approval'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inspection tab */}
        {eoRightMode === 'inspection' && isAccepted && (
          <div className="p-4 space-y-3">
            {inspectionPanel === 'list' && (
              <>
                <button
                  onClick={() => setInspectionPanel('new')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
                >
                  <Plus size={14} />New Inspection
                </button>
                {inspections.length === 0 && <p className="text-xs text-gray-400 text-center italic py-4">No inspections yet.</p>}
                {inspections.map(insp => (
                  <div key={insp.id} className={`rounded-xl border px-3 py-3 space-y-1.5 ${insp.status === 'CLOSED' ? 'border-gray-200 bg-gray-50' : 'border-teal-200 bg-teal-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${insp.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-teal-100 text-teal-700'}`}>{insp.status}</span>
                      <span className="text-[10px] text-gray-400">{fmtDate(insp.created_at)}</span>
                    </div>
                    {insp.opening_remarks && <p className="text-xs text-gray-600">{insp.opening_remarks}</p>}
                    {insp.property_condition && <p className="text-[10px] font-semibold text-gray-500">Condition: {insp.property_condition}</p>}
                    <button
                      onClick={() => { setSelectedInspectionId(insp.id); setInspectionPanel('chat'); setEoRightMode('inspection_chat'); }}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
                    >
                      <MessageSquare size={11} />Open Chat
                    </button>
                  </div>
                ))}
              </>
            )}
            {inspectionPanel === 'new' && (
              <InspectionFormModal
                requestRef={selectedRequest.request_no ?? undefined}
                quarterRef={selectedRequest.allotment?.quarter?.quarter_number ?? undefined}
                inspectorName={inspectionInspectorName}
                openingRemarks={inspectionOpeningRemark}
                condition={inspectionInitialCondition}
                checklist={inspectionChecklist}
                submitting={inspectionSubmitting}
                onInspectorNameChange={setInspectionInspectorName}
                onOpeningRemarksChange={setInspectionOpeningRemark}
                onConditionChange={setInspectionInitialCondition}
                onChecklistChange={setInspectionChecklist}
                onClose={() => setInspectionPanel('list')}
                onSubmit={handleStartInspection}
              />
            )}
            {inspectionPanel === 'chat' && selectedInspectionId && (
              <div className="space-y-3">
                <button onClick={() => { setInspectionPanel('list'); setSelectedInspectionId(null); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft size={12} />Back
                </button>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {inspectionChats.map(chat => (
                    <div key={chat.id} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-teal-700 capitalize">{chat.author_role}</span>
                        <span className="text-gray-400 text-[10px]">{fmtDate(chat.created_at)}</span>
                      </div>
                      <p className="text-gray-700">{chat.message}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={inspectionChatMsg}
                    onChange={e => setInspectionChatMsg(e.target.value)}
                    placeholder="Add observation…"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none"
                    onKeyDown={e => { if (e.key === 'Enter') handleSendInspectionChat(); }}
                  />
                  <button onClick={handleSendInspectionChat} className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors"><Send size={13} /></button>
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Close Inspection</div>
                  <select
                    value={inspectionCondition}
                    onChange={e => setInspectionCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  >
                    {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea
                    value={inspectionCloseRemarks}
                    onChange={e => setInspectionCloseRemarks(e.target.value)}
                    rows={2}
                    placeholder="Closing remarks…"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none resize-none"
                  />
                  <button onClick={handleCloseInspection} disabled={inspectionSubmitting || !inspectionCloseRemarks.trim()} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    <ClipboardCheck size={12} />{inspectionSubmitting ? '…' : 'Close Inspection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inspection Chat tab */}
        {eoRightMode === 'inspection_chat' && isAccepted && selectedInspectionId && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-sky-50">
              <HardHat size={12} className="text-sky-600" />
              <span className="text-xs font-semibold text-sky-800">Inspection Chat</span>
              <button
                onClick={() => { setSelectedInspectionId(null); setEoRightMode('inspection'); }}
                className="ml-auto text-[10px] text-sky-500 hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                <X size={11} />Back
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50 min-h-0">
              {inspectionChats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center mb-2">
                    <MessageSquare size={14} className="text-sky-400" />
                  </div>
                  <p className="text-xs text-gray-400 italic">No messages yet</p>
                </div>
              )}
              {inspectionChats.map(chat => (
                <div key={chat.id} className={`flex ${chat.author_role === 'eo' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-xl px-3 py-2 text-xs shadow-sm ${chat.author_role === 'eo' ? 'bg-sky-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    <div className={`text-[9px] font-bold mb-0.5 capitalize ${chat.author_role === 'eo' ? 'text-sky-200' : 'text-sky-600'}`}>{chat.author_role}</div>
                    <p className="leading-relaxed">{chat.message}</p>
                    <div className={`text-[9px] mt-0.5 ${chat.author_role === 'eo' ? 'text-sky-200' : 'text-gray-400'}`}>{fmtDate(chat.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-none border-t border-gray-100 px-4 py-3 bg-white">
              <ChatDeliveryModePicker value={inspectionChatMode} onChange={setInspectionChatMode} className="mb-2" />
              <div className="flex items-end gap-2">
                <textarea
                  value={inspectionChatMsg}
                  onChange={e => setInspectionChatMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && inspectionChatMsg.trim()) { e.preventDefault(); handleSendInspectionChat(); } }}
                  rows={1}
                  placeholder="Add observation… (Enter to send)"
                  className="flex-1 px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 bg-white leading-relaxed transition-colors"
                  style={{ minHeight: '40px', maxHeight: '80px' }}
                />
                <button
                  onClick={handleSendInspectionChat}
                  disabled={!inspectionChatMsg.trim() || inspectionSubmitting}
                  className="flex-none p-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  title="Send"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Handover tab */}
        {eoRightMode === 'handover' && isAccepted && (
          <div className="p-4 space-y-3">
            {handover ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Key size={14} className="text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800">Handover Recorded</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-[9px] text-gray-400 uppercase mb-0.5">Key No.</div><div className="font-semibold text-gray-800">{handover.key_number}</div></div>
                  <div><div className="text-[9px] text-gray-400 uppercase mb-0.5">Deadline</div><div className="font-semibold text-gray-800">{fmtDate(handover.occupying_deadline)}</div></div>
                </div>
                {handover.remarks && <p className="text-xs text-gray-600">{handover.remarks}</p>}
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                  Record the physical handover of keys and set the occupying deadline. This confirms occupancy.
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Key Number *</label>
                    <input value={handoverKeyNo} onChange={e => setHandoverKeyNo(e.target.value)} placeholder="e.g. KEY-A-203" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Occupying Deadline *</label>
                    <input type="date" value={handoverDeadline} onChange={e => setHandoverDeadline(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Remarks</label>
                    <textarea value={handoverRemarks} onChange={e => setHandoverRemarks(e.target.value)} rows={2} placeholder="Handover notes…" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none resize-none" />
                  </div>
                  {/* Mandatory Documents */}
                  <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 pt-3 pb-3 space-y-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <FileText size={11} className="text-red-500 shrink-0" />
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Mandatory Documents</span>
                      <span className="ml-auto text-[9px] font-semibold text-red-400 bg-red-100 px-1.5 py-0.5 rounded-full">Both Required</span>
                    </div>

                    {/* Interior Photo */}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Interior Photo</label>
                        <span className="text-red-500 text-[10px] font-bold">*</span>
                      </div>
                      {handoverInteriorFile ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                          <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center shrink-0">
                            <ImageIcon size={11} className="text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-800 truncate">{handoverInteriorFile.name}</p>
                            <p className="text-[9px] text-gray-400">{(handoverInteriorFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={() => setHandoverInteriorFile(null)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 w-full px-3 py-3 border-2 border-dashed border-red-200 rounded-lg cursor-pointer hover:border-teal-400 hover:bg-teal-50/40 transition-all group">
                          <div className="w-7 h-7 rounded-lg bg-red-100 group-hover:bg-teal-100 flex items-center justify-center shrink-0 transition-colors">
                            <Upload size={13} className="text-red-400 group-hover:text-teal-600 transition-colors" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-600 group-hover:text-teal-700 transition-colors">Click to upload</p>
                            <p className="text-[9px] text-gray-400">JPG, PNG, WEBP accepted</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={e => setHandoverInteriorFile(e.target.files?.[0] ?? null)} />
                        </label>
                      )}
                    </div>

                    {/* Inspection Report */}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Inspection Report</label>
                        <span className="text-red-500 text-[10px] font-bold">*</span>
                      </div>
                      {handoverReportFile ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                          <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center shrink-0">
                            <FileText size={11} className="text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-800 truncate">{handoverReportFile.name}</p>
                            <p className="text-[9px] text-gray-400">{(handoverReportFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={() => setHandoverReportFile(null)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 w-full px-3 py-3 border-2 border-dashed border-red-200 rounded-lg cursor-pointer hover:border-teal-400 hover:bg-teal-50/40 transition-all group">
                          <div className="w-7 h-7 rounded-lg bg-red-100 group-hover:bg-teal-100 flex items-center justify-center shrink-0 transition-colors">
                            <Upload size={13} className="text-red-400 group-hover:text-teal-600 transition-colors" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-600 group-hover:text-teal-700 transition-colors">Click to upload</p>
                            <p className="text-[9px] text-gray-400">PDF, JPG, PNG accepted</p>
                          </div>
                          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setHandoverReportFile(e.target.files?.[0] ?? null)} />
                        </label>
                      )}
                    </div>
                  </div>

                  <button onClick={handleCreateHandover} disabled={handoverSubmitting || !handoverKeyNo.trim() || !handoverDeadline || !handoverInteriorFile || !handoverReportFile} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
                    <Handshake size={14} />{handoverSubmitting ? 'Recording…' : 'Record Handover & Confirm Occupancy'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Manual allot quarter picker modal ── */}
      {manualAllotPickerOpen && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Home size={18} className="text-blue-600" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Select Quarter to Allot</h3>
                <p className="text-xs text-gray-400 mt-0.5">{req.request_number} · {req.required_bhk_config}</p>
              </div>
              <button onClick={() => setManualAllotPickerOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={manualAllotSearch} onChange={e => setManualAllotSearch(e.target.value)} placeholder="Search by number, block…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 px-2 py-1">
              {manualAllotLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl m-2 animate-pulse" />)
              ) : manualAllotQuarters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400"><Building2 size={24} className="mb-2 opacity-30" /><p className="text-sm">No available quarters found</p></div>
              ) : manualAllotQuarters.map((q, i) => (
                <button key={q.id} onClick={() => handleManualAllot(q.id)} disabled={manualAllotSubmitting}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-blue-50 transition-colors text-left rounded-xl">
                  <img src={getImage(q, i)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{q.quarter_number}</div>
                    <div className="text-xs text-gray-500 truncate">{q.bhk_config} · {fmtINR(q.monthly_rent)}/mo</div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 shrink-0">{manualAllotSubmitting ? '…' : 'Allot'}</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <button onClick={() => setManualAllotPickerOpen(false)} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Override modal */}
      {showOverrideModal && overrideAllotment && user && (
        <QuarterOverrideModal
          isOpen={showOverrideModal}
          allotment={overrideAllotment}
          allCycleAllotments={requests.filter(r => r.allotment).map(r => r.allotment as QuarterAllotment)}
          eoAuthId={user.id}
          onClose={() => { setShowOverrideModal(false); setOverrideAllotment(null); setOverrideRequest(null); }}
          onOverrideSaved={() => { setShowOverrideModal(false); setOverrideAllotment(null); setOverrideRequest(null); loadData(); }}
        />
      )}

      {/* Guest Info popup */}
      {showGuestInfoPopup && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0"><Users size={18} className="text-teal-600" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Add Guest Information</h3>
                <p className="text-xs text-gray-400 mt-0.5">{req.request_number}</p>
              </div>
              <button onClick={() => setShowGuestInfoPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Guest Name *</label>
                <input value={guestForm.name} onChange={e => setGuestForm(f => ({...f, name: e.target.value}))} placeholder="Full name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mobile *</label>
                  <input value={guestForm.mobile} onChange={e => setGuestForm(f => ({...f, mobile: e.target.value}))} placeholder="10-digit mobile" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                  <input value={guestForm.email} onChange={e => setGuestForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Aadhaar</label>
                  <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 text-gray-400 hover:text-blue-500">
                    <Upload size={14} /><span className="text-[10px] mt-1 truncate w-full text-center">{guestAadhaarFile?.name ?? 'Upload'}</span>
                    <input type="file" className="hidden" onChange={e => setGuestAadhaarFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">PAN</label>
                  <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-amber-400 text-gray-400 hover:text-amber-500">
                    <Upload size={14} /><span className="text-[10px] mt-1 truncate w-full text-center">{guestPanFile?.name ?? 'Upload'}</span>
                    <input type="file" className="hidden" onChange={e => setGuestPanFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Others</label>
                  <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-400 text-gray-400 hover:text-teal-500">
                    <Upload size={14} /><span className="text-[10px] mt-1 text-center">{guestOtherFiles.length > 0 ? `${guestOtherFiles.length} file(s)` : 'Upload'}</span>
                    <input type="file" multiple className="hidden" onChange={e => setGuestOtherFiles(Array.from(e.target.files ?? []))} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowGuestInfoPopup(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddGuestInfo} disabled={guestSubmitting || !guestForm.name.trim() || !guestForm.mobile.trim()} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {guestSubmitting ? 'Saving…' : 'Add Guest'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
