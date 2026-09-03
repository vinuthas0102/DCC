import { supabase } from '../lib/supabase';
import { PaymentPolicyDTO, UpsertPaymentPolicyDTO } from '../types/booking.types';
import { PaymentReferenceDate } from '../types/common.types';

function mapRow(row: any): PaymentPolicyDTO {
  return {
    id: row.id,
    propertyId: row.property_id,
    referenceDate: row.reference_date as PaymentReferenceDate,
    daysOffset: row.days_offset,
    allowManualPayment: row.allow_manual_payment,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const paymentPolicyService = {
  async getPolicy(propertyId: string): Promise<PaymentPolicyDTO | null> {
    const { data, error } = await supabase
      .from('payment_policies')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  },

  async upsertPolicy(dto: UpsertPaymentPolicyDTO): Promise<PaymentPolicyDTO> {
    const { data, error } = await supabase
      .from('payment_policies')
      .upsert(
        {
          property_id: dto.propertyId,
          reference_date: dto.referenceDate,
          days_offset: dto.daysOffset,
          allow_manual_payment: dto.allowManualPayment,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'property_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async deletePolicy(propertyId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_policies')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('property_id', propertyId);
    if (error) throw error;
  },

  /**
   * Returns a human-readable description of the payment deadline.
   * e.g. "Within 15 days of allotment" or "20 days before acceptance"
   */
  describePolicy(policy: PaymentPolicyDTO): string {
    const { referenceDate, daysOffset } = policy;
    if (referenceDate === 'on_request') return 'Payment required immediately at time of request';
    const direction = daysOffset >= 0 ? 'within' : '';
    const absDays = Math.abs(daysOffset);
    const refLabel =
      referenceDate === 'allotment_date' ? 'allotment' : 'acceptance (check-in)';
    if (referenceDate === 'acceptance_date' && daysOffset < 0) {
      return `Payment required ${absDays} day${absDays !== 1 ? 's' : ''} before ${refLabel}`;
    }
    return `Payment required ${direction} ${absDays} day${absDays !== 1 ? 's' : ''} of ${refLabel}`;
  },

  /**
   * Computes the payment deadline date given a reference date (ISO string) and the policy.
   */
  computeDeadline(referenceIso: string, policy: PaymentPolicyDTO): Date {
    const base = new Date(referenceIso);
    base.setDate(base.getDate() + policy.daysOffset);
    return base;
  },
};
