import { supabase } from '../lib/supabase';

// Per-tile EO remarks storage (demo mode only — not persisted across page reloads)
const DEMO_EO_REMARKS: Record<string, string> = {};

function getEarlierPendingRentMonth(allotmentId: string, month: string): string | null {
  const earlierPendingTile = DEMO_RENT_TILES
    .filter(t => t.allotment_id === allotmentId && t.month < month)
    .sort((a, b) => a.month.localeCompare(b.month))
    .find(t => t.status !== 'PAID' && t.status !== 'EXEMPTED');
  return earlierPendingTile?.month ?? null;
}

import {
  DEMO_MODE,
  DEMO_QUARTERS,
  DEMO_REQUESTS,
  DEMO_CYCLE,
  DEMO_CYCLES,
  DEMO_TENANT_REQUESTS,
  DEMO_SERVICE_CHATS,
  DEMO_ALLOTMENT_CHATS,
  DEMO_INSPECTIONS,
  DEMO_HANDOVER,
  DEMO_GUEST_INFO,
  DEMO_WORKFLOWS,
  DEMO_APPROVALS,
  DEMO_APPROVAL_RECORD,
  DEMO_APPROVAL_CHATS,
  DEMO_RENT_RECORDS,
  DEMO_RENT_SUMMARY,
  DEMO_RENT_TILES,
  DEMO_RENT_TRACKER_SUMMARY,
  DEMO_RENT_PAYMENTS,
  DEMO_RENT_CLARIFICATIONS,
  DEMO_INSTALLMENT_PLANS,
  DEMO_GOVT_OFFICIAL_TENANT_ID,
} from '../mocks/demoData';

// Re-export all types for backwards compatibility
export type {
  RentRecord,
  RentSummary,
  RentTile,
  RentTileStatus,
  RentPaymentMode,
  RentDueDetail,
  RentPayment,
  RentClarification,
  RentTrackerSummary,
  InstallmentPlan,
  InstallmentRow,
  Quarter,
  QuarterRequest,
  QuarterServiceChat,
  QuarterAllotmentChat,
  QuarterRequestPreference,
  QuarterAllotmentCycle,
  QuarterAllotment,
  QuarterTenantRequest,
  CreateTenantRequestInput,
  QuarterFilters,
  CreateQuarterRequestInput,
  OverrideInput,
  QuarterApprovalWorkflow,
  QuarterAllotmentApproval,
  QuarterApprovalChat,
  QuarterRequestApproval,
  QuarterRequestApprovalChat,
  QuarterInspection,
  QuarterInspectionChat,
  QuarterInspectionChecklistItem,
  QuarterHandover,
  QuarterGuestInfo,
  CreateQuarterInput,
  ChatDeliveryMode,
  MedicalCriticality,
} from '../types/quarters';

import type {
  RentRecord,
  RentSummary,
  RentTile,
  RentDueDetail,
  RentPayment,
  RentClarification,
  RentTrackerSummary,
  Quarter,
  QuarterRequest,
  QuarterServiceChat,
  QuarterAllotmentChat,
  QuarterAllotmentCycle,
  QuarterAllotment,
  QuarterTenantRequest,
  CreateTenantRequestInput,
  QuarterFilters,
  CreateQuarterRequestInput,
  OverrideInput,
  QuarterApprovalWorkflow,
  QuarterAllotmentApproval,
  QuarterApprovalChat,
  QuarterRequestApproval,
  QuarterRequestApprovalChat,
  QuarterInspection,
  QuarterInspectionChat,
  QuarterInspectionChecklistItem,
  QuarterHandover,
  QuarterGuestInfo,
  QuarterRequestPreference,
  ChatDeliveryMode,
  CreateQuarterInput,
  MedicalCriticality,
  InstallmentPlan,
  InstallmentRow,
} from '../types/quarters';

import type { ChecklistItemDraft } from '../constants/inspectionChecklist';

