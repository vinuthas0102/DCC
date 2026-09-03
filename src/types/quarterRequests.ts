import type React from 'react';
import type { Quarter, RequestType } from './quarters';

export type { RequestType };

export type DPFilter =
  | 'all'
  | 'draft'
  | 'submitted'
  | 'allotted'
  | 'allocated_em'
  | 'unapproved'
  | 'accepted'
  | 'occupied'
  | 'tenantServices'
  | 'availableQuarters'
  | 'declined';

export interface PrefItem {
  quarter: Quarter;
  rank: number;
}

export interface NewRequestForm {
  request_reason: string;
  preferred_location: string;
  move_in_date: string;
  employee_notes: string;
  request_type: RequestType;
}

export interface StatusCard {
  key: DPFilter;
  label: string;
  description: string;
  count: number;
  gradient: string;
  iconBg: string;
  textColor: string;
  countColor: string;
  icon: React.ReactNode;
}

export type ActionPopupType =
  | 'EXTEND'
  | 'VACATE'
  | 'GRIEVANCE'
  | 'MAINTENANCE'
  | 'INSPECTION'
  | 'HANDOVER'
  | 'EXCHANGE'
  | null;

export interface ActionPopupState {
  type: ActionPopupType;
  requestId: string;
  allotmentId: string;
}

export type RequestForType = 'SELF' | 'EMPLOYEE' | 'TP';

export interface DemoEmployee {
  id: string;
  name: string;
  dept: string;
  email: string;
  designation: string;
}

export interface TPInfo {
  name: string;
  organization: string;
  mobile: string;
  email: string;
  pan: string;
  notes: string;
}

export type EOMode = 'self' | 'employee' | null;

export type EORightMode =
  | 'detail'
  | 'allot'
  | 'override'
  | 'approval_chat'
  | 'request_approval_chat'
  | 'inspection'
  | 'inspection_chat'
  | 'handover'
  | 'chat';

export type RightAction = null | 'acknowledge' | 'reject' | 'extend' | 'vacate';
