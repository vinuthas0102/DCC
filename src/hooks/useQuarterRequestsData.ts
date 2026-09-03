import React, { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import {
  quartersService,
  type QuarterRequest,
  type QuarterAllotmentCycle,
  type QuarterTenantRequest,
  type QuarterGuestInfo,
  type Quarter,
  type QuarterAllotmentApproval,
  type QuarterApprovalChat,
  type QuarterApprovalWorkflow,
  type QuarterRequestApproval,
  type QuarterRequestApprovalChat,
  type QuarterInspection,
  type QuarterInspectionChat,
  type QuarterHandover,
  type QuarterServiceChat,
  type QuarterAllotmentChat,
} from '../services/quartersService';
import { DEMO_MODE } from '../mocks/demoData';
import { isOccupiedStatus, isAllottedStatus } from '../components/quarters/quarterShared';
import type { DPFilter, PrefItem, NewRequestForm } from '../types/quarterRequests';
import type { UserDTO } from '../types/user.types';

// ─── Parameter bundle interfaces ──────────────────────────────────────────────

interface LoadDataCtx {
  setRequests: (v: QuarterRequest[] | ((prev: QuarterRequest[]) => QuarterRequest[])) => void;
  setActiveCycle: (v: QuarterAllotmentCycle | null) => void;
  setTenantRequests: (v: QuarterTenantRequest[]) => void;
  setDpFilter: (v: DPFilter) => void;
  setLoading: (v: boolean) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  isEO: boolean;
  eoMode: 'self' | 'employee' | null;
  user: UserDTO | null;
}

interface LoadModalCtx {
  setModalLoading: (v: boolean) => void;
  setModalQuarters: (v: Quarter[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  modalSearch: string;
  modalBhk: string;
  modalFurnishing: string;
  modalSortBy: string;
  modalGroundFloor: boolean;
  modalRecentlyRenovated: boolean;
  modalLocationArea: string;
  modalWesternToilet: boolean;
  modalIndianToilet: boolean;
  modalCarParking: boolean;
  modalPoojaRoom: boolean;
  modalBalcony: boolean;
  modalKitchenExhaust: boolean;
  modalLiftAccess: boolean;
  modalIndependentHouse: boolean;
  modalHousingStyle: string;
  prefs: PrefItem[];
  showNewModal: boolean;
}

interface LoadAllotNowCtx {
  setAllotNowLoading: (v: boolean) => void;
  setAllotNowQuarters: (v: Quarter[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  showAllotNowPicker: boolean;
  allotNowSearch: string;
  user: UserDTO | null;
  form: NewRequestForm;
}

interface LoadManualAllotCtx {
  setManualAllotLoading: (v: boolean) => void;
  setManualAllotQuarters: (v: Quarter[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  manualAllotPickerOpen: boolean;
  manualAllotSearch: string;
}

interface LoadGuestCtx {
  setGuestInfoLoading: (v: boolean) => void;
  setGuestInfoList: (v: QuarterGuestInfo[]) => void;
  allotmentId: string | undefined;
  showGuestInfoPopup: boolean;
}

interface DpScrollCtx {
  dpScrollRef: RefObject<HTMLDivElement>;
  setDpCanScrollLeft: (v: boolean) => void;
  setDpCanScrollRight: (v: boolean) => void;
  eoMode: 'self' | 'employee' | null;
}

interface AvailableQuartersCtx {
  setAvailableQuarters: (v: Quarter[]) => void;
  setAvailableQuartersLoading: (v: boolean) => void;
}

interface ApprovalCtx {
  selectedAllotmentId: string | undefined;
  selectedRequestId: string | undefined;
  selectedRequestStatus: string | undefined;
  isEO: boolean;
  eoMode: 'self' | 'employee' | null;
  setApprovalRecord: (v: QuarterAllotmentApproval | null) => void;
  setApprovalChats: (v: QuarterApprovalChat[]) => void;
  setRequestApprovalRecord: (v: QuarterRequestApproval | null) => void;
  setRequestApprovalChats: (v: QuarterRequestApprovalChat[]) => void;
  setRequestApprovalWorkflows: (v: QuarterApprovalWorkflow[]) => void;
}

interface InspectionCtx {
  selectedAllotmentId: string | undefined;
  selectedInspectionId: string | null;
  isEO: boolean;
  eoMode: 'self' | 'employee' | null;
  setInspections: (v: QuarterInspection[]) => void;
  setInspectionChats: (v: QuarterInspectionChat[]) => void;
}

interface HandoverCtx {
  selectedAllotmentId: string | undefined;
  isEO: boolean;
  eoMode: 'self' | 'employee' | null;
  setHandover: (v: QuarterHandover | null) => void;
}

interface ChatsCtx {
  selectedServiceId: string | null;
  selectedRequestId: string | undefined;
  selectedRequestAllotmentId: string | undefined;
  selectedRequestStatus: string | undefined;
  setServiceChats: React.Dispatch<React.SetStateAction<Record<string, QuarterServiceChat[]>>>;
  setAllotmentChats: React.Dispatch<React.SetStateAction<Record<string, QuarterAllotmentChat[]>>>;
}

interface DocUrlsCtx {
  expandedCardId: string | null;
  requestDocUrls: Record<string, { name: string; url: string }[]>;
  setRequestDocUrls: React.Dispatch<React.SetStateAction<Record<string, { name: string; url: string }[]>>>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQuarterRequestsData(
  loadData_: LoadDataCtx,
  loadModal_: LoadModalCtx,
  loadAllotNow_: LoadAllotNowCtx,
  loadManualAllot_: LoadManualAllotCtx,
  loadGuest_: LoadGuestCtx,
  dpScroll_: DpScrollCtx,
  avq_: AvailableQuartersCtx,
  approval_: ApprovalCtx,
  inspection_: InspectionCtx,
  handover_: HandoverCtx,
  chats_: ChatsCtx,
  docUrls_: DocUrlsCtx,
) {
  // ─── Callbacks ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    /* DEMO_MODE: data is pre-loaded from mock state; live fetch disabled
    if (!loadData_.user) return;
    loadData_.setLoading(true);
    try {
      const isEmployeeMode = loadData_.isEO && loadData_.eoMode === 'employee';
      const [reqs, cycle, tReqs] = await Promise.all([
        isEmployeeMode
          ? quartersService.getAllRequests()
          : quartersService.getMyRequests(loadData_.user.id),
        quartersService.getActiveCycle(),
        isEmployeeMode
          ? quartersService.getAllTenantRequests()
          : quartersService.getMyTenantRequests(loadData_.user.id),
      ]);
      const normalised = reqs.map((r: any) => ({
        ...r,
        allotment: Array.isArray(r.allotment) ? (r.allotment[0] ?? null) : r.allotment,
      }));
      loadData_.setRequests(normalised as QuarterRequest[]);
      loadData_.setActiveCycle(cycle);
      loadData_.setTenantRequests(tReqs);
      if (isEmployeeMode) {
        const hasOccupied  = normalised.some((r: any) => isOccupiedStatus(r.request_status));
        const hasAllocated = normalised.some((r: any) => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'APPROVED');
        const hasAllotted  = normalised.some((r: any) => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'PENDING');
        const hasSubmitted = normalised.some((r: any) => r.request_status === 'SUBMITTED');
        loadData_.setDpFilter(
          hasOccupied ? 'occupied' : hasAllocated ? 'allocated_em' : hasAllotted ? 'allotted' : hasSubmitted ? 'submitted' : 'occupied'
        );
      }
    } catch {
      loadData_.addToast('Failed to load data', 'error');
    } finally {
      loadData_.setLoading(false);
    }
    */
  }, [loadData_.user, loadData_.addToast, loadData_.isEO, loadData_.eoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadModalQuarters = useCallback(async () => {
    loadModal_.setModalLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: loadModal_.modalSearch || undefined,
        bhk_config: loadModal_.modalBhk || undefined,
        furnishing_status: loadModal_.modalFurnishing || undefined,
      });
      let filtered = data.filter(q => !loadModal_.prefs.find(p => p.quarter.id === q.id));
      if (loadModal_.modalGroundFloor) filtered = filtered.filter(q => q.floor_number === 0);
      if (loadModal_.modalRecentlyRenovated) filtered = filtered.filter(q => q.renovation_status?.toLowerCase().includes('renovated'));
      if (loadModal_.modalLocationArea.trim()) {
        const la = loadModal_.modalLocationArea.trim().toLowerCase();
        filtered = filtered.filter(q =>
          q.location_area?.toLowerCase().includes(la) || q.region?.toLowerCase().includes(la)
        );
      }
      if (loadModal_.modalWesternToilet) filtered = filtered.filter(q => q.toilet_western === true);
      if (loadModal_.modalIndianToilet) filtered = filtered.filter(q => q.toilet_indian === true);
      if (loadModal_.modalCarParking) filtered = filtered.filter(q => !!q.parking_details?.trim());
      if (loadModal_.modalPoojaRoom) filtered = filtered.filter(q => q.pooja_room === true);
      if (loadModal_.modalBalcony) filtered = filtered.filter(q => q.balcony === true);
      if (loadModal_.modalKitchenExhaust) filtered = filtered.filter(q => q.kitchen_exhaust === true);
      if (loadModal_.modalLiftAccess) filtered = filtered.filter(q => q.lift_access === true);
      if (loadModal_.modalIndependentHouse) filtered = filtered.filter(q => q.housing_style?.toLowerCase().includes('independent'));
      if (loadModal_.modalHousingStyle) filtered = filtered.filter(q => q.housing_style === loadModal_.modalHousingStyle);
      if (loadModal_.modalSortBy === 'rent_asc') filtered = [...filtered].sort((a, b) => a.monthly_rent - b.monthly_rent);
      else if (loadModal_.modalSortBy === 'rent_desc') filtered = [...filtered].sort((a, b) => b.monthly_rent - a.monthly_rent);
      loadModal_.setModalQuarters(filtered);
    } catch {
      loadModal_.addToast('Failed to load quarters', 'error');
    } finally {
      loadModal_.setModalLoading(false);
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    loadModal_.modalSearch, loadModal_.modalBhk, loadModal_.modalFurnishing, loadModal_.modalSortBy,
    loadModal_.modalGroundFloor, loadModal_.modalRecentlyRenovated, loadModal_.modalLocationArea,
    loadModal_.modalWesternToilet, loadModal_.modalIndianToilet, loadModal_.modalCarParking,
    loadModal_.modalPoojaRoom, loadModal_.modalBalcony, loadModal_.modalKitchenExhaust,
    loadModal_.modalLiftAccess, loadModal_.modalIndependentHouse, loadModal_.modalHousingStyle,
    loadModal_.prefs, loadModal_.addToast,
  ]);

  const loadAllotNowQuarters = useCallback(async () => {
    if (!loadAllotNow_.showAllotNowPicker) return;
    loadAllotNow_.setAllotNowLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: loadAllotNow_.allotNowSearch || undefined,
        bhk_config: (loadAllotNow_.user?.bhkEntitlement || loadAllotNow_.form.required_bhk_config) || undefined,
      });
      loadAllotNow_.setAllotNowQuarters(data);
    } catch {
      loadAllotNow_.addToast('Failed to load quarters', 'error');
    } finally {
      loadAllotNow_.setAllotNowLoading(false);
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    loadAllotNow_.showAllotNowPicker,
    loadAllotNow_.allotNowSearch,
    loadAllotNow_.user?.bhkEntitlement,
    loadAllotNow_.form.required_bhk_config,
    loadAllotNow_.addToast,
  ]);

  const loadManualAllotQuarters = useCallback(async () => {
    if (!loadManualAllot_.manualAllotPickerOpen) return;
    loadManualAllot_.setManualAllotLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: loadManualAllot_.manualAllotSearch || undefined,
      });
      loadManualAllot_.setManualAllotQuarters(data);
    } catch {
      loadManualAllot_.addToast('Failed to load quarters', 'error');
    } finally {
      loadManualAllot_.setManualAllotLoading(false);
    }
  }, [loadManualAllot_.manualAllotPickerOpen, loadManualAllot_.manualAllotSearch, loadManualAllot_.addToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGuestInfo = useCallback(async () => {
    const { allotmentId } = loadGuest_;
    if (!allotmentId) return;
    loadGuest_.setGuestInfoLoading(true);
    try {
      const list = await quartersService.getGuestInfo(allotmentId);
      loadGuest_.setGuestInfoList(list);
    } catch {} finally {
      loadGuest_.setGuestInfoLoading(false);
    }
  }, [loadGuest_.allotmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDpScrollState = useCallback(() => {
    const el = dpScroll_.dpScrollRef.current;
    if (!el) return;
    dpScroll_.setDpCanScrollLeft(el.scrollLeft > 2);
    dpScroll_.setDpCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Load data on mount (no-op in DEMO_MODE)
  useEffect(() => {
    if (!DEMO_MODE) loadData();
  }, [loadData]);

  // Load available quarters for the Available Quarters DP
  useEffect(() => {
    avq_.setAvailableQuartersLoading(true);
    quartersService.getQuarters({ occupancy_status: 'AVAILABLE' })
      .then(data => avq_.setAvailableQuarters(data.filter(q => q.occupancy_status === 'AVAILABLE')))
      .catch(() => {})
      .finally(() => avq_.setAvailableQuartersLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // DP scroll arrow visibility — attach scroll + resize observer
  useEffect(() => {
    const el = dpScroll_.dpScrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(updateDpScrollState);
    el.addEventListener('scroll', updateDpScrollState, { passive: true });
    const ro = new ResizeObserver(updateDpScrollState);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('scroll', updateDpScrollState); ro.disconnect(); };
  }, [updateDpScrollState, dpScroll_.eoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load modal quarters with 300ms debounce when modal is open or filters change
  useEffect(() => {
    if (!loadModal_.showNewModal) return;
    const t = setTimeout(loadModalQuarters, 300);
    return () => clearTimeout(t);
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    loadModal_.showNewModal,
    loadModal_.modalSearch, loadModal_.modalBhk, loadModal_.modalFurnishing, loadModal_.modalSortBy,
    loadModal_.modalGroundFloor, loadModal_.modalRecentlyRenovated, loadModal_.modalLocationArea,
    loadModal_.modalWesternToilet, loadModal_.modalIndianToilet, loadModal_.modalCarParking,
    loadModal_.modalPoojaRoom, loadModal_.modalBalcony, loadModal_.modalKitchenExhaust,
    loadModal_.modalLiftAccess, loadModal_.modalIndependentHouse, loadModal_.modalHousingStyle,
    loadModalQuarters,
  ]);

  // Load Allot Now picker quarters with 300ms debounce
  useEffect(() => {
    if (!loadAllotNow_.showAllotNowPicker) return;
    const t = setTimeout(loadAllotNowQuarters, 300);
    return () => clearTimeout(t);
  }, [loadAllotNow_.showAllotNowPicker, loadAllotNow_.allotNowSearch, loadAllotNowQuarters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load manual allot picker quarters with 300ms debounce
  useEffect(() => {
    if (!loadManualAllot_.manualAllotPickerOpen) return;
    const t = setTimeout(loadManualAllotQuarters, 300);
    return () => clearTimeout(t);
  }, [loadManualAllot_.manualAllotPickerOpen, loadManualAllot_.manualAllotSearch, loadManualAllotQuarters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load allotment-level approval + chats when selected allotment / EO mode changes
  useEffect(() => {
    const { selectedAllotmentId, isEO, eoMode } = approval_;
    if (!selectedAllotmentId || !(isEO && eoMode === 'employee')) return;
    quartersService.getApprovalForAllotment(selectedAllotmentId).then(record => {
      approval_.setApprovalRecord(record);
      if (record) {
        quartersService.getApprovalChats(record.id).then(approval_.setApprovalChats).catch(() => {});
      }
    }).catch(() => {});
  }, [approval_.selectedAllotmentId, approval_.isEO, approval_.eoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load request-level approval + chats for SUBMITTED records
  useEffect(() => {
    const { selectedRequestId, selectedRequestStatus, isEO, eoMode } = approval_;
    if (!selectedRequestId || selectedRequestStatus !== 'SUBMITTED' || !(isEO && eoMode === 'employee')) {
      approval_.setRequestApprovalRecord(null);
      approval_.setRequestApprovalChats([]);
      return;
    }
    quartersService.getApprovalForRequest(selectedRequestId).then(record => {
      approval_.setRequestApprovalRecord(record);
      if (record) {
        quartersService.getRequestApprovalChats(record.id).then(approval_.setRequestApprovalChats).catch(() => {});
      }
    }).catch(() => {});
  }, [approval_.selectedRequestId, approval_.selectedRequestStatus, approval_.isEO, approval_.eoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load approval workflows for all EO modes (needed by Run Allocation modal)
  useEffect(() => {
    if (!approval_.isEO) return;
    quartersService.getApprovalWorkflows().then(approval_.setRequestApprovalWorkflows).catch(() => {});
  }, [approval_.isEO]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load inspections for selected allotment
  useEffect(() => {
    const { selectedAllotmentId, isEO, eoMode } = inspection_;
    if (!selectedAllotmentId || !(isEO && eoMode === 'employee')) return;
    quartersService.getInspections(selectedAllotmentId).then(inspection_.setInspections).catch(() => {});
  }, [inspection_.selectedAllotmentId, inspection_.isEO, inspection_.eoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load inspection chats when selected inspection changes
  useEffect(() => {
    if (!inspection_.selectedInspectionId) return;
    quartersService.getInspectionChats(inspection_.selectedInspectionId).then(inspection_.setInspectionChats).catch(() => {});
  }, [inspection_.selectedInspectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load handover for selected allotment
  useEffect(() => {
    const { selectedAllotmentId, isEO, eoMode } = handover_;
    if (!selectedAllotmentId || !(isEO && eoMode === 'employee')) return;
    quartersService.getHandover(selectedAllotmentId).then(handover_.setHandover).catch(() => {});
  }, [handover_.selectedAllotmentId, handover_.isEO, handover_.eoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load guest info when guest info popup opens
  useEffect(() => {
    if (loadGuest_.showGuestInfoPopup) loadGuestInfo();
  }, [loadGuest_.showGuestInfoPopup, loadGuestInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load service chats when selectedServiceId changes
  useEffect(() => {
    if (!chats_.selectedServiceId) return;
    /* DEMO_MODE: service call disabled
    quartersService.getServiceChats(chats_.selectedServiceId).then(chats => {
      chats_.setServiceChats(prev => ({ ...prev, [chats_.selectedServiceId!]: chats }));
    }).catch(() => {});
    */
  }, [chats_.selectedServiceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load allotment chats when selected request changes
  useEffect(() => {
    const s = chats_.selectedRequestStatus;
    if (!s || !chats_.selectedRequestId) return;
    const isDraftOrSubmitted = s === 'DRAFT' || s === 'SUBMITTED';
    const hasAllotment = isAllottedStatus(s) || isOccupiedStatus(s);
    if (!isDraftOrSubmitted && !hasAllotment) return;
    const chatKey = isDraftOrSubmitted
      ? chats_.selectedRequestId
      : (chats_.selectedRequestAllotmentId ?? chats_.selectedRequestId);
    /* DEMO_MODE: service call disabled
    quartersService.getAllotmentChats(chatKey).then(chats => {
      chats_.setAllotmentChats(prev => ({ ...prev, [chatKey]: chats }));
    }).catch(() => {});
    */
  }, [chats_.selectedRequestId, chats_.selectedRequestAllotmentId, chats_.selectedRequestStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch document URLs when a card is expanded
  useEffect(() => {
    const { expandedCardId, requestDocUrls, setRequestDocUrls } = docUrls_;
    if (!expandedCardId || requestDocUrls[expandedCardId]) return;
    quartersService.getRequestDocUrls(expandedCardId)
      .then(docs => setRequestDocUrls(prev => ({ ...prev, [expandedCardId]: docs })))
      .catch(() => setRequestDocUrls(prev => ({ ...prev, [expandedCardId]: [] })));
  }, [docUrls_.expandedCardId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { loadData, loadGuestInfo, updateDpScrollState };
}
