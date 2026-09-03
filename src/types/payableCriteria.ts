// ── Payable Criteria MT types ──────────────────────────────────────────────────

export type PayableTransactionType =
  | 'PP'
  | 'TPF'
  | 'EMD'
  | 'SD'
  | 'RENT'
  | 'LEASE'
  | 'MAINT'
  | 'LOAN'
  | 'PURCHASE'
  | 'TAX'
  | 'INSURANCE';

export const PAYABLE_TRANSACTION_TYPES: PayableTransactionType[] = [
  'PP', 'TPF', 'EMD', 'SD', 'RENT', 'LEASE', 'MAINT', 'LOAN', 'PURCHASE', 'TAX', 'INSURANCE',
];

export const PAYABLE_TRANSACTION_TYPE_LABELS: Record<PayableTransactionType, string> = {
  PP: 'Processing Payment (PP)',
  TPF: 'Tender Processing Fee (TPF)',
  EMD: 'Earnest Money Deposit (EMD)',
  SD: 'Security Deposit (SD)',
  RENT: 'Rent',
  LEASE: 'Lease',
  MAINT: 'Maintenance',
  LOAN: 'Loan Instalment',
  PURCHASE: 'Purchase',
  TAX: 'Tax',
  INSURANCE: 'Insurance',
};

export type PaymentMode = 'EPAY' | 'MANUAL' | 'SALARY_ADJUSTED' | 'CHEQUE' | 'DD' | 'ONLINE';

export const ALL_PAYMENT_MODES: PaymentMode[] = [
  'EPAY', 'MANUAL', 'SALARY_ADJUSTED', 'CHEQUE', 'DD', 'ONLINE',
];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  EPAY: 'E-Pay',
  MANUAL: 'Manual',
  SALARY_ADJUSTED: 'Salary Adjusted',
  CHEQUE: 'Cheque',
  DD: 'Demand Draft',
  ONLINE: 'Online',
};

export type ReferenceDateType =
  | 'payable_generation_date'
  | 'allotment_submitted_date'
  | 'allotted_date'
  | 'accepted_date'
  | 'handover_date'
  | 'calendar_year_beginning'
  | 'fiscal_year_beginning';

export const ALL_REFERENCE_DATES: ReferenceDateType[] = [
  'payable_generation_date',
  'allotment_submitted_date',
  'allotted_date',
  'accepted_date',
  'handover_date',
  'calendar_year_beginning',
  'fiscal_year_beginning',
];

export const REFERENCE_DATE_LABELS: Record<ReferenceDateType, string> = {
  payable_generation_date: 'Payable Generation Date',
  allotment_submitted_date: 'Allotment Submitted Date',
  allotted_date: 'Allotted Date',
  accepted_date: 'Accepted Date',
  handover_date: 'Handover Date',
  calendar_year_beginning: 'Calendar Year Beginning',
  fiscal_year_beginning: 'Fiscal Year Beginning',
};

// ── Generation Frequency Codes ────────────────────────────────────────────────

export type DueDateReference = 'TPA' | 'Run' | 'Next';

export const DUE_DATE_REFERENCE_LABELS: Record<DueDateReference, string> = {
  TPA: 'TPA Date (received in TPA JSON)',
  Run: 'Actual BTM Run Date',
  Next: 'Next Run Date (always uses scheduled date)',
};

export interface FrequencyCodeOption {
  code: number;
  label: string;
  group: string;
}

