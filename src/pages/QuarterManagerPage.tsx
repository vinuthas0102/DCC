import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home, ChevronRight, Building2, CheckCircle, Clock,
  Eye, Settings, Calendar, Users, Hash,
  FileCheck, XCircle, Send, PauseCircle, BarChart3, RefreshCw,
  ThumbsUp, ThumbsDown, ArrowRightCircle, LogOut, Search,
  Layers, Trash2, Ban, Star, Plus, ArrowLeftRight, Shuffle,
  HardHat, MoreVertical, MessageSquare, PlayCircle, X, Download,
  ClipboardList,
} from 'lucide-react';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { QuarterOverrideModal } from '../components/quarters/QuarterOverrideModal';
import { CyclesTabContent } from '../components/quarters/manager/CyclesTabContent';
import { CycleRequestsTabContent } from '../components/quarters/manager/CycleRequestsTabContent';
import { AllotmentsTabContent } from '../components/quarters/manager/AllotmentsTabContent';
import { AllRequestsTabContent } from '../components/quarters/manager/AllRequestsTabContent';
import { TenantServicesTabContent } from '../components/quarters/manager/TenantServicesTabContent';
import {
  quartersService,
  QuarterAllotmentCycle,
  QuarterRequest,
  QuarterAllotment,
  QuarterTenantRequest,
  QuarterInspection,
  QuarterInspectionChat,
  Quarter,
} from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { downloadPageAsHtml } from '../utils/downloadHtml';
import { LogDetailsModal, type LogEntry } from '../components/ui/LogDetailsModal';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
];
function getImage(q: Quarter, idx: number) {
  let images = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch {
      images = (images as unknown as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}
function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN');
}

function cycleStatusBadge(status: string) {
  if (status === 'OPEN') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'CLOSED') return 'bg-gray-100 text-gray-600 border border-gray-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

function reqStatusConfig(status: string) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    DRAFT:              { cls: 'bg-amber-50 text-amber-700 border border-amber-200',      label: 'Draft',          icon: <Clock size={11} /> },
    SUBMITTED:         { cls: 'bg-blue-50 text-blue-700 border border-blue-200',          label: 'Submitted',      icon: <Send size={11} /> },
    ALLOTTED:          { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Allotted',       icon: <CheckCircle size={11} /> },
    ACKNOWLEDGED:      { cls: 'bg-teal-50 text-teal-700 border border-teal-200',          label: 'Occupied',       icon: <ThumbsUp size={11} /> },
    REJECTED:          { cls: 'bg-red-50 text-red-700 border border-red-200',             label: 'Rejected',       icon: <ThumbsDown size={11} /> },
    WITHDRAWN:         { cls: 'bg-gray-100 text-gray-500 border border-gray-200',         label: 'Withdrawn',      icon: <XCircle size={11} /> },
    EXTEND_REQUESTED:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200',       label: 'Extension Req.', icon: <RefreshCw size={11} /> },
    UPGRADE_REQUESTED: { cls: 'bg-sky-50 text-sky-700 border border-sky-200',             label: 'Upgrade Req.',   icon: <ArrowRightCircle size={11} /> },
    VACATE_REQUESTED:  { cls: 'bg-orange-50 text-orange-700 border border-orange-200',    label: 'Vacate Req.',    icon: <LogOut size={11} /> },
    VACATED:           { cls: 'bg-gray-100 text-gray-500 border border-gray-200',         label: 'Vacated',        icon: <XCircle size={11} /> },
    ON_HOLD:           { cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200',    label: 'On Hold',        icon: <PauseCircle size={11} /> },
  };
  return cfg[status] ?? cfg.DRAFT;
}

function tenantServiceConfig(type: string) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    EXTEND:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200',    label: 'Extend',  icon: <RefreshCw size={11} /> },
    UPGRADE: { cls: 'bg-sky-50 text-sky-700 border border-sky-200',          label: 'Upgrade', icon: <ArrowRightCircle size={11} /> },
    VACATE:  { cls: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Vacate',  icon: <LogOut size={11} /> },
  };
  return cfg[type] ?? cfg.VACATE;
}

function tenantStatusBadge(status: string) {
  const cfg: Record<string, string> = {
    PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED:  'bg-red-50 text-red-700 border border-red-200',
    WITHDRAWN: 'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return cfg[status] ?? cfg.PENDING;
}

type Tab = 'cycles' | 'allotments' | 'requests' | 'all_requests' | 'tenant_requests';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'cycles',          label: 'Allotment Cycles', icon: <Calendar size={16} /> },
  { key: 'requests',        label: 'Cycle Requests',   icon: <FileCheck size={16} /> },
  { key: 'allotments',      label: 'Allotment Table',  icon: <BarChart3 size={16} /> },
  { key: 'all_requests',    label: 'All Requests',     icon: <Users size={16} /> },
  { key: 'tenant_requests', label: 'Tenant Services',  icon: <Settings size={16} /> },
];

const ALL_STATUS_OPTIONS = [
  { value: 'ALL',               label: 'All statuses' },
  { value: 'DRAFT',             label: 'Draft' },
  { value: 'SUBMITTED',         label: 'Submitted' },
  { value: 'ALLOTTED',          label: 'Allotted' },
  { value: 'ACKNOWLEDGED',      label: 'Occupied' },
  { value: 'UPGRADE_REQUESTED', label: 'Upgrade Req.' },
  { value: 'EXTEND_REQUESTED',  label: 'Extension Req.' },
  { value: 'VACATE_REQUESTED',  label: 'Vacate Req.' },
  { value: 'VACATED',           label: 'Vacated' },
  { value: 'REJECTED',          label: 'Rejected' },
  { value: 'WITHDRAWN',         label: 'Withdrawn' },
];

