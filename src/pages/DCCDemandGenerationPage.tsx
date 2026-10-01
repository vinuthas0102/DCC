import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Zap, Loader2,
  CheckCircle2, AlertCircle, Play, History,
  RefreshCw, ChevronDown,
  Filter, X, Clock, FileText, TrendingUp, Users,
  Calendar, Sparkles, Receipt, Wallet, AlertTriangle,
  Eye, Plus, Check, LayoutGrid, List, Table2,
  RotateCcw, Search, Home, LogOut,
  Pencil, Lock, ShieldCheck, Unlock, Save,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { payableCriteriaService } from '../services/payableCriteriaService';
import { ROUTES } from '../constants/routes';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROLE_LABELS } from '../constants/roles';
import { frequencyCodeLabel } from '../types/payableCriteria';
import type { DccDemandRunLog, DccDemandType, DccObject, DccDemand, DccDemandStatus, DccRunApprovalStatus } from '../types/dcc';
import type { PayableCriteria } from '../types/payableCriteria';
import { DCC_STATUS, fmtINR, fmtDateDDMMYYYY, fmtDateTimeDDMMYYYY, getDemandTypeBadgeStyle } from '../constants/dccTheme';
import { getDemandComponentConfig, computeBill } from '../constants/demandComponents';
import { DemandListRecord } from '../components/dcc/DemandListRecord';
import { DCCDemandDetailModal } from './DCCDemandDetailPage';
import { RunHistoryFilterModal, emptyRunHistoryFilter, countActiveRunHistoryFilters } from '../components/dcc/RunHistoryFilterModal';
import type { RunHistoryFilterState } from '../components/dcc/RunHistoryFilterModal';
import { useViewPreference } from '../hooks/useViewPreference';

const fmtDuration = (ms: number | null) => {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
};

const SOURCE_BADGE: Record<string, string> = {
  TPA: 'bg-blue-100 text-blue-700 border border-blue-200',
  EXCEL: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  AUTO: 'bg-amber-100 text-amber-700 border border-amber-200',
  MANUAL: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const APPROVAL_BADGE: Record<DccRunApprovalStatus, { cls: string; label: string }> = {
  PENDING: { cls: 'bg-amber-100 text-amber-700 border border-amber-300', label: 'Pending' },
  APPROVED: { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300', label: 'Approved' },
  AMENDED: { cls: 'bg-blue-100 text-blue-700 border border-blue-300', label: 'Amended' },
};

type ViewMode = 'card' | 'list' | 'table';
type RunHistoryViewMode = 'card' | 'list' | 'table';
type KpiKey = 'ALL' | 'PAID' | 'OUTSTANDING' | 'OVERDUE';

interface RunDetailFilterState {
  statuses: DccDemandStatus[];
  searchText: string;
}

const emptyRunFilter: RunDetailFilterState = { statuses: [], searchText: '' };

const STATUS_OPTIONS: { value: DccDemandStatus; label: string }[] = [
  { value: 'DUE', label: 'Due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
  { value: 'EXEMPTED', label: 'Exempted' },
];

const toggleArray = <T,>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

// Convert DccDemand[] to DccTile-like objects for DemandListRecord
interface RunDemandTile {
  id: string;
  demand_type_code: string;
  demand_type_label: string;
  object_id: string;
  object_ref: string;
  object_description: string;
  object_type: string;
  owner_id: string;
  owner_name: string;
  owner_contact: string;
  owner_address: string;
  demand_run_date: string;
  total_amount: number;
  due_date: string;
  amount_paid: number;
  amount_due: number;
  overdue_amount: number;
  last_paid_date: string | null;
  last_paid_amount: number | null;
  avg_overdue_days: number;
  status: DccDemandStatus;
  include_gst: boolean;
  gst_pct: number;
  gst_type: 'inclusive' | 'exclusive';
  gst_amount: number;
  interest_pct: number;
  defaulted_interest_pct: number;
  region: string | null;
  group_name: string | null;
  subgroup: string | null;
  run_number: number;
  is_amended: boolean;
}

function demandsToTiles(demands: DccDemand[], runNumber: number): RunDemandTile[] {
  const today = new Date();
  return demands.map((d) => {
    const due = Math.max(0, d.amount - d.amount_paid);
    const overdue = d.status === 'OVERDUE' ? due : 0;
    const dueDate = new Date(d.due_date);
    const avgOverdueDays =
      d.status === 'OVERDUE'
        ? Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000))
        : 0;
    const owner = d.owner;
    const obj = d.object;
    const ownerAddress = [owner?.address, owner?.city, owner?.state, owner?.pincode]
      .filter(Boolean)
      .join(', ');
    return {
      id: d.id,
      demand_type_code: d.demand_type?.code ?? '',
      demand_type_label: d.demand_type?.label ?? '',
      object_id: d.object_id,
      object_ref: obj?.object_ref ?? '',
      object_description: obj?.description ?? '',
      object_type: obj?.object_type ?? '',
      owner_id: d.owner_id,
      owner_name: owner?.name ?? '',
      owner_contact: owner?.contact_number ?? '',
      owner_address: ownerAddress,
      demand_run_date: d.demand_run_date,
      total_amount: d.amount,
      due_date: d.due_date,
      amount_paid: d.amount_paid,
      amount_due: due,
      overdue_amount: overdue,
      last_paid_date: null,
      last_paid_amount: null,
      avg_overdue_days: avgOverdueDays,
      status: d.status,
      include_gst: d.include_gst ?? false,
      gst_pct: d.gst_pct ?? 0,
      gst_type: d.gst_type ?? 'exclusive',
      gst_amount: d.gst_amount ?? 0,
      interest_pct: d.interest_pct ?? 0,
      defaulted_interest_pct: d.defaulted_interest_pct ?? 0,
      region: obj?.region ?? null,
      group_name: obj?.group_name ?? null,
      subgroup: obj?.subgroup ?? null,
      run_number: runNumber,
      is_amended: d.is_amended ?? false,
    };
  });
}

const DemandTypeBadge: React.FC<{ code: string; label: string }> = ({ code, label }) => {
  const style = getDemandTypeBadgeStyle(code);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
};


const RunRuleNumberBadge: React.FC<{ ruleIds: string[]; rules: PayableCriteria[] }> = ({ ruleIds, rules }) => {
  if (!ruleIds || ruleIds.length === 0) return null;
  const numbers = ruleIds
    .map(cid => rules.find(r => r.id === cid)?.rule_number)
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full shrink-0">
      {numbers.map(n => `R${String(n).padStart(3, '0')}`).join(', ')}
    </span>
  );
};

