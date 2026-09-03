import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Send, Zap, Search, Filter, Building2, Plus, Star, ArrowUp, ArrowDown, Trash2,
  X, UserCheck, UserPlus, User, Users, CheckCircle, Home, FileText,
  Phone, Mail, CreditCard, Download, Paperclip, Upload, GitMerge, ChevronRight, PlayCircle,
} from 'lucide-react';
import { quartersService } from '../../services/quartersService';
import type { QuarterApprovalWorkflow } from '../../types/quarters';
import { fmtINR, getImage } from './quarterShared';
import { Quarter } from '../../services/quartersService';
import { downloadElementAsHtml } from '../../utils/downloadHtml';
import { UserDTO } from '../../types';
import { QUARTER_TYPE_OPTIONS } from '../../utils/quarterDisplay';
import { DEMO_EMPLOYEES, DEMO_TP_PROFILES } from '../../mocks/demoData';
import type { RequestForType, DemoEmployee, TPInfo } from '../../types/quarterRequests';

// Types needed
type RequestType = 'GENERAL' | 'MEDICAL' | 'REFERENCE';

interface NewRequestForm {
  request_reason: string;
  preferred_location: string;
  move_in_date: string;
  employee_notes: string;
  request_type: RequestType;
}

export interface UploadedDoc {
  file: File;
  document_name: string;
}

interface PrefItem { quarter: Quarter; rank: number; }

