import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MapPin, AlertTriangle,
  CheckCircle2, Receipt, TrendingUp, Clock,
  SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Wallet, Eye, Users, Plus, FileText,
  LayoutGrid, List, Table2, Calendar,
  MessageSquare, Send, X, Loader2,
  CalendarDays, Landmark, Gauge, CircleUser as UserCircle,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';
import { useAuthStore } from '../stores/authStore';
import type {
  DccTile, DccTrackerSummary,
  DccDemandType, DccObjectOwner, DccObject, DccDemandChat,
} from '../types/dcc';
import {
  DCCFilterModal,
  emptyFilterState,
  filterStateToFilters,
  countActiveFilters,
  type DCCFilterState,
} from '../components/dcc/DCCFilterModal';
import { DCCReconciliationTab } from '../components/dcc/DCCReconciliationTab';
import { DCCReportsTab } from '../components/dcc/DCCReportsTab';
import { ClientWiseView } from '../components/dcc/ClientWiseView';
import { DemandListRecord } from '../components/dcc/DemandListRecord';
import { useViewPreference } from '../hooks/useViewPreference';
import { DataTable, type Column } from '../components/ui/DataTable';
import type { ViewMode } from '../components/ui/ViewSwitcher';
import SplitLayout from '../components/ui/SplitLayout';
import { DCCDemandDetailModal } from './DCCDemandDetailPage';
import { ChatDeliveryModePicker } from '../components/ui/ChatDeliveryModePicker';
import type { ChatDeliveryMode } from '../types/quarters';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDate, fmtDateShort,
} from '../constants/dccTheme';

type DeliveryModes = ChatDeliveryMode[];

type StatusKey = DccTile['status'];
type DpKey = 'ALL' | 'PAID' | 'DUE' | 'OVERDUE';

// ── KPI config ─────────────────────────────────────────────────────────────────
const KPI_CONFIG: { key: DpKey; label: string; icon: typeof Receipt; accent: string; iconBg: string; iconText: string; valueColor: string }[] = [
  { key: 'ALL',     label: 'Total Demands',   icon: Receipt,       accent: 'border-l-slate-600',   iconBg: 'bg-slate-200/60',   iconText: 'text-slate-700',   valueColor: 'text-slate-900' },
  { key: 'PAID',    label: 'Total Paid',       icon: CheckCircle2,  accent: 'border-l-blue-600',    iconBg: 'bg-blue-100/70',    iconText: 'text-blue-600',   valueColor: 'text-blue-600' },
  { key: 'DUE',     label: 'Total Due',        icon: Clock,         accent: 'border-l-emerald-600', iconBg: 'bg-emerald-100/70', iconText: 'text-emerald-600', valueColor: 'text-emerald-600' },
  { key: 'OVERDUE', label: 'Total Overdue',    icon: AlertTriangle, accent: 'border-l-amber-500',   iconBg: 'bg-amber-100/70',    iconText: 'text-amber-600',   valueColor: 'text-amber-600' },
];

