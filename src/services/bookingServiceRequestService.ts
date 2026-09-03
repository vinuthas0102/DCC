import { supabase } from '../lib/supabase';
import {
  BookingServiceRequestDTO,
  BookingServiceChatDTO,
  BookingServiceStatus,
  CreateBookingServiceRequestDTO,
  UpgradeStatus,
} from '../types';
import { DEMO_MODE } from '../mocks/demoData';
import { RoomTypeDTO } from '../types/property.types';

// Demo service requests keyed by booking id — used in DEMO_MODE to bypass RLS
const DEMO_BOOKING_SERVICES: Record<string, BookingServiceRequestDTO[]> = {
  // BK2026051800011 — CHECKED_IN, 2 active service requests + 1 upgrade request
  'dd000002-0000-4000-a000-000000000002': [
    {
      id: 'aa000002-0000-4000-8000-000000000002',
      bookingId: 'dd000002-0000-4000-a000-000000000002',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'MAINTENANCE',
      requestStatus: 'OPEN',
      subject: 'Bathroom tap leaking',
      remarks: 'The cold water tap in the attached bathroom has been dripping since day 1. Please repair.',
      urgencyLevel: 'HIGH',
      eoNotes: '',
      documentUrl: '',
      upgradeTargetRoomTypeId: null,
      upgradeOriginalRoomTypeId: null,
      upgradePriceDifference: 0,
      upgradeStatus: null,
      createdAt: '2026-05-17T08:30:00Z',
      updatedAt: '2026-05-17T08:30:00Z',
    },
    {
      id: 'aa000003-0000-4000-8000-000000000003',
      bookingId: 'dd000002-0000-4000-a000-000000000002',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'GRIEVANCE',
      requestStatus: 'IN_PROGRESS',
      subject: 'Noise from adjacent room at night',
      remarks: 'Loud noise from Room 205 between 11 PM and 1 AM. Requested intervention from management.',
      urgencyLevel: 'MEDIUM',
      eoNotes: 'Estate office notified. Guest in Room 205 has been spoken to.',
      documentUrl: '',
      upgradeTargetRoomTypeId: null,
      upgradeOriginalRoomTypeId: null,
      upgradePriceDifference: 0,
      upgradeStatus: null,
      createdAt: '2026-05-18T22:45:00Z',
      updatedAt: '2026-05-19T09:00:00Z',
    },
    {
      id: 'aa000004-0000-4000-8000-000000000004',
      bookingId: 'dd000002-0000-4000-a000-000000000002',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'UPGRADE',
      requestStatus: 'OPEN',
      subject: 'Room upgrade request — Suite',
      remarks: 'Requesting an upgrade to a Suite for the remainder of the stay. Current room is Standard.',
      urgencyLevel: 'LOW',
      eoNotes: '',
      documentUrl: '',
      upgradeTargetRoomTypeId: 'demo-suite-room-type-id',
      upgradeOriginalRoomTypeId: 'demo-standard-room-type-id',
      upgradePriceDifference: 2500,
      upgradeStatus: 'PENDING_REVIEW',
      createdAt: '2026-05-19T10:00:00Z',
      updatedAt: '2026-05-19T10:00:00Z',
    },
  ],
  // BK2026052000023 — ALLOCATED, 1 cancellation request awaiting EO approval
  'a2000001-b000-4000-8000-000000000001': [
    {
      id: 'ab000001-0000-4000-8000-000000000001',
      bookingId: 'a2000001-b000-4000-8000-000000000001',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'CANCELLATION_REQUEST',
      requestStatus: 'OPEN',
      subject: 'Request to cancel booking',
      remarks: 'Plans have changed due to official travel rescheduling. Requesting cancellation of this booking.',
      urgencyLevel: 'MEDIUM',
      eoNotes: '',
      documentUrl: '',
      upgradeTargetRoomTypeId: null,
      upgradeOriginalRoomTypeId: null,
      upgradePriceDifference: 0,
      upgradeStatus: null,
      createdAt: '2026-05-20T10:00:00Z',
      updatedAt: '2026-05-20T10:00:00Z',
    },
  ],
  // BK2026040100005 — CHECKED_OUT, 1 open maintenance request (post-vacate)
  'dffc4358-d2df-4264-9838-d402e0935bb7': [
    {
      id: 'aa000001-0000-4000-8000-000000000001',
      bookingId: 'dffc4358-d2df-4264-9838-d402e0935bb7',
      employeeId: '5f865f74-aeab-4885-a898-80ba3da33ae0',
      serviceType: 'MAINTENANCE',
      requestStatus: 'OPEN',
      subject: 'AC not cooling properly',
      remarks: 'Air conditioner in the room not cooling adequately. Needs servicing before next occupancy.',
      urgencyLevel: 'MEDIUM',
      eoNotes: '',
      documentUrl: '',
      upgradeTargetRoomTypeId: null,
      upgradeOriginalRoomTypeId: null,
      upgradePriceDifference: 0,
      upgradeStatus: null,
      createdAt: '2026-04-03T06:00:00Z',
      updatedAt: '2026-04-03T06:00:00Z',
    },
  ],
};

