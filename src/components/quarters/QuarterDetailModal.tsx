import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ArrowLeft, MapPin, Info, Map, Plus, Home,
  Building2, CheckCircle, Wifi, Settings, IndianRupee,
  Zap, Droplets, Shield, FileText, AlertCircle, ExternalLink,
  Images, Bed, Ruler, Layers, FlaskConical, Download,
  Car, Flame, Wind, Star, ParkingSquare, Bath, Wrench,
} from 'lucide-react';
import { downloadElementAsHtml } from '../../utils/downloadHtml';
import { PhotoGallery, PhotoLightbox } from '../ui/PhotoGallery';
import { GoogleMapComponent } from '../maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../maps/NearbyPlacesPanel';
import { quartersService, Quarter } from '../../services/quartersService';
import { SpecTile } from '../ui/SpecTile';
import { SectionHeading } from '../ui/SectionHeading';
import { useAuthStore } from '../../stores/authStore';
import { canManageProperties } from '../../utils/permissions';
import { ROUTES } from '../../constants/routes';

// ── Section definitions ────────────────────────────────────────────

type SectionId = 'overview' | 'financials' | 'amenities' | 'images' | 'location' | 'action';

interface SectionDef { id: SectionId; label: string; icon: React.ReactNode }

const BASE_SECTIONS: SectionDef[] = [
  { id: 'overview',   label: 'Overview',    icon: <Info size={13} /> },
  { id: 'financials', label: 'Financials',  icon: <IndianRupee size={13} /> },
  { id: 'amenities',  label: 'Amenities',   icon: <CheckCircle size={13} /> },
  { id: 'images',     label: 'Photos',      icon: <Images size={13} /> },
  { id: 'location',   label: 'Location',    icon: <Map size={13} /> },
];

const ALL_SECTION_IDS: SectionId[] = ['overview', 'financials', 'amenities', 'images', 'location', 'action'];

// ── Helpers ────────────────────────────────────────────────────────

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
];

function resolveImages(q: Quarter): string[] {
  let images: unknown = q.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images as string);
    } catch {
      images = (images as string)
        .replace(/^\{/, '').replace(/\}$/, '')
        .split(',')
        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) return images as string[];
  return FALLBACK_IMAGES;
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

// ── Modal ─────────────────────────────────────────────────────────

interface QuarterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quarterId: string;
  inline?: boolean;
}

