import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Bed, Ruler, Layers, Info, Map, Plus, Home,
  Building2, CheckCircle, Wifi, Settings, IndianRupee,
  Zap, Droplets, Shield, FileText, AlertCircle, Images, Download,
} from 'lucide-react';
import { downloadPageAsHtml } from '../utils/downloadHtml';
import { PhotoGallery, PhotoLightbox } from '../components/ui/PhotoGallery';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../components/maps/NearbyPlacesPanel';
import { quartersService, Quarter } from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { canManageProperties } from '../utils/permissions';
import { ROUTES } from '../constants/routes';

// ── Helpers ────────────────────────────────────────────────────────

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80',
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

// ── Section definitions ────────────────────────────────────────────

type SectionId = 'overview' | 'financials' | 'amenities' | 'images' | 'location' | 'action';

interface SectionDef { id: SectionId; label: string; icon: React.ReactNode }

const BASE_SECTIONS: SectionDef[] = [
  { id: 'overview',   label: 'Overview',    icon: <Info size={14} /> },
  { id: 'financials', label: 'Financials',  icon: <IndianRupee size={14} /> },
  { id: 'amenities',  label: 'Amenities',   icon: <CheckCircle size={14} /> },
  { id: 'images',     label: 'Photos',      icon: <Images size={14} /> },
  { id: 'location',   label: 'Location',    icon: <Map size={14} /> },
];

const ALL_SECTION_IDS: SectionId[] = ['overview', 'financials', 'amenities', 'images', 'location', 'action'];

// Offset for sticky header (back row ~44px + tab strip ~48px + app header ~0 since sticky)
const HEADER_OFFSET = 96;

// ── Spec tile ─────────────────────────────────────────────────────

const SpecTile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; accent?: string }> = ({
  icon, label, value, accent,
}) => (
  <div className={`rounded-xl border p-4 ${accent ?? 'bg-white border-gray-200'} shadow-sm`}>
    <div className="flex items-center gap-1.5 text-gray-400 mb-2">{icon}<span className="text-xs font-medium">{label}</span></div>
    <div className="text-sm font-bold text-gray-900">{value}</div>
  </div>
);

// ── Section heading ───────────────────────────────────────────────

const SectionHeading: React.FC<{ icon: React.ReactNode; label: string; count?: string }> = ({ icon, label, count }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-0.5 h-6 bg-teal-600 rounded-full flex-shrink-0" />
    <div className="flex items-center gap-2 text-gray-900">
      {icon}
      <h2 className="text-base font-bold">{label}</h2>
    </div>
    {count && <span className="ml-auto text-xs text-gray-400">{count}</span>}
  </div>
);

// ── Main page ──────────────────────────────────────────────────────

