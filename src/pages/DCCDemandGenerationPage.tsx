import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, FileSpreadsheet, Zap, DownloadCloud, Loader2,
  CheckCircle2, AlertCircle, X, Upload, Play, History,
  RefreshCw, ChevronDown, ChevronRight, FileText,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { payableCriteriaService } from '../services/payableCriteriaService';
import { ROUTES } from '../constants/routes';
import { useNavigate } from 'react-router-dom';
import type { DccDemandRunLog, DccDemandType, DccObject } from '../types/dcc';
import type { PayableCriteria } from '../types/payableCriteria';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

type Source = 'TPA' | 'EXCEL' | 'AUTO';
type Step = 'select' | 'input' | 'preview' | 'result';

interface PreviewRow {
  object_ref: string;
  demand_type_code: string;
  amount: number;
  due_date: string;
  run_date: string;
  valid: boolean;
  error?: string;
}

const SOURCE_CONFIG: { key: Source; label: string; icon: typeof Zap; color: string; bg: string; border: string; desc: string }[] = [
  { key: 'TPA', label: 'Import from TPA', icon: DownloadCloud, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Fetch demands from a third-party API endpoint' },
  { key: 'EXCEL', label: 'Upload Excel Sheet', icon: FileSpreadsheet, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Upload a predefined Excel/CSV demand sheet' },
  { key: 'AUTO', label: 'Auto-Generate from Rules', icon: Zap, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Generate demands automatically from active rules' },
];

export const DCCDemandGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select');
  const [source, setSource] = useState<Source | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ created: number; totalAmount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // TPA state
  const [tpaJson, setTpaJson] = useState('');

  // Excel state
  const [excelFileName, setExcelFileName] = useState('');

  // Auto state
  const [rules, setRules] = useState<PayableCriteria[]>([]);
  const [demandTypes, setDemandTypes] = useState<DccDemandType[]>([]);
  const [objects, setObjects] = useState<DccObject[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [autoAmount, setAutoAmount] = useState<Record<string, number>>({});
  const [autoRunDate, setAutoRunDate] = useState(new Date().toISOString().slice(0, 10));

  // Run history
  const [runLog, setRunLog] = useState<DccDemandRunLog[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

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
      for (const r of dccRules) amounts[r.id] = 1000;
      setAutoAmount(amounts);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (source === 'AUTO') loadRules();
  }, [source, loadRules]);

  const handleSelectSource = (s: Source) => {
    setSource(s);
    setStep('input');
    setError(null);
    setPreviewRows([]);
    setResult(null);
  };

  const parseTpaJson = (): PreviewRow[] => {
    try {
      const parsed = JSON.parse(tpaJson) as { object_ref?: string; demand_type_code?: string; amount?: number; due_date?: string; run_date?: string }[];
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
      return parsed.map((r) => {
        const valid = !!(r.object_ref && r.demand_type_code && r.amount && r.due_date && r.run_date);
        return {
          object_ref: r.object_ref ?? '',
          demand_type_code: r.demand_type_code ?? '',
          amount: r.amount ?? 0,
          due_date: r.due_date ?? '',
          run_date: r.run_date ?? '',
          valid,
          error: valid ? undefined : 'Missing required fields',
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      return [];
    }
  };

  const parseCsv = (text: string): PreviewRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) { setError('CSV needs a header row and at least one data row'); return []; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const refIdx = headers.indexOf('object_ref');
    const typeIdx = headers.indexOf('demand_type_code');
    const amtIdx = headers.indexOf('amount');
    const dueIdx = headers.indexOf('due_date');
    const runIdx = headers.indexOf('run_date');

    if (refIdx < 0 || typeIdx < 0 || amtIdx < 0 || dueIdx < 0 || runIdx < 0) {
      setError('CSV must have columns: object_ref, demand_type_code, amount, due_date, run_date');
      return [];
    }

    return lines.slice(1).map((line) => {
      const cols = line.split(',').map(c => c.trim());
      const row: PreviewRow = {
        object_ref: cols[refIdx] ?? '',
        demand_type_code: cols[typeIdx] ?? '',
        amount: Number(cols[amtIdx] ?? 0),
        due_date: cols[dueIdx] ?? '',
        run_date: cols[runIdx] ?? '',
        valid: !!(cols[refIdx] && cols[typeIdx] && cols[amtIdx] && cols[dueIdx] && cols[runIdx]),
      };
      if (!row.valid) row.error = 'Missing fields';
      return row;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCsv(text);
      if (rows.length > 0) {
        setPreviewRows(rows);
        setStep('preview');
      }
    };
    reader.readAsText(file);
  };

  const handleTpaPreview = () => {
    const rows = parseTpaJson();
    if (rows.length > 0) {
      setPreviewRows(rows);
      setStep('preview');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const validRows = previewRows.filter(r => r.valid);
      let res: { created: number; totalAmount: number };
      if (source === 'TPA') {
        res = await dccService.generateFromTPA(validRows);
      } else if (source === 'EXCEL') {
        res = await dccService.generateFromExcel(validRows);
      } else {
        res = { created: 0, totalAmount: 0 };
      }
      setResult(res);
      setStep('result');
      await loadHistory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    setError(null);
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
      setResult(res);
      setStep('result');
      await loadHistory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Auto-generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setStep('select');
    setSource(null);
    setPreviewRows([]);
    setResult(null);
    setError(null);
    setTpaJson('');
    setExcelFileName('');
    setSelectedRuleIds(new Set());
  };

  const toggleRule = (id: string) => {
    setSelectedRuleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white text-slate-700 transition-colors';

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header — Deep Slate Navy */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
        <button onClick={() => step === 'select' ? navigate(ROUTES.DCC) : reset()} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white">Demand Generation</h1>
          <p className="text-[10px] text-slate-400">Create demands from TPA import, Excel upload, or auto-generation rules</p>
        </div>
        <button onClick={loadHistory} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-semibold hover:bg-slate-700 hover:text-white transition-colors border border-slate-700">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* ── Source selection ── */}
        {step === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SOURCE_CONFIG.map(cfg => {
              const Icon = cfg.icon;
              return (
                <button
                  key={cfg.key}
                  onClick={() => handleSelectSource(cfg.key)}
                  className={`text-left rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 hover:shadow-md transition-all duration-200 group`}
                >
                  <div className={`w-12 h-12 rounded-lg ${cfg.color} bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <h3 className={`text-sm font-bold ${cfg.color} mb-1`}>{cfg.label}</h3>
                  <p className="text-xs text-slate-500">{cfg.desc}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* ── TPA input ── */}
        {step === 'input' && source === 'TPA' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Import from Third-Party API</h2>
            <p className="text-xs text-slate-500 mb-4">Paste the JSON array returned by the TPA endpoint. Each row needs: object_ref, demand_type_code, amount, due_date, run_date.</p>
            <textarea
              value={tpaJson}
              onChange={e => setTpaJson(e.target.value)}
              placeholder={`[\n  {\n    "object_ref": "MH12-AB-1234",\n    "demand_type_code": "PROPERTY_TAX",\n    "amount": 5000,\n    "due_date": "2026-09-15",\n    "run_date": "2026-09-01"\n  }\n]`}
              className="w-full h-48 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 bg-slate-50 text-slate-700"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={handleTpaPreview} disabled={!tpaJson.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                <Play size={14} /> Preview
              </button>
              <button onClick={reset} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* ── Excel input ── */}
        {step === 'input' && source === 'EXCEL' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Upload Excel / CSV Sheet</h2>
            <p className="text-xs text-slate-500 mb-4">Upload a CSV file with columns: object_ref, demand_type_code, amount, due_date, run_date.</p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-12 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
              <Upload size={28} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">{excelFileName || 'Click to select a CSV file'}</span>
              <span className="text-[10px] text-slate-400">Accepts .csv files</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <div className="flex gap-2 mt-4">
              <button onClick={reset} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* ── Auto input ── */}
        {step === 'input' && source === 'AUTO' && (
          <div className="max-w-3xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Auto-Generate from Rules</h2>
            <p className="text-xs text-slate-500 mb-4">Select active demand rules to generate demands for matching objects.</p>
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Run Date</label>
              <input type="date" value={autoRunDate} onChange={e => setAutoRunDate(e.target.value)} className={inputCls + ' max-w-48'} />
            </div>
            {rules.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Zap size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No active DCC rules found</p>
                <p className="text-xs mt-1">Create rules in Rule Setup first</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map(rule => {
                  const dtLabel = demandTypes.find(d => d.id === rule.demand_type_id)?.label ?? '—';
                  const matchingCount = objects.filter(o => o.object_type === rule.object_type).length;
                  const selected = selectedRuleIds.has(rule.id);
                  return (
                    <div key={rule.id} className={`rounded-lg border ${selected ? 'border-teal-300 bg-teal-50/50' : 'border-slate-200'} p-3 transition-colors`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selected} onChange={() => toggleRule(rule.id)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{dtLabel}</span>
                            <span className="text-[10px] text-slate-400">·</span>
                            <span className="text-[10px] text-slate-500">{rule.object_type}</span>
                            <span className="text-[10px] text-slate-400">·</span>
                            <span className="text-[10px] text-slate-500">{matchingCount} object{matchingCount !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Run day: {rule.subsequent_btm_run_day} · Offset: {rule.full_payment_spec?.days_offset ?? 0} days</p>
                        </div>
                        {selected && (
                          <input
                            type="number"
                            value={autoAmount[rule.id] ?? 1000}
                            onChange={e => setAutoAmount(prev => ({ ...prev, [rule.id]: Number(e.target.value) }))}
                            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                            placeholder="Amount"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={handleAutoGenerate} disabled={selectedRuleIds.size === 0 || generating} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {generating ? 'Generating…' : `Generate (${selectedRuleIds.size} rule${selectedRuleIds.size !== 1 ? 's' : ''})`}
              </button>
              <button onClick={reset} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* ── Preview ── */}
        {step === 'preview' && (source === 'TPA' || source === 'EXCEL') && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-600">
              <FileText size={16} className="text-white" />
              <span className="text-sm font-bold text-white">Preview — {previewRows.length} rows</span>
              <span className="ml-auto text-[10px] text-white/70">{previewRows.filter(r => r.valid).length} valid · {previewRows.filter(r => !r.valid).length} invalid</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left">Object Ref</th>
                    <th className="px-3 py-2 text-left">Demand Type</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Due Date</th>
                    <th className="px-3 py-2 text-left">Run Date</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className={row.valid ? '' : 'bg-red-50/50'}>
                      <td className="px-3 py-2 text-slate-700">{row.object_ref || '—'}</td>
                      <td className="px-3 py-2 text-slate-700">{row.demand_type_code || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{fmtINR(row.amount)}</td>
                      <td className="px-3 py-2 text-slate-600">{row.due_date || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{row.run_date || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {row.valid
                          ? <CheckCircle2 size={14} className="inline text-emerald-500" />
                          : <span className="text-[10px] text-red-500" title={row.error}>Invalid</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-gray-100 bg-slate-50">
              <button onClick={handleGenerate} disabled={generating || previewRows.filter(r => r.valid).length === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                {generating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {generating ? 'Generating…' : `Generate ${previewRows.filter(r => r.valid).length} Demands`}
              </button>
              <button onClick={reset} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">Back</button>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {step === 'result' && result && (
          <div className="max-w-md mx-auto bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Generation Complete</h2>
            <p className="text-xs text-slate-500 mb-4">Successfully created demands from {source}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-2xl font-extrabold text-teal-700">{result.created}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Demands Created</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-2xl font-extrabold text-teal-700">{fmtINR(result.totalAmount)}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Amount</div>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate(ROUTES.DCC)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
                View DCC Summary
              </button>
              <button onClick={reset} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">Generate More</button>
            </div>
          </div>
        )}

        {/* ── Run History ── */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <History size={15} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Generation Run History</h2>
            <span className="ml-auto text-[10px] text-slate-400">{runLog.length} run{runLog.length !== 1 ? 's' : ''}</span>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-teal-500" />
            </div>
          ) : runLog.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <History size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No generation runs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {runLog.map((log) => {
                const expanded = expandedRun === log.id;
                return (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpandedRun(expanded ? null : log.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      {expanded ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.source === 'TPA' ? 'bg-blue-100 text-blue-700' : log.source === 'EXCEL' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {log.source}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">{log.demand_type?.label ?? '—'}</span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[10px] text-slate-500">{fmtDate(log.run_date)}</span>
                      <span className="ml-auto text-xs font-bold text-slate-900">{log.records_created} rows · {fmtINR(log.total_amount)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DCCDemandGenerationPage;
