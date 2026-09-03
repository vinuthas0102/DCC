// ── DCC (Demand and Collection Center) types ──────────────────────────────────

export type DccOwnerType = 'PERSON' | 'ORGANIZATION';

export interface DccObjectOwner {
  id: string;
  name: string;
  owner_type: DccOwnerType;
  contact_number: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DccObject {
  id: string;
  owner_id: string;
  object_type: string;
  object_ref: string;
  description: string;
  details: Record<string, unknown>;
  region: string | null;
  group_name: string | null;
  subgroup: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  owner?: DccObjectOwner;
}

export interface DccDemandType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export type DccDemandStatus = 'DUE' | 'OVERDUE' | 'PAID' | 'EXEMPTED';
export type DccGenerationSource = 'TPA' | 'EXCEL' | 'AUTO' | 'MANUAL';

export interface DccDemand {
  id: string;
  object_id: string;
  owner_id: string;
  demand_type_id: string;
  criteria_id: string | null;
  demand_run_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  status: DccDemandStatus;
  dispute_date: string | null;
  dispute_reason: string | null;
  dispute_remarks: string | null;
  generation_source: DccGenerationSource;
  created_at: string;
  updated_at: string;
  // Joined
  object?: DccObject;
  owner?: DccObjectOwner;
  demand_type?: DccDemandType;
}

export interface DccPayment {
  id: string;
  demand_id: string;
  object_id: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  reference_number: string | null;
  remarks: string | null;
  created_at: string;
}

export type DccInstallmentRowStatus = 'PAID' | 'DUE' | 'PENDING' | 'OVERDUE' | 'EXEMPTED';

export interface DccInstallmentPlan {
  id: string;
  demand_id: string;
  no_of_installments: number;
  installment_start_date: string | null;
  late_fee: number;
  due_days_with_late_fee: number;
  interest_pct_pa: number;
  discount_full_payment_pct: number;
  gst_pct: number;
  gst_type: 'inclusive' | 'exclusive';
  balance_payment: number;
  installments_paid: number;
  installments_due: number;
  created_at: string;
  updated_at: string;
}

export interface DccInstallmentRow {
  id: string;
  plan_id: string;
  row_number: number;
  label: string;
  percentage: number;
  amount: number;
  due_date: string | null;
  paid_date: string | null;
  paid_amt: number;
  remaining_amount: number;
  status: DccInstallmentRowStatus;
  late_fee: number;
  due_date_with_late_fee: string | null;
  gst_amount: number;
  created_at: string;
  updated_at: string;
}

export interface DccDemandRunLog {
  id: string;
  run_date: string;
  source: DccGenerationSource;
  demand_type_id: string | null;
  records_created: number;
  total_amount: number;
  created_at: string;
  demand_type?: DccDemandType;
}

// ── Tile / summary shape for the summary screen ─────────────────────────────────

export interface DccTile {
  id: string;
  // Basic info
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
  // Demand info
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
  // Extra
  region: string | null;
  group_name: string | null;
  subgroup: string | null;
}

export interface DccTrackerSummary {
  total_paid: number;
  total_due: number;
  total_overdue: number;
  collection_rate: number;
  paid_count: number;
  due_count: number;
  overdue_count: number;
}

export interface DccDemandFilters {
  object_id?: string | null;
  owner_id?: string | null;
  demand_type_code?: string | null;
  region?: string | null;
  group_name?: string | null;
  subgroup?: string | null;
  run_date_from?: string | null;
  run_date_to?: string | null;
  payment_date_from?: string | null;
  payment_date_to?: string | null;
  status?: DccDemandStatus | null;
}

// ── Reconciliation & Reports ──────────────────────────────────────────────────

export type BankStatus = 'Matched' | 'Unmatched' | 'Pending';

export interface DccReconciliationRow {
  object_id: string;
  object_ref: string;
  object_type: string;
  owner_name: string;
  demand_type_code: string;
  demand_type_label: string;
  total_demand: number;
  total_collected: number;
  total_outstanding: number;
  bank_status: BankStatus;
}

export interface DccReconciliationSummary {
  total_demand: number;
  total_collected: number;
  total_outstanding: number;
  reconciliation_rate: number;
  matched_count: number;
  unmatched_count: number;
  pending_count: number;
}

export interface DccReportRow {
  demand_type_code: string;
  demand_type_label: string;
  total_demand: number;
  total_collected: number;
  total_outstanding: number;
  overdue_amount: number;
  collection_rate: number;
  demand_count: number;
  overdue_count: number;
}

export interface DccOwnerReportRow {
  owner_id: string;
  owner_name: string;
  total_demand: number;
  total_collected: number;
  total_outstanding: number;
  overdue_amount: number;
  demand_count: number;
  overdue_count: number;
}

// ── Scheduled reports ──────────────────────────────────────────────────────────

export type DccReportType = 'by_type' | 'by_owner' | 'overdue' | 'detailed';
export type DccReportRecurrence = 'one-time' | 'daily' | 'weekly' | 'monthly';

export interface DccReportSchedule {
  id: string;
  name: string;
  report_type: DccReportType;
  criteria: DccDemandFilters;
  recurrence: DccReportRecurrence;
  next_run_at: string;
  last_run_at: string | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DccReportScheduleInput {
  name: string;
  report_type: DccReportType;
  criteria: DccDemandFilters;
  recurrence: DccReportRecurrence;
  next_run_at: string;
}

// ── Demand chat ────────────────────────────────────────────────────────────────

export interface DccDemandChat {
  id: string;
  demand_id: string;
  sender_role: 'manager' | 'owner';
  message: string;
  delivery_mode: string | null;
  created_at: string;
}
