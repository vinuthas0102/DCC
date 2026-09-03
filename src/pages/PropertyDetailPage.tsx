import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Wifi, Calendar, ArrowLeft, Info, Layers,
  DollarSign, Map, Star,
  CheckCircle, Bed, Users, ChevronDown,
  CreditCard as EditIcon, Building2,
} from 'lucide-react';
import { RoomDisplayCard } from '../components/rooms/RoomDisplayCard';
import { getCategoryTheme, getAmenityIcon } from '../utils/amenityIcons';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PhotoGallery } from '../components/ui/PhotoGallery';
import { BookingFormSection } from '../components/property/BookingFormSection';
import { BasicInfoDisplay } from '../components/property/BasicInfoDisplay';
import { LocationDisplay } from '../components/property/LocationDisplay';
import { BlocksFloorsDisplay } from '../components/property/BlocksFloorsDisplay';
import { RoomsDisplay } from '../components/property/RoomsDisplay';
import { PricingDisplay } from '../components/property/PricingDisplay';
import { PropertyAvailabilityCalendar } from '../components/availability/PropertyAvailabilityCalendar';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../components/maps/NearbyPlacesPanel';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { usePropertyHierarchy } from '../hooks/usePropertyHierarchy';
import { canManageProperties } from '../utils/permissions';
import { getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';

type SectionId = 'overview' | 'rooms' | 'availability' | 'location' | 'reviews' | 'book';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: 'overview',     label: 'Overview',        icon: <Info size={15} /> },
  { id: 'rooms',        label: 'Rooms & Pricing',  icon: <Bed size={15} /> },
  { id: 'availability', label: 'Availability',     icon: <Calendar size={15} /> },
  { id: 'location',     label: 'Location',          icon: <Map size={15} /> },
  { id: 'reviews',      label: 'Reviews',           icon: <Star size={15} /> },
  { id: 'book',         label: 'Book Now',          icon: <Calendar size={15} /> },
];

// ── Sticky header height in px (back row + tab strip)
const HEADER_OFFSET = 96;

// ── Reviews section ────────────────────────────────────────────────

const ReviewsSection: React.FC<{ propertyName: string }> = ({ propertyName }) => (
  <div className="space-y-8">
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      <div className="text-center">
        <div className="text-6xl font-black text-amber-600 leading-none">4.2</div>
        <div className="flex items-center justify-center gap-0.5 mt-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={16} className={s <= 4 ? 'text-amber-500 fill-amber-500' : 'text-gray-300 fill-gray-300'} />
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">Based on 0 reviews</div>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {[
          { label: 'Cleanliness', score: 4.4 },
          { label: 'Location',    score: 4.6 },
          { label: 'Value',       score: 4.0 },
          { label: 'Service',     score: 4.2 },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-20 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{score}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
      <Star size={48} className="mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">No reviews yet</h3>
      <p className="text-sm text-gray-400 mb-4">Be the first to share your experience at {propertyName}</p>
      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
        <Star size={14} /> Write a Review
      </button>
    </div>
  </div>
);

// RoomCard is handled by shared RoomDisplayCard component

// ── Section wrapper ────────────────────────────────────────────────

interface SectionProps {
  id: SectionId;
  sectionRefs: React.MutableRefObject<Partial<Record<SectionId, HTMLElement>>>;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, sectionRefs, children }) => (
  <section
    id={`section-${id}`}
    ref={(el) => { if (el) sectionRefs.current[id] = el; }}
    className="scroll-mt-24"
  >
    {children}
  </section>
);

