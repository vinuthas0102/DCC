import React, { Suspense, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Home, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, FileText, CheckCircle, Clock, XCircle,
  Trash2, Search, Star, X, Eye, Send,
  Bed, Ruler, AlertCircle, Building2, CalendarDays, Upload,
  ThumbsUp, ThumbsDown, ArrowRightCircle, RefreshCw, LogOut,
  MapPin, Layers, IndianRupee, Wrench, Filter, MoreVertical,
  Images, Bell, Users, Paperclip, User, UserCheck, UserPlus, Phone, Mail, CreditCard,
  ArrowLeft, ExternalLink, ShieldCheck, UserCog,
  GitMerge, Key, ClipboardList, PlayCircle, CheckSquare, MessageSquare,
  HardHat, ClipboardCheck, Download, Zap, ListFilter, Lock, CheckCircle2, Check, Loader2, AlertTriangle,
} from 'lucide-react';
import { PhotoLightbox } from '../components/ui/PhotoGallery';
import SplitLayout from '../components/ui/SplitLayout';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { DocUpload } from '../components/ui/DocUpload';
import { QuarterDetailCard } from '../components/quarters/QuarterDetailCard';
import { QuarterListCard } from '../components/quarters/QuarterListCard';
const QuarterDetailModal = React.lazy(() => import('../components/quarters/QuarterDetailModal').then(m => ({ default: m.QuarterDetailModal })));
const QuarterOverrideModal = React.lazy(() => import('../components/quarters/QuarterOverrideModal').then(m => ({ default: m.QuarterOverrideModal })));
import {
  quartersService,
  Quarter,
  QuarterRequest,
  QuarterAllotmentCycle,
  QuarterTenantRequest,
  QuarterServiceChat,
  QuarterAllotmentChat,
  QuarterAllotment,
  QuarterApprovalWorkflow,
  QuarterAllotmentApproval,
  QuarterApprovalChat,
  QuarterRequestApproval,
  QuarterRequestApprovalChat,
  QuarterInspection,
  QuarterInspectionChat,
  QuarterHandover,
  QuarterGuestInfo,
  CreateTenantRequestInput,
} from '../services/quartersService';
import { supabase } from '../lib/supabase';
import type { MedicalCriticality } from '../types/quarters';
import { LogDetailsModal, type LogEntry } from '../components/ui/LogDetailsModal';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROUTES } from '../constants/routes';
import { DEMO_MODE, DEMO_REQUESTS, DEMO_TENANT_REQUESTS, DEMO_CYCLE, DEMO_EMPLOYEES, DEMO_TP_PROFILES, DEMO_WORKFLOWS, DEMO_ALLOCATED_CYCLES, DEMO_UNAPPROVED_CYCLES } from '../mocks/demoData';
import {
  PLACEHOLDER_IMAGES, getImage, resolveAllImages,
  fmtINR, fmtDate, statusAccentColor,
  statusConfig, tenantStatusConfig, serviceTypeConfig,
  isAllottedStatus, isOccupiedStatus, isAcceptedStatus,
  getRequestForBadgeCls, getRequestForLabel,
  ChatBubble, CompactQuarterRow, QuarterSummaryPanel, RequestSummaryBlock,
} from '../components/quarters/quarterShared';
const EOActionPanel = React.lazy(() => import('../components/quarters/EOActionPanel').then(m => ({ default: m.EOActionPanel })));
const RightPanelAllotted = React.lazy(() => import('../components/quarters/EmployeeRightPanels').then(m => ({ default: m.RightPanelAllotted })));
const RightPanelOccupied = React.lazy(() => import('../components/quarters/EmployeeRightPanels').then(m => ({ default: m.RightPanelOccupied })));
const RightPanelDraft = React.lazy(() => import('../components/quarters/EmployeeRightPanels').then(m => ({ default: m.RightPanelDraft })));
const RightPanelPreferences = React.lazy(() => import('../components/quarters/EmployeeRightPanels').then(m => ({ default: m.RightPanelPreferences })));
const RightPanelSubmitted = React.lazy(() => import('../components/quarters/EmployeeRightPanels').then(m => ({ default: m.RightPanelSubmitted })));
import { DeclineAllotmentModal } from '../components/quarters/DeclineAllotmentModal';
import { AcceptAllotmentModal } from '../components/quarters/AcceptAllotmentModal';
import { ActionPopupModal } from '../components/quarters/ActionPopupModal';
import { InspectionFormModal } from '../components/quarters/InspectionFormModal';
import { buildDefaultChecklist } from '../constants/inspectionChecklist';
import { downloadPageAsHtml } from '../utils/downloadHtml';
import { QUARTER_TYPE_OPTIONS } from '../utils/quarterDisplay';
const NewRequestModal = React.lazy(() => import('../components/quarters/NewRequestModal').then(m => ({ default: m.NewRequestModal })));
import type { UploadedDoc } from '../components/quarters/NewRequestModal';
import { UpgradeRequestModal } from '../components/quarters/UpgradeRequestModal';
import { ExchangeRequestModal } from '../components/quarters/ExchangeRequestModal';
import { AddQuarterModal } from '../components/quarters/AddQuarterModal';
import type {
  DPFilter, PrefItem, NewRequestForm, StatusCard,
  ActionPopupType, ActionPopupState, RequestForType,
  DemoEmployee, TPInfo, EOMode, EORightMode, RightAction,
} from '../types/quarterRequests';
import { useQuarterRequestsState } from '../hooks/useQuarterRequestsState';
import { useQuarterRequestsData } from '../hooks/useQuarterRequestsData';
import { useQuarterRequestsEffects } from '../hooks/useQuarterRequestsEffects';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getRequestTypeBadge(rt: string) {
  if (rt === 'MEDICAL')   return { cls: 'bg-red-50 text-red-700 border-red-200',    label: 'Medical' };
  if (rt === 'REFERENCE') return { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Reference' };
  return { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: 'General' };
}

const DP_LABELS: Record<DPFilter, string> = {
  all: 'All Requests',
  draft: 'Draft Requests',
  submitted: 'Submitted',
  allotted: 'Allotted',
  allocated_em: 'Allocated',
  unapproved: 'Unapproved Allotment',
  accepted: 'Accepted',
  occupied: 'Occupied',
  tenantServices: 'Tenant Services',
  availableQuarters: 'Available Quarters',
  declined: 'Declined',
};

const DEFAULT_FORM: NewRequestForm = {
  request_reason: '',
  preferred_location: '',
  move_in_date: '',
  employee_notes: '',
  request_type: 'GENERAL',
};

// ─── component ────────────────────────────────────────────────────────────────

export const QuarterRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const {
    requests, setRequests, tenantRequests, setTenantRequests,
    selectedRequest, setSelectedRequest, activeCycle, setActiveCycle,
    loading, setLoading, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter,
    allotNowSubmitting, setAllotNowSubmitting, showAllotNowPicker, setShowAllotNowPicker,
    allotNowSearch, setAllotNowSearch, allotNowQuarters, setAllotNowQuarters,
    allotNowLoading, setAllotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest,
    showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, setManualAllotQuarters, manualAllotLoading, setManualAllotLoading,
    manualAllotSubmitting, setManualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes,
    eoTrSubmitting, setEoTrSubmitting, svcMenuOpenId, setSvcMenuOpenId,
    showRunAllocationPopup, setShowRunAllocationPopup, runAllocSubmitting, setRunAllocSubmitting,
    runAllocCycleName, setRunAllocCycleName, runAllocStart, setRunAllocStart,
    runAllocEnd, setRunAllocEnd,
    runAllocCycleTime, setRunAllocCycleTime,
    runAllocLastDate, setRunAllocLastDate,
    runAllocCurrentDate, setRunAllocCurrentDate,
    runAllocGrade, setRunAllocGrade,
    runAllocQuarterType, setRunAllocQuarterType,
    runAllocMedical, setRunAllocMedical,
    runAllocWorkflowId, setRunAllocWorkflowId,
    runAllocApproverUsers, setRunAllocApproverUsers,
    runAllocPickingLevel, setRunAllocPickingLevel,
    runAllocUserSearch, setRunAllocUserSearch,
    showCycleHistory, setShowCycleHistory,
    cycleHistoryList, setCycleHistoryList, cycleHistoryLoading, setCycleHistoryLoading,
    selectedCycleDetail, setSelectedCycleDetail, cycleDetailRequests, setCycleDetailRequests,
    cycleDetailLoading, setCycleDetailLoading,
    approvalRecord, setApprovalRecord, approvalChats, setApprovalChats,
    approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel,
    approvalSubmitting, setApprovalSubmitting,
    requestApprovalRecord, setRequestApprovalRecord,
    requestApprovalChats, setRequestApprovalChats,
    requestApprovalAction, setRequestApprovalAction,
    requestApprovalRemarks, setRequestApprovalRemarks,
    requestApprovalTargetLevel, setRequestApprovalTargetLevel,
    requestApprovalSubmitting, setRequestApprovalSubmitting,
    requestApprovalWorkflows, setRequestApprovalWorkflows,
    initiatingRequestApproval, setInitiatingRequestApproval,
    initiatingAllotmentApproval, setInitiatingAllotmentApproval,
    savingAllotmentWorkflow, setSavingAllotmentWorkflow,
    inspections, setInspections, inspectionChats, setInspectionChats,
    selectedInspectionId, setSelectedInspectionId, inspectionPanel, setInspectionPanel,
    inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionInspectorName, setInspectionInspectorName,
    inspectionInitialCondition, setInspectionInitialCondition,
    inspectionChecklist, setInspectionChecklist,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile,
    inspectionSubmitting, setInspectionSubmitting, inspectionChatMode, setInspectionChatMode,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, setHandover,
    handoverKeyNo, setHandoverKeyNo, handoverRemarks, setHandoverRemarks,
    handoverDeadline, setHandoverDeadline, handoverInteriorFile, setHandoverInteriorFile,
    handoverReportFile, setHandoverReportFile, handoverSubmitting, setHandoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, setGuestInfoList,
    guestInfoLoading, setGuestInfoLoading, guestForm, setGuestForm,
    guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting, setGuestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason,
    eoRejectSubmitting, setEoRejectSubmitting,
    rejectModalReqId, setRejectModalReqId, rejectModalReason, setRejectModalReason,
    rejectModalDocFile, setRejectModalDocFile, rejectModalSubmitting, setRejectModalSubmitting,
    dpFilter, setDpFilter, dpScrollRef, dpCanScrollLeft, setDpCanScrollLeft,
    dpCanScrollRight, setDpCanScrollRight, requestDocUrls, setRequestDocUrls,
    medDocFile, setMedDocFile, medDocSubmitting, setMedDocSubmitting,
    showNewModal, setShowNewModal, form, setForm, prefs, setPrefs,
    requestDocuments, setRequestDocuments, modalQuarters, setModalQuarters,
    modalSearch, setModalSearch, modalLoading, setModalLoading, submitting, setSubmitting,
    modalFilterOpen, setModalFilterOpen, modalBhk, setModalBhk,
    modalFurnishing, setModalFurnishing, modalSortBy, setModalSortBy,
    modalGroundFloor, setModalGroundFloor, modalRecentlyRenovated, setModalRecentlyRenovated,
    modalLocationArea, setModalLocationArea, modalWesternToilet, setModalWesternToilet,
    modalIndianToilet, setModalIndianToilet, modalCarParking, setModalCarParking,
    modalPoojaRoom, setModalPoojaRoom, modalBalcony, setModalBalcony,
    modalKitchenExhaust, setModalKitchenExhaust, modalLiftAccess, setModalLiftAccess,
    modalIndependentHouse, setModalIndependentHouse, modalHousingStyle, setModalHousingStyle,
    modalFilterRef, declineModalReqId, setDeclineModalReqId,
    declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting, setDeclineModalSubmitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee,
    tpInfo, setTpInfo, tpInfoConfirmed, setTpInfoConfirmed,
    showEmployeePicker, setShowEmployeePicker, showTPForm, setShowTPForm,
    employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    detailRequest, setDetailRequest, detailReturnFilter, setDetailReturnFilter,
    reqSearch, setReqSearch, reqSort, setReqSort, reqBhkFilter, setReqBhkFilter,
    reqToiletFilter, setReqToiletFilter, reqFloorFilter, setReqFloorFilter,
    filterDrawerOpen, setFilterDrawerOpen,
    reqHousingStyleFilter, setReqHousingStyleFilter,
    reqRequestTypeFilter, setReqRequestTypeFilter,
    reqLocationFilter, setReqLocationFilter,
    reqDateFrom, setReqDateFrom,
    reqDateTo, setReqDateTo,
    reqGradeFilter, setReqGradeFilter,
    reqApprovalStatusFilter, setReqApprovalStatusFilter,
    reqOccupancyStatusFilter, setReqOccupancyStatusFilter,
    reqOccupiedDateFrom, setReqOccupiedDateFrom,
    reqOccupiedDateTo, setReqOccupiedDateTo,
    reqDeclinedDateFrom, setReqDeclinedDateFrom,
    reqDeclinedDateTo, setReqDeclinedDateTo,
    reqUnitNumberFilter, setReqUnitNumberFilter,
    selectedPrefQuarter, setSelectedPrefQuarter,
    rightAction, setRightAction, actionRemarks, setActionRemarks,
    actionReason, setActionReason, actionDocUrl, setActionDocUrl,
    actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting, setActionSubmitting,
    acceptCardId, setAcceptCardId, acceptCardRemarks, setAcceptCardRemarks,
    acceptCardSubmitting, setAcceptCardSubmitting,
    inspectTarget, setInspectTarget, inspectRemarks, setInspectRemarks,
    inspectInspectorName, setInspectInspectorName, inspectCondition, setInspectCondition,
    inspectChecklist, setInspectChecklist, inspectSubmitting, setInspectSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting, setChatSubmitting,
    serviceChatMode, setServiceChatMode,
    allotmentChats, setAllotmentChats, allotmentChatMessage, setAllotmentChatMessage,
    allotmentChatFile, setAllotmentChatFile, allotmentChatSubmitting, setAllotmentChatSubmitting,
    allotmentChatMode, setAllotmentChatMode,
    availableQuarters, setAvailableQuarters, availableQuartersLoading, setAvailableQuartersLoading,
    avqSearch, setAvqSearch, avqBhkFilter, setAvqBhkFilter,
    avqFloorFilter, setAvqFloorFilter,
    avqGroundFloor, setAvqGroundFloor,
    avqRecentlyRenovated, setAvqRecentlyRenovated,
    avqLocationArea, setAvqLocationArea,
    avqWesternToilet, setAvqWesternToilet,
    avqIndianToilet, setAvqIndianToilet,
    avqCarParking, setAvqCarParking,
    avqPoojaRoom, setAvqPoojaRoom,
    avqBalcony, setAvqBalcony,
    avqKitchenExhaust, setAvqKitchenExhaust,
    avqLiftAccess, setAvqLiftAccess,
    avqHousingStyle, setAvqHousingStyle,
    avqFilterDrawerOpen, setAvqFilterDrawerOpen, avqDetailQuarterId, setAvqDetailQuarterId,
    avqMenuId, setAvqMenuId, avqMenuPos, setAvqMenuPos, avqMenuRef,
    showNewQuarterModal, setShowNewQuarterModal,
    newQuarterSubmitting, setNewQuarterSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos, menuRef,
    expandedCardId, setExpandedCardId, chatOpenForId, setChatOpenForId,
    expandedSvcsCardId, setExpandedSvcsCardId, expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting, setPopupSubmitting,
    popupInspectorName, setPopupInspectorName, popupOpeningRemarks, setPopupOpeningRemarks,
    popupChecklist, setPopupChecklist, popupCondition, setPopupCondition,
    popupKeyNumber, setPopupKeyNumber, popupHandoverDeadline, setPopupHandoverDeadline,
    popupHandoverInteriorFile, setPopupHandoverInteriorFile,
    popupHandoverReportFile, setPopupHandoverReportFile,
    popupRetentionReason, setPopupRetentionReason, popupRequestedMonths, setPopupRequestedMonths,
    vacateDesignationName, setVacateDesignationName,
    showUpgradeModal, setShowUpgradeModal,
    upgradeModalQuarters, setUpgradeModalQuarters, upgradeModalLoading, setUpgradeModalLoading,
    showAllotApprovalPopup, setShowAllotApprovalPopup,
    allotApprovalWflId, setAllotApprovalWflId,
    allotApprovalUsers, setAllotApprovalUsers,
    allotApprovalSubmitting, setAllotApprovalSubmitting,
    allotApprovalRequestId, setAllotApprovalRequestId,
    showAllocatedWFLPopup, setShowAllocatedWFLPopup,
    allocWFLSelectedCycleId, setAllocWFLSelectedCycleId,
    allocWFLWorkflowId, setAllocWFLWorkflowId,
    allocWFLApproverUsers, setAllocWFLApproverUsers,
    allocWFLPickingLevel, setAllocWFLPickingLevel,
    allocWFLUserSearch, setAllocWFLUserSearch,
    allocWFLAvailableUsers, setAllocWFLAvailableUsers,
    allocWFLSubmitting, setAllocWFLSubmitting,
    allocWFLSuccess, setAllocWFLSuccess,
    showUnapprovedWFLPopup, setShowUnapprovedWFLPopup,
    unapprWFLSelectedCycleId, setUnapprWFLSelectedCycleId,
    unapprWFLInitiating, setUnapprWFLInitiating,
    unapprWFLInitiatedCycles, setUnapprWFLInitiatedCycles,
    unapprWFLLockedCycles, setUnapprWFLLockedCycles,
    unapprWFLLocking, setUnapprWFLLocking,
  } = useQuarterRequestsState();

  // ── Log Details modal ───────────────────────────────────────────────────────
  const [logModal, setLogModal] = useState<{ title: string; subtitle?: string } | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // ── Run Allocation: available users pool ─────────────────────────────────────
  type AllocUser = { id: string; full_name: string; govt_employee_id: string; email: string; govt_department: string };
  const [runAllocAvailableUsers, setRunAllocAvailableUsers] = useState<AllocUser[]>([]);
  const [runAllocUsersLoading, setRunAllocUsersLoading] = useState(false);

  const isEO = user?.role === 'manager';

  // ─── Data-loading callbacks + data effects ────────────────────────────────
  const { loadData, loadGuestInfo, updateDpScrollState } =
    useQuarterRequestsData(
      { setRequests, setActiveCycle, setTenantRequests, setDpFilter, setLoading, addToast, isEO, eoMode, user: user ?? null },
      {
        setModalLoading, setModalQuarters, addToast, prefs, showNewModal,
        modalSearch, modalBhk, modalFurnishing, modalSortBy,
        modalGroundFloor, modalRecentlyRenovated, modalLocationArea,
        modalWesternToilet, modalIndianToilet, modalCarParking,
        modalPoojaRoom, modalBalcony, modalKitchenExhaust,
        modalLiftAccess, modalIndependentHouse, modalHousingStyle,
      },
      { setAllotNowLoading, setAllotNowQuarters, addToast, showAllotNowPicker, allotNowSearch, user: user ?? null, form },
      { setManualAllotLoading, setManualAllotQuarters, addToast, manualAllotPickerOpen, manualAllotSearch },
      { setGuestInfoLoading, setGuestInfoList, allotmentId: selectedRequest?.allotment?.id, showGuestInfoPopup },
      { dpScrollRef, setDpCanScrollLeft, setDpCanScrollRight, eoMode },
      { setAvailableQuarters, setAvailableQuartersLoading },
      {
        selectedAllotmentId: selectedRequest?.allotment?.id,
        selectedRequestId: selectedRequest?.id,
        selectedRequestStatus: selectedRequest?.request_status,
        isEO, eoMode,
        setApprovalRecord, setApprovalChats,
        setRequestApprovalRecord, setRequestApprovalChats, setRequestApprovalWorkflows,
      },
      {
        selectedAllotmentId: selectedRequest?.allotment?.id,
        selectedInspectionId,
        isEO, eoMode,
        setInspections, setInspectionChats,
      },
      {
        selectedAllotmentId: selectedRequest?.allotment?.id,
        isEO, eoMode,
        setHandover,
      },
      {
        selectedServiceId,
        selectedRequestId: selectedRequest?.id,
        selectedRequestAllotmentId: selectedRequest?.allotment?.id,
        selectedRequestStatus: selectedRequest?.request_status,
        setServiceChats,
        setAllotmentChats,
      },
      {
        expandedCardId,
        requestDocUrls,
        setRequestDocUrls,
      },
    );

  // ─── UI / interaction effects ─────────────────────────────────────────────
  useQuarterRequestsEffects(
    { menuRef, setOpenMenuId, setMenuPos },
    { avqMenuRef, setAvqMenuId, setAvqMenuPos },
    { modalFilterOpen, modalFilterRef, setModalFilterOpen },
    { dpScrollRef, dpFilter, updateDpScrollState, eoMode },
    {
      selectedRequestId: selectedRequest?.id,
      selectedRequestStatus: selectedRequest?.request_status,
      selectedAllotmentApprovalStatus: selectedRequest?.allotment?.approval_status,
      dpFilter,
      isEO,
      setEoRightMode, setApprovalAction, setApprovalRemarks,
      setInspectionPanel, setSelectedInspectionId,
      setEoRejectReason, setEoTrId, setEoTrAction, setEoTrNotes,
    },
    {
      selectedRequestId: selectedRequest?.id,
      selectedRequestPreferences: selectedRequest?.preferences,
      setSelectedPrefQuarter,
    },
    { setPrefs, setShowNewModal },
  );


  // Fetch employee users when the run allocation popup opens
  useEffect(() => {
    if (!showRunAllocationPopup) return;
    setRunAllocUsersLoading(true);
    quartersService.getEmployeeUsers()
      .then(users => setRunAllocAvailableUsers(users as AllocUser[]))
      .catch(() => {})
      .finally(() => setRunAllocUsersLoading(false));
  }, [showRunAllocationPopup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset approver map when workflow selection changes
  useEffect(() => {
    setRunAllocApproverUsers({});
    setRunAllocPickingLevel(null);
    setRunAllocUserSearch('');
  }, [runAllocWorkflowId]); // eslint-disable-line react-hooks/exhaustive-deps

  function openMenu(e: React.MouseEvent, reqId: string) {
    e.stopPropagation();
    if (openMenuId === reqId) { setOpenMenuId(null); setMenuPos(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = dpFilter === 'allocated_em' ? 180
      : dpFilter === 'allotted' ? (isEO && eoMode === 'employee' ? 180 : 70)
      : dpFilter === 'accepted' ? 120 : 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    // Always prefer below; only go above if genuinely not enough space AND there's room above
    const fitsBelow = spaceBelow >= menuHeight + 8;
    const fitsAbove = rect.top >= menuHeight + 8;
    const top = fitsBelow ? rect.bottom + 4
      : fitsAbove ? rect.top - menuHeight - 4
      : rect.bottom + 4; // fallback: below with scroll
    setMenuPos({ top, left: rect.right - 210 });
    setOpenMenuId(reqId);
  }

  function openAvqMenu(e: React.MouseEvent, quarterId: string) {
    e.stopPropagation();
    if (avqMenuId === quarterId) { setAvqMenuId(null); setAvqMenuPos(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 60;
    const top = spaceBelow > menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setAvqMenuPos({ top, left: rect.right - 200 });
    setAvqMenuId(quarterId);
  }

  function resetActionForm() {
    setRightAction(null); setActionRemarks(''); setActionReason('');
    setActionDocUrl(null); setActionDate(''); setActionBhk('');
  }

  // ─── Exchange Request Modal ────────────────────────────────────────────────

  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [exchangeWorkflows, setExchangeWorkflows] = useState<import('../types/quarters').QuarterApprovalWorkflow[]>([]);
  const [critSavingId, setCritSavingId] = useState<string | null>(null);

  const openExchangeModal = async () => {
    setShowExchangeModal(true);
    try {
      const wfs = await quartersService.getApprovalWorkflows();
      setExchangeWorkflows(wfs);
    } catch { setExchangeWorkflows([]); }
  };

  const handleExchangeSubmit = async (data: {
    partnerQuarterNumber: string;
    reason: string;
    remarks: string;
    docFile: File | null;
    workflowId: string | null;
  }) => {
    if (!user || !selectedRequest?.allotment) return;
    setExchangeSubmitting(true);
    try {
      let docUrl = '';
      if (data.docFile) {
        const url = await uploadChatFile(data.docFile, `exchange-requests/${selectedRequest.allotment.id}`);
        if (url) docUrl = url;
      }
      const tr = await quartersService.createTenantRequest(user.id, selectedRequest.allotment.id, {
        service_type: 'EXCHANGE',
        reason: data.reason,
        remarks: data.remarks,
        document_url: docUrl || undefined,
      });
      await quartersService.createExchangePair(
        tr.id,
        data.partnerQuarterNumber,
        docUrl,
        data.workflowId,
      );
      addToast('Exchange request submitted successfully', 'success');
      setShowExchangeModal(false);
      loadData();
    } catch { addToast('Failed to submit exchange request', 'error'); } finally { setExchangeSubmitting(false); }
  };

  // ─── Upgrade Request Modal ─────────────────────────────────────────────────

  const openUpgradeModal = async () => {
    setShowUpgradeModal(true);
    setUpgradeModalLoading(true);
    try {
      const quarters = await quartersService.getQuarters({ occupancy_status: 'AVAILABLE' });
      setUpgradeModalQuarters(quarters);
    } catch {
      setUpgradeModalQuarters([]);
    } finally {
      setUpgradeModalLoading(false);
    }
  };

  const handleUpgradeSubmit = async (input: {
    reason: string; remarks: string; required_bhk_config: string; move_in_date: string;
    document_url?: string; upgrade_mode: 'AUTO' | 'SELECTED'; target_quarter_id: string | null;
  }) => {
    if (!user || !selectedRequest?.allotment) return;
    await quartersService.createTenantRequest(user.id, selectedRequest.allotment.id, {
      service_type: 'UPGRADE',
      reason: input.reason,
      remarks: input.remarks,
      document_url: input.document_url,
      required_bhk_config: input.required_bhk_config || undefined,
      upgrade_mode: input.upgrade_mode,
      target_quarter_id: input.target_quarter_id,
    });
    addToast('Upgrade request submitted successfully', 'success');
    setShowUpgradeModal(false);
    loadData();
  };

  // ─── shared file-upload helper ──────────────────────────────────────────────

  const uploadChatFile = async (file: File, pathPrefix: string): Promise<string | null> => {
    if (DEMO_MODE) return Promise.resolve(null);
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${pathPrefix}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('quarter-docs').upload(path, file);
    if (error) return null;
    const { data: pub } = supabase.storage.from('quarter-docs').getPublicUrl(path);
    return pub?.publicUrl ?? null;
  };

  // ─── service chat handlers ──────────────────────────────────────────────────

  const handleSendChat = async () => {
    if (!user || !selectedServiceId || !chatMessage.trim()) return;
    setChatSubmitting(true);
    try {
      const docUrls: string[] = [];
      if (chatAttachFile) {
        const url = await uploadChatFile(chatAttachFile, `service-chats/${selectedServiceId}`);
        if (url) docUrls.push(url);
      }
      await quartersService.addServiceChat(selectedServiceId, user.id, 'EMPLOYEE', chatMessage, docUrls, serviceChatMode);
      setChatMessage('');
      setChatAttachFile(null);
      const chats = await quartersService.getServiceChats(selectedServiceId);
      setServiceChats(prev => ({ ...prev, [selectedServiceId!]: chats }));
    } catch { addToast('Failed to send message', 'error'); } finally { setChatSubmitting(false); }
  };

  const handleSendAllotmentChat = async (authorRole?: string) => {
    if (!user || !selectedRequest || !allotmentChatMessage.trim()) return;
    const allotmentId = selectedRequest.allotment?.id ?? selectedRequest.id;
    const role = authorRole ?? (isEO && eoMode === 'employee' ? 'eo' : 'employee');
    setAllotmentChatSubmitting(true);
    try {
      const docUrls: string[] = [];
      if (allotmentChatFile) {
        const url = await uploadChatFile(allotmentChatFile, `allotment-chats/${allotmentId}`);
        if (url) docUrls.push(url);
      }
      await quartersService.addAllotmentChat(allotmentId, user.id, role, allotmentChatMessage, docUrls, allotmentChatMode);
      setAllotmentChatMessage('');
      setAllotmentChatFile(null);
      const chats = await quartersService.getAllotmentChats(allotmentId);
      setAllotmentChats(prev => ({ ...prev, [allotmentId]: chats }));
    } catch { addToast('Failed to send message', 'error'); } finally { setAllotmentChatSubmitting(false); }
  };

  const handleCloseService = async () => {
    if (!selectedServiceId || !selectedRequest) return;
    if (!window.confirm('Close this service request?')) return;
    const svc = tenantRequests.find(tr => tr.id === selectedServiceId);
    if (!svc) return;
    try {
      await quartersService.closeService(selectedServiceId, selectedRequest.id, svc.service_type);
      setSelectedServiceId(null);
      addToast('Service closed', 'success');
      loadData();
    } catch { addToast('Failed to close service', 'error'); }
  };


  function openActionPopup(type: ActionPopupType, requestId: string, allotmentId: string) {
    setActionPopup({ type, requestId, allotmentId });
    setPopupReason(''); setPopupRemarks(''); setPopupDocUrl(null);
    setPopupDate(''); setPopupSubject(''); setPopupUrgency('NORMAL');
    setPopupInspectorName(''); setPopupCondition(''); setPopupKeyNumber(''); setPopupHandoverDeadline('');
    setPopupRetentionReason('On retirement'); setPopupRequestedMonths(2);

    if (type === 'VACATE' && user?.designationId) {
      quartersService.getDesignationName(user.designationId).then(name => {
        setVacateDesignationName(name);
      }).catch(() => {});
    }
  }

  function closeActionPopup() {
    setActionPopup({ type: null, requestId: '', allotmentId: '' });
    setPopupHandoverInteriorFile(null);
    setPopupHandoverReportFile(null);
  }



  // ─── log details helper ─────────────────────────────────────────────────────

  const openQuarterLog = async (req: QuarterRequest) => {
    const quarterLabel = req.allotment?.quarter?.quarter_number ?? req.request_number;
    setLogModal({ title: `Activity Log — ${req.request_number}`, subtitle: quarterLabel });
    setLogLoading(true);
    setLogEntries([]);
    try {
      const entries: LogEntry[] = [];
      entries.push({
        id: `req-created-${req.id}`,
        timestamp: req.created_at,
        actorRole: 'employee',
        message: `Request submitted (${req.request_type ?? 'ALLOTMENT'})`,
        tag: req.request_status,
        tagColor: 'gray',
      });
      // Allotment-level chats
      if (req.allotment?.id) {
        const allotChats = await quartersService.getAllotmentChats(req.allotment.id).catch(() => []);
        for (const c of allotChats) {
          entries.push({ id: c.id, timestamp: c.created_at, actorRole: c.author_role, message: c.message, documentUrls: c.document_urls });
        }
        // Service chats
        const svcChatsAll = await quartersService.getServiceChatsForAllotment(req.allotment.id).catch(() => []);
        for (const c of svcChatsAll) {
          entries.push({ id: c.id, timestamp: c.created_at, actorRole: c.author_role, message: c.message, documentUrls: c.document_urls });
        }
        // Inspections
        const inspections = await quartersService.getInspections(req.allotment.id).catch(() => []);
        for (const insp of inspections) {
          entries.push({ id: `insp-${insp.id}`, timestamp: insp.created_at, actorRole: 'EO', message: `Inspection conducted by ${insp.inspector_name ?? 'EO'} — ${insp.condition ?? ''}`, tag: 'INSPECTION', tagColor: 'sky' });
        }
        // Handover
        const handover = await quartersService.getHandover(req.allotment.id).catch(() => null);
        if (handover) {
          entries.push({ id: `hnd-${handover.id}`, timestamp: handover.created_at, actorRole: 'EO', message: `Handover recorded. Key: ${handover.key_number ?? '—'}`, tag: 'HANDOVER', tagColor: 'emerald' });
        }
      }
      entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setLogEntries(entries);
    } catch { /* silently ignore */ }
    finally { setLogLoading(false); }
  };

  // ─── pref list helpers ──────────────────────────────────────────────────────

  const addPref = (q: Quarter) => {
    if (prefs.length >= 5) { addToast('Maximum 5 preferences allowed', 'warning'); return; }
    if (prefs.find(p => p.quarter.id === q.id)) return;
    setPrefs(prev => [...prev, { quarter: q, rank: prev.length + 1 }]);
  };

  const removePref = (quarterId: string) => {
    setPrefs(prev => prev.filter(p => p.quarter.id !== quarterId).map((p, i) => ({ ...p, rank: i + 1 })));
  };

  const movePref = (idx: number, dir: 'up' | 'down') => {
    setPrefs(prev => {
      const arr = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((p, i) => ({ ...p, rank: i + 1 }));
    });
  };

  const openNewModal = (req?: QuarterRequest) => {
    if (req) {
      setForm({
        request_reason: req.request_reason, required_bhk_config: req.required_bhk_config,
        preferred_location: req.preferred_location, move_in_date: req.move_in_date ?? '',
        family_member_count: req.family_member_count, employee_notes: req.employee_notes,
      });
      const existing = req.preferences?.map(p => ({ quarter: p.quarter as Quarter, rank: p.preference_rank })) ?? [];
      setPrefs(existing.sort((a, b) => a.rank - b.rank));
      // Restore request_for state from existing request
      const rf = (req.request_for ?? 'SELF') as RequestForType;
      setRequestFor(rf);
      if (rf === 'EMPLOYEE' && req.on_behalf_employee_id) {
        const emp = DEMO_EMPLOYEES.find(e => e.id === req.on_behalf_employee_id);
        setSelectedEmployee(emp ?? { id: req.on_behalf_employee_id, name: req.on_behalf_employee_name ?? '', dept: req.on_behalf_employee_dept ?? '', email: '', designation: '' });
      } else {
        setSelectedEmployee(null);
      }
      if (rf === 'TP') {
        const tp: TPInfo = { name: req.tp_name ?? '', organization: req.tp_organization ?? '', mobile: req.tp_mobile ?? '', email: req.tp_email ?? '', pan: req.tp_pan ?? '', notes: req.tp_notes ?? '' };
        setTpInfo(tp);
        setTpFormDraft(tp);
        setTpInfoConfirmed(true);
      } else {
        setTpInfo({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' });
        setTpInfoConfirmed(false);
      }
    } else {
      setForm(DEFAULT_FORM);
      setPrefs([]);
      setRequestFor('SELF');
      setSelectedEmployee(null);
      setTpInfo({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' });
      setTpInfoConfirmed(false);
    }
    setEmployeeSearch('');
    setModalSearch('');
    setModalBhk('');
    setModalFurnishing('');
    setModalSortBy('');
    setModalFilterOpen(false);
    setShowNewModal(true);
  };

  // ─── submit handlers ────────────────────────────────────────────────────────

  function buildRequestForPayload() {
    if (requestFor === 'EMPLOYEE' && selectedEmployee) {
      return {
        request_for: 'EMPLOYEE' as const,
        on_behalf_employee_id: selectedEmployee.id,
        on_behalf_employee_name: selectedEmployee.name,
        on_behalf_employee_dept: selectedEmployee.dept,
      };
    }
    if (requestFor === 'TP' && tpInfoConfirmed) {
      return {
        request_for: 'TP' as const,
        tp_name: tpInfo.name,
        tp_organization: tpInfo.organization,
        tp_mobile: tpInfo.mobile,
        tp_email: tpInfo.email,
        tp_pan: tpInfo.pan || null,
        tp_notes: tpInfo.notes || null,
      };
    }
    return { request_for: 'SELF' as const };
  }

  const uploadRequestDocs = async (reqId: string): Promise<void> => {
    for (const doc of requestDocuments) {
      const ext = doc.file.name.split('.').pop() ?? 'bin';
      const path = `request-docs/${reqId}/${Date.now()}-${doc.document_name.replace(/\s+/g, '_')}.${ext}`;
      await supabase.storage.from('quarter-docs').upload(path, doc.file);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const existing = requests.find(r => r.request_status === 'DRAFT' && showNewModal);
      if (existing && selectedRequest?.request_status === 'DRAFT') {
        await quartersService.updateRequestPreferences(
          selectedRequest.id,
          prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
        );
        if (requestDocuments.length > 0) await uploadRequestDocs(selectedRequest.id);
      } else {
        const req = await quartersService.createRequest(user.id, {
          cycle_id: activeCycle?.id ?? null,
          request_reason: form.request_reason,
          required_bhk_config: '',
          preferred_location: form.preferred_location || '',
          move_in_date: form.move_in_date || null,
          family_member_count: 1,
          request_type: form.request_type,
          employee_notes: form.employee_notes,
          preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
          ...buildRequestForPayload(),
        });
        await quartersService.updateRequestPreferences(
          req.id,
          prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
        );
        if (requestDocuments.length > 0) await uploadRequestDocs(req.id);
      }
      addToast('Draft saved', 'success');
      setShowNewModal(false);
      setRequestDocuments([]);
      loadData();
    } catch { addToast('Failed to save draft', 'error'); } finally { setSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!user || !form.request_reason.trim()) { addToast('Please provide a request reason', 'warning'); return; }
    if (requestFor === 'TP' && !tpInfoConfirmed) { addToast('Please complete Third Party information', 'warning'); return; }
    if (requestFor === 'EMPLOYEE' && !selectedEmployee) { addToast('Please select an employee', 'warning'); return; }
    setSubmitting(true);
    try {
      const req = await quartersService.createRequest(user.id, {
        cycle_id: activeCycle?.id ?? null,
        request_reason: form.request_reason,
        required_bhk_config: '',
        preferred_location: form.preferred_location || '',
        move_in_date: form.move_in_date || null,
        family_member_count: 1,
        request_type: form.request_type,
        employee_notes: form.employee_notes,
        preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
        ...buildRequestForPayload(),
      });
      await quartersService.updateRequestPreferences(
        req.id,
        prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
      );
      if (requestDocuments.length > 0) await uploadRequestDocs(req.id);
      await quartersService.submitRequest(req.id);
      addToast('Request submitted successfully', 'success');
      setAllotApprovalRequestId(req.id);
      setRequestDocuments([]);
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setSubmitting(false); }
  };

  const handleAcknowledge = async () => {
    if (!selectedRequest?.allotment) return;
    setActionSubmitting(true);
    try {
      await quartersService.acknowledgeAllotment(selectedRequest.allotment.id, selectedRequest.id, actionRemarks);
      addToast('Allotment acknowledged', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to acknowledge', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleCardAcknowledge = async (req: QuarterRequest) => {
    if (!req.allotment?.id) return;
    setAcceptCardSubmitting(true);
    try {
      await quartersService.acknowledgeAllotment(req.allotment.id, req.id, acceptCardRemarks);
      addToast('Allotment acknowledged', 'success');
      setAcceptCardId(null);
      setAcceptCardRemarks('');
      loadData();
    } catch { addToast('Failed to acknowledge', 'error'); } finally { setAcceptCardSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selectedRequest?.allotment || !actionReason.trim()) { addToast('Please provide a reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      await quartersService.rejectAllotment(selectedRequest.allotment.id, selectedRequest.id, actionReason, actionDocUrl?.name || undefined);
      addToast('Allotment rejected', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to reject', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleTenantRequest = async (serviceType: 'EXTEND' | 'VACATE') => {
    if (!user || !selectedRequest?.allotment) return;
    if (!actionReason.trim()) { addToast('Please provide a reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      const input: CreateTenantRequestInput = {
        service_type: serviceType, remarks: actionRemarks, reason: actionReason,
        document_url: actionDocUrl?.name || undefined, requested_date: actionDate || null,
      };
      await quartersService.createTenantRequest(user.id, selectedRequest.allotment.id, input);
      addToast('Request submitted successfully', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await quartersService.withdrawRequest(id);
      addToast('Request withdrawn', 'success');
      setSelectedRequest(null);
      loadData();
    } catch { addToast('Failed to withdraw', 'error'); }
  };

  const handleAcceptAllotment = async (req: QuarterRequest) => {
    if (!req.allotment) return;
    try {
      await quartersService.acknowledgeAllotment(req.allotment.id, req.id, '');
      addToast('Allotment accepted', 'success');
      loadData();
    } catch { addToast('Failed to accept allotment', 'error'); }
  };

  const handleDeclineModalSubmit = async (andCancel: boolean) => {
    if (!declineModalReqId || !declineModalRemarks.trim()) {
      addToast('Please provide decline remarks', 'warning'); return;
    }
    const req = requests.find(r => r.id === declineModalReqId);
    if (!req?.allotment) return;
    setDeclineModalSubmitting(true);
    try {
      if (andCancel) {
        await quartersService.declineAndCancelRequest(req.allotment.id, req.id, declineModalRemarks, declineModalDocUrl?.name || undefined);
        addToast('Request cancelled', 'success');
      } else {
        await quartersService.declineAllotment(req.allotment.id, req.id, declineModalRemarks, declineModalDocUrl?.name || undefined);
        addToast('Allotment declined', 'success');
      }
      setDeclineModalReqId(null);
      setDeclineModalRemarks('');
      setDeclineModalDocUrl(null);
      loadData();
    } catch { addToast('Failed to decline allotment', 'error'); } finally { setDeclineModalSubmitting(false); }
  };

  const handleWithdrawTenantReq = async (id: string) => {
    try {
      await quartersService.withdrawTenantRequest(id);
      addToast('Request withdrawn', 'success');
      loadData();
    } catch { addToast('Failed to withdraw', 'error'); }
  };

  // ─── EO: Allot Now (create request + immediately allot) ─────────────────────
  const handleAllotNow = async () => {
    if (!user || !allotNowQuarterId) { addToast('Please select a quarter to allot', 'warning'); return; }
    if (!form.request_reason.trim()) { addToast('Please provide a request reason', 'warning'); return; }
    setAllotNowSubmitting(true);
    try {
      await quartersService.createAndAllotNow(user.id, {
        cycle_id: activeCycle?.id ?? null,
        request_reason: form.request_reason,
        required_bhk_config: form.required_bhk_config || '',
        preferred_location: form.preferred_location || '',
        move_in_date: form.move_in_date || null,
        family_member_count: form.family_member_count,
        employee_notes: form.employee_notes,
        preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
        ...buildRequestForPayload(),
      }, allotNowQuarterId);
      addToast('Quarter allotted immediately', 'success');
      setShowNewModal(false);
      setAllotNowQuarterId(null);
      setAllotNowQuarter(null);
      loadData();
    } catch { addToast('Allot Now failed', 'error'); } finally { setAllotNowSubmitting(false); }
  };

  // ─── EO: Allot with Approval (submit submitted request through approval WFL) ─
  const handleAllotWithApproval = async () => {
    if (!user || !allotApprovalRequestId) { addToast('Please submit the request first', 'warning'); return; }
    if (!allotApprovalWflId) { addToast('Please select an approval workflow', 'warning'); return; }
    if (allotApprovalUsers.length === 0) { addToast('Please select at least one approver', 'warning'); return; }
    setAllotApprovalSubmitting(true);
    try {
      await quartersService.submitRequestsForApproval([allotApprovalRequestId], allotApprovalWflId, user.id);
      addToast('Approval workflow started', 'success');
      setShowAllotApprovalPopup(false);
      setShowNewModal(false);
      setAllotApprovalRequestId(null);
      setAllotApprovalWflId('');
      setAllotApprovalUsers([]);
      loadData();
    } catch { addToast('Failed to start approval workflow', 'error'); } finally { setAllotApprovalSubmitting(false); }
  };

  // ─── EO Employee mode: manual allot ────────────────────────────────────────

  const handleManualAllot = async (quarterId: string) => {
    if (!user || !selectedRequest) return;
    setManualAllotSubmitting(true);
    try {
      await quartersService.manualAllotRequest(selectedRequest.id, quarterId, user.id);
      addToast('Quarter allotted successfully', 'success');
      setManualAllotPickerOpen(false);
      loadData();
    } catch { addToast('Failed to allot quarter', 'error'); } finally { setManualAllotSubmitting(false); }
  };

  // ─── EO Employee mode: approve/reject tenant request ───────────────────────
  const handleEOActionTR = async (action: 'approve' | 'reject') => {
    if (!eoTrId || !selectedRequest) return;
    if (action === 'reject' && !eoTrNotes.trim()) { addToast('Please provide rejection notes', 'warning'); return; }
    const tr = tenantRequests.find(t => t.id === eoTrId);
    if (!tr) return;
    setEoTrSubmitting(true);
    try {
      if (action === 'approve') {
        await quartersService.approveTenantRequest(eoTrId, selectedRequest.id, tr.service_type, eoTrNotes);
        addToast('Request approved', 'success');
      } else {
        await quartersService.rejectTenantRequest(eoTrId, selectedRequest.id, tr.service_type, eoTrNotes);
        addToast('Request rejected', 'success');
      }
      setEoTrId(null); setEoTrAction(null); setEoTrNotes('');
      loadData();
    } catch { addToast(`Failed to ${action}`, 'error'); } finally { setEoTrSubmitting(false); }
  };

  // ─── Service card quick-status update (In Progress / Resolved) ────────────
  const handleSvcStatusUpdate = async (svcId: string, status: 'IN_PROGRESS' | 'RESOLVED') => {
    setSvcMenuOpenId(null);
    try {
      await quartersService.updateTenantRequestStatus(svcId, status);
      addToast(status === 'IN_PROGRESS' ? 'Marked as In Progress' : 'Marked as Resolved', 'success');
      loadData();
    } catch { addToast('Failed to update status', 'error'); }
  };

  // ─── inline action popup submit ────────────────────────────────────────────

  const handlePopupSubmit = async () => {
    if (!user || !actionPopup.type || !actionPopup.allotmentId) return;
    setPopupSubmitting(true);
    try {
      if (actionPopup.type === 'INSPECTION') {
        if (!popupInspectorName.trim()) { addToast('Please enter inspector name', 'warning'); setPopupSubmitting(false); return; }
        const insp = await quartersService.startInspection(actionPopup.allotmentId, user.id, popupOpeningRemarks, popupInspectorName.trim());
        await quartersService.saveChecklistItems(insp.id, popupChecklist);
        addToast('Inspection started', 'success');
        setPopupInspectorName('');
        setPopupOpeningRemarks('');
        setPopupChecklist(buildDefaultChecklist());
        setPopupCondition('GOOD');
        closeActionPopup();
        loadData();
        return;
      }
      if (actionPopup.type === 'HANDOVER') {
        if (!popupKeyNumber.trim()) { addToast('Please enter key number', 'warning'); setPopupSubmitting(false); return; }
        if (!popupHandoverInteriorFile || !popupHandoverReportFile) {
          addToast('Interior photo and inspection report are required', 'warning'); setPopupSubmitting(false); return;
        }
        await quartersService.createHandover(actionPopup.allotmentId, user.id, {
          key_number: popupKeyNumber,
          occupying_deadline: popupHandoverDeadline || '',
          remarks: (popupCondition ? `Condition: ${popupCondition}. ` : '') + (popupRemarks || ''),
        });
        addToast('Handover recorded', 'success');
        closeActionPopup();
        loadData();
        return;
      }
      if (!popupReason.trim() && actionPopup.type !== 'GRIEVANCE') {
        addToast('Please provide a reason', 'warning'); setPopupSubmitting(false); return;
      }
      if (actionPopup.type === 'GRIEVANCE' && !popupSubject.trim()) {
        addToast('Please provide a subject', 'warning'); setPopupSubmitting(false); return;
      }
      const input: CreateTenantRequestInput = {
        service_type: actionPopup.type,
        reason: popupReason,
        remarks: popupRemarks,
        document_url: popupDocUrl?.name || undefined,
        requested_date: popupDate || null,
        grievance_subject: popupSubject || undefined,
        urgency_level: popupUrgency,
        ...(actionPopup.type === 'EXTEND' ? {
          retention_reason: popupRetentionReason,
          requested_months: popupRequestedMonths,
        } : {}),
      };
      await quartersService.createTenantRequest(user.id, actionPopup.allotmentId, input);
      addToast('Request submitted successfully', 'success');
      closeActionPopup();
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setPopupSubmitting(false); }
  };

  // ─── EO: Run Allocation cycle ─────────────────────────────────────────────────
  const handleRunAllocation = async () => {
    if (!user) return;
    setRunAllocSubmitting(true);
    try {
      let submitted = requests.filter(r => r.request_status === 'SUBMITTED');
      if (runAllocMedical) {
        submitted = submitted.filter(r => r.request_type === 'MEDICAL');
      } else if (runAllocGrade.trim()) {
        submitted = submitted.filter(r => r.required_bhk_config === runAllocGrade);
      }
      if (runAllocQuarterType.trim()) {
        submitted = submitted.filter(r =>
          r.preferences?.some(p => (p as any).quarter_type === runAllocQuarterType) ?? true
        );
      }
      let cycleId: string | undefined;
      if (runAllocCycleName.trim()) {
        const startDate = runAllocCurrentDate || runAllocStart || new Date().toISOString().split('T')[0];
        const endDate = runAllocEnd || startDate;
        const cycle = await quartersService.createAllotmentCycle(runAllocCycleName.trim(), startDate, endDate, user.id);
        cycleId = cycle.id;
      }
      const result = await quartersService.runAllocationCycle(user.id, submitted, cycleId);
      addToast(`Allocation complete: ${result.allotted} allotted, ${result.skipped} skipped`, 'success');
      setShowRunAllocationPopup(false);
      setRunAllocCycleName(''); setRunAllocStart(''); setRunAllocEnd('');
      setRunAllocCycleTime(''); setRunAllocLastDate('');
      setRunAllocCurrentDate(new Date().toISOString().split('T')[0]);
      setRunAllocGrade(''); setRunAllocQuarterType(''); setRunAllocWorkflowId('');
      setRunAllocApproverUsers({}); setRunAllocPickingLevel(null); setRunAllocUserSearch('');
      loadData();
    } catch { addToast('Allocation failed', 'error'); } finally { setRunAllocSubmitting(false); }
  };

  // ─── EO: Load cycle history ───────────────────────────────────────────────────
  const loadCycleHistory = async () => {
    setCycleHistoryLoading(true);
    try {
      const cycles = await quartersService.getAllotmentCycles();
      setCycleHistoryList(cycles);
    } catch { addToast('Failed to load cycles', 'error'); } finally { setCycleHistoryLoading(false); }
  };

  const loadCycleDetail = async (cycle: QuarterAllotmentCycle) => {
    setSelectedCycleDetail(cycle);
    setCycleDetailLoading(true);
    try {
      const reqs = await quartersService.getRequestsForCycle(cycle.id);
      setCycleDetailRequests(reqs);
    } catch { addToast('Failed to load cycle requests', 'error'); } finally { setCycleDetailLoading(false); }
  };

  // ─── EO: Reject request (DRAFT + sub_status=REJECTED) ─────────────────────
  const handleEORejectRequest = async () => {
    if (!user || !selectedRequest || !eoRejectReason.trim()) {
      addToast('Please provide a rejection reason', 'warning'); return;
    }
    setEoRejectSubmitting(true);
    try {
      await quartersService.eoRejectRequest(selectedRequest.id, user.id, eoRejectReason);
      addToast('Request rejected and sent back to draft', 'success');
      setEoRightMode('detail');
      setEoRejectReason('');
      setSelectedRequest(null);
      loadData();
    } catch { addToast('Failed to reject request', 'error'); } finally { setEoRejectSubmitting(false); }
  };

  // ─── EO: Inline reject modal submit ────────────────────────────────────────
  const handleRejectModalSubmit = async () => {
    if (!user || !rejectModalReqId || !rejectModalReason.trim()) {
      addToast('Please provide a rejection reason', 'warning'); return;
    }
    setRejectModalSubmitting(true);
    try {
      await quartersService.eoRejectRequest(rejectModalReqId, user.id, rejectModalReason);
      addToast('Request rejected and sent back to draft', 'success');
      setRejectModalReqId(null);
      setRejectModalReason('');
      setRejectModalDocFile(null);
      loadData();
    } catch { addToast('Failed to reject request', 'error'); } finally { setRejectModalSubmitting(false); }
  };


  // ─── EO: Approve allotment level ──────────────────────────────────────────
  const handleApproveLevel = async () => {
    if (!user || !approvalRecord) return;
    setApprovalSubmitting(true);
    try {
      await quartersService.approveAllotmentLevel(approvalRecord.id, user.id, approvalRemarks);
      addToast('Level approved', 'success');
      setApprovalAction(null);
      setApprovalRemarks('');
      const updated = await quartersService.getApprovalForAllotment(approvalRecord.allotment_id);
      setApprovalRecord(updated);
      if (updated) {
        const chats = await quartersService.getApprovalChats(updated.id);
        setApprovalChats(chats);
        // In DEMO_MODE, sync allotment approval_status into local requests state
        if (updated.status === 'APPROVED') {
          setRequests(prev => prev.map(r =>
            r.allotment?.id === updated.allotment_id
              ? { ...r, allotment: { ...r.allotment!, approval_status: 'APPROVED' } }
              : r
          ));
        }
      }
      loadData();
    } catch { addToast('Failed to approve', 'error'); } finally { setApprovalSubmitting(false); }
  };

  // ─── EO: Send for clarification ───────────────────────────────────────────
  const handleSendClarification = async () => {
    if (!user || !approvalRecord || !approvalRemarks.trim()) {
      addToast('Please provide clarification remarks', 'warning'); return;
    }
    setApprovalSubmitting(true);
    try {
      await quartersService.sendClarification(approvalRecord.id, approvalTargetLevel, approvalRemarks, user.id);
      addToast('Sent for clarification', 'success');
      setApprovalAction(null);
      setApprovalRemarks('');
      const updated = await quartersService.getApprovalForAllotment(approvalRecord.allotment_id);
      setApprovalRecord(updated);
      if (updated) {
        const chats = await quartersService.getApprovalChats(updated.id);
        setApprovalChats(chats);
      }
    } catch { addToast('Failed to send clarification', 'error'); } finally { setApprovalSubmitting(false); }
  };

  // ─── EO: Initiate request-level approval ─────────────────────────────────
  const handleInitiateRequestApproval = async (workflowId: string | null) => {
    if (!user || !selectedRequest) return;
    setInitiatingRequestApproval(true);
    try {
      await quartersService.submitRequestsForApproval([selectedRequest.id], workflowId, user.id);
      addToast('Approval workflow started', 'success');
      const approval = await quartersService.getApprovalForRequest(selectedRequest.id);
      setRequestApprovalRecord(approval);
      if (approval) {
        const chats = await quartersService.getRequestApprovalChats(approval.id);
        setRequestApprovalChats(chats);
        setEoRightMode('request_approval_chat');
      }
    } catch { addToast('Failed to start approval', 'error'); } finally { setInitiatingRequestApproval(false); }
  };

  // ─── EO: Save workflow to allotment (Allocated stage) ────────────────────
  const handleSaveAllotmentWorkflow = async (workflowId: string) => {
    if (!selectedRequest?.allotment?.id) return;
    setSavingAllotmentWorkflow(true);
    try {
      await quartersService.saveWorkflowForAllotment(selectedRequest.allotment.id, workflowId);
      addToast('Workflow saved', 'success');
      await loadData();
    } catch { addToast('Failed to save workflow', 'error'); } finally { setSavingAllotmentWorkflow(false); }
  };

  // ─── EO: Initiate allotment-level approval (Unapproved stage) ────────────
  const handleInitiateAllotmentApproval = async (workflowId: string) => {
    if (!user || !selectedRequest?.allotment?.id) return;
    setInitiatingAllotmentApproval(true);
    try {
      await quartersService.initiateAllotmentApproval(selectedRequest.allotment.id, workflowId, user.id);
      addToast('Approval workflow started', 'success');
      const approval = await quartersService.getApprovalForAllotment(selectedRequest.allotment.id);
      setApprovalRecord(approval);
      if (approval) {
        const chats = await quartersService.getApprovalChats(approval.id);
        setApprovalChats(chats);
      }
      await loadData();
    } catch { addToast('Failed to start approval', 'error'); } finally { setInitiatingAllotmentApproval(false); }
  };

  // ─── EO: Approve request-level approval level ─────────────────────────────
  const handleApproveRequestLevel = async () => {
    if (!user || !requestApprovalRecord) return;
    setRequestApprovalSubmitting(true);
    try {
      await quartersService.approveRequestLevel(requestApprovalRecord.id, user.id, requestApprovalRemarks);
      addToast('Level approved', 'success');
      setRequestApprovalAction(null);
      setRequestApprovalRemarks('');
      const updated = await quartersService.getApprovalForRequest(requestApprovalRecord.request_id);
      setRequestApprovalRecord(updated);
      if (updated) {
        const chats = await quartersService.getRequestApprovalChats(updated.id);
        setRequestApprovalChats(chats);
      }
    } catch { addToast('Failed to approve', 'error'); } finally { setRequestApprovalSubmitting(false); }
  };

  // ─── EO: Send request-level clarification ─────────────────────────────────
  const handleSendRequestClarification = async () => {
    if (!user || !requestApprovalRecord || !requestApprovalRemarks.trim()) {
      addToast('Please provide clarification remarks', 'warning'); return;
    }
    setRequestApprovalSubmitting(true);
    try {
      await quartersService.sendRequestClarification(requestApprovalRecord.id, requestApprovalTargetLevel, requestApprovalRemarks, user.id);
      addToast('Sent for clarification', 'success');
      setRequestApprovalAction(null);
      setRequestApprovalRemarks('');
      const updated = await quartersService.getApprovalForRequest(requestApprovalRecord.request_id);
      setRequestApprovalRecord(updated);
      if (updated) {
        const chats = await quartersService.getRequestApprovalChats(updated.id);
        setRequestApprovalChats(chats);
      }
    } catch { addToast('Failed to send clarification', 'error'); } finally { setRequestApprovalSubmitting(false); }
  };

  // ─── EO: Start inspection ─────────────────────────────────────────────────
  const handleStartInspection = async () => {
    if (!user || !selectedRequest?.allotment?.id) {
      addToast('No allotment selected', 'warning'); return;
    }
    if (!inspectionInspectorName.trim()) {
      addToast('Please enter inspector name', 'warning'); return;
    }
    setInspectionSubmitting(true);
    try {
      const insp = await quartersService.startInspection(
        selectedRequest.allotment.id,
        user.id,
        inspectionOpeningRemark,
        inspectionInspectorName,
      );
      // Persist checklist items
      await quartersService.saveChecklistItems(insp.id, inspectionChecklist);
      addToast('Inspection started', 'success');
      setInspectionOpeningRemark('');
      setInspectionInspectorName('');
      setInspectionInitialCondition('GOOD');
      setInspectionChecklist(buildDefaultChecklist());
      setInspectionPanel('chat');
      setSelectedInspectionId(insp.id);
      const list = await quartersService.getInspections(selectedRequest.allotment.id);
      setInspections(list);
    } catch { addToast('Failed to start inspection', 'error'); } finally { setInspectionSubmitting(false); }
  };

  // ─── EO: Add inspection chat ──────────────────────────────────────────────
  const handleSendInspectionChat = async () => {
    if (!user || !selectedInspectionId || !inspectionChatMsg.trim()) return;
    try {
      const docUrls: string[] = [];
      if (inspectionChatFile) {
        const url = await uploadChatFile(inspectionChatFile, `inspection-chats/${selectedInspectionId}`);
        if (url) docUrls.push(url);
        setInspectionChatFile(null);
      }
      await quartersService.addInspectionChat(selectedInspectionId, user.id, 'eo', inspectionChatMsg, docUrls, inspectionChatMode);
      setInspectionChatMsg('');
      const chats = await quartersService.getInspectionChats(selectedInspectionId);
      setInspectionChats(chats);
    } catch { addToast('Failed to send message', 'error'); }
  };

  // ─── EO: Close inspection ─────────────────────────────────────────────────
  const handleCloseInspection = async () => {
    if (!selectedInspectionId || !inspectionCloseRemarks.trim()) {
      addToast('Please provide closing remarks', 'warning'); return;
    }
    setInspectionSubmitting(true);
    try {
      await quartersService.closeInspection(selectedInspectionId, inspectionCloseRemarks, inspectionCondition);
      addToast('Inspection closed', 'success');
      setInspectionCloseRemarks('');
      setInspectionPanel('list');
      setSelectedInspectionId(null);
      if (selectedRequest?.allotment?.id) {
        const list = await quartersService.getInspections(selectedRequest.allotment.id);
        setInspections(list);
      }
    } catch { addToast('Failed to close inspection', 'error'); } finally { setInspectionSubmitting(false); }
  };

  // ─── EO: Create handover ──────────────────────────────────────────────────
  const handleCreateHandover = async () => {
    if (!user || !selectedRequest?.allotment?.id || !handoverKeyNo.trim() || !handoverDeadline) {
      addToast('Key number and deadline are required', 'warning'); return;
    }
    if (!handoverInteriorFile || !handoverReportFile) {
      addToast('Interior photo and inspection report are required', 'warning'); return;
    }
    setHandoverSubmitting(true);
    try {
      await quartersService.createHandover(selectedRequest.allotment.id, user.id, {
        key_number: handoverKeyNo,
        remarks: handoverRemarks,
        occupying_deadline: handoverDeadline,
        interior_doc_url: handoverInteriorFile?.name,
        inspection_report_url: handoverReportFile?.name,
      });
      addToast('Handover recorded and allotment confirmed', 'success');
      setShowHandoverPopup(false);
      setHandoverKeyNo(''); setHandoverRemarks(''); setHandoverDeadline('');
      setHandoverInteriorFile(null); setHandoverReportFile(null);
      loadData();
    } catch { addToast('Failed to record handover', 'error'); } finally { setHandoverSubmitting(false); }
  };

  // ─── EO: Add guest info ───────────────────────────────────────────────────
  const handleAddGuestInfo = async () => {
    if (!user || !selectedRequest?.allotment?.id || !guestForm.name.trim() || !guestForm.mobile.trim()) {
      addToast('Guest name and mobile are required', 'warning'); return;
    }
    setGuestSubmitting(true);
    try {
      await quartersService.addGuestInfo(selectedRequest.allotment.id, user.id, {
        guest_name: guestForm.name,
        guest_mobile: guestForm.mobile,
        guest_email: guestForm.email,
        aadhaar_doc_url: guestAadhaarFile?.name,
        pan_doc_url: guestPanFile?.name,
        other_doc_urls: guestOtherFiles.map(f => f.name),
      });
      addToast('Guest info added', 'success');
      setGuestForm({ name: '', mobile: '', email: '' });
      setGuestAadhaarFile(null); setGuestPanFile(null); setGuestOtherFiles([]);
      await loadGuestInfo();
    } catch { addToast('Failed to add guest info', 'error'); } finally { setGuestSubmitting(false); }
  };

  const handleStartAcceptedInspection = async () => {
    if (!inspectTarget?.allotment?.id || !user) return;
    if (!inspectInspectorName.trim()) { addToast('Please enter inspector name', 'warning'); return; }
    setInspectSubmitting(true);
    try {
      const insp = await quartersService.startInspection(
        inspectTarget.allotment.id, user.id, inspectRemarks, inspectInspectorName.trim()
      );
      await quartersService.saveChecklistItems(insp.id, inspectChecklist);
      addToast('Inspection started', 'success');
      setInspectTarget(null);
      setInspectRemarks('');
      setInspectInspectorName('');
      setInspectCondition('GOOD');
      setInspectChecklist(buildDefaultChecklist());
      loadData();
    } catch {
      addToast('Failed to start inspection', 'error');
    } finally {
      setInspectSubmitting(false);
    }
  };

  // ─── derived counts ─────────────────────────────────────────────────────────

  const statCounts = {
    draft:        requests.filter(r => r.request_status === 'DRAFT').length,
    submitted:    requests.filter(r => r.request_status === 'SUBMITTED').length,
    // For EM employee mode: 'allotted' = pending approval; 'allocated_em' = formally approved
    allotted:     requests.filter(r => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'PENDING').length,
    allocated_em: requests.filter(r => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'APPROVED').length,
    unapproved:   requests.filter(r => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'PENDING').length,
    accepted:     requests.filter(r => r.request_status === 'ACKNOWLEDGED').length,
    occupied:     requests.filter(r => isOccupiedStatus(r.request_status)).length,
    declined:     requests.filter(r => r.sub_status === 'DECLINED').length,
  };

  // Govt official self view: total allotted = all isAllottedStatus regardless of approval
  const govtAllottedCount = requests.filter(r => isAllottedStatus(r.request_status)).length;

  const ALL_STATUS_CARDS: StatusCard[] = [
    {
      key: 'availableQuarters', label: 'Available Quarters', description: 'Ready for allotment',
      count: availableQuarters.length,
      gradient: 'from-cyan-500 to-sky-400',
      iconBg: 'bg-cyan-100', textColor: 'text-cyan-700', countColor: 'text-cyan-900',
      icon: <Key size={20} className="text-cyan-600" />,
    },
    {
      key: 'draft', label: 'Draft Requests', description: 'Not yet submitted',
      count: statCounts.draft,
      gradient: 'from-amber-500 to-yellow-400',
      iconBg: 'bg-amber-100', textColor: 'text-amber-700', countColor: 'text-amber-900',
      icon: <FileText size={20} className="text-amber-600" />,
    },
    {
      key: 'submitted', label: 'Submitted', description: 'Awaiting EO review',
      count: statCounts.submitted,
      gradient: 'from-blue-500 to-sky-400',
      iconBg: 'bg-blue-100', textColor: 'text-blue-700', countColor: 'text-blue-900',
      icon: <Send size={20} className="text-blue-600" />,
    },
    {
      // EM employee mode only: "Allocated" = workflow-approved allotments awaiting employee acceptance
      key: 'allocated_em',
      label: 'Allocated',
      description: 'Approved — awaiting acceptance',
      count: statCounts.allocated_em,
      gradient: 'from-green-600 to-lime-500',
      iconBg: 'bg-green-100', textColor: 'text-green-700', countColor: 'text-green-900',
      icon: <ClipboardCheck size={20} className="text-green-600" />,
    },
    {
      key: 'unapproved', label: 'Unapproved Allotment', description: 'Awaiting approval',
      count: statCounts.unapproved,
      gradient: 'from-orange-500 to-amber-400',
      iconBg: 'bg-orange-100', textColor: 'text-orange-700', countColor: 'text-orange-900',
      icon: <GitMerge size={20} className="text-orange-600" />,
    },
    {
      // In EM employee mode: "Allotted" = assigned but pending workflow approval
      // In Govt official / EM self: "Allocated" = all allotted requests
      key: 'allotted',
      label: 'Allotted',
      description: (isEO && eoMode === 'employee') ? 'Pending approval / action' : 'Quarter assigned to you',
      count: (isEO && eoMode === 'employee') ? statCounts.allotted : govtAllottedCount,
      gradient: (isEO && eoMode === 'employee') ? 'from-emerald-500 to-teal-400' : 'from-green-500 to-emerald-400',
      iconBg: 'bg-emerald-100', textColor: 'text-emerald-700', countColor: 'text-emerald-900',
      icon: <CheckSquare size={20} className="text-emerald-600" />,
    },
    {
      key: 'accepted', label: 'Accepted', description: 'Awaiting inspection',
      count: statCounts.accepted,
      gradient: 'from-sky-500 to-blue-500',
      iconBg: 'bg-sky-100', textColor: 'text-sky-700', countColor: 'text-sky-900',
      icon: <HardHat size={20} className="text-sky-600" />,
    },
    {
      key: 'occupied', label: 'Occupied', description: 'Occupying / Service active',
      count: statCounts.occupied,
      gradient: 'from-teal-500 to-cyan-400',
      iconBg: 'bg-teal-100', textColor: 'text-teal-700', countColor: 'text-teal-900',
      icon: <Home size={20} className="text-teal-600" />,
    },
    {
      key: 'declined', label: 'Declined', description: 'Allotment declined by employee',
      count: statCounts.declined,
      gradient: 'from-rose-600 to-red-500',
      iconBg: 'bg-rose-100', textColor: 'text-rose-700', countColor: 'text-rose-900',
      icon: <ThumbsDown size={20} className="text-rose-600" />,
    },
  ];

  // EM employee mode: show allotted + allocated_em + unapproved + accepted + occupied + vacated + availableQuarters (hide draft)
  // Govt official / EM self mode: show draft + submitted + allotted + occupied + vacated + availableQuarters (hide EM-only cards + accepted)
  const STATUS_CARDS = (isEO && eoMode === 'employee')
    ? ALL_STATUS_CARDS.filter(c => c.key !== 'draft')
    : ALL_STATUS_CARDS.filter(c => c.key !== 'allocated_em' && c.key !== 'unapproved' && c.key !== 'accepted');

  // ─── filtered request lists ─────────────────────────────────────────────────

  const filteredRequests = React.useMemo(() => {
    let result = [...requests];

    if (dpFilter === 'draft') result = result.filter(r => r.request_status === 'DRAFT');
    else if (dpFilter === 'submitted') result = result.filter(r => r.request_status === 'SUBMITTED');
    else if (dpFilter === 'allotted') {
      if (isEO && eoMode === 'employee') {
        // EM: Allotted = pending approval
        result = result.filter(r => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'PENDING');
      } else {
        // Govt official / self: Allocated = all allotted statuses
        result = result.filter(r => isAllottedStatus(r.request_status));
      }
    }
    else if (dpFilter === 'allocated_em') result = result.filter(r => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'APPROVED');
    else if (dpFilter === 'unapproved') result = result.filter(r => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'PENDING');
    else if (dpFilter === 'accepted') result = result.filter(r => r.request_status === 'ACKNOWLEDGED');
    else if (dpFilter === 'occupied') result = result.filter(r => isOccupiedStatus(r.request_status));
    else if (dpFilter === 'declined') result = result.filter(r => r.sub_status === 'DECLINED');

    if (reqBhkFilter !== 'ALL') result = result.filter(r => r.required_bhk_config?.includes(reqBhkFilter));

    if (reqToiletFilter.length > 0) {
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? r.preferences?.[0]?.quarter;
        if (!quarter) return false;
        return reqToiletFilter.includes((quarter as Quarter).toilet_type ?? 'Western');
      });
    }

    if (reqFloorFilter.length > 0) {
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? r.preferences?.[0]?.quarter;
        if (!quarter) return false;
        const floor = (quarter as Quarter).floor_number ?? 0;
        return reqFloorFilter.some(f => f === 4 ? floor >= 4 : floor === f);
      });
    }

    if (reqSearch.trim()) {
      const q = reqSearch.toLowerCase();
      result = result.filter(r =>
        r.request_number?.toLowerCase().includes(q) ||
        r.required_bhk_config?.toLowerCase().includes(q) ||
        r.preferred_location?.toLowerCase().includes(q) ||
        r.on_behalf_employee_name?.toLowerCase().includes(q) ||
        r.on_behalf_employee_dept?.toLowerCase().includes(q) ||
        r.tp_name?.toLowerCase().includes(q)
      );
    }

    // ── Extended filters ────────────────────────────────────────────────────
    if (reqHousingStyleFilter) {
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? (r.preferences?.[0]?.quarter as Quarter | undefined);
        return quarter?.housing_style?.toLowerCase().includes(reqHousingStyleFilter.toLowerCase());
      });
    }

    if (reqRequestTypeFilter.length > 0) {
      result = result.filter(r => reqRequestTypeFilter.includes(r.request_type ?? ''));
    }

    if (reqLocationFilter.trim()) {
      const loc = reqLocationFilter.toLowerCase();
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? (r.preferences?.[0]?.quarter as Quarter | undefined);
        return (
          r.preferred_location?.toLowerCase().includes(loc) ||
          quarter?.location_area?.toLowerCase().includes(loc) ||
          quarter?.region?.toLowerCase().includes(loc)
        );
      });
    }

    if (reqDateFrom) {
      const from = new Date(reqDateFrom).getTime();
      result = result.filter(r => new Date(r.created_at).getTime() >= from);
    }
    if (reqDateTo) {
      const to = new Date(reqDateTo).getTime() + 86400000 - 1;
      result = result.filter(r => new Date(r.created_at).getTime() <= to);
    }

    if (reqGradeFilter.trim()) {
      const g = reqGradeFilter.toLowerCase();
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? (r.preferences?.[0]?.quarter as Quarter | undefined);
        return quarter?.quota?.toLowerCase().includes(g);
      });
    }

    // Govt Official tab-specific filters
    if (reqApprovalStatusFilter.length > 0) {
      result = result.filter(r => reqApprovalStatusFilter.includes(r.allotment?.approval_status ?? ''));
    }

    if (reqOccupancyStatusFilter.length > 0) {
      result = result.filter(r => {
        const quarter = r.allotment?.quarter as Quarter | undefined;
        return reqOccupancyStatusFilter.includes(quarter?.occupancy_status ?? '');
      });
    }

    if (reqUnitNumberFilter.trim()) {
      const un = reqUnitNumberFilter.toLowerCase();
      result = result.filter(r => {
        const quarter = r.allotment?.quarter as Quarter | undefined;
        return (
          quarter?.unit_number?.toLowerCase().includes(un) ||
          quarter?.quarter_number?.toLowerCase().includes(un)
        );
      });
    }

    if (reqOccupiedDateFrom) {
      const from = new Date(reqOccupiedDateFrom).getTime();
      result = result.filter(r => {
        const dt = r.allotment?.move_in_date ?? r.updated_at;
        return dt ? new Date(dt).getTime() >= from : false;
      });
    }
    if (reqOccupiedDateTo) {
      const to = new Date(reqOccupiedDateTo).getTime() + 86400000 - 1;
      result = result.filter(r => {
        const dt = r.allotment?.move_in_date ?? r.updated_at;
        return dt ? new Date(dt).getTime() <= to : false;
      });
    }

    if (reqDeclinedDateFrom) {
      const from = new Date(reqDeclinedDateFrom).getTime();
      result = result.filter(r => new Date(r.updated_at).getTime() >= from);
    }
    if (reqDeclinedDateTo) {
      const to = new Date(reqDeclinedDateTo).getTime() + 86400000 - 1;
      result = result.filter(r => new Date(r.updated_at).getTime() <= to);
    }

    result.sort((a, b) => {
      if (dpFilter === 'occupied') {
        const rankA = a.request_status === 'ACKNOWLEDGED' ? 0 : 1;
        const rankB = b.request_status === 'ACKNOWLEDGED' ? 0 : 1;
        if (rankA !== rankB) return rankA - rankB;
      }
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return reqSort === 'newest' ? diff : -diff;
    });
    return result;
  }, [
    requests, dpFilter, reqSearch, reqSort, reqBhkFilter, reqToiletFilter, reqFloorFilter, isEO, eoMode,
    reqHousingStyleFilter, reqRequestTypeFilter, reqLocationFilter, reqDateFrom, reqDateTo, reqGradeFilter,
    reqApprovalStatusFilter, reqOccupancyStatusFilter, reqUnitNumberFilter,
    reqOccupiedDateFrom, reqOccupiedDateTo, reqDeclinedDateFrom, reqDeclinedDateTo,
  ]);

  const selectedPrefs = selectedRequest?.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];

  const activeFilterCount = [
    reqBhkFilter !== 'ALL',
    reqSearch.trim().length > 0,
    reqHousingStyleFilter.trim().length > 0,
    reqLocationFilter.trim().length > 0,
    reqDateFrom.length > 0,
    reqDateTo.length > 0,
    reqGradeFilter.trim().length > 0,
    reqUnitNumberFilter.trim().length > 0,
    reqOccupiedDateFrom.length > 0,
    reqOccupiedDateTo.length > 0,
    reqDeclinedDateFrom.length > 0,
    reqDeclinedDateTo.length > 0,
  ].filter(Boolean).length +
    reqToiletFilter.length +
    reqFloorFilter.length +
    reqRequestTypeFilter.length +
    reqApprovalStatusFilter.length +
    reqOccupancyStatusFilter.length;

  const filteredAvailableQuarters = React.useMemo(() => {
    let result = [...availableQuarters];
    if (avqBhkFilter !== 'ALL') result = result.filter(q => q.bhk_config === avqBhkFilter);
    if (avqFloorFilter.length > 0) result = result.filter(q => {
      const floor = q.floor_number ?? 0;
      return avqFloorFilter.some(f => f === 4 ? floor >= 4 : floor === f);
    });
    if (avqGroundFloor) result = result.filter(q => (q.floor_number ?? 0) === 0);
    if (avqRecentlyRenovated) result = result.filter(q => q.renovation_status?.toLowerCase().includes('renovat'));
    if (avqLocationArea.trim()) {
      const la = avqLocationArea.toLowerCase();
      result = result.filter(q =>
        q.location_area?.toLowerCase().includes(la) ||
        q.region?.toLowerCase().includes(la)
      );
    }
    if (avqWesternToilet) result = result.filter(q => q.toilet_western === true);
    if (avqIndianToilet) result = result.filter(q => q.toilet_indian === true);
    if (avqCarParking) result = result.filter(q => !!q.parking_details);
    if (avqPoojaRoom) result = result.filter(q => q.pooja_room === true);
    if (avqBalcony) result = result.filter(q => q.balcony === true);
    if (avqKitchenExhaust) result = result.filter(q => q.kitchen_exhaust === true);
    if (avqLiftAccess) result = result.filter(q => q.lift_access === true);
    if (avqHousingStyle) result = result.filter(q => q.housing_style === avqHousingStyle);
    if (avqSearch.trim()) {
      const s = avqSearch.toLowerCase();
      result = result.filter(q =>
        q.quarter_number?.toLowerCase().includes(s) ||
        q.block_name?.toLowerCase().includes(s) ||
        q.address?.toLowerCase().includes(s) ||
        q.district?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [
    availableQuarters, avqBhkFilter, avqFloorFilter,
    avqGroundFloor, avqRecentlyRenovated, avqLocationArea,
    avqWesternToilet, avqIndianToilet, avqCarParking,
    avqPoojaRoom, avqBalcony, avqKitchenExhaust,
    avqLiftAccess, avqHousingStyle, avqSearch,
  ]);

  function clearAvqFilters() {
    setAvqSearch(''); setAvqBhkFilter('ALL'); setAvqFloorFilter([]);
    setAvqGroundFloor(false); setAvqRecentlyRenovated(false); setAvqLocationArea('');
    setAvqWesternToilet(false); setAvqIndianToilet(false); setAvqCarParking(false);
    setAvqPoojaRoom(false); setAvqBalcony(false); setAvqKitchenExhaust(false);
    setAvqLiftAccess(false); setAvqHousingStyle('');
  }

  const avqHasActiveFilter =
    !!avqSearch || avqBhkFilter !== 'ALL' || avqFloorFilter.length > 0 ||
    avqGroundFloor || avqRecentlyRenovated || !!avqLocationArea ||
    avqWesternToilet || avqIndianToilet || avqCarParking ||
    avqPoojaRoom || avqBalcony || avqKitchenExhaust || avqLiftAccess || !!avqHousingStyle;

  // ─── EM: Create new quarter ────────────────────────────────────────────────
  const handleCreateQuarter = async (input: import('../types/quarters').CreateQuarterInput, imageFiles: File[]) => {
    if (!user) return;
    setNewQuarterSubmitting(true);
    try {
      const created = await quartersService.createQuarter(input);
      if (imageFiles.length > 0) {
        const uploads = await Promise.all(
          imageFiles.map(f => uploadChatFile(f, `quarters/${created.id}/images`))
        );
        const urls = uploads.filter(Boolean) as string[];
        if (urls.length > 0) {
          await quartersService.updateQuarterImages(created.id, urls);
        }
      }
      addToast('Quarter created successfully', 'success');
      setShowNewQuarterModal(false);
      const fresh = await quartersService.getQuarters({ occupancy_status: 'AVAILABLE' });
      setAvailableQuarters(fresh);
    } catch { addToast('Failed to create quarter', 'error'); } finally { setNewQuarterSubmitting(false); }
  };

  // ─── helper to open preview modal ──────────────────────────────────────────

  function openQuarterPreview(req: QuarterRequest) {
    const qId = (req.allotment?.quarter as Quarter | undefined)?.id
      ?? (req.preferences?.[0]?.quarter as Quarter | undefined)?.id;
    if (!qId) { addToast('No quarter linked to this request yet', 'info'); return; }
    setPreviewQuarterId(qId);
    setIsPreviewOpen(true);
  }

  // ─── handleDeallocate helper ─────────────────────────────────────────────────

  const handleDeallocate = async (allotmentId: string, requestId: string) => {
    if (!user) return;
    try {
      await quartersService.deallocateRequest(allotmentId, requestId);
      addToast('Deallocated', 'success');
      loadData();
    } catch { addToast('Failed to deallocate', 'error'); }
  };

  const handleSetMedicalCriticality = async (requestId: string, criticality: MedicalCriticality | null) => {
    setCritSavingId(requestId);
    try {
      await quartersService.setMedicalCriticality(requestId, criticality);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, medical_criticality: criticality } as unknown as QuarterRequest : r));
      addToast(criticality ? `Criticality set to ${criticality}` : 'Criticality cleared', 'success');
    } catch { addToast('Failed to update criticality', 'error'); }
    finally { setCritSavingId(null); }
  };

  // ─── render ──────────────────────────────────────────────────────────────────

  // EO mode selection screen — shown every time before the main dashboard
  if (isEO && eoMode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 text-white rounded-2xl shadow-lg mb-4">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Estate Officer Portal</h1>
            <p className="text-gray-500 mt-2 text-sm">How would you like to proceed today?</p>
            {user?.bhkEntitlement && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-semibold text-teal-700">
                <Bed size={11} /> Cadre Entitlement: {user.bhkEntitlement}
              </div>
            )}
          </div>

          {/* Two mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* My Allotments */}
            <button
              onClick={() => { setEOMode('self'); setDpFilter('allotted'); setSelectedRequest(null); resetActionForm(); }}
              className="group text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-teal-400 hover:shadow-xl transition-all duration-200 p-7 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 group-hover:bg-teal-600 flex items-center justify-center transition-colors duration-200">
                <Home size={22} className="text-teal-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1.5">My Allotments</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Manage your own quarter requests, view allotment status, and submit new requests for yourself or on behalf of others.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-teal-600 text-xs font-semibold mt-auto">
                Continue <ChevronRight size={14} />
              </div>
            </button>

            {/* Employee Allotments */}
            <button
              onClick={() => { setEOMode('employee'); setDpFilter('allotted'); setSelectedRequest(null); resetActionForm(); }}
              className="group text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 p-7 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 flex items-center justify-center transition-colors duration-200">
                <UserCog size={22} className="text-blue-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1.5">Employee Allotments</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Review all employee requests, manually allot quarters, approve or reject tenant services, and manage override actions.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold mt-auto">
                Continue <ChevronRight size={14} />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Full-Screen Request Detail View ──────────────────────────────── */}
      {detailRequest && createPortal(
        <div className="fixed inset-0 z-[900] bg-gray-50 flex flex-col" style={{ fontFamily: 'inherit' }}>
          {(() => {
            const req = detailRequest;
            const allotment = req.allotment;
            const q = allotment?.quarter as Quarter | undefined;
            const reqPrefs = (req.preferences ?? []).sort((a, b) => a.preference_rank - b.preference_rank);
            const sc = statusConfig(req.request_status);
            const rf = req.request_for ?? 'SELF';
            const hasRightData = true; // always true

            // Determine primary action button
            const primaryAction = (() => {
              const s = req.request_status;
              if (s === 'ALLOTTED') return { label: 'Accept Allotment', color: 'bg-emerald-600 hover:bg-emerald-700', icon: <ThumbsUp size={14} /> };
              if (s === 'SUBMITTED') return { label: 'Withdraw', color: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100', icon: <XCircle size={14} />, outline: true };
              if (s === 'DRAFT') return { label: 'Submit Request', color: 'bg-blue-600 hover:bg-blue-700', icon: <Send size={14} /> };
              return null;
            })();

            return (
              <>
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0">
                  <button
                    onClick={() => { setDetailRequest(null); setDpFilter(detailReturnFilter); }}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft size={16} /><span>Back</span>
                  </button>
                  <div className="h-5 w-px bg-gray-200" />
                  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                    <span className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">{req.request_number}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${sc.cls}`}>{sc.icon}{sc.label}</span>
                    {req.sub_status === 'DECLINED' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">Declined</span>}
                    {/* Request-for badge */}
                    {rf === 'EMPLOYEE' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><UserCheck size={11} />On Behalf</span>}
                    {rf === 'TP' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><UserPlus size={11} />Third Party</span>}
                    <span className="text-xs text-gray-400 ml-auto">{fmtDate(req.created_at)}</span>
                  </div>
                  {primaryAction && (
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-colors ${primaryAction.color} ${!(primaryAction as { outline?: boolean }).outline ? 'text-white' : ''}`}
                      onClick={() => {
                        setDetailRequest(null);
                        setDpFilter(detailReturnFilter);
                        setSelectedRequest(req);
                        resetActionForm();
                      }}
                    >
                      {primaryAction.icon}{primaryAction.label}
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex gap-0 min-h-0">
                  {/* ── Left: Property / Preferences ── */}
                  <div className="w-[45%] flex flex-col border-r border-gray-200 overflow-y-auto bg-white">
                    {q ? (
                      <div className="flex flex-col">
                        {/* Image carousel */}
                        <div className="relative bg-gray-900">
                          <ImageCarousel images={resolveAllImages(q)} className="h-64" />
                          <div className="absolute bottom-3 left-3">
                            <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">Allotted Quarter</span>
                          </div>
                        </div>
                        {/* Quarter identity */}
                        <div className="px-6 py-4 border-b border-gray-100">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-xl font-bold text-gray-900">{q.quarter_number}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{q.block_name} Block · Floor {q.floor_number ?? '—'}</div>
                              {q.address && <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={11} />{q.address}</div>}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xl font-bold text-gray-900">{fmtINR(q.monthly_rent)}</div>
                              <div className="text-xs text-gray-400">/month</div>
                            </div>
                          </div>
                        </div>
                        {/* Specs strip */}
                        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/60">
                          {[
                            { icon: <Bed size={16} className="text-blue-500" />, label: 'Config', value: q.bhk_config },
                            { icon: <Ruler size={16} className="text-teal-500" />, label: 'Area', value: `${q.area_sqft} sq.ft` },
                            { icon: <Layers size={16} className="text-gray-500" />, label: 'Floor', value: q.floor_number !== null ? `Floor ${q.floor_number}` : '—' },
                          ].map(({ icon, label, value }) => (
                            <div key={label} className="flex flex-col items-center gap-1 py-3 px-2">
                              {icon}
                              <div className="text-xs text-gray-400">{label}</div>
                              <div className="text-sm font-semibold text-gray-800">{value}</div>
                            </div>
                          ))}
                        </div>
                        {/* Feature chips */}
                        {(q.balcony || q.pooja_room || q.lift_access || q.power_backup || q.water_heating || q.kitchen_exhaust) && (
                          <div className="px-6 py-3 border-b border-gray-100">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Features</div>
                            <div className="flex flex-wrap gap-1.5">
                              {q.balcony && <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Balcony</span>}
                              {q.pooja_room && <span className="text-[11px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">Pooja Room</span>}
                              {q.lift_access && <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">Lift</span>}
                              {q.power_backup && <span className="text-[11px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">Power Backup</span>}
                              {q.water_heating && <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">Geyser</span>}
                              {q.kitchen_exhaust && <span className="text-[11px] bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full font-medium">Kitchen Exhaust</span>}
                            </div>
                          </div>
                        )}
                        {/* Location details */}
                        {(q.region || q.district || q.pin_code) && (
                          <div className="px-6 py-3 border-b border-gray-100">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Location</div>
                            <div className="space-y-1 text-xs text-gray-600">
                              {q.region && <div className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400 shrink-0" />{q.region}</div>}
                              {q.district && <div className="pl-4 text-gray-500">{q.district}{q.pin_code ? ` · PIN ${q.pin_code}` : ''}</div>}
                            </div>
                          </div>
                        )}
                        {/* Amenities */}
                        {q.amenities && q.amenities.length > 0 && (
                          <div className="px-6 py-3">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Amenities</div>
                            <div className="flex flex-wrap gap-1.5">
                              {q.amenities.map(a => <span key={a} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{a}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* No allotment — show preference list */
                      <div className="flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                          <div className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1">
                            <Star size={15} className="text-amber-500" />Preference List
                          </div>
                          <div className="text-xs text-gray-500">{reqPrefs.length} of 5 quarters selected</div>
                        </div>
                        {reqPrefs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Star size={36} className="mb-3 opacity-20" />
                            <div className="text-sm font-medium">No preferences added</div>
                            <div className="text-xs mt-1">Add preferences to your request</div>
                          </div>
                        ) : (
                          <div className="p-4 space-y-3">
                            {reqPrefs.map((pref, pi) => {
                              const pq = pref.quarter as Quarter | undefined;
                              if (!pq) return null;
                              return (
                                <div key={pref.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-all">
                                  <div className="relative shrink-0">
                                    <img src={getImage(pq, pi)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                    <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shadow">{pref.preference_rank}</div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm">{pq.quarter_number}</div>
                                    {pq.address && <div className="text-xs text-gray-500 truncate">{pq.address}</div>}
                                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                                      <span className="flex items-center gap-0.5"><Bed size={10} />{pq.bhk_config}</span>
                                      <span>{pq.area_sqft} sq.ft</span>
                                      <span className="font-semibold text-gray-800">{fmtINR(pq.monthly_rent)}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => { setPreviewQuarterId(pq.id); setIsPreviewOpen(true); }}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                  ><Eye size={13} /></button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Right: Request & Allotment details (always shown) ── */}
                  {hasRightData && (
                    <div className="flex-1 overflow-y-auto bg-white">
                      {/* Requester section */}
                      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Requester</div>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">{user?.fullName ?? '—'}</div>
                            <div className="text-xs text-gray-500">{user?.govtEmployeeId ?? user?.email ?? '—'}</div>
                            {user?.govtDepartment && <div className="text-xs text-gray-400">{user.govtDepartment}</div>}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRequestForBadgeCls(rf)}`}>
                            {getRequestForLabel(rf)}
                          </span>
                        </div>

                        {/* On-behalf employee */}
                        {rf === 'EMPLOYEE' && req.on_behalf_employee_name && (
                          <div className="mt-3 flex items-center gap-3 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                              {req.on_behalf_employee_name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-0.5">Requested For (Employee)</div>
                              <div className="text-sm font-semibold text-blue-900">{req.on_behalf_employee_name}</div>
                              <div className="text-xs text-blue-600">{req.on_behalf_employee_id}{req.on_behalf_employee_dept ? ` · ${req.on_behalf_employee_dept}` : ''}</div>
                            </div>
                            <UserCheck size={18} className="text-blue-400 shrink-0" />
                          </div>
                        )}

                        {/* TP info */}
                        {rf === 'TP' && req.tp_name && (
                          <div className="mt-3 bg-amber-50 rounded-xl border border-amber-100 px-4 py-3 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                                {req.tp_name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-0.5">Third Party Beneficiary</div>
                                <div className="text-sm font-semibold text-amber-900">{req.tp_name}</div>
                                {req.tp_organization && <div className="text-xs text-amber-600">{req.tp_organization}</div>}
                              </div>
                              <UserPlus size={18} className="text-amber-400 shrink-0" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {req.tp_mobile && (
                                <div className="flex items-center gap-1.5 text-amber-700"><Phone size={11} />{req.tp_mobile}</div>
                              )}
                              {req.tp_email && (
                                <div className="flex items-center gap-1.5 text-amber-700 truncate"><Mail size={11} />{req.tp_email}</div>
                              )}
                              {req.tp_pan && (
                                <div className="flex items-center gap-1.5 text-amber-700 col-span-2"><CreditCard size={11} />PAN: {req.tp_pan}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Request details */}
                      <div className="px-6 py-4 border-b border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Request Details</div>
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="col-span-2 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                            <div className="text-[10px] text-gray-400 mb-0.5">Request Reason</div>
                            <div className="font-semibold text-gray-800 text-sm">{req.request_reason || '—'}</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                            <div className="text-[10px] text-gray-400 mb-0.5">Quarter Type Required</div>
                            <div className="font-semibold text-gray-800">{req.required_bhk_config || '—'}</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                            <div className="text-[10px] text-gray-400 mb-0.5">Pref. Location</div>
                            <div className="font-semibold text-gray-800 truncate">{req.preferred_location || '—'}</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                            <div className="text-[10px] text-gray-400 mb-0.5">Family Members</div>
                            <div className="font-semibold text-gray-800">{req.family_member_count ?? 1}</div>
                          </div>
                          {req.move_in_date && (
                            <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                              <div className="text-[10px] text-gray-400 mb-0.5">Move-in Date</div>
                              <div className="font-semibold text-gray-800">{fmtDate(req.move_in_date)}</div>
                            </div>
                          )}
                          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                            <div className="text-[10px] text-gray-400 mb-0.5">Requested On</div>
                            <div className="font-semibold text-gray-800">{fmtDate(req.created_at)}</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                            <div className="text-[10px] text-gray-400 mb-0.5">Preferences</div>
                            <div className="font-semibold text-gray-800">{reqPrefs.length} submitted</div>
                          </div>
                        </div>
                        {req.employee_notes && (
                          <div className="mt-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs">
                            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wide mb-0.5 flex items-center gap-1"><Paperclip size={9} />Employee Notes</div>
                            <div className="text-amber-900">{req.employee_notes}</div>
                          </div>
                        )}
                      </div>

                      {/* Allotment details */}
                      {allotment && (
                        <div className="px-6 py-4 border-b border-gray-100">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Allotment Details</div>
                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3">
                              <div className="text-[10px] text-emerald-500 mb-0.5">Allotment Date</div>
                              <div className="font-semibold text-emerald-900">{fmtDate(allotment.allotment_date)}</div>
                            </div>
                            <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3">
                              <div className="text-[10px] text-emerald-500 mb-0.5">Approval Status</div>
                              <div className="font-semibold text-emerald-900">{allotment.approval_status}</div>
                            </div>
                            {allotment.allotment_conditions && (
                              <div className="col-span-2 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                <div className="text-[10px] text-gray-400 mb-0.5">Allotment Conditions</div>
                                <div className="font-medium text-gray-800">{allotment.allotment_conditions}</div>
                              </div>
                            )}
                            {allotment.acknowledgement_remarks && (
                              <div className="col-span-2 bg-teal-50 rounded-xl border border-teal-100 px-4 py-3">
                                <div className="text-[10px] text-teal-500 mb-0.5">Acknowledgement Remarks</div>
                                <div className="font-medium text-teal-800">{allotment.acknowledgement_remarks}</div>
                              </div>
                            )}
                            {req.eo_notes && (
                              <div className="col-span-2 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3">
                                <div className="text-[10px] text-blue-500 mb-0.5">EO Notes</div>
                                <div className="font-medium text-blue-800">{req.eo_notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions strip */}
                      <div className="px-6 py-4">
                        <button
                          onClick={() => { setDetailRequest(null); setDpFilter(detailReturnFilter); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors"
                        >
                          <ExternalLink size={15} />Open in Action Panel
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2">Opens the request in the split-panel view for actions</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>,
        document.body
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col" style={{ height: '100vh' }}>

        {/* ── Compact header — 2 rows ────────────────────────────────── */}
        <div className="flex-none bg-white rounded-xl border border-gray-200 px-4 py-2 mb-2">
          {/* Row 1: breadcrumb + action icons */}
          <div className="flex items-center justify-between gap-2 min-h-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-gray-400 min-w-0 flex-wrap">
              <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-blue-600 transition-colors flex-shrink-0"><Home size={11} /></button>
              <ChevronRight size={9} className="flex-shrink-0" />
              <button onClick={() => navigate(ROUTES.DASHBOARD)} className="text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0">Workspace</button>
              <ChevronRight size={9} className="flex-shrink-0" />
              <button onClick={() => { setSelectedRequest(null); setDpFilter('allotted'); resetActionForm(); }} className="text-gray-600 font-medium hover:text-blue-600 transition-colors flex-shrink-0">Quarters</button>
              <ChevronRight size={9} className="flex-shrink-0" />
              <button onClick={() => { setSelectedRequest(null); resetActionForm(); }} className="text-gray-700 font-medium hover:text-blue-600 transition-colors truncate max-w-[80px]">{DP_LABELS[dpFilter]}</button>
              {selectedRequest && (
                <>
                  <ChevronRight size={9} className="flex-shrink-0" />
                  <span className="font-mono text-gray-700 font-medium truncate max-w-[100px]">{selectedRequest.request_number}</span>
                </>
              )}
            </div>

            {/* Action buttons — icons only (with tooltips) */}
            <div className="flex items-center gap-1 flex-shrink-0">

              {isEO && (
                <button
                  onClick={() => { setEOMode(null); setSelectedRequest(null); resetActionForm(); }}
                  title="Switch Mode"
                  className="p-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                >
                  <ShieldCheck size={14} />
                </button>
              )}

              {isEO && dpFilter === 'availableQuarters' && (
                <button
                  onClick={() => setShowNewQuarterModal(true)}
                  title="Add New Quarter"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={12} /> New Quarter
                </button>
              )}

              <button
                onClick={() => downloadPageAsHtml('/quarters/requests')}
                title="Download Offline Copy"
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                <Download size={14} />
              </button>

              {!(isEO && eoMode === 'employee') && (
                <>
                  <button
                    onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)}
                    title="Browse Quarters"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                  >
                    <Eye size={14} />
                  </button>
                  <Button onClick={() => openNewModal()} className="!py-1.5 !px-2.5 !text-xs">
                    <Plus size={12} className="mr-1" /> New
                  </Button>
                </>
              )}

              {isEO && eoMode === 'employee' && dpFilter === 'submitted' && (
                <>
                  <button
                    onClick={() => { setShowCycleHistory(true); loadCycleHistory(); }}
                    title="View Allocation Runs"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                  >
                    <ClipboardList size={14} />
                  </button>
                  <button
                    onClick={() => setShowRunAllocationPopup(true)}
                    title="Run Allocation"
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <PlayCircle size={14} />
                  </button>
                </>
              )}

              {isEO && eoMode === 'employee' && dpFilter === 'allocated_em' && (
                <button
                  onClick={() => {
                    setAllocWFLSelectedCycleId(null);
                    setAllocWFLWorkflowId('');
                    setAllocWFLApproverUsers({});
                    setAllocWFLPickingLevel(null);
                    setAllocWFLUserSearch('');
                    setAllocWFLSuccess(false);
                    setShowAllocatedWFLPopup(true);
                  }}
                  title="Assign Workflow to Allocation Cycles"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <GitMerge size={13} />
                  <span className="hidden sm:inline">Assign WFL</span>
                </button>
              )}

              {isEO && eoMode === 'employee' && dpFilter === 'unapproved' && (
                <button
                  onClick={() => {
                    setUnapprWFLSelectedCycleId(null);
                    setShowUnapprovedWFLPopup(true);
                  }}
                  title="Manage Approval Workflows"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <ListFilter size={13} />
                  <span className="hidden sm:inline">Manage WFL</span>
                </button>
              )}

            </div>
          </div>

          {/* Row 2: user identity + page title */}
          <div className="flex items-center gap-2 mt-1.5 min-w-0">
            {user && (
              <>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                  {user.fullName?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">{user.fullName}</span>
                {user.govtEmployeeId && (
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{user.govtEmployeeId}</span>
                )}
                {user.projectLocation && (
                  <>
                    <span className="text-gray-200 flex-shrink-0">·</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{user.projectLocation}</span>
                  </>
                )}
                {user.sapId && (
                  <>
                    <span className="text-gray-200 flex-shrink-0">·</span>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{user.sapId}</span>
                  </>
                )}
                <span className="text-gray-200 mx-1 flex-shrink-0">|</span>
              </>
            )}
            <h1 className="text-sm font-bold text-gray-900 leading-none flex-shrink-0">
              {isEO && eoMode === 'employee' ? 'Employee Allotments' : 'Quarter Requests'}
            </h1>
          </div>
        </div>

        {/* ── Status summary cards — single-row slider ── */}
        <div className="flex-none mb-2">
          <div className="flex items-center gap-2">
            {/* Left nav button — always reserves space so track width is stable */}
            <button
              onClick={() => dpScrollRef.current?.scrollBy({ left: -210, behavior: 'smooth' })}
              disabled={!dpCanScrollLeft}
              aria-label="Scroll left"
              className={`flex-none w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                dpCanScrollLeft
                  ? 'bg-white border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md hover:text-gray-900 cursor-pointer'
                  : 'bg-gray-50 border-gray-100 text-gray-300 cursor-default'
              }`}
            >
              <ChevronLeft size={15} />
            </button>

            {/* Scrollable track */}
            <div
              ref={dpScrollRef}
              className="flex-1 flex gap-3 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {STATUS_CARDS.map((card, idx) => {
                const iconMap: Record<DPFilter, React.FC<any>> = {
                  all: FileText,
                  draft: FileText,
                  submitted: Send,
                  allotted: CheckSquare,
                  allocated_em: ClipboardCheck,
                  unapproved: GitMerge,
                  accepted: HardHat,
                  occupied: Home,
                  tenantServices: RefreshCw,
                  availableQuarters: Building2,
                };
                return (
                  <div
                    key={card.key}
                    className="flex-none w-[190px]"
                    data-dp-active={dpFilter === card.key ? 'true' : undefined}
                  >
                    <SummaryStatsCard
                      label={card.label}
                      value={card.count}
                      icon={iconMap[card.key]}
                      gradient={`bg-gradient-to-r ${card.gradient}`}
                      delay={idx * 40}
                      subtitle={card.description}
                      isActive={dpFilter === card.key}
                      onClick={() => {
                        setDpFilter(card.key);
                        setSelectedRequest(null);
                        resetActionForm();
                        setReqSearch('');
                        setReqBhkFilter('ALL');
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Right nav button — always reserves space */}
            <button
              onClick={() => dpScrollRef.current?.scrollBy({ left: 210, behavior: 'smooth' })}
              disabled={!dpCanScrollRight}
              aria-label="Scroll right"
              className={`flex-none w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                dpCanScrollRight
                  ? 'bg-white border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md hover:text-gray-900 cursor-pointer'
                  : 'bg-gray-50 border-gray-100 text-gray-300 cursor-default'
              }`}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        {dpFilter === 'availableQuarters' ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Search / BHK filter row */}
            <div className="flex-none mb-2">
              <MandatorySearchBar
                fields={[
                  {
                    key: 'search',
                    label: 'Search',
                    type: 'text',
                    placeholder: 'Quarter no., block, area…',
                    value: avqSearch,
                    onChange: setAvqSearch,
                    icon: <Search size={14} />,
                  },
                  {
                    key: 'bhk',
                    label: 'Quarter Type',
                    type: 'chips',
                    value: avqBhkFilter,
                    onChange: setAvqBhkFilter,
                    options: [
                      { value: 'ALL', label: 'Any' },
                      ...QUARTER_TYPE_OPTIONS.map(t => ({ value: t, label: t })),
                    ],
                  },
                ]}
                filterCount={
                  avqFloorFilter.length +
                  [avqGroundFloor, avqRecentlyRenovated, avqWesternToilet, avqIndianToilet,
                   avqCarParking, avqPoojaRoom, avqBalcony, avqKitchenExhaust, avqLiftAccess].filter(Boolean).length +
                  (avqLocationArea ? 1 : 0) + (avqHousingStyle ? 1 : 0)
                }
                onFilterOpen={() => setAvqFilterDrawerOpen(true)}
              />
            </div>

            {/* Result count */}
            <div className="flex-none flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 font-medium">
                {availableQuartersLoading ? 'Loading…' : `${filteredAvailableQuarters.length} quarter${filteredAvailableQuarters.length !== 1 ? 's' : ''} available`}
                {avqHasActiveFilter && !availableQuartersLoading && availableQuarters.length !== filteredAvailableQuarters.length && (
                  <span className="text-gray-400"> (filtered from {availableQuarters.length})</span>
                )}
              </span>
              {avqHasActiveFilter && (
                <button
                  onClick={clearAvqFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>

            {/* Quarter list */}
            <div className="flex-1 overflow-y-auto pr-1 pb-6">
              {availableQuartersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />)}
                </div>
              ) : filteredAvailableQuarters.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
                  <Key size={36} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">No available quarters found</h3>
                  <p className="text-xs text-gray-500">
                    {avqHasActiveFilter
                      ? 'Try clearing your filters.'
                      : 'All quarters are currently occupied or inactive.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAvailableQuarters.map((q, idx) => (
                    <div key={q.id} className="relative group">
                      <QuarterListCard
                        quarter={q}
                        idx={idx}
                        onView={() => setAvqDetailQuarterId(q.id)}
                        onAddToRequest={(!isEO || eoMode === 'self') ? () => {
                          openNewModal();
                          setTimeout(() => addPref(q), 50);
                        } : undefined}
                      />
                      {/* Three-dot action menu button */}
                      <button
                        onClick={e => openAvqMenu(e, q.id)}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg border transition-colors z-10 ${
                          avqMenuId === q.id
                            ? 'bg-gray-100 border-gray-300 text-gray-700'
                            : 'bg-white/90 border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Actions"
                      >
                        <MoreVertical size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />)}
          </div>
        ) : filteredRequests.length === 0 && requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {isEO && eoMode === 'employee' ? 'No employee requests found' : 'No quarter requests yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {isEO && eoMode === 'employee'
                ? 'Employee allotment requests will appear here once submitted.'
                : 'Create your first request to start the allotment process.'}
            </p>
            {!(isEO && eoMode === 'employee') && (
              <Button onClick={() => openNewModal()}><Plus size={15} className="mr-1" /> New Request</Button>
            )}
          </div>
        ) : (
          <>
            {/* ── Search / Filter / Count — single row ── */}
            <div className="flex-none mb-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <MandatorySearchBar
                  fields={[
                    {
                      key: 'search',
                      label: 'Search',
                      type: 'text',
                      placeholder: 'Request no., type, location…',
                      value: reqSearch,
                      onChange: setReqSearch,
                      icon: <Search size={14} />,
                    },
                    {
                      key: 'bhk',
                      label: 'Quarter Type',
                      type: 'chips',
                      value: reqBhkFilter,
                      onChange: setReqBhkFilter,
                      options: [
                        { value: 'ALL', label: 'Any' },
                        ...QUARTER_TYPE_OPTIONS.map(t => ({ value: t, label: t })),
                      ],
                    },
                    {
                      key: 'sort',
                      label: 'Sort By',
                      type: 'chips',
                      value: reqSort,
                      onChange: v => setReqSort(v as 'newest' | 'oldest'),
                      options: [
                        { value: 'newest', label: 'Newest' },
                        { value: 'oldest', label: 'Oldest' },
                      ],
                    },
                  ]}
                  filterCount={reqToiletFilter.length + reqFloorFilter.length}
                  onFilterOpen={() => setFilterDrawerOpen(true)}
                />
              </div>
            </div>

          <div className="flex-1 min-h-0 overflow-hidden">
          <SplitLayout
            storageKey="qrSplit"
            defaultSplit={65}
            minLeft={40}
            maxLeft={80}
            onClose={() => setSelectedRequest(null)}
            renderRight={selectedRequest ? (controls) => {
              // In EO employee mode, show EO management right panel
              if (isEO && eoMode === 'employee') return (
                <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
                <EOActionPanel
                  selectedRequest={selectedRequest}
                  user={user}
                  isEO={isEO}
                  requests={requests}
                  tenantRequests={tenantRequests}
                  eoRightMode={eoRightMode}
                  setEoRightMode={setEoRightMode}
                  eoRejectReason={eoRejectReason}
                  setEoRejectReason={setEoRejectReason}
                  eoRejectSubmitting={eoRejectSubmitting}
                  handleEORejectRequest={handleEORejectRequest}
                  manualAllotPickerOpen={manualAllotPickerOpen}
                  setManualAllotPickerOpen={setManualAllotPickerOpen}
                  manualAllotSearch={manualAllotSearch}
                  setManualAllotSearch={setManualAllotSearch}
                  manualAllotQuarters={manualAllotQuarters}
                  manualAllotLoading={manualAllotLoading}
                  manualAllotSubmitting={manualAllotSubmitting}
                  handleManualAllot={handleManualAllot}
                  overrideAllotment={overrideAllotment}
                  overrideRequest={overrideRequest}
                  showOverrideModal={showOverrideModal}
                  setOverrideAllotment={setOverrideAllotment}
                  setOverrideRequest={setOverrideRequest}
                  setShowOverrideModal={setShowOverrideModal}
                  loadData={loadData}
                  approvalRecord={approvalRecord}
                  approvalChats={approvalChats}
                  approvalAction={approvalAction}
                  setApprovalAction={setApprovalAction}
                  approvalRemarks={approvalRemarks}
                  setApprovalRemarks={setApprovalRemarks}
                  approvalTargetLevel={approvalTargetLevel}
                  setApprovalTargetLevel={setApprovalTargetLevel}
                  approvalSubmitting={approvalSubmitting}
                  handleApproveLevel={handleApproveLevel}
                  handleSendClarification={handleSendClarification}
                  handleSaveAllotmentWorkflow={handleSaveAllotmentWorkflow}
                  savingAllotmentWorkflow={savingAllotmentWorkflow}
                  handleInitiateAllotmentApproval={handleInitiateAllotmentApproval}
                  initiatingAllotmentApproval={initiatingAllotmentApproval}
                  dpFilter={dpFilter}
                  requestApprovalRecord={requestApprovalRecord}
                  requestApprovalChats={requestApprovalChats}
                  requestApprovalAction={requestApprovalAction}
                  setRequestApprovalAction={setRequestApprovalAction}
                  requestApprovalRemarks={requestApprovalRemarks}
                  setRequestApprovalRemarks={setRequestApprovalRemarks}
                  requestApprovalTargetLevel={requestApprovalTargetLevel}
                  setRequestApprovalTargetLevel={setRequestApprovalTargetLevel}
                  requestApprovalSubmitting={requestApprovalSubmitting}
                  handleApproveRequestLevel={handleApproveRequestLevel}
                  handleSendRequestClarification={handleSendRequestClarification}
                  handleInitiateRequestApproval={handleInitiateRequestApproval}
                  requestApprovalWorkflows={requestApprovalWorkflows}
                  initiatingRequestApproval={initiatingRequestApproval}
                  inspections={inspections}
                  inspectionChats={inspectionChats}
                  selectedInspectionId={selectedInspectionId}
                  setSelectedInspectionId={setSelectedInspectionId}
                  inspectionPanel={inspectionPanel}
                  setInspectionPanel={setInspectionPanel}
                  inspectionOpeningRemark={inspectionOpeningRemark}
                  setInspectionOpeningRemark={setInspectionOpeningRemark}
                  inspectionInspectorName={inspectionInspectorName}
                  setInspectionInspectorName={setInspectionInspectorName}
                  inspectionInitialCondition={inspectionInitialCondition}
                  setInspectionInitialCondition={setInspectionInitialCondition}
                  inspectionChecklist={inspectionChecklist}
                  setInspectionChecklist={setInspectionChecklist}
                  inspectionChatMsg={inspectionChatMsg}
                  setInspectionChatMsg={setInspectionChatMsg}
                  inspectionSubmitting={inspectionSubmitting}
                  inspectionCloseRemarks={inspectionCloseRemarks}
                  setInspectionCloseRemarks={setInspectionCloseRemarks}
                  inspectionCondition={inspectionCondition}
                  setInspectionCondition={setInspectionCondition}
                  handleStartInspection={handleStartInspection}
                  handleSendInspectionChat={handleSendInspectionChat}
                  handleCloseInspection={handleCloseInspection}
                  inspectionChatMode={inspectionChatMode}
                  setInspectionChatMode={setInspectionChatMode}
                  handover={handover}
                  handoverKeyNo={handoverKeyNo}
                  setHandoverKeyNo={setHandoverKeyNo}
                  handoverRemarks={handoverRemarks}
                  setHandoverRemarks={setHandoverRemarks}
                  handoverDeadline={handoverDeadline}
                  setHandoverDeadline={setHandoverDeadline}
                  handoverInteriorFile={handoverInteriorFile}
                  setHandoverInteriorFile={setHandoverInteriorFile}
                  handoverReportFile={handoverReportFile}
                  setHandoverReportFile={setHandoverReportFile}
                  handoverSubmitting={handoverSubmitting}
                  handleCreateHandover={handleCreateHandover}
                  allotmentChats={allotmentChats}
                  allotmentChatMessage={allotmentChatMessage}
                  setAllotmentChatMessage={setAllotmentChatMessage}
                  allotmentChatFile={allotmentChatFile}
                  setAllotmentChatFile={setAllotmentChatFile}
                  allotmentChatSubmitting={allotmentChatSubmitting}
                  handleSendAllotmentChat={handleSendAllotmentChat}
                  allotmentChatMode={allotmentChatMode}
                  setAllotmentChatMode={setAllotmentChatMode}
                  showGuestInfoPopup={showGuestInfoPopup}
                  setShowGuestInfoPopup={setShowGuestInfoPopup}
                  guestForm={guestForm}
                  setGuestForm={setGuestForm}
                  guestAadhaarFile={guestAadhaarFile}
                  setGuestAadhaarFile={setGuestAadhaarFile}
                  guestPanFile={guestPanFile}
                  setGuestPanFile={setGuestPanFile}
                  guestOtherFiles={guestOtherFiles}
                  setGuestOtherFiles={setGuestOtherFiles}
                  guestSubmitting={guestSubmitting}
                  handleAddGuestInfo={handleAddGuestInfo}
                  handleDeallocate={handleDeallocate}
                  panelControls={controls}
                />
                </Suspense>
              );
              const s = selectedRequest.request_status;
              if (s === 'DRAFT') return (
                <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
                  <RightPanelDraft panelControls={controls} selectedRequest={selectedRequest} addToast={addToast} loadData={loadData} setSelectedRequest={setSelectedRequest} openNewModal={openNewModal}
                    allotmentChats={allotmentChats} allotmentChatMessage={allotmentChatMessage} setAllotmentChatMessage={setAllotmentChatMessage}
                    allotmentChatFile={allotmentChatFile} setAllotmentChatFile={setAllotmentChatFile}
                    allotmentChatSubmitting={allotmentChatSubmitting} handleSendAllotmentChat={handleSendAllotmentChat}
                    scrollToChat={chatOpenForId === selectedRequest.id} />
                </Suspense>
              );
              if (s === 'SUBMITTED') return (
                <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
                  <RightPanelSubmitted panelControls={controls} selectedRequest={selectedRequest} user={user} handleWithdraw={handleWithdraw}
                    allotmentChats={allotmentChats} allotmentChatMessage={allotmentChatMessage} setAllotmentChatMessage={setAllotmentChatMessage}
                    allotmentChatFile={allotmentChatFile} setAllotmentChatFile={setAllotmentChatFile}
                    allotmentChatSubmitting={allotmentChatSubmitting} handleSendAllotmentChat={handleSendAllotmentChat}
                    scrollToChat={chatOpenForId === selectedRequest.id} />
                </Suspense>
              );
              const panelFallback = <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
              if (isAllottedStatus(s)) return (
                <Suspense fallback={panelFallback}>
                  <RightPanelAllotted
                    panelControls={controls}
                    selectedRequest={selectedRequest}
                    isEO={isEO}
                    eoMode={eoMode}
                    allotmentChats={allotmentChats}
                    allotmentChatMessage={allotmentChatMessage}
                    setAllotmentChatMessage={setAllotmentChatMessage}
                    allotmentChatFile={allotmentChatFile}
                    setAllotmentChatFile={setAllotmentChatFile}
                    allotmentChatSubmitting={allotmentChatSubmitting}
                    handleSendAllotmentChat={handleSendAllotmentChat}
                    allotmentChatMode={allotmentChatMode}
                    setAllotmentChatMode={setAllotmentChatMode}
                    openActionPopup={openActionPopup as any}
                  />
                </Suspense>
              );
              if (isOccupiedStatus(s) && dpFilter === 'accepted') return (
                <Suspense fallback={panelFallback}>
                  <RightPanelAllotted
                    panelControls={controls}
                    selectedRequest={selectedRequest}
                    isEO={isEO}
                    eoMode={eoMode}
                    allotmentChats={allotmentChats}
                    allotmentChatMessage={allotmentChatMessage}
                    setAllotmentChatMessage={setAllotmentChatMessage}
                    allotmentChatFile={allotmentChatFile}
                    setAllotmentChatFile={setAllotmentChatFile}
                    allotmentChatSubmitting={allotmentChatSubmitting}
                    handleSendAllotmentChat={handleSendAllotmentChat}
                    allotmentChatMode={allotmentChatMode}
                    setAllotmentChatMode={setAllotmentChatMode}
                    openActionPopup={openActionPopup as any}
                  />
                </Suspense>
              );
              if (isOccupiedStatus(s)) return (
                <Suspense fallback={panelFallback}>
                  <RightPanelOccupied
                    panelControls={controls}
                    selectedRequest={selectedRequest}
                    isEO={isEO}
                    tenantRequests={tenantRequests}
                    serviceChats={serviceChats}
                    selectedServiceId={selectedServiceId}
                    setSelectedServiceId={setSelectedServiceId}
                    servicesHistoryMode={servicesHistoryMode}
                    setServicesHistoryMode={setServicesHistoryMode}
                    chatMessage={chatMessage}
                    setChatMessage={setChatMessage}
                    chatAttachFile={chatAttachFile}
                    setChatAttachFile={setChatAttachFile}
                    chatSubmitting={chatSubmitting}
                    handleSendChat={handleSendChat}
                    handleCloseService={handleCloseService}
                    rightAction={rightAction}
                    setRightAction={setRightAction}
                    actionReason={actionReason}
                    setActionReason={setActionReason}
                    actionRemarks={actionRemarks}
                    setActionRemarks={setActionRemarks}
                    actionDate={actionDate}
                    setActionDate={setActionDate}
                    actionDocUrl={actionDocUrl}
                    setActionDocUrl={setActionDocUrl}
                    actionSubmitting={actionSubmitting}
                    resetActionForm={resetActionForm}
                    handleTenantRequest={handleTenantRequest}
                    onUpgradeClick={openUpgradeModal}
                    onExchangeClick={openExchangeModal}
                    openActionPopup={openActionPopup as any}
                    setServiceChats={setServiceChats}
                    setPreviewQuarterId={setPreviewQuarterId}
                    setIsPreviewOpen={setIsPreviewOpen}
                    initialTab="chat"
                    allotmentChats={allotmentChats}
                    allotmentChatMessage={allotmentChatMessage}
                    setAllotmentChatMessage={setAllotmentChatMessage}
                    allotmentChatFile={allotmentChatFile}
                    setAllotmentChatFile={setAllotmentChatFile}
                    allotmentChatSubmitting={allotmentChatSubmitting}
                    handleSendAllotmentChat={handleSendAllotmentChat}
                    allotmentChatMode={allotmentChatMode}
                    setAllotmentChatMode={setAllotmentChatMode}
                  />
                </Suspense>
              );
              return (
                <Suspense fallback={panelFallback}>
                  <RightPanelPreferences
                    panelControls={controls}
                    selectedRequest={selectedRequest}
                    selectedPrefs={selectedPrefs}
                    selectedPrefQuarter={selectedPrefQuarter}
                    setSelectedPrefQuarter={setSelectedPrefQuarter}
                    setPreviewQuarterId={setPreviewQuarterId}
                    setIsPreviewOpen={setIsPreviewOpen}
                    openNewModal={openNewModal}
                    addToast={addToast}
                    loadData={loadData}
                  />
                </Suspense>
              );
            } : undefined}
            left={
            <div className="space-y-3 pr-1 pb-6">
              {/* Quarter request cards */}
              {(
                filteredRequests.length === 0 ? (
                  (dpFilter === 'allotted' || dpFilter === 'allocated_em') ? (
                    <div className="bg-white rounded-xl border border-gray-200 py-14 text-center px-6">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed mb-4 ${dpFilter === 'allocated_em' ? 'bg-green-50 border-green-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <Building2 size={28} className={dpFilter === 'allocated_em' ? 'text-green-300' : 'text-emerald-300'} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-700 mb-2">
                        {dpFilter === 'allocated_em' ? 'No Allocated Requests' : (isEO && eoMode === 'employee') ? 'No Allotted Requests' : 'No Quarter Allocated Yet'}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        {dpFilter === 'allocated_em'
                          ? 'Workflow-approved allocations awaiting employee acceptance will appear here.'
                          : (isEO && eoMode === 'employee')
                          ? 'Allotted requests pending approval will appear here once quarters are assigned.'
                          : 'Your quarter allocation will appear here once an Estate Officer processes and approves your request.'}
                      </p>
                      <button onClick={() => setDpFilter(isEO && eoMode === 'employee' ? 'submitted' : 'all')} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                        {isEO && eoMode === 'employee' ? 'View submitted requests →' : 'View all requests →'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
                      <Filter size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No requests match this filter.</p>
                      <button onClick={() => { setDpFilter('all'); setReqSearch(''); }} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
                    </div>
                  )
                ) : filteredRequests.map((req, reqIdx) => {
                  const scBase = statusConfig(req.request_status);
                  const sc = (dpFilter === 'accepted' && req.request_status === 'ACKNOWLEDGED')
                    ? { ...scBase, label: 'Accepted', cls: 'bg-sky-50 text-sky-700 border border-sky-200' }
                    : (dpFilter === 'allotted' && isEO && eoMode === 'employee' && req.request_status === 'ALLOTTED')
                    ? { ...scBase, label: 'Allotted', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
                    : (dpFilter === 'allocated_em' && req.request_status === 'ALLOTTED')
                    ? { ...scBase, label: 'Allocated', cls: 'bg-green-50 text-green-700 border border-green-200' }
                    : (dpFilter === 'occupied' && isOccupiedStatus(req.request_status))
                    ? { ...scBase, label: 'Occupied', cls: 'bg-teal-50 text-teal-700 border border-teal-200' }
                    : scBase;
                  const isSelected = selectedRequest?.id === req.id;
                  const isOccupied = isOccupiedStatus(req.request_status);
                  const allottedQ = req.allotment?.quarter as Quarter | undefined;
                  const prefQ = req.preferences?.[0]?.quarter as Quarter | undefined;
                  const thumbQ = allottedQ ?? prefQ;
                  const accentColor = statusAccentColor(req.request_status);
                  const reqFor = req.request_for ?? 'SELF';
                  const activeSvcs = tenantRequests.filter(tr => tr.allotment_id === req.allotment?.id && tr.request_status === 'PENDING');

                  return (
                    <React.Fragment key={req.id}>
                    <div
                      onClick={() => { setSelectedRequest(req); setSelectedServiceId(null); resetActionForm(); setChatOpenForId(null); }}
                      className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSelected ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex">
                        {/* Left status accent bar */}
                        <div className={`w-1 shrink-0 ${accentColor} rounded-l-xl`} />

                        {/* Thumbnail */}
                        <div
                          className="w-24 shrink-0 relative group/thumb bg-gray-100"
                          onClick={e => { e.stopPropagation(); openQuarterPreview(req); }}
                        >
                          <img
                            src={thumbQ ? getImage(thumbQ, reqIdx) : PLACEHOLDER_IMAGES[reqIdx % PLACEHOLDER_IMAGES.length]}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ minHeight: 88 }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5 shadow-md">
                              <Eye size={13} className="text-gray-700" />
                            </div>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 px-3.5 py-1.5 min-w-0 flex flex-col justify-between gap-0">
                          {/* Row 1: req no (left) + status badge (right) */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[10.5px] font-bold text-gray-700 tracking-wide">{req.request_number}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {req.sub_status === 'DECLINED' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 leading-none">Declined</span>
                              )}
                              {isEO && req.request_type === 'MEDICAL' && (() => {
                                const mc = (req as QuarterRequest & { medical_criticality?: MedicalCriticality | null }).medical_criticality;
                                if (mc === 'HIGH') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 leading-none flex items-center gap-0.5"><AlertTriangle size={8} />High</span>;
                                if (mc === 'MEDIUM') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 leading-none flex items-center gap-0.5"><AlertTriangle size={8} />Medium</span>;
                                if (mc === 'LOW') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 leading-none">Low</span>;
                                return <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100 leading-none">Medical</span>;
                              })()}
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${sc.cls}`}>{sc.icon}{sc.label}</span>
                            </div>
                          </div>

                          {/* Row 2a: request summary fields — shown for Draft/Submitted (no quarter assigned yet) */}
                          {(dpFilter === 'submitted' || dpFilter === 'draft') && (() => {
                            const rtb = getRequestTypeBadge(req.request_type ?? 'GENERAL');
                            const requestTypeValue = (
                              <span className={`text-[9.5px] border px-1 py-0.5 rounded font-semibold ${rtb.cls}`}>{rtb.label}</span>
                            );
                            const reqDetails: { label: string; value: React.ReactNode }[] = [
                              { label: 'Request Type', value: requestTypeValue },
                              ...(req.required_bhk_config ? [{ label: 'Quarter Type', value: req.required_bhk_config }] : []),
                              ...(req.preferred_location ? [{ label: 'Pref. Location', value: req.preferred_location }] : []),
                              ...(req.move_in_date ? [{ label: 'Move-in Date', value: fmtDate(req.move_in_date) }] : []),
                              ...(req.employee_id ? [{ label: 'Emp ID', value: req.employee_id }] : []),
                            ];
                            return (
                              <div className="flex flex-wrap gap-x-5 gap-y-0.5 mb-1">
                                {reqDetails.map((d, i) => (
                                  <div key={i} className="min-w-0">
                                    <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-wide leading-none">{d.label}</div>
                                    <div className="text-[10.5px] font-medium text-gray-700 leading-snug">{d.value}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Row 2b: quarter fields — flat, no background box (hidden for Draft/Submitted) */}
                          {dpFilter !== 'submitted' && dpFilter !== 'draft' && (() => {
                            const dq = allottedQ ?? prefQ;
                            if (!dq) {
                              return null;
                            }
                            const details = [
                              { label: 'Quarter / Unit No.', value: [dq.quarter_number, dq.unit_number].filter(Boolean).join(' / ') || '—' },
                              { label: 'Housing Style', value: dq.housing_style || '—' },
                              { label: 'Floor Details', value: dq.floor_number != null ? (dq.total_floors ? `Fl. ${dq.floor_number} of ${dq.total_floors}` : `Floor ${dq.floor_number}`) : '—' },
                              { label: 'Resident Type', value: dq.resident_type || '—' },
                              { label: 'Quota', value: dq.quota || '—' },
                              { label: 'Quarter Type', value: dq.quarter_type || '—' },
                              { label: 'Location', value: [dq.region, dq.location_area].filter(Boolean).join(' / ') || dq.district || '—' },
                              { label: 'Raised By (Emp ID)', value: req.employee_id || '—' },
                            ];
                            return (
                              <div className="flex flex-wrap gap-x-5 gap-y-0.5 mb-1">
                                {details.map((d, i) => (
                                  <div key={i} className="min-w-0">
                                    <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-wide leading-none">{d.label}</div>
                                    <div className="text-[10.5px] font-medium text-gray-700 leading-snug truncate">{d.value}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Footer: svcs tags + for/tp badges + actions — single non-wrapping row */}
                          <div className="mt-auto flex items-center gap-1 pt-0.5 border-t border-gray-100 overflow-hidden min-h-0">
                            <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                              {/* Svcs button + service type tags */}
                              {activeSvcs.length > 0 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setExpandedSvcsCardId(prev => prev === req.id ? null : req.id);
                                    }}
                                    className={`relative text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border transition-colors shrink-0 whitespace-nowrap ${expandedSvcsCardId === req.id ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                                  >
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    {activeSvcs.length} svc{activeSvcs.length > 1 ? 's' : ''}
                                    {expandedSvcsCardId === req.id ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                                  </button>
                                  {Array.from(new Set(activeSvcs.map(s => s.service_type))).map(stype => {
                                    const tagCls = stype === 'GRIEVANCE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      stype === 'MAINTENANCE' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                      stype === 'EXTEND' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      stype === 'UPGRADE' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                      stype === 'VACATE' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                      'bg-gray-50 text-gray-600 border-gray-200';
                                    const tagLabel = stype === 'EXTEND' ? 'Ext' :
                                      stype === 'MAINTENANCE' ? 'Maint' :
                                      stype === 'GRIEVANCE' ? 'Grievance' :
                                      stype.charAt(0) + stype.slice(1).toLowerCase();
                                    const count = activeSvcs.filter(s => s.service_type === stype).length;
                                    return (
                                      <span key={stype} className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border pointer-events-none shrink-0 whitespace-nowrap ${tagCls}`}>
                                        {tagLabel}{count > 1 ? ` ×${count}` : ''}
                                      </span>
                                    );
                                  })}
                                </>
                              )}
                              {!isOccupied && reqFor === 'EMPLOYEE' && req.on_behalf_employee_name && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                                  <UserCheck size={8} />For: {req.on_behalf_employee_name.split(' ')[0]}
                                </span>
                              )}
                              {!isOccupied && reqFor === 'TP' && req.tp_name && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                                  <UserPlus size={8} />TP: {req.tp_name.split(' ')[0]}
                                </span>
                              )}
                            </div>


                            {/* Allot + Reject inline actions — Estate Manager employee mode, SUBMITTED cards */}
                            {isEO && eoMode === 'employee' && req.request_status === 'SUBMITTED' && (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); setSelectedRequest(req); setManualAllotPickerOpen(true); setManualAllotSearch(''); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-600 text-white text-[10px] font-semibold hover:bg-teal-700 transition-colors shrink-0"
                                  title="Allot Quarter"
                                >
                                  <Home size={11} /> Allot
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setRejectModalReqId(req.id); setRejectModalReason(''); setRejectModalDocFile(null); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[10px] font-semibold hover:bg-red-100 transition-colors shrink-0"
                                  title="Reject Request"
                                >
                                  <XCircle size={11} /> Reject
                                </button>
                              </>
                            )}

                            {/* Accept / Decline buttons — Govt Official only, ALLOTTED cards */}
                            {!isEO && req.request_status === 'ALLOTTED' && req.allotment?.id && (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); setAcceptCardId(req.id); setAcceptCardRemarks(''); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-semibold hover:bg-emerald-700 transition-colors shrink-0"
                                  title="Accept Allotment"
                                >
                                  <ThumbsUp size={11} /> Accept
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setDeclineModalReqId(req.id); setDeclineModalRemarks(''); setDeclineModalDocUrl(null); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[10px] font-semibold hover:bg-red-100 transition-colors shrink-0"
                                  title="Decline Allotment"
                                >
                                  <ThumbsDown size={11} /> Decline
                                </button>
                              </>
                            )}

                            {/* Inline chat icon — hidden for terminal/vacated statuses */}
                            {!(['VACATED', 'WITHDRAWN', 'REJECTED', 'CANCELLED'] as string[]).includes(req.request_status) && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setChatOpenForId(req.id);
                                setSelectedRequest(req);
                                setSelectedServiceId(null);
                                resetActionForm();
                              }}
                              className="p-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-colors shrink-0"
                              title="Open Chat"
                            >
                              <MessageSquare size={12} />
                            </button>
                            )}

                            {/* Expand / collapse icon */}
                            <button
                              onClick={e => { e.stopPropagation(); setExpandedCardId(expandedCardId === req.id ? null : req.id); setMedDocFile(null); }}
                              className={`p-1 rounded-lg border transition-colors shrink-0 ${expandedCardId === req.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
                              title={expandedCardId === req.id ? 'Collapse' : 'Expand'}
                            >
                              {expandedCardId === req.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Action menu — only show when at least one action applies */}
                            {(() => {
                              const isOccupiedReq = req.request_status === 'ACKNOWLEDGED';
                              const hasAction =
                                (req.request_status === 'ALLOTTED' && dpFilter === 'allotted' && isEO && eoMode === 'employee' && !!req.allotment?.id) ||
                                (req.request_status === 'ALLOTTED' && dpFilter === 'allocated_em' && isEO && eoMode === 'employee' && !!req.allotment?.id) ||
                                (req.request_status === 'ALLOTTED' && dpFilter === 'allotted' && !isEO) ||
                                req.request_status === 'DRAFT' ||
                                (req.request_status === 'SUBMITTED' && !(isEO && eoMode === 'employee')) ||
                                (req.request_status === 'UPGRADE_REQUESTED' && !!req.allotment) ||
                                (isOccupiedReq && !!req.allotment);
                              if (!hasAction) return null;
                              return (
                                <button
                                  onClick={e => openMenu(e, req.id)}
                                  className={`p-1 rounded-lg border transition-colors shrink-0 ${openMenuId === req.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
                                  title="Actions"
                                >
                                  <MoreVertical size={12} />
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Inline Accept confirmation form */}

                      {/* Expand/collapse request details */}
                      {expandedCardId === req.id && (
                        <div
                          className="border-t border-gray-100 bg-gray-50/80 px-4 py-3 space-y-2.5"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Request fields — label + value rows */}
                          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden text-[11px]">
                            {req.request_reason && (
                              <div className="flex items-start gap-3 px-3 py-2 border-b border-gray-50">
                                <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium pt-0.5">Reason</span>
                                <span className="font-semibold text-gray-800 leading-snug">{req.request_reason}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                              <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Type of Request</span>
                              {(() => {
                                const rtb = getRequestTypeBadge(req.request_type ?? 'GENERAL');
                                return <span className={`text-[10px] border px-1.5 py-0.5 rounded-md font-semibold ${rtb.cls}`}>{rtb.label}</span>;
                              })()}
                            </div>
                            {isEO && req.request_type === 'MEDICAL' && (() => {
                              const current = (req as QuarterRequest & { medical_criticality?: MedicalCriticality | null }).medical_criticality ?? null;
                              const isSaving = critSavingId === req.id;
                              const opts: { value: MedicalCriticality; label: string; icon: React.ReactNode; activeCls: string; inactiveCls: string }[] = [
                                { value: 'HIGH',   label: 'High',   icon: <AlertTriangle size={10} />, activeCls: 'bg-red-600 text-white border-red-600 shadow-sm',    inactiveCls: 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' },
                                { value: 'MEDIUM', label: 'Medium', icon: <AlertTriangle size={10} />, activeCls: 'bg-amber-500 text-white border-amber-500 shadow-sm', inactiveCls: 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100' },
                                { value: 'LOW',    label: 'Low',    icon: <AlertTriangle size={10} />, activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-sm', inactiveCls: 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
                              ];
                              return (
                                <div className="px-3 py-2.5 border-b border-rose-100 bg-rose-50/40">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <AlertTriangle size={11} className="text-rose-500 shrink-0" />
                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Medical Criticality</span>
                                    {current && <span className="ml-auto text-[9px] font-medium text-gray-400 italic">click to change</span>}
                                    {!current && <span className="ml-auto text-[9px] font-medium text-gray-400 italic">not yet assessed</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {opts.map(o => (
                                      <button
                                        key={o.value}
                                        disabled={isSaving}
                                        onClick={e => { e.stopPropagation(); handleSetMedicalCriticality(req.id, current === o.value ? null : o.value); }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex-1 justify-center disabled:opacity-50 ${
                                          current === o.value ? o.activeCls : o.inactiveCls
                                        }`}
                                        title={current === o.value ? `Clear criticality` : `Set as ${o.label}`}
                                      >
                                        {o.icon}{o.label}
                                      </button>
                                    ))}
                                    {isSaving && <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin shrink-0" />}
                                  </div>
                                </div>
                              );
                            })()}
                            {req.preferred_location && (
                              <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Preferred Location</span>
                                <span className="font-semibold text-gray-800">{req.preferred_location}</span>
                              </div>
                            )}
                            {req.move_in_date && (
                              <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Move-in Date</span>
                                <span className="font-semibold text-gray-800">{fmtDate(req.move_in_date)}</span>
                              </div>
                            )}
                            {reqFor === 'EMPLOYEE' && req.on_behalf_employee_name && (
                              <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">On Behalf Of</span>
                                <span className="font-semibold text-blue-800">{req.on_behalf_employee_name}{req.on_behalf_employee_id ? ` · ${req.on_behalf_employee_id}` : ''}</span>
                              </div>
                            )}
                            {reqFor === 'TP' && req.tp_name && (
                              <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Third Party</span>
                                <span className="font-semibold text-amber-800">{req.tp_name}{req.tp_organization ? ` · ${req.tp_organization}` : ''}</span>
                              </div>
                            )}
                            {req.employee_notes && (
                              <div className={`flex items-start gap-3 px-3 py-2 ${(req.request_type === 'MEDICAL' || req.request_type === 'REFERENCE') && (requestDocUrls[req.id] ?? []).length > 0 ? 'border-b border-gray-50' : ''}`}>
                                <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium pt-0.5">Remarks</span>
                                <span className="text-amber-800 leading-snug">{req.employee_notes}</span>
                              </div>
                            )}
                            {(req.request_type === 'MEDICAL' || req.request_type === 'REFERENCE') && (requestDocUrls[req.id] ?? []).length > 0 && (
                              <div className="flex items-start gap-3 px-3 py-2">
                                <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium pt-1">Documents</span>
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                  {(requestDocUrls[req.id] ?? []).map((doc, idx) => (
                                    <a
                                      key={idx}
                                      href={doc.url}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition-colors group ${req.request_type === 'MEDICAL' ? 'bg-rose-50 border-rose-100 hover:border-rose-300 hover:bg-rose-100' : 'bg-amber-50 border-amber-100 hover:border-amber-300 hover:bg-amber-100'}`}
                                    >
                                      <FileText size={11} className={`shrink-0 ${req.request_type === 'MEDICAL' ? 'text-rose-500' : 'text-amber-500'}`} />
                                      <span className={`flex-1 text-[11px] font-medium truncate ${req.request_type === 'MEDICAL' ? 'text-rose-700' : 'text-amber-700'}`}>{doc.name}</span>
                                      <Download size={10} className={`shrink-0 ${req.request_type === 'MEDICAL' ? 'text-rose-400 group-hover:text-rose-600' : 'text-amber-400 group-hover:text-amber-600'}`} />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Medical document upload — employee side only */}
                          {!isEO && req.request_type === 'MEDICAL' && (
                            <div className="bg-rose-50 rounded-xl border border-rose-100 overflow-hidden text-[11px]">
                              <div className="px-3 py-1.5 bg-rose-100 border-b border-rose-200 flex items-center gap-1.5">
                                <Paperclip size={10} className="text-rose-500" />
                                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wide">Medical Supporting Documents</span>
                              </div>
                              {(requestDocUrls[req.id] ?? []).length > 0 && (
                                <div className="px-3 pt-2 flex flex-col gap-1">
                                  {(requestDocUrls[req.id] ?? []).map((doc, idx) => (
                                    <a
                                      key={idx}
                                      href={doc.url}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50 rounded-lg px-2.5 py-1.5 transition-colors group"
                                    >
                                      <FileText size={11} className="shrink-0 text-rose-500" />
                                      <span className="flex-1 text-[11px] font-medium truncate text-rose-700">{doc.name}</span>
                                      <Download size={10} className="shrink-0 text-rose-300 group-hover:text-rose-600" />
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div className="px-3 py-2.5 flex items-center gap-2">
                                <label className={`flex items-center gap-1.5 cursor-pointer flex-1 min-w-0 border rounded-lg px-2.5 py-1.5 transition-colors ${medDocFile ? 'bg-white border-rose-300' : 'bg-white border-rose-100 hover:border-rose-300'}`}>
                                  <Upload size={11} className="shrink-0 text-rose-400" />
                                  <span className="text-[11px] text-rose-600 truncate">{medDocFile ? medDocFile.name : 'Choose file to upload…'}</span>
                                  <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    className="hidden"
                                    onChange={e => setMedDocFile(e.target.files?.[0] ?? null)}
                                  />
                                </label>
                                <button
                                  disabled={!medDocFile || medDocSubmitting}
                                  onClick={async () => {
                                    if (!medDocFile) return;
                                    setMedDocSubmitting(true);
                                    try {
                                      await quartersService.uploadMedicalDoc(req.id, medDocFile);
                                      setMedDocFile(null);
                                      setRequestDocUrls(prev => { const next = { ...prev }; delete next[req.id]; return next; });
                                      addToast('Document uploaded successfully', 'success');
                                    } catch {
                                      addToast('Upload failed. Please try again.', 'error');
                                    } finally {
                                      setMedDocSubmitting(false);
                                    }
                                  }}
                                  className="shrink-0 flex items-center gap-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                  {medDocSubmitting ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                                  <span>Upload</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Decline remarks — shown when allotment was declined */}
                          {req.sub_status === 'DECLINED' && req.allotment?.rejection_reason && (
                            <div className="bg-rose-50 rounded-xl border border-rose-200 overflow-hidden text-[11px]">
                              <div className="px-3 py-1.5 bg-rose-100 border-b border-rose-200 flex items-center gap-1.5">
                                <ThumbsDown size={10} className="text-rose-600" />
                                <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wide">Decline Remarks</span>
                              </div>
                              <div className="px-3 py-2 text-rose-800 leading-snug">{req.allotment.rejection_reason}</div>
                            </div>
                          )}

                          {/* Allotted quarter details */}
                          {allottedQ && (
                            <div className="bg-white rounded-xl border border-teal-100 overflow-hidden text-[11px]">
                              <div className="px-3 py-1.5 bg-teal-50 border-b border-teal-100">
                                <span className="text-[9px] font-bold text-teal-600 uppercase tracking-wide">Quarter Details</span>
                              </div>
                              {allottedQ.quarter_type && (
                                <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                  <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Type</span>
                                  <span className="font-semibold text-gray-800">{allottedQ.quarter_type}</span>
                                </div>
                              )}
                              {allottedQ.block_name && (
                                <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                  <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Block</span>
                                  <span className="font-semibold text-gray-800">{allottedQ.block_name}</span>
                                </div>
                              )}
                              {allottedQ.floor_number != null && (
                                <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                  <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Floor</span>
                                  <span className="font-semibold text-gray-800">{allottedQ.floor_number}</span>
                                </div>
                              )}
                              {allottedQ.housing_style && (
                                <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                  <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Housing Style</span>
                                  <span className="font-semibold text-gray-800">{allottedQ.housing_style}</span>
                                </div>
                              )}
                              {allottedQ.furnishing_status && (
                                <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
                                  <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Furnishing</span>
                                  <span className="font-semibold text-gray-800">{allottedQ.furnishing_status.replace(/_/g, ' ')}</span>
                                </div>
                              )}
                              {allottedQ.area_sqft > 0 && (
                                <div className="flex items-center gap-3 px-3 py-2">
                                  <span className="w-28 shrink-0 text-[10px] text-gray-400 font-medium">Area</span>
                                  <span className="font-semibold text-gray-800">{allottedQ.area_sqft} sq.ft</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Preference quarters list */}
                          {!isOccupied && (req.preferences ?? []).length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Star size={11} className="text-amber-500" />
                                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Preferred Quarters</span>
                                <span className="text-[9px] text-gray-400">({(req.preferences ?? []).length})</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                {(req.preferences ?? [])
                                  .slice()
                                  .sort((a, b) => a.preference_rank - b.preference_rank)
                                  .map((pref) => {
                                    const pq = pref.quarter as Quarter | undefined;
                                    if (!pq) return null;
                                    return (
                                      <div key={pref.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                                          <div className="w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{pref.preference_rank}</div>
                                          <span className="text-[11px] font-semibold text-gray-800">{pq.quarter_number}</span>
                                          <span className="ml-auto text-[10px] font-semibold text-gray-600 shrink-0">{fmtINR(pq.monthly_rent)}/mo</span>
                                        </div>
                                        <div className="px-3 py-1.5 text-[10px] space-y-0.5">
                                          {pq.quarter_type && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Type</span><span className="font-medium text-gray-700">{pq.quarter_type}</span></div>}
                                          {pq.block_name && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Block</span><span className="font-medium text-gray-700">{pq.block_name}</span></div>}
                                          {pq.floor_number != null && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Floor</span><span className="font-medium text-gray-700">{pq.floor_number}</span></div>}
                                          {pq.housing_style && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Style</span><span className="font-medium text-gray-700">{pq.housing_style}</span></div>}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Uploaded documents — only for MEDICAL and REFERENCE request types */}
                          {(req.request_type === 'MEDICAL' || req.request_type === 'REFERENCE') && (
                            <div className={`rounded-xl border overflow-hidden text-[11px] ${req.request_type === 'MEDICAL' ? 'border-rose-100' : 'border-amber-100'}`}>
                              <div className={`px-3 py-1.5 border-b flex items-center gap-1.5 ${req.request_type === 'MEDICAL' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                                <Paperclip size={10} className={req.request_type === 'MEDICAL' ? 'text-rose-500' : 'text-amber-500'} />
                                <span className={`text-[9px] font-bold uppercase tracking-wide ${req.request_type === 'MEDICAL' ? 'text-rose-600' : 'text-amber-600'}`}>
                                  Supporting Documents — {req.request_type === 'MEDICAL' ? 'Medical' : 'Reference/Special'}
                                </span>
                                <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${req.request_type === 'MEDICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {(requestDocUrls[req.id] ?? []).length} file{(requestDocUrls[req.id] ?? []).length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {(requestDocUrls[req.id] ?? []).length > 0 ? (
                                <div className="p-2 flex flex-col gap-1 bg-white">
                                  {(requestDocUrls[req.id] ?? []).map((doc, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 ${req.request_type === 'MEDICAL' ? 'border-rose-100 bg-rose-50' : 'border-amber-100 bg-amber-50'}`}>
                                      <FileText size={11} className={`shrink-0 ${req.request_type === 'MEDICAL' ? 'text-rose-500' : 'text-amber-500'}`} />
                                      <span className={`flex-1 text-[11px] font-medium truncate ${req.request_type === 'MEDICAL' ? 'text-rose-700' : 'text-amber-700'}`}>{doc.name}</span>
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="View"
                                        className={`shrink-0 p-1 rounded transition-colors ${req.request_type === 'MEDICAL' ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-100' : 'text-amber-400 hover:text-amber-600 hover:bg-amber-100'}`}
                                      >
                                        <ExternalLink size={11} />
                                      </a>
                                      <a
                                        href={doc.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Download"
                                        className={`shrink-0 p-1 rounded transition-colors ${req.request_type === 'MEDICAL' ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-100' : 'text-amber-400 hover:text-amber-600 hover:bg-amber-100'}`}
                                      >
                                        <Download size={11} />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-3 py-3 bg-white flex items-center gap-2">
                                  <FileText size={12} className={req.request_type === 'MEDICAL' ? 'text-rose-200' : 'text-amber-200'} />
                                  <span className={`text-[11px] italic ${req.request_type === 'MEDICAL' ? 'text-rose-300' : 'text-amber-300'}`}>No supporting documents attached yet</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Service sub-record cards — full card style, shown when svcs badge toggled ── */}
                    {expandedSvcsCardId === req.id && activeSvcs.length > 0 && (
                      <div className="relative ml-4 mt-1 mb-1">
                        {/* Vertical connector line */}
                        <div className="absolute left-0 top-0 bottom-4 w-0.5 bg-teal-200 rounded-full" />
                        <div className="space-y-1.5 pl-5">
                          {activeSvcs.map((svc, svcIdx) => {
                            const stc = serviceTypeConfig(svc.service_type);
                            const tsc = tenantStatusConfig(svc.request_status);
                            const isSvcSelected = selectedServiceId === svc.id && isSelected;
                            const hasSubject = (svc.service_type === 'GRIEVANCE' || svc.service_type === 'MAINTENANCE') && (svc.grievance_subject || svc.remarks);
                            const titleText = (hasSubject ? (svc.grievance_subject || svc.remarks) : svc.reason) || stc.label;
                            const subtitleText = hasSubject && svc.remarks ? svc.remarks : (svc.reason ? svc.reason : '');
                            const ctrlRef = `SVC-${svc.id.slice(-6).toUpperCase()}`;
                            const isLast = svcIdx === activeSvcs.length - 1;

                            // Accent bar color by service type
                            const svcAccent = {
                              GRIEVANCE: 'bg-rose-500',
                              MAINTENANCE: 'bg-slate-400',
                              EXTEND: 'bg-amber-500',
                              UPGRADE: 'bg-sky-500',
                              VACATE: 'bg-orange-500',
                            }[svc.service_type] ?? 'bg-gray-400';

                            // Icon zone background by service type
                            const svcIconBg = {
                              GRIEVANCE: 'bg-rose-50',
                              MAINTENANCE: 'bg-slate-50',
                              EXTEND: 'bg-amber-50',
                              UPGRADE: 'bg-sky-50',
                              VACATE: 'bg-orange-50',
                            }[svc.service_type] ?? 'bg-gray-50';

                            return (
                              <div key={svc.id} className="relative">
                                {/* Horizontal nub */}
                                <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-teal-200 rounded-full" />
                                {/* Junction dot */}
                                <div className={`absolute -left-[22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors ${isSvcSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-teal-300'}`} />
                                {/* Cap bottom of vertical line at last item */}
                                {isLast && (
                                  <div className="absolute -left-[1px] top-1/2 bottom-0 w-0.5 bg-white" />
                                )}

                                {/* Full record card */}
                                <div
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedRequest(req);
                                    setSelectedServiceId(svc.id);
                                    resetActionForm();
                                  }}
                                  className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSvcSelected ? `border-2 shadow-lg ring-2 ${
                                    svc.service_type === 'GRIEVANCE' ? 'border-rose-400 ring-rose-100' :
                                    svc.service_type === 'MAINTENANCE' ? 'border-slate-400 ring-slate-100' :
                                    svc.service_type === 'EXTEND' ? 'border-amber-400 ring-amber-100' :
                                    svc.service_type === 'UPGRADE' ? 'border-sky-400 ring-sky-100' :
                                    'border-orange-400 ring-orange-100'
                                  }` : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                  <div className="flex min-h-[100px]">
                                    {/* Left accent bar */}
                                    <div className={`w-1 shrink-0 ${svcAccent} rounded-l-xl`} />

                                    {/* Icon zone (replaces thumbnail) */}
                                    <div className={`w-14 shrink-0 flex items-center justify-center ${svcIconBg}`}>
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stc.cls} shadow-sm`}>
                                        <span className="scale-125">{stc.icon}</span>
                                      </div>
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 px-3 py-2.5 min-w-0 flex flex-col justify-between">
                                      {/* Row 1: ref + status */}
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-mono text-[10px] font-semibold text-gray-400 tracking-wide">{ctrlRef}</span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tsc.cls}`}>{tsc.label}</span>
                                      </div>

                                      {/* Row 2: title + subtitle */}
                                      <div className="mb-1.5">
                                        <div className="font-bold text-gray-900 text-[13px] leading-tight truncate">{titleText}</div>
                                        {subtitleText && titleText !== subtitleText && (
                                          <div className="text-[11px] text-gray-400 truncate mt-0.5">{subtitleText}</div>
                                        )}
                                      </div>

                                      {/* Row 3: meta chips */}
                                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border flex items-center gap-0.5 ${stc.cls}`}>
                                          {stc.icon}<span className="ml-0.5">{stc.label}</span>
                                        </span>
                                        {svc.urgency_level && svc.urgency_level !== 'NORMAL' && svc.urgency_level !== 'LOW' && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${svc.urgency_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {svc.urgency_level}
                                          </span>
                                        )}
                                        {svc.requested_date && (
                                          <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                            <CalendarDays size={9} />{fmtDate(svc.requested_date)}
                                          </span>
                                        )}
                                        {svc.document_url && (
                                          <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                            <Paperclip size={9} />Doc
                                          </span>
                                        )}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                          <Clock size={9} />{fmtDate(svc.created_at)}
                                        </span>
                                      </div>

                                      {/* Row 4: actions only */}
                                      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-gray-100">
                                        {/* Chat button */}
                                        <button
                                          onClick={e => { e.stopPropagation(); setSelectedRequest(req); setSelectedServiceId(svc.id); resetActionForm(); }}
                                          className="p-1 rounded-md border border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors shrink-0"
                                          title="Open Chat"
                                        >
                                          <MessageSquare size={11} />
                                        </button>
                                        {/* Three-dot action menu — EO employee mode only */}
                                        {isEO && eoMode === 'employee' && (() => {
                                          const isMaintenanceOrGrievance = svc.service_type === 'MAINTENANCE' || svc.service_type === 'GRIEVANCE';
                                          const isExtend = svc.service_type === 'EXTEND';
                                          const isVacate = svc.service_type === 'VACATE';
                                          const isPending = svc.request_status === 'PENDING';
                                          const isInProgress = svc.request_status === 'IN_PROGRESS';
                                          if (!isMaintenanceOrGrievance && !isExtend && !isVacate) return null;
                                          if (!isPending && !isInProgress) return null;
                                          return (
                                            <div className="relative shrink-0">
                                              <button
                                                onClick={e => { e.stopPropagation(); setSvcMenuOpenId(prev => prev === svc.id ? null : svc.id); }}
                                                className="p-1 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
                                                title="Actions"
                                              >
                                                <MoreVertical size={11} />
                                              </button>
                                              {svcMenuOpenId === svc.id && (
                                                <div
                                                  className="absolute right-0 bottom-7 z-30 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-xs"
                                                  onClick={e => e.stopPropagation()}
                                                >
                                                  {isMaintenanceOrGrievance && (
                                                    <>
                                                      {isPending && (
                                                        <button
                                                          onClick={() => handleSvcStatusUpdate(svc.id, 'IN_PROGRESS')}
                                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-50 text-amber-700 font-medium transition-colors rounded-t-xl"
                                                        >
                                                          <RefreshCw size={11} />In Progress
                                                        </button>
                                                      )}
                                                      <button
                                                        onClick={() => handleSvcStatusUpdate(svc.id, 'RESOLVED')}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 text-emerald-700 font-medium transition-colors rounded-b-xl"
                                                      >
                                                        <CheckCircle size={11} />Resolved
                                                      </button>
                                                    </>
                                                  )}
                                                  {isExtend && isPending && (
                                                    <>
                                                      <button
                                                        onClick={() => { setSvcMenuOpenId(null); setEoTrId(svc.id); setEoTrAction('approve'); setEoTrNotes(''); setExpandedSvcDetailId(svc.id); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 text-emerald-700 font-medium transition-colors rounded-t-xl"
                                                      >
                                                        <ThumbsUp size={11} />Accept
                                                      </button>
                                                      <button
                                                        onClick={() => { setSvcMenuOpenId(null); setEoTrId(svc.id); setEoTrAction('reject'); setEoTrNotes(''); setExpandedSvcDetailId(svc.id); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-700 font-medium transition-colors rounded-b-xl"
                                                      >
                                                        <ThumbsDown size={11} />Reject
                                                      </button>
                                                    </>
                                                  )}
                                                  {isVacate && isPending && (
                                                    <button
                                                      onClick={() => { setSvcMenuOpenId(null); setInspectTarget(req); setInspectRemarks(''); setInspectCondition('GOOD'); setInspectChecklist(buildDefaultChecklist()); setInspectInspectorName(''); }}
                                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-blue-700 font-medium transition-colors rounded-xl"
                                                    >
                                                      <ClipboardCheck size={11} />Inspection
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                        {/* Expand / collapse */}
                                        <button
                                          onClick={e => { e.stopPropagation(); setExpandedSvcDetailId(expandedSvcDetailId === svc.id ? null : svc.id); }}
                                          className={`p-1 rounded-md border transition-colors shrink-0 ${expandedSvcDetailId === svc.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
                                          title={expandedSvcDetailId === svc.id ? 'Collapse' : 'Expand details'}
                                        >
                                          {expandedSvcDetailId === svc.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expanded detail panel */}
                                  {expandedSvcDetailId === svc.id && (
                                    <div
                                      className="border-t border-gray-100 bg-gray-50/90 px-4 py-3 space-y-2.5"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      {svc.reason && (
                                        <div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Reason</div>
                                          <div className="text-[11px] text-gray-800 leading-relaxed">{svc.reason}</div>
                                        </div>
                                      )}
                                      {hasSubject && svc.grievance_subject && (
                                        <div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Subject</div>
                                          <div className="text-[11px] text-gray-800 leading-relaxed">{svc.grievance_subject}</div>
                                        </div>
                                      )}
                                      {svc.remarks && (
                                        <div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Remarks</div>
                                          <div className="text-[11px] text-gray-700 leading-relaxed">{svc.remarks}</div>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 gap-2">
                                        {svc.urgency_level && svc.urgency_level !== 'NORMAL' && (
                                          <div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Urgency</div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border inline-block ${svc.urgency_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{svc.urgency_level}</span>
                                          </div>
                                        )}
                                        {svc.requested_date && (
                                          <div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">
                                              {svc.service_type === 'EXTEND' ? 'Extension Until' : svc.service_type === 'VACATE' ? 'Vacate By' : 'Requested Date'}
                                            </div>
                                            <div className="text-[11px] text-gray-800 flex items-center gap-0.5"><CalendarDays size={10} className="text-gray-400" />{fmtDate(svc.requested_date)}</div>
                                          </div>
                                        )}
                                        {svc.document_url && (
                                          <div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Document</div>
                                            <a href={svc.document_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-1">
                                              <ExternalLink size={9} />View
                                            </a>
                                          </div>
                                        )}
                                      </div>

                                      {/* EO confirm form — shown after selecting Approve/Reject from action menu */}
                                      {isEO && eoMode === 'employee' && svc.request_status === 'PENDING' && eoTrId === svc.id && eoTrAction && (
                                        <div className="space-y-2 pt-1 border-t border-gray-200">
                                          <textarea value={eoTrNotes} onChange={e => setEoTrNotes(e.target.value)} rows={2}
                                            placeholder={eoTrAction === 'reject' ? 'Rejection reason (required)…' : 'EO notes (optional)…'}
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none resize-none bg-white text-gray-800" />
                                          <div className="flex gap-2">
                                            <button onClick={() => { setEoTrId(null); setEoTrAction(null); setEoTrNotes(''); }}
                                              className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-white">Cancel</button>
                                            {eoTrAction === 'approve'
                                              ? <button onClick={() => handleEOActionTR('approve')} disabled={eoTrSubmitting}
                                                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">{eoTrSubmitting ? '…' : 'Approve'}</button>
                                              : <button onClick={() => handleEOActionTR('reject')} disabled={eoTrSubmitting}
                                                  className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50">{eoTrSubmitting ? '…' : 'Reject'}</button>}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    </React.Fragment>
                  );
                })
              )}
            </div>
            }
          />
          </div>

            {/* ── Portal action menu (renders at fixed viewport coords to avoid clipping) */}
            {openMenuId && menuPos && (() => {
              const req = filteredRequests.find(r => r.id === openMenuId);
              if (!req) return null;
              const isOccupied = req.request_status === 'ACKNOWLEDGED';
              return createPortal(
                <div
                  ref={menuRef}
                  style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, minWidth: 200 }}
                  className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="py-1">
                    {/* EM: Allotted filter — pending-approval allotments (Override + Deallocate) */}
                    {req.request_status === 'ALLOTTED' && dpFilter === 'allotted' && isEO && eoMode === 'employee' && req.allotment?.id && (
                      <>
                        <div className="px-4 pt-2 pb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Allotted Actions</span></div>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Eye size={12} className="text-emerald-600" /></span>
                          View Detail
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null); setMenuPos(null);
                            const a = { ...req.allotment!, request: req };
                            setOverrideAllotment(a as QuarterAllotment);
                            setOverrideRequest(req);
                            setShowOverrideModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><RefreshCw size={12} className="text-amber-600" /></span>
                          Override Allotment
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); handleDeallocate(req.allotment!.id, req.id); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><Trash2 size={12} className="text-red-500" /></span>
                          Deallocate
                        </button>
                      </>
                    )}
                    {/* EM: Allocated filter — approved allotments (Override + Deallocate) */}
                    {req.request_status === 'ALLOTTED' && dpFilter === 'allocated_em' && isEO && eoMode === 'employee' && req.allotment?.id && (
                      <>
                        <div className="px-4 pt-2 pb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Allocated Actions</span></div>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><Eye size={12} className="text-green-600" /></span>
                          View Detail
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null); setMenuPos(null);
                            const a = { ...req.allotment!, request: req };
                            setOverrideAllotment(a as QuarterAllotment);
                            setOverrideRequest(req);
                            setShowOverrideModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><RefreshCw size={12} className="text-amber-600" /></span>
                          Override Allotment
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); handleDeallocate(req.allotment!.id, req.id); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><Trash2 size={12} className="text-red-500" /></span>
                          Deallocate
                        </button>
                      </>
                    )}
                    {/* Govt official / EM self: Allocated filter — simple detail view */}
                    {req.request_status === 'ALLOTTED' && dpFilter === 'allotted' && !isEO && (
                      <button
                        onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Eye size={12} className="text-emerald-600" /></span>
                        Detail
                      </button>
                    )}
                    {req.request_status === 'DRAFT' && (
                      <button
                        onClick={() => { setOpenMenuId(null); setMenuPos(null); openNewModal(req); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><FileText size={12} className="text-blue-600" /></span>
                        Modify Request
                      </button>
                    )}
                    {req.request_status === 'DRAFT' && (
                      <button
                        onClick={() => { setOpenMenuId(null); setMenuPos(null); /* cancel */ quartersService.cancelRequest(req.id).then(() => { addToast('Request cancelled', 'success'); loadData(); }).catch(() => addToast('Failed', 'error')); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><Trash2 size={12} className="text-red-500" /></span>
                        Cancel Draft
                      </button>
                    )}
                    {req.request_status === 'SUBMITTED' && !(isEO && eoMode === 'employee') && (
                      <button
                        onClick={() => { setOpenMenuId(null); setMenuPos(null); handleWithdraw(req.id); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><XCircle size={12} className="text-red-500" /></span>
                        Withdraw Request
                      </button>
                    )}
                    {req.request_status === 'UPGRADE_REQUESTED' && req.allotment && (
                      <>
                        <div className="px-4 pt-2 pb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Allotment</span></div>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><ThumbsUp size={12} className="text-emerald-600" /></span>
                          Accept Upgrade
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><ThumbsDown size={12} className="text-red-500" /></span>
                          Decline Upgrade
                        </button>
                      </>
                    )}
                    {isOccupied && req.allotment && dpFilter === 'accepted' && (
                      <>
                        <div className="px-4 pt-2 pb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Actions</span></div>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><Eye size={12} className="text-blue-600" /></span>
                          View Detail
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setInspectTarget(req); setInspectRemarks(''); setInspectCondition('GOOD'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center shrink-0"><HardHat size={12} className="text-sky-600" /></span>
                          New Inspection
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('HANDOVER', req.id, req.allotment!.id); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Key size={12} className="text-emerald-600" /></span>
                          Handover
                        </button>
                      </>
                    )}
                    {isOccupied && req.allotment && dpFilter !== 'accepted' && (() => {
                      const menuHasActiveSvc = ['EXTEND_REQUESTED', 'VACATE_REQUESTED', 'EXCHANGE_REQUESTED'].includes(req.request_status);
                      return (
                        <>
                          <div className="px-4 pt-2 pb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Services</span></div>
                          {!menuHasActiveSvc ? (
                            <>
                              <button
                                onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('EXTEND', req.id, req.allotment!.id); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><RefreshCw size={12} className="text-amber-600" /></span>
                                Retention
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); openUpgradeModal(); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center shrink-0"><ArrowRightCircle size={12} className="text-sky-600" /></span>
                                Upgrade Quarter
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); openExchangeModal(); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0"><GitMerge size={12} className="text-teal-600" /></span>
                                Mutual Exchange
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('VACATE', req.id, req.allotment!.id); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center shrink-0"><LogOut size={12} className="text-orange-600" /></span>
                                Vacate Quarter
                              </button>
                            </>
                          ) : (
                            <div className="px-4 py-2 text-[10px] text-orange-600 italic">Extend / Upgrade / Vacate pending EO review</div>
                          )}
                          <button
                            onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('GRIEVANCE', req.id, req.allotment!.id); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0"><AlertCircle size={12} className="text-rose-600" /></span>
                            Raise Grievance
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('MAINTENANCE', req.id, req.allotment!.id); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Wrench size={12} className="text-slate-600" /></span>
                            Maintenance
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); setMenuPos(null); navigate(`${ROUTES.QUARTERS_RENT}?allotment_id=${req.allotment!.id}`); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0"><IndianRupee size={12} className="text-teal-600" /></span>
                            Rent Details
                          </button>
                        </>
                      );
                    })()}
                    {/* Log Details — visible for all roles */}
                    <div className="mx-2 border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setOpenMenuId(null); setMenuPos(null); openQuarterLog(req); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><ClipboardList size={12} className="text-slate-600" /></span>
                      Log Details
                    </button>
                  </div>
                </div>,
                document.body
              );
            })()}

          </>
        )}
      </main>

      {/* ── New Inspection Modal (Accepted DP filter) ────────────────────── */}
      {inspectTarget && (
        <InspectionFormModal
          requestRef={inspectTarget.request_number}
          quarterRef={inspectTarget.allotment?.quarter?.quarter_number ?? undefined}
          inspectorName={inspectInspectorName}
          openingRemarks={inspectRemarks}
          condition={inspectCondition}
          checklist={inspectChecklist}
          submitting={inspectSubmitting}
          onInspectorNameChange={setInspectInspectorName}
          onOpeningRemarksChange={setInspectRemarks}
          onConditionChange={setInspectCondition}
          onChecklistChange={setInspectChecklist}
          onClose={() => {
            setInspectTarget(null);
            setInspectRemarks('');
            setInspectInspectorName('');
            setInspectCondition('GOOD');
            setInspectChecklist(buildDefaultChecklist());
          }}
          onSubmit={handleStartAcceptedInspection}
        />
      )}

      {/* ── Decline Allotment Modal ──────────────────────────────────────── */}
      <DeclineAllotmentModal
        reqId={declineModalReqId}
        remarks={declineModalRemarks}
        docUrl={declineModalDocUrl}
        submitting={declineModalSubmitting}
        onClose={() => { setDeclineModalReqId(null); setDeclineModalRemarks(''); setDeclineModalDocUrl(null); }}
        onRemarksChange={setDeclineModalRemarks}
        onDocChange={setDeclineModalDocUrl}
        onDecline={handleDeclineModalSubmit}
      />
      <AcceptAllotmentModal
        reqId={acceptCardId}
        remarks={acceptCardRemarks}
        submitting={acceptCardSubmitting}
        onClose={() => { setAcceptCardId(null); setAcceptCardRemarks(''); }}
        onRemarksChange={setAcceptCardRemarks}
        onConfirm={() => {
          const req = requests.find(r => r.id === acceptCardId);
          if (req) handleCardAcknowledge(req);
        }}
      />

      {/* ── EO Inline Reject Modal ───────────────────────────────────── */}
      {rejectModalReqId && createPortal(
        <div
          className="fixed inset-0 z-[850] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => { setRejectModalReqId(null); setRejectModalReason(''); setRejectModalDocFile(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle size={16} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Reject Request</h3>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {requests.find(r => r.id === rejectModalReqId)?.request_number ?? rejectModalReqId.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setRejectModalReqId(null); setRejectModalReason(''); setRejectModalDocFile(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Rejection Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectModalReason}
                  onChange={e => setRejectModalReason(e.target.value)}
                  placeholder="Enter the reason for rejecting this request…"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Supporting Document <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <label className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors">
                  <Paperclip size={14} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate flex-1">
                    {rejectModalDocFile ? rejectModalDocFile.name : 'Click to attach a file…'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => setRejectModalDocFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {rejectModalDocFile && (
                  <button
                    onClick={() => setRejectModalDocFile(null)}
                    className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <XCircle size={10} /> Remove file
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2.5 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setRejectModalReqId(null); setRejectModalReason(''); setRejectModalDocFile(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectModalSubmit}
                disabled={rejectModalSubmitting || !rejectModalReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rejectModalSubmitting ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Rejecting…</>
                ) : (
                  <><XCircle size={14} /> Confirm Rejection</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Mobile filter drawer ──────────────────────────────────────── */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        activeFilterCount={activeFilterCount}
        onClearAll={() => {
          setReqSearch(''); setReqBhkFilter('ALL'); setReqToiletFilter([]); setReqFloorFilter([]);
          setReqHousingStyleFilter(''); setReqRequestTypeFilter([]); setReqLocationFilter('');
          setReqDateFrom(''); setReqDateTo(''); setReqGradeFilter('');
          setReqApprovalStatusFilter([]); setReqOccupancyStatusFilter([]);
          setReqUnitNumberFilter('');
          setReqOccupiedDateFrom(''); setReqOccupiedDateTo('');
          setReqDeclinedDateFrom(''); setReqDeclinedDateTo('');
        }}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Number, type, location…" value={reqSearch} onChange={e => setReqSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Quarter Type</label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', ...QUARTER_TYPE_OPTIONS] as string[]).map(v => (
                <button key={v} onClick={() => setReqBhkFilter(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqBhkFilter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {v === 'ALL' ? 'Any' : v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Toilet Type</label>
            <div className="flex flex-wrap gap-2">
              {['Indian', 'Western', 'Both'].map(v => (
                <button key={v} onClick={() => setReqToiletFilter(prev =>
                  prev.includes(v) ? prev.filter(t => t !== v) : [...prev, v]
                )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqToiletFilter.includes(v) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Floor</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: 'Ground' },
                { value: 1, label: '1st' },
                { value: 2, label: '2nd' },
                { value: 3, label: '3rd' },
                { value: 4, label: '4th+' },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setReqFloorFilter(prev =>
                  prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
                )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqFloorFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* ── Estate Manager extra filters ── */}
          {isEO && eoMode === 'employee' && (<>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Housing Style</label>
              <div className="flex flex-wrap gap-2">
                {['', 'Apartment', 'Independent', 'Row House', 'Duplex', 'Studio'].map(v => (
                  <button key={v} onClick={() => setReqHousingStyleFilter(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqHousingStyleFilter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {v === '' ? 'Any' : v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Request Type</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'GENERAL', label: 'General' }, { value: 'MEDICAL', label: 'Medical' }, { value: 'REFERENCE', label: 'Reference' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setReqRequestTypeFilter(prev =>
                    prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
                  )}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqRequestTypeFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Sector / Location / Area</label>
              <input type="text" placeholder="e.g. Sector 4, North Block…" value={reqLocationFilter} onChange={e => setReqLocationFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Request Date</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">From</span>
                  <input type="date" value={reqDateFrom} onChange={e => setReqDateFrom(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">To</span>
                  <input type="date" value={reqDateTo} onChange={e => setReqDateTo(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Grade</label>
              <input type="text" placeholder="e.g. Grade A, B…" value={reqGradeFilter} onChange={e => setReqGradeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </>)}

          {/* ── Govt Official tab-specific filters ── */}
          {!isEO && dpFilter === 'draft' && (<>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Request Date</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">From</span>
                  <input type="date" value={reqDateFrom} onChange={e => setReqDateFrom(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">To</span>
                  <input type="date" value={reqDateTo} onChange={e => setReqDateTo(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Request Type</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'GENERAL', label: 'General' }, { value: 'MEDICAL', label: 'Medical' }, { value: 'REFERENCE', label: 'Reference' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setReqRequestTypeFilter(prev =>
                    prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
                  )}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqRequestTypeFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {!isEO && dpFilter === 'submitted' && (<>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Request Date</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">From</span>
                  <input type="date" value={reqDateFrom} onChange={e => setReqDateFrom(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">To</span>
                  <input type="date" value={reqDateTo} onChange={e => setReqDateTo(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Approval Status</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'PENDING', label: 'Pending' }, { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setReqApprovalStatusFilter(prev =>
                    prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
                  )}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqApprovalStatusFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {!isEO && dpFilter === 'allotted' && (<>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Unit Number / Quarter No.</label>
              <input type="text" placeholder="e.g. A-101, QTR-04…" value={reqUnitNumberFilter} onChange={e => setReqUnitNumberFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Occupancy Status</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'VACANT', label: 'Vacant' }, { value: 'OCCUPIED', label: 'Occupied' }, { value: 'UNDER_MAINTENANCE', label: 'Maintenance' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setReqOccupancyStatusFilter(prev =>
                    prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
                  )}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqOccupancyStatusFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {!isEO && dpFilter === 'occupied' && (<>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Occupied Date</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">From</span>
                  <input type="date" value={reqOccupiedDateFrom} onChange={e => setReqOccupiedDateFrom(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">To</span>
                  <input type="date" value={reqOccupiedDateTo} onChange={e => setReqOccupiedDateTo(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Occupancy Status</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'VACANT', label: 'Vacant' }, { value: 'OCCUPIED', label: 'Occupied' }, { value: 'UNDER_MAINTENANCE', label: 'Maintenance' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setReqOccupancyStatusFilter(prev =>
                    prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
                  )}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqOccupancyStatusFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {!isEO && dpFilter === 'declined' && (<>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Declined Date</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">From</span>
                  <input type="date" value={reqDeclinedDateFrom} onChange={e => setReqDeclinedDateFrom(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 mb-1">To</span>
                  <input type="date" value={reqDeclinedDateTo} onChange={e => setReqDeclinedDateTo(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Request Type</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'GENERAL', label: 'General' }, { value: 'MEDICAL', label: 'Medical' }, { value: 'REFERENCE', label: 'Reference' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setReqRequestTypeFilter(prev =>
                    prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
                  )}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqRequestTypeFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="space-y-2">
              {[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }].map(({ value, label }) => (
                <button key={value} onClick={() => setReqSort(value as 'newest' | 'oldest')}
                  className={`w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${reqSort === value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterDrawer>

      {/* ── Available Quarters filter drawer ─────────────────────────────── */}
      <FilterDrawer
        isOpen={avqFilterDrawerOpen}
        onClose={() => setAvqFilterDrawerOpen(false)}
        title="Filter Quarters"
        activeFilterCount={
          avqFloorFilter.length +
          [avqGroundFloor, avqRecentlyRenovated, avqWesternToilet, avqIndianToilet,
           avqCarParking, avqPoojaRoom, avqBalcony, avqKitchenExhaust, avqLiftAccess].filter(Boolean).length +
          (avqLocationArea ? 1 : 0) + (avqHousingStyle ? 1 : 0)
        }
        onClearAll={clearAvqFilters}
      >
        <div className="space-y-5">

          {/* Quarter Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quarter Type</label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', ...QUARTER_TYPE_OPTIONS] as string[]).map(v => (
                <button key={v} onClick={() => setAvqBhkFilter(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${avqBhkFilter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {v === 'ALL' ? 'Any' : v}
                </button>
              ))}
            </div>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Floor</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: 'Ground' },
                { value: 1, label: '1st' },
                { value: 2, label: '2nd' },
                { value: 3, label: '3rd' },
                { value: 4, label: '4th+' },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setAvqFloorFilter(prev =>
                  prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
                )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${avqFloorFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Ground Floor Access */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ground Floor Access</label>
            <button
              onClick={() => setAvqGroundFloor(v => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${avqGroundFloor ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}
            >
              Ground Floor Only
            </button>
          </div>

          {/* Recently Renovated */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Condition</label>
            <button
              onClick={() => setAvqRecentlyRenovated(v => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${avqRecentlyRenovated ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}
            >
              Recently Renovated
            </button>
          </div>

          {/* Location / Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location (Region / Area)</label>
            <input
              type="text"
              value={avqLocationArea}
              onChange={e => setAvqLocationArea(e.target.value)}
              placeholder="Filter by area or region…"
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Toilet Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Toilet Type</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Western Toilet', val: avqWesternToilet, set: setAvqWesternToilet },
                { label: 'Indian Toilet',  val: avqIndianToilet,  set: setAvqIndianToilet  },
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(v => !v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Dedicated Car Parking', val: avqCarParking,     set: setAvqCarParking     },
                { label: 'Pooja Room',             val: avqPoojaRoom,      set: setAvqPoojaRoom      },
                { label: 'Sitting Balcony',        val: avqBalcony,        set: setAvqBalcony        },
                { label: 'Kitchen Exhaust Fan',    val: avqKitchenExhaust, set: setAvqKitchenExhaust },
                { label: 'Lift Access',            val: avqLiftAccess,     set: setAvqLiftAccess     },
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(v => !v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Housing Style */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Housing Style</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '',                 label: 'Any'              },
                { value: 'Flat',             label: 'Flat'             },
                { value: 'Independent House', label: 'Independent House' },
                { value: 'Row House',        label: 'Row House'        },
                { value: 'Bungalow',         label: 'Bungalow'         },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setAvqHousingStyle(avqHousingStyle === value ? '' : value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${avqHousingStyle === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </FilterDrawer>

      {/* ── Add New Quarter modal (EM only) ──────────────────────────────── */}
      {showNewQuarterModal && (
        <AddQuarterModal
          onClose={() => setShowNewQuarterModal(false)}
          onSubmit={handleCreateQuarter}
          submitting={newQuarterSubmitting}
        />
      )}

      {/* ── New/Modify Request — Full Screen ─────────────────────────────── */}
      {showNewModal && (
        <Suspense fallback={null}>
          <NewRequestModal
            activeCycle={activeCycle}
            isEO={isEO}
            eoMode={eoMode}
            userRole={user?.role}
            user={user ?? null}
            documents={requestDocuments}
            setDocuments={setRequestDocuments}
            form={form}
            setForm={setForm}
            prefs={prefs}
            addPref={addPref}
            removePref={removePref}
            movePref={movePref}
            modalQuarters={modalQuarters}
            modalSearch={modalSearch}
            setModalSearch={setModalSearch}
            modalLoading={modalLoading}
            modalBhk={modalBhk}
            setModalBhk={setModalBhk}
            modalFurnishing={modalFurnishing}
            setModalFurnishing={setModalFurnishing}
            modalSortBy={modalSortBy}
            setModalSortBy={setModalSortBy}
            modalGroundFloor={modalGroundFloor}
            setModalGroundFloor={setModalGroundFloor}
            modalRecentlyRenovated={modalRecentlyRenovated}
            setModalRecentlyRenovated={setModalRecentlyRenovated}
            modalLocationArea={modalLocationArea}
            setModalLocationArea={setModalLocationArea}
            modalWesternToilet={modalWesternToilet}
            setModalWesternToilet={setModalWesternToilet}
            modalIndianToilet={modalIndianToilet}
            setModalIndianToilet={setModalIndianToilet}
            modalCarParking={modalCarParking}
            setModalCarParking={setModalCarParking}
            modalPoojaRoom={modalPoojaRoom}
            setModalPoojaRoom={setModalPoojaRoom}
            modalBalcony={modalBalcony}
            setModalBalcony={setModalBalcony}
            modalKitchenExhaust={modalKitchenExhaust}
            setModalKitchenExhaust={setModalKitchenExhaust}
            modalLiftAccess={modalLiftAccess}
            setModalLiftAccess={setModalLiftAccess}
            modalIndependentHouse={modalIndependentHouse}
            setModalIndependentHouse={setModalIndependentHouse}
            modalHousingStyle={modalHousingStyle}
            setModalHousingStyle={setModalHousingStyle}
            modalFilterOpen={modalFilterOpen}
            setModalFilterOpen={setModalFilterOpen}
            modalFilterRef={modalFilterRef}
            requestFor={requestFor}
            setRequestFor={setRequestFor}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            showEmployeePicker={showEmployeePicker}
            setShowEmployeePicker={setShowEmployeePicker}
            employeeSearch={employeeSearch}
            setEmployeeSearch={setEmployeeSearch}
            employeeDeptFilter={employeeDeptFilter}
            setEmployeeDeptFilter={setEmployeeDeptFilter}
            tpInfo={tpInfo}
            setTpInfo={setTpInfo}
            tpInfoConfirmed={tpInfoConfirmed}
            setTpInfoConfirmed={setTpInfoConfirmed}
            showTPForm={showTPForm}
            setShowTPForm={setShowTPForm}
            tpFormDraft={tpFormDraft}
            setTpFormDraft={setTpFormDraft}
            submitting={submitting}
            allotNowSubmitting={allotNowSubmitting}
            showAllotNowPicker={showAllotNowPicker}
            setShowAllotNowPicker={setShowAllotNowPicker}
            allotNowSearch={allotNowSearch}
            setAllotNowSearch={setAllotNowSearch}
            allotNowQuarters={allotNowQuarters}
            allotNowLoading={allotNowLoading}
            allotNowQuarterId={allotNowQuarterId}
            setAllotNowQuarterId={setAllotNowQuarterId}
            allotNowQuarter={allotNowQuarter}
            setAllotNowQuarter={setAllotNowQuarter}
            setPreviewQuarterId={setPreviewQuarterId}
            setIsPreviewOpen={setIsPreviewOpen}
            onClose={() => { setShowNewModal(false); setRequestDocuments([]); setAllotApprovalRequestId(null); setAllotApprovalWflId(''); setAllotApprovalUsers([]); }}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            onAllotNow={handleAllotNow}
            showAllotApprovalPopup={showAllotApprovalPopup}
            setShowAllotApprovalPopup={setShowAllotApprovalPopup}
            allotApprovalWflId={allotApprovalWflId}
            setAllotApprovalWflId={setAllotApprovalWflId}
            allotApprovalUsers={allotApprovalUsers}
            setAllotApprovalUsers={setAllotApprovalUsers}
            allotApprovalSubmitting={allotApprovalSubmitting}
            allotApprovalRequestId={allotApprovalRequestId}
            allotApprovalWorkflows={requestApprovalWorkflows}
            onAllotWithApproval={handleAllotWithApproval}
            addToast={addToast}
          />
        </Suspense>
      )}

      {/* ── Inline Action Popup (Extension / Vacate / Grievance / Maintenance / Inspection / Handover) ── */}
      {(() => {
        const popupReq = actionPopup.requestId ? requests.find(r => r.id === actionPopup.requestId) : undefined;
        const pq = popupReq?.allotment?.quarter;
        const pa = popupReq?.allotment;
        const allotmentInfo = pq ? {
          quarterNumber: pq.quarter_number ?? '',
          block: pq.block_name ?? '',
          quarterType: pq.quarter_type ?? '',
          // VACATE-specific employee details
          employeeId: user?.govtEmployeeId ?? '',
          employeeName: user?.fullName ?? '',
          designation: vacateDesignationName,
          sapId: user?.sapId ?? '',
          bhkEntitlement: user?.bhkEntitlement ?? '',
          // VACATE-specific allotment details
          allotmentDate: pa?.allotment_date ?? '',
          possessionDate: pa?.possession_date ?? null,
          billPreparingAuthority: pa?.bill_preparing_authority ?? null,
          allotmentLetterUrl: pa?.allotment_letter_url ?? null,
        } : undefined;
        return (
          <ActionPopupModal
            actionPopup={actionPopup}
            onClose={closeActionPopup}
            onSubmit={handlePopupSubmit}
            submitting={popupSubmitting}
            reason={popupReason}
            remarks={popupRemarks}
            docUrl={popupDocUrl}
            date={popupDate}
            subject={popupSubject}
            urgency={popupUrgency}
            inspectorName={popupInspectorName}
            openingRemarks={popupOpeningRemarks}
            condition={popupCondition}
            checklist={popupChecklist}
            keyNumber={popupKeyNumber}
            handoverDeadline={popupHandoverDeadline}
            handoverInteriorFile={popupHandoverInteriorFile}
            handoverReportFile={popupHandoverReportFile}
            retentionReason={popupRetentionReason}
            requestedMonths={popupRequestedMonths}
            allotmentInfo={allotmentInfo}
            onReasonChange={setPopupReason}
            onRemarksChange={setPopupRemarks}
            onDocChange={setPopupDocUrl}
            onDateChange={setPopupDate}
            onSubjectChange={setPopupSubject}
            onUrgencyChange={setPopupUrgency as (v: 'LOW' | 'NORMAL' | 'HIGH') => void}
            onInspectorNameChange={setPopupInspectorName}
            onOpeningRemarksChange={setPopupOpeningRemarks}
            onConditionChange={setPopupCondition}
            onChecklistChange={setPopupChecklist}
            onKeyNumberChange={setPopupKeyNumber}
            onHandoverDeadlineChange={setPopupHandoverDeadline}
            onHandoverInteriorFileChange={setPopupHandoverInteriorFile}
            onHandoverReportFileChange={setPopupHandoverReportFile}
            onRetentionReasonChange={setPopupRetentionReason}
            onRequestedMonthsChange={setPopupRequestedMonths}
          />
        );
      })()}

      {/* ── Upgrade Request Modal ─────────────────────────────────────── */}
      {showUpgradeModal && (
        <UpgradeRequestModal
          user={user}
          currentQuarter={selectedRequest?.allotment?.quarter ?? null}
          availableQuarters={upgradeModalQuarters}
          quartersLoading={upgradeModalLoading}
          onClose={() => setShowUpgradeModal(false)}
          onSubmit={handleUpgradeSubmit}
          addToast={addToast}
        />
      )}

      {/* ── Exchange Request Modal ─────────────────────────────────────── */}
      {showExchangeModal && selectedRequest?.allotment && (() => {
        const rf = selectedRequest.request_for ?? 'SELF';
        const myOccupantName =
          rf === 'EMPLOYEE' ? (selectedRequest.on_behalf_employee_name ?? 'Employee') :
          rf === 'TP' ? (selectedRequest.tp_name ?? 'Third Party') :
          (user?.user_metadata?.full_name ?? user?.email ?? 'You');

        function lookupPartnerQuarter(quarterNo: string): string | null {
          const match = requests.find(r => {
            if (!['ACKNOWLEDGED', 'EXTEND_REQUESTED', 'VACATE_REQUESTED', 'EXCHANGE_REQUESTED'].includes(r.request_status)) return false;
            const q = r.allotment?.quarter as Quarter | undefined;
            return q?.quarter_number?.toUpperCase() === quarterNo.toUpperCase();
          });
          if (!match) return null;
          const rf2 = match.request_for ?? 'SELF';
          if (rf2 === 'EMPLOYEE') return match.on_behalf_employee_name ?? 'Employee';
          if (rf2 === 'TP') return match.tp_name ?? 'Third Party';
          return user?.user_metadata?.full_name ?? user?.email ?? 'Occupant';
        }

        return (
          <ExchangeRequestModal
            myQuarterNumber={(selectedRequest.allotment.quarter as Quarter)?.quarter_number ?? ''}
            myOccupantName={myOccupantName}
            isEO={isEO}
            allotmentId={selectedRequest.allotment.id}
            workflows={exchangeWorkflows}
            submitting={exchangeSubmitting}
            onClose={() => setShowExchangeModal(false)}
            onLookupPartnerQuarter={lookupPartnerQuarter}
            onSubmit={handleExchangeSubmit}
          />
        );
      })()}

      {/* ── Quarter Preview Modal ──────────────────────────────────────── */}
      {previewQuarterId && (
        <Suspense fallback={null}>
          <QuarterDetailModal
            isOpen={isPreviewOpen}
            onClose={() => { setIsPreviewOpen(false); setPreviewQuarterId(null); }}
            quarterId={previewQuarterId}
          />
        </Suspense>
      )}

      {/* ── Available Quarters Detail Modal ────────────────────────────── */}
      {avqDetailQuarterId && (
        <Suspense fallback={null}>
          <QuarterDetailModal
            isOpen={true}
            onClose={() => setAvqDetailQuarterId(null)}
            quarterId={avqDetailQuarterId}
          />
        </Suspense>
      )}

      {/* ── Available Quarters action menu (portal) ────────────────────── */}
      {avqMenuId && avqMenuPos && (() => {
        const q = filteredAvailableQuarters.find(q => q.id === avqMenuId);
        if (!q) return null;
        return createPortal(
          <div
            ref={avqMenuRef}
            style={{ position: 'fixed', top: avqMenuPos.top, left: avqMenuPos.left, zIndex: 9999, minWidth: 192 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Quarter Actions</div>
              <div className="text-xs font-semibold text-gray-700 truncate">{q.quarter_number} · {q.bhk_config}</div>
            </div>
            <div className="py-1">
              <button
                onClick={() => { setAvqMenuId(null); setAvqMenuPos(null); setAvqDetailQuarterId(q.id); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                  <Eye size={12} className="text-cyan-600" />
                </span>
                Details
              </button>
              {(!isEO || eoMode === 'self') && (
                <button
                  onClick={() => {
                    setAvqMenuId(null); setAvqMenuPos(null);
                    openNewModal();
                    setTimeout(() => addPref(q), 50);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Plus size={12} className="text-blue-600" />
                  </span>
                  Add to Request
                </button>
              )}
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── Image lightbox (allotted/occupied panel tiles) ─────────────── */}
      {lightboxOpen && (
        <PhotoLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* ── EO: Run Allocation Popup ────────────────────────────────────── */}
      {showRunAllocationPopup && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '92vh' }}>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <PlayCircle size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">Run Allocation Cycle</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Auto-allot submitted requests by employee preference ranking</p>
              </div>
              <button onClick={() => setShowRunAllocationPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                <X size={15} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* Officer identity strip */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">User Id:</span>
                  <span className="text-xs font-bold text-gray-700 truncate">{user?.govtEmployeeId || user?.id?.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="w-px h-3 bg-gray-300 shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Name:</span>
                  <span className="text-xs font-bold text-gray-700 truncate">{user?.fullName || '—'}</span>
                </div>
                <div className="w-px h-3 bg-gray-300 shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Designation:</span>
                  <span className="text-xs font-bold text-gray-700 truncate">{vacateDesignationName || 'Estate Officer'}</span>
                </div>
              </div>

              {/* Cycle Name */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Cycle Name / Number <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </div>
                <input
                  type="text"
                  value={runAllocCycleName}
                  onChange={e => setRunAllocCycleName(e.target.value)}
                  placeholder="e.g. 2025-Q2, Jun Cycle"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                />
              </div>

              {/* Last / Current run cycle date */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Cycle Run Dates</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-medium">Last run cycle Date</label>
                    <input
                      type="date"
                      value={runAllocLastDate}
                      onChange={e => setRunAllocLastDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-medium">Current run cycle Date</label>
                    <input
                      type="date"
                      value={runAllocCurrentDate}
                      onChange={e => setRunAllocCurrentDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Grade + Quarter Type */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Select the Grade / Quarter Type for the Run Allocation
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-medium">Grade</label>
                    <div className="relative">
                      <select
                        value={runAllocGrade}
                        onChange={e => setRunAllocGrade(e.target.value)}
                        disabled={runAllocMedical}
                        className={`w-full appearance-none px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 pr-8 transition-colors ${runAllocMedical ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                      >
                        <option value="">All Grades</option>
                        {QUARTER_TYPE_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-medium">Quarter Type</label>
                    <div className="relative">
                      <select
                        value={runAllocQuarterType}
                        onChange={e => setRunAllocQuarterType(e.target.value)}
                        disabled={runAllocMedical}
                        className={`w-full appearance-none px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 pr-8 transition-colors ${runAllocMedical ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                      >
                        <option value="">All Types</option>
                        {QUARTER_TYPE_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                {/* Medical checkbox */}
                <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={runAllocMedical}
                    onChange={e => {
                      setRunAllocMedical(e.target.checked);
                      if (e.target.checked) {
                        setRunAllocGrade('');
                        setRunAllocQuarterType('');
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-400 cursor-pointer accent-red-600"
                  />
                  <span className="text-xs font-medium text-gray-700">Medical / Priority Allotment</span>
                  {runAllocMedical && (
                    <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">Grade &amp; Type locked</span>
                  )}
                </label>
              </div>

              {/* Info banner */}
              {(() => {
                let filtered = requests.filter(r => r.request_status === 'SUBMITTED');
                if (runAllocMedical) {
                  filtered = filtered.filter(r => r.request_type === 'MEDICAL');
                } else if (runAllocGrade) {
                  filtered = filtered.filter(r => r.required_bhk_config === runAllocGrade);
                }
                const count = filtered.length;
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
                    <strong>{count} request{count !== 1 ? 's' : ''}</strong> will be auto-allotted using each employee's top-ranked quarter preference. Requests without preferences will be skipped.
                    {(runAllocMedical || runAllocGrade || runAllocQuarterType) && (
                      <div className="mt-1.5 text-blue-600">
                        Filtered to: {[runAllocMedical && 'Medical / Priority requests', !runAllocMedical && runAllocGrade && `Grade "${runAllocGrade}"`, !runAllocMedical && runAllocQuarterType && `Type "${runAllocQuarterType}"`].filter(Boolean).join(' + ')}.
                      </div>
                    )}
                    {runAllocCycleName.trim() && (
                      <div className="mt-1.5 text-blue-600">Cycle record "<strong>{runAllocCycleName}</strong>" will be created and linked.</div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Footer actions ── */}
            <div className="flex gap-2.5 px-5 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl">
              <button
                onClick={() => {
                  setShowRunAllocationPopup(false);
                  setRunAllocCycleName(''); setRunAllocStart(''); setRunAllocEnd('');
                  setRunAllocCycleTime(''); setRunAllocLastDate('');
                  setRunAllocCurrentDate(new Date().toISOString().split('T')[0]);
                  setRunAllocGrade(''); setRunAllocQuarterType(''); setRunAllocMedical(false); setRunAllocWorkflowId('');
                  setRunAllocApproverUsers({}); setRunAllocPickingLevel(null); setRunAllocUserSearch('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAllocation}
                disabled={runAllocSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {runAllocSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Running…
                  </>
                ) : (
                  <>
                    <PlayCircle size={14} />
                    Run Now
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── EO: Cycle History Popup ──────────────────────────────────────── */}
      {showCycleHistory && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
              {selectedCycleDetail ? (
                <>
                  <button onClick={() => { setSelectedCycleDetail(null); setCycleDetailRequests([]); }} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <ClipboardList size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">{selectedCycleDetail.cycle_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(selectedCycleDetail.start_date).toLocaleDateString('en-IN')} – {new Date(selectedCycleDetail.end_date).toLocaleDateString('en-IN')}
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedCycleDetail.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{selectedCycleDetail.status}</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <ClipboardList size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">Allocation Run History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">All allocation cycles run for this estate</p>
                  </div>
                </>
              )}
              <button onClick={() => { setShowCycleHistory(false); setSelectedCycleDetail(null); setCycleDetailRequests([]); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!selectedCycleDetail ? (
                /* ── Cycle list ── */
                <div className="p-5">
                  {cycleHistoryLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : cycleHistoryList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <ClipboardList size={32} className="mb-3 opacity-30" />
                      <div className="text-sm font-semibold">No allocation runs yet</div>
                      <div className="text-xs mt-1">Run your first allocation to see history here</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cycleHistoryList.map(cycle => (
                        <div key={cycle.id} className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-white hover:shadow-sm transition-all cursor-default">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{cycle.cycle_name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cycle.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{cycle.status}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {new Date(cycle.start_date).toLocaleDateString('en-IN')} – {new Date(cycle.end_date).toLocaleDateString('en-IN')}
                              <span className="mx-1.5 text-gray-300">·</span>
                              Code: <span className="font-mono text-gray-600">{cycle.cycle_code}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-gray-400">Created</div>
                            <div className="text-xs font-medium text-gray-700">{new Date(cycle.created_at).toLocaleDateString('en-IN')}</div>
                          </div>
                          <button
                            onClick={() => loadCycleDetail(cycle)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
                          >
                            <Eye size={12} /> View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Cycle detail table ── */
                <div className="p-5">
                  {cycleDetailLoading ? (
                    <div className="space-y-3">
                      {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : cycleDetailRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Users size={32} className="mb-3 opacity-30" />
                      <div className="text-sm font-semibold">No requests in this cycle</div>
                    </div>
                  ) : (
                    <>
                      {/* Summary strip */}
                      {(() => {
                        const shown = cycleDetailRequests.filter(r => ['ALLOTTED','ACKNOWLEDGED','REJECTED','VACATED'].includes(r.request_status));
                        return (
                          <div className="grid grid-cols-4 gap-3 mb-5">
                            {[
                              { label: 'Total Requests', value: shown.length, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
                              { label: 'Allocated', value: shown.filter(r => isAllottedStatus(r.request_status)).length, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                              { label: 'Occupied', value: shown.filter(r => isOccupiedStatus(r.request_status)).length, cls: 'bg-teal-50 border-teal-100 text-teal-700' },
                              { label: 'Declined / Vacated', value: shown.filter(r => ['VACATED','REJECTED'].includes(r.request_status)).length, cls: 'bg-gray-50 border-gray-100 text-gray-600' },
                            ].map(stat => (
                              <div key={stat.label} className={`rounded-xl border px-4 py-3 text-center ${stat.cls}`}>
                                <div className="text-xl font-bold">{stat.value}</div>
                                <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-80">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Table */}
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {['Request No.','Quarter','Location','Requested By','Request For','Allotted To','Allotted On','Allotted By','Status'].map(col => (
                                <th key={col} className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cycleDetailRequests.filter(r => ['ALLOTTED','ACKNOWLEDGED','REJECTED','VACATED'].includes(r.request_status)).map((req, i) => {
                              const allotment = req.allotment as QuarterAllotment | null | undefined;
                              const quarter = allotment?.quarter as Quarter | undefined;
                              const sc = statusConfig(req.request_status);
                              const reqFor = req.request_for ?? 'SELF';
                              const allottedTo = reqFor === 'EMPLOYEE' ? (req.on_behalf_employee_name ?? 'Employee') : reqFor === 'TP' ? (req.tp_name ?? 'Third Party') : 'Demo Admin User';
                              return (
                                <tr key={req.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                                  <td className="px-3 py-2.5 font-mono text-gray-700 whitespace-nowrap">{req.request_number}</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    {quarter ? (
                                      <div>
                                        <div className="font-semibold text-gray-800">{quarter.quarter_number}</div>
                                        <div className="text-[10px] text-gray-400">{req.required_bhk_config}</div>
                                      </div>
                                    ) : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                                    {quarter ? `${(quarter as any).block_name ?? 'Block'}, Sector 3` : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <div className="font-medium text-gray-800">Demo Admin User</div>
                                    <div className="text-[10px] text-gray-400">DEMO001</div>
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRequestForBadgeCls(reqFor)}`}>{getRequestForLabel(reqFor)}</span>
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-800">{allottedTo}</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                                    {allotment?.allotment_date ? fmtDate(allotment.allotment_date) : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">Estate Officer</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>
                                      {sc.icon}{sc.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EO: Allocated DP — Assign WFL to Cycles Popup ──────────────── */}
      {showAllocatedWFLPopup && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '92vh' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <GitMerge size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">Assign Workflow to Allocation Cycles</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Select a cycle, assign an approval workflow, and designate approvers for each level</p>
              </div>
              <button
                onClick={() => setShowAllocatedWFLPopup(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Two-column body */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* Left: Cycle list */}
              <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 shrink-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Allocation Cycles</p>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {DEMO_ALLOCATED_CYCLES.map(cycle => {
                    const isSelected = allocWFLSelectedCycleId === cycle.id;
                    return (
                      <button
                        key={cycle.id}
                        onClick={() => {
                          setAllocWFLSelectedCycleId(cycle.id);
                          setAllocWFLWorkflowId('');
                          setAllocWFLApproverUsers({});
                          setAllocWFLPickingLevel(null);
                          setAllocWFLUserSearch('');
                          setAllocWFLSuccess(false);
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-all duration-150 ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-800' : 'text-gray-800'}`}>{cycle.cycle_name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{cycle.cycle_code}</p>
                          </div>
                          <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            cycle.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>{cycle.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-gray-500">
                            <span className="font-semibold text-gray-700">{cycle.allotment_count}</span> allotments
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(cycle.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: WFL assignment panel */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {!allocWFLSelectedCycleId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-gray-400">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                      <GitMerge size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">Select a Cycle</p>
                    <p className="text-xs text-gray-400 mt-1">Choose an allocation cycle from the list to assign an approval workflow</p>
                  </div>
                ) : allocWFLSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                      <CheckSquare size={28} className="text-emerald-600" />
                    </div>
                    <p className="text-base font-bold text-emerald-800">Workflow Assigned!</p>
                    <p className="text-sm text-gray-500 mt-1.5">
                      {requestApprovalWorkflows.find(w => w.id === allocWFLWorkflowId)?.workflow_name ?? 'Selected workflow'} has been assigned to{' '}
                      <strong>{DEMO_ALLOCATED_CYCLES.find(c => c.id === allocWFLSelectedCycleId)?.cycle_name}</strong>.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">The allotments in this cycle will proceed to the Unapproved stage for approval initiation.</p>
                    <button
                      onClick={() => {
                        setAllocWFLSelectedCycleId(null);
                        setAllocWFLWorkflowId('');
                        setAllocWFLApproverUsers({});
                        setAllocWFLSuccess(false);
                      }}
                      className="mt-5 px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-colors"
                    >
                      Assign Another Cycle
                    </button>
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Selected cycle info strip */}
                    {(() => {
                      const cycle = DEMO_ALLOCATED_CYCLES.find(c => c.id === allocWFLSelectedCycleId);
                      if (!cycle) return null;
                      return (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                            <ClipboardList size={14} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-emerald-800 truncate">{cycle.cycle_name}</p>
                            <p className="text-[10px] text-emerald-600 mt-0.5">{cycle.allotment_count} allotments · {new Date(cycle.start_date).toLocaleDateString('en-IN')} – {new Date(cycle.end_date).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Workflow selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                        Select Approval Workflow (WFL)
                      </label>
                      <div className="relative">
                        <select
                          value={allocWFLWorkflowId}
                          onChange={e => {
                            setAllocWFLWorkflowId(e.target.value);
                            setAllocWFLApproverUsers({});
                            setAllocWFLPickingLevel(null);
                          }}
                          className="w-full appearance-none px-3 py-2.5 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white text-gray-700"
                        >
                          <option value="">-- Select a Workflow --</option>
                          {(DEMO_MODE ? DEMO_WORKFLOWS : requestApprovalWorkflows).map(wfl => (
                            <option key={wfl.id} value={wfl.id}>
                              {wfl.workflow_name} ({(wfl.levels as { level: number }[]).length} level{(wfl.levels as { level: number }[]).length !== 1 ? 's' : ''})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Approver assignment per level */}
                    {allocWFLWorkflowId && (() => {
                      const wfl = (DEMO_MODE ? DEMO_WORKFLOWS : requestApprovalWorkflows).find(w => w.id === allocWFLWorkflowId);
                      if (!wfl) return null;
                      const levels = wfl.levels as { level: number; approver_title?: string; approver_role?: string }[];
                      const demoUsers = [
                        { id: 'u-001', full_name: 'Rajesh Kumar', govt_employee_id: 'GOV-101', email: 'rajesh.kumar@gov.in', govt_department: 'MoF' },
                        { id: 'u-002', full_name: 'Sunita Sharma', govt_employee_id: 'GOV-102', email: 'sunita.sharma@gov.in', govt_department: 'DoT' },
                        { id: 'u-003', full_name: 'Anil Verma', govt_employee_id: 'GOV-103', email: 'anil.verma@gov.in', govt_department: 'MoD' },
                        { id: 'u-004', full_name: 'Priya Nair', govt_employee_id: 'GOV-104', email: 'priya.nair@gov.in', govt_department: 'MHA' },
                        { id: 'u-005', full_name: 'Vikram Singh', govt_employee_id: 'GOV-105', email: 'vikram.singh@gov.in', govt_department: 'MoRD' },
                      ];
                      const availUsers = DEMO_MODE ? demoUsers : allocWFLAvailableUsers;
                      return (
                        <div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">Assign Approvers Per Level</div>
                          <div className="space-y-3">
                            {levels.map(lvl => {
                              const assigned = allocWFLApproverUsers[lvl.level];
                              const isPicking = allocWFLPickingLevel === lvl.level;
                              const filteredUsers = availUsers.filter(u =>
                                allocWFLUserSearch === '' ||
                                u.full_name.toLowerCase().includes(allocWFLUserSearch.toLowerCase()) ||
                                u.govt_employee_id.toLowerCase().includes(allocWFLUserSearch.toLowerCase())
                              );
                              return (
                                <div key={lvl.level} className="rounded-xl border border-gray-200 overflow-hidden">
                                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">{lvl.level}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-gray-800">{lvl.approver_title || lvl.approver_role || `Level ${lvl.level}`}</p>
                                      {assigned ? (
                                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{assigned.full_name} · {assigned.govt_employee_id}</p>
                                      ) : (
                                        <p className="text-[10px] text-gray-400 mt-0.5">No approver assigned</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setAllocWFLPickingLevel(isPicking ? null : lvl.level);
                                        setAllocWFLUserSearch('');
                                      }}
                                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                                        isPicking
                                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                          : assigned
                                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      }`}
                                    >
                                      {isPicking ? 'Close' : assigned ? 'Change' : 'Assign'}
                                    </button>
                                    {assigned && (
                                      <button
                                        onClick={() => setAllocWFLApproverUsers(prev => { const n = {...prev}; delete n[lvl.level]; return n; })}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                  {isPicking && (
                                    <div className="border-t border-gray-100 p-3 space-y-2">
                                      <div className="relative">
                                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                          type="text"
                                          value={allocWFLUserSearch}
                                          onChange={e => setAllocWFLUserSearch(e.target.value)}
                                          placeholder="Search by name or ID…"
                                          className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                                        />
                                      </div>
                                      <div className="space-y-1 max-h-36 overflow-y-auto">
                                        {filteredUsers.map(u => (
                                          <button
                                            key={u.id}
                                            onClick={() => {
                                              setAllocWFLApproverUsers(prev => ({ ...prev, [lvl.level]: { id: u.id, full_name: u.full_name, govt_employee_id: u.govt_employee_id, email: u.email } }));
                                              setAllocWFLPickingLevel(null);
                                              setAllocWFLUserSearch('');
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors text-left"
                                          >
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 shrink-0">
                                              {u.full_name[0]}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold text-gray-800 truncate">{u.full_name}</p>
                                              <p className="text-[10px] text-gray-400">{u.govt_employee_id}</p>
                                            </div>
                                          </button>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                          <p className="text-center text-xs text-gray-400 py-3">No users found</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Info banner */}
                    {allocWFLWorkflowId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
                        The selected workflow will be assigned to all allotments in this cycle. Approvers will be notified once approval is initiated from the <strong>Unapproved Allotment</strong> screen.
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                {allocWFLSelectedCycleId && !allocWFLSuccess && (
                  <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-br-2xl">
                    <button
                      onClick={() => setShowAllocatedWFLPopup(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!allocWFLWorkflowId) return;
                        setAllocWFLSubmitting(true);
                        await new Promise(r => setTimeout(r, 900));
                        setAllocWFLSubmitting(false);
                        setAllocWFLSuccess(true);
                      }}
                      disabled={!allocWFLWorkflowId || allocWFLSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {allocWFLSubmitting ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Submitting…
                        </>
                      ) : (
                        <>
                          <CheckSquare size={14} />
                          Submit WFL Assignment
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── EO: Unapproved DP — Manage WFL / Initiate Approval Popup ────── */}
      {showUnapprovedWFLPopup && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '92vh' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <ListFilter size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">Manage Approval Workflows</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">View cycles with assigned workflows and initiate or track the approval process</p>
              </div>
              <button
                onClick={() => setShowUnapprovedWFLPopup(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Two-column body */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* Left: Cycle list */}
              <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 shrink-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cycles with Assigned WFL</p>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {DEMO_UNAPPROVED_CYCLES.map(cycle => {
                    const isSelected = unapprWFLSelectedCycleId === cycle.id;
                    const isApproved = cycle.approval_approved === true;
                    const isInitiated = !isApproved && (unapprWFLInitiatedCycles.includes(cycle.id) || cycle.approval_initiated);
                    const isLocked = unapprWFLLockedCycles.includes(cycle.id);
                    return (
                      <button
                        key={cycle.id}
                        onClick={() => setUnapprWFLSelectedCycleId(cycle.id)}
                        className={`w-full text-left rounded-xl border p-3 transition-all duration-150 ${
                          isSelected
                            ? isApproved
                              ? 'border-teal-400 bg-teal-50 shadow-sm'
                              : 'border-amber-400 bg-amber-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isSelected ? (isApproved ? 'text-teal-800' : 'text-amber-800') : 'text-gray-800'}`}>{cycle.cycle_name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{cycle.cycle_code}</p>
                          </div>
                          {/* WFL status chip */}
                          {isLocked ? (
                            <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 whitespace-nowrap">
                              <Lock size={8} /> Locked
                            </span>
                          ) : isApproved ? (
                            <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 whitespace-nowrap">
                              <CheckCircle2 size={8} /> Approved
                            </span>
                          ) : isInitiated ? (
                            <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                              <CheckSquare size={8} /> Initiated
                            </span>
                          ) : (
                            <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                              <GitMerge size={8} /> WFL Set
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] text-gray-500 font-medium">{cycle.wfl_name}</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-[10px] text-gray-400">
                            <span className="font-semibold text-gray-600">{cycle.allotment_count}</span> allotments
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Approval action panel */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {!unapprWFLSelectedCycleId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-gray-400">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                      <ListFilter size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">Select a Cycle</p>
                    <p className="text-xs text-gray-400 mt-1">Choose a cycle from the list to view workflow details and take action</p>
                  </div>
                ) : (() => {
                  const cycle = DEMO_UNAPPROVED_CYCLES.find(c => c.id === unapprWFLSelectedCycleId);
                  if (!cycle) return null;
                  const wfl = (DEMO_MODE ? DEMO_WORKFLOWS : requestApprovalWorkflows).find(w => w.workflow_name === cycle.wfl_name) ?? (DEMO_MODE ? DEMO_WORKFLOWS[0] : requestApprovalWorkflows[0]);
                  const isApproved = cycle.approval_approved === true;
                  const isInitiated = !isApproved && (unapprWFLInitiatedCycles.includes(cycle.id) || cycle.approval_initiated);
                  const isLocked = unapprWFLLockedCycles.includes(cycle.id);
                  const levels = wfl ? (wfl.levels as { level: number; approver_title?: string; approver_role?: string }[]) : [];

                  return (
                    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                        {/* Cycle info strip */}
                        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                          isApproved ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isApproved ? 'bg-teal-600' : 'bg-amber-500'
                          }`}>
                            <ClipboardList size={14} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${isApproved ? 'text-teal-800' : 'text-amber-800'}`}>{cycle.cycle_name}</p>
                            <p className={`text-[10px] mt-0.5 ${isApproved ? 'text-teal-600' : 'text-amber-600'}`}>{cycle.allotment_count} allotments · {new Date(cycle.start_date).toLocaleDateString('en-IN')} – {new Date(cycle.end_date).toLocaleDateString('en-IN')}</p>
                          </div>
                          {isLocked ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold">
                              <Lock size={10} /> Locked
                            </span>
                          ) : isApproved ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">
                              <CheckCircle2 size={10} /> Fully Approved
                            </span>
                          ) : isInitiated ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                              <CheckSquare size={10} /> Approval Initiated
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                              <GitMerge size={10} /> WFL Assigned
                            </span>
                          )}
                        </div>

                        {/* Locked confirmation banner */}
                        {isLocked && (
                          <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                            <Lock size={15} className="text-gray-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-gray-800">Allocation Run Locked</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">This allocation run has been locked. No further changes can be made to allotments in this cycle. Records are now archived for audit.</p>
                            </div>
                          </div>
                        )}

                        {/* Approved success banner */}
                        {isApproved && !isLocked && (
                          <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                            <CheckCircle2 size={15} className="text-teal-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-teal-800">All Approvals Completed</p>
                              <p className="text-[11px] text-teal-600 mt-0.5 leading-relaxed">All {cycle.allotment_count} allotments in this cycle have been approved through the workflow. You may now lock this allocation run to finalise it.</p>
                            </div>
                          </div>
                        )}

                        {/* Workflow info */}
                        {wfl && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Assigned Workflow</div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <GitMerge size={13} className="text-gray-500 shrink-0" />
                                <span className="text-sm font-bold text-gray-800">{wfl.workflow_name}</span>
                              </div>
                              {wfl.description && (
                                <p className="text-[11px] text-gray-500 leading-relaxed ml-5">{wfl.description}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Approval levels */}
                        {levels.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Approval Levels</div>
                            <div className="space-y-2">
                              {levels.map((lvl, idx) => {
                                const isCurrentLevel = isInitiated && idx === 0;
                                return (
                                  <div key={lvl.level} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                                    isApproved ? 'border-teal-100 bg-teal-50/50' : isCurrentLevel ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'
                                  }`}>
                                    <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                      isApproved ? 'bg-teal-600 text-white' : isCurrentLevel ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {isApproved ? <CheckCircle2 size={12} /> : lvl.level}
                                    </span>
                                    <span className={`text-xs font-semibold flex-1 ${isApproved ? 'text-teal-800' : isCurrentLevel ? 'text-blue-800' : 'text-gray-700'}`}>
                                      {lvl.approver_title || lvl.approver_role || `Level ${lvl.level}`}
                                    </span>
                                    {isApproved ? (
                                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={8} /> Approved
                                      </span>
                                    ) : isCurrentLevel ? (
                                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Clock size={8} /> Pending
                                      </span>
                                    ) : isInitiated && idx > 0 ? (
                                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Awaiting</span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Summary stats */}
                        {(isInitiated || isApproved) && (
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Total Allotments', value: cycle.allotment_count, cls: 'bg-gray-50 border-gray-100 text-gray-700' },
                              { label: isApproved ? 'Pending' : 'Approval Pending', value: isApproved ? 0 : cycle.allotment_count, cls: isApproved ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-blue-50 border-blue-100 text-blue-700' },
                              { label: 'Approved', value: isApproved ? cycle.allotment_count : 0, cls: isApproved ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                            ].map(stat => (
                              <div key={stat.label} className={`rounded-xl border px-3 py-2.5 text-center ${stat.cls}`}>
                                <div className="text-xl font-bold">{stat.value}</div>
                                <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5 opacity-80">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer action */}
                      <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-br-2xl">
                        <button
                          onClick={() => setShowUnapprovedWFLPopup(false)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Close
                        </button>
                        {isApproved ? (
                          isLocked ? (
                            <div className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed select-none">
                              <Lock size={14} />
                              Allocation Run Locked
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {}}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors"
                              >
                                <Eye size={14} />
                                View Approval
                              </button>
                              <button
                                onClick={async () => {
                                  setUnapprWFLLocking(true);
                                  await new Promise(r => setTimeout(r, 900));
                                  setUnapprWFLLocking(false);
                                  setUnapprWFLLockedCycles(prev => [...prev, cycle.id]);
                                }}
                                disabled={unapprWFLLocking}
                                className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-teal-200"
                              >
                                {unapprWFLLocking ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    Locking…
                                  </>
                                ) : (
                                  <>
                                    <Lock size={14} />
                                    Lock Allocation Run
                                  </>
                                )}
                              </button>
                            </>
                          )
                        ) : isInitiated ? (
                          <button
                            onClick={() => {}}
                            className="flex-1 py-2.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye size={14} />
                            View Approval
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              setUnapprWFLInitiating(true);
                              await new Promise(r => setTimeout(r, 900));
                              setUnapprWFLInitiating(false);
                              setUnapprWFLInitiatedCycles(prev => [...prev, cycle.id]);
                            }}
                            disabled={unapprWFLInitiating}
                            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            {unapprWFLInitiating ? (
                              <>
                                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Initiating…
                              </>
                            ) : (
                              <>
                                <Zap size={14} />
                                Initiate Approval
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── EO: Override modal (globally mounted) ────────────────────────── */}
      {showOverrideModal && overrideAllotment && user && (
        <Suspense fallback={null}>
          <QuarterOverrideModal
            isOpen={showOverrideModal}
            allotment={overrideAllotment}
            allCycleAllotments={requests.filter(r => r.allotment).map(r => r.allotment as QuarterAllotment)}
            eoAuthId={user.id}
            onClose={() => { setShowOverrideModal(false); setOverrideAllotment(null); setOverrideRequest(null); }}
            onOverrideSaved={() => { setShowOverrideModal(false); setOverrideAllotment(null); setOverrideRequest(null); loadData(); }}
          />
        </Suspense>
      )}

      {/* Log Details Modal */}
      {logModal && (
        <LogDetailsModal
          title={logModal.title}
          subtitle={logModal.subtitle}
          entries={logEntries}
          loading={logLoading}
          onClose={() => { setLogModal(null); setLogEntries([]); }}
        />
      )}
    </div>
  );
};