export interface NewRequestModalProps {
  activeCycle: { cycle_name: string; end_date: string } | null;
  isEO: boolean;
  eoMode: 'self' | 'employee' | null;
  userRole: string | undefined;
  user: UserDTO | null;
  documents: UploadedDoc[];
  setDocuments: React.Dispatch<React.SetStateAction<UploadedDoc[]>>;
  form: NewRequestForm;
  setForm: React.Dispatch<React.SetStateAction<NewRequestForm>>;
  prefs: PrefItem[];
  addPref: (q: Quarter) => void;
  removePref: (quarterId: string) => void;
  movePref: (idx: number, dir: 'up' | 'down') => void;
  modalQuarters: Quarter[];
  modalSearch: string;
  setModalSearch: (v: string) => void;
  modalLoading: boolean;
  modalBhk: string;
  setModalBhk: (v: string) => void;
  modalFurnishing: string;
  setModalFurnishing: (v: string) => void;
  modalSortBy: string;
  setModalSortBy: (v: string) => void;
  modalGroundFloor: boolean;
  setModalGroundFloor: (v: boolean) => void;
  modalRecentlyRenovated: boolean;
  setModalRecentlyRenovated: (v: boolean) => void;
  modalLocationArea: string;
  setModalLocationArea: (v: string) => void;
  modalWesternToilet: boolean;
  setModalWesternToilet: (v: boolean) => void;
  modalIndianToilet: boolean;
  setModalIndianToilet: (v: boolean) => void;
  modalCarParking: boolean;
  setModalCarParking: (v: boolean) => void;
  modalPoojaRoom: boolean;
  setModalPoojaRoom: (v: boolean) => void;
  modalBalcony: boolean;
  setModalBalcony: (v: boolean) => void;
  modalKitchenExhaust: boolean;
  setModalKitchenExhaust: (v: boolean) => void;
  modalLiftAccess: boolean;
  setModalLiftAccess: (v: boolean) => void;
  modalIndependentHouse: boolean;
  setModalIndependentHouse: (v: boolean) => void;
  modalHousingStyle: string;
  setModalHousingStyle: (v: string) => void;
  modalFilterOpen: boolean;
  setModalFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalFilterRef: React.RefObject<HTMLDivElement>;
  requestFor: RequestForType;
  setRequestFor: (v: RequestForType) => void;
  selectedEmployee: DemoEmployee | null;
  setSelectedEmployee: (e: DemoEmployee | null) => void;
  showEmployeePicker: boolean;
  setShowEmployeePicker: (v: boolean) => void;
  employeeSearch: string;
  setEmployeeSearch: (v: string) => void;
  employeeDeptFilter: string;
  setEmployeeDeptFilter: (v: string) => void;
  tpInfo: TPInfo;
  setTpInfo: React.Dispatch<React.SetStateAction<TPInfo>>;
  tpInfoConfirmed: boolean;
  setTpInfoConfirmed: (v: boolean) => void;
  showTPForm: boolean;
  setShowTPForm: (v: boolean) => void;
  tpFormDraft: TPInfo;
  setTpFormDraft: React.Dispatch<React.SetStateAction<TPInfo>>;
  submitting: boolean;
  allotNowSubmitting: boolean;
  showAllotNowPicker: boolean;
  setShowAllotNowPicker: (v: boolean) => void;
  allotNowSearch: string;
  setAllotNowSearch: (v: string) => void;
  allotNowQuarters: Quarter[];
  allotNowLoading: boolean;
  allotNowQuarterId: string | null;
  setAllotNowQuarterId: (id: string | null) => void;
  allotNowQuarter: Quarter | null;
  setAllotNowQuarter: (q: Quarter | null) => void;
  setPreviewQuarterId: (id: string | null) => void;
  setIsPreviewOpen: (v: boolean) => void;
  onClose: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onAllotNow: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  // Allot with Approval
  showAllotApprovalPopup: boolean;
  setShowAllotApprovalPopup: (v: boolean) => void;
  allotApprovalWflId: string;
  setAllotApprovalWflId: (v: string) => void;
  allotApprovalUsers: string[];
  setAllotApprovalUsers: (v: string[]) => void;
  allotApprovalSubmitting: boolean;
  allotApprovalRequestId: string | null;
  allotApprovalWorkflows: QuarterApprovalWorkflow[];
  onAllotWithApproval: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    activeCycle, isEO, eoMode, userRole, user,
    documents, setDocuments,
    form, setForm, prefs, addPref, removePref, movePref,
    modalQuarters, modalSearch, setModalSearch, modalLoading,
    modalBhk, setModalBhk, modalFurnishing, setModalFurnishing,
    modalSortBy, setModalSortBy,
    modalGroundFloor, setModalGroundFloor,
    modalRecentlyRenovated, setModalRecentlyRenovated,
    modalLocationArea, setModalLocationArea,
    modalWesternToilet, setModalWesternToilet,
    modalIndianToilet, setModalIndianToilet,
    modalCarParking, setModalCarParking,
    modalPoojaRoom, setModalPoojaRoom,
    modalBalcony, setModalBalcony,
    modalKitchenExhaust, setModalKitchenExhaust,
    modalLiftAccess, setModalLiftAccess,
    modalIndependentHouse, setModalIndependentHouse,
    modalHousingStyle, setModalHousingStyle,
    modalFilterOpen, setModalFilterOpen, modalFilterRef,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee,
    showEmployeePicker, setShowEmployeePicker, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter,
    tpInfo, setTpInfo, tpInfoConfirmed, setTpInfoConfirmed,
    showTPForm, setShowTPForm, tpFormDraft, setTpFormDraft,
    submitting, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch,
    allotNowQuarters, allotNowLoading, allotNowQuarterId, setAllotNowQuarterId,
    allotNowQuarter, setAllotNowQuarter,
    setPreviewQuarterId, setIsPreviewOpen,
    onClose, onSaveDraft, onSubmit, onAllotNow, addToast,
    showAllotApprovalPopup, setShowAllotApprovalPopup,
    allotApprovalWflId, setAllotApprovalWflId,
    allotApprovalUsers, setAllotApprovalUsers,
    allotApprovalSubmitting, allotApprovalRequestId,
    allotApprovalWorkflows, onAllotWithApproval,
  } = props;

  const docsRequired = form.request_type === 'MEDICAL' || form.request_type === 'REFERENCE';

  // ── Allot with Approval local state ──────────────────────────────────────────
  const [approvalStage, setApprovalStage] = useState<'wfl' | 'users'>('wfl');
  const [approvalUserSearch, setApprovalUserSearch] = useState('');
  const [approvalUserList, setApprovalUserList] = useState<{ id: string; full_name: string; govt_department: string; govt_employee_id: string }[]>([]);
  const [approvalUsersLoading, setApprovalUsersLoading] = useState(false);

  useEffect(() => {
    if (!showAllotApprovalPopup) { setApprovalStage('wfl'); setApprovalUserSearch(''); return; }
    if (approvalStage === 'users' && approvalUserList.length === 0) {
      setApprovalUsersLoading(true);
      quartersService.getEmployeeUsers().then(list => {
        setApprovalUserList(list);
      }).catch(() => {}).finally(() => setApprovalUsersLoading(false));
    }
  }, [showAllotApprovalPopup, approvalStage]);

  const filteredApprovalUsers = approvalUserList.filter(u =>
    approvalUserSearch === '' ||
    u.full_name.toLowerCase().includes(approvalUserSearch.toLowerCase()) ||
    u.govt_department.toLowerCase().includes(approvalUserSearch.toLowerCase()) ||
    u.govt_employee_id.toLowerCase().includes(approvalUserSearch.toLowerCase())
  );

  const toggleApprovalUser = (id: string) => {
    setAllotApprovalUsers(
      allotApprovalUsers.includes(id)
        ? allotApprovalUsers.filter(u => u !== id)
        : [...allotApprovalUsers, id]
    );
  };

  return createPortal(
    <div ref={modalRef} className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col" style={{ fontFamily: 'inherit' }}>
      {/* Header bar */}
      <div className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button
          onClick={() => onClose()}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900">New Allotment Request</h1>
        </div>
        {user && (
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
              {user.fullName?.charAt(0) ?? 'U'}
            </div>
            <div className="text-left leading-snug">
              <div className="text-[13px] font-semibold text-blue-900 whitespace-nowrap leading-tight">{user.fullName}</div>
              <div className="text-[11px] text-blue-500 whitespace-nowrap leading-tight">{user.govtDepartment || '—'}</div>
            </div>
            <div className="w-px h-8 bg-blue-200 mx-1" />
            <div className="text-left leading-none">
              <div className="text-[9px] text-blue-400 uppercase tracking-wider font-semibold">EMP ID</div>
              <div className="text-[12px] font-semibold text-blue-900 whitespace-nowrap mt-0.5">{user.govtEmployeeId || '—'}</div>
            </div>
            <div className="w-px h-8 bg-blue-200 mx-1" />
            <div className="text-left leading-none">
              <div className="text-[9px] text-blue-400 uppercase tracking-wider font-semibold">Location</div>
              <div className="text-[12px] font-semibold text-blue-900 whitespace-nowrap mt-0.5">{user.projectLocation || '—'}</div>
            </div>
            <div className="w-px h-8 bg-blue-200 mx-1" />
            <div className="text-left leading-none">
              <div className="text-[9px] text-blue-400 uppercase tracking-wider font-semibold">SAP ID</div>
              <div className="text-[12px] font-semibold text-blue-900 whitespace-nowrap mt-0.5">{user.sapId || '—'}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => modalRef.current && downloadElementAsHtml(modalRef.current, 'New Allotment Request', 'New_Allotment_Request')}
            title="Download Offline Copy"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button onClick={onSaveDraft} disabled={submitting || allotNowSubmitting}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          {/* Submit — not shown for EO TP flow (TP reviews + submits themselves) */}
          {!(isEO && requestFor === 'TP') && (
            <button onClick={onSubmit} disabled={submitting || allotNowSubmitting || prefs.length === 0 || (docsRequired && documents.length === 0)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Send size={14} />Submit Request
            </button>
          )}
          {/* Allot Now — EO only */}
          {isEO && (
            <button
              onClick={() => setShowAllotNowPicker(true)}
              disabled={submitting || allotNowSubmitting || !form.request_reason.trim() || (docsRequired && documents.length === 0)}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              title="Allot Now — pick a quarter and allot immediately (VVIP/priority cases)"
            >
              <Zap size={14} />Allot Now
            </button>
          )}
          {/* Allot with Approval — EO only, highlighted after submit */}
          {isEO && (
            <button
              onClick={() => setShowAllotApprovalPopup(true)}
              disabled={submitting || allotNowSubmitting || allotApprovalSubmitting}
              title="Allot with Approval — route through an approval workflow"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                allotApprovalRequestId
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 ring-2 ring-blue-400/60 ring-offset-1 animate-pulse-once'
                  : 'border border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
              } disabled:opacity-50`}
            >
              <GitMerge size={14} />Allot with Approval
              {allotApprovalRequestId && <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping ml-0.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">

        {/* ── Top: Request details form (horizontal band) ── */}
        <div className="shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Request Reason <span className="text-red-500">*</span></label>
              <input value={form.request_reason} onChange={e => setForm(f => ({ ...f, request_reason: e.target.value }))} placeholder="e.g. Transfer-in"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type of Request <span className="text-red-500">*</span></label>
              <select value={form.request_type} onChange={e => setForm(f => ({ ...f, request_type: e.target.value as RequestType }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                <option value="GENERAL">General</option>
                <option value="MEDICAL">Medical grounds</option>
                <option value="REFERENCE">Special/Priority Request</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Move-in Date</label>
              <input type="date" value={form.move_in_date} onChange={e => setForm(f => ({ ...f, move_in_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
              <input value={form.employee_notes} onChange={e => setForm(f => ({ ...f, employee_notes: e.target.value }))} placeholder="Any additional remarks"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
            </div>
          </div>

          {/* ── Document Uploads ── */}
          <div className="mt-4 border border-gray-200 rounded-xl bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <Paperclip size={13} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-700">Supporting Documents</span>
                {docsRequired && <span className="text-red-500 text-xs font-bold">*</span>}
                {documents.length > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full ml-1">{documents.length}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Upload size={12} /> Add Document
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => {
                  const newFiles = Array.from(e.target.files ?? []);
                  setDocuments(prev => [
                    ...prev,
                    ...newFiles.map(f => ({ file: f, document_name: f.name.replace(/\.[^/.]+$/, '') })),
                  ]);
                  e.target.value = '';
                }}
              />
            </div>
            {documents.length === 0 ? (
              <div
                className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors ${docsRequired ? 'bg-red-50 hover:bg-red-100 border-t border-red-100' : 'text-gray-400 hover:bg-gray-50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} className={`shrink-0 ${docsRequired ? 'text-red-400' : 'opacity-50 text-gray-400'}`} />
                {docsRequired ? (
                  <span className="text-xs text-red-600 font-medium">Supporting documents are required for this request type — click to upload (PDF, DOC, JPG, PNG)</span>
                ) : (
                  <span className="text-xs text-gray-400">No documents attached — click to upload (PDF, DOC, JPG, PNG)</span>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                    <FileText size={15} className="text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 items-center">
                      <input
                        value={doc.document_name}
                        onChange={e => setDocuments(prev => prev.map((d, i) => i === idx ? { ...d, document_name: e.target.value } : d))}
                        placeholder="Document name / description"
                        className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium text-gray-800"
                      />
                      <span className="text-[10px] text-gray-400 truncate">{doc.file.name} · {(doc.file.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button
                      onClick={() => setDocuments(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div className="px-4 py-2 bg-gray-50 flex justify-end">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={10} /> Add more
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Request For strip — managers, admins, and EOs (My Allotment mode) */}
          {(userRole === 'manager' || userRole === 'admin' || (isEO && eoMode === 'self')) && (
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <Users size={13} className="text-teal-600" />
                <span className="text-xs font-bold text-gray-700">Request For</span>
              </div>
              {/* Segmented control */}
              <div className="flex rounded-xl border border-gray-200 bg-white p-1 gap-1 shrink-0">
                {([
                  { value: 'SELF', label: 'Self', icon: <User size={12} /> },
                  { value: 'EMPLOYEE', label: 'Another Employee', icon: <UserCheck size={12} /> },
                  { value: 'TP', label: 'Third Party', icon: <UserPlus size={12} /> },
                ] as { value: RequestForType; label: string; icon: React.ReactNode }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setRequestFor(opt.value);
                      if (opt.value === 'EMPLOYEE') { setShowEmployeePicker(true); }
                      if (opt.value === 'TP') { setTpFormDraft({ ...tpInfo }); setShowTPForm(true); }
                    }}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${requestFor === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                  >
                    {opt.icon}{opt.value === 'TP' ? 'Third Party' : opt.label}
                  </button>
                ))}
              </div>

              {/* Employee preview — inline */}
              {requestFor === 'EMPLOYEE' && (
                selectedEmployee ? (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {selectedEmployee.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-blue-900 truncate">{selectedEmployee.name}</div>
                      <div className="text-[10px] text-blue-500">{selectedEmployee.id} · {selectedEmployee.dept}</div>
                    </div>
                    <button onClick={() => setShowEmployeePicker(true)} className="text-[10px] text-blue-600 font-semibold hover:underline shrink-0">Change</button>
                    <button onClick={() => { setSelectedEmployee(null); setRequestFor('SELF'); }} className="p-0.5 text-blue-400 hover:text-blue-600 transition-colors"><X size={12} /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowEmployeePicker(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors">
                    <UserCheck size={13} />Select Employee
                  </button>
                )
              )}

              {/* TP preview — inline */}
              {requestFor === 'TP' && (
                tpInfoConfirmed && tpInfo.name ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {tpInfo.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-amber-900 truncate">{tpInfo.name}</div>
                      <div className="text-[10px] text-amber-600 truncate">{tpInfo.organization}</div>
                    </div>
                    <button onClick={() => { setTpFormDraft({ ...tpInfo }); setShowTPForm(true); }} className="text-[10px] text-amber-700 font-semibold hover:underline shrink-0">Edit</button>
                  </div>
                ) : (
                  <button onClick={() => { setTpFormDraft({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' }); setShowTPForm(true); }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-600 text-xs font-medium hover:bg-amber-50 transition-colors">
                    <UserPlus size={13} />Enter Third Party Details
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* ── Bottom: 2-column search + preferences ── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">

        {/* ── Col A: Available quarters search ── */}
        <div className="flex flex-col border-r border-gray-200 min-h-0 bg-white">
          <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Search size={15} className="text-gray-500" />Available Quarters
                <span className="text-xs font-normal text-gray-400">({modalQuarters.length})</span>
              </h2>
              {/* Filter icon + popup */}
              <div className="relative" ref={modalFilterRef}>
                {(() => {
                  const hasExtendedFilters = modalGroundFloor || modalRecentlyRenovated || !!modalLocationArea.trim() ||
                    modalWesternToilet || modalIndianToilet || modalCarParking || modalPoojaRoom ||
                    modalBalcony || modalKitchenExhaust || modalLiftAccess || modalIndependentHouse || !!modalHousingStyle;
                  const hasAnyFilter = !!(modalBhk || modalFurnishing || modalSortBy) || hasExtendedFilters;
                  return (
                    <>
                      <button
                        onClick={() => setModalFilterOpen(v => !v)}
                        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          hasAnyFilter
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Filter size={13} />
                        Filters
                        {hasAnyFilter && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute -top-0.5 -right-0.5" />
                        )}
                      </button>

                      {modalFilterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 flex flex-col" style={{ maxHeight: '80vh' }}>
                          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                            <div className="text-xs font-bold text-gray-700">Filter Quarters</div>
                          </div>
                          <div className="overflow-y-auto flex-1 p-4 space-y-4">

                            {/* Quarter Type */}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Quarter Type</div>
                              <div className="flex flex-wrap gap-1.5">
                                {(['', ...QUARTER_TYPE_OPTIONS] as string[]).map(v => (
                                  <button key={v} onClick={() => setModalBhk(v)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      modalBhk === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}>
                                    {v || 'Any'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Furnishing */}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Furnishing</div>
                              <div className="flex flex-wrap gap-1.5">
                                {['', 'Furnished', 'Semi-Furnished', 'Unfurnished'].map(v => (
                                  <button key={v} onClick={() => setModalFurnishing(v)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      modalFurnishing === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}>
                                    {v || 'Any'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Location / Area */}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Location (Region) / Area</div>
                              <input
                                value={modalLocationArea}
                                onChange={e => setModalLocationArea(e.target.value)}
                                placeholder="e.g. North Delhi, Sector 5…"
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                              />
                            </div>

                            {/* Housing Style */}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Housing Style</div>
                              <div className="flex flex-wrap gap-1.5">
                                {['', 'Apartment', 'Independent', 'Row House', 'Duplex', 'Studio'].map(v => (
                                  <button key={v} onClick={() => setModalHousingStyle(v)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      modalHousingStyle === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}>
                                    {v || 'Any'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Amenities & Features — toggles */}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenities &amp; Features</div>
                              <div className="flex flex-wrap gap-1.5">
                                {([
                                  { label: 'Ground Floor Access', value: modalGroundFloor, set: setModalGroundFloor },
                                  { label: 'Recently Renovated', value: modalRecentlyRenovated, set: setModalRecentlyRenovated },
                                  { label: 'Western Toilet', value: modalWesternToilet, set: setModalWesternToilet },
                                  { label: 'Indian Toilet', value: modalIndianToilet, set: setModalIndianToilet },
                                  { label: 'Dedicated Car Parking', value: modalCarParking, set: setModalCarParking },
                                  { label: 'Pooja Room', value: modalPoojaRoom, set: setModalPoojaRoom },
                                  { label: 'Sitting Balcony', value: modalBalcony, set: setModalBalcony },
                                  { label: 'Kitchen Exhaust Fan', value: modalKitchenExhaust, set: setModalKitchenExhaust },
                                  { label: 'Lift Required', value: modalLiftAccess, set: setModalLiftAccess },
                                  { label: 'Independent House', value: modalIndependentHouse, set: setModalIndependentHouse },
                                ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => (
                                  <button
                                    key={label}
                                    onClick={() => set(!value)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Sort */}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort by</div>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { value: '', label: 'Default' },
                                  { value: 'rent_asc', label: 'Rent ↑' },
                                  { value: 'rent_desc', label: 'Rent ↓' },
                                ].map(({ value, label }) => (
                                  <button key={value} onClick={() => setModalSortBy(value)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      modalSortBy === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}>
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl shrink-0">
                            <button onClick={() => {
                              setModalBhk(''); setModalFurnishing(''); setModalSortBy('');
                              setModalGroundFloor(false); setModalRecentlyRenovated(false);
                              setModalLocationArea(''); setModalWesternToilet(false);
                              setModalIndianToilet(false); setModalCarParking(false);
                              setModalPoojaRoom(false); setModalBalcony(false);
                              setModalKitchenExhaust(false); setModalLiftAccess(false);
                              setModalIndependentHouse(false); setModalHousingStyle('');
                            }}
                              className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
                              Clear all
                            </button>
                            <button onClick={() => setModalFilterOpen(false)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={modalSearch} onChange={e => setModalSearch(e.target.value)} placeholder="Search by number, block, address…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            {(modalBhk || modalFurnishing || modalSortBy || modalGroundFloor || modalRecentlyRenovated ||
              !!modalLocationArea.trim() || modalWesternToilet || modalIndianToilet || modalCarParking ||
              modalPoojaRoom || modalBalcony || modalKitchenExhaust || modalLiftAccess ||
              modalIndependentHouse || !!modalHousingStyle) && (
              <div className="text-xs text-blue-600 font-medium mt-2">· filters active</div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {modalLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
            ) : modalQuarters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                <Building2 size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No available quarters found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              modalQuarters.map((q, i) => (
                <div key={q.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                  <img
                    src={getImage(q, i)} alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                    title="View quarter details"
                    onClick={e => { e.stopPropagation(); setPreviewQuarterId(q.id); setIsPreviewOpen(true); }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                    <div className="text-xs text-gray-500 truncate">{q.address || `${q.block_name ? `Block ${q.block_name}` : ''}`}</div>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-600 mt-0.5">
                      {q.quarter_type && <span className="font-medium text-gray-700">{q.quarter_type}</span>}
                      {q.block_name && <span>Block {q.block_name}</span>}
                      {q.floor_number != null && <span>Fl. {q.floor_number}</span>}
                      {q.housing_style && <span>{q.housing_style}</span>}
                      <span className="font-semibold text-gray-900">{fmtINR(q.monthly_rent)}</span>
                    </div>
                  </div>
                  <button onClick={() => addPref(q)} disabled={prefs.length >= 5 || !!prefs.find(p => p.quarter.id === q.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                    {prefs.find(p => p.quarter.id === q.id) ? 'Added' : <><Plus size={11} className="inline" /> Add</>}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Col B: My Preferences ── */}
        <div className="flex flex-col min-h-0 bg-gray-50">
          <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Star size={15} className="text-amber-500" />My Preferences
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${prefs.length >= 5 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {prefs.length} / 5
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Reorder using arrows · Priority = rank order</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {prefs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                <Star size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">No preferences yet</p>
                <p className="text-xs mt-1">Add quarters from the middle panel</p>
              </div>
            ) : (
              prefs.map((p, i) => (
                <div key={p.quarter.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
                  <div className="relative shrink-0">
                    <img
                      src={getImage(p.quarter, i)} alt=""
                      className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                      title="View quarter details"
                      onClick={e => { e.stopPropagation(); setPreviewQuarterId(p.quarter.id); setIsPreviewOpen(true); }}
                    />
                    <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shadow">{p.rank}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{p.quarter.quarter_number}</div>
                    <div className="flex items-center flex-wrap gap-x-1.5 text-xs text-gray-500 truncate">
                      {p.quarter.quarter_type && <span>{p.quarter.quarter_type}</span>}
                      {p.quarter.block_name && <span>· Blk {p.quarter.block_name}</span>}
                      {p.quarter.floor_number != null && <span>· Fl. {p.quarter.floor_number}</span>}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{fmtINR(p.quarter.monthly_rent)}/mo</div>
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => movePref(i, 'up')} disabled={i === 0}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100 transition-colors"><ArrowUp size={12} /></button>
                    <button onClick={() => movePref(i, 'down')} disabled={i === prefs.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100 transition-colors"><ArrowDown size={12} /></button>
                    <button onClick={() => removePref(p.quarter.id)}
                      className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>{/* end bottom 2-col grid */}
      </div>{/* end body flex-col */}

      {/* ── Employee Picker popup ─────────────────────── */}
      {showEmployeePicker && (() => {
        const depts = Array.from(new Set(DEMO_EMPLOYEES.map(e => e.dept)));
        const filtered = DEMO_EMPLOYEES.filter(e => {
          const matchDept = !employeeDeptFilter || e.dept === employeeDeptFilter;
          const q = employeeSearch.trim().toLowerCase();
          const matchSearch = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q);
          return matchDept && matchSearch;
        });
        return (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '85vh' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <UserCheck size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">Select Employee</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Request will be raised on behalf of selected employee</p>
                </div>
                <button onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(''); setEmployeeDeptFilter(''); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
              </div>

              {/* Currently selected banner */}
              {selectedEmployee && (
                <div className="mx-4 mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{selectedEmployee.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-blue-900">{selectedEmployee.name}</div>
                    <div className="text-[10px] text-blue-500">{selectedEmployee.id} · {selectedEmployee.dept}</div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shrink-0">Selected</span>
                </div>
              )}

              {/* Search bar */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)}
                    placeholder="Search by name, ID, or designation…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                </div>
              </div>

              {/* Dept filter chips */}
              <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setEmployeeDeptFilter('')}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${!employeeDeptFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
                >All</button>
                {depts.map(d => (
                  <button key={d} onClick={() => setEmployeeDeptFilter(d === employeeDeptFilter ? '' : d)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${employeeDeptFilter === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
                  >{d.replace('Ministry of ', 'Min. ')}</button>
                ))}
              </div>

              {/* Count */}
              <div className="px-4 pb-1.5">
                <span className="text-[10px] text-gray-400 font-medium">{filtered.length} employee{filtered.length !== 1 ? 's' : ''} found</span>
              </div>

              {/* Employee list */}
              <div className="flex-1 overflow-y-auto border-t border-gray-100 divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Search size={24} className="mb-2 opacity-30" />
                    <p className="text-sm">No employees match your search</p>
                  </div>
                ) : filtered.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => { setSelectedEmployee(emp); setRequestFor('EMPLOYEE'); setShowEmployeePicker(false); setEmployeeSearch(''); setEmployeeDeptFilter(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group ${selectedEmployee?.id === emp.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl text-white text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-600' : 'bg-gray-200 text-gray-600 group-hover:bg-blue-500 group-hover:text-white'}`}>
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{emp.name}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{emp.id}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{emp.designation}</div>
                      <div className="text-[10px] text-gray-400 truncate">{emp.dept} · {emp.email}</div>
                    </div>
                    {selectedEmployee?.id === emp.id
                      ? <CheckCircle size={16} className="text-blue-600 shrink-0" />
                      : <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-blue-400 transition-colors shrink-0" />
                    }
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
                <span className="text-xs text-gray-400">Only one employee can be selected</span>
                <button onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(''); setEmployeeDeptFilter(''); }}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40"
                  disabled={!selectedEmployee}>Done</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Allot with Approval: Popup overlay (EO only) ── */}
      {showAllotApprovalPopup && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
              {approvalStage === 'users' && (
                <button onClick={() => setApprovalStage('wfl')} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <GitMerge size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">
                  {approvalStage === 'wfl' ? 'Select Approval Workflow' : 'Select Approvers'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {approvalStage === 'wfl' ? 'Choose a workflow to route this allotment for approval' : 'Pick one or more approvers for this request'}
                </p>
              </div>
              {/* Stage indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${approvalStage === 'wfl' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>1</div>
                <ChevronRight size={12} className="text-gray-300" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${approvalStage === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
              </div>
              <button onClick={() => setShowAllotApprovalPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Stage 1: Workflow Selection */}
            {approvalStage === 'wfl' && (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Approval Workflow
                  </label>
                  {allotApprovalWorkflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <GitMerge size={24} className="mb-2 opacity-30" />
                      <p className="text-sm">No workflows available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allotApprovalWorkflows.map(wfl => {
                        const levelCount = (wfl.levels as { level: number }[]).length;
                        const isSelected = allotApprovalWflId === wfl.id;
                        return (
                          <button
                            key={wfl.id}
                            type="button"
                            onClick={() => setAllotApprovalWflId(wfl.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}`}>
                                  <GitMerge size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{wfl.workflow_name}</p>
                                  {wfl.description && <p className="text-[11px] text-gray-500 mt-0.5">{wfl.description}</p>}
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {levelCount} level{levelCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Approval levels preview */}
                {allotApprovalWflId && (() => {
                  const wfl = allotApprovalWorkflows.find(w => w.id === allotApprovalWflId);
                  if (!wfl) return null;
                  return (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Approval Levels</p>
                      {(wfl.levels as { level: number; approver_title?: string; approver_role?: string }[]).map(lvl => (
                        <div key={lvl.level} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-blue-700">{lvl.level}</span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-800">{lvl.approver_title || 'Approver'}</span>
                            {lvl.approver_role && <span className="ml-1.5 text-[10px] text-gray-400">({lvl.approver_role})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Stage 2: User Selection */}
            {approvalStage === 'users' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Selected users chips */}
                {allotApprovalUsers.length > 0 && (
                  <div className="px-5 pt-3 pb-2 flex flex-wrap gap-1.5 border-b border-gray-100 shrink-0">
                    {allotApprovalUsers.map(uid => {
                      const u = approvalUserList.find(x => x.id === uid);
                      if (!u) return null;
                      return (
                        <span key={uid} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {u.full_name}
                          <button type="button" onClick={() => toggleApprovalUser(uid)} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                            <X size={10} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                {/* Search */}
                <div className="px-5 py-3 shrink-0">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={approvalUserSearch}
                      onChange={e => setApprovalUserSearch(e.target.value)}
                      placeholder="Search by name, department, or employee ID…"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      autoFocus
                    />
                  </div>
                </div>
                {/* User list */}
                <div className="flex-1 overflow-y-auto border-t border-gray-100 divide-y divide-gray-50 min-h-0">
                  {approvalUsersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 bg-gray-50 mx-3 my-1 rounded-lg animate-pulse" />
                    ))
                  ) : filteredApprovalUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <Users size={22} className="mb-2 opacity-30" />
                      <p className="text-sm">No users found</p>
                    </div>
                  ) : filteredApprovalUsers.map(u => {
                    const isSelected = allotApprovalUsers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleApprovalUser(u.id)}
                        className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-50/60 transition-colors text-left ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {u.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{u.govt_department} · {u.govt_employee_id}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                          {isSelected && <CheckCircle size={12} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
              <button
                onClick={() => setShowAllotApprovalPopup(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              {approvalStage === 'wfl' ? (
                <button
                  onClick={() => setApprovalStage('users')}
                  disabled={!allotApprovalWflId}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Users size={14} />Next — Select Approvers
                </button>
              ) : (
                <button
                  onClick={onAllotWithApproval}
                  disabled={allotApprovalUsers.length === 0 || allotApprovalSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {allotApprovalSubmitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Starting…</>
                    : <><PlayCircle size={14} />Initiate Approval</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Allot Now: Quarter Picker overlay (EO only) ── */}
      {showAllotNowPicker && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Zap size={18} className="text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">Select Quarter to Allot Now</h3>
                <p className="text-xs text-gray-400 mt-0.5">Showing available quarters</p>
              </div>
              <button onClick={() => setShowAllotNowPicker(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>

            {allotNowQuarter && (
              <div className="mx-4 mt-3 flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  <Home size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-teal-900">{allotNowQuarter.quarter_number}</div>
                  <div className="text-[10px] text-teal-500">{allotNowQuarter.quarter_type} · {fmtINR(allotNowQuarter.monthly_rent)}/mo</div>
                </div>
                <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full shrink-0">Selected</span>
              </div>
            )}

            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={allotNowSearch} onChange={e => setAllotNowSearch(e.target.value)}
                  placeholder="Search quarter number, block…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" autoFocus />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border-t border-gray-100 divide-y divide-gray-50 px-2 py-1">
              {allotNowLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl m-2 animate-pulse" />)
              ) : allotNowQuarters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Building2 size={24} className="mb-2 opacity-30" />
                  <p className="text-sm">No available quarters found</p>
                </div>
              ) : allotNowQuarters.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => { setAllotNowQuarterId(q.id); setAllotNowQuarter(q); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-teal-50 transition-colors text-left group rounded-xl ${allotNowQuarterId === q.id ? 'bg-teal-50' : ''}`}
                >
                  <img src={getImage(q, i)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{q.quarter_number}</div>
                    <div className="text-xs text-gray-500 truncate">{q.address || (q.block_name ? `Block ${q.block_name}` : '')}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                      {q.quarter_type && <span className="font-medium text-gray-700">{q.quarter_type}</span>}
                      {q.block_name && <span>Blk {q.block_name}</span>}
                      {q.floor_number != null && <span>Fl. {q.floor_number}</span>}
                      <span className="font-semibold text-gray-800">{fmtINR(q.monthly_rent)}/mo</span>
                    </div>
                  </div>
                  {allotNowQuarterId === q.id
                    ? <CheckCircle size={16} className="text-teal-600 shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-teal-400 transition-colors shrink-0" />
                  }
                </button>
              ))}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowAllotNowPicker(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white transition-colors">Cancel</button>
              <button
                onClick={async () => { setShowAllotNowPicker(false); await onAllotNow(); }}
                disabled={!allotNowQuarterId || allotNowSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Zap size={14} />{allotNowSubmitting ? 'Allotting…' : 'Confirm Allot Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TP Info form popup ─────────────────────────── */}
      {showTPForm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <UserPlus size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">Third Party Beneficiary</h3>
                <p className="text-xs text-gray-400 mt-0.5">Enter third-party details</p>
              </div>
              <button onClick={() => { setShowTPForm(false); if (!tpInfoConfirmed) setRequestFor('SELF'); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>

            {/* Manual entry form */}
            {(
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 min-h-0">
                {tpFormDraft.name && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{tpFormDraft.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-amber-900">{tpFormDraft.name}</div>
                      <div className="text-[10px] text-amber-600 truncate">{tpFormDraft.organization}</div>
                    </div>
                    <button onClick={() => setTpFormDraft({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' })} className="p-0.5 text-amber-400 hover:text-amber-600 transition-colors"><X size={12} /></button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input value={tpFormDraft.name} onChange={e => setTpFormDraft(d => ({ ...d, name: e.target.value }))} placeholder="Enter full name"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Organization <span className="text-red-500">*</span></label>
                    <input value={tpFormDraft.organization} onChange={e => setTpFormDraft(d => ({ ...d, organization: e.target.value }))} placeholder="Organization / Ministry / Company"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={tpFormDraft.mobile} onChange={e => setTpFormDraft(d => ({ ...d, mobile: e.target.value }))} placeholder="10-digit mobile"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">PAN # <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                      <CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={tpFormDraft.pan} onChange={e => setTpFormDraft(d => ({ ...d, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F"
                        maxLength={10}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 uppercase" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={tpFormDraft.email} onChange={e => setTpFormDraft(d => ({ ...d, email: e.target.value }))} placeholder="email@example.com"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea value={tpFormDraft.notes} onChange={e => setTpFormDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Any additional info about this third party…" rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
              <button onClick={() => { setShowTPForm(false); if (!tpInfoConfirmed) setRequestFor('SELF'); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white transition-colors">Cancel</button>
              <button
                onClick={() => {
                  if (!tpFormDraft.name.trim() || !tpFormDraft.organization.trim() || !tpFormDraft.mobile.trim() || !tpFormDraft.email.trim()) {
                    addToast('Please fill in all required fields', 'warning'); return;
                  }
                  setTpInfo({ ...tpFormDraft });
                  setTpInfoConfirmed(true);
                  setRequestFor('TP');
                  setShowTPForm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
                <CheckCircle size={14} />Confirm Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default NewRequestModal;
