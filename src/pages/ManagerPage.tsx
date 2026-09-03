import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, Users, ChevronDown, ChevronUp, Calendar, User, Home, DollarSign, Building2, MapPin, Images } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { allocationService } from '../services/allocationService';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { formatCurrency } from '../utils/formatters';
import { formatDate } from '../utils/dateHelpers';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../constants/statuses';
import { BookingDTO, RoomDTO } from '../types';
import { FadeIn } from '../components/animations/FadeIn';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=400&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80',
];

interface BookingGalleryProps {
  booking: BookingDTO;
  idx: number;
}

const BookingGallery: React.FC<BookingGalleryProps> = ({ booking, idx }) => {
  const [primaryErr, setPrimaryErr] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});

  const rawImages = booking.property?.images;
  const images: string[] = Array.isArray(rawImages) && rawImages.length > 0
    ? rawImages
    : [FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]];

  const primaryImage = images[0];
  const thumbnails = Array.from({ length: 4 }, (_, i) => images[i + 1] || '');
  const extraCount = images.length > 5 ? images.length - 4 : 0;

  return (
    <div className="relative flex-shrink-0 sm:w-56 md:w-64 flex flex-col bg-gray-100">
      {/* Hero image */}
      <div className="relative overflow-hidden" style={{ height: '172px' }}>
        {!primaryErr ? (
          <img
            src={primaryImage}
            alt={booking.property?.name || 'Property'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setPrimaryErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 size={36} className="text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
        {/* Booking number overlay */}
        <div className="absolute top-3 right-3">
          <span className="font-mono text-[10px] font-bold px-2 py-1 rounded-full bg-black/55 text-white backdrop-blur-sm tracking-wider">
            #{booking.bookingNumber}
          </span>
        </div>
      </div>
      {/* Thumbnail strip */}
      <div className="flex h-[52px] border-t border-gray-200/60">
        {thumbnails.map((src, i) => {
          const isLast = i === 3;
          const showViewAll = isLast && extraCount > 0;
          return (
            <div key={i} className="relative flex-1 overflow-hidden border-r border-gray-200/60 last:border-r-0 bg-gray-100">
              {src && !thumbErrors[i] ? (
                <img
                  src={src}
                  alt={`View ${i + 2}`}
                  className="w-full h-full object-cover brightness-95 group-hover:brightness-100 transition-all duration-300"
                  onError={() => setThumbErrors(prev => ({ ...prev, [i]: true }))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Images size={11} className="text-gray-400" />
                </div>
              )}
              {showViewAll && (
                <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center">
                  <span className="text-white text-[8px] font-black uppercase leading-tight tracking-widest">VIEW</span>
                  <span className="text-white text-[8px] font-black uppercase leading-tight tracking-widest">ALL</span>
                  {extraCount > 0 && <span className="text-white/70 text-[7px] font-semibold mt-0.5">+{extraCount}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ManagerPage: React.FC = () => {
  const { user } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const addToast = useUIStore((state) => state.addToast);

  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomDTO[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings({ status: 'REQUESTED' });
  }, []);

  const handleOpenAllocation = async (booking: BookingDTO) => {
    setSelectedBooking(booking);
    try {
      if (!booking.propertyId) {
        throw new Error('Booking does not have a property ID');
      }

      const rooms = await propertyService.getRoomsByProperty(
        booking.propertyId,
        { roomTypeId: booking.roomTypeId, status: 'AVAILABLE' }
      );

      if (rooms.length === 0) {
        addToast('No available rooms found for this property and room type', 'error');
        return;
      }

      setAvailableRooms(rooms);
      setSelectedRoomIds([]);
      setAllocationModalOpen(true);
    } catch (error: any) {
      addToast(error.message || 'Failed to load rooms', 'error');
    }
  };

  const handleAllocateRooms = async () => {
    if (!selectedBooking || selectedRoomIds.length !== selectedBooking.quantity) {
      addToast(`Please select exactly ${selectedBooking?.quantity} room(s)`, 'error');
      return;
    }

    try {
      for (const roomId of selectedRoomIds) {
        await allocationService.createAllocation(
          { bookingId: selectedBooking.id, roomId },
          user!.id
        );
      }

      await bookingService.updateBookingStatus(selectedBooking.id, 'ALLOCATED');

      addToast('Rooms allocated successfully', 'success');
      setAllocationModalOpen(false);
      fetchBookings({ status: 'REQUESTED' });
    } catch (error: any) {
      addToast(error.message || 'Allocation failed', 'error');
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'PROVISIONED');
      addToast('Booking approved', 'success');
      fetchBookings({ status: 'REQUESTED' });
    } catch (error: any) {
      addToast(error.message || 'Approval failed', 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !rejectionReason) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      await bookingService.updateBookingStatus(selectedBooking.id, 'REJECTED', rejectionReason);
      addToast('Booking rejected', 'success');
      setApprovalModalOpen(false);
      setRejectionReason('');
      fetchBookings({ status: 'REQUESTED' });
    } catch (error: any) {
      addToast(error.message || 'Rejection failed', 'error');
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-cyan-50/20">
      {/* Frozen hero header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            Manager Dashboard
          </h1>
          <p className="text-gray-600">Review and allocate pending booking requests</p>
        </div>
      </div>

      {/* Scrollable data area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-4">
          {bookings.length === 0 ? (
            <FadeIn delay={100}>
              <div className="pastel-blue-gradient rounded-xl p-12">
                <div className="text-center">
                  <Clock className="mx-auto text-gray-400 mb-4 animate-pulse-slow" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">All booking requests have been processed</p>
                </div>
              </div>
            </FadeIn>
          ) : (
            bookings.map((booking, index) => {
              const isExpanded = expandedBookingId === booking.id;

              return (
                <FadeIn key={booking.id} delay={index * 60}>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col sm:flex-row border-l-4 border-l-cyan-400">
                    {/* Gallery section */}
                    <BookingGallery booking={booking} idx={index} />

                    {/* Main content */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
                                {BOOKING_STATUS_LABELS[booking.status]}
                              </Badge>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                              <Home size={13} className="text-gray-400 flex-shrink-0" />
                              {booking.property?.name || 'Property'}
                            </h3>
                            {booking.property?.address && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                <MapPin size={11} className="flex-shrink-0" />
                                <span className="truncate">{booking.property.address}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                            className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                        {/* Info chips */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            { icon: <User size={11} />, label: booking.guestDetails.fullName },
                            { icon: <Home size={11} />, label: booking.roomType?.name },
                            { icon: <Calendar size={11} />, label: `${booking.quantity} room${booking.quantity !== 1 ? 's' : ''}` },
                          ].filter(item => item.label).map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-700">
                              <span className="text-gray-400">{item.icon}</span>
                              <span className="font-medium truncate max-w-[140px]">{item.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Expanded: dates + special requirements */}
                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Check-in</p>
                                <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(booking.checkInDate)}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Check-out</p>
                                <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(booking.checkOutDate)}</p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                <p className="text-[10px] text-blue-400 uppercase tracking-wide font-semibold">Guests</p>
                                <p className="text-xs font-bold text-blue-700 mt-0.5">{booking.quantity} room{booking.quantity !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            {booking.specialRequirements && (
                              <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                <p className="text-xs text-amber-800">
                                  <span className="font-semibold">Special Requirements: </span>
                                  {booking.specialRequirements}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(booking.id)}
                          icon={<CheckCircle size={14} />}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAllocation(booking)}
                          icon={<Users size={14} />}
                        >
                          Allocate Rooms
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setSelectedBooking(booking); setApprovalModalOpen(true); }}
                          icon={<XCircle size={14} />}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    {/* Right: amount */}
                    <div className="flex flex-col items-end justify-center p-4 sm:border-l border-gray-100 sm:w-40 flex-shrink-0 bg-gray-50/50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Total</p>
                      <p className="text-xl font-black text-gray-900 leading-none mt-0.5">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">requested</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })
          )}
        </div>
        </div>
      </div>

      <Modal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        title="Allocate Rooms"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Required:</span> {selectedBooking.quantity}{' '}
                {selectedBooking.roomType?.name} room(s)
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Selected:</span> {selectedRoomIds.length} room(s)
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => toggleRoomSelection(room.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-150 ${
                    selectedRoomIds.includes(room.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{room.roomNumber}</div>
                  <div className="text-sm text-gray-600">Capacity: {room.capacity}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(room.basePrice)}/night</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setAllocationModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAllocateRooms} className="flex-1">
                Confirm Allocation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title="Reject Booking"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Please provide a reason for rejecting booking{' '}
            <span className="font-semibold">{selectedBooking?.bookingNumber}</span>
          </p>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} className="flex-1">
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
