import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, CheckCircle2, AlertTriangle, Clock, Download,
  Loader2, FileText, Users,
} from 'lucide-react';
import { dccService } from '../../services/dccService';
import type {
  DccReconciliationRow, DccReconciliationSummary,
  DccReportRow, DccOwnerReportRow,
} from '../../types/dcc';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const BANK_STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  Matched:   { label: 'Matched',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Unmatched:  { label: 'Unmatched', bg: 'bg-amber-50',   text: 'text-amber-700' },
  Pending:    { label: 'Pending',   bg: 'bg-slate-50',    text: 'text-slate-600' },
};

export const DCCReconciliationTab: React.FC = () => {
  const [rows, setRows] = useState<DccReconciliationRow[]>([]);
  const [summary, setSummary] = useState<DccReconciliationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: r, summary: s } = await dccService.getReconciliationData();
      setRows(r);
      setSummary(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.object_ref.toLowerCase().includes(q) ||
      r.owner_name.toLowerCase().includes(q) ||
      r.demand_type_label.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>DCC Reconciliation Report</title>
    <style>body{font-family:sans-serif;font-size:13px;color:#1f2937;margin:32px}h2{margin:0 0 4px}p{margin:2px 0;color:#6b7280;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0f766e;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #f3f4f6}</style></head>
    <body><h2>DCC Reconciliation Report</h2>
    <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
    <p>Total Demand: ${fmtINR(summary?.total_demand ?? 0)} · Total Collected: ${fmtINR(summary?.total_collected ?? 0)} · Outstanding: ${fmtINR(summary?.total_outstanding ?? 0)} · Rate: ${summary?.reconciliation_rate ?? 0}%</p>
    <table><thead><tr><th>Object</th><th>Owner</th><th>Type</th><th>Demand</th><th>Collected</th><th>Outstanding</th><th>Bank Status</th></tr></thead><tbody>
    ${filtered.map((r) => `<tr><td>${r.object_ref}</td><td>${r.owner_name}</td><td>${r.demand_type_label}</td><td>${fmtINR(r.total_demand)}</td><td>${fmtINR(r.total_collected)}</td><td>${fmtINR(r.total_outstanding)}</td><td>${r.bank_status}</td></tr>`).join('')}
    </tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'DCC_Reconciliation.html';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertTriangle size={28} className="mb-2" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary cards */}
      <div className="px-4 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText size={13} className="text-slate-700" />
            <span className="text-[9px] font-bold uppercase text-slate-600">Total Demand</span>
          </div>
          <div className="text-base font-extrabold text-slate-800">{fmtINR(summary?.total_demand ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 size={13} className="text-emerald-700" />
            <span className="text-[9px] font-bold uppercase text-emerald-700">Collected</span>
          </div>
          <div className="text-base font-extrabold text-emerald-700">{fmtINR(summary?.total_collected ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={13} className="text-amber-700" />
            <span className="text-[9px] font-bold uppercase text-amber-700">Outstanding</span>
          </div>
          <div className="text-base font-extrabold text-amber-700">{fmtINR(summary?.total_outstanding ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={13} className="text-teal-700" />
            <span className="text-[9px] font-bold uppercase text-teal-700">Recon Rate</span>
          </div>
          <div className="text-base font-extrabold text-teal-700">{summary?.reconciliation_rate ?? 0}%</div>
        </div>
      </div>

      {/* Bank status counts */}
      <div className="px-4 pb-2 shrink-0">
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> {summary?.matched_count ?? 0} Matched</span>
          <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> {summary?.unmatched_count ?? 0} Unmatched</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {summary?.pending_count ?? 0} Pending</span>
          <button
            onClick={handleExport}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-2 shrink-0">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by object, owner, or demand type..."
          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
            <div className="text-sm font-medium text-slate-600">No reconciliation records</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Object</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Owner</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500">Type</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Demand</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Collected</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-slate-500">Outstanding</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold uppercase text-slate-500">Bank Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r, i) => {
                  const st = BANK_STATUS_STYLE[r.bank_status] ?? BANK_STATUS_STYLE.Pending;
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-xs font-semibold text-slate-900">{r.object_ref}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{r.owner_name}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{r.demand_type_label}</td>
                      <td className="px-3 py-2 text-xs text-right font-semibold text-slate-900">{fmtINR(r.total_demand)}</td>
                      <td className="px-3 py-2 text-xs text-right font-semibold text-emerald-700">{fmtINR(r.total_collected)}</td>
                      <td className="px-3 py-2 text-xs text-right font-semibold text-amber-700">{fmtINR(r.total_outstanding)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DCCReconciliationTab;