// ── Icon-only View Mode Toggle ──────────────────────────────────────────────────
const IconViewToggle: React.FC<{
  currentView: ViewMode;
  onViewChange: (v: ViewMode) => void;
}> = ({ currentView, onViewChange }) => {
  const views: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'client', icon: Users, label: 'Client-Wise' },
    { mode: 'card', icon: LayoutGrid, label: 'Cards' },
    { mode: 'list', icon: List, label: 'List' },
    { mode: 'table', icon: Table2, label: 'Table' },
  ];
  return (
    <div className="inline-flex items-center bg-white rounded-md border border-slate-300 p-0.5">
      {views.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          title={label}
          className={`p-1.5 rounded transition-all ${
            currentView === mode
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
};

// ── High-Density Demand Tile (card view) ───────────────────────────────────────
const DemandTile: React.FC<{
  tile: DccTile;
  onPay: (tile: DccTile) => void;
  onViewDetails: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
  isChatActive: boolean;
}> = ({ tile, onPay, onViewDetails, onChat, onShowDuePayment, isChatActive }) => {
  const [expanded, setExpanded] = useState(false);
  const st = DCC_STATUS[tile.status];
  const { user } = useAuthStore();
  const canRecordPayment = user?.role === 'manager' || user?.role === 'admin';
  const canPay = (tile.status === 'DUE' || tile.status === 'OVERDUE') && canRecordPayment;
  const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Status strip */}
      <div className={`h-0.5 ${st.dot} shrink-0`} />

      {/* Header: Status badge + Demand type tag + Object ID + Total due */}
      <div className="px-3 pt-2 pb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
              {st.label}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
              {tile.demand_type_label}
            </span>
          </div>
          <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">{tile.object_description || tile.object_ref}</h3>
          <p className="text-[10px] text-slate-500 truncate">{tile.object_ref} · {tile.object_type}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-extrabold text-slate-900 leading-tight">{fmtINR(tile.amount_due)}</div>
          <div className="text-[9px] text-slate-400">of {fmtINRShort(tile.total_amount)}</div>
        </div>
      </div>

      {/* Owner & demand info */}
      <div className="px-3 pb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-600">
        <span className="flex items-center gap-0.5 min-w-0">
          <Users size={10} className="text-slate-400 shrink-0" />
          <span className="truncate font-medium">{tile.owner_name}</span>
        </span>
        <span className="flex items-center gap-0.5 shrink-0">
          <Calendar size={10} className="text-slate-400" />
          <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : ''}>Due {fmtDateShort(tile.due_date)}</span>
        </span>
        {tile.overdue_amount > 0 && (
          <span className="flex items-center gap-0.5 shrink-0 text-red-600 font-semibold">
            <AlertTriangle size={10} /> {fmtINRShort(tile.overdue_amount)}
          </span>
        )}
        {tile.amount_paid > 0 && (
          <span className="flex items-center gap-0.5 shrink-0 text-emerald-600">
            <CheckCircle2 size={10} /> {fmtINRShort(tile.amount_paid)} pd
          </span>
        )}
      </div>

      {/* Collapsible detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 text-[10px] text-slate-600 space-y-1 border-t border-slate-100 pt-1.5 bg-slate-50/40">
              <div className="flex items-center gap-1"><Phone size={10} className="text-slate-400" />{tile.owner_contact || '—'}</div>
              <div className="flex items-start gap-1"><MapPin size={10} className="text-slate-400 mt-0.5" />{tile.owner_address || '—'}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span><span className="text-slate-400">Run:</span> {fmtDateShort(tile.demand_run_date)}</span>
                {tile.region && <span><span className="text-slate-400">Region:</span> {tile.region}</span>}
                {tile.group_name && <span><span className="text-slate-400">Grp:</span> {tile.group_name}</span>}
                {tile.subgroup && <span><span className="text-slate-400">Sub:</span> {tile.subgroup}</span>}
              </div>
              {tile.avg_overdue_days > 0 && <div><span className="text-slate-400">Avg OD:</span> {tile.avg_overdue_days}d</div>}
              {tile.last_paid_date && <div><span className="text-slate-400">Last pd:</span> {fmtINRShort(tile.last_paid_amount ?? 0)} on {fmtDateShort(tile.last_paid_date)}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tile Action Bar — explicit buttons, no 3-dot menu */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-slate-200 bg-slate-50/50">
        <button
          onClick={() => onViewDetails(tile)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          <Eye size={11} /> View Details
        </button>
        {canPay && (
          <button
            onClick={() => onPay(tile)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Wallet size={11} /> Pay Now
          </button>
        )}
        {canShowDue && !canPay && (
          <button
            onClick={() => onShowDuePayment(tile)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <CalendarDays size={11} /> Due Pmt
          </button>
        )}
        <button
          onClick={() => onChat(tile)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
            isChatActive
              ? 'text-white bg-slate-800'
              : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={11} /> Chat
        </button>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:bg-slate-100 transition-colors ml-auto"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
    </motion.div>
  );
};

// ── Compact 2-Row List Card ────────────────────────────────────────────────────
const DemandListCard: React.FC<{
  tile: DccTile;
  onPay: (tile: DccTile) => void;
  onViewDetails: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
  isChatActive: boolean;
}> = ({ tile, onPay, onViewDetails, onChat, onShowDuePayment, isChatActive }) => {
  const [expanded, setExpanded] = useState(false);
  const st = DCC_STATUS[tile.status];
  const { user } = useAuthStore();
  const canRecordPayment = user?.role === 'manager' || user?.role === 'admin';
  const canPay = (tile.status === 'DUE' || tile.status === 'OVERDUE') && canRecordPayment;
  const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative flex flex-col"
    >
      <div className={`h-0.5 ${st.dot} shrink-0`} />

      {/* Row 1: Title + badges + amount */}
      <div className="px-3 pt-2 pb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
              {st.label}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
              {tile.demand_type_label}
            </span>
          </div>
          <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">{tile.object_description || tile.object_ref}</h3>
          <p className="text-[10px] text-slate-500 truncate">{tile.object_ref} · {tile.object_type}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-extrabold text-slate-900 leading-tight">{fmtINR(tile.amount_due)}</div>
          <div className="text-[9px] text-slate-400">of {fmtINRShort(tile.total_amount)}</div>
        </div>
      </div>

      {/* Row 2: Owner + key dates + action buttons */}
      <div className="px-3 pb-1.5 flex items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-600">
        <span className="flex items-center gap-0.5 min-w-0">
          <Users size={10} className="text-slate-400 shrink-0" />
          <span className="truncate font-medium">{tile.owner_name}</span>
        </span>
        <span className="flex items-center gap-0.5 shrink-0">
          <Calendar size={10} className="text-slate-400" />
          <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : ''}>Due {fmtDateShort(tile.due_date)}</span>
        </span>
        {tile.overdue_amount > 0 && (
          <span className="flex items-center gap-0.5 shrink-0 text-red-600 font-semibold">
            <AlertTriangle size={10} /> {fmtINRShort(tile.overdue_amount)}
          </span>
        )}
        {tile.amount_paid > 0 && (
          <span className="flex items-center gap-0.5 shrink-0 text-emerald-600">
            <CheckCircle2 size={10} /> {fmtINRShort(tile.amount_paid)} pd
          </span>
        )}

        {/* Explicit action buttons */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <Eye size={10} /> Details
          </button>
          {canPay && (
            <button
              onClick={(e) => { e.stopPropagation(); onPay(tile); }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <Wallet size={10} /> Pay
            </button>
          )}
          {canShowDue && !canPay && (
            <button
              onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <CalendarDays size={10} /> Due
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onChat(tile); }}
            className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
              isChatActive ? 'bg-slate-800 text-white' : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-100'
            }`}
            title="Open Chat"
          >
            <MessageSquare size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            className="flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:bg-slate-100 transition-colors"
            title={expanded ? 'Show Less' : 'Show More'}
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 text-[10px] text-slate-600 space-y-1 border-t border-slate-100 pt-1.5 bg-slate-50/40">
              <div className="flex items-center gap-1"><Phone size={10} className="text-slate-400" />{tile.owner_contact || '—'}</div>
              <div className="flex items-start gap-1"><MapPin size={10} className="text-slate-400 mt-0.5" />{tile.owner_address || '—'}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span><span className="text-slate-400">Run:</span> {fmtDateShort(tile.demand_run_date)}</span>
                {tile.region && <span><span className="text-slate-400">Region:</span> {tile.region}</span>}
                {tile.group_name && <span><span className="text-slate-400">Grp:</span> {tile.group_name}</span>}
                {tile.subgroup && <span><span className="text-slate-400">Sub:</span> {tile.subgroup}</span>}
              </div>
              {tile.avg_overdue_days > 0 && <div><span className="text-slate-400">Avg OD:</span> {tile.avg_overdue_days}d</div>}
              {tile.last_paid_date && <div><span className="text-slate-400">Last pd:</span> {fmtINRShort(tile.last_paid_amount ?? 0)} on {fmtDateShort(tile.last_paid_date)}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── DCC Chat Panel ─────────────────────────────────────────────────────────────
const DccChatPanel: React.FC<{
  tile: DccTile;
  messages: DccDemandChat[];
  chatMsg: string;
  isSending: boolean;
  deliveryModes: DeliveryModes;
  onDeliveryModesChange: (m: DeliveryModes) => void;
  onChange: (v: string) => void;
  onSend: () => void;
}> = ({ tile, messages, chatMsg, isSending, deliveryModes, onDeliveryModesChange, onChange, onSend }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const st = DCC_STATUS[tile.status];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [tile.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatMsg.trim() && !isSending) onSend();
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${st.bg} border ${st.border}`}>
            <Receipt size={13} className={st.text} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[200px]">
              {tile.object_description || tile.object_ref}
            </p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{st.label}</span>
              <span className="text-[9px] font-semibold text-slate-500 truncate">{tile.owner_name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              <MessageSquare size={18} className="text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No messages yet</p>
            <p className="text-[10px] text-slate-300 text-center max-w-[200px]">Start a conversation about this demand</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine = msg.sender_role === 'manager';
              const prevMsg = messages[i - 1];
              const showDateSep = i === 0 || formatDate(msg.created_at) !== formatDate(prevMsg.created_at);
              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-2 my-1">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{formatDate(msg.created_at)}</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[82%] space-y-0.5">
                      {!isMine && <p className="text-[9px] font-semibold text-slate-400 px-1">Owner</p>}
                      <div className={`text-[11px] px-2.5 py-1.5 rounded-xl leading-relaxed ${
                        isMine
                          ? 'bg-slate-800 text-white rounded-br-sm'
                          : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'
                      }`}>
                        {msg.message}
                      </div>
                      <p className={`text-[9px] px-1 ${isMine ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                        {formatTime(msg.created_at)}
                        {msg.delivery_mode && <span className="ml-1.5 text-slate-300">· {msg.delivery_mode}</span>}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={endRef} />
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2">
        <div className="mb-1.5">
          <ChatDeliveryModePicker value={deliveryModes} onChange={onDeliveryModesChange} />
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={2}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            value={chatMsg}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 bg-slate-50 transition-colors placeholder-slate-400"
          />
          <button
            onClick={onSend}
            disabled={isSending || !chatMsg.trim()}
            className="flex items-center justify-center w-8 h-8 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0 mb-0.5"
            title="Send"
          >
            {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Table View ──────────────────────────────────────────────────────────────────
const DemandTable: React.FC<{
  tiles: DccTile[];
  onRowClick: (tile: DccTile) => void;
  onPay: (tile: DccTile) => void;
  onShowDuePayment: (tile: DccTile) => void;
}> = ({ tiles, onRowClick, onPay, onShowDuePayment }) => {
  const { user } = useAuthStore();
  const canRecordPayment = user?.role === 'manager' || user?.role === 'admin';
  const columns: Column<DccTile>[] = [
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '80px',
      render: (t) => {
        const st = DCC_STATUS[t.status];
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
            {st.label}
          </span>
        );
      },
    },
    {
      key: 'object_description',
      label: 'Object',
      sortable: true,
      render: (t) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate text-xs">{t.object_description || t.object_ref}</div>
          <div className="text-[10px] text-slate-400 truncate">{t.object_ref} · {t.object_type}</div>
        </div>
      ),
    },
    {
      key: 'owner_name',
      label: 'Owner',
      sortable: true,
      render: (t) => (
        <div className="min-w-0">
          <div className="font-medium text-slate-700 truncate text-xs">{t.owner_name}</div>
          <div className="text-[10px] text-slate-400 truncate">{t.owner_contact || '—'}</div>
        </div>
      ),
    },
    {
      key: 'demand_type_label',
      label: 'Type',
      sortable: true,
      render: (t) => (
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t.demand_type_label}</span>
      ),
    },
    {
      key: 'demand_run_date',
      label: 'Run Date',
      sortable: true,
      render: (t) => <span className="text-[10px] text-slate-600">{fmtDateShort(t.demand_run_date)}</span>,
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (t) => (
        <span className={`text-[10px] font-medium ${t.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-600'}`}>
          {fmtDateShort(t.due_date)}
        </span>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      render: (t) => <span className="text-[10px] font-semibold text-slate-700">{fmtINR(t.total_amount)}</span>,
    },
    {
      key: 'amount_paid',
      label: 'Paid',
      sortable: true,
      render: (t) => <span className="text-[10px] font-semibold text-emerald-600">{fmtINR(t.amount_paid)}</span>,
    },
    {
      key: 'amount_due',
      label: 'Due Amt',
      sortable: true,
      render: (t) => <span className="text-xs font-bold text-slate-900">{fmtINR(t.amount_due)}</span>,
    },
    {
      key: 'overdue_amount',
      label: 'Overdue',
      sortable: true,
      render: (t) => (
        <span className={`text-[10px] font-semibold ${t.overdue_amount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
          {t.overdue_amount > 0 ? fmtINR(t.overdue_amount) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onRowClick(t); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Eye size={11} />
          </button>
          {(t.status === 'DUE' || t.status === 'OVERDUE') && canRecordPayment && (
            <button
              onClick={(e) => { e.stopPropagation(); onPay(t); }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <Wallet size={11} />
            </button>
          )}
          {(t.status === 'DUE' || t.status === 'OVERDUE') && (
            <button
              onClick={(e) => { e.stopPropagation(); onShowDuePayment(t); }}
              title="Show Due Payment"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <CalendarDays size={11} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tiles}
      keyExtractor={(t) => t.id}
      onRowClick={onRowClick}
      emptyMessage="No demands found"
    />
  );
};

// ── Sub-DP Drilldown Ribbon ─────────────────────────────────────────────────────
const SUB_DP_ACCENTS = ['border-l-amber-500', 'border-l-rose-500', 'border-l-rose-700', 'border-l-blue-500', 'border-l-emerald-500', 'border-l-slate-600', 'border-l-amber-600'];
const SUB_DP_DOTS   = ['bg-amber-500', 'bg-rose-500', 'bg-rose-700', 'bg-blue-500', 'bg-emerald-500', 'bg-slate-600', 'bg-amber-600'];

const SubDpRibbon: React.FC<{
  breakdown: Record<string, { count: number; amount: number }>;
  dpAmt: number;
  subDpFilter: string | null;
  setSubDpFilter: (v: string | null) => void;
}> = ({ breakdown, dpAmt, subDpFilter, setSubDpFilter }) => {
  const entries = Object.entries(breakdown);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, y: -5 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -5 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden shrink-0"
      >
        <div className="px-4 my-2">
          <div className="flex items-center gap-2 w-full relative">
            <button
              onClick={() => scrollBy(-1)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm rounded-full p-1.5 z-10 flex-shrink-0 cursor-pointer transition-colors"
              title="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
            <div
              ref={scrollRef}
              className="flex items-center gap-2.5 overflow-x-auto scrollbar-none scroll-smooth py-1 px-1 w-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {entries.map(([type, data], idx) => {
                const isSelected = subDpFilter === type;
                const accent = SUB_DP_ACCENTS[idx % SUB_DP_ACCENTS.length];
                const dot = SUB_DP_DOTS[idx % SUB_DP_DOTS.length];
                return (
                  <motion.button
                    key={type}
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    onClick={() => setSubDpFilter(isSelected ? null : type)}
                    className={`relative flex flex-col px-3 py-2 rounded-lg border-l-[4px] ${accent} overflow-hidden shrink-0 cursor-pointer min-w-[150px] transition-all ${
                      isSelected
                        ? 'border-2 border-teal-500 ring-2 ring-teal-500/20 bg-white shadow-md'
                        : 'bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeSubDpHighlight"
                        className="absolute inset-0 rounded-lg ring-2 ring-teal-500/20 pointer-events-none"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider truncate">{type}</span>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
                      <span className="text-xs font-black text-slate-900 tabular-nums leading-tight">{data.count}</span>
                      <span className="text-xs font-bold text-slate-600 tabular-nums ml-1 truncate">{fmtINRShort(data.amount)}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <button
              onClick={() => scrollBy(1)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm rounded-full p-1.5 z-10 flex-shrink-0 cursor-pointer transition-colors"
              title="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
type DccMainTab = 'dashboard' | 'reconciliation' | 'reports';

export const DCCPage: React.FC = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<DccMainTab>('dashboard');
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [summary, setSummary] = useState<DccTrackerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dpFilter, setDpFilter] = useState<DpKey>('ALL');
  const [subDpFilter, setSubDpFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('dccView', 'client');
  const [filterState, setFilterState] = useState<DCCFilterState>(emptyFilterState);

  // Chat state
  const [chatTileId, setChatTileId] = useState<string | null>(null);
  const [detailDemandId, setDetailDemandId] = useState<string | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<'demand_due' | 'installments' | 'paid_history' | 'dispute' | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<DccDemandChat[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatDeliveryModes, setChatDeliveryModes] = useState<DeliveryModes>(['IN_APP']);

  const filters = useMemo(() => filterStateToFilters(filterState), [filterState]);
  const [demandTypes, setDemandTypes] = useState<DccDemandType[]>([]);
  const [owners, setOwners] = useState<DccObjectOwner[]>([]);
  const [objects, setObjects] = useState<DccObject[]>([]);

  const { user } = useAuthStore();
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const canRecordPayment = isManager;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s, dt, ow, obj] = await Promise.all([
        dccService.getTiles(filters),
        dccService.getTrackerSummary(filters),
        dccService.listDemandTypes(),
        dccService.listObjectOwners(),
        dccService.listObjects(),
      ]);
      setTiles(t);
      setSummary(s);
      setDemandTypes(dt);
      setOwners(ow);
      setObjects(obj);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Sub-DP breakdown by demand type
  const subDpBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    const dpTiles = tiles.filter(t =>
      dpFilter === 'ALL' ? true :
      dpFilter === 'PAID' ? t.status === 'PAID' :
      dpFilter === 'DUE' ? t.status === 'DUE' :
      t.status === 'OVERDUE'
    );
    for (const t of dpTiles) {
      const key = t.demand_type_label || t.demand_type_code;
      if (!map[key]) map[key] = { count: 0, amount: 0 };
      map[key].count++;
      if (dpFilter === 'PAID') map[key].amount += t.amount_paid;
      else if (dpFilter === 'DUE') map[key].amount += t.status === 'DUE' ? t.amount_due : 0;
      else if (dpFilter === 'OVERDUE') map[key].amount += t.overdue_amount;
      else map[key].amount += t.total_amount;
    }
    return map;
  }, [tiles, dpFilter]);

  const filteredTiles = useMemo(() => {
    let result = tiles;
    if (dpFilter === 'PAID') result = result.filter(t => t.status === 'PAID');
    else if (dpFilter === 'DUE') result = result.filter(t => t.status === 'DUE');
    else if (dpFilter === 'OVERDUE') result = result.filter(t => t.status === 'OVERDUE');

    if (subDpFilter) {
      result = result.filter(t => (t.demand_type_label || t.demand_type_code) === subDpFilter);
    }

    if (filterState.objectTypes.length > 0) {
      result = result.filter(t => filterState.objectTypes.includes(t.object_type));
    }
    if (filterState.ownerIds.length > 0) {
      result = result.filter(t => filterState.ownerIds.includes(t.owner_id));
    }
    if (filterState.statuses.length > 0) {
      result = result.filter(t => filterState.statuses.includes(t.status));
    }
    if (filterState.regions.length > 0) {
      result = result.filter(t => filterState.regions.includes(t.region || 'Unspecified'));
    }
    if (filterState.demandTypeCodes.length > 0) {
      result = result.filter(t => filterState.demandTypeCodes.includes(t.demand_type_code));
    }

    const statusRank: Record<string, number> = { OVERDUE: 0, DUE: 1, DISPUTED: 2, EXEMPTED: 3, PAID: 4 };
    result = [...result].sort((a, b) => {
      const ra = statusRank[a.status] ?? 5;
      const rb = statusRank[b.status] ?? 5;
      if (ra !== rb) return ra - rb;
      return (b.overdue_amount || 0) - (a.overdue_amount || 0);
    });

    return result;
  }, [tiles, dpFilter, subDpFilter, filterState]);

  const handlePay = (tile: DccTile) => {
    setDetailDemandId(tile.id);
    setDetailInitialTab(undefined);
  };

  const handleViewDetails = (tile: DccTile) => {
    setDetailDemandId(tile.id);
    setDetailInitialTab(undefined);
  };

  const handleShowDuePayment = (tile: DccTile) => {
    setDetailDemandId(tile.id);
    setDetailInitialTab('demand_due');
  };

  // ── Chat handlers ────────────────────────────────────────────────────────────
  const chatTile = useMemo(() => tiles.find(t => t.id === chatTileId) ?? null, [tiles, chatTileId]);

  const handleOpenChat = useCallback((tile: DccTile) => {
    setChatTileId(tile.id);
    setChatMsg('');
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatTileId(null);
    setChatMessages([]);
    setChatMsg('');
  }, []);

  useEffect(() => {
    if (!chatTileId) { setChatMessages([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const msgs = await dccService.listChatMessages(chatTileId);
        if (!cancelled) setChatMessages(msgs);
      } catch { if (!cancelled) setChatMessages([]); }
    })();
    return () => { cancelled = true; };
  }, [chatTileId]);

  const handleSendChat = useCallback(async () => {
    if (!chatTileId || !chatMsg.trim()) return;
    setChatSending(true);
    try {
      const newMsg = await dccService.sendChatMessage(
        chatTileId, 'manager', chatMsg.trim(),
        chatDeliveryModes.length > 0 ? chatDeliveryModes.join(',') : null,
      );
      setChatMessages(prev => [...prev, newMsg]);
      setChatMsg('');
    } catch { /* ignore */ } finally {
      setChatSending(false);
    }
  }, [chatTileId, chatMsg, chatDeliveryModes]);

  const mainTabs: { key: DccMainTab; label: string; icon: typeof Receipt }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: Receipt },
    ...(isManager ? [
      { key: 'reconciliation' as DccMainTab, label: 'Reconciliation', icon: TrendingUp },
      { key: 'reports' as DccMainTab, label: 'Reports / MIS', icon: FileText },
    ] : []),
  ];

  // Collection rate calculation
  const totalAmount = tiles.reduce((s, t) => s + t.total_amount, 0);
  const collectionRate = totalAmount > 0 ? Math.round(((summary?.total_paid ?? 0) / totalAmount) * 100) : 0;

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-slate-50">
      {/* Page header — Deep Slate Navy */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Landmark size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white">Demand & Collection Center</h1>
          <p className="text-[10px] text-slate-400">Enterprise demand tracking and collection management</p>
        </div>

        {/* User context */}
        {user && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-700/40 shrink-0">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-[11px] font-semibold text-white whitespace-nowrap">{user.fullName || user.email}</div>
              <div className="text-[9px] text-emerald-300 font-medium whitespace-nowrap">{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
        )}
        {/* Tab bar — icon-only with hover tooltips */}
        <div className="flex items-center gap-1">
          {mainTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setMainTab(t.key)}
                title={t.label}
                className={`group relative flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                  mainTab === t.key
                    ? 'text-emerald-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        {mainTab === 'dashboard' && isManager && (
          <>
            <button
              onClick={() => navigate(ROUTES.DCC_RULE_SETUP)}
              title="Rule Setup"
              className="group relative flex items-center justify-center w-8 h-8 rounded-md text-slate-300 hover:text-white transition-colors"
            >
              <Gauge size={16} />
              <span className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Rule Setup
              </span>
            </button>
            <button
              onClick={() => navigate(ROUTES.DCC_GENERATE)}
              title="Generate Demand"
              className="group relative flex items-center justify-center w-8 h-8 rounded-md text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus size={16} />
              <span className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Generate Demand
              </span>
            </button>
          </>
        )}
      </div>

      {/* Reconciliation Tab */}
      {mainTab === 'reconciliation' && <DCCReconciliationTab />}

      {/* Reports Tab */}
      {mainTab === 'reports' && <DCCReportsTab />}

      {/* Dashboard Tab */}
      {mainTab === 'dashboard' && (() => {
        const dashboardContent = (
      <div className="h-full flex flex-col bg-slate-50">
      {/* KPI Cards — single row, 2-line cards */}
      <div className="px-4 pt-2 grid grid-cols-5 gap-3 mb-2 shrink-0">
        {KPI_CONFIG.map(dp => {
          const Icon = dp.icon;
          const value =
            dp.key === 'ALL' ? tiles.length :
            dp.key === 'PAID' ? summary?.paid_count ?? 0 :
            dp.key === 'DUE' ? summary?.due_count ?? 0 :
            summary?.overdue_count ?? 0;
          const amount =
            dp.key === 'ALL' ? totalAmount :
            dp.key === 'PAID' ? summary?.total_paid ?? 0 :
            dp.key === 'DUE' ? summary?.total_due ?? 0 :
            summary?.total_overdue ?? 0;
          const isSelected = dpFilter === dp.key;
          const totalForRate = (summary?.total_paid ?? 0) + (summary?.total_due ?? 0) + (summary?.total_overdue ?? 0);
          const ratePct = totalForRate > 0
            ? Math.round(((dp.key === 'ALL' || dp.key === 'PAID' ? summary?.total_paid ?? 0 : amount) / totalForRate) * 100)
            : 0;
          const displayRate = dp.key === 'OVERDUE' ? 100 - ratePct : ratePct;
          return (
            <motion.button
              key={dp.key}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => { setDpFilter(prev => prev === dp.key ? 'ALL' : dp.key); setSubDpFilter(null); }}
              className={`relative text-left rounded-lg border-l-[5px] ${dp.accent} bg-slate-50/70 border border-slate-200/80 px-2.5 py-1.5 overflow-hidden ${
                isSelected ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/10 shadow-sm' : 'hover:shadow-md hover:bg-white'
              }`}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 text-teal-500"><ChevronDown size={10} /></span>
              )}
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${dp.iconBg} ${dp.iconText} shrink-0`}>
                  <Icon size={11} />
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">{dp.label}</span>
              </div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-slate-900 tabular-nums leading-tight">{value}</span>
                <span className="text-sm font-bold text-slate-700 tabular-nums ml-1.5 truncate">{fmtINRShort(amount)}</span>
                <span className="text-[10px] font-semibold text-slate-500 shrink-0 ml-auto">{displayRate}%</span>
              </div>
            </motion.button>
          );
        })}

        {/* Collection Rate KPI */}
        <div className="relative text-left rounded-lg border-l-[5px] border-l-rose-600 bg-slate-50/70 border border-slate-200/80 px-2.5 py-1.5 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-rose-100/70 text-rose-600 shrink-0">
              <TrendingUp size={11} />
            </div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">Collection Rate</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums leading-tight">{collectionRate}%</span>
            <span className="text-sm font-bold text-slate-700 tabular-nums ml-1.5 truncate">of {fmtINRShort(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Sub-DP Drilldown Ribbon */}
      {dpFilter !== 'ALL' && Object.keys(subDpBreakdown).length > 0 && (() => {
        const dpAmt =
          dpFilter === 'PAID' ? summary?.total_paid ?? 0 :
          dpFilter === 'DUE' ? summary?.total_due ?? 0 :
          summary?.total_overdue ?? 0;
        return (
          <SubDpRibbon
            breakdown={subDpBreakdown}
            dpAmt={dpAmt}
            subDpFilter={subDpFilter}
            setSubDpFilter={setSubDpFilter}
          />
        );
      })()}

      {/* Compact toolbar */}
      <div className="px-4 py-1 shrink-0 flex items-center justify-between gap-2 border-b border-slate-200 bg-white mt-0">
        {/* Breadcrumb / context info — left side */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {(() => {
            const viewLabel =
              viewMode === 'client' ? 'Client-Wise' :
              viewMode === 'card' ? 'Cards' :
              viewMode === 'table' ? 'Table' : 'List';
            const dpLabel =
              dpFilter === 'PAID' ? 'Total Paid' :
              dpFilter === 'DUE' ? 'Total Due' :
              dpFilter === 'OVERDUE' ? 'Total Overdue' : 'All Records';
            const hasAdvFilters = countActiveFilters(filterState) > 0 || subDpFilter !== null;
            const contextLabel = hasAdvFilters ? 'Filtered Data' : dpLabel;
            const visibleCount = filteredTiles.length;
            const totalCount = tiles.length;
            const countText = hasAdvFilters
              ? `${visibleCount} of ${totalCount}`
              : `${visibleCount}`;
            const clientCount = viewMode === 'client'
              ? new Set(filteredTiles.map(t => t.owner_id)).size
              : 0;
            const handleClear = () => {
              setFilterState(emptyFilterState);
              setDpFilter('ALL');
              setSubDpFilter(null);
            };
            return (
              <>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  {viewLabel}
                </span>
                <ChevronRight size={11} className="text-slate-300 shrink-0" />
                <span className="text-[11px] font-bold text-blue-700 whitespace-nowrap">
                  {contextLabel}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                  · {countText}
                </span>
                {clientCount > 0 && (
                  <span className="text-[10px] font-semibold text-blue-600 whitespace-nowrap">
                    · {clientCount} {clientCount === 1 ? 'Client' : 'Clients'}
                  </span>
                )}
                {hasAdvFilters && (
                  <button
                    onClick={handleClear}
                    title="Clear all filters"
                    className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-colors whitespace-nowrap"
                  >
                    <X size={9} /> Clear
                  </button>
                )}
                {subDpFilter && (
                  <>
                    <ChevronRight size={11} className="text-slate-300 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-600 truncate">
                      {subDpFilter}
                    </span>
                  </>
                )}
              </>
            );
          })()}
        </div>

        {/* View + filter controls — right side */}
        <div className="flex items-center gap-2 shrink-0">
          <IconViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <button
            onClick={() => setShowFilters(true)}
            title="Filters"
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-xs font-semibold"
          >
            <SlidersHorizontal size={13} /> Filters
            {countActiveFilters(filterState) > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </button>
        </div>
      </div>

      {/* Tiles grid / table / list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle size={28} className="mb-2" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : filteredTiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
            <div className="text-sm font-medium text-slate-600">No demands found</div>
            <div className="text-xs mt-1">Try adjusting your filters or search.</div>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filteredTiles.map(tile => (
              <DemandTile
                key={tile.id}
                tile={tile}
                onPay={handlePay}
                onViewDetails={handleViewDetails}
                onChat={handleOpenChat}
                onShowDuePayment={handleShowDuePayment}
                isChatActive={chatTileId === tile.id}
              />
            ))}
          </div>
        ) : viewMode === 'table' ? (
          <DemandTable
            tiles={filteredTiles}
            onRowClick={handleViewDetails}
            onPay={handlePay}
            onShowDuePayment={handleShowDuePayment}
          />
        ) : viewMode === 'client' ? (
          <ClientWiseView
            tiles={filteredTiles}
            onPay={handlePay}
            onViewDetails={handleViewDetails}
            onChat={handleOpenChat}
            onShowDuePayment={handleShowDuePayment}
            canRecordPayment={canRecordPayment}
            chatTileId={chatTileId}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredTiles.map((tile, idx) => (
              <DemandListRecord
                key={tile.id}
                tile={tile}
                idx={idx}
                onViewDetails={handleViewDetails}
                onPay={handlePay}
                onChat={handleOpenChat}
                onShowDuePayment={handleShowDuePayment}
                isChatActive={chatTileId === tile.id}
                canRecordPayment={canRecordPayment}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Conditions Modal */}
      <DCCFilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        tiles={tiles}
        demandTypes={demandTypes}
        owners={owners}
        state={filterState}
        onApply={(s) => setFilterState(s)}
      />
      </div>
    );
        return chatTile && chatTileId ? (
          <SplitLayout
            storageKey="dcc-chat-split"
            defaultSplit={62}
            onClose={handleCloseChat}
            right={
              <DccChatPanel
                tile={chatTile}
                messages={chatMessages}
                chatMsg={chatMsg}
                isSending={chatSending}
                deliveryModes={chatDeliveryModes}
                onDeliveryModesChange={setChatDeliveryModes}
                onChange={setChatMsg}
                onSend={handleSendChat}
              />
            }
            rightHeader={
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare size={13} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 truncate">
                  {chatTile.object_description || chatTile.object_ref}
                </span>
              </div>
            }
            left={dashboardContent}
          />
        ) : dashboardContent;
      })()}

      {/* Demand Detail Modal */}
      {detailDemandId && (
        <DCCDemandDetailModal
          demandId={detailDemandId}
          onClose={() => { setDetailDemandId(null); setDetailInitialTab(undefined); }}
          initialTab={detailInitialTab}
        />
      )}
    </div>
  );
};

export default DCCPage;