export const FREQUENCY_CODES: FrequencyCodeOption[] = [
  { code: 99, label: 'Ad hoc by TPA (99)', group: 'Ad hoc' },
  { code: 98, label: 'Ad hoc by Excel (98)', group: 'Ad hoc' },
  { code: 95, label: 'Instalment Demand (95)', group: 'Ad hoc' },
  { code: 1, label: 'Monthly — Day 1', group: 'Monthly' },
  { code: 2, label: 'Monthly — Day 2', group: 'Monthly' },
  { code: 3, label: 'Monthly — Day 3', group: 'Monthly' },
  { code: 4, label: 'Monthly — Day 4', group: 'Monthly' },
  { code: 5, label: 'Monthly — Day 5', group: 'Monthly' },
  { code: 6, label: 'Monthly — Day 6', group: 'Monthly' },
  { code: 7, label: 'Monthly — Day 7', group: 'Monthly' },
  { code: 8, label: 'Monthly — Day 8', group: 'Monthly' },
  { code: 9, label: 'Monthly — Day 9', group: 'Monthly' },
  { code: 10, label: 'Monthly — Day 10', group: 'Monthly' },
  { code: 11, label: 'Monthly — Day 11', group: 'Monthly' },
  { code: 12, label: 'Monthly — Day 12', group: 'Monthly' },
  { code: 13, label: 'Monthly — Day 13', group: 'Monthly' },
  { code: 14, label: 'Monthly — Day 14', group: 'Monthly' },
  { code: 15, label: 'Monthly — Day 15', group: 'Monthly' },
  { code: 16, label: 'Monthly — Day 16', group: 'Monthly' },
  { code: 17, label: 'Monthly — Day 17', group: 'Monthly' },
  { code: 18, label: 'Monthly — Day 18', group: 'Monthly' },
  { code: 19, label: 'Monthly — Day 19', group: 'Monthly' },
  { code: 20, label: 'Monthly — Day 20', group: 'Monthly' },
  { code: 21, label: 'Monthly — Day 21', group: 'Monthly' },
  { code: 22, label: 'Monthly — Day 22', group: 'Monthly' },
  { code: 23, label: 'Monthly — Day 23', group: 'Monthly' },
  { code: 24, label: 'Monthly — Day 24', group: 'Monthly' },
  { code: 25, label: 'Monthly — Day 25', group: 'Monthly' },
  { code: 26, label: 'Monthly — Day 26', group: 'Monthly' },
  { code: 27, label: 'Monthly — Day 27', group: 'Monthly' },
  { code: 28, label: 'Monthly — Day 28', group: 'Monthly' },
  { code: 29, label: 'Monthly — Day 29', group: 'Monthly' },
  { code: 30, label: 'Monthly — Day 30 (EOM)', group: 'Monthly' },
  { code: 41, label: 'Daily — Monday (41)', group: 'Daily' },
  { code: 42, label: 'Daily — Tuesday (42)', group: 'Daily' },
  { code: 43, label: 'Daily — Wednesday (43)', group: 'Daily' },
  { code: 44, label: 'Daily — Thursday (44)', group: 'Daily' },
  { code: 45, label: 'Daily — Friday (45)', group: 'Daily' },
  { code: 46, label: 'Daily — Saturday (46)', group: 'Daily' },
  { code: 47, label: 'Daily — Sunday (47)', group: 'Daily' },
  { code: 51, label: 'Weekly — Monday (51)', group: 'Weekly' },
  { code: 52, label: 'Weekly — Tuesday (52)', group: 'Weekly' },
  { code: 53, label: 'Weekly — Wednesday (53)', group: 'Weekly' },
  { code: 54, label: 'Weekly — Thursday (54)', group: 'Weekly' },
  { code: 55, label: 'Weekly — Friday (55)', group: 'Weekly' },
  { code: 56, label: 'Weekly — Saturday (56)', group: 'Weekly' },
  { code: 57, label: 'Weekly — Sunday (57)', group: 'Weekly' },
  { code: 70, label: 'Fortnightly (70) — 15th & EOM', group: 'Periodic' },
  { code: 75, label: 'Quarterly (75) — 1st day of quarter', group: 'Periodic' },
  { code: 80, label: 'Yearly (80) — Fiscal year start', group: 'Periodic' },
  { code: 81, label: 'Yearly (81) — Calendar year start', group: 'Periodic' },
  { code: 89, label: 'Fixed Date (89)', group: 'Periodic' },
];

export function frequencyCodeLabel(code: number): string {
  const found = FREQUENCY_CODES.find((f) => f.code === code);
  return found ? found.label : `Code ${code}`;
}

export function isMonthlyCode(code: number): boolean {
  return code >= 1 && code <= 30;
}

