import React, { useRef } from 'react';
import { X, ClipboardList, Download, FileText, ExternalLink, Clock } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  actorRole: string;
  message: string;
  documentUrls?: string[];
  /** Optional badge label (e.g. status name) */
  tag?: string;
  tagColor?: 'blue' | 'emerald' | 'amber' | 'red' | 'gray' | 'sky' | 'rose';
}

interface LogDetailsModalProps {
  title: string;
  subtitle?: string;
  entries: LogEntry[];
  loading?: boolean;
  onClose: () => void;
}

const TAG_CLS: Record<string, string> = {
  blue:    'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  red:     'bg-red-100 text-red-700',
  gray:    'bg-gray-100 text-gray-600',
  sky:     'bg-sky-100 text-sky-700',
  rose:    'bg-rose-100 text-rose-700',
};

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  manager:        { bg: 'bg-blue-100',    text: 'text-blue-700' },
  EMPLOYEE:       { bg: 'bg-teal-100',    text: 'text-teal-700' },
  employee:       { bg: 'bg-teal-100',    text: 'text-teal-700' },
  EO:             { bg: 'bg-sky-100',     text: 'text-sky-700' },
  system:         { bg: 'bg-gray-100',    text: 'text-gray-500' },
  SYSTEM:         { bg: 'bg-gray-100',    text: 'text-gray-500' },
  admin:          { bg: 'bg-rose-100',    text: 'text-rose-700' },
  govt_official:  { bg: 'bg-amber-100',   text: 'text-amber-700' },
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function LogDetailsModal({ title, subtitle, entries, loading, onClose }: LogDetailsModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = entries.map(e => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;white-space:nowrap;font-size:11px">${fmtDateTime(e.timestamp)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:11px">${e.actorRole}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:12px">${e.message}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:11px">${e.tag || ''}</td>
      </tr>`).join('');
    w.document.write(`
      <!DOCTYPE html><html><head><title>Log — ${title}</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{font-size:18px;margin-bottom:4px}p{color:#6b7280;font-size:12px;margin-bottom:24px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 12px;background:#f9fafb;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;border-bottom:2px solid #e5e7eb}@media print{button{display:none}}</style>
      </head><body>
      <h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}
      <table><thead><tr><th>Timestamp</th><th>Actor</th><th>Message</th><th>Tag</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>{window.print();}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <ClipboardList size={15} className="text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">{title}</h2>
            {subtitle && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 border border-gray-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
              title="Download as PDF"
            >
              <Download size={11} />
              PDF
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={printRef} className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading activity log…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                <Clock size={20} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No activity recorded yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-100" />

              <div className="space-y-0">
                {entries.map((entry, idx) => {
                  const roleStyle = ROLE_STYLE[entry.actorRole] ?? ROLE_STYLE.system;
                  const isLast = idx === entries.length - 1;
                  return (
                    <div key={entry.id} className={`relative flex gap-3 ${isLast ? '' : 'pb-4'}`}>
                      {/* Dot */}
                      <div className={`relative z-10 w-[30px] shrink-0 flex items-start justify-center pt-0.5`}>
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${roleStyle.bg} ring-1 ring-gray-200`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleStyle.bg} ${roleStyle.text} uppercase tracking-wide`}>
                              {entry.actorRole}
                            </span>
                            {entry.tag && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${TAG_CLS[entry.tagColor ?? 'gray']}`}>
                                {entry.tag}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-gray-400 shrink-0 whitespace-nowrap">{fmtDateTime(entry.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{entry.message}</p>
                        {entry.documentUrls && entry.documentUrls.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {entry.documentUrls.map((url, di) => (
                              <a
                                key={di}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md transition-colors"
                              >
                                <FileText size={9} />
                                Doc {di + 1}
                                <ExternalLink size={8} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && entries.length > 0 && (
          <div className="shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50/60">
            <p className="text-[10px] text-gray-400 text-center">{entries.length} event{entries.length !== 1 ? 's' : ''} in log</p>
          </div>
        )}
      </div>
    </div>
  );
}
