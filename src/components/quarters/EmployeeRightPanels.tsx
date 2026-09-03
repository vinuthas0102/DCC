import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle, Send, Paperclip, X, FileText, ChevronLeft, Clock,
  ThumbsUp, Bell, Wrench, RefreshCw, ArrowRightCircle, LogOut, IndianRupee,
  AlertCircle, ExternalLink, CalendarDays, Bed, Eye, Star, Plus,
  Ruler, ArrowLeft, XCircle, Send as SendIcon, Download, ArrowLeftRight,
} from 'lucide-react';
import { downloadElementAsHtml } from '../../utils/downloadHtml';
import { Button } from '../ui/Button';
import { QuarterDetailCard } from './QuarterDetailCard';
import { DocUpload } from '../ui/DocUpload';
import { useNavigate } from 'react-router-dom';
import {
  fmtINR, fmtDate, statusConfig, tenantStatusConfig, serviceTypeConfig,
  ChatBubble, CompactQuarterRow, RequestSummaryBlock, getImage,
} from './quarterShared';
import {
  quartersService,
  Quarter,
  QuarterRequest,
  QuarterTenantRequest,
  QuarterAllotment,
  QuarterServiceChat,
  QuarterAllotmentChat,
} from '../../services/quartersService';
import type { ChatDeliveryMode } from '../../types/quarters';
import { ChatDeliveryModePicker } from '../ui/ChatDeliveryModePicker';
import { UserDTO } from '../../types/user.types';
import { ROUTES } from '../../constants/routes';

// ─── shared prop types ────────────────────────────────────────────────────────

interface PanelBase {
  panelControls?: React.ReactNode;
  selectedRequest: QuarterRequest;
}

// ─── RightPanelAllotted ───────────────────────────────────────────────────────

interface RightPanelAllottedProps extends PanelBase {
  isEO: boolean;
  eoMode: 'self' | 'employee' | null;
  allotmentChats: Record<string, QuarterAllotmentChat[]>;
  allotmentChatMessage: string;
  setAllotmentChatMessage: (v: string) => void;
  allotmentChatFile: File | null;
  setAllotmentChatFile: (f: File | null) => void;
  allotmentChatSubmitting: boolean;
  handleSendAllotmentChat: () => void;
  allotmentChatMode: ChatDeliveryMode[];
  setAllotmentChatMode: (m: ChatDeliveryMode[]) => void;
  openActionPopup: (type: 'INSPECTION' | 'HANDOVER', requestId: string, allotmentId: string) => void;
}

