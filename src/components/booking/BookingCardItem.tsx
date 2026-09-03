import React, { useState } from 'react';
import { Calendar, MapPin, Bed, Users, Wrench, CheckCircle, CreditCard, Building2 } from 'lucide-react';
import { FadeIn } from '../animations/FadeIn';
import { BookingDTO, BookingStatus } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/formatters';
import { getBookingStatusConfig, calcNights, getPropertyImage, BOOKING_STATUS_ACCENT } from '../../utils/bookingFormatters';

interface BookingCardItemProps {
  booking: BookingDTO;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  activeServiceCount?: number;
}

export const BookingCardItem: React.FC<BookingCardItemProps> = ({
  booking, index, isSelected, onClick, activeServiceCount = 0,
}) => {
  const [thumbErr, setThumbErr] = useState(false);
  const statusCfg = getBookingStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
  const thumbSrc = getPropertyImage(booking, index);
  const accentColor = BOOKING_STATUS_ACCENT[booking.status] ?? 'bg-gray-300';

  return (
    <FadeIn delay={index * 35}>
      <div
        onClick={onClick}
        className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex min-h-[108px] ${
          isSelected ? 'ring-2 ring-blue-400 ring-offset-1 shadow-md border-blue-200' : 'border-gray-200 hover:-translate-y-px'
        }`}
      >
        {/* Status accent bar */}
        <div className={`w-1 flex-none ${accentColor} rounded-l-xl`} />

        {/* Thumbnail */}
        <div className="w-20 flex-none relative bg-gray-100 overflow-hidden">
          {!thumbErr ? (
            <img
              src={thumbSrc}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setThumbErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Building2 size={22} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Body */}
        <div className="flex-1 px-3 py-2.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono text-[10px] font-semibold text-gray-400">#{booking.bookingNumber}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${statusCfg.bg} flex-shrink-0`}>
              {statusCfg.label}
            </span>
          </div>

          <div className="mb-1">
            <div className="font-bold text-gray-900 text-sm leading-tight truncate">{booking.property?.name || 'Property'}</div>
            <div className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
              <MapPin size={9} className="flex-shrink-0" />
              {booking.property?.address || 'No address'}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
              <Calendar size={9} />{formatDate(booking.checkInDate)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
              {nights}n
            </span>
            {booking.roomType?.name && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                <Bed size={9} />{booking.roomType.name}
              </span>
            )}
            {booking.quantity > 1 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                <Users size={9} />{booking.quantity}
              </span>
            )}
            {activeServiceCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 font-semibold">
                <Wrench size={9} />{activeServiceCount}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 mt-1.5">
            <span className="text-xs font-black text-gray-900">{formatCurrency(booking.totalAmount)}</span>
            <div className="flex items-center gap-1.5">
              {booking.paymentStatus === 'COMPLETED' ? (
                <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle size={8} />Paid
                </span>
              ) : booking.balanceAmount > 0 ? (
                <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                  <CreditCard size={8} />Pending
                </span>
              ) : null}
              <span className="text-[9px] text-gray-400">{formatDate(booking.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};