export const QuarterManagerPage: React.FC = () => {
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState<Tab>('cycles');
  const [cycles, setCycles] = useState<QuarterAllotmentCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<QuarterAllotmentCycle | null>(null);
  const [cycleRequests, setCycleRequests] = useState<QuarterRequest[]>([]);
  const [cycleAllotments, setCycleAllotments] = useState<QuarterAllotment[]>([]);
  const [allRequests, setAllRequests] = useState<QuarterRequest[]>([]);
  const [allTenantRequests, setAllTenantRequests] = useState<QuarterTenantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCycleData, setLoadingCycleData] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(false);

  type DPFilter = 'all' | 'occupied' | 'accepted' | 'allotted' | 'allotted_pending' | 'submitted' | 'draft';
  const [dpFilter, setDpFilter] = useState<DPFilter>('all');
  const [quartersSummary, setQuartersSummary] = useState<{ total: number; available: number; occupied: number } | null>(null);

  type ViewMode = 'dp' | 'allocation';
  const [viewMode, setViewMode] = useState<ViewMode>('dp');

  const [miniMenuTarget, setMiniMenuTarget] = useState<{ req: QuarterRequest; allotment: QuarterAllotment } | null>(null);
  const miniMenuRef = useRef<HTMLDivElement>(null);
  const [overrideInitialAction, setOverrideInitialAction] = useState<string | undefined>(undefined);

  const [cycleReqSearch, setCycleReqSearch] = useState('');
  const [allotSearch, setAllotSearch] = useState('');
  const [allReqSearch, setAllReqSearch] = useState('');
  const [allReqStatus, setAllReqStatus] = useState('ALL');
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState('ALL');
  const [tenantTypeFilter, setTenantTypeFilter] = useState('ALL');
  const [eoNotesMap, setEoNotesMap] = useState<Record<string, string>>({});
  const [processingTenant, setProcessingTenant] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<QuarterAllotment | null>(null);

  // Accepted DP filter — inspection state
  const [dpInspections, setDpInspections] = useState<Record<string, QuarterInspection[]>>({});
  const [dpInspectionChats, setDpInspectionChats] = useState<QuarterInspectionChat[]>([]);
  const [dpSelectedInspectionId, setDpSelectedInspectionId] = useState<string | null>(null);
  const [dpExpandedInspRowId, setDpExpandedInspRowId] = useState<string | null>(null);
  const [dpActionMenuReqId, setDpActionMenuReqId] = useState<string | null>(null);
  const dpActionMenuRef = useRef<HTMLDivElement>(null);

  // Log Details modal
  const [logModal, setLogModal] = useState<{ title: string; subtitle?: string } | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // New Inspection popup
  const [inspectTarget, setInspectTarget] = useState<QuarterRequest | null>(null);
  const [inspectRemarks, setInspectRemarks] = useState('');
  const [inspectCondition, setInspectCondition] = useState('GOOD');
  const [inspectSubmitting, setInspectSubmitting] = useState(false);

  // Inspection chat message
  const [dpInspChatMsg, setDpInspChatMsg] = useState('');

  const loadCycles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quartersService.getAllotmentCycles();
      setCycles(data);
      if (data.length > 0) setSelectedCycle(prev => prev ?? data[0]);
    } catch {
      addToast('Failed to load cycles', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadCycleData = useCallback(async (cycle: QuarterAllotmentCycle) => {
    setLoadingCycleData(true);
    try {
      const [reqs, allots] = await Promise.all([
        quartersService.getRequestsForCycle(cycle.id),
        quartersService.getAllotmentsForCycle(cycle.id),
      ]);
      setCycleRequests(reqs);
      setCycleAllotments(allots);
    } catch {
      addToast('Failed to load cycle data', 'error');
    } finally {
      setLoadingCycleData(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (selectedCycle) loadCycleData(selectedCycle);
  }, [selectedCycle, loadCycleData]);

  const loadAllRequests = useCallback(async () => {
    setLoadingAll(true);
    try {
      const data = await quartersService.getAllRequests();
      setAllRequests(data);
    } catch {
      addToast('Failed to load all requests', 'error');
    } finally {
      setLoadingAll(false);
    }
  }, [addToast]);

  const loadAllTenantRequests = useCallback(async () => {
    setLoadingTenant(true);
    try {
      const data = await quartersService.getAllTenantRequests();
      setAllTenantRequests(data);
    } catch {
      addToast('Failed to load tenant requests', 'error');
    } finally {
      setLoadingTenant(false);
    }
  }, [addToast]);

  const loadQuartersSummary = useCallback(async () => {
    try {
      const s = await quartersService.getQuartersSummary();
      setQuartersSummary(s);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadCycles();
    loadAllRequests();
    loadAllTenantRequests();
    loadQuartersSummary();
  }, [loadCycles, loadAllRequests, loadAllTenantRequests, loadQuartersSummary]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (miniMenuRef.current && !miniMenuRef.current.contains(e.target as Node)) {
        setMiniMenuTarget(null);
      }
    }
    if (miniMenuTarget) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [miniMenuTarget]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dpActionMenuRef.current && !dpActionMenuRef.current.contains(e.target as Node)) {
        setDpActionMenuReqId(null);
      }
    }
    if (dpActionMenuReqId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [dpActionMenuReqId]);

  useEffect(() => {
    if (dpFilter === 'accepted') {
      const accepted = allRequests.filter(r => r.request_status === 'ACKNOWLEDGED');
      if (accepted.length > 0) loadDpInspections(accepted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpFilter, allRequests]);

  const handleFinaliseCycle = async () => {
    if (!selectedCycle || !user) return;
    try {
      await quartersService.finaliseAllotments(selectedCycle.id, user.id, cycleRequests);
      addToast('Cycle finalised', 'success');
      loadCycles();
    } catch {
      addToast('Failed to finalise cycle', 'error');
    }
  };

  const handleApproveTenant = async (tr: QuarterTenantRequest) => {
    if (!tr.allotment?.request_id) return;
    setProcessingTenant(tr.id);
    try {
      await quartersService.approveTenantRequest(tr.id, tr.allotment.request_id, tr.service_type, eoNotesMap[tr.id] ?? '');
      addToast('Request approved', 'success');
      loadAllTenantRequests();
    } catch {
      addToast('Failed to approve', 'error');
    } finally {
      setProcessingTenant(null);
    }
  };

  const handleRejectTenant = async (tr: QuarterTenantRequest) => {
    if (!tr.allotment?.request_id) return;
    setProcessingTenant(tr.id);
    try {
      await quartersService.rejectTenantRequest(tr.id, tr.allotment.request_id, tr.service_type, eoNotesMap[tr.id] ?? '');
      addToast('Request rejected', 'success');
      loadAllTenantRequests();
    } catch {
      addToast('Failed to reject', 'error');
    } finally {
      setProcessingTenant(null);
    }
  };

  const handleDeallocate = async (req: QuarterRequest) => {
    const allotment = req.allotment;
    if (!allotment) return;
    try {
      await quartersService.deallocateRequest(allotment.id, req.id);
      addToast('Request deallocated — returned to Submitted', 'success');
      setMiniMenuTarget(null);
      loadAllRequests();
    } catch {
      addToast('Failed to deallocate', 'error');
    }
  };

  const handleCancelAllocated = async (req: QuarterRequest) => {
    const allotment = req.allotment;
    if (!allotment) return;
    try {
      await quartersService.cancelAllocatedRequest(allotment.id, req.id);
      addToast('Request cancelled', 'success');
      setMiniMenuTarget(null);
      loadAllRequests();
    } catch {
      addToast('Failed to cancel request', 'error');
    }
  };

  // Load inspections for all ACKNOWLEDGED requests when 'accepted' filter is active
  const loadDpInspections = useCallback(async (requests: QuarterRequest[]) => {
    const toLoad = requests.filter(r => r.allotment?.id && !dpInspections[r.allotment.id]);
    if (toLoad.length === 0) return;
    const results = await Promise.all(
      toLoad.map(r => quartersService.getInspections(r.allotment!.id).then(ins => ({ id: r.allotment!.id, ins })))
    );
    setDpInspections(prev => {
      const next = { ...prev };
      results.forEach(({ id, ins }) => { next[id] = ins; });
      return next;
    });
  }, [dpInspections]);

  const handleStartDpInspection = async () => {
    if (!inspectTarget?.allotment?.id || !user) return;
    setInspectSubmitting(true);
    try {
      const insp = await quartersService.startInspection(inspectTarget.allotment.id, user.id, inspectRemarks);
      setDpInspections(prev => ({
        ...prev,
        [inspectTarget.allotment!.id]: [insp, ...(prev[inspectTarget.allotment!.id] ?? [])],
      }));
      addToast('Inspection started', 'success');
      setInspectTarget(null);
      setInspectRemarks('');
      setInspectCondition('GOOD');
    } catch {
      addToast('Failed to start inspection', 'error');
    } finally {
      setInspectSubmitting(false);
    }
  };

  const handleSelectDpInspection = async (inspectionId: string) => {
    setDpSelectedInspectionId(inspectionId);
    try {
      const chats = await quartersService.getInspectionChats(inspectionId);
      setDpInspectionChats(chats);
    } catch {
      addToast('Failed to load inspection chat', 'error');
    }
  };

  const handleSendDpInspChat = async () => {
    if (!dpSelectedInspectionId || !user || !dpInspChatMsg.trim()) return;
    try {
      await quartersService.addInspectionChat(dpSelectedInspectionId, user.id, 'eo', dpInspChatMsg);
      setDpInspChatMsg('');
      const chats = await quartersService.getInspectionChats(dpSelectedInspectionId);
      setDpInspectionChats(chats);
    } catch {
      addToast('Failed to send message', 'error');
    }
  };

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
        message: `Request submitted`,
        tag: req.request_status,
        tagColor: 'gray',
      });
      if (req.allotment?.id) {
        const allotChats = await quartersService.getAllotmentChats(req.allotment.id).catch(() => []);
        for (const c of allotChats) {
          entries.push({ id: c.id, timestamp: c.created_at, actorRole: c.author_role, message: c.message, documentUrls: c.document_urls });
        }
        const svcChatsAll = await quartersService.getServiceChatsForAllotment(req.allotment.id).catch(() => []);
        for (const c of svcChatsAll) {
          entries.push({ id: c.id, timestamp: c.created_at, actorRole: c.author_role, message: c.message, documentUrls: c.document_urls });
        }
        const inspections = await quartersService.getInspections(req.allotment.id).catch(() => []);
        for (const insp of inspections) {
          entries.push({ id: `insp-${insp.id}`, timestamp: insp.created_at, actorRole: 'EO', message: `Inspection by ${insp.inspector_name ?? 'EO'} — ${insp.condition ?? ''}`, tag: 'INSPECTION', tagColor: 'sky' });
        }
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

  const filteredAllRequests = React.useMemo(() => {
    let r = [...allRequests];
    if (allReqStatus !== 'ALL') r = r.filter(x => x.request_status === allReqStatus);
    if (allReqSearch.trim()) {
      const q = allReqSearch.toLowerCase();
      r = r.filter(x =>
        x.request_number?.toLowerCase().includes(q) ||
        x.required_bhk_config?.toLowerCase().includes(q) ||
        x.preferred_location?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [allRequests, allReqStatus, allReqSearch]);

  const filteredTenantRequests = React.useMemo(() => {
    let r = [...allTenantRequests];
    if (tenantStatusFilter !== 'ALL') r = r.filter(x => x.request_status === tenantStatusFilter);
    if (tenantTypeFilter !== 'ALL') r = r.filter(x => x.service_type === tenantTypeFilter);
    if (tenantSearch.trim()) {
      const q = tenantSearch.toLowerCase();
      r = r.filter(x =>
        x.allotment?.quarter?.quarter_number?.toLowerCase().includes(q) ||
        x.reason?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [allTenantRequests, tenantStatusFilter, tenantTypeFilter, tenantSearch]);

  const allReqCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allRequests.forEach(r => { counts[r.request_status] = (counts[r.request_status] ?? 0) + 1; });
    return counts;
  }, [allRequests]);

  const dpCounts = React.useMemo(() => ({
    accepted:  allRequests.filter(r => r.request_status === 'ACKNOWLEDGED').length,
    occupied:  allRequests.filter(r => r.request_status === 'ACKNOWLEDGED').length,
    allotted:  allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status !== 'PENDING').length,
    allotted_pending: allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status === 'PENDING').length,
    submitted: allRequests.filter(r => r.request_status === 'SUBMITTED').length,
    draft:     allRequests.filter(r => r.request_status === 'DRAFT').length,
  }), [allRequests]);

  const dpFilteredRequests = React.useMemo(() => {
    if (dpFilter === 'all') return [];
    if (dpFilter === 'accepted')  return allRequests.filter(r => r.request_status === 'ACKNOWLEDGED');
    if (dpFilter === 'occupied')  return allRequests.filter(r => r.request_status === 'ACKNOWLEDGED');
    if (dpFilter === 'allotted')  return allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status !== 'PENDING');
    if (dpFilter === 'allotted_pending') return allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status === 'PENDING');
    if (dpFilter === 'submitted') return allRequests.filter(r => r.request_status === 'SUBMITTED');
    if (dpFilter === 'draft')     return allRequests.filter(r => r.request_status === 'DRAFT');
    return [];
  }, [allRequests, dpFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Home size={13} />
              <ChevronRight size={12} />
              <span>Estate Officer</span>
              <ChevronRight size={12} />
              <span className="text-gray-800 font-medium">Quarters Management</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quarters Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage allotment cycles, review requests, and process tenant services.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadPageAsHtml('/quarters/manager')}
              title="Download Offline Copy"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Download size={15} /> Download
            </button>
            <button
              onClick={() => setViewMode(v => v === 'allocation' ? 'dp' : 'allocation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'allocation'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={15} />
              Allocation
            </button>
          </div>
        </div>

        {/* DP Summary Cards */}
        {viewMode === 'dp' && <div className="mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quartersSummary && (
              <SummaryStatsCard
                label="Total Quarters"
                value={quartersSummary.total}
                icon={Building2}
                gradient="bg-gradient-to-r from-slate-600 to-slate-500"
                delay={0}
                subtitle="All housing units"
                secondaryValue={quartersSummary.available}
                secondaryLabel="Free"
              />
            )}
            {quartersSummary && quartersSummary.available > 0 && (
              <SummaryStatsCard
                label="Available"
                value={quartersSummary.available}
                icon={CheckCircle}
                gradient="bg-gradient-to-r from-emerald-400 to-teal-400"
                delay={25}
                subtitle="Ready for allotment"
                trend={quartersSummary.total > 0 ? Math.round((quartersSummary.available / quartersSummary.total) * 100) : 0}
              />
            )}
            {dpCounts.accepted > 0 && (
              <SummaryStatsCard
                label="Accepted"
                value={dpCounts.accepted}
                icon={HardHat}
                gradient="bg-gradient-to-r from-sky-500 to-blue-600"
                onClick={() => setDpFilter(dpFilter === 'accepted' ? 'all' : 'accepted')}
                isActive={dpFilter === 'accepted'}
                delay={75}
                subtitle="Awaiting inspection"
              />
            )}
            {dpCounts.allotted > 0 && (
              <SummaryStatsCard
                label="Allotted"
                value={dpCounts.allotted}
                icon={CheckCircle}
                gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
                onClick={() => setDpFilter(dpFilter === 'allotted' ? 'all' : 'allotted')}
                isActive={dpFilter === 'allotted'}
                delay={125}
                subtitle="Confirmed allotments"
              />
            )}
            {dpCounts.allotted_pending > 0 && (
              <SummaryStatsCard
                label="Allotted"
                value={dpCounts.allotted_pending}
                icon={Clock}
                gradient="bg-gradient-to-r from-amber-500 to-orange-400"
                onClick={() => setDpFilter(dpFilter === 'allotted_pending' ? 'all' : 'allotted_pending')}
                isActive={dpFilter === 'allotted_pending'}
                delay={175}
                subtitle="Pending check-in"
              />
            )}
            {dpCounts.submitted > 0 && (
              <SummaryStatsCard
                label="Submitted"
                value={dpCounts.submitted}
                icon={Send}
                gradient="bg-gradient-to-r from-blue-600 to-sky-500"
                onClick={() => setDpFilter(dpFilter === 'submitted' ? 'all' : 'submitted')}
                isActive={dpFilter === 'submitted'}
                delay={225}
                subtitle="Awaiting review"
              />
            )}
            {dpCounts.draft > 0 && (
              <SummaryStatsCard
                label="Draft"
                value={dpCounts.draft}
                icon={Hash}
                gradient="bg-gradient-to-r from-slate-400 to-gray-500"
                onClick={() => setDpFilter(dpFilter === 'draft' ? 'all' : 'draft')}
                isActive={dpFilter === 'draft'}
                delay={275}
                subtitle="Incomplete requests"
              />
            )}
          </div>
        </div>}

        {/* Allocation Panel */}
        {viewMode === 'allocation' && (
          <div className="mb-5 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-slate-600" />
                  <span className="text-sm font-semibold text-gray-900">Allocation Overview</span>
                  {selectedCycle && (
                    <span className="text-xs text-gray-500">— {selectedCycle.cycle_name}</span>
                  )}
                </div>
                {cycleAllotments.length > 0 && (
                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.length} Total
                    </span>
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.filter(a => a.approval_status === 'PENDING').length} Pending
                    </span>
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.filter(a => a.approval_status === 'ACKNOWLEDGED').length} Acknowledged
                    </span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.filter(a => a.approval_status === 'APPROVED').length} Approved
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewMode('dp')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={15} />
              </button>
            </div>
            {loadingCycleData ? (
              <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
            ) : cycleAllotments.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No allotments for the selected cycle.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Sl. No.', 'Quarter', 'Request No.', 'Type / Rent', 'Pref Used', 'Allotted On', 'Overridden', 'Status', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cycleAllotments.map((allot, i) => {
                      const q = allot.quarter as Quarter | undefined;
                      const req = allot.request as QuarterRequest | undefined;
                      const prefUsed = req?.preferences?.find(p => p.quarter_id === q?.id)?.preference_rank;
                      return (
                        <tr key={allot.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">{i + 1}</td>
                          <td className="px-4 py-3">
                            {q ? (
                              <div className="flex items-center gap-2.5">
                                <img src={getImage(q, i)} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                              </div>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{req?.request_number ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {q ? <>{q.bhk_config} · {fmtINR(q.monthly_rent)}</> : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {prefUsed !== undefined ? (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">P-{prefUsed}</span>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {fmtDate(allot.allotment_date)}
                          </td>
                          <td className="px-4 py-3">
                            {allot.is_overridden ? (
                              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Yes</span>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              allot.approval_status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : allot.approval_status === 'ACKNOWLEDGED'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {allot.approval_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setOverrideTarget(allot)}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                            >
                              <Settings size={12} /> Override
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DP filtered list */}
        {viewMode === 'dp' && dpFilter !== 'all' && (
          <div className="mb-5 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{{ all: 'All', accepted: 'Accepted', occupied: 'Occupied', allotted: 'Allotted', allotted_pending: 'Allotted', submitted: 'Submitted', draft: 'Draft' }[dpFilter]} Requests</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{dpFilteredRequests.length}</span>
              </div>
              <button onClick={() => setDpFilter('all')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={14} />
              </button>
            </div>
            {dpFilteredRequests.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No records in this category</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Request No.', 'Quarter', 'Type / Location', 'Move-in', 'Family', 'Status',
                        dpFilter === 'allotted_pending' ? 'Override' : dpFilter === 'accepted' ? 'Actions' : 'Updated'
                      ].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dpFilteredRequests.map((req, i) => {
                      const sc = reqStatusConfig(req.request_status);
                      const q = req.allotment?.quarter;
                      const isAllocated = dpFilter === 'allotted_pending';
                      const isAccepted = dpFilter === 'accepted';
                      const allotmentId = req.allotment?.id;
                      const rowInspections = allotmentId ? (dpInspections[allotmentId] ?? []) : [];
                      const isExpanded = dpExpandedInspRowId === req.id;

                      return (
                        <React.Fragment key={req.id}>
                          <tr className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${isExpanded ? 'bg-sky-50/40' : ''}`}>
                            <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                              <div>{req.request_number}</div>
                              {isAccepted && rowInspections.length > 0 && (
                                <button
                                  onClick={() => setDpExpandedInspRowId(isExpanded ? null : req.id)}
                                  className={`mt-1 flex items-center gap-1 text-[10px] font-semibold transition-colors ${isExpanded ? 'text-sky-700' : 'text-sky-500 hover:text-sky-700'}`}
                                >
                                  <HardHat size={9} />
                                  {rowInspections.length} inspection{rowInspections.length > 1 ? 's' : ''}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {q ? (
                                <div className="flex items-center gap-2">
                                  <img src={getImage(q, i)} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                  <div>
                                    <div className="text-xs font-medium text-gray-800">{q.quarter_number}</div>
                                    <div className="text-[10px] text-gray-400">{q.bhk_config}</div>
                                  </div>
                                </div>
                              ) : <span className="text-xs text-gray-400">Not allotted</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              <div>{req.required_bhk_config || '—'}</div>
                              <div className="text-gray-400">{req.preferred_location || '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                              {req.move_in_date ? fmtDate(req.move_in_date) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">{req.family_member_count ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${sc.cls}`}>
                                {sc.icon}{sc.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap relative">
                              {isAllocated && req.allotment ? (
                                <div className="relative inline-block">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setMiniMenuTarget(
                                        miniMenuTarget?.req.id === req.id ? null : { req, allotment: req.allotment! }
                                      );
                                    }}
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                                  >
                                    <Settings size={12} /> Override
                                  </button>
                                </div>
                              ) : isAccepted ? (
                                <div className="relative inline-block" ref={dpActionMenuReqId === req.id ? dpActionMenuRef : undefined}>
                                  <button
                                    onClick={e => { e.stopPropagation(); setDpActionMenuReqId(dpActionMenuReqId === req.id ? null : req.id); }}
                                    className={`p-1.5 rounded-lg border transition-colors ${dpActionMenuReqId === req.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                                    title="Actions"
                                  >
                                    <MoreVertical size={13} />
                                  </button>
                                  {dpActionMenuReqId === req.id && (
                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                                      <button
                                        onClick={() => setDpActionMenuReqId(null)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors group"
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Eye size={11} className="text-gray-600" /></div>
                                        <span className="text-xs font-semibold text-gray-800">Detail</span>
                                      </button>
                                      <div className="mx-2 border-t border-gray-100" />
                                      <button
                                        onClick={() => { setDpActionMenuReqId(null); setInspectTarget(req); setInspectRemarks(''); setInspectCondition('GOOD'); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-sky-50 transition-colors group"
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 group-hover:bg-sky-100"><HardHat size={11} className="text-sky-600" /></div>
                                        <span className="text-xs font-semibold text-gray-800">New Inspection</span>
                                      </button>
                                      <div className="mx-2 border-t border-gray-100" />
                                      <button
                                        onClick={() => { setDpActionMenuReqId(null); openQuarterLog(req); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors group"
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200"><ClipboardList size={11} className="text-slate-600" /></div>
                                        <span className="text-xs font-semibold text-gray-800">Log Details</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : fmtDate(req.updated_at)}
                            </td>
                          </tr>

                          {/* Inspection sub-rows — indented tree style */}
                          {isAccepted && isExpanded && rowInspections.length > 0 && (
                            <tr>
                              <td colSpan={7} className="px-0 py-0 bg-sky-50/30">
                                <div className="relative ml-8 my-2 mr-4">
                                  {/* Vertical connector */}
                                  <div className="absolute left-0 top-0 bottom-4 w-0.5 bg-sky-200 rounded-full" />
                                  <div className="space-y-1.5 pl-5">
                                    {rowInspections.map((insp, inspIdx) => {
                                      const isLast = inspIdx === rowInspections.length - 1;
                                      const isInspSelected = dpSelectedInspectionId === insp.id;
                                      return (
                                        <div key={insp.id} className="relative">
                                          {/* Horizontal nub */}
                                          <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-sky-200 rounded-full" />
                                          {/* Junction dot */}
                                          <div className={`absolute -left-[22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors ${isInspSelected ? 'bg-sky-600 border-sky-600' : 'bg-white border-sky-300'}`} />
                                          {isLast && (
                                            <div className="absolute -left-[1px] top-1/2 bottom-0 w-0.5 bg-sky-50/30" />
                                          )}
                                          {/* Inspection card */}
                                          <div
                                            onClick={() => {
                                              handleSelectDpInspection(insp.id);
                                              setDpExpandedInspRowId(req.id);
                                            }}
                                            className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${isInspSelected ? 'border-sky-400 ring-2 ring-sky-100' : 'border-gray-200 hover:border-sky-200'}`}
                                          >
                                            <div className="flex min-h-[72px]">
                                              {/* Left accent */}
                                              <div className={`w-1 shrink-0 rounded-l-xl ${insp.status === 'CLOSED' ? 'bg-gray-300' : 'bg-sky-500'}`} />
                                              {/* Icon zone */}
                                              <div className={`w-12 shrink-0 flex items-center justify-center ${insp.status === 'CLOSED' ? 'bg-gray-50' : 'bg-sky-50'}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${insp.status === 'CLOSED' ? 'bg-gray-100 text-gray-400' : 'bg-sky-100 text-sky-600'}`}>
                                                  <HardHat size={14} />
                                                </div>
                                              </div>
                                              {/* Body */}
                                              <div className="flex-1 px-3 py-2.5 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${insp.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-sky-100 text-sky-700'}`}>{insp.status}</span>
                                                  <span className="text-[10px] text-gray-400">{fmtDate(insp.created_at)}</span>
                                                </div>
                                                {insp.opening_remarks && (
                                                  <p className="text-xs text-gray-700 font-medium truncate">{insp.opening_remarks}</p>
                                                )}
                                                {insp.property_condition && (
                                                  <p className="text-[10px] text-gray-400 mt-0.5">Condition: {insp.property_condition}</p>
                                                )}
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                  <span className="text-[10px] bg-sky-50 text-sky-600 border border-sky-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                                    <MessageSquare size={9} />Chat
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Inspection chat panel — shown when an inspection is selected under this row */}
                                {dpSelectedInspectionId && rowInspections.some(i => i.id === dpSelectedInspectionId) && (
                                  <div className="mx-4 mb-3 bg-white rounded-xl border border-sky-200 overflow-hidden shadow-sm">
                                    <div className="px-4 py-2.5 border-b border-sky-100 bg-sky-50 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <MessageSquare size={13} className="text-sky-600" />
                                        <span className="text-xs font-semibold text-sky-800">Inspection Chat</span>
                                      </div>
                                      <button onClick={() => setDpSelectedInspectionId(null)} className="p-1 rounded text-sky-400 hover:text-sky-700 transition-colors">
                                        <X size={12} />
                                      </button>
                                    </div>
                                    <div className="p-3 space-y-2 max-h-48 overflow-y-auto bg-gray-50">
                                      {dpInspectionChats.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center italic py-4">No messages yet. Start the conversation.</p>
                                      )}
                                      {dpInspectionChats.map(chat => (
                                        <div key={chat.id} className={`flex ${chat.author_role === 'eo' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${chat.author_role === 'eo' ? 'bg-sky-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                                            <div className={`text-[9px] font-bold mb-0.5 capitalize ${chat.author_role === 'eo' ? 'text-sky-200' : 'text-sky-600'}`}>{chat.author_role}</div>
                                            <p>{chat.message}</p>
                                            <div className={`text-[9px] mt-0.5 ${chat.author_role === 'eo' ? 'text-sky-200' : 'text-gray-400'}`}>{fmtDate(chat.created_at)}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="p-3 border-t border-sky-100 flex gap-2">
                                      <input
                                        value={dpInspChatMsg}
                                        onChange={e => setDpInspChatMsg(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && dpInspChatMsg.trim()) handleSendDpInspChat(); }}
                                        placeholder="Add observation…"
                                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300/40 focus:border-sky-400"
                                      />
                                      <button
                                        onClick={handleSendDpInspChat}
                                        disabled={!dpInspChatMsg.trim()}
                                        className="px-3 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 transition-colors"
                                      >
                                        <Send size={13} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Override Mini-menu */}
        {miniMenuTarget && (() => {
          const { req } = miniMenuTarget;
          return (
            <div
              ref={miniMenuRef}
              className="fixed z-50 right-8 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 overflow-hidden"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Override — {req.request_number}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{req.allotment?.quarter?.quarter_number ?? '—'} · {req.allotment?.quarter?.bhk_config}</div>
                </div>
                <button onClick={() => setMiniMenuTarget(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  <XCircle size={16} />
                </button>
              </div>
              <div className="py-1">
                <div className="px-3 pt-2 pb-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Destructive</div>
                  <button onClick={() => handleDeallocate(req)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100"><Trash2 size={13} className="text-red-600" /></div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Deallocate Request</div>
                      <div className="text-[10px] text-gray-400">Return to Submitted — quarter back to pool</div>
                    </div>
                  </button>
                  <button onClick={() => handleCancelAllocated(req)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100"><Ban size={13} className="text-red-600" /></div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Cancel Request</div>
                      <div className="text-[10px] text-gray-400">Permanently cancel — mark as Withdrawn</div>
                    </div>
                  </button>
                </div>
                <div className="border-t border-gray-100 mx-3 my-1" />
                <div className="px-3 py-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Reassign</div>
                  {[
                    { icon: <Star size={13} className="text-amber-600" />, bg: 'bg-amber-50', label: 'Assign Another Preference', desc: "Pick from Request A's preference list", action: 'pref' },
                    { icon: <Plus size={13} className="text-blue-600" />, bg: 'bg-blue-50', label: 'Assign Available Property', desc: 'Search and assign any available quarter', action: 'new' },
                  ].map(item => (
                    <button key={item.action} onClick={() => { setOverrideInitialAction(item.action); setOverrideTarget(req.allotment!); setMiniMenuTarget(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group">
                      <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>{item.icon}</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{item.label}</div>
                        <div className="text-[10px] text-gray-400">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 mx-3 my-1" />
                <div className="px-3 py-1 pb-2">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Swap with Request B</div>
                  {[
                    { icon: <ArrowLeftRight size={13} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Swap A↔B', desc: 'Assign B to A · Cancel Request B', action: 'swap' },
                    { icon: <Shuffle size={13} className="text-sky-600" />, bg: 'bg-sky-50', label: "Swap + B's Preference", desc: "Assign B to A · Assign B a new preference", action: 'swapPref' },
                    { icon: <Layers size={13} className="text-slate-600" />, bg: 'bg-slate-50', label: 'Swap + B Available', desc: 'Assign B to A · Assign B an available property', action: 'swapNew' },
                  ].map(item => (
                    <button key={item.action} onClick={() => { setOverrideInitialAction(item.action); setOverrideTarget(req.allotment!); setMiniMenuTarget(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group">
                      <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>{item.icon}</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{item.label}</div>
                        <div className="text-[10px] text-gray-400">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Compact Cycle Selector */}
        {viewMode !== 'dp' && selectedCycle && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-2.5 mb-4 flex flex-wrap items-center gap-3">
            <Calendar size={13} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Cycle:</span>
            <select
              value={selectedCycle.id}
              onChange={e => setSelectedCycle(cycles.find(c => c.id === e.target.value) ?? null)}
              className="text-sm font-semibold text-gray-900 border-0 bg-transparent focus:outline-none cursor-pointer"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.cycle_name}</option>
              ))}
            </select>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cycleStatusBadge(selectedCycle.status)}`}>
              {selectedCycle.status}
            </span>
            {selectedCycle.end_date && (
              <span className="text-xs text-gray-400">· closes {new Date(selectedCycle.end_date).toLocaleDateString('en-IN')}</span>
            )}
            {selectedCycle.status === 'OPEN' && (
              <>
                <div className="flex-1" />
                <button
                  onClick={handleFinaliseCycle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  <CheckCircle size={13} /> Finalise Cycle
                </button>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        {viewMode !== 'dp' && <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-200 p-1 w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>}

        {viewMode !== 'dp' && (loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'cycles' && (
              <CyclesTabContent
                cycles={cycles}
                cycleStatusBadge={cycleStatusBadge}
                onViewCycle={cycle => { setSelectedCycle(cycle); setActiveTab('requests'); }}
              />
            )}

            {activeTab === 'requests' && (
              <CycleRequestsTabContent
                cycleRequests={cycleRequests}
                cycleReqSearch={cycleReqSearch}
                setCycleReqSearch={setCycleReqSearch}
                loadingCycleData={loadingCycleData}
                onGoToAllotments={() => setActiveTab('allotments')}
                fmtDate={fmtDate}
              />
            )}

            {activeTab === 'allotments' && (
              <AllotmentsTabContent
                cycleAllotments={cycleAllotments}
                cycleRequests={cycleRequests}
                allotSearch={allotSearch}
                setAllotSearch={setAllotSearch}
                loadingCycleData={loadingCycleData}
                onFinaliseCycle={handleFinaliseCycle}
                onOverride={allot => setOverrideTarget(allot)}
                getImage={getImage}
                fmtINR={fmtINR}
              />
            )}

            {activeTab === 'all_requests' && (
              <AllRequestsTabContent
                filteredAllRequests={filteredAllRequests}
                allReqCounts={allReqCounts}
                allReqSearch={allReqSearch}
                setAllReqSearch={setAllReqSearch}
                allReqStatus={allReqStatus}
                setAllReqStatus={setAllReqStatus}
                loadingAll={loadingAll}
                statusOptions={ALL_STATUS_OPTIONS}
                reqStatusConfig={reqStatusConfig}
                getImage={getImage}
                fmtDate={fmtDate}
              />
            )}

            {activeTab === 'tenant_requests' && (
              <TenantServicesTabContent
                filteredTenantRequests={filteredTenantRequests}
                allTenantRequests={allTenantRequests}
                tenantSearch={tenantSearch}
                setTenantSearch={setTenantSearch}
                tenantStatusFilter={tenantStatusFilter}
                setTenantStatusFilter={setTenantStatusFilter}
                tenantTypeFilter={tenantTypeFilter}
                setTenantTypeFilter={setTenantTypeFilter}
                loadingTenant={loadingTenant}
                eoNotesMap={eoNotesMap}
                setEoNotesMap={setEoNotesMap}
                processingTenant={processingTenant}
                onApprove={handleApproveTenant}
                onReject={handleRejectTenant}
                tenantServiceConfig={tenantServiceConfig}
                tenantStatusBadge={tenantStatusBadge}
                getImage={getImage}
                fmtDate={fmtDate}
              />
            )}
          </>
        ))}
      </main>

      <QuarterOverrideModal
        isOpen={!!overrideTarget}
        onClose={() => { setOverrideTarget(null); setOverrideInitialAction(undefined); }}
        allotment={overrideTarget}
        allCycleAllotments={overrideInitialAction
          ? allRequests.filter(r => r.allotment).map(r => r.allotment!) as QuarterAllotment[]
          : cycleAllotments}
        eoAuthId={user?.id ?? ''}
        initialAction={overrideInitialAction}
        onOverrideSaved={() => {
          if (selectedCycle) loadCycleData(selectedCycle);
          loadAllRequests();
        }}
      />

      {/* New Inspection Popup */}
      {inspectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 bg-sky-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <HardHat size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">New Inspection</div>
                  <div className="text-[11px] text-sky-200">{inspectTarget.request_number} · {inspectTarget.allotment?.quarter?.quarter_number ?? '—'}</div>
                </div>
              </div>
              <button onClick={() => setInspectTarget(null)} className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Opening Remarks</label>
                <textarea
                  value={inspectRemarks}
                  onChange={e => setInspectRemarks(e.target.value)}
                  rows={3}
                  placeholder="Describe the purpose of this inspection…"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300/40 focus:border-sky-400 resize-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Initial Condition</label>
                <div className="flex gap-2 flex-wrap">
                  {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR'].map(c => (
                    <button
                      key={c}
                      onClick={() => setInspectCondition(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${inspectCondition === c ? 'bg-sky-600 text-white border-sky-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {c.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setInspectTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDpInspection}
                disabled={inspectSubmitting || !inspectRemarks.trim()}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <PlayCircle size={14} />
                {inspectSubmitting ? 'Starting…' : 'Start Inspection'}
              </button>
            </div>
          </div>
        </div>
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