const RunDemandTypeBadge: React.FC<{ types: DccDemandType[] }> = ({ types }) => {
  const [showHover, setShowHover] = useState(false);
  if (types.length === 0) return null;
  const primary = types[0];
  const extraCount = types.length - 1;
  const style = getDemandTypeBadgeStyle(primary.code);
  return (
    <div
      className="relative inline-block shrink-0"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {primary.label}
        {extraCount > 0 && <span className="ml-0.5 px-1 py-px rounded-full bg-slate-200/80 text-slate-600 text-[9px] font-bold leading-none">+{extraCount}</span>}
      </span>
      {showHover && extraCount > 0 && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 space-y-1">
          {types.slice(1).map(dt => {
            const s = getDemandTypeBadgeStyle(dt.code);
            return (
              <div key={dt.id} className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded ${s.bg} ${s.text} text-[10px] font-bold`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {dt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const DCCDemandGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { openProfileDrawer } = useUIStore();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ created: number; totalAmount: number } | null>(null);

  // Auto-generate state
  const [rules, setRules] = useState<PayableCriteria[]>([]);
  const [demandTypes, setDemandTypes] = useState<DccDemandType[]>([]);
  const [objects, setObjects] = useState<DccObject[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [autoAmount, setAutoAmount] = useState<Record<string, number>>({});
  const [autoRunDate, setAutoRunDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadingRules, setLoadingRules] = useState(true);

  // Run history
  const [runLog, setRunLog] = useState<DccDemandRunLog[]>([]);
  const [runDetails, setRunDetails] = useState<Record<string, DccDemand[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [detailModalLog, setDetailModalLog] = useState<DccDemandRunLog | null>(null);
  const [detailDemandId, setDetailDemandId] = useState<string | null>(null);
  const [runDemandTypesMap, setRunDemandTypesMap] = useState<Record<string, DccDemandType[]>>({});
  const [runRuleIdsMap, setRunRuleIdsMap] = useState<Record<string, string[]>>({});

  // Filters
  const [filterState, setFilterState] = useState<RunHistoryFilterState>(emptyRunHistoryFilter);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Run history display preference
  const [historyViewMode, setHistoryViewMode] = useViewPreference('dcc-run-history-view', 'list') as [
    RunHistoryViewMode, React.Dispatch<React.SetStateAction<RunHistoryViewMode>>
  ];

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const log = await dccService.listRunLog();
      setRunLog(log);
      const typesMap: Record<string, DccDemandType[]> = {};
      await Promise.all(log.map(async (l) => {
        try {
          typesMap[l.id] = await dccService.getRunDemandTypes(l);
        } catch {
          typesMap[l.id] = [];
        }
      }));
      setRunDemandTypesMap(typesMap);
      const ruleIdsMap: Record<string, string[]> = {};
      await Promise.all(log.map(async (l) => {
        try {
          ruleIdsMap[l.id] = await dccService.getRunRuleNumbers(l);
        } catch {
          ruleIdsMap[l.id] = [];
        }
      }));
      setRunRuleIdsMap(ruleIdsMap);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const [allRules, dt, obj] = await Promise.all([
        payableCriteriaService.listWithSpecs(),
        dccService.listDemandTypes(),
        dccService.listObjects(),
      ]);
      const dccRules = allRules.filter(r => r.demand_type_id !== null && r.is_active);
      setRules(dccRules);
      setDemandTypes(dt);
      setObjects(obj);
      const amounts: Record<string, number> = {};
      for (const r of dccRules) amounts[r.id] = r.default_demand_amount ?? 1000;
      setAutoAmount(amounts);
    } catch {
      // ignore
    } finally {
      setLoadingRules(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadRules();
  }, [loadHistory, loadRules]);

  const handleAutoGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const selectedRules = rules.filter(r => selectedRuleIds.has(r.id));
      const autoRows: { criteria_id: string; object_id: string; owner_id: string; demand_type_id: string; amount: number; due_date: string; run_date: string }[] = [];

      for (const rule of selectedRules) {
        const matchingObjects = objects.filter(o => o.object_type === rule.object_type);
        const dtId = rule.demand_type_id!;
        const amt = autoAmount[rule.id] ?? 1000;
        const instalmentLines = rule.installment_spec?.instalment_lines ?? [];

        if (instalmentLines.length > 0) {
          // Multi-instalment expansion: create one demand row per instalment line per object
          for (const obj of matchingObjects) {
            for (const line of instalmentLines) {
              const dueDate = new Date(autoRunDate);
              dueDate.setDate(dueDate.getDate() + line.days_offset);
              autoRows.push({
                criteria_id: rule.id,
                object_id: obj.id,
                owner_id: obj.owner_id,
                demand_type_id: dtId,
                amount: line.amount,
                due_date: dueDate.toISOString().slice(0, 10),
                run_date: autoRunDate,
              });
            }
          }
        } else {
          // Single demand per object (original behaviour)
          const dueDate = new Date(autoRunDate);
          dueDate.setDate(dueDate.getDate() + (rule.full_payment_spec?.days_offset ?? 30));
          for (const obj of matchingObjects) {
            autoRows.push({
              criteria_id: rule.id,
              object_id: obj.id,
              owner_id: obj.owner_id,
              demand_type_id: dtId,
              amount: amt,
              due_date: dueDate.toISOString().slice(0, 10),
              run_date: autoRunDate,
            });
          }
        }
      }

      if (autoRows.length === 0) {
        setError('No matching objects found for the selected rules');
        setGenerating(false);
        return;
      }

      const res = await dccService.generateAuto(autoRows);
      setSuccess({ created: res.created, totalAmount: res.totalAmount });
      await loadHistory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Auto-generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const toggleRule = (id: string) => {
    setSelectedRuleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenRunDetails = async (log: DccDemandRunLog) => {
    setDetailModalLog(log);
    if (!runDetails[log.id]) {
      setLoadingDetails(log.id);
      try {
        const details = await dccService.getRunLogDetails(log);
        setRunDetails(prev => ({ ...prev, [log.id]: details }));
      } catch {
        setRunDetails(prev => ({ ...prev, [log.id]: [] }));
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  const closeRunDetails = () => setDetailModalLog(null);



  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const initials = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  const activeFilterCount = countActiveRunHistoryFilters(filterState);
  const hasActiveFilters = activeFilterCount > 0;

  const historyViewModes: { mode: RunHistoryViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'card', icon: <LayoutGrid size={14} />, label: 'Card View' },
    { mode: 'list', icon: <List size={14} />, label: 'List View' },
    { mode: 'table', icon: <Table2 size={14} />, label: 'Table View' },
  ];

  const filteredRunLog = useMemo(() => {
    let r = runLog;
    if (filterState.source) r = r.filter(l => l.source === filterState.source);
    if (filterState.demandTypeId) r = r.filter(l => l.demand_type_id === filterState.demandTypeId);
    if (filterState.dateFrom) r = r.filter(l => l.run_date >= filterState.dateFrom);
    if (filterState.dateTo) r = r.filter(l => l.run_date <= filterState.dateTo);
    if (filterState.objectRef) {
      const ref = filterState.objectRef.toLowerCase();
      r = r.filter(l => {
        const details = runDetails[l.id] ?? [];
        return details.some(d => (d.object?.object_ref ?? '').toLowerCase().includes(ref));
      });
    }
    return r;
  }, [runLog, filterState, runDetails]);

  const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white text-slate-700 transition-colors';

  return (
    <div className="min-h-full bg-slate-100 flex flex-col">
      {/* Page header — Deep Slate Navy */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
        <button
          onClick={() => navigate(ROUTES.DCC)}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white">Demand Generation</h1>
          <p className="text-[10px] text-slate-400">Generate demands from active rules and review run history</p>
        </div>

        {/* Refresh action */}
        <button
          onClick={loadHistory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw size={13} /> Refresh
        </button>

        {/* User context — click to open profile */}
        {user && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={openProfileDrawer}
              title="View Profile"
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-700/40 hover:bg-blue-900/60 hover:border-emerald-500/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-[11px] font-semibold text-white whitespace-nowrap">{user.fullName || user.email}</div>
                <div className="text-[9px] text-emerald-300 font-medium whitespace-nowrap">{ROLE_LABELS[user.role]}</div>
              </div>
            </button>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700"><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
          <CheckCircle2 size={14} className="shrink-0" /> Created {success.created} demands totaling {fmtINR(success.totalAmount)}
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-500 hover:text-emerald-700"><X size={14} /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* ── Auto-Generate Panel ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible relative z-30">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-transparent">
            <Sparkles size={14} className="text-amber-600" />
            <h2 className="text-xs font-bold text-slate-900">Auto-Generate from Rules</h2>
            <span className="ml-auto text-[10px] text-slate-400">{rules.length} active rule{rules.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-1 lg:grid-cols-[11rem_minmax(0,1fr)_auto] gap-2.5 items-start">
              {/* Run date */}
              <div className="flex flex-col">
                <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  <Calendar size={11} /> Run Date
                </label>
                <input
                  type="date"
                  value={autoRunDate}
                  onChange={e => setAutoRunDate(e.target.value)}
                  className={`${inputCls} h-8`}
                />
              </div>

              {/* Rule dropdown */}
              <div className="min-w-0 flex flex-col">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Demand Rules</label>
                {loadingRules ? (
                  <div className="flex items-center h-8 px-3 border border-slate-200 rounded-lg bg-slate-50">
                    <Loader2 size={14} className="animate-spin text-emerald-500" />
                  </div>
                ) : rules.length === 0 ? (
                  <div className="flex items-center h-8 px-3 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400">
                    No active DCC rules found
                  </div>
                ) : (
                  <RuleDropdownSection
                    rules={rules}
                    demandTypes={demandTypes}
                    objects={objects}
                    selectedRuleIds={selectedRuleIds}
                    autoAmount={autoAmount}
                    onToggleRule={toggleRule}
                    onAmountChange={(id, val) => setAutoAmount(prev => ({ ...prev, [id]: val }))}
                    onAddRule={(id) => toggleRule(id)}
                    onRemoveRule={(id) => toggleRule(id)}
                  />
                )}
              </div>

              {/* Generate action */}
              <div className="flex flex-col justify-end lg:pt-[20px]">
                <button
                  onClick={handleAutoGenerate}
                  disabled={selectedRuleIds.size === 0 || generating}
                  className="flex h-8 items-center justify-center gap-1.5 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
                >
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                  {generating ? 'Generating…' : `Generate (${selectedRuleIds.size})`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Run History ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
            <History size={16} className="text-slate-500" />
            {hasActiveFilters ? (
              <button
                onClick={() => setShowFilterDrawer(true)}
                className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
                title="Click to view and edit active filters"
              >
                Generation Run History
                <Filter size={12} className="text-blue-500 group-hover:text-blue-700 transition-colors" />
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">{activeFilterCount} active</span>
              </button>
            ) : (
              <h2 className="text-sm font-bold text-slate-900">Generation Run History</h2>
            )}
            <span className="ml-auto text-[11px] text-slate-400">{filteredRunLog.length} run{filteredRunLog.length !== 1 ? 's' : ''}</span>
            {/* Display type toggle */}
            <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
              {historyViewModes.map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setHistoryViewMode(mode)}
                  className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
                    historyViewMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                  title={label}
                >
                  {icon}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilterDrawer(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${hasActiveFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter size={12} /> Filter
              {hasActiveFilters && <span className="ml-0.5 text-[10px] font-bold text-emerald-600">{activeFilterCount}</span>}
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-emerald-500" />
            </div>
          ) : filteredRunLog.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <History size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">{hasActiveFilters ? 'No runs match your filters' : 'No generation runs yet'}</p>
            </div>
          ) : historyViewMode === 'card' ? (
            /* ── Card View ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
              {filteredRunLog.map((log, logIdx) => {
                const processedCount = log.records_created + log.records_failed;
                const objCount = log.run_summary?.object_count as number ?? null;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(logIdx * 0.04, 0.2) }}
                    className="flex flex-col justify-between h-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-blue-600 tabular-nums shrink-0" title={`RUN-${String(log.run_number).padStart(3, '0')}`}>
                          RUN-{String(log.run_number).padStart(3, '0')}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 shrink-0 tabular-nums" title={fmtDateDDMMYYYY(log.run_date)}>
                        {fmtDateDDMMYYYY(log.run_date)}
                      </span>
                    </div>

                    {/* ── 2-Column Metrics Grid ── */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3 flex-1">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Demands Processed</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{processedCount}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Objects Processed</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{objCount ?? '—'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Created</span>
                        <span className="text-xs font-bold text-emerald-600 tabular-nums">{log.records_created}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Failed</span>
                        <span className="text-xs font-bold text-red-600 tabular-nums">{log.records_failed}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Run Start Date &amp; Time</span>
                        <span className="text-[11px] font-medium text-slate-600 tabular-nums truncate" title={fmtDateTimeDDMMYYYY(log.started_at)}>{fmtDateTimeDDMMYYYY(log.started_at)}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Run End Date &amp; Time</span>
                        <span className="text-[11px] font-medium text-slate-600 tabular-nums truncate" title={fmtDateTimeDDMMYYYY(log.ended_at)}>{fmtDateTimeDDMMYYYY(log.ended_at)}</span>
                      </div>
                    </div>

                    {/* ── Footer: Financials & Action ── */}
                    <div className="pt-3 border-t border-slate-100 mt-auto">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-sm font-extrabold text-slate-900 tabular-nums shrink-0">
                          {fmtINR(log.total_amount)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${APPROVAL_BADGE[log.approval_status ?? 'PENDING'].cls}`}>
                            {APPROVAL_BADGE[log.approval_status ?? 'PENDING'].label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${SOURCE_BADGE[log.source] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                            {log.source}
                          </span>
                          <RunDemandTypeBadge types={runDemandTypesMap[log.id] ?? []} />
                          <RunRuleNumberBadge ruleIds={runRuleIdsMap[log.id] ?? []} rules={rules} />
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenRunDetails(log)}
                        className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Eye size={13} /> View Run Details
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : historyViewMode === 'table' ? (
            /* ── Table View ── */
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2 px-3 text-left font-bold text-slate-600">Run #</th>
                    <th className="py-2 px-3 text-left font-bold text-slate-600">Run Date</th>
                    <th className="py-2 px-3 text-left font-bold text-slate-600">Run Start Date &amp; Time</th>
                    <th className="py-2 px-3 text-left font-bold text-slate-600">Run End Date &amp; Time</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-600">Objects</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-600">Created</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-600">Failed</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-600">Duration</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-600">Total Amount</th>
                    <th className="py-2 px-3 text-center font-bold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRunLog.map((log, logIdx) => {
                    const processedCount = log.records_created + log.records_failed;
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-1.5 px-3 text-[10px] font-bold text-slate-500 tabular-nums">RUN-{String(log.run_number).padStart(3, '0')}</td>
                        <td className="py-1.5 px-3 text-slate-500">{fmtDateDDMMYYYY(log.run_date)}</td>
                        <td className="py-1.5 px-3 text-slate-500">{fmtDateTimeDDMMYYYY(log.started_at)}</td>
                        <td className="py-1.5 px-3 text-slate-500">{fmtDateTimeDDMMYYYY(log.ended_at)}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums text-slate-600">{log.run_summary?.object_count as number ?? '—'}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums font-semibold text-emerald-600">{log.records_created}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums">{log.records_failed > 0 ? <span className="text-red-500 font-semibold">{log.records_failed}</span> : <span className="text-slate-400">0</span>}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums text-slate-500">{log.duration_ms != null ? fmtDuration(log.duration_ms) : '—'}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">{fmtINR(log.total_amount)}</td>
                        <td className="py-1.5 px-3 text-center">
                          <div className="flex items-center gap-2 justify-end">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${APPROVAL_BADGE[log.approval_status ?? 'PENDING'].cls}`}>
                              {APPROVAL_BADGE[log.approval_status ?? 'PENDING'].label}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${SOURCE_BADGE[log.source] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                              {log.source}
                            </span>
                            <RunDemandTypeBadge types={runDemandTypesMap[log.id] ?? []} />
                            <RunRuleNumberBadge ruleIds={runRuleIdsMap[log.id] ?? []} rules={rules} />
                            <button
                              onClick={() => handleOpenRunDetails(log)}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                            >
                              <Eye size={11} /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── List View (default, original row layout) ── */
            <div className="space-y-1 px-1 py-1">
              {filteredRunLog.map((log, logIdx) => {
                const accentBorder = log.source === 'AUTO' ? 'border-l-amber-400'
                  : log.source === 'MANUAL' ? 'border-l-slate-400'
                  : log.source === 'TPA' ? 'border-l-blue-400'
                  : log.source === 'EXCEL' ? 'border-l-emerald-400'
                  : 'border-l-slate-300';
                const processedCount = log.records_created + log.records_failed;
                return (
                  <div
                    key={log.id}
                    className={`grid grid-cols-12 items-center gap-2 px-3.5 py-2 min-h-[50px] w-full border border-slate-200 border-l-[3px] ${accentBorder} rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow`}
                  >
                    {/* Cols 1-2: RUN ID & Date */}
                    <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                      <div className="text-xs font-bold text-blue-700 tabular-nums leading-tight">RUN-{String(log.run_number).padStart(3, '0')}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{fmtDateDDMMYYYY(log.run_date)}</div>
                    </div>

                    {/* Cols 3-4: Demands Processed */}
                    <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">Demands Processed</div>
                      <div className="text-xs font-bold text-slate-800 tabular-nums leading-tight mt-0.5">{processedCount}</div>
                    </div>

                    {/* Cols 5-6: Run Timestamps */}
                    <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">Run Start </span>
                          <span className="text-[10px] font-semibold text-slate-700 tabular-nums truncate">{fmtDateTimeDDMMYYYY(log.started_at)}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">Run End </span>
                          <span className="text-[10px] font-semibold text-slate-700 tabular-nums truncate">{fmtDateTimeDDMMYYYY(log.ended_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cols 7-8: Counts & Total Amount */}
                    <div className="col-span-2 border-r border-slate-100 pr-2 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 leading-tight">
                        <span className="flex items-center gap-0.5"><Users size={10} /> {log.run_summary?.object_count as number ?? '—'}</span>
                        <span className="flex items-center gap-0.5"><FileText size={10} /> {log.records_created}</span>
                        {log.records_failed > 0 && (
                          <span className="flex items-center gap-0.5 text-red-500"><AlertCircle size={10} /> {log.records_failed}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 tabular-nums leading-tight mt-0.5">{fmtINR(log.total_amount)}</div>
                    </div>

                    {/* Cols 9-10: Type & Rule Badges */}
                    <div className="col-span-2 min-w-0 flex flex-wrap items-center gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${APPROVAL_BADGE[log.approval_status ?? 'PENDING'].cls}`}>
                        {APPROVAL_BADGE[log.approval_status ?? 'PENDING'].label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${SOURCE_BADGE[log.source] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        {log.source}
                      </span>
                      <RunDemandTypeBadge types={runDemandTypesMap[log.id] ?? []} />
                      <RunRuleNumberBadge ruleIds={runRuleIdsMap[log.id] ?? []} rules={rules} />
                    </div>

                    {/* Cols 11-12: Action Button */}
                    <div className="col-span-2 flex items-center justify-end whitespace-nowrap">
                      <button
                        onClick={() => handleOpenRunDetails(log)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                      >
                        <Eye size={11} /> View Run Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Run Details Full-Screen Overlay */}
      <AnimatePresence>
        {detailModalLog && (
          <RunDetailsOverlay
            log={detailModalLog}
            details={runDetails[detailModalLog.id] ?? []}
            isLoading={loadingDetails === detailModalLog.id}
            onClose={closeRunDetails}
            onViewDemand={(id) => setDetailDemandId(id)}
            onUpdateLog={(updated) => {
              setDetailModalLog(updated);
              setRunLog(prev => prev.map(l => l.id === updated.id ? updated : l));
            }}
            onRefreshDetails={async () => {
              if (detailModalLog) {
                const fresh = await dccService.getRunLogDetails(detailModalLog);
                setRunDetails(prev => ({ ...prev, [detailModalLog.id]: fresh }));
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Demand Detail Modal */}
      {detailDemandId && (
        <DCCDemandDetailModal
          demandId={detailDemandId}
          onClose={() => setDetailDemandId(null)}
        />
      )}

      {/* Run History Filter Drawer */}
      <RunHistoryFilterModal
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        demandTypes={demandTypes}
        state={filterState}
        onApply={setFilterState}
      />
    </div>
  );
};

export default DCCDemandGenerationPage;

// ── Rule Dropdown Section ──────────────────────────────────────────

interface RuleDropdownSectionProps {
  rules: PayableCriteria[];
  demandTypes: DccDemandType[];
  objects: DccObject[];
  selectedRuleIds: Set<string>;
  autoAmount: Record<string, number>;
  onToggleRule: (id: string) => void;
  onAmountChange: (id: string, val: number) => void;
  onAddRule: (id: string) => void;
  onRemoveRule: (id: string) => void;
}

const RuleDropdownSection: React.FC<RuleDropdownSectionProps> = ({
  rules, demandTypes, objects, selectedRuleIds, autoAmount,
  onAmountChange, onAddRule, onRemoveRule,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedRules = rules.filter(r => selectedRuleIds.has(r.id));
  const availableRules = rules.filter(r => !selectedRuleIds.has(r.id));

  return (
    <div className="space-y-3">
      {/* Selected rules list */}
      {selectedRules.length > 0 && (
        <div className="space-y-2">
          {selectedRules.map(rule => {
          const dtLabel = demandTypes.find(d => d.id === rule.demand_type_id)?.label ?? '—';
          const matchingCount = objects.filter(o => o.object_type === rule.object_type).length;
          return (
            <div key={rule.id} className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                <Check size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{dtLabel}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{rule.object_type ?? '—'}</span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-0.5">
                    <Users size={10} /> {matchingCount} obj{matchingCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>{frequencyCodeLabel(rule.generation_frequency_code)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">₹</span>
                  <input
                    type="number"
                    value={autoAmount[rule.id] ?? 1000}
                    onChange={e => onAmountChange(rule.id, Number(e.target.value))}
                    className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500"
                    placeholder="Amount"
                  />
                </div>
                <button
                  onClick={() => onRemoveRule(rule.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Add rule dropdown */}
      {availableRules.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="w-full h-10 flex items-center gap-2 px-3 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-colors"
          >
            <Plus size={14} />
            {selectedRules.length === 0 ? 'Select rules to generate demands' : 'Add another rule'}
            <ChevronDown size={14} className={`ml-auto transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {availableRules.map(rule => {
                const dtLabel = demandTypes.find(d => d.id === rule.demand_type_id)?.label ?? '—';
                const matchingCount = objects.filter(o => o.object_type === rule.object_type).length;
                return (
                  <button
                    key={rule.id}
                    onClick={() => { onAddRule(rule.id); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-50/40 transition-colors text-left border-b border-slate-50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{dtLabel}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{rule.object_type ?? '—'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-0.5">
                          <Users size={10} /> {matchingCount} obj{matchingCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Plus size={14} className="text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Run Details Full-Screen Overlay ─────────────────────────────────

interface RunDetailsOverlayProps {
  log: DccDemandRunLog;
  details: DccDemand[];
  isLoading: boolean;
  onClose: () => void;
  onViewDemand: (demandId: string) => void;
  onUpdateLog: (log: DccDemandRunLog) => void;
  onRefreshDetails: () => void;
}

const RunDetailsOverlay: React.FC<RunDetailsOverlayProps> = ({ log, details, isLoading, onClose, onViewDemand, onUpdateLog, onRefreshDetails }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeKpi, setActiveKpi] = useState<KpiKey>('ALL');
  const [filterState, setFilterState] = useState<RunDetailFilterState>(emptyRunFilter);
  const [showFilter, setShowFilter] = useState(false);
  const [editTile, setEditTile] = useState<RunDemandTile | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editGstPct, setEditGstPct] = useState('');
  const [editGstAmount, setEditGstAmount] = useState('');
  const [editInterestPct, setEditInterestPct] = useState('');
  const [editDefaultInterestPct, setEditDefaultInterestPct] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<DccDemandStatus>('DUE');
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const tiles = useMemo(() => demandsToTiles(details, log.run_number), [details, log.run_number]);

  const filteredTiles = useMemo(() => {
    let result = tiles;
    if (activeKpi === 'PAID') result = result.filter(t => t.status === 'PAID');
    else if (activeKpi === 'OUTSTANDING') result = result.filter(t => t.status === 'DUE' || t.status === 'OVERDUE');
    else if (activeKpi === 'OVERDUE') result = result.filter(t => t.status === 'OVERDUE');
    if (filterState.statuses.length > 0) {
      result = result.filter(t => filterState.statuses.includes(t.status));
    }
    const q = filterState.searchText.trim().toLowerCase();
    if (q) {
      result = result.filter(t =>
        (t.object_description || '').toLowerCase().includes(q) ||
        (t.object_ref || '').toLowerCase().includes(q) ||
        (t.demand_type_label || '').toLowerCase().includes(q) ||
        (t.owner_name || '').toLowerCase().includes(q)
      );
    }
    const statusRank: Record<string, number> = { OVERDUE: 0, DUE: 1, EXEMPTED: 3, PAID: 4 };
    result = [...result].sort((a, b) => {
      const ra = statusRank[a.status] ?? 5;
      const rb = statusRank[b.status] ?? 5;
      if (ra !== rb) return ra - rb;
      return (b.overdue_amount || 0) - (a.overdue_amount || 0);
    });
    return result;
  }, [tiles, activeKpi, filterState]);

  const totalDemand = tiles.reduce((s, t) => s + t.total_amount, 0);
  const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
  const totalOutstanding = tiles.reduce((s, t) => s + t.amount_due, 0);
  const overdueAmount = tiles.reduce((s, t) => s + t.overdue_amount, 0);
  const collectionRate = totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 100) : 0;

  const activeFilterCount = filterState.statuses.length + (filterState.searchText.trim() ? 1 : 0);

  const canEdit = log.approval_status === 'PENDING' || log.approval_status === 'AMENDED';
  const isAmending = log.approval_status === 'AMENDED';

  const handleOpenEdit = (tile: RunDemandTile) => {
    setEditTile(tile);
    setEditAmount(String(tile.total_amount));
    setEditGstPct(String(tile.gst_pct ?? 0));
    setEditGstAmount(String(tile.gst_amount ?? 0));
    setEditInterestPct(String(tile.interest_pct ?? 0));
    setEditDefaultInterestPct(String(tile.defaulted_interest_pct ?? 0));
    setEditDueDate(tile.due_date);
    setEditStatus(tile.status);
  };

  const handleSaveEdit = async () => {
    if (!editTile) return;
    setSavingEdit(true);
    try {
      await dccService.updateDemand(
        editTile.id,
        {
          amount: Number(editAmount),
          due_date: editDueDate,
          status: editStatus,
          gst_pct: Number(editGstPct) || 0,
          gst_amount: Number(editGstAmount) || 0,
          interest_pct: Number(editInterestPct) || 0,
          defaulted_interest_pct: Number(editDefaultInterestPct) || 0,
        },
        isAmending,
      );
      setToastMsg(isAmending ? 'Demand amended successfully' : 'Demand updated successfully');
      setEditTile(null);
      onRefreshDetails();
    } catch {
      setToastMsg('Failed to save changes');
    } finally {
      setSavingEdit(false);
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await dccService.approveRun(log.id, 'Manager');
      onUpdateLog({ ...log, approval_status: 'APPROVED', approved_at: new Date().toISOString(), approved_by: 'Manager' });
      setToastMsg('Run approved successfully');
    } catch {
      setToastMsg('Failed to approve run');
    } finally {
      setActionLoading(false);
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const handleAmend = async () => {
    setActionLoading(true);
    try {
      await dccService.amendRun(log.id, 'Manager');
      onUpdateLog({ ...log, approval_status: 'AMENDED', amended_at: new Date().toISOString(), amended_by: 'Manager' });
      setToastMsg('Run unlocked for amendment');
    } catch {
      setToastMsg('Failed to unlock run');
    } finally {
      setActionLoading(false);
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const ViewModeSelector: React.FC = () => {
    const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
      { mode: 'card', icon: <LayoutGrid size={16} />, label: 'Card View' },
      { mode: 'list', icon: <List size={16} />, label: 'List View' },
      { mode: 'table', icon: <Table2 size={16} />, label: 'Table View' },
    ];
    return (
      <div className="inline-flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
        {modes.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`group relative flex items-center justify-center w-8 h-8 rounded-md transition-all ${
              viewMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    );
  };

  // KPI Card
  const KpiCard: React.FC<{
    icon: React.ReactNode; label: string; value: string; subValue?: string;
    active: boolean; onClick: () => void; iconBg: string; activeRing: string; delay: number;
  }> = ({ icon, label, value, subValue, active, onClick, iconBg, activeRing, delay }) => (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative bg-white rounded-lg border shadow-sm overflow-hidden text-left transition-all duration-200 hover:shadow-md ${
        active ? `${activeRing} border-2` : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-6 h-6 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500 leading-tight truncate">{label}</span>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-extrabold text-slate-900 tabular-nums leading-none">{value}</span>
          {subValue && <span className="text-[8px] text-slate-400 leading-tight mt-0.5 whitespace-nowrap">{subValue}</span>}
        </div>
      </div>
    </motion.button>
  );

  // Card view
  const CardView: React.FC<{ tile: RunDemandTile; idx: number }> = ({ tile, idx }) => {
    const st = DCC_STATUS[tile.status];
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
        className="flex flex-col justify-between h-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0 max-w-[60%]">
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full shrink-0 tabular-nums">
              RUN-{String(tile.run_number ?? 0).padStart(3, '0')}
            </span>
            <span className="text-xs font-bold text-slate-800 tabular-nums shrink-0 truncate" title={tile.object_description || tile.object_ref}>
              {tile.object_description || tile.object_ref}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.bg} ${st.text} border ${st.border}`}>
            {st.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3 flex-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Demand Type</span>
            <span className="text-xs font-bold text-slate-800 truncate" title={tile.demand_type_label}>{tile.demand_type_label}</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Owner</span>
            <span className="text-xs font-bold text-slate-800 truncate" title={tile.owner_name}>{tile.owner_name}</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Due Date</span>
            <span className={`text-xs font-bold tabular-nums truncate ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-800'}`}>{fmtDateDDMMYYYY(tile.due_date)}</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Amount</span>
            <span className="text-xs font-bold text-slate-800 tabular-nums truncate">{fmtINR(tile.total_amount)}</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Paid</span>
            <span className="text-xs font-bold text-emerald-600 tabular-nums truncate">{tile.amount_paid > 0 ? fmtINR(tile.amount_paid) : '—'}</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pending</span>
            <span className="text-xs font-bold text-red-600 tabular-nums truncate">{tile.amount_due > 0 ? fmtINR(tile.amount_due) : '—'}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-sm font-extrabold text-slate-900 tabular-nums shrink-0">
              {fmtINR(tile.amount_due)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {tile.is_amended && (
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">Amended</span>
              )}
              <span className="text-[10px] font-semibold text-slate-400 shrink-0 truncate" title={tile.object_ref}>{tile.object_ref}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDemand(tile.id)}
              className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Eye size={13} /> View Details
            </button>
            {canEdit ? (
              <button
                onClick={() => handleOpenEdit(tile)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all shrink-0"
                title={isAmending ? 'Amend Demand' : 'Edit Demand'}
              >
                <Pencil size={13} />
              </button>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 border border-slate-200 shrink-0" title="Run is approved — click Amend Run to enable editing">
                <Lock size={13} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Table view
  const TableView: React.FC = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-bold text-slate-600">Run #</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Object</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Owner</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Type</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Due Date</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Amount</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Paid</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Pending</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Status</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTiles.map(tile => {
              const st = DCC_STATUS[tile.status];
              return (
                <tr
                  key={tile.id}
                  onClick={() => onViewDemand(tile.id)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-1.5 px-3 text-[10px] font-bold text-blue-600 tabular-nums whitespace-nowrap">RUN-{String(tile.run_number ?? 0).padStart(3, '0')}</td>
                  <td className="py-1.5 px-3">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{tile.object_description || tile.object_ref}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[200px]">{tile.object_ref}</div>
                  </td>
                  <td className="py-1.5 px-3 text-slate-600">{tile.owner_name}</td>
                  <td className="py-1.5 px-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{tile.demand_type_label}</span>
                  </td>
                  <td className="py-1.5 px-3">
                    <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                      {fmtDateDDMMYYYY(tile.due_date)}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right font-semibold text-slate-700 tabular-nums">{fmtINR(tile.total_amount)}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-emerald-600 tabular-nums">{tile.amount_paid > 0 ? fmtINR(tile.amount_paid) : '—'}</td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">{fmtINR(tile.amount_due)}</td>
                  <td className="py-1.5 px-3 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewDemand(tile.id); }}
                        title="View Details"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all"
                      >
                        <Eye size={13} />
                      </button>
                      {canEdit ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(tile); }}
                          title={isAmending ? 'Amend Demand' : 'Edit Demand'}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all"
                        >
                          <Pencil size={13} />
                        </button>
                      ) : (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 border border-slate-200" title="Run is approved — click Amend Run to enable editing">
                          <Lock size={13} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]"
        onClick={onClose}
      />
      {/* Overlay panel */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 top-14 z-[51] flex flex-col bg-slate-50 rounded-t-2xl shadow-2xl overflow-hidden"
      >
        {/* Header — blue, matching other DCC detail screens */}
        <div className="shrink-0 bg-blue-800 border-b border-blue-900">
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-white">Run Details</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-300 mt-0.5">
                <span className="font-semibold text-slate-200">RUN-{String(log.run_number).padStart(3, '0')}</span>
                <span className="flex items-center gap-1">
                  <Calendar size={10} /> {fmtDateDDMMYYYY(log.run_date)}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${SOURCE_BADGE[log.source] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                  {log.source}
                </span>
                <DemandTypeBadge code={log.demand_type?.code ?? ''} label={log.demand_type?.label ?? '—'} />
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${APPROVAL_BADGE[log.approval_status ?? 'PENDING'].cls}`}>
                  {APPROVAL_BADGE[log.approval_status ?? 'PENDING'].label}
                </span>
                <span className="flex items-center gap-1">
                  <Receipt size={10} /> {log.records_created} records
                </span>
                <span className="font-semibold text-slate-200 tabular-nums">{fmtINR(log.total_amount)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {log.approval_status === 'PENDING' && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Approve Run
                </button>
              )}
              {log.approval_status === 'APPROVED' && (
                <button
                  onClick={handleAmend}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                  Amend Run
                </button>
              )}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-blue-700 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-x-4 gap-y-1 px-4 pb-2 text-[10px] text-slate-300 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-slate-400" /> Run Start Date & Time: <span className="font-semibold text-slate-200">{fmtDateTimeDDMMYYYY(log.started_at)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-slate-400" /> Run End Date & Time: <span className="font-semibold text-slate-200">{fmtDateTimeDDMMYYYY(log.ended_at)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-slate-400" /> Duration: <span className="font-semibold text-slate-200">{fmtDuration(log.duration_ms)}</span>
            </span>
          </div>
        </div>

        {/* KPI Cards + Controls */}
        {!isLoading && tiles.length > 0 && (
          <div className="px-4 pt-3 pb-2 shrink-0 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <KpiCard
                icon={<Receipt size={12} className="text-white" />}
                label="Total Demand"
                value={fmtINR(totalDemand)}
                subValue={`${tiles.length} demands`}
                active={activeKpi === 'ALL'}
                onClick={() => setActiveKpi(prev => prev === 'ALL' ? 'ALL' : 'ALL')}
                iconBg="bg-blue-500"
                activeRing="ring-2 ring-blue-400"
                delay={0}
              />
              <KpiCard
                icon={<CheckCircle2 size={12} className="text-white" />}
                label="Total Paid"
                value={fmtINR(totalPaid)}
                subValue="Collected"
                active={activeKpi === 'PAID'}
                onClick={() => setActiveKpi(prev => prev === 'PAID' ? 'ALL' : 'PAID')}
                iconBg="bg-emerald-500"
                activeRing="ring-2 ring-emerald-400"
                delay={0.04}
              />
              <KpiCard
                icon={<Wallet size={12} className="text-white" />}
                label="Outstanding"
                value={fmtINR(totalOutstanding)}
                subValue="Pending"
                active={activeKpi === 'OUTSTANDING'}
                onClick={() => setActiveKpi(prev => prev === 'OUTSTANDING' ? 'ALL' : 'OUTSTANDING')}
                iconBg="bg-amber-500"
                activeRing="ring-2 ring-amber-400"
                delay={0.08}
              />
              <KpiCard
                icon={<AlertTriangle size={12} className="text-white" />}
                label="Overdue"
                value={fmtINR(overdueAmount)}
                subValue="Penalty"
                active={activeKpi === 'OVERDUE'}
                onClick={() => setActiveKpi(prev => prev === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                iconBg="bg-red-500"
                activeRing="ring-2 ring-red-400"
                delay={0.12}
              />
              <KpiCard
                icon={<TrendingUp size={12} className="text-white" />}
                label="Collection Rate"
                value={`${collectionRate}%`}
                subValue={`${tiles.length} demands`}
                active={activeKpi === 'ALL'}
                onClick={() => setActiveKpi('ALL')}
                iconBg="bg-slate-700"
                activeRing="ring-2 ring-slate-500"
                delay={0.16}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(activeFilterCount > 0 || activeKpi !== 'ALL') && (
                  <button
                    onClick={() => { setFilterState(emptyRunFilter); setActiveKpi('ALL'); }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X size={12} /> Clear all
                  </button>
                )}
                <span
                  onClick={activeFilterCount > 0 ? () => setShowFilter(true) : undefined}
                  className={`text-[11px] ${
                    activeFilterCount > 0
                      ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                      : 'text-slate-400'
                  }`}
                >
                  {filteredTiles.length} of {tiles.length} demands
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ViewModeSelector />
                <button
                  onClick={() => setShowFilter(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <Filter size={13} /> Filter
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demand List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-emerald-600 animate-spin" />
            </div>
          ) : tiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FileText size={32} className="mb-2 opacity-30" />
              <div className="text-sm font-medium text-slate-600">No demand records found for this run</div>
            </div>
          ) : filteredTiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <div className="text-sm font-medium text-slate-600">No demands match the selected filters</div>
              <button
                onClick={() => { setFilterState(emptyRunFilter); setActiveKpi('ALL'); }}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <RotateCcw size={12} /> Clear filters
              </button>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTiles.map((tile, idx) => <CardView key={tile.id} tile={tile} idx={idx} />)}
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-2">
              {filteredTiles.map((tile, idx) => (
                <DemandListRecord
                  key={tile.id}
                  tile={tile}
                  idx={idx}
                  onViewDetails={(t) => onViewDemand(t.id)}
                  onEdit={(t) => handleOpenEdit(t as RunDemandTile)}
                  canEdit={canEdit}
                  editTitle={isAmending ? 'Amend Demand' : 'Edit Demand'}
                />
              ))}
            </div>
          ) : (
            <TableView />
          )}
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilter && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                onClick={() => setShowFilter(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-slate-50 shadow-2xl z-[71] flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
                  <h2 className="text-sm font-bold text-white">Filter Demands</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterState(emptyRunFilter)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Search</p>
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={filterState.searchText}
                        onChange={e => setFilterState(d => ({ ...d, searchText: e.target.value }))}
                        placeholder="Object, owner, or demand type..."
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setFilterState(d => ({ ...d, statuses: toggleArray(d.statuses, s.value) }))}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            filterState.statuses.includes(s.value)
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-teal-900 border-t border-slate-700 shrink-0">
                  <button
                    onClick={() => setShowFilter(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition-all"
                  >
                    <Search size={16} /> Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit / Amend Demand Modal */}
      <AnimatePresence>
        {editTile && (() => {
          const baseAmt = Number(editAmount) || 0;
          const gstAmt = Number(editGstAmount) || 0;
          const interestPct = Number(editInterestPct) || 0;
          const interestAmt = Math.round(baseAmt * interestPct / 100);
          const penaltyAmt = editTile.overdue_amount > 0 ? Math.round(editTile.overdue_amount * 0.02) : 0;
          const grossDemand = baseAmt + gstAmt + interestAmt + penaltyAmt;
          const netPayable = Math.max(0, grossDemand - editTile.amount_paid);
          const config = getDemandComponentConfig(editTile.demand_type_code, editTile.object_type);
          const isOverdue = editStatus === 'OVERDUE';
          const bill = computeBill(baseAmt, editTile.amount_paid, Math.max(0, baseAmt - editTile.amount_paid), isOverdue, 0, config);

          return (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
              onClick={() => setEditTile(null)}
            />
            <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="pointer-events-auto w-full max-w-[480px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className={`flex items-center gap-2.5 px-5 py-4 ${isAmending ? 'bg-blue-700' : 'bg-slate-800'}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isAmending ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    {isAmending ? <Unlock size={15} className="text-white" /> : <Pencil size={15} className="text-white" />}
                  </div>
                  <h2 className="text-sm font-bold text-white">{isAmending ? 'Amend Demand' : 'Edit Demand'}</h2>
                  <button
                    onClick={() => setEditTile(null)}
                    className="ml-auto flex items-center justify-center w-7 h-7 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {/* Context card */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Demand</div>
                        <div className="text-xs font-bold text-slate-900 truncate" title={editTile.object_description || editTile.object_ref}>
                          {editTile.object_description || editTile.object_ref}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 ml-2 shrink-0">{editTile.demand_type_label}</span>
                    </div>
                  </div>

                  {/* Section: Editable Amounts */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Editable Components</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Base Amount */}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Base Amount (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* GST % */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">GST %</label>
                        <input
                          type="number"
                          value={editGstPct}
                          onChange={(e) => {
                            setEditGstPct(e.target.value);
                            const pct = Number(e.target.value) || 0;
                            const base = Number(editAmount) || 0;
                            setEditGstAmount(String(Math.round(base * pct / 100)));
                          }}
                          className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* GST Amount */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">GST Amount (₹)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={editGstAmount}
                            onChange={(e) => setEditGstAmount(e.target.value)}
                            className="w-full pl-6 pr-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Interest % */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Interest % p.a.</label>
                        <input
                          type="number"
                          value={editInterestPct}
                          onChange={(e) => setEditInterestPct(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* Defaulted Interest % */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Default Interest %</label>
                        <input
                          type="number"
                          value={editDefaultInterestPct}
                          onChange={(e) => setEditDefaultInterestPct(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* Due Date */}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Due Date</label>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as DccDemandStatus)}
                          className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                        >
                          <option value="DUE">Due</option>
                          <option value="OVERDUE">Overdue</option>
                          <option value="PAID">Paid</option>
                          <option value="EXEMPTED">Exempted</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Line-item breakdown */}
                  {config.components.length > 1 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Component Breakdown</div>
                      {bill.lineItems.map((li) => (
                        <div key={li.key} className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-600 font-medium truncate pr-2">{li.label}</span>
                          <span className="text-slate-800 font-bold tabular-nums shrink-0">{fmtINR(li.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary - computed totals */}
                  <div className="rounded-lg border border-slate-200 bg-blue-50/40 px-3 py-2.5 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Computed Summary</div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 font-medium">Base Amount</span>
                      <span className="text-slate-800 font-bold tabular-nums">{fmtINR(baseAmt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 font-medium">GST ({editGstPct || 0}%)</span>
                      <span className="text-slate-700 font-bold tabular-nums">+ {fmtINR(gstAmt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 font-medium">Interest ({editInterestPct || 0}%)</span>
                      <span className="text-slate-700 font-bold tabular-nums">+ {fmtINR(interestAmt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 font-medium">Penalty / Late Fee</span>
                      <span className="text-red-600 font-bold tabular-nums">+ {fmtINR(penaltyAmt)}</span>
                    </div>
                    <div className="border-t border-slate-200 my-1" />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 font-bold">Gross Demand</span>
                      <span className="text-slate-900 font-extrabold tabular-nums">{fmtINR(grossDemand)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-emerald-700 font-medium">Already Paid</span>
                      <span className="text-emerald-700 font-bold tabular-nums">- {fmtINR(editTile.amount_paid)}</span>
                    </div>
                    <div className="border-t border-slate-200 my-1" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-extrabold">Net Payable</span>
                      <span className="text-red-600 font-extrabold tabular-nums">{fmtINR(netPayable)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => setEditTile(null)}
                    className="flex-1 py-2.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${isAmending ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                  >
                    {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {isAmending ? 'Save Amendment' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
          );
        })()}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
