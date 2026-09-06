import { supabase } from '../lib/supabase';
import type {
  DccObjectOwner,
  DccObject,
  DccDemandType,
  DccDemand,
  DccPayment,
  DccDemandRunLog,
  DccTile,
  DccTrackerSummary,
  DccDemandFilters,
  DccGenerationSource,
  DccInstallmentPlan,
  DccInstallmentRow,
  DccReportRow,
  DccOwnerReportRow,
  DccDemandChat,
  DccReportSchedule,
  DccReportScheduleInput,
} from '../types/dcc';

const OWNERS = 'dcc_object_owners';
const OBJECTS = 'dcc_objects';
const DTYPES = 'dcc_demand_types';
const DEMANDS = 'dcc_demands';
const PAYMENTS = 'dcc_payments';
const RUNLOG = 'dcc_demand_run_log';
const IPLANS = 'dcc_installment_plans';
const IROWS = 'dcc_installment_rows';
const CHATS = 'dcc_demand_chats';
const SCHEDULES = 'dcc_report_schedules';

// ── Demo data (used when database tables don't exist) ─────────────────────────
const DEMO_DEMAND_TYPES: DccDemandType[] = [
  { id: 'dt-rent', code: 'RENT', label: 'Rent', description: 'Monthly rent', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'dt-sd', code: 'SD', label: 'Security Deposit', description: 'Security deposit', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'dt-advance', code: 'ADVANCE', label: 'Advance', description: 'Advance payment', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'dt-loan', code: 'LOAN', label: 'Loan', description: 'Loan repayment', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'dt-tax', code: 'PROPERTY_TAX', label: 'Property Tax', description: 'Annual property tax', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'dt-insurance', code: 'INSURANCE', label: 'Insurance', description: 'Insurance premium', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'dt-maint', code: 'MAINT', label: 'Maintenance', description: 'Maintenance charges', is_active: true, created_at: '2026-08-01T00:00:00Z' },
];