export function isDailyCode(code: number): boolean {
  return code >= 41 && code <= 47;
}

export function isWeeklyCode(code: number): boolean {
  return code >= 51 && code <= 57;
}

export function isInstalmentCode(code: number): boolean {
  return code === 95;
}

export function isFixedDateCode(code: number): boolean {
  return code === 89;
}

/**
 * Compute the next run date from a frequency code and a reference date.
 * Returns null for ad hoc codes (99, 98) where next run date is sentinel.
 */
export function computeNextRunDate(
  code: number,
  fromDate: Date = new Date(),
): string | null {
  if (code === 99 || code === 98) return null;
  if (code === 89) return null; // fixed date is admin-set

  const d = new Date(fromDate);
  const result = new Date(d);

  if (isMonthlyCode(code)) {
    const day = code;
    result.setMonth(result.getMonth() + 1);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));
  } else if (isDailyCode(code)) {
    const targetDay = code - 41; // 0=Monday
    const currentDay = result.getDay() === 0 ? 6 : result.getDay() - 1; // 0=Monday
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    result.setDate(result.getDate() + diff);
  } else if (isWeeklyCode(code)) {
    const targetDay = code - 51;
    const currentDay = result.getDay() === 0 ? 6 : result.getDay() - 1;
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    result.setDate(result.getDate() + diff);
  } else if (code === 70) {
    // Fortnightly: 15th and EOM
    const dom = result.getDate();
    if (dom < 15) {
      result.setDate(15);
    } else {
      result.setMonth(result.getMonth() + 1);
      result.setDate(0); // last day of current month
    }
  } else if (code === 75) {
    // Quarterly: 1st day of next quarter
    const month = result.getMonth();
    const nextQuarterStart = Math.floor(month / 3) * 3 + 3;
    result.setMonth(nextQuarterStart % 12, 1);
    if (nextQuarterStart >= 12) result.setFullYear(result.getFullYear() + 1);
  } else if (code === 80) {
    // Fiscal year start (April 1)
    const year = result.getMonth() >= 3 ? result.getFullYear() + 1 : result.getFullYear();
    result.setFullYear(year, 3, 1);
  } else if (code === 81) {
    // Calendar year start (Jan 1)
    result.setFullYear(result.getFullYear() + 1, 0, 1);
  } else {
    return null;
  }

  return result.toISOString().slice(0, 10);
}

// ── Collection Exception Types ────────────────────────────────────────────────

export type CollectionExceptionType = 'Installment' | 'Discount' | 'Penalty' | 'Alert';

export const COLLECTION_EXCEPTION_TYPES: CollectionExceptionType[] = [
  'Installment', 'Discount', 'Penalty', 'Alert',
];

export const COLLECTION_EXCEPTION_TYPE_LABELS: Record<CollectionExceptionType, string> = {
  Installment: 'Instalment',
  Discount: 'Discount',
  Penalty: 'Penalty',
  Alert: 'Alert',
};

export type PctBasis = 'Daily' | 'Monthly' | 'Yearly';

export const PCT_BASIS_OPTIONS: PctBasis[] = ['Daily', 'Monthly', 'Yearly'];

// ── Existing child spec interfaces ─────────────────────────────────────────────

export interface DiscountSlabRow {
  days_offset: number;
  discount_pct: number;
  discount_amount: number;
  applicable_days: number;
}

export interface PayableFullPaymentSpec {
  id?: string;
  criteria_id?: string;
  reference_date: ReferenceDateType;
  days_offset: number;
  discount_slabs: DiscountSlabRow[];
}

export interface PayableAdvanceSpec {
  id?: string;
  criteria_id?: string;
  advance_type: 'PERCENTAGE' | 'AMOUNT';
  advance_value: number;
  reference_date: ReferenceDateType;
  days_offset: number;
}

export interface PayableInstallmentSpec {
  id?: string;
  criteria_id?: string;
  installment_type: 'PERCENTAGE' | 'AMOUNT';
  installment_value: number;
  reference_date: ReferenceDateType;
  days_offset: number;
}

