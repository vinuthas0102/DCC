import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ArrowLeft, MapPin, Wifi, Calendar, Info, Layers, DollarSign, Map,
  Building2, Star, CheckCircle, Bed, Users, ExternalLink,
  CreditCard as EditIcon, ChevronDown, Hash, FileText, Shield,
} from 'lucide-react';
import { SpecTile } from '../ui/SpecTile';
import { RoomDisplayCard } from '../rooms/RoomDisplayCard';
import { getCategoryTheme, getAmenityIcon } from '../../utils/amenityIcons';
import { PhotoGallery } from '../ui/PhotoGallery';
import { Badge } from '../ui/Badge';
import { BookingFormSection } from './BookingFormSection';
import { BasicInfoDisplay } from './BasicInfoDisplay';
import { LocationDisplay } from './LocationDisplay';
import { BlocksFloorsDisplay } from './BlocksFloorsDisplay';
import { RoomsDisplay } from './RoomsDisplay';
import { PricingDisplay } from './PricingDisplay';
import { HallDetailsDisplay } from './HallDetailsDisplay';
import { PropertyAvailabilityCalendar } from '../availability/PropertyAvailabilityCalendar';
import { GoogleMapComponent } from '../maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../maps/NearbyPlacesPanel';
import { PropertyDTO, RoomDTO, BlockDTO, FloorDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { usePropertyStore } from '../../stores/propertyStore';
import { useAuthStore } from '../../stores/authStore';
import { canManageProperties } from '../../utils/permissions';
import { getModuleBadgeText, getModuleBadgeStyles, isHallPropertyType } from '../../utils/moduleHelpers';

// ── Section definitions ────────────────────────────────────────────

type SectionId = 'overview' | 'hall' | 'rooms' | 'availability' | 'location' | 'reviews' | 'book';

interface SectionDef { id: SectionId; label: string; icon: React.ReactNode }

const ALL_SECTIONS: SectionDef[] = [
  { id: 'overview',     label: 'Overview',        icon: <Info size={14} /> },
  { id: 'hall',         label: 'Hall Details',     icon: <Layers size={14} /> },
  { id: 'rooms',        label: 'Rooms & Pricing',  icon: <Bed size={14} /> },
  { id: 'availability', label: 'Availability',     icon: <Calendar size={14} /> },
  { id: 'location',     label: 'Location',         icon: <Map size={14} /> },
  { id: 'reviews',      label: 'Reviews',          icon: <Star size={14} /> },
  { id: 'book',         label: 'Book Now',         icon: <Calendar size={14} /> },
];

function getSections(isHall: boolean): SectionDef[] {
  return isHall
    ? ALL_SECTIONS.filter(s => s.id !== 'rooms')
    : ALL_SECTIONS.filter(s => s.id !== 'hall');
}

// ── Reviews ────────────────────────────────────────────────────────

const ReviewsPanel: React.FC<{ name: string }> = ({ name }) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      <div className="text-center">
        <div className="text-5xl font-black text-amber-600 leading-none">4.2</div>
        <div className="flex items-center justify-center gap-0.5 mt-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={15} className={s <= 4 ? 'text-amber-500 fill-amber-500' : 'text-gray-300 fill-gray-300'} />
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-1">0 reviews</div>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {[
          { label: 'Cleanliness', score: 4.4 },
          { label: 'Location',    score: 4.6 },
          { label: 'Value',       score: 4.0 },
          { label: 'Service',     score: 4.2 },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{score}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <Star size={40} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm font-semibold text-gray-600 mb-1">No reviews yet</p>
      <p className="text-xs text-gray-400 mb-3">Be the first to review {name}</p>
      <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
        <Star size={12} /> Write a Review
      </button>
    </div>
  </div>
);

// RoomCard is now handled by the shared RoomDisplayCard component

// ── Section heading ────────────────────────────────────────────────

const SectionHeading: React.FC<{ icon: React.ReactNode; label: string; count?: string }> = ({ icon, label, count }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-0.5 h-6 bg-blue-600 rounded-full flex-shrink-0" />
    <div className="flex items-center gap-2 text-gray-900">
      {icon}
      <h3 className="text-base font-bold">{label}</h3>
    </div>
    {count && <span className="ml-auto text-xs text-gray-400">{count}</span>}
  </div>
);