const DEMO_OWNERS: DccObjectOwner[] = [
  { id: 'own-1', name: 'Rajesh Kumar', owner_type: 'PERSON', contact_number: '9876543210', email: 'rajesh@example.com', address: '123 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'own-2', name: 'Priya Sharma', owner_type: 'PERSON', contact_number: '9876543211', email: 'priya@example.com', address: '45 Park Street', city: 'Kolkata', state: 'West Bengal', pincode: '700001', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'own-3', name: 'Toyota Motors Ltd', owner_type: 'ORGANIZATION', contact_number: '9876543212', email: 'fleet@toyota.example.com', address: 'Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411001', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'own-4', name: 'State Bank of India', owner_type: 'ORGANIZATION', contact_number: '9876543213', email: 'loans@sbi.example.com', address: 'Bank Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'own-5', name: 'Anil Singh', owner_type: 'PERSON', contact_number: '9876543214', email: 'anil@example.com', address: '78 Civil Lines', city: 'Delhi', state: 'Delhi', pincode: '110001', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
];

const DEMO_OBJECTS: DccObject[] = [
  { id: 'obj-1', owner_id: 'own-1', object_type: 'PROPERTY', object_ref: 'SEC-14-A-301', description: 'Sector 14, Apt A-301', details: { bhk: 3, area: 1450 }, region: 'South', group_name: 'Sector 14', subgroup: 'Block A', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'obj-2', owner_id: 'own-2', object_type: 'PROPERTY', object_ref: 'SEC-14-B-102', description: 'Sector 14, Apt B-102', details: { bhk: 2, area: 1100 }, region: 'South', group_name: 'Sector 14', subgroup: 'Block B', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'obj-3', owner_id: 'own-3', object_type: 'CAR', object_ref: 'KA-01-AB-1234', description: 'Toyota Innova Crysta', details: { model: 'Innova Crysta', year: 2024, fuel: 'Diesel' }, region: 'South', group_name: 'Fleet', subgroup: 'SUV', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'obj-4', owner_id: 'own-4', object_type: 'LOAN', object_ref: 'LN-2026-001', description: 'Home Loan Rs 25,00,000', details: { principal: 2500000, tenure_months: 240, rate_pct: 8.5 }, region: 'West', group_name: 'Home Loans', subgroup: 'SBI', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'obj-5', owner_id: 'own-5', object_type: 'PROPERTY', object_ref: 'DL-CL-45', description: 'Civil Lines House No 45', details: { type: 'Independent House', area: 2200 }, region: 'North', group_name: 'Civil Lines', subgroup: 'Delhi', is_active: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
];

function buildDemoDemands(): DccDemand[] {
  const today = new Date();
  const daysFromNow = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
  const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
  return [
    { id: 'dem-1', object_id: 'obj-1', owner_id: 'own-1', demand_type_id: 'dt-rent', criteria_id: null, demand_run_date: daysAgo(10), due_date: daysFromNow(5), amount: 25000, amount_paid: 0, status: 'DUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'AUTO', include_gst: true, gst_pct: 18, gst_type: 'exclusive', gst_amount: 4500, created_at: daysAgo(10)+'T00:00:00Z', updated_at: daysAgo(10)+'T00:00:00Z' },
    { id: 'dem-2', object_id: 'obj-1', owner_id: 'own-1', demand_type_id: 'dt-sd', criteria_id: null, demand_run_date: daysAgo(30), due_date: daysAgo(5), amount: 50000, amount_paid: 0, status: 'OVERDUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'MANUAL', include_gst: false, gst_pct: 0, gst_type: 'exclusive', gst_amount: 0, created_at: daysAgo(30)+'T00:00:00Z', updated_at: daysAgo(30)+'T00:00:00Z' },
    { id: 'dem-3', object_id: 'obj-2', owner_id: 'own-2', demand_type_id: 'dt-rent', criteria_id: null, demand_run_date: daysAgo(8), due_date: daysFromNow(2), amount: 18000, amount_paid: 18000, status: 'PAID', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'AUTO', include_gst: true, gst_pct: 18, gst_type: 'inclusive', gst_amount: 2746, created_at: daysAgo(8)+'T00:00:00Z', updated_at: daysAgo(3)+'T00:00:00Z' },
    { id: 'dem-4', object_id: 'obj-3', owner_id: 'own-3', demand_type_id: 'dt-maint', criteria_id: null, demand_run_date: daysAgo(15), due_date: daysFromNow(10), amount: 8500, amount_paid: 0, status: 'DUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'TPA', include_gst: false, gst_pct: 0, gst_type: 'exclusive', gst_amount: 0, created_at: daysAgo(15)+'T00:00:00Z', updated_at: daysAgo(15)+'T00:00:00Z' },
    { id: 'dem-5', object_id: 'obj-4', owner_id: 'own-4', demand_type_id: 'dt-loan', criteria_id: null, demand_run_date: daysAgo(20), due_date: daysAgo(2), amount: 22000, amount_paid: 0, status: 'OVERDUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'AUTO', include_gst: true, gst_pct: 18, gst_type: 'exclusive', gst_amount: 3960, created_at: daysAgo(20)+'T00:00:00Z', updated_at: daysAgo(20)+'T00:00:00Z' },
    { id: 'dem-6', object_id: 'obj-5', owner_id: 'own-5', demand_type_id: 'dt-tax', criteria_id: null, demand_run_date: daysAgo(5), due_date: daysFromNow(25), amount: 45000, amount_paid: 20000, status: 'DUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'EXCEL', include_gst: false, gst_pct: 0, gst_type: 'exclusive', gst_amount: 0, created_at: daysAgo(5)+'T00:00:00Z', updated_at: daysAgo(2)+'T00:00:00Z' },
    { id: 'dem-7', object_id: 'obj-2', owner_id: 'own-2', demand_type_id: 'dt-insurance', criteria_id: null, demand_run_date: daysAgo(12), due_date: daysFromNow(18), amount: 12000, amount_paid: 12000, status: 'PAID', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'AUTO', include_gst: true, gst_pct: 18, gst_type: 'inclusive', gst_amount: 1831, created_at: daysAgo(12)+'T00:00:00Z', updated_at: daysAgo(1)+'T00:00:00Z' },
    { id: 'dem-8', object_id: 'obj-3', owner_id: 'own-3', demand_type_id: 'dt-advance', criteria_id: null, demand_run_date: daysAgo(3), due_date: daysFromNow(7), amount: 15000, amount_paid: 0, status: 'DUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'MANUAL', include_gst: false, gst_pct: 0, gst_type: 'exclusive', gst_amount: 0, created_at: daysAgo(3)+'T00:00:00Z', updated_at: daysAgo(3)+'T00:00:00Z' },
    { id: 'dem-9', object_id: 'obj-1', owner_id: 'own-1', demand_type_id: 'dt-maint', criteria_id: null, demand_run_date: daysAgo(10), due_date: daysAgo(1), amount: 3200, amount_paid: 0, status: 'OVERDUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'AUTO', include_gst: true, gst_pct: 12, gst_type: 'exclusive', gst_amount: 384, created_at: daysAgo(10)+'T00:00:00Z', updated_at: daysAgo(10)+'T00:00:00Z' },
    { id: 'dem-10', object_id: 'obj-5', owner_id: 'own-5', demand_type_id: 'dt-rent', criteria_id: null, demand_run_date: daysAgo(7), due_date: daysFromNow(3), amount: 30000, amount_paid: 15000, status: 'DUE', dispute_date: null, dispute_reason: null, dispute_remarks: null, generation_source: 'AUTO', include_gst: true, gst_pct: 18, gst_type: 'exclusive', gst_amount: 5400, created_at: daysAgo(7)+'T00:00:00Z', updated_at: daysAgo(1)+'T00:00:00Z' },
  ];
}

function filterDemoDemands(demands: DccDemand[], filters?: DccDemandFilters): DccDemand[] {
  if (!filters) return demands;
  let r = demands;
  if (filters.object_id) r = r.filter(d => d.object_id === filters.object_id);
  if (filters.owner_id) r = r.filter(d => d.owner_id === filters.owner_id);
  if (filters.demand_type_code) { const dt = DEMO_DEMAND_TYPES.find(t => t.code === filters.demand_type_code); if (dt) r = r.filter(d => d.demand_type_id === dt.id); }
  if (filters.region) r = r.filter(d => { const o = DEMO_OBJECTS.find(o => o.id === d.object_id); return o?.region === filters.region; });
  if (filters.group_name) r = r.filter(d => { const o = DEMO_OBJECTS.find(o => o.id === d.object_id); return o?.group_name === filters.group_name; });
  if (filters.subgroup) r = r.filter(d => { const o = DEMO_OBJECTS.find(o => o.id === d.object_id); return o?.subgroup === filters.subgroup; });
  if (filters.run_date_from) r = r.filter(d => d.demand_run_date >= filters.run_date_from!);
  if (filters.run_date_to) r = r.filter(d => d.demand_run_date <= filters.run_date_to!);
  if (filters.status) r = r.filter(d => d.status === filters.status);
  return r;
}

function isTableMissingError(error: { code?: string; message?: string }): boolean {
  const msg = error?.message ?? '';
  const code = error?.code ?? '';
  return code === '42P01' || (msg.includes('relation') && msg.includes('does not exist')) || msg.includes('Could not find the table') || msg.includes('does not exist');
}

export const dccService = {
  // ── Reference data ──────────────────────────────────────────────────────────
  async listDemandTypes(): Promise<DccDemandType[]> {
    const { data, error } = await supabase
      .from(DTYPES)
      .select('*')
      .order('label', { ascending: true });
    if (error) {
      if (isTableMissingError(error)) return DEMO_DEMAND_TYPES;
      throw error;
    }
    return (data ?? []) as DccDemandType[];
  },

  async listObjectOwners(): Promise<DccObjectOwner[]> {
    const { data, error } = await supabase
      .from(OWNERS)
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      if (isTableMissingError(error)) return DEMO_OWNERS;
      throw error;
    }
    return (data ?? []) as DccObjectOwner[];
  },

  async listObjects(ownerId?: string | null): Promise<DccObject[]> {
    let q = supabase.from(OBJECTS).select('*, owner:owner_id(*)').order('object_ref');
    if (ownerId) q = q.eq('owner_id', ownerId);
    const { data, error } = await q;
    if (error) {
      if (isTableMissingError(error)) {
        let objs = DEMO_OBJECTS;
        if (ownerId) objs = objs.filter(o => o.owner_id === ownerId);
        return objs;
      }
      throw error;
    }
    return (data ?? []) as DccObject[];
  },

  // ── Demands (with joins) ────────────────────────────────────────────────────
  async listDemands(filters?: DccDemandFilters): Promise<DccDemand[]> {
    let q = supabase
      .from(DEMANDS)
      .select('*, object:object_id(*, owner:owner_id(*)), owner:owner_id(*), demand_type:demand_type_id(*)')
      .order('due_date', { ascending: true });

    if (filters?.object_id) q = q.eq('object_id', filters.object_id);
    if (filters?.owner_id) q = q.eq('owner_id', filters.owner_id);
    if (filters?.demand_type_code) {
      const { data: dt } = await supabase
        .from(DTYPES)
        .select('id')
        .eq('code', filters.demand_type_code)
        .maybeSingle();
      if (dt) q = q.eq('demand_type_id', (dt as { id: string }).id);
    }
    if (filters?.region) q = q.eq('region', filters.region);
    if (filters?.group_name) q = q.eq('group_name', filters.group_name);
    if (filters?.subgroup) q = q.eq('subgroup', filters.subgroup);
    if (filters?.run_date_from) q = q.gte('demand_run_date', filters.run_date_from);
    if (filters?.run_date_to) q = q.lte('demand_run_date', filters.run_date_to);
    if (filters?.status) q = q.eq('status', filters.status);

    const { data, error } = await q;
    if (error) {
      if (isTableMissingError(error)) return filterDemoDemands(buildDemoDemands(), filters);
      throw error;
    }
    return (data ?? []) as DccDemand[];
  },

  // ── Tiles (computed from demands + payments) ───────────────────────────────
  async getTiles(filters?: DccDemandFilters): Promise<DccTile[]> {
    const demands = await this.listDemands(filters);

    // Fetch last payment per demand
    const demandIds = demands.map((d) => d.id);
    let lastPayments: Record<string, { date: string; amount: number }> = {};
    if (demandIds.length > 0 && !demandIds[0]?.startsWith('dem-')) {
      const { data: pays } = await supabase
        .from(PAYMENTS)
        .select('demand_id, payment_date, amount')
        .in('demand_id', demandIds)
        .order('payment_date', { ascending: false });
      if (pays) {
        for (const p of pays as { demand_id: string; payment_date: string; amount: number }[]) {
          if (!lastPayments[p.demand_id]) {
            lastPayments[p.demand_id] = { date: p.payment_date, amount: p.amount };
          }
        }
      }
    }

    const today = new Date();
    const tiles: DccTile[] = demands.map((d) => {
      const due = Math.max(0, d.amount - d.amount_paid);
      const overdue = d.status === 'OVERDUE' ? due : 0;
      const lastPay = lastPayments[d.id];
      const dueDate = new Date(d.due_date);
      const avgOverdueDays =
        d.status === 'OVERDUE'
          ? Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000))
          : 0;

      const owner = d.owner;
      const obj = d.object;
      const ownerAddress = [owner?.address, owner?.city, owner?.state, owner?.pincode]
        .filter(Boolean)
        .join(', ');

      return {
        id: d.id,
        demand_type_code: d.demand_type?.code ?? '',
        demand_type_label: d.demand_type?.label ?? '',
        object_id: d.object_id,
        object_ref: obj?.object_ref ?? '',
        object_description: obj?.description ?? '',
        object_type: obj?.object_type ?? '',
        owner_id: d.owner_id,
        owner_name: owner?.name ?? '',
        owner_contact: owner?.contact_number ?? '',
        owner_address: ownerAddress,
        demand_run_date: d.demand_run_date,
        total_amount: d.amount,
        due_date: d.due_date,
        amount_paid: d.amount_paid,
        amount_due: due,
        overdue_amount: overdue,
        last_paid_date: lastPay?.date ?? null,
        last_paid_amount: lastPay?.amount ?? null,
        avg_overdue_days: avgOverdueDays,
        status: d.status,
        include_gst: d.include_gst ?? false,
        gst_pct: d.gst_pct ?? 0,
        gst_type: d.gst_type ?? 'exclusive',
        gst_amount: d.gst_amount ?? 0,
        region: obj?.region ?? null,
        group_name: obj?.group_name ?? null,
        subgroup: obj?.subgroup ?? null,
      };
    });

    return tiles;
  },

  // ── Tracker summary ──────────────────────────────────────────────────────────
  async getTrackerSummary(filters?: DccDemandFilters): Promise<DccTrackerSummary> {
    const tiles = await this.getTiles(filters);
    const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
    const totalDue = tiles.reduce((s, t) => s + t.amount_due, 0);
    const totalOverdue = tiles.reduce((s, t) => s + t.overdue_amount, 0);
    const totalAmount = tiles.reduce((s, t) => s + t.total_amount, 0);
    const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

    return {
      total_paid: totalPaid,
      total_due: totalDue,
      total_overdue: totalOverdue,
      collection_rate: collectionRate,
      paid_count: tiles.filter((t) => t.status === 'PAID').length,
      due_count: tiles.filter((t) => t.status === 'DUE').length,
      overdue_count: tiles.filter((t) => t.status === 'OVERDUE').length,
    };
  },

  // ── Payments ────────────────────────────────────────────────────────────────
  async getPayments(demandId: string): Promise<DccPayment[]> {
    const { data, error } = await supabase
      .from(PAYMENTS)
      .select('*')
      .eq('demand_id', demandId)
      .order('payment_date', { ascending: false });
    if (error) {
      if (isTableMissingError(error)) return [];
      throw error;
    }
    return (data ?? []) as DccPayment[];
  },

  async submitPayment(
    demandId: string,
    objectId: string,
    amount: number,
    mode: string,
    paymentDate: string,
    referenceNumber?: string,
    remarks?: string,
  ): Promise<DccPayment> {
    const { data, error } = await supabase
      .rpc('dcc_record_payment', {
        p_demand_id: demandId,
        p_object_id: objectId,
        p_amount: amount,
        p_payment_mode: mode,
        p_payment_date: paymentDate,
        p_reference_number: referenceNumber ?? null,
        p_remarks: remarks ?? null,
      });
    if (error) throw error;
    return data as DccPayment;
  },

  // ── Dispute ──────────────────────────────────────────────────────────────────
  async setDispute(
    demandId: string,
    disputeDate: string,
    reason: string,
    remarks: string,
  ): Promise<void> {
    const { error } = await supabase
      .from(DEMANDS)
      .update({
        dispute_date: disputeDate,
        dispute_reason: reason,
        dispute_remarks: remarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', demandId);
    if (error) throw error;
  },

  // ── Run log ──────────────────────────────────────────────────────────────────
  async listRunLog(): Promise<DccDemandRunLog[]> {
    const { data, error } = await supabase
      .from(RUNLOG)
      .select('*, demand_type:demand_type_id(*)')
      .order('run_date', { ascending: false });
    if (error) {
      if (isTableMissingError(error)) return [];
      throw error;
    }
    return (data ?? []) as DccDemandRunLog[];
  },

  async getRunLogDetails(runLog: DccDemandRunLog): Promise<DccDemand[]> {
    let q = supabase
      .from(DEMANDS)
      .select('*, object:object_id(*, owner:owner_id(*)), owner:owner_id(*), demand_type:demand_type_id(*)')
      .eq('demand_run_date', runLog.run_date)
      .eq('generation_source', runLog.source)
      .order('due_date', { ascending: true });
    if (runLog.demand_type_id) q = q.eq('demand_type_id', runLog.demand_type_id);
    const { data, error } = await q;
    if (error) {
      if (isTableMissingError(error)) return [];
      throw error;
    }
    return (data ?? []) as DccDemand[];
  },

  // ── Demand generation ──────────────────────────────────────────────────────

  async generateDemands(
    rows: { object_id: string; owner_id: string; demand_type_id: string; amount: number; due_date: string; run_date: string }[],
    source: DccGenerationSource,
    criteriaId?: string | null,
  ): Promise<{ created: number; totalAmount: number; runLogId: string }> {
    if (rows.length === 0) return { created: 0, totalAmount: 0, runLogId: '' };

    const startedAt = new Date().toISOString();

    // Fetch GST config from payable_criteria_mt if criteriaId is provided
    let gstConfig = { include_gst: false, gst_pct: 0, gst_type: 'exclusive' as 'inclusive' | 'exclusive' };
    if (criteriaId) {
      const { data: pc } = await supabase
        .from('payable_criteria_mt')
        .select('include_gst, default_gst_pct')
        .eq('id', criteriaId)
        .maybeSingle();
      if (pc) {
        const p = pc as { include_gst: boolean; default_gst_pct: number | null };
        gstConfig = {
          include_gst: p.include_gst ?? false,
          gst_pct: p.default_gst_pct ?? 0,
          gst_type: 'exclusive',
        };
      }
    }

    const demandRows = rows.map((r) => {
      const gstAmount = gstConfig.include_gst && gstConfig.gst_pct > 0
        ? Math.round(r.amount * gstConfig.gst_pct / 100)
        : 0;
      return {
        object_id: r.object_id,
        owner_id: r.owner_id,
        demand_type_id: r.demand_type_id,
        criteria_id: criteriaId ?? null,
        demand_run_date: r.run_date,
        due_date: r.due_date,
        amount: r.amount,
        amount_paid: 0,
        status: 'DUE' as const,
        generation_source: source,
        include_gst: gstConfig.include_gst,
        gst_pct: gstConfig.gst_pct,
        gst_type: gstConfig.gst_type,
        gst_amount: gstAmount,
      };
    });

    const { data: inserted, error: insErr } = await supabase
      .from(DEMANDS)
      .insert(demandRows)
      .select('id, amount');
    if (insErr) throw insErr;

    const created = (inserted ?? []).length;
    const totalAmount = (inserted ?? []).reduce((s, r: { amount: number }) => s + r.amount, 0);
    const demandTypeId = rows[0]?.demand_type_id ?? null;
    const endedAt = new Date().toISOString();
    const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    const recordsFailed = rows.length - created;

    const runSummary = {
      total_rows_input: rows.length,
      object_count: new Set(rows.map(r => r.object_id)).size,
      criteria_id: criteriaId ?? null,
    };

    const { data: logRow, error: logErr } = await supabase
      .from(RUNLOG)
      .insert({
        run_date: rows[0]?.run_date ?? new Date().toISOString().slice(0, 10),
        source,
        demand_type_id: demandTypeId,
        records_created: created,
        total_amount: totalAmount,
        started_at: startedAt,
        ended_at: endedAt,
        duration_ms: durationMs,
        records_failed: recordsFailed,
        run_summary: runSummary,
      })
      .select('id')
      .single();
    if (logErr) throw logErr;

    return { created, totalAmount, runLogId: (logRow as { id: string }).id };
  },

  async generateFromExcel(
    rows: { object_ref: string; demand_type_code: string; amount: number; due_date: string; run_date: string }[],
  ): Promise<{ created: number; totalAmount: number }> {
    const resolved: { object_id: string; owner_id: string; demand_type_id: string; amount: number; due_date: string; run_date: string }[] = [];

    for (const row of rows) {
      const obj = await this.findOrCreateObject(row.object_ref);
      const dt = await this.findDemandTypeByCode(row.demand_type_code);
      if (!obj || !dt) continue;
      resolved.push({
        object_id: obj.id,
        owner_id: obj.owner_id,
        demand_type_id: dt.id,
        amount: row.amount,
        due_date: row.due_date,
        run_date: row.run_date,
      });
    }

    const result = await this.generateDemands(resolved, 'EXCEL');
    return { created: result.created, totalAmount: result.totalAmount };
  },

  async generateFromTPA(
    payload: { object_ref: string; demand_type_code: string; amount: number; due_date: string; run_date: string }[],
  ): Promise<{ created: number; totalAmount: number }> {
    const resolved: { object_id: string; owner_id: string; demand_type_id: string; amount: number; due_date: string; run_date: string }[] = [];

    for (const row of payload) {
      const obj = await this.findOrCreateObject(row.object_ref);
      const dt = await this.findDemandTypeByCode(row.demand_type_code);
      if (!obj || !dt) continue;
      resolved.push({
        object_id: obj.id,
        owner_id: obj.owner_id,
        demand_type_id: dt.id,
        amount: row.amount,
        due_date: row.due_date,
        run_date: row.run_date,
      });
    }

    const result = await this.generateDemands(resolved, 'TPA');
    return { created: result.created, totalAmount: result.totalAmount };
  },

  async generateAuto(
    rules: { criteria_id: string; object_id: string; owner_id: string; demand_type_id: string; amount: number; due_date: string; run_date: string }[],
  ): Promise<{ created: number; totalAmount: number }> {
    const rows = rules.map((r) => ({
      object_id: r.object_id,
      owner_id: r.owner_id,
      demand_type_id: r.demand_type_id,
      amount: r.amount,
      due_date: r.due_date,
      run_date: r.run_date,
    }));
    const criteriaId = rules[0]?.criteria_id ?? null;
    const result = await this.generateDemands(rows, 'AUTO', criteriaId);
    return { created: result.created, totalAmount: result.totalAmount };
  },

  // ── Helpers for generation ────────────────────────────────────────────────────

  async findOrCreateObject(objectRef: string): Promise<DccObject | null> {
    const { data: existing } = await supabase
      .from(OBJECTS)
      .select('*, owner:owner_id(*)')
      .eq('object_ref', objectRef)
      .maybeSingle();
    if (existing) return existing as DccObject;

    const { data: owner } = await supabase
      .from(OWNERS)
      .select('id')
      .limit(1)
      .maybeSingle();
    if (!owner) return null;

    const { data: newObj } = await supabase
      .from(OBJECTS)
      .insert({
        owner_id: (owner as { id: string }).id,
        object_type: 'OTHER',
        object_ref: objectRef,
        description: objectRef,
      })
      .select('*, owner:owner_id(*)')
      .single();
    return (newObj as DccObject) ?? null;
  },

  async findDemandTypeByCode(code: string): Promise<DccDemandType | null> {
    const { data } = await supabase
      .from(DTYPES)
      .select('*')
      .eq('code', code)
      .maybeSingle();
    return (data as DccDemandType) ?? null;
  },

  // ── Installment plans ──────────────────────────────────────────────────────────
  async getInstallmentPlan(demandId: string): Promise<{ plan: DccInstallmentPlan | null; rows: DccInstallmentRow[] }> {
    const { data: plan, error: planErr } = await supabase
      .from(IPLANS)
      .select('*')
      .eq('demand_id', demandId)
      .maybeSingle();
    if (planErr) {
      if (isTableMissingError(planErr)) return { plan: null, rows: [] };
      throw planErr;
    }
    if (!plan) return { plan: null, rows: [] };
    const safePlan = {
      installment_start_date: null,
      due_days_with_late_fee: 0,
      balance_payment: 0,
      installments_paid: 0,
      installments_due: 0,
      ...plan,
    } as DccInstallmentPlan;
    const { data: rows, error: rowErr } = await supabase
      .from(IROWS)
      .select('*')
      .eq('plan_id', safePlan.id)
      .order('row_number', { ascending: true });
    if (rowErr) throw rowErr;
    return { plan: safePlan, rows: (rows ?? []) as DccInstallmentRow[] };
  },

  async createInstallmentPlan(
    demandId: string,
    config: {
      noOfInstallments: number;
      installmentStartDate: string;
      lateFee: number;
      dueDaysWithLateFee: number;
      interestPctPa: number;
      discountFullPaymentPct: number;
      gstPct: number;
      gstType: 'inclusive' | 'exclusive';
      balancePayment: number;
    },
    customRows?: Array<{
      row_number: number;
      label: string;
      percentage: number;
      amount: number;
      due_date: string;
      late_fee?: number;
      due_date_with_late_fee?: string | null;
      gst_amount?: number;
    }>,
  ): Promise<{ plan: DccInstallmentPlan; rows: DccInstallmentRow[] }> {
    // Build rows: either custom rows or auto-generated
    let rowPayload: Array<{
      row_number: number; label: string; percentage: number;
      amount: number; due_date: string; late_fee: number;
      due_date_with_late_fee: string | null; gst_amount: number;
    }>;

    if (customRows && customRows.length > 0) {
      rowPayload = customRows.map(r => ({
        row_number: r.row_number,
        label: r.label,
        percentage: r.percentage,
        amount: r.amount,
        due_date: r.due_date,
        late_fee: r.late_fee ?? 0,
        due_date_with_late_fee: r.due_date_with_late_fee ?? null,
        gst_amount: r.gst_amount ?? 0,
      }));
    } else {
      const total = config.balancePayment;
      const perInstallment = config.noOfInstallments > 0 ? total / config.noOfInstallments : total;
      const isExcl = config.gstType === 'exclusive';
      const fullPayGst = isExcl ? total * (config.gstPct / 100) : 0;
      const perInstGst = isExcl ? perInstallment * (config.gstPct / 100) : 0;

      rowPayload = [
        {
          row_number: 0,
          label: 'Full Payment',
          percentage: 100,
          amount: total,
          due_date: config.installmentStartDate,
          late_fee: 0,
          due_date_with_late_fee: null,
          gst_amount: fullPayGst,
        },
      ];
      for (let i = 1; i <= config.noOfInstallments; i++) {
        const due = new Date(config.installmentStartDate);
        due.setMonth(due.getMonth() + (i - 1));
        const dueWithLate = new Date(due);
        dueWithLate.setDate(dueWithLate.getDate() + config.dueDaysWithLateFee);
        rowPayload.push({
          row_number: i,
          label: `Installment ${i}`,
          percentage: config.noOfInstallments > 0 ? 100 / config.noOfInstallments : 0,
          amount: perInstallment,
          due_date: due.toISOString().split('T')[0],
          late_fee: config.lateFee,
          due_date_with_late_fee: dueWithLate.toISOString().split('T')[0],
          gst_amount: perInstGst,
        });
      }
    }

    const configPayload = {
      no_of_installments: config.noOfInstallments,
      installment_start_date: config.installmentStartDate,
      late_fee: config.lateFee,
      due_days_with_late_fee: config.dueDaysWithLateFee,
      interest_pct_pa: config.interestPctPa,
      discount_full_payment_pct: config.discountFullPaymentPct,
      gst_pct: config.gstPct,
      gst_type: config.gstType,
      balance_payment: config.balancePayment,
    };

    const { data, error } = await supabase.rpc('dcc_create_installment_plan', {
      p_demand_id: demandId,
      p_config: configPayload,
      p_rows: rowPayload,
    });
    if (error) throw error;
    const result = data as { plan: DccInstallmentPlan; rows: DccInstallmentRow[] };
    return { plan: result.plan, rows: result.rows ?? [] };
  },

  async payInstallmentRow(
    rowId: string,
    amount: number,
    paymentDate: string,
  ): Promise<DccInstallmentRow> {
    const { data, error } = await supabase
      .rpc('dcc_pay_installment_row', {
        p_row_id: rowId,
        p_amount: amount,
        p_payment_date: paymentDate,
      });
    if (error) throw error;
    return data as DccInstallmentRow;
  },

  async deleteInstallmentPlan(demandId: string): Promise<void> {
    const { data: plan } = await supabase
      .from(IPLANS)
      .select('id')
      .eq('demand_id', demandId)
      .maybeSingle();
    if (plan) {
      await supabase.from(IPLANS).delete().eq('id', (plan as { id: string }).id);
    }
  },

  // ── Reports ─────────────────────────────────────────────────────────────────────
  async getReportByDemandType(filters?: DccDemandFilters): Promise<DccReportRow[]> {
    const tiles = await this.getTiles(filters);

    const groupMap: Record<string, DccReportRow> = {};
    for (const t of tiles) {
      const key = t.demand_type_code || 'UNKNOWN';
      if (!groupMap[key]) {
        groupMap[key] = {
          demand_type_code: key,
          demand_type_label: t.demand_type_label || key,
          total_demand: 0,
          total_collected: 0,
          total_outstanding: 0,
          overdue_amount: 0,
          total_gst: 0,
          collection_rate: 0,
          demand_count: 0,
          overdue_count: 0,
        };
      }
      groupMap[key].total_demand += t.total_amount;
      groupMap[key].total_collected += t.amount_paid;
      groupMap[key].total_outstanding += t.amount_due;
      groupMap[key].overdue_amount += t.overdue_amount;
      groupMap[key].total_gst += t.gst_amount;
      groupMap[key].demand_count++;
      if (t.status === 'OVERDUE') groupMap[key].overdue_count++;
    }

    return Object.values(groupMap).map((r) => ({
      ...r,
      collection_rate: r.total_demand > 0 ? Math.round((r.total_collected / r.total_demand) * 100) : 0,
    }));
  },

  async getReportByOwner(filters?: DccDemandFilters): Promise<DccOwnerReportRow[]> {
    const tiles = await this.getTiles(filters);

    const groupMap: Record<string, DccOwnerReportRow> = {};
    for (const t of tiles) {
      const key = t.owner_id || 'UNKNOWN';
      if (!groupMap[key]) {
        groupMap[key] = {
          owner_id: key,
          owner_name: t.owner_name || 'Unknown',
          total_demand: 0,
          total_collected: 0,
          total_outstanding: 0,
          overdue_amount: 0,
          total_gst: 0,
          demand_count: 0,
          overdue_count: 0,
        };
      }
      groupMap[key].total_demand += t.total_amount;
      groupMap[key].total_collected += t.amount_paid;
      groupMap[key].total_outstanding += t.amount_due;
      groupMap[key].overdue_amount += t.overdue_amount;
      groupMap[key].total_gst += t.gst_amount;
      groupMap[key].demand_count++;
      if (t.status === 'OVERDUE') groupMap[key].overdue_count++;
    }

    return Object.values(groupMap).sort((a, b) => b.total_outstanding - a.total_outstanding);
  },

  // ── Demand chat ──────────────────────────────────────────────────────────────
  async listChatMessages(demandId: string): Promise<DccDemandChat[]> {
    const { data, error } = await supabase
      .from(CHATS)
      .select('*')
      .eq('demand_id', demandId)
      .order('created_at', { ascending: true });
    if (error) {
      if (isTableMissingError(error)) return [];
      throw error;
    }
    return (data ?? []) as DccDemandChat[];
  },

  async sendChatMessage(
    demandId: string,
    senderRole: 'manager' | 'owner',
    message: string,
    deliveryMode?: string | null,
  ): Promise<DccDemandChat> {
    const { data, error } = await supabase
      .from(CHATS)
      .insert({
        demand_id: demandId,
        sender_role: senderRole,
        message,
        delivery_mode: deliveryMode ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as DccDemandChat;
  },

  // ── Scheduled reports ──────────────────────────────────────────────────────────
  async listSchedules(): Promise<DccReportSchedule[]> {
    const { data, error } = await supabase
      .from(SCHEDULES)
      .select('*')
      .order('next_run_at', { ascending: true });
    if (error) {
      if (isTableMissingError(error)) return [];
      throw error;
    }
    return (data ?? []) as DccReportSchedule[];
  },

  async createSchedule(input: DccReportScheduleInput): Promise<DccReportSchedule> {
    const { data, error } = await supabase
      .from(SCHEDULES)
      .insert({
        name: input.name,
        report_type: input.report_type,
        criteria: input.criteria,
        recurrence: input.recurrence,
        next_run_at: input.next_run_at,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as DccReportSchedule;
  },

  async updateSchedule(id: string, patch: Partial<DccReportScheduleInput> & { is_active?: boolean }): Promise<DccReportSchedule> {
    const { data, error } = await supabase
      .from(SCHEDULES)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as DccReportSchedule;
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase.from(SCHEDULES).delete().eq('id', id);
    if (error) throw error;
  },

  async getDetailedLedger(filters?: DccDemandFilters): Promise<DccTile[]> {
    return this.getTiles(filters);
  },
};