export const RightPanelAllotted: React.FC<RightPanelAllottedProps> = ({
  panelControls, selectedRequest, isEO, eoMode,
  allotmentChats, allotmentChatMessage, setAllotmentChatMessage,
  allotmentChatFile, setAllotmentChatFile, allotmentChatSubmitting,
  handleSendAllotmentChat, allotmentChatMode, setAllotmentChatMode, openActionPopup,
}) => {
  const allotmentChatFileRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!selectedRequest?.allotment) return null;
  const allotment = selectedRequest.allotment;
  const q = allotment.quarter;
  const chats = allotmentChats[allotment.id] ?? [];

  const approvalBadgeColor = allotment.approval_status === 'ACKNOWLEDGED'
    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    : allotment.approval_status === 'REJECTED'
    ? 'bg-red-100 text-red-800 border border-red-200'
    : 'bg-white/20 text-white';

  return (
    <div ref={panelRef} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-xl shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shrink-0">
          <CheckCircle size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-emerald-100 uppercase tracking-wide">Allotted</div>
          <div className="text-xs font-bold text-white truncate">{selectedRequest.request_number}</div>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${approvalBadgeColor}`}>
          {allotment.approval_status}
        </span>
        <button
          onClick={() => panelRef.current && downloadElementAsHtml(panelRef.current, `Allotment — ${selectedRequest.request_number}`, `Allotment_${selectedRequest.request_number}`)}
          title="Download as HTML"
          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
        >
          <Download size={12} />
        </button>
        {panelControls}
      </div>

      {q && <CompactQuarterRow q={q} accentCls="bg-emerald-50 text-emerald-700 border-emerald-200" />}
      {!q && (
        <div className="px-5 py-3 border-b border-gray-100 bg-emerald-50 shrink-0">
          <div className="text-xs text-emerald-700 font-medium">Allotted on {fmtDate(allotment.allotment_date)}</div>
        </div>
      )}

      {allotment.allotment_conditions && (
        <div className="px-4 py-2 border-b border-amber-100 bg-amber-50 shrink-0">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Conditions: </span>{allotment.allotment_conditions}
          </p>
        </div>
      )}

      {isEO && eoMode === 'employee' && (
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 shrink-0 flex items-center gap-2">
          <button
            onClick={() => openActionPopup('INSPECTION', selectedRequest.id, allotment.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            Start Inspection
          </button>
          <button
            onClick={() => openActionPopup('HANDOVER', selectedRequest.id, allotment.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            Record Handover
          </button>
        </div>
      )}

      <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2 bg-gray-50/30 min-h-0">
        {[...chats].reverse().map(chat => (
          <ChatBubble key={chat.id} chat={chat} isSelf={chat.author_role === 'employee'} roleLabel={chat.author_role === 'eo' ? 'Estate Officer' : undefined} />
        ))}
        {chats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-1.5">
            <Send size={18} className="text-gray-300" />
            <div className="text-xs text-gray-400 font-medium">No messages yet</div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 px-3.5 py-2.5 bg-white">
        <ChatDeliveryModePicker value={allotmentChatMode} onChange={setAllotmentChatMode} className="mb-1.5" />
        {allotmentChatFile && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg mb-1.5">
            <FileText size={11} className="text-blue-500 shrink-0" />
            <span className="flex-1 min-w-0 text-[11px] font-medium text-blue-800 truncate">{allotmentChatFile.name}</span>
            <button type="button" onClick={() => setAllotmentChatFile(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0">
              <X size={10} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => allotmentChatFileRef.current?.click()}
            className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
            title="Attach file"
          >
            <Paperclip size={14} />
          </button>
          <input
            ref={allotmentChatFileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0] ?? null; setAllotmentChatFile(f); e.target.value = ''; }}
          />
          <textarea
            value={allotmentChatMessage}
            onChange={e => setAllotmentChatMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && allotmentChatMessage.trim()) { e.preventDefault(); handleSendAllotmentChat(); } }}
            rows={1}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-gray-50 transition-colors"
            style={{ minHeight: '36px', maxHeight: '72px' }}
          />
          <button
            onClick={handleSendAllotmentChat}
            disabled={!allotmentChatMessage.trim() || allotmentChatSubmitting}
            className="flex-none p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send"
          >
            {allotmentChatSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RightPanelOccupied ───────────────────────────────────────────────────────

interface RightPanelOccupiedProps extends PanelBase {
  tenantRequests: QuarterTenantRequest[];
  serviceChats: Record<string, QuarterServiceChat[]>;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  servicesHistoryMode: boolean;
  setServicesHistoryMode: (v: boolean) => void;
  chatMessage: string;
  setChatMessage: (v: string) => void;
  chatAttachFile: File | null;
  setChatAttachFile: (f: File | null) => void;
  chatSubmitting: boolean;
  handleSendChat: () => void;
  handleCloseService: () => void;
  rightAction: string | null;
  setRightAction: (a: any) => void;
  actionReason: string;
  setActionReason: (v: string) => void;
  actionRemarks: string;
  setActionRemarks: (v: string) => void;
  actionDate: string;
  setActionDate: (v: string) => void;
  actionDocUrl: File | null;
  setActionDocUrl: (f: File | null) => void;
  actionSubmitting: boolean;
  resetActionForm: () => void;
  handleTenantRequest: (type: 'EXTEND' | 'VACATE') => void;
  onUpgradeClick: () => void;
  onExchangeClick: () => void;
  openActionPopup: (type: 'GRIEVANCE' | 'MAINTENANCE' | 'VACATE', requestId: string, allotmentId: string) => void;
  setServiceChats: React.Dispatch<React.SetStateAction<Record<string, QuarterServiceChat[]>>>;
  setPreviewQuarterId: (id: string | null) => void;
  setIsPreviewOpen: (v: boolean) => void;
  isEO?: boolean;
  // Chat tab
  initialTab?: 'services' | 'chat';
  allotmentChats?: Record<string, QuarterAllotmentChat[]>;
  allotmentChatMessage?: string;
  setAllotmentChatMessage?: (v: string) => void;
  allotmentChatFile?: File | null;
  setAllotmentChatFile?: (f: File | null) => void;
  allotmentChatSubmitting?: boolean;
  handleSendAllotmentChat?: () => void;
  allotmentChatMode?: ChatDeliveryMode[];
  setAllotmentChatMode?: (m: ChatDeliveryMode[]) => void;
}

export const RightPanelOccupied: React.FC<RightPanelOccupiedProps> = ({
  panelControls, selectedRequest, tenantRequests, serviceChats,
  selectedServiceId, setSelectedServiceId, servicesHistoryMode, setServicesHistoryMode,
  chatMessage, setChatMessage, chatAttachFile, setChatAttachFile,
  chatSubmitting, handleSendChat, handleCloseService,
  rightAction, setRightAction, actionReason, setActionReason,
  actionRemarks, setActionRemarks, actionDate, setActionDate,
  actionDocUrl, setActionDocUrl,
  actionSubmitting, resetActionForm, handleTenantRequest, onUpgradeClick, onExchangeClick, openActionPopup,
  setServiceChats, setPreviewQuarterId, setIsPreviewOpen,
  isEO = false,
  initialTab,
  allotmentChats = {}, allotmentChatMessage = '', setAllotmentChatMessage,
  allotmentChatFile = null, setAllotmentChatFile,
  allotmentChatSubmitting = false, handleSendAllotmentChat,
  allotmentChatMode = ['IN_APP'] as ChatDeliveryMode[], setAllotmentChatMode,
}) => {
  const navigate = useNavigate();
  const chatFileRef = useRef<HTMLInputElement>(null);
  const allotmentChatFileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'chat'>('chat');

  if (!selectedRequest?.allotment) return null;
  const allotment = selectedRequest.allotment;
  const q = allotment.quarter;

  const activeSvcRequests = tenantRequests.filter(tr => tr.allotment_id === allotment.id && tr.request_status === 'PENDING');
  const allSvcRequests = tenantRequests.filter(tr => tr.allotment_id === allotment.id);
  const [historySelectedId, setHistorySelectedId] = useState<string | null>(allSvcRequests[0]?.id ?? null);

  const chatsForService = selectedServiceId ? (serviceChats[selectedServiceId] ?? []) : [];
  const selectedSvc = selectedServiceId ? tenantRequests.find(tr => tr.id === selectedServiceId) : null;

  if (servicesHistoryMode) {
    const historyChats = historySelectedId ? (serviceChats[historySelectedId] ?? []) : [];
    const historySvc = historySelectedId ? allSvcRequests.find(tr => tr.id === historySelectedId) : null;
    return (
      <>
        <div className="flex items-center gap-3 px-4 py-3 bg-teal-600 rounded-t-xl sticky top-0 z-10">
          <button onClick={() => setServicesHistoryMode(false)} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-teal-100 uppercase tracking-wide">Service History</div>
            <div className="text-sm font-semibold text-white">{selectedRequest.request_number}</div>
          </div>
          {panelControls}
        </div>
        <div className="flex h-full" style={{ minHeight: 400 }}>
          <div className="w-40 shrink-0 border-r border-gray-200 overflow-y-auto">
            {allSvcRequests.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">No history</div>
            ) : allSvcRequests.map(tr => {
              const stc = serviceTypeConfig(tr.service_type);
              const sc = tenantStatusConfig(tr.request_status);
              return (
                <button
                  key={tr.id}
                  onClick={() => {
                    setHistorySelectedId(tr.id);
                    quartersService.getServiceChats(tr.id).then(chats => {
                      setServiceChats(prev => ({ ...prev, [tr.id]: chats }));
                    }).catch(() => {});
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors ${historySelectedId === tr.id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${stc.cls} mb-1`}>{stc.icon}{stc.label}</div>
                  <div className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-block ${sc.cls}`}>{sc.label}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{fmtDate(tr.created_at)}</div>
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historySvc && (
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${serviceTypeConfig(historySvc.service_type).cls}`}>
                  {serviceTypeConfig(historySvc.service_type).icon}{serviceTypeConfig(historySvc.service_type).label}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border ${tenantStatusConfig(historySvc.request_status).cls}`}>{tenantStatusConfig(historySvc.request_status).label}</span>
              </div>
            )}
            {historyChats.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-6">No messages for this service request.</div>
            ) : [...historyChats].reverse().map(chat => (
              <div key={chat.id} className={`flex gap-2 ${chat.author_role === 'EMPLOYEE' ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${chat.author_role === 'EMPLOYEE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p>{chat.message}</p>
                  {chat.document_urls.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {chat.document_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-80">Document {i + 1}</a>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] mt-1 opacity-60">{fmtDate(chat.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (selectedSvc) {
    const stc = serviceTypeConfig(selectedSvc.service_type);
    const tsc = tenantStatusConfig(selectedSvc.request_status);
    const svcCtrlRef = `SVC-${selectedSvc.id.slice(-6).toUpperCase()}`;

    const svcAccentBar = {
      GRIEVANCE: 'bg-rose-500', MAINTENANCE: 'bg-slate-500',
      EXTEND: 'bg-amber-500', UPGRADE: 'bg-sky-500', VACATE: 'bg-orange-500',
    }[selectedSvc.service_type] ?? 'bg-gray-500';

    const svcIconCls = {
      GRIEVANCE: 'bg-rose-100 text-rose-600', MAINTENANCE: 'bg-slate-100 text-slate-600',
      EXTEND: 'bg-amber-100 text-amber-600', UPGRADE: 'bg-sky-100 text-sky-600', VACATE: 'bg-orange-100 text-orange-600',
    }[selectedSvc.service_type] ?? 'bg-gray-100 text-gray-600';

    const svcBorderLeft = {
      GRIEVANCE: 'border-l-rose-400', MAINTENANCE: 'border-l-slate-400',
      EXTEND: 'border-l-amber-400', UPGRADE: 'border-l-sky-400', VACATE: 'border-l-orange-400',
    }[selectedSvc.service_type] ?? 'border-l-gray-400';

    const hasSubjectInfo = (selectedSvc.service_type === 'GRIEVANCE' || selectedSvc.service_type === 'MAINTENANCE') && (selectedSvc.grievance_subject || selectedSvc.remarks);
    const mainTitle = (hasSubjectInfo ? selectedSvc.grievance_subject : selectedSvc.reason) || stc.label;
    const titleIsGeneric = mainTitle === stc.label;

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-none flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 rounded-t-xl sticky top-0 z-10">
          <button
            onClick={() => setSelectedServiceId(null)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${svcIconCls}`}>
            {stc.icon}
          </div>
          {titleIsGeneric ? (
            <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
              <span className="text-[13px] font-bold text-gray-900 shrink-0">{stc.label}</span>
              <span className="text-[10px] text-gray-400 font-mono shrink-0">{svcCtrlRef}</span>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-500">{stc.label}</span>
                <span className="text-[10px] text-gray-400 font-mono">{svcCtrlRef}</span>
              </div>
              <div className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{mainTitle}</div>
            </div>
          )}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${tsc.cls}`}>{tsc.label}</span>
          {panelControls && (
            <div className="flex items-center gap-0.5 shrink-0 ml-1 [&_button]:text-gray-400 [&_button]:hover:text-gray-700 [&_button]:hover:bg-gray-100 [&_div]:bg-gray-200">
              {panelControls}
            </div>
          )}
        </div>

        {q && (
          <div className="flex-none flex items-center gap-2.5 px-4 py-1.5 bg-teal-50 border-b border-teal-100">
            <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-teal-200">
              <img src={getImage(q, 0)} alt={q.quarter_number} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-teal-800">{q.quarter_number}</span>
              <span className="text-[10px] text-teal-500">·</span>
              <span className="text-[11px] text-teal-700">{q.bhk_config}</span>
              <span className="text-[10px] text-teal-400">·</span>
              <span className="text-[11px] text-teal-600 truncate">{q.address ?? `Block ${q.block_name}, Floor ${q.floor_number}`}</span>
            </div>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">Occupied</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 pb-2">
            <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${svcBorderLeft} shadow-sm overflow-hidden`}>
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stc.label}</div>
                    <div className="text-[15px] font-bold text-gray-900 leading-snug">{mainTitle}</div>
                  </div>
                  {selectedSvc.request_status === 'PENDING' && (
                    <button
                      onClick={handleCloseService}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition-colors"
                    >
                      <X size={11} />Close
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-4">
                {selectedSvc.reason && !hasSubjectInfo && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Reason</div>
                    <div className="text-[13px] text-gray-800 leading-relaxed">{selectedSvc.reason}</div>
                  </div>
                )}
                {hasSubjectInfo && selectedSvc.grievance_subject && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</div>
                    <div className="text-[13px] text-gray-800 leading-relaxed">{selectedSvc.grievance_subject}</div>
                  </div>
                )}
                {selectedSvc.remarks && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Remarks</div>
                    <div className="text-[12px] text-gray-600 leading-relaxed">{selectedSvc.remarks}</div>
                  </div>
                )}
                {selectedSvc.urgency_level && selectedSvc.urgency_level !== 'NORMAL' && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Urgency</div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-block ${
                      selectedSvc.urgency_level === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300'
                      : selectedSvc.urgency_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedSvc.urgency_level}
                    </span>
                  </div>
                )}
                {selectedSvc.requested_date && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {selectedSvc.service_type === 'EXTEND' ? 'Extension Until' : selectedSvc.service_type === 'VACATE' ? 'Vacate By' : 'Requested Date'}
                    </div>
                    <div className="text-[12px] text-gray-800 flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-gray-400" />{fmtDate(selectedSvc.requested_date)}
                    </div>
                  </div>
                )}
                {selectedSvc.required_bhk_config && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Required BHK</div>
                    <div className="text-[12px] text-gray-800 flex items-center gap-1.5">
                      <Bed size={12} className="text-gray-400" />{selectedSvc.required_bhk_config}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Submitted</div>
                  <div className="text-[12px] text-gray-700">{fmtDate(selectedSvc.created_at)}</div>
                </div>
                {selectedSvc.document_url && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Document</div>
                    <a href={selectedSvc.document_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-700 font-medium hover:underline underline-offset-2 transition-colors">
                      <ExternalLink size={11} />View File
                    </a>
                  </div>
                )}
              </div>

              {selectedSvc.eo_notes && (
                <div className="mx-4 mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Estate Officer Notes</div>
                  <div className="text-[12px] text-amber-900 leading-relaxed">{selectedSvc.eo_notes}</div>
                </div>
              )}
            </div>
          </div>

          <div className="px-3.5 pt-1.5 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Conversation</span>
                {chatsForService.length > 0 && (
                  <span className="bg-teal-100 text-teal-700 rounded-full px-1.5 py-0.5 text-[9px] font-bold">{chatsForService.length}</span>
                )}
              </div>
              <button
                onClick={() => setServicesHistoryMode(true)}
                className="text-[10px] text-gray-400 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Clock size={10} /> History
              </button>
            </div>
            <div className="space-y-2">
              {[...chatsForService].reverse().map(chat => (
                <ChatBubble key={chat.id} chat={chat} isSelf={chat.author_role === 'EMPLOYEE'} />
              ))}
              {chatsForService.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                  <Send size={16} className="text-gray-300" />
                  <div className="text-xs text-gray-400 font-medium">No messages yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-none border-t border-gray-100 px-3.5 py-2.5 bg-white">
          {chatAttachFile && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg mb-1.5">
              <FileText size={11} className="text-blue-500 shrink-0" />
              <span className="flex-1 min-w-0 text-[11px] font-medium text-blue-800 truncate">{chatAttachFile.name}</span>
              <button type="button" onClick={() => setChatAttachFile(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0">
                <X size={10} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <button
              type="button"
              onClick={() => chatFileRef.current?.click()}
              className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-colors"
            >
              <Paperclip size={14} />
            </button>
            <input
              ref={chatFileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; setChatAttachFile(f); e.target.value = ''; }}
            />
            <textarea
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && chatMessage.trim()) { e.preventDefault(); handleSendChat(); } }}
              rows={1}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-gray-50 transition-colors"
              style={{ minHeight: '36px', maxHeight: '72px' }}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatMessage.trim() || chatSubmitting}
              className="flex-none p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {chatSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-xl sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shrink-0">
          <ThumbsUp size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-teal-100 uppercase tracking-wide">Occupied</div>
          <div className="text-xs font-bold text-white truncate">{selectedRequest.request_number}</div>
        </div>
        <span className="text-[9px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          Since {fmtDate(allotment.acknowledged_at ?? allotment.allotment_date)}
        </span>
        {panelControls}
      </div>

      {q && <CompactQuarterRow q={q} accentCls="bg-teal-50 text-teal-700 border-teal-200" />}

      {/* Tab switcher */}
      <div className="flex border-b border-gray-200 shrink-0 bg-white">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'chat' ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        >
          <Send size={12} /> Chat
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (() => {
        const chats = allotmentChats[allotment.id] ?? [];
        return (
          <>
            <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2 bg-gray-50/30 min-h-0">
              {[...chats].reverse().map(chat => (
                <ChatBubble key={chat.id} chat={chat} isSelf={chat.author_role === 'employee'} roleLabel={chat.author_role === 'eo' ? 'Estate Officer' : undefined} />
              ))}
              {chats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-1.5">
                  <Send size={18} className="text-gray-300" />
                  <div className="text-xs text-gray-400 font-medium">No messages yet</div>
                </div>
              )}
            </div>
            <div className="shrink-0 border-t border-gray-100 px-3.5 py-2.5 bg-white">
              <ChatDeliveryModePicker value={allotmentChatMode} onChange={v => setAllotmentChatMode?.(v)} className="mb-1.5" />
              {allotmentChatFile && (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg mb-1.5">
                  <FileText size={11} className="text-blue-500 shrink-0" />
                  <span className="flex-1 min-w-0 text-[11px] font-medium text-blue-800 truncate">{allotmentChatFile.name}</span>
                  <button type="button" onClick={() => setAllotmentChatFile?.(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0"><X size={10} /></button>
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <button type="button" onClick={() => allotmentChatFileRef.current?.click()}
                  className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-colors">
                  <Paperclip size={14} />
                </button>
                <input ref={allotmentChatFileRef} type="file" accept="application/pdf,image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0] ?? null; setAllotmentChatFile?.(f); e.target.value = ''; }} />
                <textarea value={allotmentChatMessage}
                  onChange={e => setAllotmentChatMessage?.(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && allotmentChatMessage.trim()) { e.preventDefault(); handleSendAllotmentChat?.(); } }}
                  rows={1} placeholder="Type a message… (Enter to send)"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-gray-50 transition-colors"
                  style={{ minHeight: '36px', maxHeight: '72px' }} />
                <button onClick={() => handleSendAllotmentChat?.()} disabled={!allotmentChatMessage.trim() || allotmentChatSubmitting}
                  className="flex-none p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {allotmentChatSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </>
        );
      })()}

    </div>
  );
};

// ─── RightPanelDraft ──────────────────────────────────────────────────────────

interface RightPanelDraftProps extends PanelBase {
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  loadData: () => void;
  setSelectedRequest: (req: QuarterRequest | null) => void;
  openNewModal: (req: QuarterRequest) => void;
  Quarter: unknown;
}

export const RightPanelDraft: React.FC<{
  panelControls?: React.ReactNode;
  selectedRequest: QuarterRequest;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  loadData: () => void;
  setSelectedRequest: (req: QuarterRequest | null) => void;
  openNewModal: (req: QuarterRequest) => void;
  allotmentChats?: Record<string, QuarterAllotmentChat[]>;
  allotmentChatMessage?: string;
  setAllotmentChatMessage?: (v: string) => void;
  allotmentChatFile?: File | null;
  setAllotmentChatFile?: (f: File | null) => void;
  allotmentChatSubmitting?: boolean;
  handleSendAllotmentChat?: () => void;
  allotmentChatMode?: ChatDeliveryMode[];
  setAllotmentChatMode?: (m: ChatDeliveryMode[]) => void;
  scrollToChat?: boolean;
}> = ({
  panelControls, selectedRequest, addToast, loadData, setSelectedRequest, openNewModal,
  allotmentChats = {}, allotmentChatMessage = '', setAllotmentChatMessage,
  allotmentChatFile = null, setAllotmentChatFile,
  allotmentChatSubmitting = false, handleSendAllotmentChat,
  allotmentChatMode = ['IN_APP'] as ChatDeliveryMode[], setAllotmentChatMode, scrollToChat = false,
}) => {
  const draftChatFileRef = useRef<HTMLInputElement>(null);
  const draftChatSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToChat && draftChatSectionRef.current) {
      draftChatSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToChat]);
  const [draftForm, setDraftForm] = useState({
    request_reason: selectedRequest.request_reason ?? '',
    request_type: (selectedRequest.request_type ?? 'GENERAL') as 'GENERAL' | 'MEDICAL' | 'REFERENCE',
    preferred_location: selectedRequest.preferred_location ?? '',
    move_in_date: selectedRequest.move_in_date ?? '',
    employee_notes: selectedRequest.employee_notes ?? '',
  });
  const [draftSubmitting, setDraftSubmitting] = useState(false);

  const handleUpdate = async () => {
    setDraftSubmitting(true);
    try {
      await quartersService.updateRequestHeader(selectedRequest.id, {
        request_reason: draftForm.request_reason,
        required_bhk_config: '',
        preferred_location: draftForm.preferred_location,
        move_in_date: draftForm.move_in_date || null,
        family_member_count: 1,
        request_type: draftForm.request_type,
        employee_notes: draftForm.employee_notes,
      });
      addToast('Draft updated', 'success');
      loadData();
    } catch { addToast('Failed to update draft', 'error'); } finally { setDraftSubmitting(false); }
  };

  const handleSubmitDraft = async () => {
    if (!window.confirm('Submit this request for allotment?')) return;
    setDraftSubmitting(true);
    try {
      await quartersService.updateRequestHeader(selectedRequest.id, {
        request_reason: draftForm.request_reason,
        required_bhk_config: '',
        preferred_location: draftForm.preferred_location,
        move_in_date: draftForm.move_in_date || null,
        family_member_count: 1,
        request_type: draftForm.request_type,
        employee_notes: draftForm.employee_notes,
      });
      await quartersService.submitRequest(selectedRequest.id);
      addToast('Request submitted successfully', 'success');
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setDraftSubmitting(false); }
  };

  const handleCancelDraft = async () => {
    if (!window.confirm('Cancel this draft request?')) return;
    try {
      await quartersService.cancelRequest(selectedRequest.id);
      addToast('Request cancelled', 'success');
      setSelectedRequest(null);
      loadData();
    } catch { addToast('Failed to cancel request', 'error'); }
  };

  const draftPrefs = selectedRequest.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];

  return (
    <>
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl sticky top-0 z-10">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shrink-0">
          <FileText size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-amber-100 uppercase tracking-wide">Draft</div>
          <div className="text-xs font-bold text-white truncate">{selectedRequest.request_number}</div>
        </div>
        <span className="text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">Draft</span>
        {panelControls}
      </div>

      {/* Chat with Estate Officer */}
      <div ref={draftChatSectionRef} className="border-t border-gray-100">
        <div className="px-3.5 pt-3 pb-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Chat with Estate Officer</span>
          {(allotmentChats[selectedRequest.id] ?? []).length > 0 && (
            <span className="bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 text-[9px] font-bold">{(allotmentChats[selectedRequest.id] ?? []).length}</span>
          )}
        </div>
        <div className="px-3.5 pb-2.5 space-y-2 max-h-44 overflow-y-auto bg-gray-50/30 mx-3.5 rounded-lg border border-gray-100">
          {[...(allotmentChats[selectedRequest.id] ?? [])].reverse().map(chat => (
            <ChatBubble key={chat.id} chat={chat} isSelf={chat.author_role === 'employee'} roleLabel={chat.author_role === 'eo' ? 'Estate Officer' : undefined} />
          ))}
          {(allotmentChats[selectedRequest.id] ?? []).length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-1.5">
              <Send size={16} className="text-gray-300" />
              <div className="text-xs text-gray-400 font-medium">No messages yet</div>
            </div>
          )}
        </div>
        <div className="px-3.5 pb-3 pt-2.5 bg-white">
          <ChatDeliveryModePicker value={allotmentChatMode} onChange={v => setAllotmentChatMode?.(v)} className="mb-1.5" />
          {allotmentChatFile && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg mb-1.5">
              <FileText size={11} className="text-blue-500 shrink-0" />
              <span className="flex-1 min-w-0 text-[11px] font-medium text-blue-800 truncate">{allotmentChatFile.name}</span>
              <button type="button" onClick={() => setAllotmentChatFile?.(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0"><X size={10} /></button>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <button type="button" onClick={() => draftChatFileRef.current?.click()}
              className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors">
              <Paperclip size={14} />
            </button>
            <input ref={draftChatFileRef} type="file" accept="application/pdf,image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; setAllotmentChatFile?.(f); e.target.value = ''; }} />
            <textarea value={allotmentChatMessage}
              onChange={e => setAllotmentChatMessage?.(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && allotmentChatMessage.trim()) { e.preventDefault(); handleSendAllotmentChat?.(); } }}
              rows={1} placeholder="Type a message… (Enter to send)"
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-gray-50 transition-colors"
              style={{ minHeight: '36px', maxHeight: '72px' }} />
            <button onClick={() => handleSendAllotmentChat?.()} disabled={!allotmentChatMessage.trim() || allotmentChatSubmitting}
              className="flex-none p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {allotmentChatSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

// ─── RightPanelPreferences ────────────────────────────────────────────────────

export const RightPanelPreferences: React.FC<{
  panelControls?: React.ReactNode;
  selectedRequest: QuarterRequest | null;
  selectedPrefs: Array<{ id: string; quarter: unknown; preference_rank: number }>;
  selectedPrefQuarter: Quarter | null;
  setSelectedPrefQuarter: (q: Quarter | null) => void;
  setPreviewQuarterId: (id: string | null) => void;
  setIsPreviewOpen: (v: boolean) => void;
  openNewModal: (req: QuarterRequest) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  loadData: () => void;
}> = ({
  panelControls, selectedRequest, selectedPrefs, selectedPrefQuarter,
  setSelectedPrefQuarter, setPreviewQuarterId, setIsPreviewOpen,
  openNewModal, addToast, loadData,
}) => (
  <>
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-xl sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Star size={14} className="text-amber-500 shrink-0" /> Preference List
        </h2>
        <div className="text-xs text-gray-500 mt-0.5">
          For <span className="font-mono text-gray-700">{selectedRequest?.request_number}</span> ·{' '}
          <span className={`font-medium ${selectedPrefs.length >= 5 ? 'text-red-600' : 'text-amber-600'}`}>
            {selectedPrefs.length} of 5
          </span> selected
        </div>
      </div>
      {selectedRequest && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${statusConfig(selectedRequest.request_status).cls}`}>
          {statusConfig(selectedRequest.request_status).icon}
          {statusConfig(selectedRequest.request_status).label}
        </span>
      )}
      {panelControls && (
        <div className="flex items-center gap-0.5 shrink-0 [&_button]:text-gray-400 [&_button]:hover:text-gray-700 [&_button]:hover:bg-gray-200 [&_div]:bg-gray-300">
          {panelControls}
        </div>
      )}
    </div>

    {selectedPrefQuarter && (
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Viewing Preference #{selectedPrefs.findIndex(p => (p.quarter as Quarter | undefined)?.id === selectedPrefQuarter.id) + 1}
          </div>
          <button onClick={() => setSelectedPrefQuarter(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"><X size={14} /></button>
        </div>
        <QuarterDetailCard quarter={selectedPrefQuarter} compact />
      </div>
    )}

    <div className="p-5">
      {selectedRequest?.request_status === 'DRAFT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          Click <Eye size={12} className="inline mx-1" /> to view quarter details. Reorder with arrows.
        </div>
      )}

      {selectedPrefs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No preferences added yet.</p>
          {selectedRequest?.request_status === 'DRAFT' && (
            <button onClick={() => selectedRequest && openNewModal(selectedRequest)} className="mt-3 text-sm text-blue-600 hover:underline">Add preferences</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {selectedPrefs.map((pref, i) => {
            const q = pref.quarter as Quarter | undefined;
            if (!q) return null;
            const isViewing = selectedPrefQuarter?.id === q.id;
            return (
              <div
                key={pref.id}
                className={`flex items-center gap-3 rounded-xl p-3 border transition-all cursor-pointer hover:shadow-sm ${isViewing ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'}`}
                onClick={() => setSelectedPrefQuarter(isViewing ? null : q)}
              >
                <div className="relative shrink-0">
                  <img src={getImage(q, i)} alt={q.quarter_number} className="w-16 h-16 rounded-lg object-cover" />
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${isViewing ? 'bg-blue-600' : 'bg-slate-800'}`}>{pref.preference_rank}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                  {q.address && <div className="text-xs text-gray-500 truncate">{q.address}</div>}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1"><Bed size={11} />{q.bhk_config}</span>
                    <span className="flex items-center gap-1"><Ruler size={11} />{q.area_sqft} sq.ft</span>
                    <span className="font-medium text-gray-800">{fmtINR(q.monthly_rent)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setPreviewQuarterId(q.id); setIsPreviewOpen(true); }}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  ><Eye size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRequest?.request_status === 'DRAFT' && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => selectedRequest && openNewModal(selectedRequest)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Plus size={14} /> Add / Reorder
          </button>
          <Button onClick={async () => {
            if (!selectedRequest) return;
            try {
              await quartersService.submitRequest(selectedRequest.id);
              addToast('Request submitted', 'success');
              loadData();
            } catch { addToast('Failed to submit', 'error'); }
          }}>
            <Send size={14} className="mr-1" /> Submit
          </Button>
        </div>
      )}
    </div>
  </>
);

// ─── RightPanelSubmitted ──────────────────────────────────────────────────────

export const RightPanelSubmitted: React.FC<{
  panelControls?: React.ReactNode;
  selectedRequest: QuarterRequest;
  user: UserDTO | null;
  handleWithdraw: (requestId: string) => void;
  allotmentChats?: Record<string, QuarterAllotmentChat[]>;
  allotmentChatMessage?: string;
  setAllotmentChatMessage?: (v: string) => void;
  allotmentChatFile?: File | null;
  setAllotmentChatFile?: (f: File | null) => void;
  allotmentChatSubmitting?: boolean;
  handleSendAllotmentChat?: () => void;
  allotmentChatMode?: ChatDeliveryMode[];
  setAllotmentChatMode?: (m: ChatDeliveryMode[]) => void;
  scrollToChat?: boolean;
}> = ({
  panelControls, selectedRequest, user, handleWithdraw,
  allotmentChats = {}, allotmentChatMessage = '', setAllotmentChatMessage,
  allotmentChatFile = null, setAllotmentChatFile,
  allotmentChatSubmitting = false, handleSendAllotmentChat,
  allotmentChatMode = ['IN_APP'] as ChatDeliveryMode[], setAllotmentChatMode, scrollToChat = false,
}) => {
  const submittedChatFileRef = useRef<HTMLInputElement>(null);
  const submittedChatSectionRef = useRef<HTMLDivElement>(null);
  const chats = allotmentChats[selectedRequest.id] ?? [];

  useEffect(() => {
    if (scrollToChat && submittedChatSectionRef.current) {
      submittedChatSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToChat]);

  return (
    <>
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl sticky top-0 z-10">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shrink-0">
          <Send size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-blue-100 uppercase tracking-wide">Awaiting Review</div>
          <div className="text-xs font-bold text-white truncate">{selectedRequest.request_number}</div>
        </div>
        <span className="text-[9px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          {fmtDate(selectedRequest.created_at)}
        </span>
        {panelControls}
      </div>

      <div className="mx-3.5 mt-3 mb-1 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <Clock size={13} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-semibold text-blue-800">Request under review</div>
          <div className="text-[10px] text-blue-600 mt-0.5 leading-relaxed">
            Your request is pending review by the Estate Officer. You will be notified once a decision is made.
          </div>
        </div>
      </div>

      {/* Chat with Estate Officer */}
      <div ref={submittedChatSectionRef} className="border-t border-gray-100 mt-1.5">
        <div className="px-3.5 pt-3 pb-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Chat with Estate Officer</span>
          {chats.length > 0 && (
            <span className="bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 text-[9px] font-bold">{chats.length}</span>
          )}
        </div>
        <div className="px-3.5 pb-2.5 space-y-2 max-h-44 overflow-y-auto bg-gray-50/30 mx-3.5 rounded-lg border border-gray-100">
          {[...chats].reverse().map(chat => (
            <ChatBubble key={chat.id} chat={chat} isSelf={chat.author_role === 'employee'} roleLabel={chat.author_role === 'eo' ? 'Estate Officer' : undefined} />
          ))}
          {chats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-1.5">
              <Send size={16} className="text-gray-300" />
              <div className="text-xs text-gray-400 font-medium">No messages yet</div>
            </div>
          )}
        </div>
        <div className="px-3.5 pb-3 pt-2.5 bg-white">
          <ChatDeliveryModePicker value={allotmentChatMode} onChange={v => setAllotmentChatMode?.(v)} className="mb-1.5" />
          {allotmentChatFile && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg mb-1.5">
              <FileText size={11} className="text-blue-500 shrink-0" />
              <span className="flex-1 min-w-0 text-[11px] font-medium text-blue-800 truncate">{allotmentChatFile.name}</span>
              <button type="button" onClick={() => setAllotmentChatFile?.(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0"><X size={10} /></button>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <button type="button" onClick={() => submittedChatFileRef.current?.click()}
              className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Paperclip size={14} />
            </button>
            <input ref={submittedChatFileRef} type="file" accept="application/pdf,image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; setAllotmentChatFile?.(f); e.target.value = ''; }} />
            <textarea value={allotmentChatMessage}
              onChange={e => setAllotmentChatMessage?.(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && allotmentChatMessage.trim()) { e.preventDefault(); handleSendAllotmentChat?.(); } }}
              rows={1} placeholder="Type a message… (Enter to send)"
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-gray-50 transition-colors"
              style={{ minHeight: '36px', maxHeight: '72px' }} />
            <button onClick={() => handleSendAllotmentChat?.()} disabled={!allotmentChatMessage.trim() || allotmentChatSubmitting}
              className="flex-none p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {allotmentChatSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>

    </>
  );
};