// ── Main page ──────────────────────────────────────────────────────

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProperty, currentPropertyError, fetchPropertyById, setCurrentProperty, roomTypes, amenities } = usePropertyStore();
  const { user, isLoading: authLoading } = useAuthStore();

  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [availPopupOpen, setAvailPopupOpen] = useState(false);
  const availPopupRef = useRef<HTMLDivElement>(null);

  const tabBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement>>>({});
  const scrollingRef = useRef(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { blocks, floors, rooms, loading: hierarchyLoading } = usePropertyHierarchy(id);

  useEffect(() => {
    if (!id || authLoading) return;
    setCurrentProperty(null);
    fetchPropertyById(id);
  }, [id, authLoading]);

  useEffect(() => {
    return () => {
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!availPopupOpen) return;
    const handler = (e: MouseEvent) => {
      if (availPopupRef.current && !availPopupRef.current.contains(e.target as Node)) {
        setAvailPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [availPopupOpen]);

  // ── Scroll-spy via IntersectionObserver ────────────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id: sId }) => {
      const el = sectionRefs.current[sId];
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (scrollingRef.current) return;
          if (entry.isIntersecting) {
            setActiveSection(sId);
          }
        },
        { rootMargin: `-${HEADER_OFFSET}px 0px -55% 0px`, threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [currentProperty]);

  // Handle URL tab param — scroll to section on load
  useEffect(() => {
    if (!currentProperty) return;
    const tab = searchParams.get('tab');
    const target = tab === 'booking' ? 'book' : (tab as SectionId | null);
    if (target && SECTIONS.find(s => s.id === target)) {
      setTimeout(() => scrollToSection(target), 400);
    }
  }, [currentProperty]);

  const syncTabBar = useCallback((sId: SectionId) => {
    const bar = tabBarRef.current;
    if (!bar) return;
    const btn = bar.querySelector(`[data-tab="${sId}"]`) as HTMLElement | null;
    if (!btn) return;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const barLeft = bar.scrollLeft;
    const barRight = barLeft + bar.clientWidth;
    if (btnLeft < barLeft) {
      bar.scrollLeft = btnLeft - 8;
    } else if (btnRight > barRight) {
      bar.scrollLeft = btnRight - bar.clientWidth + 8;
    }
  }, []);

  const scrollToSection = useCallback((sId: SectionId) => {
    const el = sectionRefs.current[sId];
    if (!el) return;

    scrollingRef.current = true;
    setActiveSection(sId);
    syncTabBar(sId);

    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });

    // Re-enable spy once scrolling has been idle for 150ms
    const onScroll = () => {
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = setTimeout(() => {
        scrollingRef.current = false;
        window.removeEventListener('scroll', onScroll);
      }, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Fallback: always re-enable after 1.5s in case scroll completes without events
    scrollIdleTimerRef.current = setTimeout(() => {
      scrollingRef.current = false;
      window.removeEventListener('scroll', onScroll);
    }, 1500);
  }, [syncTabBar]);

  const canManage = user && canManageProperties(user.role);
  const isOtherFacilities = currentProperty?.module?.code === 'OTHER_FAC';
  const isGovtFacilities = currentProperty?.module?.code === 'GOVT_FAC';
  const requiresLogin = isGovtFacilities;

  // ── Loading / error guards ─────────────────────────────────────

  if (authLoading || (!currentProperty && !currentPropertyError)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (currentPropertyError || !currentProperty) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Building2 size={48} className="text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">Property not found</h2>
        <p className="text-sm text-gray-400 max-w-xs text-center">
          {currentPropertyError || 'This property could not be loaded. It may have been removed or you may need to log in.'}
        </p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline text-sm">Go back</button>
      </div>
    );
  }

  const moduleBadgeText = getModuleBadgeText(currentProperty.module?.code);
  const moduleBadgeStyles = getModuleBadgeStyles(currentProperty.module?.code);

  // Lightbox info panel
  const lightboxInfo = (
    <div className="p-6 text-white space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant={currentProperty.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
          {currentProperty.status}
        </Badge>
        {currentProperty.module && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {currentProperty.module.name}
          </span>
        )}
      </div>
      <h2 className="text-xl font-bold leading-tight">{currentProperty.name}</h2>
      {currentProperty.address && (
        <div className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <span>{currentProperty.address}</span>
        </div>
      )}
      {currentProperty.minPrice && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Starting from</div>
          <div className="text-2xl font-black text-white">₹{currentProperty.minPrice.toLocaleString('en-IN')}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>per night</div>
        </div>
      )}
      <button
        onClick={() => scrollToSection('book')}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
      >
        Book Now
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky nav bar ──────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back / price / edit row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-2">
              {currentProperty.minPrice && (
                <span className="text-sm text-gray-500 hidden sm:block">
                  From <span className="font-bold text-gray-900">₹{currentProperty.minPrice.toLocaleString('en-IN')}</span>/night
                </span>
              )}
              {canManage && (
                <Button
                  onClick={() => navigate(`/properties/${id}/edit`)}
                  icon={<EditIcon size={14} />}
                  className="!py-1 !px-3 !text-xs"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Tab / anchor nav strip */}
          <div ref={tabBarRef} className="flex items-center overflow-x-auto scrollbar-none">
            {SECTIONS.map(({ id: sId, label, icon }) => {
              const isActive = activeSection === sId;
              const isBook = sId === 'book';
              return (
                <button
                  key={sId}
                  data-tab={sId}
                  onClick={() => scrollToSection(sId)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border-b-2 -mb-px ${
                    isActive
                      ? isBook
                        ? 'text-blue-700 border-blue-600'
                        : 'text-gray-900 border-gray-900'
                      : isBook
                      ? 'text-blue-600 border-transparent hover:border-blue-300 hover:text-blue-700'
                      : 'text-gray-500 border-transparent hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span className={isActive ? '' : 'opacity-70'}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-10">

        {/* Photo gallery — always visible */}
        <PhotoGallery
          images={currentProperty.images}
          alt={currentProperty.name}
          heroHeight="420px"
          lightboxInfo={lightboxInfo}
        />

        {/* Property title strip */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant={currentProperty.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                {currentProperty.status}
              </Badge>
              {currentProperty.module && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {currentProperty.module.name}
                </span>
              )}
              {moduleBadgeText && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${moduleBadgeStyles}`}>
                  {moduleBadgeText}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {currentProperty.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-gray-500 text-sm">
              <MapPin size={14} className="flex-shrink-0" />
              <span>{currentProperty.estate?.city || currentProperty.address}</span>
            </div>
          </div>
          {currentProperty.minPrice && (
            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Starting from</div>
              <div className="text-3xl font-black text-gray-900 leading-none">
                ₹{currentProperty.minPrice.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-400">per night</div>
              <button
                onClick={() => scrollToSection('book')}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Book Now <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── OVERVIEW ────────────────────────────────────────── */}
        <Section id="overview" sectionRefs={sectionRefs}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">Overview</h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                About this property
              </h3>
              <BasicInfoDisplay property={currentProperty} />
            </div>

            {/* ── Unified Amenities & Features ─────────────────── */}
            {(() => {
              // Resolve property-level amenity IDs → objects
              const propertyAmenityIds = currentProperty.amenities || [];
              const resolvedPropertyAmenities = propertyAmenityIds
                .map((id: string) => amenities.find(a => a.id === id))
                .filter(Boolean) as typeof amenities;
              // All amenity objects from store also usable (covers edge case where store pre-loaded all)
              const displayAmenities = resolvedPropertyAmenities.length > 0 ? resolvedPropertyAmenities : amenities;
              if (displayAmenities.length === 0) return null;

              // Group by category
              const grouped = displayAmenities.reduce((acc, a) => {
                if (!acc[a.category]) acc[a.category] = [];
                acc[a.category].push(a);
                return acc;
              }, {} as Record<string, typeof amenities>);

              return (
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                    <h3 className="text-base font-bold text-gray-900">Amenities & Features</h3>
                    <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{displayAmenities.length}</span>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([category, items]) => {
                      return (
                        <div key={category}>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{category}</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {(items as typeof amenities).map(amenity => {
                              const theme = getCategoryTheme(amenity.category);
                              const Icon = getAmenityIcon(amenity.icon);
                              return (
                                <div key={amenity.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.border} ${theme.bg} hover:shadow-sm transition-all`}>
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/60">
                                    <Icon size={14} className={theme.text} />
                                  </div>
                                  <span className={`text-xs font-medium leading-tight ${theme.text}`}>{amenity.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Layers size={16} className="text-slate-500" />
                Property Structure
              </h3>
              {hierarchyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : (
                <BlocksFloorsDisplay blocks={blocks} />
              )}
            </div>
          </div>
        </Section>

        {/* ── ROOMS & PRICING ──────────────────────────────────── */}
        <Section id="rooms" sectionRefs={sectionRefs}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">Rooms & Pricing</h2>
              {rooms.length > 0 && (
                <span className="ml-auto text-sm text-gray-400">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {hierarchyLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <Bed size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No room details available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <RoomDisplayCard key={room.id} room={room} allAmenities={amenities} onBook={() => scrollToSection('book')} />
                ))}
              </div>
            )}

            {!hierarchyLoading && rooms.length > 0 && (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" />
                    Pricing Summary
                  </h3>
                  <PricingDisplay rooms={rooms} />
                </div>

<div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4">All Room Details</h3>
                  <RoomsDisplay rooms={rooms} blocks={blocks} floors={floors} />
                </div>
              </>
            )}
          </div>
        </Section>

        {/* ── AVAILABILITY ─────────────────────────────────────── */}
        <Section id="availability" sectionRefs={sectionRefs}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">Availability</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <PropertyAvailabilityCalendar
                propertyId={id!}
                onDateSelect={(date) => {
                  if (!checkIn) {
                    setCheckIn(date);
                  } else if (!checkOut && date > checkIn) {
                    setCheckOut(date);
                    setTimeout(() => scrollToSection('book'), 300);
                  } else {
                    setCheckIn(date);
                    setCheckOut('');
                  }
                }}
                onClearDates={() => { setCheckIn(''); setCheckOut(''); }}
                selectedStartDate={checkIn}
                selectedEndDate={checkOut}
              />
              {checkIn && checkOut && (
                <div className="flex items-center justify-between px-5 py-3 bg-blue-600 border-t border-blue-700">
                  <div className="text-sm text-white">
                    <span className="font-semibold">{new Date(checkIn + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="mx-2 opacity-70">→</span>
                    <span className="font-semibold">{new Date(checkOut + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="ml-3 opacity-75 text-xs">
                      {Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                    </span>
                  </div>
                  <button
                    onClick={() => scrollToSection('book')}
                    className="px-4 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── LOCATION ─────────────────────────────────────────── */}
        <Section id="location" sectionRefs={sectionRefs}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-rose-500 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">Location & Nearby</h2>
            </div>
            {currentProperty.latitude && currentProperty.longitude ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                  <GoogleMapComponent
                    latitude={parseFloat(currentProperty.latitude as any)}
                    longitude={parseFloat(currentProperty.longitude as any)}
                    propertyName={currentProperty.name}
                    propertyAddress={currentProperty.address}
                    height="480px"
                  />
                </div>
                <div className="lg:col-span-1">
                  <NearbyPlacesPanel
                    latitude={parseFloat(currentProperty.latitude as any)}
                    longitude={parseFloat(currentProperty.longitude as any)}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <LocationDisplay property={currentProperty} />
              </div>
            )}
          </div>
        </Section>

        {/* ── REVIEWS ──────────────────────────────────────────── */}
        <Section id="reviews" sectionRefs={sectionRefs}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-amber-500 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">Guest Reviews</h2>
            </div>
            <ReviewsSection propertyName={currentProperty.name} />
          </div>
        </Section>

        {/* ── BOOK NOW ─────────────────────────────────────────── */}
        <Section id="book" sectionRefs={sectionRefs}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">Reserve Your Stay</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5">
                <h3 className="text-white font-bold text-lg">{currentProperty.name}</h3>
                <p className="text-blue-100 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin size={13} />
                  {currentProperty.estate?.city || currentProperty.address}
                </p>
              </div>
              <div className="p-6">
                <BookingFormSection
                  propertyId={id!}
                  roomTypes={roomTypes}
                  isOtherFacilities={!!isOtherFacilities}
                  isGovtFacilities={!!isGovtFacilities}
                  requiresLogin={!!requiresLogin}
                  isLoggedIn={!!user}
                  initialCheckIn={checkIn}
                  initialCheckOut={checkOut}
                  showDatesPrefilled={!!(checkIn && checkOut)}
                />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Sticky bottom bar ───────────────────────────────────── */}
      {activeSection !== 'book' && currentProperty.status === 'PUBLISHED' && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-base">{currentProperty.name}</div>
              {currentProperty.minPrice && (
                <div className="text-sm text-gray-500">
                  From <span className="font-semibold text-gray-900">₹{currentProperty.minPrice.toLocaleString('en-IN')}</span>/night
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Check Availability popup */}
              <div className="relative" ref={availPopupRef}>
                <button
                  onClick={() => setAvailPopupOpen(o => !o)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all duration-200"
                >
                  <Calendar size={15} />
                  Check Availability
                </button>
                {availPopupOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-30">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">Check Availability</h4>
                      <button onClick={() => setAvailPopupOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div className="overflow-auto max-h-[340px]">
                      <PropertyAvailabilityCalendar
                        propertyId={id!}
                        onDateSelect={(date) => {
                          if (!checkIn) {
                            setCheckIn(date);
                          } else if (!checkOut && date > checkIn) {
                            setCheckOut(date);
                          } else {
                            setCheckIn(date);
                            setCheckOut('');
                          }
                        }}
                        onClearDates={() => { setCheckIn(''); setCheckOut(''); }}
                        selectedStartDate={checkIn}
                        selectedEndDate={checkOut}
                      />
                    </div>
                    {checkIn && checkOut && (
                      <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center justify-between gap-2">
                        <div className="text-xs text-blue-700">
                          <span className="font-semibold">{new Date(checkIn + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span className="mx-1.5 opacity-60">→</span>
                          <span className="font-semibold">{new Date(checkOut + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <button
                          onClick={() => { setAvailPopupOpen(false); scrollToSection('book'); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <Calendar size={12} />
                          Book Now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => scrollToSection('book')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Calendar size={15} />
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