export const quartersService = {
  async getQuarters(_filters: QuarterFilters = {}): Promise<Quarter[]> {
    // DEMO_MODE: return mock data immediately
    if (DEMO_MODE) return Promise.resolve(DEMO_QUARTERS);
    const filters = _filters;
    let query = supabase
      .from('quarters')
      .select('*')
      .eq('is_active', true);

    if (filters.search) {
      query = query.or(
        `quarter_number.ilike.%${filters.search}%,block_name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
    if (filters.quarter_type) query = query.eq('quarter_type', filters.quarter_type);
    if (filters.furnishing_status) query = query.eq('furnishing_status', filters.furnishing_status);
    if (filters.occupancy_status) query = query.eq('occupancy_status', filters.occupancy_status);
    if (filters.bhk_config) query = query.eq('bhk_config', filters.bhk_config);
    if (filters.min_rent !== undefined) query = query.gte('monthly_rent', filters.min_rent);
    if (filters.max_rent !== undefined) query = query.lte('monthly_rent', filters.max_rent);

    const { data, error } = await query.order('quarter_number');
    if (error) throw error;
    return (data ?? []) as Quarter[];
  },

  async getQuarterById(id: string): Promise<Quarter | null> {
    // DEMO_MODE: return mock data immediately
    if (DEMO_MODE) return Promise.resolve(DEMO_QUARTERS.find(q => q.id === id) ?? null);
    const { data, error } = await supabase
      .from('quarters')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Quarter | null;
  },

  async getMyRequests(_employeeAuthId: string): Promise<QuarterRequest[]> {
    // DEMO_MODE: return mock data immediately
    if (DEMO_MODE) return Promise.resolve(DEMO_REQUESTS);
    const employeeAuthId = _employeeAuthId;
    const { data, error } = await supabase
      .from('quarter_requests')
      .select(`
        *,
        preferences:quarter_request_preferences(*, quarter:quarters(*)),
        allotment:quarter_allotments(*, quarter:quarters(*))
      `)
      .eq('employee_id', employeeAuthId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const normalised = (data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      allotment: Array.isArray(r.allotment) ? (r.allotment[0] ?? null) : r.allotment,
    }));
    return normalised as unknown as QuarterRequest[];
  },

  async getActiveCycle(): Promise<QuarterAllotmentCycle | null> {
    // DEMO_MODE: return mock data immediately
    if (DEMO_MODE) return Promise.resolve(DEMO_CYCLE);
    const { data, error } = await supabase
      .from('quarter_allotment_cycles')
      .select('*')
      .eq('status', 'OPEN')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as QuarterAllotmentCycle | null;
  },

  async getAllotmentCycles(): Promise<QuarterAllotmentCycle[]> {
    // DEMO_MODE: return mock data immediately
    if (DEMO_MODE) return Promise.resolve(DEMO_CYCLES);
    const { data, error } = await supabase
      .from('quarter_allotment_cycles')
      .select('*')
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterAllotmentCycle[];
  },

  async getAllotmentsForCycle(_cycleId: string): Promise<QuarterAllotment[]> {
    // DEMO_MODE: return mock data immediately
    if (DEMO_MODE) return Promise.resolve([]);
    const cycleId = _cycleId;
    const { data, error } = await supabase
      .from('quarter_allotments')
      .select(`*, quarter:quarters(*), request:quarter_requests(*)`)
      .eq('request.cycle_id', cycleId);
    if (error) throw error;
    return (data ?? []) as unknown as QuarterAllotment[];
  },

  async getRequestsForCycle(_cycleId: string): Promise<QuarterRequest[]> {
    // DEMO_MODE: return mock data immediately
    if (DEMO_MODE) return Promise.resolve(DEMO_REQUESTS);
    const cycleId = _cycleId;
    const { data, error } = await supabase
      .from('quarter_requests')
      .select(`
        *,
        preferences:quarter_request_preferences(*, quarter:quarters(*)),
        allotment:quarter_allotments(*, quarter:quarters(*))
      `)
      .eq('cycle_id', cycleId)
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as unknown as QuarterRequest[];
  },

  async createRequest(_employeeAuthId: string, input: CreateQuarterRequestInput): Promise<QuarterRequest> {
    // DEMO_MODE: return a stub request immediately
    if (DEMO_MODE) {
      const stub: QuarterRequest = {
        id: `req-demo-${Date.now()}`,
        request_number: `REQ-${new Date().getFullYear()}-DEMO`,
        employee_id: _employeeAuthId,
        cycle_id: input.cycle_id,
        initiation_type: 'CYCLE',
        request_reason: input.request_reason,
        required_bhk_config: input.required_bhk_config,
        preferred_location: input.preferred_location,
        move_in_date: input.move_in_date,
        family_member_count: input.family_member_count,
        request_type: input.request_type ?? 'GENERAL',
        request_status: 'DRAFT',
        sub_status: null,
        employee_notes: input.employee_notes,
        eo_notes: '',
        request_for: input.request_for ?? 'SELF',
        on_behalf_employee_id: input.on_behalf_employee_id ?? null,
        on_behalf_employee_name: input.on_behalf_employee_name ?? null,
        on_behalf_employee_dept: input.on_behalf_employee_dept ?? null,
        tp_name: input.tp_name ?? null,
        tp_organization: input.tp_organization ?? null,
        tp_mobile: input.tp_mobile ?? null,
        tp_email: input.tp_email ?? null,
        tp_pan: input.tp_pan ?? null,
        tp_notes: input.tp_notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: [],
        allotment: null,
        medical_criticality: null,
      };
      return Promise.resolve(stub);
    }
    const employeeAuthId = _employeeAuthId;
    const ACTIVE_STATUSES = ['DRAFT', 'SUBMITTED', 'ALLOTTED', 'ACKNOWLEDGED', 'EXTEND_REQUESTED', 'UPGRADE_REQUESTED', 'VACATE_REQUESTED'];
    const { count, error: countErr } = await supabase
      .from('quarter_requests')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employeeAuthId)
      .in('request_status', ACTIVE_STATUSES);
    if (countErr) throw countErr;
    if ((count ?? 0) >= 2) throw new Error('MAX_QUARTERS_REACHED');

    const reqNumber = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const { data: req, error: reqErr } = await supabase
      .from('quarter_requests')
      .insert({
        employee_id: employeeAuthId,
        request_number: reqNumber,
        cycle_id: input.cycle_id,
        request_reason: input.request_reason,
        required_bhk_config: input.required_bhk_config,
        preferred_location: input.preferred_location,
        move_in_date: input.move_in_date,
        family_member_count: input.family_member_count,
        request_type: input.request_type ?? 'GENERAL',
        employee_notes: input.employee_notes,
        request_status: 'DRAFT',
        request_for: input.request_for ?? 'SELF',
        on_behalf_employee_id: input.on_behalf_employee_id ?? null,
        on_behalf_employee_name: input.on_behalf_employee_name ?? null,
        on_behalf_employee_dept: input.on_behalf_employee_dept ?? null,
        tp_name: input.tp_name ?? null,
        tp_organization: input.tp_organization ?? null,
        tp_mobile: input.tp_mobile ?? null,
        tp_email: input.tp_email ?? null,
        tp_pan: input.tp_pan ?? null,
        tp_notes: input.tp_notes ?? null,
      })
      .select()
      .single();
    if (reqErr) throw reqErr;

    if (input.preferences.length > 0) {
      const prefs = input.preferences.map(p => ({
        request_id: req.id,
        quarter_id: p.quarter_id,
        preference_rank: p.preference_rank,
        pref_status: 'PENDING',
      }));
      const { error: prefErr } = await supabase.from('quarter_request_preferences').insert(prefs);
      if (prefErr) throw prefErr;
    }
    return req as QuarterRequest;
  },

  async submitRequest(_requestId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const requestId = _requestId;
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'SUBMITTED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async withdrawRequest(_requestId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const requestId = _requestId;
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async updateRequestPreferences(
    _requestId: string,
    _preferences: { quarter_id: string; preference_rank: number }[]
  ): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const requestId = _requestId;
    const preferences = _preferences;
    const { error: delErr } = await supabase
      .from('quarter_request_preferences')
      .delete()
      .eq('request_id', requestId);
    if (delErr) throw delErr;

    if (preferences.length > 0) {
      const prefs = preferences.map(p => ({
        request_id: requestId,
        quarter_id: p.quarter_id,
        preference_rank: p.preference_rank,
        pref_status: 'PENDING',
      }));
      const { error } = await supabase.from('quarter_request_preferences').insert(prefs);
      if (error) throw error;
    }
  },

  async saveOverride(_allottedByAuthId: string, _input: OverrideInput): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allottedByAuthId = _allottedByAuthId;
    const input = _input;
    const now = new Date().toISOString();

    // Audit log
    const { error: logErr } = await supabase.from('quarter_override_logs').insert({
      allotment_id: input.allotment_id,
      request_a_id: input.request_a_id,
      request_b_id: input.request_b_id ?? null,
      action_type: input.action_type,
      justification: input.justification,
      done_by: allottedByAuthId,
    });
    if (logErr) throw logErr;

    // Update allotment A
    const aUpdates: Record<string, unknown> = { is_overridden: true, updated_at: now };
    if (input.new_quarter_id) aUpdates.quarter_id = input.new_quarter_id;
    const { error: updErr } = await supabase.from('quarter_allotments').update(aUpdates).eq('id', input.allotment_id);
    if (updErr) throw updErr;

    // BPROPTOА_NEXTCYCLE: Reset Request B status to SUBMITTED, release B's allotment
    if (input.action_type === 'BPROPTOА_NEXTCYCLE' && input.request_b_id) {
      const { data: bAllotments } = await supabase
        .from('quarter_allotments').select('id').eq('request_id', input.request_b_id);
      if (bAllotments && bAllotments.length > 0) {
        await supabase.from('quarter_allotments').delete().in('id', bAllotments.map((a: { id: string }) => a.id));
      }
      await supabase.from('quarter_requests')
        .update({ request_status: 'SUBMITTED', sub_status: null, updated_at: now })
        .eq('id', input.request_b_id);
    }

    // BPROPTOA_CANCELB: Cancel Request B and optionally release A's prior quarter
    if (input.action_type === 'BPROPTOA_CANCELB' && input.request_b_id) {
      await supabase.from('quarter_requests')
        .update({ request_status: 'CANCELLED', updated_at: now })
        .eq('id', input.request_b_id);
      if (input.release_a_quarter) {
        // The allotment record has the old quarter_id before the override update; fetch from log if needed
        // We release by setting the quarter's occupancy_status to AVAILABLE
        // The quarter_id is stored on the allotment which was just updated — read it from input context
        // Since we don't have the old quarter id here directly, caller should pass it via new_quarter_id if needed
        // For safety, we look it up via the allotment
        const { data: aRow } = await supabase.from('quarter_allotments').select('quarter_id').eq('id', input.allotment_id).maybeSingle();
        if (aRow?.quarter_id && aRow.quarter_id !== input.b_new_quarter_id) {
          await supabase.from('quarters').update({ occupancy_status: 'AVAILABLE', updated_at: now }).eq('id', aRow.quarter_id);
        }
      }
    }

    // BPROPTOA_AVAILTOB: Assign available quarter to B
    if (input.action_type === 'BPROPTOA_AVAILTOB' && input.request_b_id && input.b_new_quarter_id) {
      await supabase.from('quarter_allotments').insert({
        request_id: input.request_b_id,
        quarter_id: input.b_new_quarter_id,
        allotted_by: allottedByAuthId,
        allotment_date: now.split('T')[0],
        approval_status: 'APPROVED',
      });
      await supabase.from('quarter_requests')
        .update({ request_status: 'ALLOTTED', updated_at: now })
        .eq('id', input.request_b_id);
    }

    // BPREFТОA_APREBTOB: Assign B to one of B's preferences
    if (input.action_type === 'BPREFTOA_APREBTOB' && input.request_b_id && input.b_new_pref_rank !== undefined) {
      const { data: bPrefs } = await supabase
        .from('quarter_request_preferences').select('quarter_id')
        .eq('request_id', input.request_b_id).eq('preference_rank', input.b_new_pref_rank).maybeSingle();
      if (bPrefs?.quarter_id) {
        await supabase.from('quarter_allotments').insert({
          request_id: input.request_b_id,
          quarter_id: bPrefs.quarter_id,
          allotted_by: allottedByAuthId,
          allotment_date: now.split('T')[0],
          approval_status: 'APPROVED',
        });
        await supabase.from('quarter_requests')
          .update({ request_status: 'ALLOTTED', updated_at: now })
          .eq('id', input.request_b_id);
      }
    }
  },

  async finaliseAllotments(_cycleId: string, _allottedByAuthId: string, _requests: QuarterRequest[]): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const cycleId = _cycleId;
    const allottedByAuthId = _allottedByAuthId;
    const requests = _requests;
    for (const req of requests) {
      if (req.request_status !== 'SUBMITTED') continue;
      if (!req.preferences || req.preferences.length === 0) continue;
      const topPref = req.preferences.sort((a, b) => a.preference_rank - b.preference_rank)[0];
      if (req.allotment) continue;

      await supabase.from('quarter_allotments').insert({
        request_id: req.id,
        quarter_id: topPref.quarter_id,
        allotted_by: allottedByAuthId,
        allotment_date: new Date().toISOString().split('T')[0],
        approval_status: 'PENDING',
      });
      await supabase
        .from('quarter_requests')
        .update({ request_status: 'ALLOTTED', updated_at: new Date().toISOString() })
        .eq('id', req.id);
    }
    await supabase
      .from('quarter_allotment_cycles')
      .update({ status: 'CLOSED', updated_at: new Date().toISOString() })
      .eq('id', cycleId);
  },

  async acknowledgeAllotment(_allotmentId: string, _requestId: string, _remarks: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allotmentId = _allotmentId;
    const requestId = _requestId;
    const remarks = _remarks;
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'ACKNOWLEDGED', acknowledgement_remarks: remarks, acknowledged_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'ACKNOWLEDGED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  async rejectAllotment(_allotmentId: string, _requestId: string, _reason: string, _docUrl?: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allotmentId = _allotmentId;
    const requestId = _requestId;
    const reason = _reason;
    const docUrl = _docUrl;
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'REJECTED', rejection_reason: reason, rejection_doc_url: docUrl ?? '', rejected_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'REJECTED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  async createTenantRequest(_employeeId: string, _allotmentId: string, input: CreateTenantRequestInput): Promise<QuarterTenantRequest> {
    if (DEMO_MODE) {
      const stub: QuarterTenantRequest = {
        id: `tr-demo-${Date.now()}`,
        allotment_id: _allotmentId,
        employee_id: _employeeId,
        service_type: input.service_type,
        request_status: 'PENDING',
        remarks: input.remarks,
        reason: input.reason,
        document_url: input.document_url ?? '',
        requested_date: input.requested_date ?? null,
        required_bhk_config: input.required_bhk_config ?? '',
        eo_notes: '',
        grievance_subject: input.grievance_subject ?? '',
        urgency_level: input.urgency_level ?? 'NORMAL',
        retention_reason: input.retention_reason ?? '',
        requested_months: input.requested_months ?? null,
        upgrade_mode: input.upgrade_mode ?? null,
        target_quarter_id: input.target_quarter_id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve(stub);
    }
    const employeeId = _employeeId;
    const allotmentId = _allotmentId;
    const { data, error } = await supabase
      .from('quarter_tenant_requests')
      .insert({
        allotment_id: allotmentId,
        employee_id: employeeId,
        service_type: input.service_type,
        remarks: input.remarks,
        reason: input.reason,
        document_url: input.document_url ?? '',
        requested_date: input.requested_date ?? null,
        required_bhk_config: input.required_bhk_config ?? '',
        grievance_subject: input.grievance_subject ?? '',
        urgency_level: input.urgency_level ?? 'NORMAL',
        retention_reason: input.retention_reason ?? '',
        requested_months: input.requested_months ?? null,
        upgrade_mode: input.upgrade_mode ?? null,
        target_quarter_id: input.target_quarter_id ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    const statusMap: Record<string, string> = {
      EXTEND: 'EXTEND_REQUESTED',
      UPGRADE: 'UPGRADE_REQUESTED',
      VACATE: 'VACATE_REQUESTED',
      EXCHANGE: 'EXCHANGE_REQUESTED',
    };
    await supabase
      .from('quarter_requests')
      .update({ request_status: statusMap[input.service_type], updated_at: new Date().toISOString() })
      .eq('id', (await supabase.from('quarter_allotments').select('request_id').eq('id', allotmentId).single()).data?.request_id);

    return data as QuarterTenantRequest;
  },

  async getMyTenantRequests(_employeeId: string): Promise<QuarterTenantRequest[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_TENANT_REQUESTS);
    const employeeId = _employeeId;
    const { data, error } = await supabase
      .from('quarter_tenant_requests')
      .select(`*, allotment:quarter_allotments(*, quarter:quarters(*))`)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as QuarterTenantRequest[];
  },

  async withdrawTenantRequest(_tenantRequestId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const tenantRequestId = _tenantRequestId;
    const { error } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: new Date().toISOString() })
      .eq('id', tenantRequestId);
    if (error) throw error;
  },

  async getAllRequests(): Promise<QuarterRequest[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_REQUESTS);
    const { data, error } = await supabase
      .from('quarter_requests')
      .select(`
        *,
        preferences:quarter_request_preferences(*, quarter:quarters(*)),
        allotment:quarter_allotments(*, quarter:quarters(*))
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as QuarterRequest[];
  },

  async getAllTenantRequests(): Promise<QuarterTenantRequest[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_TENANT_REQUESTS);
    const { data, error } = await supabase
      .from('quarter_tenant_requests')
      .select(`*, allotment:quarter_allotments(*, quarter:quarters(*))`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as QuarterTenantRequest[];
  },

  async approveTenantRequest(_tenantRequestId: string, _requestId: string, _serviceType: string, _eoNotes: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const tenantRequestId = _tenantRequestId;
    const requestId = _requestId;
    const serviceType = _serviceType;
    const eoNotes = _eoNotes;
    const now = new Date().toISOString();
    const { error: tErr } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'APPROVED', eo_notes: eoNotes, updated_at: now })
      .eq('id', tenantRequestId);
    if (tErr) throw tErr;

    const nextStatus: Record<string, string> = { VACATE: 'VACATED', EXTEND: 'ACKNOWLEDGED', UPGRADE: 'ALLOTTED', EXCHANGE: 'ACKNOWLEDGED' };
    if (nextStatus[serviceType]) {
      await supabase
        .from('quarter_requests')
        .update({ request_status: nextStatus[serviceType], updated_at: now })
        .eq('id', requestId);
    }
  },

  async rejectTenantRequest(_tenantRequestId: string, _requestId: string, _serviceType: string, _eoNotes: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const tenantRequestId = _tenantRequestId;
    const requestId = _requestId;
    const serviceType = _serviceType;
    const eoNotes = _eoNotes;
    const now = new Date().toISOString();
    const { error: tErr } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'REJECTED', eo_notes: eoNotes, updated_at: now })
      .eq('id', tenantRequestId);
    if (tErr) throw tErr;

    const revertStatus: Record<string, string> = { VACATE: 'ACKNOWLEDGED', EXTEND: 'ACKNOWLEDGED', UPGRADE: 'ALLOTTED', EXCHANGE: 'ACKNOWLEDGED' };
    if (revertStatus[serviceType]) {
      await supabase
        .from('quarter_requests')
        .update({ request_status: revertStatus[serviceType], updated_at: now })
        .eq('id', requestId);
    }
  },

  async deallocateRequest(_allotmentId: string, _requestId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allotmentId = _allotmentId;
    const requestId = _requestId;
    const now = new Date().toISOString();
    const { error: delErr } = await supabase.from('quarter_allotments').delete().eq('id', allotmentId);
    if (delErr) throw delErr;
    const { error: updErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'SUBMITTED', updated_at: now })
      .eq('id', requestId);
    if (updErr) throw updErr;
  },

  async cancelAllocatedRequest(_allotmentId: string, _requestId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allotmentId = _allotmentId;
    const requestId = _requestId;
    const now = new Date().toISOString();
    const { error: delErr } = await supabase.from('quarter_allotments').delete().eq('id', allotmentId);
    if (delErr) throw delErr;
    const { error: updErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: now })
      .eq('id', requestId);
    if (updErr) throw updErr;
  },

  async getQuartersSummary(): Promise<{ total: number; available: number; occupied: number }> {
    if (DEMO_MODE) return Promise.resolve({ total: 4, available: 3, occupied: 1 });
    const { data, error } = await supabase.from('quarters').select('occupancy_status').eq('is_active', true);
    if (error) throw error;
    const rows = (data ?? []) as { occupancy_status: string }[];
    return {
      total: rows.length,
      available: rows.filter(r => r.occupancy_status === 'AVAILABLE').length,
      occupied: rows.filter(r => r.occupancy_status === 'OCCUPIED').length,
    };
  },

  async declineAllotment(_allotmentId: string, _requestId: string, _reason: string, _docUrl?: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allotmentId = _allotmentId;
    const requestId = _requestId;
    const reason = _reason;
    const docUrl = _docUrl;
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'DECLINED', rejection_reason: reason, rejection_doc_url: docUrl ?? '', rejected_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'SUBMITTED', sub_status: 'DECLINED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  async declineAndCancelRequest(_allotmentId: string, _requestId: string, _reason: string, _docUrl?: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allotmentId = _allotmentId;
    const requestId = _requestId;
    const reason = _reason;
    const docUrl = _docUrl;
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'DECLINED', rejection_reason: reason, rejection_doc_url: docUrl ?? '', rejected_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'CANCELLED', sub_status: 'DECLINED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  async getRequestDocUrls(_requestId: string): Promise<{ name: string; url: string }[]> {
    if (DEMO_MODE) {
      const DEMO_DOCS: Record<string, { name: string; url: string }[]> = {
        'req-004': [
          { name: 'Medical Certificate.pdf', url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
          { name: 'Hospital Discharge Summary.pdf', url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
        ],
        'req-006': [
          { name: 'Reference Letter - Ministry.pdf', url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
        ],
        'req-002b': [
          { name: 'Medical Certificate.pdf', url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
          { name: 'Hospital Discharge Summary.pdf', url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
        ],
        'req-002c': [
          { name: 'Disability Certificate.pdf', url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
        ],
      };
      return Promise.resolve(DEMO_DOCS[_requestId] ?? []);
    }
    const requestId = _requestId;
    const { data, error } = await supabase.storage
      .from('quarter-docs')
      .list(`request-docs/${requestId}`, { limit: 50 });
    if (error || !data) return [];
    return data.map(f => ({
      name: f.name.replace(/^\d+-/, '').replace(/_/g, ' '),
      url: supabase.storage.from('quarter-docs').getPublicUrl(`request-docs/${requestId}/${f.name}`).data.publicUrl,
    }));
  },

  async uploadMedicalDoc(requestId: string, file: File): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const ext = file.name.split('.').pop() ?? 'bin';
    const safeName = file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
    const path = `request-docs/${requestId}/${Date.now()}-${safeName}.${ext}`;
    const { error } = await supabase.storage.from('quarter-docs').upload(path, file);
    if (error) throw error;
  },

  async updateRequestHeader(
    _requestId: string,
    data: {
      request_reason?: string;
      required_bhk_config?: string;
      preferred_location?: string;
      move_in_date?: string | null;
      family_member_count?: number;
      request_type?: string;
      employee_notes?: string;
    }
  ): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const requestId = _requestId;
    const { error } = await supabase
      .from('quarter_requests')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async cancelRequest(_requestId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const requestId = _requestId;
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async getServiceChats(_tenantRequestId: string): Promise<QuarterServiceChat[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_SERVICE_CHATS.filter(c => c.tenant_request_id === _tenantRequestId));
    const tenantRequestId = _tenantRequestId;
    const { data, error } = await supabase
      .from('quarter_service_chats')
      .select('*')
      .eq('tenant_request_id', tenantRequestId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterServiceChat[];
  },

  async addServiceChat(
    _tenantRequestId: string,
    _authorId: string,
    _authorRole: 'EMPLOYEE' | 'EO',
    _message: string,
    _documentUrls: string[],
    _deliveryModes: ChatDeliveryMode[] = ['IN_APP'],
  ): Promise<QuarterServiceChat> {
    const primaryMode = _deliveryModes[0] ?? 'IN_APP';
    if (DEMO_MODE) {
      return Promise.resolve({ id: `sc-demo-${Date.now()}`, tenant_request_id: _tenantRequestId, author_id: _authorId, author_role: _authorRole, message: _message, document_urls: _documentUrls, delivery_mode: primaryMode, created_at: new Date().toISOString() });
    }
    const tenantRequestId = _tenantRequestId;
    const authorId = _authorId;
    const authorRole = _authorRole;
    const message = _message;
    const documentUrls = _documentUrls;
    const { data, error } = await supabase
      .from('quarter_service_chats')
      .insert({ tenant_request_id: tenantRequestId, author_id: authorId, author_role: authorRole, message, document_urls: documentUrls, delivery_mode: primaryMode })
      .select()
      .single();
    if (error) throw error;
    return data as QuarterServiceChat;
  },

  async closeService(_tenantRequestId: string, _requestId: string, _serviceType: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const tenantRequestId = _tenantRequestId;
    const requestId = _requestId;
    const serviceType = _serviceType;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: now })
      .eq('id', tenantRequestId);
    if (error) throw error;
    const revertMap: Record<string, string> = {
      EXTEND: 'ACKNOWLEDGED', UPGRADE: 'ACKNOWLEDGED', VACATE: 'ACKNOWLEDGED',
      GRIEVANCE: 'ACKNOWLEDGED', MAINTENANCE: 'ACKNOWLEDGED',
    };
    if (revertMap[serviceType] && requestId) {
      await supabase
        .from('quarter_requests')
        .update({ request_status: revertMap[serviceType], updated_at: now })
        .eq('id', requestId);
    }
  },

  async updateTenantRequestStatus(_tenantRequestId: string, status: 'IN_PROGRESS' | 'RESOLVED'): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const tenantRequestId = _tenantRequestId;
    const { error } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: status, updated_at: new Date().toISOString() })
      .eq('id', tenantRequestId);
    if (error) throw error;
  },

  async getServiceChatsForAllotment(_allotmentId: string): Promise<QuarterServiceChat[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_SERVICE_CHATS);
    const allotmentId = _allotmentId;
    const { data: tenantReqs, error: tErr } = await supabase
      .from('quarter_tenant_requests')
      .select('id')
      .eq('allotment_id', allotmentId);
    if (tErr) throw tErr;
    const ids = (tenantReqs ?? []).map((r: { id: string }) => r.id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('quarter_service_chats')
      .select('*')
      .in('tenant_request_id', ids)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterServiceChat[];
  },

  async getAllotmentChats(_allotmentId: string): Promise<QuarterAllotmentChat[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_ALLOTMENT_CHATS.filter(c => c.allotment_id === _allotmentId));
    const allotmentId = _allotmentId;
    const { data, error } = await supabase
      .from('quarter_allotment_chats')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterAllotmentChat[];
  },

  async addAllotmentChat(
    _allotmentId: string,
    _authorId: string,
    _authorRole: 'employee' | 'eo' | 'system',
    _message: string,
    _documentUrls: string[] = [],
    _deliveryModes: ChatDeliveryMode[] = ['IN_APP'],
  ): Promise<QuarterAllotmentChat> {
    const primaryMode = _deliveryModes[0] ?? 'IN_APP';
    if (DEMO_MODE) {
      return Promise.resolve({ id: `ac-demo-${Date.now()}`, allotment_id: _allotmentId, author_id: _authorId, author_role: _authorRole, message: _message, document_urls: _documentUrls, delivery_mode: primaryMode, created_at: new Date().toISOString() });
    }
    const allotmentId = _allotmentId;
    const authorId = _authorId;
    const authorRole = _authorRole;
    const message = _message;
    const documentUrls = _documentUrls;
    const { data, error } = await supabase
      .from('quarter_allotment_chats')
      .insert({ allotment_id: allotmentId, author_id: authorId, author_role: authorRole, message, document_urls: documentUrls, delivery_mode: primaryMode })
      .select()
      .single();
    if (error) throw error;
    return data as QuarterAllotmentChat;
  },

  async createAndAllotNow(
    _eoId: string,
    input: CreateQuarterRequestInput,
    _quarterId: string,
  ): Promise<QuarterRequest> {
    if (DEMO_MODE) {
      const stub: QuarterRequest = { id: `req-demo-${Date.now()}`, request_number: `REQ-${new Date().getFullYear()}-DEMO`, employee_id: _eoId, cycle_id: input.cycle_id, initiation_type: 'ADHOC', request_type: 'GENERAL', request_reason: input.request_reason, required_bhk_config: input.required_bhk_config, preferred_location: input.preferred_location, move_in_date: input.move_in_date, family_member_count: input.family_member_count, request_status: 'ALLOTTED', sub_status: null, employee_notes: input.employee_notes, eo_notes: '', request_for: input.request_for ?? 'SELF', on_behalf_employee_id: null, on_behalf_employee_name: null, on_behalf_employee_dept: null, tp_name: null, tp_organization: null, tp_mobile: null, tp_email: null, tp_pan: null, tp_notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), preferences: [], allotment: null, medical_criticality: null };
      return Promise.resolve(stub);
    }
    const eoId = _eoId;
    const quarterId = _quarterId;
    const reqNumber = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const { data: req, error: reqErr } = await supabase
      .from('quarter_requests')
      .insert({
        employee_id: eoId,
        request_number: reqNumber,
        cycle_id: input.cycle_id,
        request_reason: input.request_reason,
        required_bhk_config: input.required_bhk_config,
        preferred_location: input.preferred_location,
        move_in_date: input.move_in_date,
        family_member_count: input.family_member_count,
        employee_notes: input.employee_notes,
        request_status: 'ALLOTTED',
        request_for: input.request_for ?? 'SELF',
        on_behalf_employee_id: input.on_behalf_employee_id ?? null,
        on_behalf_employee_name: input.on_behalf_employee_name ?? null,
        on_behalf_employee_dept: input.on_behalf_employee_dept ?? null,
        tp_name: input.tp_name ?? null,
        tp_organization: input.tp_organization ?? null,
        tp_mobile: input.tp_mobile ?? null,
        tp_email: input.tp_email ?? null,
        tp_pan: input.tp_pan ?? null,
        tp_notes: input.tp_notes ?? null,
      })
      .select()
      .single();
    if (reqErr) throw reqErr;

    if (input.preferences.length > 0) {
      const prefs = input.preferences.map(p => ({
        request_id: req.id,
        quarter_id: p.quarter_id,
        preference_rank: p.preference_rank,
        pref_status: 'PENDING',
      }));
      await supabase.from('quarter_request_preferences').insert(prefs);
    }

    const { error: allotErr } = await supabase.from('quarter_allotments').insert({
      request_id: req.id,
      quarter_id: quarterId,
      allotted_by: eoId,
      allotment_date: new Date().toISOString().split('T')[0],
      approval_status: 'APPROVED',
    });
    if (allotErr) throw allotErr;
    return req as QuarterRequest;
  },

  async manualAllotRequest(_requestId: string, _quarterId: string, _eoId: string, _conditions?: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const requestId = _requestId;
    const quarterId = _quarterId;
    const eoId = _eoId;
    const conditions = _conditions;
    const { error: allotErr } = await supabase.from('quarter_allotments').insert({
      request_id: requestId,
      quarter_id: quarterId,
      allotted_by: eoId,
      allotment_date: new Date().toISOString().split('T')[0],
      approval_status: 'PENDING',
      allotment_conditions: conditions ?? '',
    });
    if (allotErr) throw allotErr;
    const { error: reqErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'ALLOTTED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (reqErr) throw reqErr;
  },

  async getEmployeeUsers(): Promise<{ id: string; full_name: string; govt_department: string; govt_employee_id: string; email: string }[]> {
    if (DEMO_MODE) return Promise.resolve([]);
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, govt_department, govt_employee_id, email')
      .neq('role', 'admin')
      .order('full_name');
    if (error) throw error;
    return (data ?? []) as { id: string; full_name: string; govt_department: string; govt_employee_id: string; email: string }[];
  },

  async eoRejectRequest(_requestId: string, _eoId: string, _reason: string, _docUrl?: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const requestId = _requestId;
    const eoId = _eoId;
    const reason = _reason;
    const docUrl = _docUrl;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'DRAFT', sub_status: 'REJECTED', eo_notes: reason, updated_at: now })
      .eq('id', requestId);
    if (error) throw error;
    if (docUrl) {
      await supabase.from('quarter_allotment_chats').insert({
        allotment_id: requestId, author_id: eoId, author_role: 'eo',
        message: `Request rejected by EO. Reason: ${reason}`, document_urls: [docUrl],
      }).maybeSingle();
    }
  },

  async createAllotmentCycle(
    _cycleName: string, _startDate: string, _endDate: string, _createdBy: string,
  ): Promise<QuarterAllotmentCycle> {
    if (DEMO_MODE) return Promise.resolve(DEMO_CYCLE);
    const cycleName = _cycleName;
    const startDate = _startDate;
    const endDate = _endDate;
    const createdBy = _createdBy;
    const cycleCode = cycleName.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
    const { data, error } = await supabase
      .from('quarter_allotment_cycles')
      .insert({ cycle_name: cycleName, cycle_code: cycleCode, start_date: startDate, end_date: endDate, status: 'OPEN', created_by: createdBy })
      .select()
      .single();
    if (error) throw error;
    return data as QuarterAllotmentCycle;
  },

  async closeAllotmentCycle(_cycleId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const cycleId = _cycleId;
    const { error } = await supabase
      .from('quarter_allotment_cycles')
      .update({ status: 'CLOSED', updated_at: new Date().toISOString() })
      .eq('id', cycleId);
    if (error) throw error;
  },

  async runAllocationCycle(_eoId: string, _requests: QuarterRequest[], _cycleId?: string): Promise<{ allotted: number; skipped: number }> {
    if (DEMO_MODE) return Promise.resolve({ allotted: 0, skipped: 0 });
    const eoId = _eoId;
    const requests = _requests;
    const cycleId = _cycleId;
    let allotted = 0;
    let skipped = 0;
    for (const req of requests) {
      if (req.request_status !== 'SUBMITTED') { skipped++; continue; }
      if (!req.preferences || req.preferences.length === 0) { skipped++; continue; }
      if (req.allotment) { skipped++; continue; }
      const topPref = [...req.preferences].sort((a, b) => a.preference_rank - b.preference_rank)[0];
      const { error: allotErr } = await supabase.from('quarter_allotments').insert({
        request_id: req.id,
        quarter_id: topPref.quarter_id,
        allotted_by: eoId,
        allotment_date: new Date().toISOString().split('T')[0],
        approval_status: 'PENDING',
      });
      if (allotErr) { skipped++; continue; }
      const updatePayload: Record<string, unknown> = { request_status: 'ALLOTTED', updated_at: new Date().toISOString() };
      if (cycleId) updatePayload.cycle_id = cycleId;
      const { error: reqErr } = await supabase
        .from('quarter_requests')
        .update(updatePayload)
        .eq('id', req.id);
      if (reqErr) skipped++; else allotted++;
    }
    return { allotted, skipped };
  },

  async submitAllotments(_allotmentIds: string[], _workflowId: string | null, _eoId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const allotmentIds = _allotmentIds;
    const workflowId = _workflowId;
    const eoId = _eoId;
    const now = new Date().toISOString();
    if (!workflowId) {
      for (const id of allotmentIds) {
        await supabase.from('quarter_allotments').update({ approval_status: 'APPROVED', updated_at: now }).eq('id', id);
      }
    } else {
      const { data: wfl } = await supabase.from('quarter_approval_workflows').select('*').eq('id', workflowId).maybeSingle();
      const maxLevel = wfl ? (wfl.levels as { level: number }[]).length : 1;
      for (const id of allotmentIds) {
        await supabase.from('quarter_allotments').update({ approval_status: 'PENDING', updated_at: now }).eq('id', id);
        await supabase.from('quarter_allotment_approvals').insert({
          allotment_id: id, workflow_id: workflowId, current_level: 1,
          max_level: maxLevel, status: 'PENDING', initiated_by: eoId,
        });
      }
    }
  },

  async saveWorkflowForAllotment(_allotmentId: string, _workflowId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const { error } = await supabase
      .from('quarter_allotments')
      .update({ selected_workflow_id: _workflowId, updated_at: new Date().toISOString() })
      .eq('id', _allotmentId);
    if (error) throw error;
  },

  async initiateAllotmentApproval(_allotmentId: string, _workflowId: string, _eoId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const now = new Date().toISOString();
    const { data: wfl } = await supabase
      .from('quarter_approval_workflows')
      .select('*')
      .eq('id', _workflowId)
      .maybeSingle();
    const maxLevel = wfl ? (wfl.levels as { level: number }[]).length : 1;
    await supabase.from('quarter_allotments').update({ approval_status: 'PENDING', updated_at: now }).eq('id', _allotmentId);
    const { error } = await supabase.from('quarter_allotment_approvals').insert({
      allotment_id: _allotmentId, workflow_id: _workflowId, current_level: 1,
      max_level: maxLevel, status: 'PENDING', initiated_by: _eoId,
    });
    if (error) throw error;
  },

  async getApprovalWorkflows(): Promise<QuarterApprovalWorkflow[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_WORKFLOWS);
    const { data, error } = await supabase
      .from('quarter_approval_workflows')
      .select('*')
      .eq('is_active', true)
      .order('workflow_name');
    if (error) throw error;
    return (data ?? []) as QuarterApprovalWorkflow[];
  },

  async getApprovalForAllotment(_allotmentId: string): Promise<QuarterAllotmentApproval | null> {
    if (DEMO_MODE) return Promise.resolve(DEMO_APPROVALS.find(a => a.allotment_id === _allotmentId) ?? null);
    const allotmentId = _allotmentId;
    const { data, error } = await supabase
      .from('quarter_allotment_approvals')
      .select('*, workflow:quarter_approval_workflows(*)')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as QuarterAllotmentApproval | null;
  },

  async getApprovalChats(_approvalId: string): Promise<QuarterApprovalChat[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_APPROVAL_CHATS.filter(c => c.approval_id === _approvalId));
    const approvalId = _approvalId;
    const { data, error } = await supabase
      .from('quarter_approval_chats')
      .select('*')
      .eq('approval_id', approvalId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuarterApprovalChat[];
  },

  async addApprovalChat(_approvalId: string, _authorId: string, _authorRole: string, _message: string, _docUrls: string[] = []): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const approvalId = _approvalId;
    const authorId = _authorId;
    const authorRole = _authorRole;
    const message = _message;
    const docUrls = _docUrls;
    const { error } = await supabase.from('quarter_approval_chats').insert({
      approval_id: approvalId, author_id: authorId, author_role: authorRole, message, document_urls: docUrls,
    });
    if (error) throw error;
  },

  async approveAllotmentLevel(_approvalId: string, _approverId: string, _remarks: string): Promise<void> {
    if (DEMO_MODE) {
      const approval = DEMO_APPROVALS.find(a => a.id === _approvalId) ?? (DEMO_APPROVAL_RECORD.id === _approvalId ? DEMO_APPROVAL_RECORD : null);
      if (approval) {
        const isLastLevel = approval.current_level >= approval.max_level;
        const now = new Date().toISOString();
        const chatMsg = `Level ${approval.current_level} approved${_remarks ? `. ${_remarks}` : ''}.`;
        DEMO_APPROVAL_CHATS.push({ id: `achat-${Date.now()}`, approval_id: approval.id, author_id: _approverId, author_role: 'approver', message: chatMsg, document_urls: [], created_at: now });
        if (isLastLevel) {
          approval.status = 'APPROVED';
          approval.updated_at = now;
          // Mark the allotment as approved so it leaves the unapproved filter
          const allotment = DEMO_APPROVALS[0]; // find by allotment_id in real flow
          const reqWithAllotment = DEMO_REQUESTS.find(r => r.allotment?.id === approval.allotment_id);
          if (reqWithAllotment?.allotment) reqWithAllotment.allotment.approval_status = 'APPROVED';
        } else {
          approval.current_level += 1;
          approval.updated_at = now;
        }
      }
      return Promise.resolve();
    }
    const approvalId = _approvalId;
    const approverId = _approverId;
    const remarks = _remarks;
    const { data: approval } = await supabase.from('quarter_allotment_approvals').select('*').eq('id', approvalId).maybeSingle();
    if (!approval) throw new Error('Approval record not found');
    const now = new Date().toISOString();
    const isLastLevel = approval.current_level >= approval.max_level;
    const newStatus = isLastLevel ? 'APPROVED' : 'PENDING';
    const newLevel = isLastLevel ? approval.current_level : approval.current_level + 1;
    await supabase.from('quarter_allotment_approvals').update({ current_level: newLevel, status: newStatus, updated_at: now }).eq('id', approvalId);
    await supabase.from('quarter_approval_chats').insert({
      approval_id: approvalId, author_id: approverId, author_role: 'approver',
      message: `Level ${approval.current_level} approved. ${remarks}`.trim(), document_urls: [],
    });
    if (isLastLevel) {
      await supabase.from('quarter_allotments').update({ approval_status: 'APPROVED', updated_at: now }).eq('id', approval.allotment_id);
    }
  },

  async sendClarification(_approvalId: string, _targetLevel: number, _remarks: string, _senderId: string): Promise<void> {
    if (DEMO_MODE) {
      const approval = DEMO_APPROVALS.find(a => a.id === _approvalId) ?? (DEMO_APPROVAL_RECORD.id === _approvalId ? DEMO_APPROVAL_RECORD : null);
      if (approval) {
        const now = new Date().toISOString();
        const levelTitle = approval.workflow?.levels?.find(l => l.level === _targetLevel)?.approver_title ?? `Level ${_targetLevel}`;
        const chatMsg = `Sent for clarification to ${levelTitle}${_remarks ? `. ${_remarks}` : ''}.`;
        DEMO_APPROVAL_CHATS.push({ id: `achat-${Date.now()}`, approval_id: approval.id, author_id: _senderId, author_role: 'eo', message: chatMsg, document_urls: [], created_at: now });
        approval.current_level = _targetLevel;
        approval.status = 'PENDING';
        approval.updated_at = now;
      }
      return Promise.resolve();
    }
    const approvalId = _approvalId;
    const targetLevel = _targetLevel;
    const remarks = _remarks;
    const senderId = _senderId;
    const now = new Date().toISOString();
    await supabase.from('quarter_allotment_approvals').update({ current_level: targetLevel, status: 'PENDING', updated_at: now }).eq('id', approvalId);
    await supabase.from('quarter_approval_chats').insert({
      approval_id: approvalId, author_id: senderId, author_role: 'eo',
      message: `Sent for clarification to level ${targetLevel}. ${remarks}`.trim(), document_urls: [],
    });
  },

  // ─── Request-level Approval Workflow ────────────────────────────────────────

  async getApprovalForRequest(_requestId: string): Promise<QuarterRequestApproval | null> {
    if (DEMO_MODE) return Promise.resolve(null);
    const { data, error } = await supabase
      .from('quarter_request_approvals')
      .select('*, workflow:quarter_approval_workflows(*)')
      .eq('request_id', _requestId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as QuarterRequestApproval | null;
  },

  async getRequestApprovalChats(_requestApprovalId: string): Promise<QuarterRequestApprovalChat[]> {
    if (DEMO_MODE) return Promise.resolve([]);
    const { data, error } = await supabase
      .from('quarter_request_approval_chats')
      .select('*')
      .eq('request_approval_id', _requestApprovalId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuarterRequestApprovalChat[];
  },

  async submitRequestsForApproval(_requestIds: string[], _workflowId: string | null, _eoId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const now = new Date().toISOString();
    const workflowId = _workflowId;
    let maxLevel = 1;
    if (workflowId) {
      const { data: wfl } = await supabase.from('quarter_approval_workflows').select('levels').eq('id', workflowId).maybeSingle();
      if (wfl) maxLevel = (wfl.levels as { level: number }[]).length;
    }
    for (const rid of _requestIds) {
      const { data: inserted } = await supabase.from('quarter_request_approvals').insert({
        request_id: rid, workflow_id: workflowId, current_level: 1, max_level: maxLevel,
        status: 'PENDING', initiated_by: _eoId, updated_at: now,
      }).select().maybeSingle();
      if (inserted) {
        await supabase.from('quarter_request_approval_chats').insert({
          request_approval_id: inserted.id, author_id: _eoId, author_role: 'eo',
          action_type: 'INITIATE', level_snapshot: 1,
          message: `Approval workflow initiated (${maxLevel}-level).`, document_urls: [],
        });
      }
    }
  },

  async approveRequestLevel(_requestApprovalId: string, _approverId: string, _remarks: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const { data: approval } = await supabase.from('quarter_request_approvals').select('*').eq('id', _requestApprovalId).maybeSingle();
    if (!approval) throw new Error('Request approval record not found');
    const now = new Date().toISOString();
    const isLastLevel = approval.current_level >= approval.max_level;
    const newStatus = isLastLevel ? 'APPROVED' : 'PENDING';
    const newLevel = isLastLevel ? approval.current_level : approval.current_level + 1;
    await supabase.from('quarter_request_approvals').update({ current_level: newLevel, status: newStatus, updated_at: now }).eq('id', _requestApprovalId);
    await supabase.from('quarter_request_approval_chats').insert({
      request_approval_id: _requestApprovalId, author_id: _approverId, author_role: 'approver',
      action_type: 'APPROVE', level_snapshot: approval.current_level,
      message: `Level ${approval.current_level} approved.${_remarks ? ` ${_remarks}` : ''}`, document_urls: [],
    });
  },

  async sendRequestClarification(_requestApprovalId: string, _targetLevel: number, _remarks: string, _senderId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const now = new Date().toISOString();
    await supabase.from('quarter_request_approvals').update({ current_level: _targetLevel, status: 'PENDING', updated_at: now }).eq('id', _requestApprovalId);
    await supabase.from('quarter_request_approval_chats').insert({
      request_approval_id: _requestApprovalId, author_id: _senderId, author_role: 'eo',
      action_type: 'CLARIFY', level_snapshot: _targetLevel,
      message: `Sent for clarification to level ${_targetLevel}.${_remarks ? ` ${_remarks}` : ''}`, document_urls: [],
    });
  },

  async getInspections(_allotmentId: string): Promise<QuarterInspection[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_INSPECTIONS.filter(i => i.allotment_id === _allotmentId));
    const allotmentId = _allotmentId;
    const { data, error } = await supabase
      .from('quarter_inspections')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterInspection[];
  },

  async startInspection(_allotmentId: string, _createdBy: string, _openingRemarks: string, _inspectorName = ''): Promise<QuarterInspection> {
    if (DEMO_MODE) return Promise.resolve({ id: `insp-demo-${Date.now()}`, allotment_id: _allotmentId, created_by: _createdBy, status: 'OPEN', inspector_name: _inspectorName, opening_remarks: _openingRemarks, closing_remarks: '', property_condition: '', created_at: new Date().toISOString(), closed_at: null });
    const { data, error } = await supabase.from('quarter_inspections').insert({
      allotment_id: _allotmentId,
      created_by: _createdBy,
      status: 'OPEN',
      inspector_name: _inspectorName,
      opening_remarks: _openingRemarks,
      property_condition: '',
    }).select().single();
    if (error) throw error;
    return data as QuarterInspection;
  },

  async closeInspection(_inspectionId: string, _closingRemarks: string, _propertyCondition: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const inspectionId = _inspectionId;
    const closingRemarks = _closingRemarks;
    const propertyCondition = _propertyCondition;
    const now = new Date().toISOString();
    const { error } = await supabase.from('quarter_inspections').update({
      status: 'CLOSED', closing_remarks: closingRemarks, property_condition: propertyCondition, closed_at: now,
    }).eq('id', inspectionId);
    if (error) throw error;
  },

  async getInspectionChats(_inspectionId: string): Promise<QuarterInspectionChat[]> {
    if (DEMO_MODE) return Promise.resolve([]);
    const inspectionId = _inspectionId;
    const { data, error } = await supabase
      .from('quarter_inspection_chats')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuarterInspectionChat[];
  },

  async addInspectionChat(_inspectionId: string, _authorId: string, _authorRole: string, _message: string, _docUrls: string[] = [], _deliveryModes: ChatDeliveryMode[] = ['IN_APP']): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const primaryMode = _deliveryModes[0] ?? 'IN_APP';
    const { error } = await supabase.from('quarter_inspection_chats').insert({
      inspection_id: _inspectionId, author_id: _authorId, author_role: _authorRole, message: _message, document_urls: _docUrls, delivery_mode: primaryMode,
    });
    if (error) throw error;
  },

  async saveChecklistItems(_inspectionId: string, _items: ChecklistItemDraft[]): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const rows = _items.map(item => ({
      inspection_id: _inspectionId,
      category: item.category,
      item_name: item.item_name,
      default_qty: item.default_qty,
      actual_qty: item.actual_qty,
      qty_label: item.qty_label,
      is_checked: item.is_checked,
      remarks: item.remarks,
    }));
    const { error } = await supabase.from('quarter_inspection_checklist_items').insert(rows);
    if (error) throw error;
  },

  async getChecklistItems(_inspectionId: string): Promise<QuarterInspectionChecklistItem[]> {
    if (DEMO_MODE) return Promise.resolve([]);
    const { data, error } = await supabase
      .from('quarter_inspection_checklist_items')
      .select('*')
      .eq('inspection_id', _inspectionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuarterInspectionChecklistItem[];
  },

  async updateChecklistItem(_itemId: string, patch: Partial<Pick<QuarterInspectionChecklistItem, 'actual_qty' | 'is_checked' | 'remarks'>>): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const { error } = await supabase
      .from('quarter_inspection_checklist_items')
      .update(patch)
      .eq('id', _itemId);
    if (error) throw error;
  },

  async getHandover(_allotmentId: string): Promise<QuarterHandover | null> {
    if (DEMO_MODE) return Promise.resolve(_allotmentId === 'allot-002' ? DEMO_HANDOVER : null);
    const allotmentId = _allotmentId;
    const { data, error } = await supabase
      .from('quarter_handovers')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as QuarterHandover | null;
  },

  async createHandover(_allotmentId: string, _createdBy: string, input: {
    key_number: string;
    remarks: string;
    occupying_deadline: string;
    interior_doc_url?: string;
    inspection_report_url?: string;
  }): Promise<QuarterHandover> {
    if (DEMO_MODE) return Promise.resolve({ id: `hov-demo-${Date.now()}`, allotment_id: _allotmentId, created_by: _createdBy, key_number: input.key_number, remarks: input.remarks, occupying_deadline: input.occupying_deadline, interior_doc_url: input.interior_doc_url ?? '', inspection_report_url: input.inspection_report_url ?? '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const allotmentId = _allotmentId;
    const createdBy = _createdBy;
    const { data, error } = await supabase.from('quarter_handovers').insert({
      allotment_id: allotmentId, created_by: createdBy, ...input,
    }).select().single();
    if (error) throw error;
    await supabase.from('quarter_allotments').update({ approval_status: 'ACKNOWLEDGED', updated_at: new Date().toISOString() }).eq('id', allotmentId);
    return data as QuarterHandover;
  },

  async getGuestInfo(_allotmentId: string): Promise<QuarterGuestInfo[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_GUEST_INFO);
    const allotmentId = _allotmentId;
    const { data, error } = await supabase
      .from('quarter_guest_info')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterGuestInfo[];
  },

  async addGuestInfo(_allotmentId: string, _createdBy: string, input: {
    guest_name: string;
    guest_mobile: string;
    guest_email: string;
    aadhaar_doc_url?: string;
    pan_doc_url?: string;
    other_doc_urls?: string[];
  }): Promise<QuarterGuestInfo> {
    if (DEMO_MODE) return Promise.resolve({ id: `gi-demo-${Date.now()}`, allotment_id: _allotmentId, guest_name: input.guest_name, guest_mobile: input.guest_mobile, guest_email: input.guest_email, aadhaar_doc_url: input.aadhaar_doc_url ?? '', pan_doc_url: input.pan_doc_url ?? '', other_doc_urls: input.other_doc_urls ?? [], created_by: _createdBy, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const allotmentId = _allotmentId;
    const createdBy = _createdBy;
    const { data, error } = await supabase.from('quarter_guest_info').insert({
      allotment_id: allotmentId, created_by: createdBy,
      guest_name: input.guest_name, guest_mobile: input.guest_mobile, guest_email: input.guest_email,
      aadhaar_doc_url: input.aadhaar_doc_url ?? '', pan_doc_url: input.pan_doc_url ?? '',
      other_doc_urls: input.other_doc_urls ?? [],
    }).select().single();
    if (error) throw error;
    return data as QuarterGuestInfo;
  },

  async removeGuestInfo(_guestInfoId: string): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const guestInfoId = _guestInfoId;
    const { error } = await supabase.from('quarter_guest_info').delete().eq('id', guestInfoId);
    if (error) throw error;
  },

  async createQuarter(input: CreateQuarterInput): Promise<Quarter> {
    const { data, error } = await supabase
      .from('quarters')
      .insert({
        ...input,
        occupancy_status: 'AVAILABLE',
        is_active: true,
        amenities: [],
        images: [],
        metadata: {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as Quarter;
  },

  async createExchangePair(
    tenantRequestId: string,
    partnerQuarterNumber: string,
    justificationDocUrl: string,
    workflowId: string | null,
  ): Promise<void> {
    if (DEMO_MODE) return Promise.resolve();
    const { error } = await supabase
      .from('quarter_exchange_pairs')
      .insert({
        primary_tenant_request_id: tenantRequestId,
        partner_quarter_number: partnerQuarterNumber,
        justification_doc_url: justificationDocUrl,
        workflow_id: workflowId,
      });
    if (error) throw error;
  },

  async getExchangePair(tenantRequestId: string): Promise<import('../types/quarters').QuarterExchangePair | null> {
    if (DEMO_MODE) return Promise.resolve(null);
    const { data, error } = await supabase
      .from('quarter_exchange_pairs')
      .select('*')
      .eq('primary_tenant_request_id', tenantRequestId)
      .maybeSingle();
    if (error) throw error;
    return data as import('../types/quarters').QuarterExchangePair | null;
  },

  async setMedicalCriticality(requestId: string, criticality: MedicalCriticality | null): Promise<void> {
    if (DEMO_MODE) {
      const req = DEMO_REQUESTS.find(r => r.id === requestId);
      if (req) (req as QuarterRequest & { medical_criticality: MedicalCriticality | null }).medical_criticality = criticality;
      return Promise.resolve();
    }
    const { error } = await supabase
      .from('quarter_requests')
      .update({ medical_criticality: criticality, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async updateQuarterImages(quarterId: string, urls: string[]): Promise<void> {
    const { error } = await supabase
      .from('quarters')
      .update({ images: urls })
      .eq('id', quarterId);
    if (error) throw error;
  },

  async getDesignationName(designationId: string): Promise<string> {
    if (!designationId) return '';
    const { data, error } = await supabase
      .from('designation_master')
      .select('designation_name')
      .eq('id', designationId)
      .maybeSingle();
    if (error || !data) return '';
    return (data as any).designation_name ?? '';
  },

  // ─── Rent Tracker ───────────────────────────────────────────────────────────

  async getRentTrackerTiles(filters?: {
    monthFrom?: string; monthTo?: string;
    location?: string; paymentMode?: string; tenant?: string;
    status?: string; tenantId?: string;
  }): Promise<RentTile[]> {
    if (DEMO_MODE) {
      let tiles = [...DEMO_RENT_TILES];
      if (filters?.tenantId) tiles = tiles.filter(t => t.tenant_id === filters.tenantId);
      if (filters?.monthFrom) tiles = tiles.filter(t => t.month >= filters.monthFrom!);
      if (filters?.monthTo)   tiles = tiles.filter(t => t.month <= filters.monthTo!);
      if (filters?.location)  tiles = tiles.filter(t =>
        t.location_area.toLowerCase().includes(filters.location!.toLowerCase()) ||
        t.block_name.toLowerCase().includes(filters.location!.toLowerCase()));
      if (filters?.paymentMode && filters.paymentMode !== 'ALL')
        tiles = tiles.filter(t => t.payment_mode === filters.paymentMode || t.status === filters.paymentMode);
      if (filters?.tenant) {
        const q = filters.tenant.toLowerCase();
        tiles = tiles.filter(t =>
          t.tenant_name.toLowerCase().includes(q) || t.tenant_id.toLowerCase().includes(q));
      }
      if (filters?.status && filters.status !== 'ALL')
        tiles = tiles.filter(t => t.status === filters.status);
      return Promise.resolve(tiles);
    }
    return Promise.resolve([]);
  },

  async getRentTrackerSummary(_filters?: object): Promise<RentTrackerSummary> {
    if (DEMO_MODE) return Promise.resolve(DEMO_RENT_TRACKER_SUMMARY);
    return Promise.resolve(DEMO_RENT_TRACKER_SUMMARY);
  },

  async getRentDueDetail(tileId: string): Promise<RentDueDetail> {
    if (DEMO_MODE) {
      const tile = DEMO_RENT_TILES.find(t => t.id === tileId);
      const base = tile?.base_rent ?? 0;
      const water = tile?.water_charges ?? 0;
      const util = tile?.utility_charges ?? 0;
      const pen = tile?.penalty_amount ?? 0;
      const penOvr = tile?.penalty_override ?? null;
      const net = base + water + util + (penOvr ?? pen);

      // Build monthly_dues from all tiles for this allotment (all months)
      const monthly_dues: import('../types/quarters').RentDueMonthEntry[] = [];
      if (tile) {
        const allotmentTiles = DEMO_RENT_TILES
          .filter(t => t.allotment_id === tile.allotment_id)
          .sort((a, b) => a.month.localeCompare(b.month));
        allotmentTiles.forEach((t) => {
          const isPending = t.status === 'DUE' || t.status === 'OVERDUE';
          const [yr, mo] = t.month.split('-');
          const dateStr = `01-${mo}-${yr}`;
          const rent = t.base_rent;
          const waterCharges = t.water_charges ?? 0;
          const utility = t.utility_charges ?? 0;
          const penalty = t.penalty_override ?? t.penalty_amount;
          const maintenance = t.maintenance_charge ?? 0;
          const total = rent + waterCharges + utility + penalty + maintenance;
          const due = isPending ? Math.max(0, total - (t.amount_paid ?? 0)) : 0;
          let statusLabel: string;
          let statusColor: string;
          if (t.status === 'PAID') {
            statusLabel = 'Paid'; statusColor = 'bg-emerald-100 text-emerald-700';
          } else if (t.status === 'EXEMPTED') {
            statusLabel = 'Exempted'; statusColor = 'bg-slate-100 text-slate-600';
          } else if (t.status === 'PARTIAL') {
            statusLabel = 'Pending'; statusColor = 'bg-amber-100 text-amber-700';
          } else if (t.status === 'OVERDUE') {
            statusLabel = 'Overdue'; statusColor = 'bg-red-100 text-red-700';
          } else {
            statusLabel = 'Pending'; statusColor = 'bg-amber-100 text-amber-700';
          }
          monthly_dues.push({ month: t.month, date: dateStr, rent, waterCharges, electricityCharges: utility, penalty, maintenance, total, due, statusLabel, statusColor, isPending });
        });
      }

      return Promise.resolve({
        tile_id: tileId, base_rent: base, water_charges: water,
        utility_charges: util, months_overdue: tile?.status === 'OVERDUE' ? 1 : 0,
        penalty_rate: 2, penalty_amount: pen, penalty_override: penOvr,
        waiver_amount: 0, net_payable: net, eo_remarks: DEMO_EO_REMARKS[tileId] ?? '',
        monthly_dues,
      });
    }
    return Promise.resolve({ tile_id: tileId, base_rent: 0, water_charges: 0, utility_charges: 0, months_overdue: 0, penalty_rate: 2, penalty_amount: 0, penalty_override: null, waiver_amount: 0, net_payable: 0, eo_remarks: '' });
  },

  async getRentPaymentHistory(allotmentId: string, month: string): Promise<RentPayment[]> {
    if (DEMO_MODE) {
      const key = `${allotmentId}_${month}`;
      return Promise.resolve(DEMO_RENT_PAYMENTS[key] ?? []);
    }
    return Promise.resolve([]);
  },

  async getRentPaymentHistoryAll(allotmentId: string): Promise<RentPayment[]> {
    if (DEMO_MODE) {
      const prefix = `${allotmentId}_`;
      const all: RentPayment[] = [];
      for (const key of Object.keys(DEMO_RENT_PAYMENTS)) {
        if (key.startsWith(prefix)) all.push(...DEMO_RENT_PAYMENTS[key]);
      }
      all.sort((a, b) => b.payment_date.localeCompare(a.payment_date));
      return Promise.resolve(all);
    }
    return Promise.resolve([]);
  },

  async getRentClarifications(allotmentId: string, month: string): Promise<RentClarification[]> {
    if (DEMO_MODE) {
      const key = `${allotmentId}_${month}`;
      return Promise.resolve(DEMO_RENT_CLARIFICATIONS[key] ?? []);
    }
    return Promise.resolve([]);
  },

  async postRentClarification(allotmentId: string, month: string, message: string, authorRole: 'TENANT' | 'EO', authorName: string): Promise<RentClarification> {
    const newMsg: RentClarification = {
      id: `rc-${Date.now()}`, allotment_id: allotmentId, month,
      author_role: authorRole, author_name: authorName,
      message, created_at: new Date().toISOString(),
    };
    if (DEMO_MODE) {
      const key = `${allotmentId}_${month}`;
      if (!DEMO_RENT_CLARIFICATIONS[key]) DEMO_RENT_CLARIFICATIONS[key] = [];
      DEMO_RENT_CLARIFICATIONS[key].push(newMsg);
      return Promise.resolve(newMsg);
    }
    return Promise.resolve(newMsg);
  },

  async applyPenaltyOverride(tileId: string, override: number, remarks: string): Promise<void> {
    if (DEMO_MODE) {
      const tile = DEMO_RENT_TILES.find(t => t.id === tileId);
      if (tile) {
        tile.penalty_override = override;
        tile.total_due = tile.base_rent + tile.water_charges + tile.utility_charges + override;
      }
      DEMO_EO_REMARKS[tileId] = remarks;
      return Promise.resolve();
    }
  },

  async undoRentPayment(allotmentId: string, month: string, paymentId: string, _reason?: string): Promise<void> {
    if (DEMO_MODE) {
      const key = `${allotmentId}_${month}`;
      if (DEMO_RENT_PAYMENTS[key]) {
        DEMO_RENT_PAYMENTS[key] = DEMO_RENT_PAYMENTS[key].filter(p => p.id !== paymentId);
      }
      const tile = DEMO_RENT_TILES.find(t => t.allotment_id === allotmentId && t.month === month);
      if (tile) {
        const remaining = DEMO_RENT_PAYMENTS[key] ?? [];
        const totalRemaining = remaining.reduce((s, p) => s + p.amount, 0);
        if (totalRemaining <= 0) {
          tile.status = 'DUE';
          tile.amount_paid = 0;
          tile.receipt_ref = null;
          tile.last_paid_date = null;
          tile.payment_mode = null;
        } else {
          tile.status = 'PARTIAL';
          tile.amount_paid = totalRemaining;
          const last = remaining[remaining.length - 1];
          tile.receipt_ref = last?.receipt_ref ?? null;
          tile.last_paid_date = last?.payment_date ?? null;
          tile.payment_mode = last?.payment_mode ?? null;
        }
      }
      return Promise.resolve();
    }
  },

  async submitEPayment(allotmentId: string, month: string, amount: number, mode: string): Promise<RentPayment> {
    const payment: RentPayment = {
      id: `pay-${Date.now()}`, allotment_id: allotmentId, month,
      amount, payment_mode: mode as RentPayment['payment_mode'],
      payment_date: new Date().toISOString().slice(0, 10),
      receipt_ref: `RCP-${Date.now()}`, remarks: 'Online payment', recorded_by: 'System',
    };
    if (DEMO_MODE) {
      const earlierPendingMonth = getEarlierPendingRentMonth(allotmentId, month);
      if (earlierPendingMonth) {
        throw new Error(`Please clear the pending dues for ${earlierPendingMonth} before paying for ${month}.`);
      }
      const key = `${allotmentId}_${month}`;
      if (!DEMO_RENT_PAYMENTS[key]) DEMO_RENT_PAYMENTS[key] = [];
      DEMO_RENT_PAYMENTS[key].push(payment);
      const tile = DEMO_RENT_TILES.find(t => t.allotment_id === allotmentId && t.month === month);
      if (tile) {
        tile.amount_paid = amount;
        tile.status = amount >= tile.total_due ? 'PAID' : 'PARTIAL';
        tile.last_paid_date = payment.payment_date;
        tile.receipt_ref = payment.receipt_ref;
        tile.payment_mode = payment.payment_mode;
      }
      return Promise.resolve(payment);
    }
    return Promise.resolve(payment);
  },

  async getRentData(_allotmentId: string): Promise<{ summary: RentSummary; records: RentRecord[] }> {
    if (DEMO_MODE) {
      return Promise.resolve({ summary: DEMO_RENT_SUMMARY, records: DEMO_RENT_RECORDS });
    }
    const allotmentId = _allotmentId;
    const { data, error } = await supabase
      .from('rent_ledger')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('month', { ascending: false });
    if (error) throw error;
    const records: RentRecord[] = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      allotment_id: r.allotment_id as string,
      month: r.month as string,
      amount_due: (r.amount_due as number) ?? 0,
      amount_paid: (r.amount_paid as number) ?? 0,
      status: (r.status as RentRecord['status']) ?? 'PENDING',
      due_date: r.due_date as string,
      payment_date: (r.payment_date as string) ?? null,
      receipt_ref: (r.receipt_ref as string) ?? null,
      remarks: (r.remarks as string) ?? '',
    }));
    const totalPaid = records.filter(r => r.status === 'PAID').reduce((s, r) => s + r.amount_paid, 0);
    const arrears = records.filter(r => r.status !== 'PAID').reduce((s, r) => s + (r.amount_due - r.amount_paid), 0);
    const lastPaid = records.find(r => r.payment_date);
    const current = records[0];
    const summary: RentSummary = {
      current_month_due: current?.amount_due ?? 0,
      total_paid_ytd: totalPaid,
      outstanding_arrears: arrears,
      last_payment_date: lastPaid?.payment_date ?? null,
      next_due_date: current?.due_date ?? '',
      penalty_rate: '2% per month',
      months_paid: records.filter(r => r.status === 'PAID').length,
      months_overdue: records.filter(r => r.status === 'OVERDUE').length,
    };
    return { summary, records };
  },

  // ─── Installment Plans ──────────────────────────────────────────────────────

  async getPaymentConfig(key: string): Promise<number> {
    if (DEMO_MODE) {
      if (key === 'penalty_max_discount_pct') return Promise.resolve(25);
      return Promise.resolve(0);
    }
    const { data } = await supabase.from('payment_config').select('value').eq('key', key).maybeSingle();
    return data ? Number(data.value) : 0;
  },

  async getInstallmentPlan(allotmentId: string, month: string): Promise<InstallmentPlan | null> {
    if (DEMO_MODE) {
      const key = `${allotmentId}_${month}`;
      return Promise.resolve(DEMO_INSTALLMENT_PLANS[key] ?? null);
    }
    const { data: plan } = await supabase
      .from('quarter_installment_plans')
      .select('*')
      .eq('allotment_id', allotmentId)
      .eq('month', month)
      .maybeSingle();
    if (!plan) return null;
    const { data: rowData } = await supabase
      .from('quarter_installment_rows')
      .select('*')
      .eq('plan_id', plan.id)
      .order('row_number');
    const rows: InstallmentRow[] = (rowData ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      plan_id: r.plan_id as string,
      row_number: r.row_number as number,
      label: r.label as string,
      percentage: r.percentage as number,
      amount: r.amount as number,
      due_date: (r.due_date as string) ?? null,
      paid_date: (r.paid_date as string) ?? null,
      paid_amt: r.paid_amt as number,
      remaining_amount: r.remaining_amount as number,
      status: r.status as InstallmentRow['status'],
      late_fee: r.late_fee as number,
      due_date_with_late_fee: (r.due_date_with_late_fee as string) ?? null,
      gst_amount: r.gst_amount as number,
    }));
    const paidCount = rows.filter(r => r.row_number > 0 && r.status === 'PAID').length;
    const dueCount  = rows.filter(r => r.row_number > 0 && r.status !== 'PAID').length;
    return {
      id: plan.id as string,
      allotment_id: plan.allotment_id as string,
      month: plan.month as string,
      installment_start_date: (plan.installment_start_date as string) ?? null,
      late_fee: plan.late_fee as number,
      due_days_with_late_fee: plan.due_days_with_late_fee as number,
      interest_pct_pa: plan.interest_pct_pa as number,
      discount_full_payment_pct: plan.discount_full_payment_pct as number,
      gst_pct: plan.gst_pct as number,
      gst_type: plan.gst_type as 'inclusive' | 'exclusive',
      balance_payment: plan.balance_payment as number,
      emd: plan.emd as number,
      no_of_installments: plan.no_of_installments as number,
      created_by: (plan.created_by as string) ?? null,
      created_at: plan.created_at as string,
      rows,
      installments_paid: paidCount,
      installments_due: dueCount,
    };
  },

  async createInstallmentPlan(
    allotmentId: string,
    month: string,
    config: Omit<InstallmentPlan, 'id'|'allotment_id'|'month'|'created_by'|'created_at'|'rows'|'installments_paid'|'installments_due'>,
    rows: Pick<InstallmentRow, 'row_number'|'label'|'percentage'|'amount'|'due_date'>[],
  ): Promise<InstallmentPlan> {
    if (DEMO_MODE) {
      const planId = `ip-${Date.now()}`;
      const fullRows: InstallmentRow[] = rows.map(r => ({
        id: `ir-${Date.now()}-${r.row_number}`,
        plan_id: planId,
        row_number: r.row_number,
        label: r.label,
        percentage: r.percentage,
        amount: r.amount,
        due_date: r.due_date,
        paid_date: null,
        paid_amt: 0,
        remaining_amount: r.amount,
        status: 'PENDING' as const,
        late_fee: 0,
        due_date_with_late_fee: null,
        gst_amount: 0,
      }));
      return Promise.resolve({
        id: planId,
        allotment_id: allotmentId,
        month,
        ...config,
        created_by: null,
        created_at: new Date().toISOString(),
        rows: fullRows,
        installments_paid: 0,
        installments_due: rows.filter(r => r.row_number > 0).length,
      });
    }
    const { data: plan, error } = await supabase
      .from('quarter_installment_plans')
      .insert({
        allotment_id: allotmentId,
        month,
        installment_start_date: config.installment_start_date,
        late_fee: config.late_fee,
        due_days_with_late_fee: config.due_days_with_late_fee,
        interest_pct_pa: config.interest_pct_pa,
        discount_full_payment_pct: config.discount_full_payment_pct,
        gst_pct: config.gst_pct,
        gst_type: config.gst_type,
        balance_payment: config.balance_payment,
        emd: config.emd,
        no_of_installments: config.no_of_installments,
      })
      .select()
      .single();
    if (error) throw error;
    const rowInserts = rows.map(r => ({
      plan_id: (plan as Record<string,unknown>).id as string,
      row_number: r.row_number,
      label: r.label,
      percentage: r.percentage,
      amount: r.amount,
      due_date: r.due_date,
    }));
    await supabase.from('quarter_installment_rows').insert(rowInserts);
    return this.getInstallmentPlan(allotmentId, month) as Promise<InstallmentPlan>;
  },

  async payInstallmentRow(planId: string, rowId: string, amount: number, mode: string): Promise<void> {
    if (DEMO_MODE) {
      const planForPayment = Object.values(DEMO_INSTALLMENT_PLANS).find(plan => plan.id === planId);
      if (planForPayment) {
        const earlierPendingMonth = getEarlierPendingRentMonth(planForPayment.allotment_id, planForPayment.month);
        if (earlierPendingMonth) {
          throw new Error(`Please clear the pending dues for ${earlierPendingMonth} before paying for ${planForPayment.month}.`);
        }
      }
      for (const key of Object.keys(DEMO_INSTALLMENT_PLANS)) {
        const plan = DEMO_INSTALLMENT_PLANS[key];
        if (plan.id !== planId) continue;
        const row = plan.rows.find(r => r.id === rowId);
        if (row) {
          row.paid_amt = amount;
          row.remaining_amount = Math.max(0, row.amount - amount);
          row.status = amount >= row.amount ? 'PAID' : 'DUE';
          row.paid_date = new Date().toISOString().slice(0, 10);
          plan.installments_paid = plan.rows.filter(r => r.row_number > 0 && r.status === 'PAID').length;
          plan.installments_due  = plan.rows.filter(r => r.row_number > 0 && r.status !== 'PAID').length;
        }
        // Also record as a tile payment
        const tile = DEMO_RENT_TILES.find(t => t.allotment_id === plan.allotment_id && t.month === plan.month);
        if (tile) {
          const totalPaid = plan.rows.filter(r => r.row_number > 0).reduce((s, r) => s + r.paid_amt, 0);
          tile.amount_paid = totalPaid;
          tile.status = totalPaid >= tile.total_due ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : tile.status;
          tile.last_paid_date = new Date().toISOString().slice(0, 10);
        }
        const paymentKey = `${plan.allotment_id}_${plan.month}`;
        if (!DEMO_RENT_PAYMENTS[paymentKey]) DEMO_RENT_PAYMENTS[paymentKey] = [];
        DEMO_RENT_PAYMENTS[paymentKey].push({
          id: `ipay-${Date.now()}`,
          allotment_id: plan.allotment_id,
          month: plan.month,
          amount,
          payment_mode: mode as RentPayment['payment_mode'],
          payment_date: new Date().toISOString().slice(0, 10),
          receipt_ref: `RCP-INST-${Date.now()}`,
          remarks: `Installment row ${rowId}`,
          recorded_by: 'System',
        });
        break;
      }
      return Promise.resolve();
    }
    await supabase.from('quarter_installment_rows').update({
      paid_amt: amount,
      paid_date: new Date().toISOString().slice(0, 10),
      status: 'PAID',
    }).eq('id', rowId);
  },

  getDemoGovtOfficialTenantId(): string {
    return DEMO_GOVT_OFFICIAL_TENANT_ID;
  },
};

