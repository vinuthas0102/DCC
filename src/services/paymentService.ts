import { supabase } from '../lib/supabase';
import { TransactionDTO } from '../types';

export type ManualPaymentMode = 'CASH' | 'DD' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI';

export interface RecordManualPaymentDTO {
  bookingId: string;
  amount: number;
  paymentMode: ManualPaymentMode;
  referenceNumber: string;
  paymentDate: string;
  notes?: string;
}

export const paymentService = {
  processPayment: async (
    bookingId: string,
    amount: number,
    shouldSucceed: boolean = true
  ): Promise<TransactionDTO> => {
    const mockTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const mockResponse = {
      gateway: 'IBL-ATOM',
      transactionId: mockTransactionId,
      status: shouldSucceed ? 'SUCCESS' : 'FAILURE',
      timestamp: new Date().toISOString(),
      message: shouldSucceed ? 'Payment processed successfully' : 'Payment failed',
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          booking_id: bookingId,
          transaction_id: mockTransactionId,
          amount: amount,
          payment_method: 'IBL-ATOM',
          payment_status: shouldSucceed ? 'SUCCESS' : 'FAILURE',
          payment_gateway_response: mockResponse,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (shouldSucceed) {
      await updateBookingPayment(bookingId, amount);
    }

    return mapTransactionFromDb(data);
  },

  recordManualPayment: async (dto: RecordManualPaymentDTO): Promise<TransactionDTO> => {
    const txnId = `MNL${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const gatewayResponse = {
      gateway: 'MANUAL',
      paymentMode: dto.paymentMode,
      referenceNumber: dto.referenceNumber,
      paymentDate: dto.paymentDate,
      recordedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          booking_id: dto.bookingId,
          transaction_id: txnId,
          amount: dto.amount,
          payment_method: `MANUAL_${dto.paymentMode}`,
          payment_status: 'SUCCESS',
          payment_gateway_response: gatewayResponse,
          reference_number: dto.referenceNumber,
          payment_notes: dto.notes ?? '',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await updateBookingPayment(dto.bookingId, dto.amount);

    return mapTransactionFromDb(data);
  },

  getTransactions: async (bookingId: string): Promise<TransactionDTO[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapTransactionFromDb);
  },
};

async function updateBookingPayment(bookingId: string, amount: number): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('paid_amount, total_amount, status, payment_scenario')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return;

  const newPaidAmount = parseFloat(booking.paid_amount) + amount;
  const totalAmount = parseFloat(booking.total_amount);
  const balanceAmount = totalAmount - newPaidAmount;
  const newPaymentStatus =
    balanceAmount <= 0 ? 'COMPLETED' : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING';

  const updatePayload: Record<string, any> = {
    paid_amount: newPaidAmount,
    balance_amount: Math.max(0, balanceAmount),
    payment_status: newPaymentStatus,
    updated_at: new Date().toISOString(),
  };

  // If payment is now complete and the booking was AWAITING_PAYMENT,
  // advance it to the next logical status based on payment_scenario
  if (newPaymentStatus === 'COMPLETED' && booking.status === 'AWAITING_PAYMENT') {
    const scenario = booking.payment_scenario;
    if (scenario === 'immediate') updatePayload.status = 'PROVISIONED';
    else if (scenario === 'post_approval') updatePayload.status = 'ALLOCATED';
    else if (scenario === 'pre_acceptance') updatePayload.status = 'CHECKED_IN';
  }

  await supabase.from('bookings').update(updatePayload).eq('id', bookingId);
}

function mapTransactionFromDb(dbTransaction: any): TransactionDTO {
  return {
    id: dbTransaction.id,
    bookingId: dbTransaction.booking_id,
    transactionId: dbTransaction.transaction_id,
    amount: parseFloat(dbTransaction.amount),
    paymentMethod: dbTransaction.payment_method,
    paymentStatus: dbTransaction.payment_status,
    paymentGatewayResponse: dbTransaction.payment_gateway_response || {},
    referenceNumber: dbTransaction.reference_number || '',
    paymentNotes: dbTransaction.payment_notes || '',
    createdAt: dbTransaction.created_at,
  };
}
