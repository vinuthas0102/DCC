import React from 'react';
import {
  Clock, Send, CheckCircle, ThumbsUp, ThumbsDown, RefreshCw,
  ArrowRightCircle, LogOut, XCircle, PauseCircle, AlertCircle, Wrench,
} from 'lucide-react';

export function getQuarterRequestStatusConfig(status: string): { label: string; cls: string; icon: React.ReactNode } {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    DRAFT:              { label: 'Draft',           cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <Clock size={11} /> },
    SUBMITTED:         { label: 'Submitted',        cls: 'bg-blue-50 text-blue-700 border border-blue-200',       icon: <Send size={11} /> },
    ALLOTTED:          { label: 'Allotted',         cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={11} /> },
    ACKNOWLEDGED:      { label: 'Occupied',         cls: 'bg-teal-50 text-teal-700 border border-teal-200',       icon: <ThumbsUp size={11} /> },
    REJECTED:          { label: 'Rejected',         cls: 'bg-red-50 text-red-700 border border-red-200',          icon: <ThumbsDown size={11} /> },
    EXTEND_REQUESTED:  { label: 'Extension Req.',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
    UPGRADE_REQUESTED: { label: 'Upgrade Req.',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',          icon: <ArrowRightCircle size={11} /> },
    VACATE_REQUESTED:  { label: 'Vacate Req.',      cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <LogOut size={11} /> },
    VACATED:           { label: 'Vacated',          cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
    WITHDRAWN:         { label: 'Withdrawn',        cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
    ON_HOLD:           { label: 'On Hold',          cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: <PauseCircle size={11} /> },
  };
  return cfg[status] ?? cfg.DRAFT;
}

export function getQuarterTenantStatusConfig(status: string): { label: string; cls: string } {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border border-red-200' },
    WITHDRAWN: { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  };
  return cfg[status] ?? cfg.PENDING;
}

export function getQuarterServiceTypeConfig(type: string): { label: string; cls: string; icon: React.ReactNode } {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    EXTEND:      { label: 'Extension',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
    UPGRADE:     { label: 'Upgrade',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',           icon: <ArrowRightCircle size={11} /> },
    VACATE:      { label: 'Vacate',      cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <LogOut size={11} /> },
    GRIEVANCE:   { label: 'Grievance',   cls: 'bg-rose-50 text-rose-700 border border-rose-200',        icon: <AlertCircle size={11} /> },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-50 text-slate-700 border border-slate-200',     icon: <Wrench size={11} /> },
  };
  return cfg[type] ?? cfg.EXTEND;
}

export function getQuarterStatusAccentColor(status: string): string {
  if (status === 'DRAFT') return 'bg-amber-400';
  if (status === 'SUBMITTED') return 'bg-blue-500';
  if (status === 'ALLOTTED' || status === 'UPGRADE_REQUESTED') return 'bg-emerald-500';
  if (status === 'ACKNOWLEDGED') return 'bg-teal-500';
  if (status === 'EXTEND_REQUESTED' || status === 'VACATE_REQUESTED') return 'bg-orange-400';
  return 'bg-gray-300';
}

export function getCycleStatusBadgeClass(status: string): string {
  if (status === 'OPEN') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'CLOSED') return 'bg-gray-100 text-gray-600 border border-gray-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}
