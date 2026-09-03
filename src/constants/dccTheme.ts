// ── DCC Enterprise Fintech Theme ──────────────────────────────────────────────
// Unified color scheme: Deep Slate Navy, Emerald Green, Warm Amber, Slate Gray

export type DccStatusKey = 'DUE' | 'OVERDUE' | 'PAID' | 'EXEMPTED' | 'DISPUTED';

export interface DccStatusStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  solidBg: string;
}

export const DCC_STATUS: Record<DccStatusKey, DccStatusStyle> = {
  DUE:      { label: 'Due',      bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-300',    dot: 'bg-amber-400',  solidBg: 'bg-amber-500' },
  OVERDUE:  { label: 'Overdue',  bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-300',      dot: 'bg-red-500',    solidBg: 'bg-red-500' },
  PAID:     { label: 'Paid',     bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-300',  dot: 'bg-emerald-500', solidBg: 'bg-emerald-500' },
  EXEMPTED: { label: 'Exempted', bg: 'bg-slate-100',   text: 'text-slate-600',    border: 'border-slate-300',    dot: 'bg-slate-400',  solidBg: 'bg-slate-500' },
  DISPUTED: { label: 'Disputed', bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-300',   dot: 'bg-orange-500', solidBg: 'bg-orange-500' },
};

// ── KPI Card colors (glassmorphism border-highlighted) ─────────────────────────
export interface DccKpiConfig {
  key: string;
  label: string;
  icon: string; // lucide icon name reference
  color: string;
  bg: string;
  border: string;
  gradient: string;
  accent: string;
  bar: string;
  ring: string;
}

export const DCC_KPIS: DccKpiConfig[] = [
  { key: 'ALL',     label: 'Total Demands',   icon: 'Receipt',       color: 'text-slate-700',    bg: 'bg-slate-50',     border: 'border-slate-300',    gradient: 'from-slate-700 to-slate-900',      accent: 'bg-slate-600',    bar: 'bg-slate-400',    ring: 'ring-slate-400' },
  { key: 'PAID',    label: 'Total Paid',      icon: 'CheckCircle2',  color: 'text-emerald-700',  bg: 'bg-emerald-50',   border: 'border-emerald-300',  gradient: 'from-emerald-600 to-emerald-700',  accent: 'bg-emerald-600', bar: 'bg-emerald-400', ring: 'ring-emerald-400' },
  { key: 'DUE',     label: 'Total Due',       icon: 'Clock',         color: 'text-amber-700',    bg: 'bg-amber-50',     border: 'border-amber-300',    gradient: 'from-amber-500 to-amber-600',      accent: 'bg-amber-500',   bar: 'bg-amber-400',   ring: 'ring-amber-400' },
  { key: 'OVERDUE', label: 'Total Overdue',   icon: 'AlertTriangle', color: 'text-red-700',      bg: 'bg-red-50',       border: 'border-red-300',      gradient: 'from-red-500 to-red-600',          accent: 'bg-red-500',     bar: 'bg-red-400',     ring: 'ring-red-400' },
  { key: 'RATE',    label: 'Collection Rate', icon: 'TrendingUp',    color: 'text-teal-700',     bg: 'bg-teal-50',      border: 'border-teal-300',     gradient: 'from-teal-600 to-teal-700',       accent: 'bg-teal-600',    bar: 'bg-teal-400',    ring: 'ring-teal-400' },
];

// ── Shared class strings ────────────────────────────────────────────────────────
export const DCC_INPUT_CLS =
  'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white text-slate-700 transition-colors';

export const DCC_LABEL_CLS =
  'block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

export const DCC_CARD_CLS =
  'bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md';

export const DCC_TABLE_TH_CLS =
  'px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wide border-b border-slate-200 bg-slate-50';

export const DCC_TABLE_TD_CLS =
  'px-3 py-2 text-xs text-slate-700 border-b border-slate-100';

// ── Demand type colors for sub-DP ribbon ───────────────────────────────────────
export const DEMAND_TYPE_COLORS: Record<string, string> = {
  RENT: 'bg-emerald-500',
  SD: 'bg-slate-600',
  ADVANCE: 'bg-amber-500',
  LOAN: 'bg-blue-500',
  PROPERTY_TAX: 'bg-teal-500',
  INSURANCE: 'bg-indigo-500',
  MAINTENANCE: 'bg-orange-500',
};

export const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const fmtINRShort = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

export const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateShort = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
