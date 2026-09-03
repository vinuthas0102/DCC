import { supabase } from '../lib/supabase';
import { BookingOccupantDTO, CreateBookingOccupantDTO } from '../types/booking.types';

function mapRow(row: any): BookingOccupantDTO {
  return {
    id: row.id,
    bookingId: row.booking_id,
    fullName: row.full_name,
    relation: row.relation,
    idProofType: row.id_proof_type,
    idProofNumber: row.id_proof_number,
    aadhaarUrl: row.aadhaar_url,
    panUrl: row.pan_url,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  };
}

export const occupantService = {
  async getOccupants(bookingId: string): Promise<BookingOccupantDTO[]> {
    const { data, error } = await supabase
      .from('booking_occupants')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async saveOccupant(dto: CreateBookingOccupantDTO): Promise<BookingOccupantDTO> {
    const { data, error } = await supabase
      .from('booking_occupants')
      .insert({
        booking_id: dto.bookingId,
        full_name: dto.fullName,
        relation: dto.relation,
        id_proof_type: dto.idProofType,
        id_proof_number: dto.idProofNumber,
        aadhaar_url: dto.aadhaarUrl ?? '',
        pan_url: dto.panUrl ?? '',
        photo_url: dto.photoUrl ?? '',
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async deleteOccupant(id: string): Promise<void> {
    const { error } = await supabase
      .from('booking_occupants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadDocument(
    bookingId: string,
    occupantIndex: number,
    docType: 'aadhaar' | 'pan' | 'photo',
    file: File,
  ): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `booking-occupants/${bookingId}/${occupantIndex}_${docType}.${ext}`;
    const { error } = await supabase.storage
      .from('booking-documents')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('booking-documents')
      .getPublicUrl(path);
    return urlData.publicUrl;
  },
};