export const QuarterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);

  const tabBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement>>>({});
  const scrollingRef = useRef(false);

  // Walk up from any element to find the nearest scrollable ancestor
  const getScrollContainer = useCallback((): HTMLElement => {
    for (const sId of ALL_SECTION_IDS) {
      const el = sectionRefs.current[sId];
      if (!el) continue;
      let node: HTMLElement | null = el.parentElement;
      while (node) {
        const style = window.getComputedStyle(node);
        const overflow = style.overflowY;
        if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
    }
    return document.documentElement;
  }, []);

  useEffect(() => {
    if (!id) return;
    quartersService.getQuarterById(id)
      .then(setQuarter)
      .catch(() => setQuarter(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Scroll-spy via IntersectionObserver ────────────────────────
  useEffect(() => {
    if (!quarter) return;
    const container = getScrollContainer();
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
        {
          root: container,
          rootMargin: `-${HEADER_OFFSET}px 0px -55% 0px`,
          threshold: 0,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [quarter, getScrollContainer]);

  // ── Programmatic scroll to section ─────────────────────────────
  const scrollToSection = useCallback((sId: SectionId) => {
    const el = sectionRefs.current[sId];
    if (!el) return;

    scrollingRef.current = true;
    setActiveSection(sId);

    if (tabBarRef.current) {
      const btn = tabBarRef.current.querySelector(`[data-tab="${sId}"]`) as HTMLElement | null;
      btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    const container = getScrollContainer();
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = container.scrollTop + (elRect.top - containerRect.top) - HEADER_OFFSET;
    container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });

    setTimeout(() => { scrollingRef.current = false; }, 800);
  }, [getScrollContainer]);

  const canManage = !!(user && canManageProperties(user.role));
  const isGovtOfficial = user?.role === 'govt_official';

  // ── Loading ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-600" />
        </div>
      </div>
    );
  }

  if (!quarter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Building2 size={48} className="text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700">Quarter not found</h2>
          <button onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)} className="text-blue-600 hover:underline text-sm">
            Back to Browse Quarters
          </button>
        </div>
      </div>
    );
  }

  const images = resolveImages(quarter);
  const isAvailable = quarter.occupancy_status === 'AVAILABLE';
  const lat = quarter.metadata?.latitude ? Number(quarter.metadata.latitude) : null;
  const lng = quarter.metadata?.longitude ? Number(quarter.metadata.longitude) : null;
  const hasLocation = lat !== null && lng !== null;

  const actionLabel = canManage ? 'Manage' : isGovtOfficial ? 'Request' : 'Info';
  const sections: SectionDef[] = [
    ...BASE_SECTIONS,
    { id: 'action', label: actionLabel, icon: canManage ? <Settings size={14} /> : <Plus size={14} /> },
  ];

  const electricityRate = quarter.metadata?.electricity_rate as string | undefined;
  const waterRate = quarter.metadata?.water_rate as string | undefined;
  const maintenanceCharge = quarter.metadata?.maintenance_charge as number | undefined;
  const depositMonths = quarter.metadata?.deposit_months as number | undefined;
  const rentEscalation = quarter.metadata?.rent_escalation_pct as number | undefined;

  const lightboxInfoPanel = (
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
          onClick={() => navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: quarter } })}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
        >
          Add to Request
        </button>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sticky nav bar ────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back / Identity / Action row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <button
              onClick={() => {
                if (isGovtOfficial) {
                  navigate((location.state as { from?: string } | null)?.from ?? ROUTES.QUARTERS_FREEVIEW);
                } else {
                  navigate(-1);
                }
              }}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {/* Quarter identity — center */}
            {quarter && (
              <div className="hidden sm:flex flex-col items-center leading-tight">
                <span className="font-bold text-gray-900 text-sm">{quarter.quarter_number}</span>
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>
                  /month · {quarter.bhk_config}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPageAsHtml(window.location.pathname)}
                title="Download as HTML"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 border border-gray-200 hover:border-teal-200 transition-all"
              >
                <Download size={13} />
              </button>
              {isGovtOfficial && isAvailable && (
                <button
                  onClick={() => scrollToSection('action')}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all"
                >
                  <Plus size={13} /> Add to Request
                </button>
              )}
            </div>
          </div>

          {/* Section nav strip */}
          <div ref={tabBarRef} className="flex items-center overflow-x-auto scrollbar-none">
            {sections.map(({ id: sId, label, icon }) => {
              const isActive = activeSection === sId;
              const isAction = sId === 'action';
              return (
                <button
                  key={sId}
                  data-tab={sId}
                  onClick={() => scrollToSection(sId)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border-b-2 -mb-px ${
                    isActive
                      ? isAction
                        ? 'text-teal-700 border-teal-600'
                        : 'text-slate-900 border-slate-800'
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
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10 space-y-10">

        {/* ── Hero split: gallery (left) + overview (right) ── */}
        <section
          ref={(el) => { if (el) sectionRefs.current['overview'] = el; }}
          className="scroll-mt-24"
        >
          <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: 380 }}>

            {/* Left: Photo gallery */}
            <div className="lg:w-1/2 flex-shrink-0" style={{ minHeight: 320 }}>
              <PhotoGallery
                images={images}
                alt={quarter.quarter_number}
                fillHeight
                lightboxInfo={lightboxInfoPanel}
              />
            </div>

            {/* Right: Overview details */}
            <div className="lg:w-1/2 flex flex-col gap-4 min-w-0">
              <SectionHeading icon={<Info size={15} className="text-blue-500" />} label="Quarter Specifications" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SpecTile icon={<Bed size={14} />} label="Configuration" value={quarter.bhk_config} />
                <SpecTile icon={<Ruler size={14} />} label="Area" value={`${quarter.area_sqft} sq.ft`} />
                <SpecTile icon={<Building2 size={14} />} label="Block / Floor" value={`${quarter.block_name || '—'} / Fl. ${quarter.floor_number}`} />
                <SpecTile icon={<Layers size={14} />} label="Furnishing" value={quarter.furnishing_status} />
                <SpecTile icon={<Home size={14} />} label="Quarter Type" value={quarter.quarter_type} />
                <SpecTile
                  icon={<IndianRupee size={14} />}
                  label="Monthly Rent"
                  value={<span className="text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>}
                  accent="bg-emerald-50 border-emerald-200"
                />
              </div>

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

              {quarter.description && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <Info size={14} className="text-blue-500" /> Description
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{quarter.description}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── FINANCIALS ──────────────────────────────────────── */}
        <section
          ref={(el) => { if (el) sectionRefs.current['financials'] = el; }}
          className="scroll-mt-24 space-y-5"
        >
          <SectionHeading icon={<IndianRupee size={15} className="text-emerald-600" />} label="Financial Details" />

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-emerald-800">Monthly Rent</h3>
              <span className="text-3xl font-black text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>
            </div>
            <div className="text-xs text-emerald-600 bg-emerald-100 rounded-lg px-3 py-2">
              Rent is payable monthly in advance by the 5th of each month.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800">Utility Charges</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <Zap size={14} className="text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Electricity</div>
                    <div className="text-xs text-gray-400">Metered, as per actual consumption</div>
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
                <h3 className="text-sm font-bold text-gray-800">Security Deposit</h3>
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
                <h3 className="text-sm font-bold text-gray-800">Annual Escalation</h3>
              </div>
              <div className="text-2xl font-black text-amber-600">
                {rentEscalation ? `${rentEscalation}%` : '5%'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Per annum, effective April each year</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              All charges are subject to revision as per government orders. Rent arrears may attract interest as per departmental policy. Contact the Estate Office for the latest rates.
            </p>
          </div>
        </section>

        {/* ── AMENITIES ───────────────────────────────────────── */}
        <section
          ref={(el) => { if (el) sectionRefs.current['amenities'] = el; }}
          className="scroll-mt-24 space-y-5"
        >
          <SectionHeading icon={<CheckCircle size={15} className="text-emerald-500" />} label="Amenities & Facilities" />

          {quarter.amenities?.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                <h3 className="text-sm font-bold text-slate-700 mb-3">Standard Government Quarter Inclusions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Piped water supply',
                    'Covered parking',
                    'Garbage collection',
                    'Common area lighting',
                    'Security personnel',
                    'Postal address',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle size={13} className="text-teal-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <CheckCircle size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">Amenity details not available</p>
              <p className="text-sm text-gray-400 mt-1">Contact the Estate Office for facility details</p>
            </div>
          )}
        </section>

        {/* ── IMAGES / PHOTOS ─────────────────────────────────── */}
        <section
          ref={(el) => { if (el) sectionRefs.current['images'] = el; }}
          className="scroll-mt-24 space-y-5"
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

        {/* ── LOCATION ────────────────────────────────────────── */}
        <section
          ref={(el) => { if (el) sectionRefs.current['location'] = el; }}
          className="scroll-mt-24 space-y-5"
        >
          <SectionHeading icon={<Map size={15} className="text-rose-500" />} label="Location & Nearby Places" />

          {hasLocation ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <GoogleMapComponent
                  latitude={lat!}
                  longitude={lng!}
                  propertyName={quarter.quarter_number}
                  propertyAddress={quarter.address}
                  height="480px"
                />
              </div>
              <div>
                <NearbyPlacesPanel latitude={lat!} longitude={lng!} />
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <MapPin size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Location details not available</p>
            </div>
          )}
        </section>

        {/* ── ACTION (Manage / Request / Info) ────────────────── */}
        <section
          ref={(el) => { if (el) sectionRefs.current['action'] = el; }}
          className="scroll-mt-24 space-y-5"
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
                    onClick={() => navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: quarter } })}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
                  >
                    <Plus size={16} /> Add to Allotment Request
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
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
                      onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)}
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

      {/* Standalone lightbox for Photos section */}
      {galleryOpen && (
        <PhotoLightbox
          images={images}
          initialIndex={galleryStart}
          onClose={() => setGalleryOpen(false)}
          infoPanel={lightboxInfoPanel}
        />
      )}

    </div>
  );
};
