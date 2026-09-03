import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { isOccupiedStatus, isAllottedStatus } from '../components/quarters/quarterShared';
import type { Quarter } from '../services/quartersService';
import type { DPFilter, PrefItem, EORightMode } from '../types/quarterRequests';

// ─── Parameter bundle interfaces ──────────────────────────────────────────────

interface MenuCloseCtx {
  menuRef: RefObject<HTMLDivElement>;
  setOpenMenuId: (v: string | null) => void;
  setMenuPos: (v: { top: number; left: number } | null) => void;
}

interface AvqMenuCloseCtx {
  avqMenuRef: RefObject<HTMLDivElement>;
  setAvqMenuId: (v: string | null) => void;
  setAvqMenuPos: (v: { top: number; left: number } | null) => void;
}

interface FilterPopupCtx {
  modalFilterOpen: boolean;
  modalFilterRef: RefObject<HTMLDivElement>;
  setModalFilterOpen: (v: boolean) => void;
}

interface DpScrollCtx {
  dpScrollRef: RefObject<HTMLDivElement>;
  dpFilter: DPFilter;
  updateDpScrollState: () => void;
  eoMode: 'self' | 'employee' | null;
}

interface EoRightModeCtx {
  selectedRequestId: string | undefined;
  selectedRequestStatus: string | undefined;
  selectedAllotmentApprovalStatus: string | undefined;
  dpFilter: DPFilter;
  isEO: boolean;
  setEoRightMode: (v: EORightMode) => void;
  setApprovalAction: (v: 'approve' | 'clarify' | null) => void;
  setApprovalRemarks: (v: string) => void;
  setInspectionPanel: (v: 'list' | 'chat' | 'new') => void;
  setSelectedInspectionId: (v: string | null) => void;
  setEoRejectReason: (v: string) => void;
  setEoTrId: (v: string | null) => void;
  setEoTrAction: (v: 'approve' | 'reject' | null) => void;
  setEoTrNotes: (v: string) => void;
}

interface PrefAutoSelectCtx {
  selectedRequestId: string | undefined;
  selectedRequestPreferences: Array<{ preference_rank: number; quarter: unknown }> | undefined;
  setSelectedPrefQuarter: (v: Quarter | null) => void;
}

interface PrefillCtx {
  setPrefs: (v: PrefItem[]) => void;
  setShowNewModal: (v: boolean) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQuarterRequestsEffects(
  menu_: MenuCloseCtx,
  avqMenu_: AvqMenuCloseCtx,
  filterPopup_: FilterPopupCtx,
  dpScroll_: DpScrollCtx,
  eoRight_: EoRightModeCtx,
  prefAutoSelect_: PrefAutoSelectCtx,
  prefill_: PrefillCtx,
) {
  const location = useLocation();

  // Close dot-menu on outside click or Escape
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (menu_.menuRef.current && !menu_.menuRef.current.contains(e.target as Node)) {
        menu_.setOpenMenuId(null);
        menu_.setMenuPos(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { menu_.setOpenMenuId(null); menu_.setMenuPos(null); }
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close AVQ menu on outside click or Escape
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (avqMenu_.avqMenuRef.current && !avqMenu_.avqMenuRef.current.contains(e.target as Node)) {
        avqMenu_.setAvqMenuId(null);
        avqMenu_.setAvqMenuPos(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { avqMenu_.setAvqMenuId(null); avqMenu_.setAvqMenuPos(null); }
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close filter popup on outside click
  useEffect(() => {
    if (!filterPopup_.modalFilterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterPopup_.modalFilterRef.current && !filterPopup_.modalFilterRef.current.contains(e.target as Node)) {
        filterPopup_.setModalFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterPopup_.modalFilterOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll active DP card into view when filter changes
  useEffect(() => {
    const el = dpScroll_.dpScrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-dp-active="true"]') as HTMLElement | null;
    if (activeEl) {
      const offset = activeEl.offsetLeft - 16;
      el.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }
  }, [dpScroll_.dpFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset EO right panel state when selected request changes
  useEffect(() => {
    const s = eoRight_.selectedRequestStatus;
    const isOcc = s ? isOccupiedStatus(s) : false;
    const hasPendingApproval = eoRight_.selectedAllotmentApprovalStatus === 'PENDING';
    const isAllocatedEOStage = eoRight_.isEO && (eoRight_.dpFilter === 'allocated_em' || eoRight_.dpFilter === 'unapproved');
    const isSubOrAllot = s ? (s === 'SUBMITTED' || isAllottedStatus(s)) : false;
    const isSubmittedForEO = s === 'SUBMITTED' && eoRight_.isEO;
    eoRight_.setEoRightMode(
      isSubmittedForEO ? 'request_approval_chat'
        : isAllocatedEOStage ? 'approval_chat'
        : isOcc || isSubOrAllot ? 'chat'
        : hasPendingApproval ? 'approval_chat'
        : 'detail'
    );
    eoRight_.setApprovalAction(null);
    eoRight_.setApprovalRemarks('');
    eoRight_.setInspectionPanel('list');
    eoRight_.setSelectedInspectionId(null);
    eoRight_.setEoRejectReason('');
    eoRight_.setEoTrId(null);
    eoRight_.setEoTrAction(null);
    eoRight_.setEoTrNotes('');
  }, [eoRight_.selectedRequestId, eoRight_.dpFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select top preference quarter for detail view
  useEffect(() => {
    if (!prefAutoSelect_.selectedRequestId) return;
    const sorted = [...(prefAutoSelect_.selectedRequestPreferences ?? [])]
      .sort((a, b) => a.preference_rank - b.preference_rank);
    const topQ = sorted[0]?.quarter as Quarter | undefined;
    prefAutoSelect_.setSelectedPrefQuarter(topQ ?? null);
  }, [prefAutoSelect_.selectedRequestId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefill from freeview "Add to Request"
  useEffect(() => {
    const prefill = (location.state as { prefill?: Quarter })?.prefill;
    if (prefill) {
      prefill_.setPrefs([{ quarter: prefill, rank: 1 }]);
      prefill_.setShowNewModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps
}
