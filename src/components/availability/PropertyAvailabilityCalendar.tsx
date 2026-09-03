import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { availabilityService, DayAvailability } from '../../services/availabilityService';

interface PropertyAvailabilityCalendarProps {
  propertyId: string;
  onDateSelect?: (date: string) => void;
  onClearDates?: () => void;
  selectedStartDate?: string;
  selectedEndDate?: string;
}

export const PropertyAvailabilityCalendar: React.FC<PropertyAvailabilityCalendarProps> = ({
  propertyId,
  onDateSelect,
  onClearDates,
  selectedStartDate,
  selectedEndDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, [propertyId, currentMonth, currentYear]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await availabilityService.getPropertyAvailability(
        propertyId,
        currentMonth,
        currentYear
      );
      setAvailability(data);
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'partial':   return 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200';
      case 'full':      return 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200';
      case 'blocked':   return 'bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-200';
      default:          return 'bg-gray-50 hover:bg-gray-100 text-gray-400 border-gray-100';
    }
  };

  const getDayState = (dateStr: string): 'start' | 'end' | 'range' | 'none' => {
    if (selectedStartDate && dateStr === selectedStartDate) return 'start';
    if (selectedEndDate && dateStr === selectedEndDate) return 'end';
    if (selectedStartDate && selectedEndDate && dateStr > selectedStartDate && dateStr < selectedEndDate) return 'range';
    return 'none';
  };

  const getDayInfo = (day: number): DayAvailability | undefined => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availability.find((a) => a.date === dateStr);
  };

  const formatShort = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const selectionPhase = !selectedStartDate ? 'checkin' : !selectedEndDate ? 'checkout' : 'done';

  const nightCount =
    selectedStartDate && selectedEndDate
      ? Math.round(
          (new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar size={17} className="text-blue-600" />
          <span className="font-semibold text-gray-900 text-sm">Availability Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePreviousMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-[130px] text-center">
            {monthName} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Selection guide ─────────────────────────────── */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        {selectionPhase === 'done' ? (
          <>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-0">
              <span className="font-semibold text-blue-900 truncate">{formatShort(selectedStartDate!)}</span>
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span className="font-semibold text-blue-900 truncate">{formatShort(selectedEndDate!)}</span>
              <span className="text-blue-500 text-xs flex-shrink-0 ml-auto pl-2">
                {nightCount} night{nightCount !== 1 ? 's' : ''}
              </span>
            </div>
            {onClearDates && (
              <button
                onClick={onClearDates}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors px-2.5 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </>
        ) : selectionPhase === 'checkout' ? (
          <>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <span className="text-amber-800">
                Check-in: <span className="font-bold">{formatShort(selectedStartDate!)}</span>
              </span>
              <span className="text-amber-500 text-xs flex-shrink-0 ml-auto pl-2">Select check-out</span>
            </div>
            {onClearDates && (
              <button
                onClick={onClearDates}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors px-2.5 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-gray-500">Click any date to set your <span className="font-semibold text-gray-700">check-in</span></span>
          </div>
        )}
      </div>

      {/* ── Legend ──────────────────────────────────────── */}
      <div className="px-5 pb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          Partial
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          Full
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          Blocked
        </div>
      </div>

      {/* ── Calendar grid ───────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="px-4 pb-5">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayInfo = getDayInfo(day);
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayState = getDayState(dateStr);
              const isPast = new Date(dateStr) < new Date(new Date().toDateString());
              const isStartOrEnd = dayState === 'start' || dayState === 'end';
              const isInRange = dayState === 'range';

              return (
                <button
                  key={day}
                  onClick={() => !isPast && onDateSelect && onDateSelect(dateStr)}
                  disabled={isPast || !onDateSelect}
                  className={[
                    'aspect-square rounded-lg border transition-all duration-150',
                    'flex flex-col items-center justify-center',
                    isStartOrEnd
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 z-10'
                      : isInRange
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : dayInfo
                      ? getStatusColor(dayInfo.status)
                      : 'bg-gray-50 text-gray-400 border-gray-100',
                    isPast
                      ? 'opacity-35 cursor-not-allowed'
                      : onDateSelect
                      ? 'cursor-pointer hover:scale-105 hover:shadow-sm'
                      : '',
                  ].join(' ')}
                  title={
                    dayInfo
                      ? `${dayInfo.availableRooms} of ${dayInfo.totalRooms} rooms available`
                      : isPast
                      ? 'Past date'
                      : ''
                  }
                >
                  <span className={`text-xs font-bold leading-none ${isStartOrEnd ? 'text-white' : ''}`}>
                    {day}
                  </span>
                  {dayInfo && (
                    <span className={`text-[9px] leading-none mt-0.5 ${isStartOrEnd ? 'text-blue-200' : isInRange ? 'text-blue-600' : ''}`}>
                      {dayInfo.availableRooms}/{dayInfo.totalRooms}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
