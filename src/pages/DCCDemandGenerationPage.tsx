import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, Zap, Loader2,
  CheckCircle2, AlertCircle, Play, History,
  RefreshCw, ChevronDown, ChevronRight,
  Filter, X, Clock, FileText, TrendingUp, Users,
  Calendar, Sparkles,
  Eye, Plus, Check,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { payableCriteriaService } from '../services/payableCriteriaService';
import { ROUTES } from '../constants/routes';
import { useNavigate } from 'react-router-dom';
import { frequencyCodeLabel } from '../types/payableCriteria';
import type { DccDemandRunLog, DccDemandType, DccObject, DccDemand } from '../types/dcc';
import type { PayableCriteria } from '../types/payableCriteria';
import { Modal } from '../components/ui/Modal';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

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

const SOURCE_ROW_STYLE: Record<string, string> = {
  TPA: 'bg-blue-50/55 border-l-blue-400',
  EXCEL: 'bg-emerald-50/55 border-l-emerald-400',
  AUTO: 'bg-amber-50/55 border-l-amber-400',
  MANUAL: 'bg-slate-50/80 border-l-slate-400',
};

const STATUS_BADGE: Record<string, string> = {
  DUE: 'bg-amber-100 text-amber-700 border border-amber-200',
  OVERDUE: 'bg-red-100 text-red-700 border border-red-200',
  PAID: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  EXEMPTED: 'bg-slate-100 text-slate-600 border border-slate-200',
};