// ── Main modal ─────────────────────────────────────────────────────

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  inline?: boolean;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  inline = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { roomTypes, amenities } = usePropertyStore();

  const [property, setProperty] = useState<PropertyDTO | null>(null);
  const [blocks, setBlocks] = useState<BlockDTO[]>([]);
  const [floors, setFloors] = useState<FloorDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const tabBarRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement>>>({});
  // Suppress spy during programmatic scrolls
  const scrollingRef = useRef(false);

  useEffect(() => {
    if ((!isOpen && !inline) || !propertyId) return;
    setLoading(true);
    setActiveSection('overview');
    setCheckIn('');
    setCheckOut('');
    sectionRefs.current = {};

    Promise.all([
      propertyService.getPropertyById(propertyId),
      propertyService.getPropertyHierarchy(propertyId),
    ])
      .then(([prop, hierarchy]) => {
        setProperty(prop);
        setBlocks(hierarchy.blocks);
        setFloors(hierarchy.floors);
        setRooms(hierarchy.rooms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, inline, propertyId]);

  // Lock body scroll while open (skip in inline mode)
  useEffect(() => {
    if (inline) return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Scroll-spy using IntersectionObserver inside the modal body ──
  useEffect(() => {
    if (!property || !scrollBodyRef.current) return;

    const root = scrollBodyRef.current;
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id: sId }) => {
      const el = sectionRefs.current[sId];
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (scrollingRef.current) return;
          if (entry.isIntersecting) {
            setActiveSection(sId);
            // Keep active tab visible in the horizontal tab strip
            if (tabBarRef.current) {
              const btn = tabBarRef.current.querySelector(`[data-tab="${sId}"]`) as HTMLElement | null;
              btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
            }
          }
        },
        // rootMargin top offsets the sticky modal header (~112px); bottom clips lower half so
        // only the section entering the upper viewport triggers the spy
        { root, rootMargin: '-112px 0px -50% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [property]); // re-attach once property is loaded and sections are mounted

  // ── Programmatic scroll to a section inside the modal body ────────
  const scrollToSection = useCallback((sId: SectionId) => {
    const el = sectionRefs.current[sId];
    const container = scrollBodyRef.current;
    if (!el || !container) return;

    scrollingRef.current = true;
    setActiveSection(sId);

    // Scroll active tab button into view in the tab strip
    if (tabBarRef.current) {
      const btn = tabBarRef.current.querySelector(`[data-tab="${sId}"]`) as HTMLElement | null;
      btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    // Calculate position relative to the scrollable container
    // el.offsetTop is relative to its offsetParent; we walk up to find position inside `container`
    let top = 0;
    let node: HTMLElement | null = el;
    while (node && node !== container) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }

    // Subtract sticky header height inside modal (top bar ~52px + tab strip ~44px = ~96px)
    const MODAL_HEADER_H = 96;
    container.scrollTo({ top: Math.max(0, top - MODAL_HEADER_H), behavior: 'smooth' });

    setTimeout(() => { scrollingRef.current = false; }, 800);
  }, []);

  if (!isOpen && !inline) return null;

  const canManage = user && property && canManageProperties(user.role);
  const isOtherFacilities = property?.module?.code === 'OTHER_FAC';
  const isGovtFacilities = property?.module?.code === 'GOVT_FAC';
  const requiresLogin = !!isGovtFacilities;
  const moduleBadgeText = property ? getModuleBadgeText(property.module?.code) : null;
  const moduleBadgeStyles = property ? getModuleBadgeStyles(property.module?.code) : '';
  const isHall = isHallPropertyType(property?.propertyType?.code);
  const SECTIONS = getSections(isHall);

  // Lightbox info panel shown alongside the full-screen photo view
  const lightboxInfo = property ? (
    <div className="p-6 text-white space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
          {property.status}
        </Badge>
        {property.module && (
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {property.module.name}
          </span>
        )}
      </div>
      <h2 className="text-xl font-bold leading-tight">{property.name}</h2>
      {property.address && (
        <div className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span>{property.address}</span>
        </div>
      )}
      {property.minPrice && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Starting from</div>
          <div className="text-2xl font-black text-white">₹{property.minPrice.toLocaleString('en-IN')}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>per night</div>
        </div>
      )}
      <button
        onClick={() => scrollToSection('book')}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
      >
        Book Now
      </button>
    </div>
  ) : null;

  const panelContent = (
        <div
          className={inline ? "relative bg-gray-50 w-full h-full flex flex-col overflow-hidden" : "relative bg-gray-50 w-full max-w-5xl h-full sm:h-[94vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Sticky modal header ─────────────────────────────── */}
          <div className="flex-none bg-white border-b border-gray-200">
            {/* Top bar: Close / Full Page / Edit / X */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              {!inline ? (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={15} /> Close
                </button>
              ) : (
                <div className="w-6" />
              )}

              {/* Property identity — centre */}
              {property && (
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-bold text-gray-900 text-sm">{property.name}</span>
                  <span className="text-xs text-gray-500">
                    {property.propertyType?.name ?? property.assetType?.name ?? 'Property'}
                    {property.minPrice
                      ? <> · <span className="font-semibold text-emerald-700">₹{property.minPrice.toLocaleString('en-IN')}</span>/night</>
                      : null
                    }
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {property && (
                  <button
                    onClick={() => { navigate(`/properties/${propertyId}`); if (!inline) onClose(); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all"
                  >
                    <ExternalLink size={12} /> Full Page
                  </button>
                )}
                {canManage && property && (
                  <button
                    onClick={() => { navigate(`/properties/${propertyId}/edit`); if (!inline) onClose(); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all"
                  >
                    <EditIcon size={12} /> Edit
                  </button>
                )}
                {!inline && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Tab / anchor nav strip */}
            {property && (
              <div ref={tabBarRef} className="flex items-center overflow-x-auto scrollbar-none px-4">
                {SECTIONS.map(({ id: sId, label, icon }) => {
                  const isActive = activeSection === sId;
                  const isBook = sId === 'book';
                  return (
                    <button
                      key={sId}
                      data-tab={sId}
                      onClick={() => scrollToSection(sId)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border-b-2 -mb-px ${
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
            )}
          </div>

          {/* ── Scrollable body ──────────────────────────────────── */}
          <div ref={scrollBodyRef} className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600" />
              </div>
            ) : !property ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Building2 size={40} className="text-gray-300" />
                <p className="text-gray-500">Failed to load property details</p>
                <button onClick={onClose} className="text-sm text-blue-600 hover:underline">Close</button>
              </div>
            ) : (
              <div className="p-5 pb-24 space-y-8">

                {/* ── OVERVIEW: split hero — gallery left, specs right ── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['overview'] = el; }}
                >
                  <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 340 }}>

                    {/* Left: Photo gallery */}
                    <div className="lg:w-1/2 flex-shrink-0" style={{ minHeight: 280 }}>
                      <PhotoGallery
                        images={property.images}
                        alt={property.name}
                        fillHeight
                        lightboxInfo={lightboxInfo}
                      />
                    </div>

                    {/* Right: Property specs */}
                    <div className="lg:w-1/2 flex flex-col gap-3 min-w-0">
                      <SectionHeading icon={<Info size={15} className="text-blue-500" />} label="Property Details" />

                      {/* Status / module badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                          {property.status}
                        </Badge>
                        {property.module && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {property.module.name}
                          </span>
                        )}
                        {moduleBadgeText && (
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${moduleBadgeStyles}`}>
                            {moduleBadgeText}
                          </span>
                        )}
                      </div>

                      {/* Spec tiles grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <SpecTile icon={<Building2 size={14} />} label="Property Name" value={property.name} />
                        <SpecTile icon={<Hash size={14} />} label="Code" value={<span className="font-mono">{property.code}</span>} />
                        {property.propertyType && (
                          <SpecTile icon={<Layers size={14} />} label="Type" value={property.propertyType.name} />
                        )}
                        {property.assetType && (
                          <SpecTile icon={<Building2 size={14} />} label="Asset Type" value={property.assetType.name} />
                        )}
                        {property.totalRooms != null && property.totalRooms > 0 && (
                          <SpecTile icon={<Bed size={14} />} label="Total Rooms" value={`${property.totalRooms} room${property.totalRooms !== 1 ? 's' : ''}`} />
                        )}
                        {property.minPrice != null && (
                          <SpecTile
                            icon={<DollarSign size={14} />}
                            label="Starting From"
                            value={<span className="text-emerald-700">₹{property.minPrice.toLocaleString('en-IN')}/night</span>}
                            accent="bg-emerald-50 border-emerald-200"
                          />
                        )}
                        {isHall && property.hallDetails && property.hallDetails.capacity.mainHallSeating > 0 && (
                          <SpecTile icon={<Users size={14} />} label="Hall Seating" value={`${property.hallDetails.capacity.mainHallSeating.toLocaleString()} seats`} />
                        )}
                        {property.isExempt && (
                          <SpecTile
                            icon={<Shield size={14} />}
                            label="Booking Rules"
                            value="Exempt"
                            accent="bg-amber-50 border-amber-200"
                          />
                        )}
                      </div>

                      {/* Description */}
                      {property.description && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <FileText size={13} className="text-blue-500" /> Description
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{property.description}</p>
                        </div>
                      )}

                      {/* Location preview */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-auto">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <MapPin size={13} className="text-rose-500" /> Location
                        </h4>
                        <p className="text-sm text-gray-600">{property.address || property.estate?.city || 'Address not available'}</p>
                        <button
                          onClick={() => scrollToSection('location')}
                          className="mt-2 text-xs text-blue-600 hover:underline font-medium"
                        >
                          View on map →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Amenities below the hero */}
                  {(() => {
                    const propertyAmenityIds = property.amenities || [];
                    const resolvedAmenities = propertyAmenityIds
                      .map((id: string) => amenities.find(a => a.id === id))
                      .filter(Boolean) as typeof amenities;
                    if (resolvedAmenities.length === 0) return null;
                    const grouped = resolvedAmenities.reduce((acc: Record<string, typeof amenities>, a) => {
                      if (!acc[a.category]) acc[a.category] = [];
                      acc[a.category].push(a);
                      return acc;
                    }, {});
                    return (
                      <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <CheckCircle size={13} className="text-emerald-500" /> Amenities & Features
                          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{resolvedAmenities.length}</span>
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(grouped).map(([category, items]) => (
                            <div key={category}>
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{category}</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {(items as typeof amenities).map(amenity => {
                                  const theme = getCategoryTheme(amenity.category);
                                  const Icon = getAmenityIcon(amenity.icon);
                                  return (
                                    <div key={amenity.id} className={`flex items-center gap-2 p-2 rounded-lg border ${theme.border} ${theme.bg}`}>
                                      <Icon size={12} className={`flex-shrink-0 ${theme.text}`} />
                                      <span className={`text-[11px] font-medium truncate ${theme.text}`}>{amenity.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {!isHall && blocks.length > 0 && (
                    <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Layers size={13} className="text-slate-500" /> Structure
                      </h4>
                      <BlocksFloorsDisplay blocks={blocks} />
                    </div>
                  )}
                </section>

                {/* ── HALL DETAILS (Community / Marriage Hall only) ── */}
                {isHall && (
                  <section
                    ref={(el) => { if (el) sectionRefs.current['hall'] = el; }}
                    className="space-y-4"
                  >
                    <SectionHeading
                      icon={<Layers size={15} className="text-blue-500" />}
                      label="Hall Details"
                    />
                    {property.hallDetails ? (
                      <HallDetailsDisplay hall={property.hallDetails} hallCode={property.code} />
                    ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <Layers size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400">No hall details added yet</p>
                      </div>
                    )}
                  </section>
                )}

                {/* ── ROOMS & PRICING (non-hall only) ────────────── */}
                {!isHall && (
                  <section
                    ref={(el) => { if (el) sectionRefs.current['rooms'] = el; }}
                    className="space-y-4"
                  >
                    <SectionHeading
                      icon={<Bed size={15} className="text-blue-500" />}
                      label="Rooms & Pricing"
                      count={rooms.length > 0 ? `${rooms.length} room${rooms.length !== 1 ? 's' : ''}` : undefined}
                    />

                    {rooms.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <Bed size={36} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400">No room details available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rooms.map((room) => (
                          <RoomDisplayCard key={room.id} room={room} allAmenities={amenities} onBook={() => scrollToSection('book')} />
                        ))}
                      </div>
                    )}

                    {rooms.length > 0 && (
                      <>
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <DollarSign size={13} className="text-emerald-500" /> Pricing Summary
                          </h4>
                          <PricingDisplay rooms={rooms} />
                        </div>
                      </>
                    )}
                  </section>
                )}

                {/* ── AVAILABILITY ───────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['availability'] = el; }}
                  className="space-y-4"
                >
                  <SectionHeading icon={<Calendar size={15} className="text-blue-500" />} label="Availability" />

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <PropertyAvailabilityCalendar
                      propertyId={propertyId}
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
                      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600 border-t border-blue-700 rounded-b-xl mt-0">
                        <div className="text-xs text-white">
                          <span className="font-semibold">{new Date(checkIn + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="mx-1.5 opacity-70">→</span>
                          <span className="font-semibold">{new Date(checkOut + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="ml-2 opacity-75">
                            · {Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                          </span>
                        </div>
                        <button
                          onClick={() => scrollToSection('book')}
                          className="px-3 py-1 bg-white text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* ── LOCATION ───────────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['location'] = el; }}
                  className="space-y-4"
                >
                  <SectionHeading icon={<Map size={15} className="text-rose-500" />} label="Location & Nearby" />

                  {property.latitude && property.longitude ? (
                    <div className="grid lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <GoogleMapComponent
                          latitude={parseFloat(property.latitude as any)}
                          longitude={parseFloat(property.longitude as any)}
                          propertyName={property.name}
                          propertyAddress={property.address}
                          height="400px"
                        />
                      </div>
                      <div>
                        <NearbyPlacesPanel
                          latitude={parseFloat(property.latitude as any)}
                          longitude={parseFloat(property.longitude as any)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <LocationDisplay property={property} />
                    </div>
                  )}
                </section>

                {/* ── REVIEWS ────────────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['reviews'] = el; }}
                >
                  <SectionHeading icon={<Star size={15} className="text-amber-500" />} label="Guest Reviews" />
                  <ReviewsPanel name={property.name} />
                </section>

                {/* ── BOOK NOW ───────────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['book'] = el; }}
                >
                  <SectionHeading icon={<Calendar size={15} className="text-blue-600" />} label="Reserve Your Stay" />
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4">
                      <h4 className="text-white font-bold">{property.name}</h4>
                      <p className="text-blue-100 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />{property.estate?.city || property.address}
                      </p>
                    </div>
                    <div className="p-5">
                      <BookingFormSection
                        propertyId={propertyId}
                        roomTypes={roomTypes}
                        isOtherFacilities={!!isOtherFacilities}
                        isGovtFacilities={!!isGovtFacilities}
                        requiresLogin={requiresLogin}
                        isLoggedIn={!!user}
                        initialCheckIn={checkIn}
                        initialCheckOut={checkOut}
                        showDatesPrefilled={!!(checkIn && checkOut)}
                      />
                    </div>
                  </div>
                </section>

              </div>
            )}
          </div>

          {/* ── Sticky Book Now bottom bar ───────────────────────── */}
          {property && activeSection !== 'book' && property.status === 'PUBLISHED' && (
            <div className="flex-none bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-sm">{property.name}</div>
                {property.minPrice && (
                  <div className="text-xs text-gray-500">
                    From <span className="font-semibold text-gray-900">₹{property.minPrice.toLocaleString('en-IN')}</span>/night
                  </div>
                )}
              </div>
              <button
                onClick={() => scrollToSection('book')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                <Calendar size={13} /> Book Now
              </button>
            </div>
          )}
        </div>
  );

  if (inline) {
    return panelContent;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="fixed inset-x-0 bottom-0 top-6 z-[801] flex items-end sm:items-center justify-center px-0 sm:px-4 lg:px-8">
        {panelContent}
      </div>
    </>
  );
};
