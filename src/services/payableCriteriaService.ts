import { supabase } from '../lib/supabase';
import type {
  PayableCriteria,
  PayableCriteriaInput,
  PayableFullPaymentSpec,
  PayableAdvanceSpec,
  PayableInstallmentSpec,
  PayablePenaltySlab,
  PayableAlertSpec,
  PayableIncreaseSpec,
  PayableInstalmentGridRow,
  PayableCollectionException,
} from '../types/payableCriteria';

const TABLE = 'payable_criteria_mt';
const FULL = 'payable_full_payment_specs';
const ADVANCE = 'payable_advance_specs';
const INSTALLMENT = 'payable_installment_specs';
const PENALTY = 'payable_penalty_slabs';
const ALERT = 'payable_alert_specs';
const INCREASE = 'payable_increase_specs';
const GRID = 'payable_instalment_grid';
const EXCEPTIONS = 'payable_collection_exceptions';

const CHILD_SELECT = `
  *,
  full_payment_spec:${FULL}(*),
  advance_spec:${ADVANCE}(*),
  installment_spec:${INSTALLMENT}(*),
  penalty_slabs:${PENALTY}(*),
  alert_spec:${ALERT}(*),
  increase_spec:${INCREASE}(*),
  instalment_grid:${GRID}(*),
  collection_exceptions:${EXCEPTIONS}(*)
`;