export const DCCDemandGenerationPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Filters
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterDemandTypeId, setFilterDemandTypeId] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterObjectRef, setFilterObjectRef] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const log = await dccService.listRunLog();
      setRunLog(log);
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

  const clearFilters = () => {
    setFilterSource('');
    setFilterDemandTypeId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterObjectRef('');
  };

  const hasActiveFilters = filterSource || filterDemandTypeId || filterDateFrom || filterDateTo || filterObjectRef;

  const filteredRunLog = useMemo(() => {
    let r = runLog;
    if (filterSource) r = r.filter(l => l.source === filterSource);
    if (filterDemandTypeId) r = r.filter(l => l.demand_type_id === filterDemandTypeId);
    if (filterDateFrom) r = r.filter(l => l.run_date >= filterDateFrom);
    if (filterDateTo) r = r.filter(l => l.run_date <= filterDateTo);
    if (filterObjectRef) {
      const ref = filterObjectRef.toLowerCase();
      r = r.filter(l => {
        const details = runDetails[l.id] ?? [];
        return details.some(d => (d.object?.object_ref ?? '').toLowerCase().includes(ref));
      });
    }
    return r;
  }, [runLog, filterSource, filterDemandTypeId, filterDateFrom, filterDateTo, filterObjectRef, runDetails]);

  const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white text-slate-700 transition-colors';

  return (
    <div className="min-h-full bg-slate-100 flex flex-col">
      {/* Page title bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <button onClick={() => navigate(ROUTES.DCC)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
          <Zap size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-slate-900">Demand Generation</h1>
          <p className="text-[11px] text-slate-500">Generate demands from active rules and review run history</p>
        </div>
        <button onClick={loadHistory} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 border border-slate-200 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ── Auto-Generate Panel ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-transparent">
            <Sparkles size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Auto-Generate from Rules</h2>
            <span className="ml-auto text-[11px] text-slate-400">{rules.length} active rule{rules.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-[13rem_minmax(0,1fr)_auto] items-end gap-3">
              {/* Run date */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Calendar size={12} /> Run Date
                </label>
                <input
                  type="date"
                  value={autoRunDate}
                  onChange={e => setAutoRunDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Rule dropdown */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Demand Rules</label>
                {loadingRules ? (
                  <div className="flex items-center h-9 px-3 border border-slate-200 rounded-lg bg-slate-50">
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                  </div>
                ) : rules.length === 0 ? (
                  <div className="flex items-center h-9 px-3 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400">
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
              <button
                onClick={handleAutoGenerate}
                disabled={selectedRuleIds.size === 0 || generating}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
              >
                {generating ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {generating ? 'Generating…' : `Generate (${selectedRuleIds.size})`}
              </button>
            </div>

          </div>
        </div>

        {/* ── Run History ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
            <History size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Generation Run History</h2>
            <span className="ml-auto text-[11px] text-slate-400">{filteredRunLog.length} run{filteredRunLog.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setShowFilters(s => !s)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${hasActiveFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter size={12} /> Filter
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Source</label>
                  <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className={inputCls}>
                    <option value="">All Sources</option>
                    <option value="AUTO">Auto</option>
                    <option value="TPA">TPA</option>
                    <option value="EXCEL">Excel</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Demand Type</label>
                  <select value={filterDemandTypeId} onChange={e => setFilterDemandTypeId(e.target.value)} className={inputCls}>
                    <option value="">All Types</option>
                    {demandTypes.map(dt => (
                      <option key={dt.id} value={dt.id}>{dt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Run Date From</label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Run Date To</label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filterObjectRef}
                  onChange={e => setFilterObjectRef(e.target.value)}
                  placeholder="Search by object reference..."
                  className={inputCls + ' max-w-xs'}
                />
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-emerald-500" />
            </div>
          ) : filteredRunLog.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">{hasActiveFilters ? 'No runs match your filters' : 'No generation runs yet'}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredRunLog.map((log, logIdx) => {
                const rowStyle = SOURCE_ROW_STYLE[log.source] ?? 'bg-white border-l-slate-300';
                return (
                  <div
                    key={log.id}
                    className={`flex items-center gap-3 px-4 py-2 rounded-md border-l-[3px] border border-slate-200 ${rowStyle} hover:shadow-sm transition-all group`}
                  >
                    {/* Left: primary info */}
                    <span className="text-[10px] font-bold text-slate-300 w-5 text-right shrink-0">{logIdx + 1}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${SOURCE_BADGE[log.source] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {log.source}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 shrink-0 hidden md:block">{log.demand_type?.label ?? '—'}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 hidden lg:block">{fmtDate(log.run_date)}</span>

                    {/* Middle: metadata */}
                    <div className="ml-auto flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 hidden md:flex">
                        <Users size={11} /> {log.run_summary?.object_count as number ?? '—'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <FileText size={11} /> {log.records_created}
                      </span>
                      {log.records_failed > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-red-500">
                          <AlertCircle size={11} /> {log.records_failed}
                        </span>
                      )}
                      {log.duration_ms != null && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 hidden xl:flex">
                          <Clock size={11} /> {fmtDuration(log.duration_ms)}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-900">{fmtINR(log.total_amount)}</span>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => handleOpenRunDetails(log)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                      >
                        <Eye size={11} /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Run details modal */}
          <Modal
            isOpen={!!detailModalLog}
            onClose={closeRunDetails}
            title="Run Details"
            size="lg"
            noPadding
          >
            {detailModalLog && (
              <RunDetailsContent
                log={detailModalLog}
                details={runDetails[detailModalLog.id] ?? []}
                isLoading={loadingDetails === detailModalLog.id}
              />
            )}
          </Modal>
        </div>
      </div>
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
            className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-colors"
          >
            <Plus size={14} />
            {selectedRules.length === 0 ? 'Select rules to generate demands' : 'Add another rule'}
            <ChevronDown size={14} className={`ml-auto transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
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

// ── Run Details Content (inside modal) ─────────────────────────────

interface RunDetailsContentProps {
  log: DccDemandRunLog;
  details: DccDemand[];
  isLoading: boolean;
}

const RunDetailsContent: React.FC<RunDetailsContentProps> = ({ log, details, isLoading }) => {
  return (
    <div className="p-5 space-y-4">
      {/* Metadata grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <Play size={11} /> Started
          </div>
          <div className="text-xs font-semibold text-slate-700">{fmtDateTime(log.started_at)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <CheckCircle2 size={11} /> Ended
          </div>
          <div className="text-xs font-semibold text-slate-700">{fmtDateTime(log.ended_at)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <Clock size={11} /> Duration
          </div>
          <div className="text-xs font-semibold text-slate-700">{fmtDuration(log.duration_ms)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <TrendingUp size={11} /> Total Amount
          </div>
          <div className="text-xs font-semibold text-slate-700">{fmtINR(log.total_amount)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <FileText size={11} /> Records Created
          </div>
          <div className="text-xs font-semibold text-emerald-600">{log.records_created}</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <AlertCircle size={11} /> Records Failed
          </div>
          <div className={`text-xs font-semibold ${log.records_failed > 0 ? 'text-red-600' : 'text-slate-700'}`}>{log.records_failed}</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <Users size={11} /> Objects
          </div>
          <div className="text-xs font-semibold text-slate-700">{log.run_summary?.object_count as number ?? '—'}</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            <History size={11} /> Logged At
          </div>
          <div className="text-xs font-semibold text-slate-700">{fmtDateTime(log.created_at)}</div>
        </div>
      </div>

      {/* Demands table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
          <FileText size={13} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Demands in this run</span>
          <span className="ml-auto text-[10px] text-slate-400">{details.length} demand{details.length !== 1 ? 's' : ''}</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-emerald-500" />
          </div>
        ) : details.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <p className="text-xs">No demand records found for this run</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left">Object Ref</th>
                  <th className="px-3 py-2 text-left">Owner</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Due Date</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {details.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700 font-medium">{d.object?.object_ref ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{d.owner?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{fmtINR(d.amount)}</td>
                    <td className="px-3 py-2 text-slate-600">{fmtDate(d.due_date)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[d.status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