export interface PayablePenaltySlab {
  id?: string;
  criteria_id?: string;
  slab_row: number;
  penalty_type: 'PERCENTAGE' | 'AMOUNT';
  penalty_value: number;
  late_days: number;
}

export interface PayableAlertSpec {
  id?: string;
  criteria_id?: string;
  days_before_due: number;
  message_hook: string;
}

// ── New child spec interfaces ──────────────────────────────────────────────────

export interface PayableIncreaseSpec {
  id?: string;
  criteria_id?: string;
  increase_after_months: number;
  increase_pct: number;
  increase_min: number | null;
  increase_max: number | null;
  alert_message_hook: string;
}

export interface PayableInstalmentGridRow {
  id?: string;
  criteria_id?: string;
  object_id: string | null;
  instalment_seq: number;
  instalment_date: string | null;
  instalment_amount: number;
  next_run_date: string | null;
}

export interface PayableCollectionException {
  id?: string;
  criteria_id?: string;
  exception_type: CollectionExceptionType;
  seq_no: number;
  demand_slab_min: number | null;
  demand_slab_max: number | null;
  offset_days: number;
  applicable_pct: number;
  pct_basis: PctBasis;
  pct_min: number | null;
  pct_max: number | null;
  actual_amount: number | null;
  message_hook: string;
}

// ── Master interfaces ───────────────────────────────────────────────────────────

export interface PayableCriteria {
  id: string;
  dept: string;
  subdept: string;
  module_id: string;
  location: string;
  grade_designation: string;
  payable_transaction_type: PayableTransactionType;
  first_btm_run_date: string | null;
  subsequent_btm_run_day: string;
  next_run_date: string | null;
  available_payment_modes: PaymentMode[];
  include_gst: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // DCC keying (Phase 2)
  demand_type_id: string | null;
  object_type: string | null;
  object_owner_id: string | null;
  import_source: 'TPA' | 'EXCEL' | 'AUTO' | 'MANUAL' | null;
  // Generation controls (Phase 6)
  generation_frequency_code: number;
  default_demand_amount: number | null;
  default_gst_pct: number | null;
  due_date_reference: DueDateReference | null;
  grace_period_days: number;
  tpa_url_id: string | null;
  last_run_date: string | null;
  next_instalment_seq: number | null;
  // Child specs (populated when fetched with joins)
  full_payment_spec?: PayableFullPaymentSpec | null;
  advance_spec?: PayableAdvanceSpec | null;
  installment_spec?: PayableInstallmentSpec | null;
  penalty_slabs?: PayablePenaltySlab[];
  alert_spec?: PayableAlertSpec | null;
  increase_spec?: PayableIncreaseSpec | null;
  instalment_grid?: PayableInstalmentGridRow[];
  collection_exceptions?: PayableCollectionException[];
}

export interface PayableCriteriaInput {
  dept: string;
  subdept: string;
  module_id: string;
  location: string;
  grade_designation: string;
  payable_transaction_type: PayableTransactionType;
  first_btm_run_date: string | null;
  subsequent_btm_run_day: string;
  next_run_date: string | null;
  available_payment_modes: PaymentMode[];
  include_gst: boolean;
  is_active: boolean;
  // DCC keying (Phase 2)
  demand_type_id: string | null;
  object_type: string | null;
  object_owner_id: string | null;
  import_source: 'TPA' | 'EXCEL' | 'AUTO' | 'MANUAL' | null;
  // Generation controls (Phase 6)
  generation_frequency_code: number;
  default_demand_amount: number | null;
  default_gst_pct: number | null;
  due_date_reference: DueDateReference | null;
  grace_period_days: number;
  tpa_url_id: string | null;
  // Child specs
  full_payment_spec: PayableFullPaymentSpec;
  advance_spec: PayableAdvanceSpec;
  installment_spec: PayableInstallmentSpec;
  penalty_slabs: PayablePenaltySlab[];
  alert_spec: PayableAlertSpec;
  increase_spec: PayableIncreaseSpec;
  instalment_grid: PayableInstalmentGridRow[];
  collection_exceptions: PayableCollectionException[];
}