export const payableCriteriaService = {
  async list(): Promise<PayableCriteria[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PayableCriteria[];
  },

  async listWithSpecs(): Promise<PayableCriteria[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(CHILD_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PayableCriteria[];
  },

  async getById(id: string): Promise<PayableCriteria | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(CHILD_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as PayableCriteria | null;
  },

  async create(input: PayableCriteriaInput): Promise<PayableCriteria> {
    const {
      full_payment_spec,
      advance_spec,
      installment_spec,
      penalty_slabs,
      alert_spec,
      increase_spec,
      instalment_grid,
      collection_exceptions,
      ...masterFields
    } = input;

    const { data: master, error: masterErr } = await supabase
      .from(TABLE)
      .insert(masterFields)
      .select('*')
      .single();
    if (masterErr) throw masterErr;
    const masterRow = master as PayableCriteria;

    await this.upsertChildSpecs(masterRow.id, {
      full_payment_spec,
      advance_spec,
      installment_spec,
      penalty_slabs,
      alert_spec,
      increase_spec,
      instalment_grid,
      collection_exceptions,
    });

    return (await this.getById(masterRow.id)) as PayableCriteria;
  },

  async update(id: string, input: PayableCriteriaInput): Promise<PayableCriteria> {
    const {
      full_payment_spec,
      advance_spec,
      installment_spec,
      penalty_slabs,
      alert_spec,
      increase_spec,
      instalment_grid,
      collection_exceptions,
      ...masterFields
    } = input;

    const { error: masterErr } = await supabase
      .from(TABLE)
      .update({ ...masterFields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (masterErr) throw masterErr;

    await this.upsertChildSpecs(id, {
      full_payment_spec,
      advance_spec,
      installment_spec,
      penalty_slabs,
      alert_spec,
      increase_spec,
      instalment_grid,
      collection_exceptions,
    });

    return (await this.getById(id)) as PayableCriteria;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  async upsertChildSpecs(
    criteriaId: string,
    specs: {
      full_payment_spec: PayableFullPaymentSpec;
      advance_spec: PayableAdvanceSpec;
      installment_spec: PayableInstallmentSpec;
      penalty_slabs: PayablePenaltySlab[];
      alert_spec: PayableAlertSpec;
      increase_spec: PayableIncreaseSpec;
      instalment_grid: PayableInstalmentGridRow[];
      collection_exceptions: PayableCollectionException[];
    },
  ): Promise<void> {
    const {
      full_payment_spec,
      advance_spec,
      installment_spec,
      penalty_slabs,
      alert_spec,
      increase_spec,
      instalment_grid,
      collection_exceptions,
    } = specs;

    // Full payment spec (single row per criteria)
    if (full_payment_spec.id) {
      const { error } = await supabase
        .from(FULL)
        .update({
          reference_date: full_payment_spec.reference_date,
          days_offset: full_payment_spec.days_offset,
          discount_slabs: full_payment_spec.discount_slabs,
        })
        .eq('id', full_payment_spec.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(FULL).insert({
        criteria_id: criteriaId,
        reference_date: full_payment_spec.reference_date,
        days_offset: full_payment_spec.days_offset,
        discount_slabs: full_payment_spec.discount_slabs,
      });
      if (error) throw error;
    }

    // Advance spec (single row per criteria)
    if (advance_spec.id) {
      const { error } = await supabase
        .from(ADVANCE)
        .update({
          advance_type: advance_spec.advance_type,
          advance_value: advance_spec.advance_value,
          reference_date: advance_spec.reference_date,
          days_offset: advance_spec.days_offset,
        })
        .eq('id', advance_spec.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(ADVANCE).insert({
        criteria_id: criteriaId,
        advance_type: advance_spec.advance_type,
        advance_value: advance_spec.advance_value,
        reference_date: advance_spec.reference_date,
        days_offset: advance_spec.days_offset,
      });
      if (error) throw error;
    }

    // Installment spec (single row per criteria)
    if (installment_spec.id) {
      const { error } = await supabase
        .from(INSTALLMENT)
        .update({
          installment_type: installment_spec.installment_type,
          installment_value: installment_spec.installment_value,
          reference_date: installment_spec.reference_date,
          days_offset: installment_spec.days_offset,
        })
        .eq('id', installment_spec.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(INSTALLMENT).insert({
        criteria_id: criteriaId,
        installment_type: installment_spec.installment_type,
        installment_value: installment_spec.installment_value,
        reference_date: installment_spec.reference_date,
        days_offset: installment_spec.days_offset,
      });
      if (error) throw error;
    }

    // Penalty slabs (multiple rows per criteria) — delete and re-insert
    const { error: delErr } = await supabase.from(PENALTY).delete().eq('criteria_id', criteriaId);
    if (delErr) throw delErr;
    if (penalty_slabs.length > 0) {
      const rows = penalty_slabs.map((s) => ({
        criteria_id: criteriaId,
        slab_row: s.slab_row,
        penalty_type: s.penalty_type,
        penalty_value: s.penalty_value,
        late_days: s.late_days,
      }));
      const { error } = await supabase.from(PENALTY).insert(rows);
      if (error) throw error;
    }

    // Alert spec (single row per criteria)
    if (alert_spec.id) {
      const { error } = await supabase
        .from(ALERT)
        .update({
          days_before_due: alert_spec.days_before_due,
          message_hook: alert_spec.message_hook,
        })
        .eq('id', alert_spec.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(ALERT).insert({
        criteria_id: criteriaId,
        days_before_due: alert_spec.days_before_due,
        message_hook: alert_spec.message_hook,
      });
      if (error) throw error;
    }

    // Increase spec (single row per criteria)
    if (increase_spec.id) {
      const { error } = await supabase
        .from(INCREASE)
        .update({
          increase_after_months: increase_spec.increase_after_months,
          increase_pct: increase_spec.increase_pct,
          increase_min: increase_spec.increase_min,
          increase_max: increase_spec.increase_max,
          alert_message_hook: increase_spec.alert_message_hook,
        })
        .eq('id', increase_spec.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(INCREASE).insert({
        criteria_id: criteriaId,
        increase_after_months: increase_spec.increase_after_months,
        increase_pct: increase_spec.increase_pct,
        increase_min: increase_spec.increase_min,
        increase_max: increase_spec.increase_max,
        alert_message_hook: increase_spec.alert_message_hook,
      });
      if (error) throw error;
    }

    // Instalment grid (multiple rows per criteria) — delete and re-insert
    const { error: gridDelErr } = await supabase.from(GRID).delete().eq('criteria_id', criteriaId);
    if (gridDelErr) throw gridDelErr;
    if (instalment_grid.length > 0) {
      const rows = instalment_grid.map((r) => ({
        criteria_id: criteriaId,
        object_id: r.object_id,
        instalment_seq: r.instalment_seq,
        instalment_date: r.instalment_date,
        instalment_amount: r.instalment_amount,
        next_run_date: r.next_run_date,
      }));
      const { error } = await supabase.from(GRID).insert(rows);
      if (error) throw error;
    }

    // Collection exceptions (multiple rows per criteria) — delete and re-insert
    const { error: excDelErr } = await supabase.from(EXCEPTIONS).delete().eq('criteria_id', criteriaId);
    if (excDelErr) throw excDelErr;
    if (collection_exceptions.length > 0) {
      const rows = collection_exceptions.map((e) => ({
        criteria_id: criteriaId,
        exception_type: e.exception_type,
        seq_no: e.seq_no,
        demand_slab_min: e.demand_slab_min,
        demand_slab_max: e.demand_slab_max,
        offset_days: e.offset_days,
        applicable_pct: e.applicable_pct,
        pct_basis: e.pct_basis,
        pct_min: e.pct_min,
        pct_max: e.pct_max,
        actual_amount: e.actual_amount,
        message_hook: e.message_hook,
      }));
      const { error } = await supabase.from(EXCEPTIONS).insert(rows);
      if (error) throw error;
    }
  },
};