export const QuarterDetailModal: React.FC<QuarterDetailModalProps> = ({
  isOpen,
  onClose,
  quarterId,
  inline = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);

  const tabBarRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement>>>({});
  const scrollingRef = useRef(false);

  useEffect(() => {
    if ((!isOpen && !inline) || !quarterId) return;
    setLoading(true);
    setActiveSection('overview');
    setGalleryOpen(false);
    sectionRefs.current = {};

    quartersService.getQuarterById(quarterId)
      .then(setQuarter)
      .catch(() => setQuarter(null))
      .finally(() => setLoading(false));
  }, [isOpen, inline, quarterId]);

  // Lock body scroll while open (not needed in inline mode)
  useEffect(() => {
    if (inline) return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, inline]);

  // Escape key close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Scroll-spy (root = modal scrollable body) ──────────────────
  useEffect(() => {
    if (!quarter || !scrollBodyRef.current) return;
    const root = scrollBodyRef.current;
    const observers: IntersectionObserver[] = [];

    ALL_SECTION_IDS.forEach((sId) => {
      const el = sectionRefs.current[sId];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (scrollingRef.current) return;
          if (entry.isIntersecting) {
            setActiveSection(sId);
            if (tabBarRef.current) {
              const btn = tabBarRef.current.querySelector(`[data-tab="${sId}"]`) as HTMLElement | null;
              btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
            }
          }
        },
        { root, rootMargin: '-112px 0px -50% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [quarter]);

  // ── Programmatic scroll inside the modal body ─────────────────
  const scrollToSection = useCallback((sId: SectionId) => {
    const el = sectionRefs.current[sId];
    const container = scrollBodyRef.current;
    if (!el || !container) return;

    scrollingRef.current = true;
    setActiveSection(sId);

    if (tabBarRef.current) {
      const btn = tabBarRef.current.querySelector(`[data-tab="${sId}"]`) as HTMLElement | null;
      btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    let top = 0;
    let node: HTMLElement | null = el;
    while (node && node !== container) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }

    const MODAL_HEADER_H = 96;
    container.scrollTo({ top: Math.max(0, top - MODAL_HEADER_H), behavior: 'smooth' });

    setTimeout(() => { scrollingRef.current = false; }, 800);
  }, []);

  if (!isOpen && !inline) return null;

  const canManage = !!(user && canManageProperties(user.role));
  const isGovtOfficial = user?.role === 'govt_official';

  const actionLabel = canManage ? 'Manage' : isGovtOfficial ? 'Request' : 'Info';
  const sections: SectionDef[] = [
    ...BASE_SECTIONS,
    { id: 'action', label: actionLabel, icon: canManage ? <Settings size={13} /> : <Plus size={13} /> },
  ];

  const images = quarter ? resolveImages(quarter) : [];
  const isAvailable = quarter?.occupancy_status === 'AVAILABLE';
  const lat = quarter?.metadata?.latitude ? Number(quarter.metadata.latitude) : null;
  const lng = quarter?.metadata?.longitude ? Number(quarter.metadata.longitude) : null;
  const hasLocation = lat !== null && lng !== null;

  const electricityRate = quarter?.metadata?.electricity_rate as string | undefined;
  const waterRate = quarter?.metadata?.water_rate as string | undefined;
  const maintenanceCharge = quarter?.metadata?.maintenance_charge as number | undefined;
  const depositMonths = quarter?.metadata?.deposit_months as number | undefined;
  const rentEscalation = quarter?.metadata?.rent_escalation_pct as number | undefined;

  const lightboxInfo = quarter ? (
    <div className="p-6 text-white space-y-4">
      <div className="flex gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getOccupancyBadge(quarter.occupancy_status)}`}>
          {isAvailable ? 'Available' : 'Occupied'}
        </span>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {quarter.quarter_type}
        </span>
      </div>
      <h2 className="text-xl font-bold">{quarter.quarter_number}</h2>
      {quarter.address && (
        <div className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span>{quarter.address}</span>
        </div>
      )}
      <div
        className="rounded-xl p-3 space-y-2"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Configuration</span>
          <span className="font-bold text-white">{quarter.bhk_config}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Area</span>
          <span className="font-bold text-white">{quarter.area_sqft} sq.ft</span>
        </div>
        <div className="pt-2 flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Monthly Rent</span>
          <span className="font-black text-lg text-emerald-300">{fmtINR(quarter.monthly_rent)}</span>
        </div>
      </div>
      {isGovtOfficial && isAvailable && (
        <button
          onClick={() => { navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: quarter } }); onClose(); }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
        >
          Add to Request
        </button>
      )}
    </div>
  ) : null;

  const panelContent = (
        <div
          ref={contentRef}
          className={inline ? "relative bg-gray-50 w-full h-full flex flex-col overflow-hidden" : "relative bg-gray-50 w-full max-w-5xl h-full sm:h-[94vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Sticky modal header ──────────────────────────── */}
          <div className="flex-none bg-white border-b border-gray-200">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              {!inline ? (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={15} /> Close
                </button>
              ) : <div className="w-6" />}

              {/* Quarter identity — center */}
              {quarter && (
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-bold text-gray-900 text-sm">{quarter.quarter_number}</span>
                  <span className="text-xs text-gray-500">
                    <span className="font-semibold text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>
                    /month · {quarter.bhk_config}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {quarter && (
                  <>
                    <button
                      onClick={() => { navigate(`/quarters/${quarterId}`, { state: { from: '/quarters' } }); if (!inline) onClose(); }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 border border-gray-200 hover:border-teal-200 transition-all"
                    >
                      <ExternalLink size={12} /> Full Page
                    </button>
                    <button
                      onClick={() => contentRef.current && downloadElementAsHtml(contentRef.current, quarter.quarter_number, `Quarter_${quarter.quarter_number}`)}
                      title="Download as HTML"
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 border border-gray-200 hover:border-teal-200 transition-all"
                    >
                      <Download size={12} />
                    </button>
                  </>
                )}
                {isGovtOfficial && quarter && isAvailable && (
                  <button
                    onClick={() => scrollToSection('action')}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all"
                  >
                    <Plus size={12} /> Add to Request
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

            {/* Section nav strip */}
            {quarter && (
              <div ref={tabBarRef} className="flex items-center overflow-x-auto scrollbar-none px-4">
                {sections.map(({ id: sId, label, icon }) => {
                  const isActive = activeSection === sId;
                  const isAction = sId === 'action';
                  return (
                    <button
                      key={sId}
                      data-tab={sId}
                      onClick={() => scrollToSection(sId)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border-b-2 -mb-px ${
                        isActive
                          ? isAction
                            ? 'text-teal-700 border-teal-600'
                            : 'text-gray-900 border-gray-900'
                          : isAction
                          ? 'text-teal-600 border-transparent hover:border-teal-300 hover:text-teal-700'
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
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-teal-600" />
              </div>
            ) : !quarter ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Building2 size={40} className="text-gray-300" />
                <p className="text-gray-500">Failed to load quarter details</p>
                <button onClick={onClose} className="text-sm text-blue-600 hover:underline">Close</button>
              </div>
            ) : (
              <div className="p-5 pb-8 space-y-8">

                {/* ── Hero split: gallery (left) + overview (right) ── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['overview'] = el; }}
                >
                  <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 340 }}>

                    {/* Left: Photo gallery */}
                    <div className="lg:w-1/2 flex-shrink-0" style={{ minHeight: 280 }}>
                      <PhotoGallery
                        images={images}
                        alt={quarter.quarter_number}
                        fillHeight
                        lightboxInfo={lightboxInfo}
                      />
                    </div>

                    {/* Right: Overview details */}
                    <div className="lg:w-1/2 flex flex-col gap-3 min-w-0">
                      <SectionHeading icon={<Info size={15} className="text-blue-500" />} label="Quarter Specifications" />

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <SpecTile icon={<Bed size={14} />} label="Configuration" value={quarter.bhk_config} />
                        <SpecTile icon={<Ruler size={14} />} label="Area" value={`${quarter.area_sqft} sq.ft`} />
                        <SpecTile icon={<Building2 size={14} />} label="Block / Floor" value={`${quarter.block_name || '—'} / Fl. ${quarter.floor_number}`} />
                        <SpecTile icon={<Layers size={14} />} label="Furnishing" value={quarter.furnishing_status} />
                        <SpecTile icon={<FlaskConical size={14} />} label="Toilet Type" value={quarter.toilet_type || 'Western'} />
                        <SpecTile icon={<Home size={14} />} label="Quarter Type" value={quarter.quarter_type} />
                        {quarter.housing_style && (
                          <SpecTile icon={<Home size={14} />} label="Housing Style" value={quarter.housing_style} />
                        )}
                        {quarter.renovation_status && (
                          <SpecTile icon={<Wrench size={14} />} label="Renovation" value={quarter.renovation_status} />
                        )}
                        {quarter.facing && (
                          <SpecTile icon={<Star size={14} />} label="Facing" value={quarter.facing} />
                        )}
                        {quarter.resident_type && (
                          <SpecTile icon={<Layers size={14} />} label="Resident Type" value={quarter.resident_type} />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <SpecTile
                          icon={<IndianRupee size={14} />}
                          label="Monthly Rent"
                          value={<span className="text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>}
                          accent="bg-emerald-50 border-emerald-200"
                        />
                        <SpecTile
                          icon={<CheckCircle size={14} />}
                          label="Status"
                          value={
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${getOccupancyBadge(quarter.occupancy_status)}`}>
                              <CheckCircle size={10} />
                              {isAvailable ? 'Available' : 'Occupied'}
                            </span>
                          }
                        />
                      </div>

                      {quarter.description && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <Info size={13} className="text-blue-500" /> Description
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{quarter.description}</p>
                        </div>
                      )}

                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-auto">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <MapPin size={13} className="text-rose-500" /> Location
                        </h4>
                        <p className="text-sm text-gray-600">{quarter.address || 'Address not available'}</p>
                        {hasLocation && (
                          <button
                            onClick={() => scrollToSection('location')}
                            className="mt-2 text-xs text-teal-600 hover:underline font-medium"
                          >
                            View on map →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── FINANCIALS ───────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['financials'] = el; }}
                  className="space-y-4"
                >
                  <SectionHeading icon={<IndianRupee size={15} className="text-emerald-600" />} label="Financial Details" />

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-emerald-800">Monthly Rent</h4>
                      <span className="text-3xl font-black text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>
                    </div>
                    <div className="text-xs text-emerald-600 bg-emerald-100 rounded-lg px-3 py-2">
                      Rent is payable monthly in advance by the 5th of each month.
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Utility Charges</h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                            <Zap size={14} className="text-yellow-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">Electricity</div>
                            <div className="text-xs text-gray-400">Metered, as per actual</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                          {electricityRate ? `₹${electricityRate}/unit` : 'As per actual'}
                        </div>
                      </div>
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Droplets size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">Water</div>
                            <div className="text-xs text-gray-400">Flat charge per month</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                          {waterRate ? `₹${waterRate}/month` : 'Included'}
                        </div>
                      </div>
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Shield size={14} className="text-slate-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">Maintenance</div>
                            <div className="text-xs text-gray-400">Common area upkeep</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                          {maintenanceCharge ? fmtINR(maintenanceCharge) : 'Nil'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={15} className="text-slate-500" />
                        <h4 className="text-sm font-bold text-gray-800">Security Deposit</h4>
                      </div>
                      <div className="text-2xl font-black text-slate-700">
                        {depositMonths
                          ? `${depositMonths} month${depositMonths > 1 ? 's' : ''} rent`
                          : fmtINR(quarter.monthly_rent * 2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Refundable on vacating</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={15} className="text-amber-500" />
                        <h4 className="text-sm font-bold text-gray-800">Annual Escalation</h4>
                      </div>
                      <div className="text-2xl font-black text-amber-600">
                        {rentEscalation ? `${rentEscalation}%` : '5%'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Per annum, effective April</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <Info size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      All charges are subject to revision as per government orders. Contact the Estate Office for the latest rates.
                    </p>
                  </div>
                </section>

                {/* ── AMENITIES ────────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['amenities'] = el; }}
                  className="space-y-4"
                >
                  <SectionHeading icon={<CheckCircle size={15} className="text-emerald-500" />} label="Amenities & Facilities" />

                  {quarter.amenities?.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {quarter.amenities.map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-teal-200 hover:shadow-md transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                              <Wifi size={14} className="text-teal-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 leading-tight">{amenity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Standard Inclusions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Piped water supply', 'Covered parking', 'Garbage collection', 'Common area lighting', 'Security personnel', 'Postal address'].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle size={13} className="text-teal-500 flex-shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <CheckCircle size={36} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-medium text-sm">Amenity details not available</p>
                      <p className="text-xs text-gray-400 mt-1">Contact the Estate Office for details</p>
                    </div>
                  )}

                  {/* ── Property Features ────────────────────────── */}
                  {(() => {
                    const boolFeatures: { label: string; value: boolean; icon: React.ReactNode }[] = [
                      { label: 'Western Toilet',   value: !!quarter.toilet_western,   icon: <Bath size={13} className="text-blue-500" /> },
                      { label: 'Indian Toilet',    value: !!quarter.toilet_indian,    icon: <Bath size={13} className="text-blue-500" /> },
                      { label: 'Car Parking',      value: !!quarter.parking_details,  icon: <Car size={13} className="text-slate-500" /> },
                      { label: 'Pooja Room',       value: !!quarter.pooja_room,       icon: <Flame size={13} className="text-amber-500" /> },
                      { label: 'Balcony',          value: !!quarter.balcony,          icon: <Home size={13} className="text-teal-500" /> },
                      { label: 'Kitchen Exhaust',  value: !!quarter.kitchen_exhaust,  icon: <Wind size={13} className="text-sky-500" /> },
                      { label: 'Lift Access',      value: !!quarter.lift_access,      icon: <Building2 size={13} className="text-indigo-500" /> },
                      { label: 'Power Backup',     value: !!quarter.power_backup,     icon: <Zap size={13} className="text-yellow-500" /> },
                    ];
                    const hasAny = boolFeatures.some(f => f.value) || quarter.water_heating || quarter.electrical_fixtures || quarter.parking_details;
                    if (!hasAny) return null;
                    return (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Settings size={13} className="text-gray-500" /> Property Features
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                          {boolFeatures.map(f => (
                            <div key={f.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${f.value ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                              {f.icon}
                              {f.label}
                              <span className={`ml-auto text-[10px] font-bold ${f.value ? 'text-emerald-600' : 'text-gray-400'}`}>{f.value ? 'Yes' : 'No'}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {quarter.parking_details && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <ParkingSquare size={12} className="text-slate-400 shrink-0" />
                              <span className="font-medium text-gray-500">Parking:</span>
                              <span>{quarter.parking_details}</span>
                            </div>
                          )}
                          {quarter.water_heating && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Droplets size={12} className="text-blue-400 shrink-0" />
                              <span className="font-medium text-gray-500">Water Heating:</span>
                              <span>{quarter.water_heating}</span>
                            </div>
                          )}
                          {quarter.electrical_fixtures && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Zap size={12} className="text-yellow-400 shrink-0" />
                              <span className="font-medium text-gray-500">Electrical:</span>
                              <span>{quarter.electrical_fixtures}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </section>

                {/* ── PHOTOS ───────────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['images'] = el; }}
                  className="space-y-4"
                >
                  <SectionHeading
                    icon={<Images size={15} className="text-slate-500" />}
                    label="All Photos"
                    count={`${images.length} photo${images.length !== 1 ? 's' : ''}`}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((src, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
                        onClick={() => { setGalleryStart(i); setGalleryOpen(true); }}
                      >
                        <img
                          src={src}
                          alt={`${quarter.quarter_number} photo ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES[0]; }}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── LOCATION ─────────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['location'] = el; }}
                  className="space-y-4"
                >
                  <SectionHeading icon={<Map size={15} className="text-rose-500" />} label="Location & Nearby Places" />

                  {hasLocation ? (
                    <div className="grid lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <GoogleMapComponent
                          latitude={lat!}
                          longitude={lng!}
                          propertyName={quarter.quarter_number}
                          propertyAddress={quarter.address}
                          height="380px"
                        />
                      </div>
                      <div>
                        <NearbyPlacesPanel latitude={lat!} longitude={lng!} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <MapPin size={36} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">Location details not available</p>
                    </div>
                  )}
                </section>

                {/* ── ACTION ───────────────────────────────────── */}
                <section
                  ref={(el) => { if (el) sectionRefs.current['action'] = el; }}
                  className="space-y-4"
                >
                  <SectionHeading
                    icon={
                      canManage
                        ? <Settings size={15} className="text-slate-600" />
                        : <Plus size={15} className="text-blue-600" />
                    }
                    label={
                      canManage
                        ? 'Manage Quarter'
                        : isGovtOfficial
                        ? (isAvailable ? 'Request This Quarter' : 'Quarter Unavailable')
                        : 'Allotment Information'
                    }
                  />

                  {canManage ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                          { label: 'Quarter No.',  value: quarter.quarter_number },
                          { label: 'Config',       value: quarter.bhk_config },
                          { label: 'Area',         value: `${quarter.area_sqft} sq.ft` },
                          { label: 'Rent',         value: fmtINR(quarter.monthly_rent) },
                        ].map((item) => (
                          <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                            <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                            <div className="text-sm font-bold text-gray-900">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : isGovtOfficial ? (
                    isAvailable ? (
                      <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-teal-600 rounded-2xl p-8 shadow-xl text-white">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                          {[
                            { label: 'Quarter',  value: quarter.quarter_number },
                            { label: 'Config',   value: quarter.bhk_config },
                            { label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
                            { label: 'Rent',     value: fmtINR(quarter.monthly_rent) },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="rounded-xl p-3"
                              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                              <div className="text-xs text-blue-100 mb-0.5">{item.label}</div>
                              <div className="text-sm font-bold">{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => { navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: quarter } }); onClose(); }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
                          >
                            <Plus size={16} /> Add to Allotment Request
                          </button>
                          <button
                            onClick={() => { navigate(ROUTES.QUARTERS_REQUESTS); onClose(); }}
                            className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl font-medium text-sm transition-colors"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
                          >
                            View My Requests
                          </button>
                        </div>
                        <p className="text-xs text-blue-200 mt-4">
                          This quarter will be added as a preference in your allotment request form.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gray-100 rounded-xl">
                            <Building2 size={20} className="text-gray-500" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 mb-1">Currently Occupied</div>
                            <p className="text-sm text-gray-600">
                              This quarter is occupied at the moment. Browse other available quarters.
                            </p>
                            <button
                              onClick={() => { navigate(ROUTES.QUARTERS_FREEVIEW); onClose(); }}
                              className="mt-3 inline-flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors font-medium"
                            >
                              Browse Available Quarters
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <Home size={20} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-2">Official Allotment Process</div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Government quarters are allocated through an official allotment cycle process managed by the Estate Office. Only authorised government officials can submit allotment requests. Contact your department's administrative office for eligibility and process details.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

              </div>
            )}
          </div>

        </div>
  );

  if (inline) {
    return (
      <>
        {panelContent}
        {galleryOpen && quarter && (
          <div style={{ zIndex: 900 }} className="fixed inset-0">
            <PhotoLightbox
              images={images}
              initialIndex={galleryStart}
              onClose={() => setGalleryOpen(false)}
              infoPanel={lightboxInfo}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="fixed inset-x-0 bottom-0 top-6 z-[801] flex items-end sm:items-center justify-center px-0 sm:px-4 lg:px-8">
        {panelContent}
      </div>

      {/* Standalone lightbox for Photos section */}
      {galleryOpen && quarter && (
        <div style={{ zIndex: 900 }} className="fixed inset-0">
          <PhotoLightbox
            images={images}
            initialIndex={galleryStart}
            onClose={() => setGalleryOpen(false)}
            infoPanel={lightboxInfo}
          />
        </div>
      )}
    </>
  );
};
