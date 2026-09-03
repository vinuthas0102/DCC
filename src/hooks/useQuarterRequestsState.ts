import { useState, useRef } from 'react';
import type {
  DPFilter, PrefItem, NewRequestForm, ActionPopupState,
  RequestForType, DemoEmployee, TPInfo, EOMode, EORightMode, RightAction,
} from '../types/quarterRequests';
import type {
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
  ChatDeliveryMode,
  QuarterHandover,
  QuarterGuestInfo,
} from '../services/quartersService';
import { DEMO_MODE, DEMO_REQUESTS, DEMO_TENANT_REQUESTS, DEMO_CYCLE } from '../mocks/demoData';
import { buildDefaultChecklist, type ChecklistItemDraft } from '../constants/inspectionChecklist';
import type { UploadedDoc } from '../components/quarters/NewRequestModal';

const EMPTY_TP: TPInfo = { name: '', organization: '', mobile: '', email: '', pan: '', notes: '' };

export function useQuarterRequestsState() {
  // ── Core data ──────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<QuarterRequest[]>(DEMO_MODE ? DEMO_REQUESTS : []);
  const [tenantRequests, setTenantRequests] = useState<QuarterTenantRequest[]>(DEMO_MODE ? DEMO_TENANT_REQUESTS : []);
  const [selectedRequest, setSelectedRequest] = useState<QuarterRequest | null>(null);
  const [activeCycle, setActiveCycle] = useState<QuarterAllotmentCycle | null>(DEMO_MODE ? DEMO_CYCLE : null);
  const [loading, setLoading] = useState(DEMO_MODE ? false : true);

  // ── EO mode ────────────────────────────────────────────────────────────────
  const [eoMode, setEOMode] = useState<EOMode>(null);

  // ── EO My Allotment: Allot Now ─────────────────────────────────────────────
  const [allotNowQuarterId, setAllotNowQuarterId] = useState<string | null>(null);
  const [allotNowQuarter, setAllotNowQuarter] = useState<Quarter | null>(null);
  const [allotNowSubmitting, setAllotNowSubmitting] = useState(false);
  const [showAllotNowPicker, setShowAllotNowPicker] = useState(false);
  const [allotNowSearch, setAllotNowSearch] = useState('');
  const [allotNowQuarters, setAllotNowQuarters] = useState<Quarter[]>([]);
  const [allotNowLoading, setAllotNowLoading] = useState(false);

  // ── EO Employee mode: override modal ──────────────────────────────────────
  const [overrideAllotment, setOverrideAllotment] = useState<QuarterAllotment | null>(null);
  const [overrideRequest, setOverrideRequest] = useState<QuarterRequest | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // ── EO Employee mode: manual allot quarter picker ──────────────────────────
  const [manualAllotPickerOpen, setManualAllotPickerOpen] = useState(false);
  const [manualAllotSearch, setManualAllotSearch] = useState('');
  const [manualAllotQuarters, setManualAllotQuarters] = useState<Quarter[]>([]);
  const [manualAllotLoading, setManualAllotLoading] = useState(false);
  const [manualAllotSubmitting, setManualAllotSubmitting] = useState(false);

  // ── EO Employee mode: approve/reject tenant request panel ─────────────────
  const [eoTrId, setEoTrId] = useState<string | null>(null);
  const [eoTrAction, setEoTrAction] = useState<'approve' | 'reject' | null>(null);
  const [eoTrNotes, setEoTrNotes] = useState('');
  const [eoTrSubmitting, setEoTrSubmitting] = useState(false);

  // ── Service card three-dot action menu ────────────────────────────────────
  const [svcMenuOpenId, setSvcMenuOpenId] = useState<string | null>(null);

  // ── EO: Run Allocation popup ───────────────────────────────────────────────
  const [showRunAllocationPopup, setShowRunAllocationPopup] = useState(false);
  const [runAllocSubmitting, setRunAllocSubmitting] = useState(false);
  const [runAllocCycleName, setRunAllocCycleName] = useState('');
  const [runAllocStart, setRunAllocStart] = useState('');
  const [runAllocEnd, setRunAllocEnd] = useState('');
  const [runAllocCycleTime, setRunAllocCycleTime] = useState('');
  const [runAllocLastDate, setRunAllocLastDate] = useState('');
  const [runAllocCurrentDate, setRunAllocCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [runAllocGrade, setRunAllocGrade] = useState('');
  const [runAllocQuarterType, setRunAllocQuarterType] = useState('');
  const [runAllocMedical, setRunAllocMedical] = useState(false);
  const [runAllocWorkflowId, setRunAllocWorkflowId] = useState('');
  const [runAllocApproverUsers, setRunAllocApproverUsers] = useState<Record<number, { id: string; full_name: string; govt_employee_id: string; email: string } | null>>({});
  const [runAllocPickingLevel, setRunAllocPickingLevel] = useState<number | null>(null);
  const [runAllocUserSearch, setRunAllocUserSearch] = useState('');

  // ── EO: Cycle history popup ────────────────────────────────────────────────
  const [showCycleHistory, setShowCycleHistory] = useState(false);
  const [cycleHistoryList, setCycleHistoryList] = useState<QuarterAllotmentCycle[]>([]);
  const [cycleHistoryLoading, setCycleHistoryLoading] = useState(false);
  const [selectedCycleDetail, setSelectedCycleDetail] = useState<QuarterAllotmentCycle | null>(null);
  const [cycleDetailRequests, setCycleDetailRequests] = useState<QuarterRequest[]>([]);
  const [cycleDetailLoading, setCycleDetailLoading] = useState(false);

  // ── EO: Approval workflow panel (allotment-level) ─────────────────────────
  const [approvalRecord, setApprovalRecord] = useState<QuarterAllotmentApproval | null>(null);
  const [approvalChats, setApprovalChats] = useState<QuarterApprovalChat[]>([]);
  const [approvalChatMsg, setApprovalChatMsg] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'clarify' | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvalTargetLevel, setApprovalTargetLevel] = useState(1);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  // ── EO: Request-level approval ─────────────────────────────────────────────
  const [requestApprovalRecord, setRequestApprovalRecord] = useState<QuarterRequestApproval | null>(null);
  const [requestApprovalChats, setRequestApprovalChats] = useState<QuarterRequestApprovalChat[]>([]);
  const [requestApprovalAction, setRequestApprovalAction] = useState<'approve' | 'clarify' | null>(null);
  const [requestApprovalRemarks, setRequestApprovalRemarks] = useState('');
  const [requestApprovalTargetLevel, setRequestApprovalTargetLevel] = useState(1);
  const [requestApprovalSubmitting, setRequestApprovalSubmitting] = useState(false);
  const [requestApprovalWorkflows, setRequestApprovalWorkflows] = useState<QuarterApprovalWorkflow[]>([]);
  const [initiatingRequestApproval, setInitiatingRequestApproval] = useState(false);
  const [initiatingAllotmentApproval, setInitiatingAllotmentApproval] = useState(false);
  const [savingAllotmentWorkflow, setSavingAllotmentWorkflow] = useState(false);

  // ── EO: Inspection panel ──────────────────────────────────────────────────
  const [inspections, setInspections] = useState<QuarterInspection[]>([]);
  const [inspectionChats, setInspectionChats] = useState<QuarterInspectionChat[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [inspectionPanel, setInspectionPanel] = useState<'list' | 'chat' | 'new'>('list');
  const [inspectionOpeningRemark, setInspectionOpeningRemark] = useState('');
  const [inspectionInspectorName, setInspectionInspectorName] = useState('');
  const [inspectionInitialCondition, setInspectionInitialCondition] = useState('GOOD');
  const [inspectionChecklist, setInspectionChecklist] = useState<ChecklistItemDraft[]>(() => buildDefaultChecklist());
  const [inspectionChatMsg, setInspectionChatMsg] = useState('');
  const [inspectionChatFile, setInspectionChatFile] = useState<File | null>(null);
  const [inspectionSubmitting, setInspectionSubmitting] = useState(false);
  const [inspectionChatMode, setInspectionChatMode] = useState<ChatDeliveryMode[]>(['IN_APP']);
  const [inspectionCloseRemarks, setInspectionCloseRemarks] = useState('');
  const [inspectionCondition, setInspectionCondition] = useState('GOOD');

  // ── EO: Handover popup ────────────────────────────────────────────────────
  const [showHandoverPopup, setShowHandoverPopup] = useState(false);
  const [handover, setHandover] = useState<QuarterHandover | null>(null);
  const [handoverKeyNo, setHandoverKeyNo] = useState('');
  const [handoverRemarks, setHandoverRemarks] = useState('');
  const [handoverDeadline, setHandoverDeadline] = useState('');
  const [handoverInteriorFile, setHandoverInteriorFile] = useState<File | null>(null);
  const [handoverReportFile, setHandoverReportFile] = useState<File | null>(null);
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);

  // ── EO: Guest Info panel / popup ──────────────────────────────────────────
  const [showGuestInfoPopup, setShowGuestInfoPopup] = useState(false);
  const [guestInfoList, setGuestInfoList] = useState<QuarterGuestInfo[]>([]);
  const [guestInfoLoading, setGuestInfoLoading] = useState(false);
  const [guestForm, setGuestForm] = useState({ name: '', mobile: '', email: '' });
  const [guestAadhaarFile, setGuestAadhaarFile] = useState<File | null>(null);
  const [guestPanFile, setGuestPanFile] = useState<File | null>(null);
  const [guestOtherFiles, setGuestOtherFiles] = useState<File[]>([]);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  // ── EO: Right panel mode ──────────────────────────────────────────────────
  const [eoRightMode, setEoRightMode] = useState<EORightMode>('detail');
  const [eoRejectReason, setEoRejectReason] = useState('');
  const [eoRejectSubmitting, setEoRejectSubmitting] = useState(false);


  // ── EO Employee mode: inline reject modal ─────────────────────────────────
  const [rejectModalReqId, setRejectModalReqId] = useState<string | null>(null);
  const [rejectModalReason, setRejectModalReason] = useState('');
  const [rejectModalDocFile, setRejectModalDocFile] = useState<File | null>(null);
  const [rejectModalSubmitting, setRejectModalSubmitting] = useState(false);

  // ── Dashboard filter + scroll refs ────────────────────────────────────────
  const [dpFilter, setDpFilter] = useState<DPFilter>('allotted');
  const dpScrollRef = useRef<HTMLDivElement>(null);
  const [dpCanScrollLeft, setDpCanScrollLeft] = useState(false);
  const [dpCanScrollRight, setDpCanScrollRight] = useState(false);

  // ── Per-request uploaded document URLs ────────────────────────────────────
  const [requestDocUrls, setRequestDocUrls] = useState<Record<string, { name: string; url: string }[]>>({});

  // ── Medical document post-submission upload ───────────────────────────────
  const [medDocFile, setMedDocFile] = useState<File | null>(null);
  const [medDocSubmitting, setMedDocSubmitting] = useState(false);

  // ── New-request full-screen modal ─────────────────────────────────────────
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState<NewRequestForm>({
    request_reason: '', preferred_location: '', move_in_date: '', employee_notes: '', request_type: 'GENERAL',
  });
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [requestDocuments, setRequestDocuments] = useState<UploadedDoc[]>([]);
  const [modalQuarters, setModalQuarters] = useState<Quarter[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalFilterOpen, setModalFilterOpen] = useState(false);
  const [modalBhk, setModalBhk] = useState('');
  const [modalFurnishing, setModalFurnishing] = useState('');
  const [modalSortBy, setModalSortBy] = useState('');
  const [modalGroundFloor, setModalGroundFloor] = useState(false);
  const [modalRecentlyRenovated, setModalRecentlyRenovated] = useState(false);
  const [modalLocationArea, setModalLocationArea] = useState('');
  const [modalWesternToilet, setModalWesternToilet] = useState(false);
  const [modalIndianToilet, setModalIndianToilet] = useState(false);
  const [modalCarParking, setModalCarParking] = useState(false);
  const [modalPoojaRoom, setModalPoojaRoom] = useState(false);
  const [modalBalcony, setModalBalcony] = useState(false);
  const [modalKitchenExhaust, setModalKitchenExhaust] = useState(false);
  const [modalLiftAccess, setModalLiftAccess] = useState(false);
  const [modalIndependentHouse, setModalIndependentHouse] = useState(false);
  const [modalHousingStyle, setModalHousingStyle] = useState('');
  const modalFilterRef = useRef<HTMLDivElement>(null);

  // ── Decline allotment modal (card-level) ──────────────────────────────────
  const [declineModalReqId, setDeclineModalReqId] = useState<string | null>(null);
  const [declineModalRemarks, setDeclineModalRemarks] = useState('');
  const [declineModalDocUrl, setDeclineModalDocUrl] = useState<File | null>(null);
  const [declineModalSubmitting, setDeclineModalSubmitting] = useState(false);

  // ── Request-For state (new request form) ──────────────────────────────────
  const [requestFor, setRequestFor] = useState<RequestForType>('SELF');
  const [selectedEmployee, setSelectedEmployee] = useState<DemoEmployee | null>(null);
  const [tpInfo, setTpInfo] = useState<TPInfo>(EMPTY_TP);
  const [tpInfoConfirmed, setTpInfoConfirmed] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showTPForm, setShowTPForm] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('');
  const [tpFormDraft, setTpFormDraft] = useState<TPInfo>(EMPTY_TP);

  // ── Full-screen request detail view ───────────────────────────────────────
  const [detailRequest, setDetailRequest] = useState<QuarterRequest | null>(null);
  const [detailReturnFilter, setDetailReturnFilter] = useState<DPFilter>('allotted');

  // ── List filters ──────────────────────────────────────────────────────────
  const [reqSearch, setReqSearch] = useState('');
  const [reqSort, setReqSort] = useState<'newest' | 'oldest'>('newest');
  const [reqBhkFilter, setReqBhkFilter] = useState<string>('ALL');
  const [reqToiletFilter, setReqToiletFilter] = useState<string[]>([]);
  const [reqFloorFilter, setReqFloorFilter] = useState<number[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  // Extended filters — Estate Manager (all DPs)
  const [reqHousingStyleFilter, setReqHousingStyleFilter] = useState('');
  const [reqRequestTypeFilter, setReqRequestTypeFilter] = useState<string[]>([]);
  const [reqLocationFilter, setReqLocationFilter] = useState('');
  const [reqDateFrom, setReqDateFrom] = useState('');
  const [reqDateTo, setReqDateTo] = useState('');
  const [reqGradeFilter, setReqGradeFilter] = useState('');
  // Extended filters — Govt Official tab-specific
  const [reqApprovalStatusFilter, setReqApprovalStatusFilter] = useState<string[]>([]);
  const [reqOccupancyStatusFilter, setReqOccupancyStatusFilter] = useState<string[]>([]);
  const [reqOccupiedDateFrom, setReqOccupiedDateFrom] = useState('');
  const [reqOccupiedDateTo, setReqOccupiedDateTo] = useState('');
  const [reqDeclinedDateFrom, setReqDeclinedDateFrom] = useState('');
  const [reqDeclinedDateTo, setReqDeclinedDateTo] = useState('');
  const [reqUnitNumberFilter, setReqUnitNumberFilter] = useState('');

  // ── Selected preference quarter for detail view ───────────────────────────
  const [selectedPrefQuarter, setSelectedPrefQuarter] = useState<Quarter | null>(null);

  // ── Right-panel action state ──────────────────────────────────────────────
  const [rightAction, setRightAction] = useState<RightAction>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionDocUrl, setActionDocUrl] = useState<File | null>(null);
  const [actionDate, setActionDate] = useState('');
  const [actionBhk, setActionBhk] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // ── Card-level accept inline state ────────────────────────────────────────
  const [acceptCardId, setAcceptCardId] = useState<string | null>(null);
  const [acceptCardRemarks, setAcceptCardRemarks] = useState('');
  const [acceptCardSubmitting, setAcceptCardSubmitting] = useState(false);

  // ── New Inspection modal (Accepted DP filter) ─────────────────────────────
  const [inspectTarget, setInspectTarget] = useState<QuarterRequest | null>(null);
  const [inspectRemarks, setInspectRemarks] = useState('');
  const [inspectInspectorName, setInspectInspectorName] = useState('');
  const [inspectCondition, setInspectCondition] = useState('GOOD');
  const [inspectChecklist, setInspectChecklist] = useState<ChecklistItemDraft[]>(() => buildDefaultChecklist());
  const [inspectSubmitting, setInspectSubmitting] = useState(false);

  // ── Allot with Approval popup ─────────────────────────────────────────────
  const [showAllotApprovalPopup, setShowAllotApprovalPopup] = useState(false);
  const [allotApprovalWflId, setAllotApprovalWflId] = useState('');
  const [allotApprovalUsers, setAllotApprovalUsers] = useState<string[]>([]);
  const [allotApprovalSubmitting, setAllotApprovalSubmitting] = useState(false);
  const [allotApprovalRequestId, setAllotApprovalRequestId] = useState<string | null>(null);

  // ── Quarter preview modal ─────────────────────────────────────────────────
  const [previewQuarterId, setPreviewQuarterId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ── Service chats for occupied panel ──────────────────────────────────────
  const [serviceChats, setServiceChats] = useState<Record<string, QuarterServiceChat[]>>({});
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [servicesHistoryMode, setServicesHistoryMode] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatAttachFile, setChatAttachFile] = useState<File | null>(null);
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [serviceChatMode, setServiceChatMode] = useState<ChatDeliveryMode[]>(['IN_APP']);

  // ── Allotment chats for allotted panel ────────────────────────────────────
  const [allotmentChats, setAllotmentChats] = useState<Record<string, QuarterAllotmentChat[]>>({});
  const [allotmentChatMessage, setAllotmentChatMessage] = useState('');
  const [allotmentChatFile, setAllotmentChatFile] = useState<File | null>(null);
  const [allotmentChatSubmitting, setAllotmentChatSubmitting] = useState(false);
  const [allotmentChatMode, setAllotmentChatMode] = useState<ChatDeliveryMode[]>(['IN_APP']);

  // ── Available Quarters DP ─────────────────────────────────────────────────
  const [availableQuarters, setAvailableQuarters] = useState<Quarter[]>([]);
  const [availableQuartersLoading, setAvailableQuartersLoading] = useState(false);
  const [avqSearch, setAvqSearch] = useState('');
  const [avqBhkFilter, setAvqBhkFilter] = useState('ALL');
  const [avqFloorFilter, setAvqFloorFilter] = useState<number[]>([]);
  const [avqGroundFloor, setAvqGroundFloor] = useState(false);
  const [avqRecentlyRenovated, setAvqRecentlyRenovated] = useState(false);
  const [avqLocationArea, setAvqLocationArea] = useState('');
  const [avqWesternToilet, setAvqWesternToilet] = useState(false);
  const [avqIndianToilet, setAvqIndianToilet] = useState(false);
  const [avqCarParking, setAvqCarParking] = useState(false);
  const [avqPoojaRoom, setAvqPoojaRoom] = useState(false);
  const [avqBalcony, setAvqBalcony] = useState(false);
  const [avqKitchenExhaust, setAvqKitchenExhaust] = useState(false);
  const [avqLiftAccess, setAvqLiftAccess] = useState(false);
  const [avqHousingStyle, setAvqHousingStyle] = useState('');
  const [avqFilterDrawerOpen, setAvqFilterDrawerOpen] = useState(false);
  const [avqDetailQuarterId, setAvqDetailQuarterId] = useState<string | null>(null);
  const [avqMenuId, setAvqMenuId] = useState<string | null>(null);
  const [avqMenuPos, setAvqMenuPos] = useState<{ top: number; left: number } | null>(null);
  const avqMenuRef = useRef<HTMLDivElement>(null);
  const [showNewQuarterModal, setShowNewQuarterModal] = useState(false);
  const [newQuarterSubmitting, setNewQuarterSubmitting] = useState(false);

  // ── Card-level dot-menu (portal-based) ────────────────────────────────────
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [chatOpenForId, setChatOpenForId] = useState<string | null>(null);
  const [expandedSvcsCardId, setExpandedSvcsCardId] = useState<string | null>(null);
  const [expandedSvcDetailId, setExpandedSvcDetailId] = useState<string | null>(null);

  // ── Lightbox ──────────────────────────────────────────────────────────────
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ── Inline action popup (card-level icons) ────────────────────────────────
  const [actionPopup, setActionPopup] = useState<ActionPopupState>({ type: null, requestId: '', allotmentId: '' });
  const [popupReason, setPopupReason] = useState('');
  const [popupRemarks, setPopupRemarks] = useState('');
  const [popupDocUrl, setPopupDocUrl] = useState<File | null>(null);
  const [popupDate, setPopupDate] = useState('');
  const [popupSubject, setPopupSubject] = useState('');
  const [popupUrgency, setPopupUrgency] = useState('NORMAL');
  const [popupSubmitting, setPopupSubmitting] = useState(false);
  const [popupInspectorName, setPopupInspectorName] = useState('');
  const [popupOpeningRemarks, setPopupOpeningRemarks] = useState('');
  const [popupChecklist, setPopupChecklist] = useState<ChecklistItemDraft[]>(() => buildDefaultChecklist());
  const [popupCondition, setPopupCondition] = useState('GOOD');
  const [popupKeyNumber, setPopupKeyNumber] = useState('');
  const [popupHandoverDeadline, setPopupHandoverDeadline] = useState('');
  const [popupHandoverInteriorFile, setPopupHandoverInteriorFile] = useState<File | null>(null);
  const [popupHandoverReportFile, setPopupHandoverReportFile] = useState<File | null>(null);
  const [popupRetentionReason, setPopupRetentionReason] = useState('On retirement');
  const [popupRequestedMonths, setPopupRequestedMonths] = useState(2);

  // ── Vacate popup: designation name resolved async ────────────────────────
  const [vacateDesignationName, setVacateDesignationName] = useState('');

  // ── Upgrade Request Modal ─────────────────────────────────────────────────
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalQuarters, setUpgradeModalQuarters] = useState<Quarter[]>([]);
  const [upgradeModalLoading, setUpgradeModalLoading] = useState(false);

  // ── Allocated DP: Assign WFL popup ────────────────────────────────────────
  const [showAllocatedWFLPopup, setShowAllocatedWFLPopup] = useState(false);
  const [allocWFLSelectedCycleId, setAllocWFLSelectedCycleId] = useState<string | null>(null);
  const [allocWFLWorkflowId, setAllocWFLWorkflowId] = useState('');
  const [allocWFLApproverUsers, setAllocWFLApproverUsers] = useState<Record<number, { id: string; full_name: string; govt_employee_id: string; email: string } | null>>({});
  const [allocWFLPickingLevel, setAllocWFLPickingLevel] = useState<number | null>(null);
  const [allocWFLUserSearch, setAllocWFLUserSearch] = useState('');
  const [allocWFLAvailableUsers, setAllocWFLAvailableUsers] = useState<{ id: string; full_name: string; govt_department: string; govt_employee_id: string; email: string }[]>([]);
  const [allocWFLSubmitting, setAllocWFLSubmitting] = useState(false);
  const [allocWFLSuccess, setAllocWFLSuccess] = useState(false);

  // ── Unapproved DP: Manage WFL popup ───────────────────────────────────────
  const [showUnapprovedWFLPopup, setShowUnapprovedWFLPopup] = useState(false);
  const [unapprWFLSelectedCycleId, setUnapprWFLSelectedCycleId] = useState<string | null>(null);
  const [unapprWFLInitiating, setUnapprWFLInitiating] = useState(false);
  const [unapprWFLInitiatedCycles, setUnapprWFLInitiatedCycles] = useState<string[]>([]);
  const [unapprWFLLockedCycles, setUnapprWFLLockedCycles] = useState<string[]>([]);
  const [unapprWFLLocking, setUnapprWFLLocking] = useState(false);

  return {
    requests, setRequests,
    tenantRequests, setTenantRequests,
    selectedRequest, setSelectedRequest,
    activeCycle, setActiveCycle,
    loading, setLoading,
    eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId,
    allotNowQuarter, setAllotNowQuarter,
    allotNowSubmitting, setAllotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker,
    allotNowSearch, setAllotNowSearch,
    allotNowQuarters, setAllotNowQuarters,
    allotNowLoading, setAllotNowLoading,
    overrideAllotment, setOverrideAllotment,
    overrideRequest, setOverrideRequest,
    showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen,
    manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, setManualAllotQuarters,
    manualAllotLoading, setManualAllotLoading,
    manualAllotSubmitting, setManualAllotSubmitting,
    eoTrId, setEoTrId,
    eoTrAction, setEoTrAction,
    eoTrNotes, setEoTrNotes,
    eoTrSubmitting, setEoTrSubmitting,
    svcMenuOpenId, setSvcMenuOpenId,
    showRunAllocationPopup, setShowRunAllocationPopup,
    runAllocSubmitting, setRunAllocSubmitting,
    runAllocCycleName, setRunAllocCycleName,
    runAllocStart, setRunAllocStart,
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
    cycleHistoryList, setCycleHistoryList,
    cycleHistoryLoading, setCycleHistoryLoading,
    selectedCycleDetail, setSelectedCycleDetail,
    cycleDetailRequests, setCycleDetailRequests,
    cycleDetailLoading, setCycleDetailLoading,
    approvalRecord, setApprovalRecord,
    approvalChats, setApprovalChats,
    approvalChatMsg, setApprovalChatMsg,
    approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks,
    approvalTargetLevel, setApprovalTargetLevel,
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
    inspections, setInspections,
    inspectionChats, setInspectionChats,
    selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel,
    inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionInspectorName, setInspectionInspectorName,
    inspectionInitialCondition, setInspectionInitialCondition,
    inspectionChecklist, setInspectionChecklist,
    inspectionChatMsg, setInspectionChatMsg,
    inspectionChatFile, setInspectionChatFile,
    inspectionSubmitting, setInspectionSubmitting,
    inspectionChatMode, setInspectionChatMode,
    inspectionCloseRemarks, setInspectionCloseRemarks,
    inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup,
    handover, setHandover,
    handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks,
    handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile,
    handoverReportFile, setHandoverReportFile,
    handoverSubmitting, setHandoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup,
    guestInfoList, setGuestInfoList,
    guestInfoLoading, setGuestInfoLoading,
    guestForm, setGuestForm,
    guestAadhaarFile, setGuestAadhaarFile,
    guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles,
    guestSubmitting, setGuestSubmitting,
    eoRightMode, setEoRightMode,
    eoRejectReason, setEoRejectReason,
    eoRejectSubmitting, setEoRejectSubmitting,
    rejectModalReqId, setRejectModalReqId,
    rejectModalReason, setRejectModalReason,
    rejectModalDocFile, setRejectModalDocFile,
    rejectModalSubmitting, setRejectModalSubmitting,
    dpFilter, setDpFilter,
    dpScrollRef,
    dpCanScrollLeft, setDpCanScrollLeft,
    dpCanScrollRight, setDpCanScrollRight,
    requestDocUrls, setRequestDocUrls,
    medDocFile, setMedDocFile,
    medDocSubmitting, setMedDocSubmitting,
    showNewModal, setShowNewModal,
    form, setForm,
    prefs, setPrefs,
    requestDocuments, setRequestDocuments,
    modalQuarters, setModalQuarters,
    modalSearch, setModalSearch,
    modalLoading, setModalLoading,
    submitting, setSubmitting,
    modalFilterOpen, setModalFilterOpen,
    modalBhk, setModalBhk,
    modalFurnishing, setModalFurnishing,
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
    modalFilterRef,
    declineModalReqId, setDeclineModalReqId,
    declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl,
    declineModalSubmitting, setDeclineModalSubmitting,
    requestFor, setRequestFor,
    selectedEmployee, setSelectedEmployee,
    tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed,
    showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm,
    employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter,
    tpFormDraft, setTpFormDraft,
    detailRequest, setDetailRequest,
    detailReturnFilter, setDetailReturnFilter,
    reqSearch, setReqSearch,
    reqSort, setReqSort,
    reqBhkFilter, setReqBhkFilter,
    reqToiletFilter, setReqToiletFilter,
    reqFloorFilter, setReqFloorFilter,
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
    rightAction, setRightAction,
    actionRemarks, setActionRemarks,
    actionReason, setActionReason,
    actionDocUrl, setActionDocUrl,
    actionDate, setActionDate,
    actionBhk, setActionBhk,
    actionSubmitting, setActionSubmitting,
    acceptCardId, setAcceptCardId,
    acceptCardRemarks, setAcceptCardRemarks,
    acceptCardSubmitting, setAcceptCardSubmitting,
    inspectTarget, setInspectTarget,
    inspectRemarks, setInspectRemarks,
    inspectInspectorName, setInspectInspectorName,
    inspectCondition, setInspectCondition,
    inspectChecklist, setInspectChecklist,
    inspectSubmitting, setInspectSubmitting,
    showAllotApprovalPopup, setShowAllotApprovalPopup,
    allotApprovalWflId, setAllotApprovalWflId,
    allotApprovalUsers, setAllotApprovalUsers,
    allotApprovalSubmitting, setAllotApprovalSubmitting,
    allotApprovalRequestId, setAllotApprovalRequestId,
    previewQuarterId, setPreviewQuarterId,
    isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats,
    selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode,
    chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile,
    chatSubmitting, setChatSubmitting,
    serviceChatMode, setServiceChatMode,
    allotmentChats, setAllotmentChats,
    allotmentChatMessage, setAllotmentChatMessage,
    allotmentChatFile, setAllotmentChatFile,
    allotmentChatSubmitting, setAllotmentChatSubmitting,
    allotmentChatMode, setAllotmentChatMode,
    availableQuarters, setAvailableQuarters,
    availableQuartersLoading, setAvailableQuartersLoading,
    avqSearch, setAvqSearch,
    avqBhkFilter, setAvqBhkFilter,
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
    avqFilterDrawerOpen, setAvqFilterDrawerOpen,
    avqDetailQuarterId, setAvqDetailQuarterId,
    avqMenuId, setAvqMenuId,
    avqMenuPos, setAvqMenuPos,
    avqMenuRef,
    showNewQuarterModal, setShowNewQuarterModal,
    newQuarterSubmitting, setNewQuarterSubmitting,
    openMenuId, setOpenMenuId,
    menuPos, setMenuPos,
    menuRef,
    expandedCardId, setExpandedCardId,
    chatOpenForId, setChatOpenForId,
    expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages,
    lightboxIndex, setLightboxIndex,
    lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup,
    popupReason, setPopupReason,
    popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl,
    popupDate, setPopupDate,
    popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency,
    popupSubmitting, setPopupSubmitting,
    popupInspectorName, setPopupInspectorName,
    popupOpeningRemarks, setPopupOpeningRemarks,
    popupChecklist, setPopupChecklist,
    popupCondition, setPopupCondition,
    popupKeyNumber, setPopupKeyNumber,
    popupHandoverDeadline, setPopupHandoverDeadline,
    popupHandoverInteriorFile, setPopupHandoverInteriorFile,
    popupHandoverReportFile, setPopupHandoverReportFile,
    popupRetentionReason, setPopupRetentionReason,
    popupRequestedMonths, setPopupRequestedMonths,
    vacateDesignationName, setVacateDesignationName,
    showUpgradeModal, setShowUpgradeModal,
    upgradeModalQuarters, setUpgradeModalQuarters,
    upgradeModalLoading, setUpgradeModalLoading,
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
  };
}