function mapRequest(row: Record<string, unknown>): BookingServiceRequestDTO {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    employeeId: row.employee_id as string,
    serviceType: row.service_type as BookingServiceRequestDTO['serviceType'],
    requestStatus: row.request_status as BookingServiceStatus,
    subject: row.subject as string,
    remarks: row.remarks as string,
    urgencyLevel: (row.urgency_level as BookingServiceRequestDTO['urgencyLevel']) ?? 'LOW',
    eoNotes: (row.eo_notes as string) ?? '',
    documentUrl: (row.document_url as string) ?? '',
    upgradeTargetRoomTypeId: (row.upgrade_target_room_type_id as string) ?? null,
    upgradeOriginalRoomTypeId: (row.upgrade_original_room_type_id as string) ?? null,
    upgradePriceDifference: (row.upgrade_price_difference as number) ?? 0,
    upgradeStatus: (row.upgrade_status as UpgradeStatus) ?? null,
    extensionUntil: (row.extension_until as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapChat(row: Record<string, unknown>): BookingServiceChatDTO {
  return {
    id: row.id as string,
    serviceRequestId: row.service_request_id as string,
    authorId: row.author_id as string,
    authorRole: row.author_role as BookingServiceChatDTO['authorRole'],
    message: row.message as string,
    documentUrls: (row.document_urls as string[]) ?? [],
    deliveryMode: (row.delivery_mode as BookingServiceChatDTO['deliveryMode']) ?? 'IN_APP',
    createdAt: row.created_at as string,
  };
}

export const bookingServiceRequestService = {
  async getServiceRequests(bookingId: string): Promise<BookingServiceRequestDTO[]> {
    if (DEMO_MODE) return Promise.resolve(DEMO_BOOKING_SERVICES[bookingId] ?? []);
    const { data, error } = await supabase
      .from('booking_service_requests')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRequest);
  },

  async createServiceRequest(
    userId: string,
    input: CreateBookingServiceRequestDTO,
  ): Promise<BookingServiceRequestDTO> {
    const insertPayload: Record<string, unknown> = {
      booking_id: input.bookingId,
      employee_id: userId,
      service_type: input.serviceType,
      subject: input.subject,
      remarks: input.remarks,
      urgency_level: input.urgencyLevel ?? 'MEDIUM',
      document_url: input.documentUrl ?? '',
    };
    if (input.serviceType === 'UPGRADE') {
      insertPayload.upgrade_target_room_type_id = input.upgradeTargetRoomTypeId ?? null;
      insertPayload.upgrade_original_room_type_id = input.upgradeOriginalRoomTypeId ?? null;
      insertPayload.upgrade_price_difference = input.upgradePriceDifference ?? 0;
      insertPayload.upgrade_status = 'PENDING_REVIEW';
    }
    if (input.serviceType === 'EXTENSION' && input.extensionUntil) {
      insertPayload.extension_until = input.extensionUntil;
    }
    const { data, error } = await supabase
      .from('booking_service_requests')
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw error;
    return mapRequest(data);
  },

  async approveUpgradeRequest(
    requestId: string,
    bookingId: string,
    targetRoomTypeId: string,
    priceDifference: number,
    managerId: string,
  ): Promise<void> {
    if (DEMO_MODE) {
      for (const list of Object.values(DEMO_BOOKING_SERVICES)) {
        const svc = list.find(s => s.id === requestId);
        if (svc) {
          svc.requestStatus = 'RESOLVED';
          svc.upgradeStatus = 'APPROVED';
          svc.updatedAt = new Date().toISOString();
        }
      }
      return;
    }
    const now = new Date().toISOString();
    const { error: svcErr } = await supabase
      .from('booking_service_requests')
      .update({ request_status: 'RESOLVED', upgrade_status: 'APPROVED', updated_at: now })
      .eq('id', requestId);
    if (svcErr) throw svcErr;

    // Recalculate booking amounts
    const { data: booking } = await supabase
      .from('bookings')
      .select('total_amount, paid_amount, balance_amount')
      .eq('id', bookingId)
      .maybeSingle();
    if (booking) {
      const newTotal = Number(booking.total_amount) + priceDifference;
      const newBalance = Number(booking.balance_amount) + priceDifference;
      const newPaymentStatus = newBalance > 0 ? (booking.paid_amount > 0 ? 'PARTIAL' : 'PENDING') : 'COMPLETED';
      await supabase.from('bookings').update({
        room_type_id: targetRoomTypeId,
        total_amount: newTotal,
        balance_amount: newBalance,
        payment_status: newPaymentStatus,
        status: 'AWAITING_PAYMENT',
        updated_at: now,
      }).eq('id', bookingId);
    }

    // Post system chat
    await supabase.from('booking_service_chats').insert({
      service_request_id: requestId,
      author_id: managerId,
      author_role: 'system',
      message: `Upgrade approved. Room type has been updated and an additional payment of ₹${priceDifference.toLocaleString()} is required.`,
      document_urls: [],
      delivery_mode: 'IN_APP',
    });
  },

  async declineUpgradeRequest(
    requestId: string,
    managerId: string,
    reason: string,
  ): Promise<void> {
    if (DEMO_MODE) {
      for (const list of Object.values(DEMO_BOOKING_SERVICES)) {
        const svc = list.find(s => s.id === requestId);
        if (svc) {
          svc.requestStatus = 'CLOSED';
          svc.upgradeStatus = 'DECLINED';
          svc.updatedAt = new Date().toISOString();
        }
      }
      return;
    }
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('booking_service_requests')
      .update({ request_status: 'CLOSED', upgrade_status: 'DECLINED', updated_at: now })
      .eq('id', requestId);
    if (error) throw error;

    await supabase.from('booking_service_chats').insert({
      service_request_id: requestId,
      author_id: managerId,
      author_role: 'system',
      message: reason || 'Upgrade request declined — the requested room type is not available for your dates.',
      document_urls: [],
      delivery_mode: 'IN_APP',
    });
  },

  async getRoomTypesForProperty(propertyId: string): Promise<RoomTypeDTO[]> {
    if (DEMO_MODE) {
      return [
        { id: 'demo-standard-room-type-id', name: 'Standard', description: 'Standard room', defaultCapacity: 2, sortOrder: 1, isActive: true, createdAt: '' },
        { id: 'demo-deluxe-room-type-id', name: 'Deluxe', description: 'Deluxe room', defaultCapacity: 2, sortOrder: 2, isActive: true, createdAt: '' },
        { id: 'demo-suite-room-type-id', name: 'Suite', description: 'Suite room', defaultCapacity: 3, sortOrder: 3, isActive: true, createdAt: '' },
      ];
    }
    const { data, error } = await supabase
      .from('room_types')
      .select('id, name, description, default_capacity, sort_order, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) ?? '',
      defaultCapacity: (r.default_capacity as number) ?? 1,
      sortOrder: (r.sort_order as number) ?? 0,
      isActive: (r.is_active as boolean) ?? true,
      createdAt: (r.created_at as string) ?? '',
    }));
  },

  async updateServiceStatus(requestId: string, status: BookingServiceStatus): Promise<void> {
    if (DEMO_MODE) {
      for (const list of Object.values(DEMO_BOOKING_SERVICES)) {
        const svc = list.find(s => s.id === requestId);
        if (svc) { svc.requestStatus = status; svc.updatedAt = new Date().toISOString(); }
      }
      return;
    }
    const { error } = await supabase
      .from('booking_service_requests')
      .update({ request_status: status, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async getServiceChats(serviceRequestId: string): Promise<BookingServiceChatDTO[]> {
    const { data, error } = await supabase
      .from('booking_service_chats')
      .select('*')
      .eq('service_request_id', serviceRequestId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapChat);
  },

  async addServiceChat(
    serviceRequestId: string,
    authorId: string,
    authorRole: BookingServiceChatDTO['authorRole'],
    message: string,
    documentUrls: string[] = [],
    deliveryMode: BookingServiceChatDTO['deliveryMode'] = 'IN_APP',
  ): Promise<BookingServiceChatDTO> {
    const { data, error } = await supabase
      .from('booking_service_chats')
      .insert({
        service_request_id: serviceRequestId,
        author_id: authorId,
        author_role: authorRole,
        message,
        document_urls: documentUrls,
        delivery_mode: deliveryMode,
      })
      .select()
      .single();
    if (error) throw error;
    return mapChat(data);
  },
};
