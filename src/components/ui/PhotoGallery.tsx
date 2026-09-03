import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Grid3x3 as Grid3X3, Maximize2 } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  alt?: string;
  onShowAll?: () => void;
}

interface LightboxProps {
  images: string[];
  alt?: string;
  initialIndex?: number;
  onClose: () => void;
  infoPanel?: React.ReactNode;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

export const PhotoLightbox: React.FC<LightboxProps> = ({
  images,
  alt = 'Photo',
  initialIndex = 0,
  onClose,
  infoPanel,
}) => {
  const [active, setActive] = useState(initialIndex);
  const [animating, setAnimating] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const go = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setActive(idx);
    setTimeout(() => setAnimating(false), 250);
  }, [animating]);

  const prev = useCallback(() => go((active - 1 + images.length) % images.length), [active, go, images.length]);
  const next = useCallback(() => go((active + 1) % images.length), [active, go, images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbsRef.current) return;
    const el = thumbsRef.current.querySelector(`[data-idx="${active}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const content = (
    <div
      style={{ background: 'rgba(3, 7, 18, 0.97)', zIndex: 99999 }}
      className="fixed inset-0 flex flex-col"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-5 py-3.5" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm truncate max-w-xs opacity-90">{alt}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
          >
            {active + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            aria-label="Close gallery"
          >
            <X size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────── */}
      <div className={`flex flex-1 min-h-0 ${infoPanel ? 'md:flex-row' : ''}`}>
        {/* Image pane */}
        <div className="flex-1 relative flex items-center justify-center min-w-0 min-h-0 px-16 py-4">
          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} className="text-white" />
            </button>
          )}

          {/* Main image */}
          <img
            key={active}
            src={images[active]}
            alt={`${alt} ${active + 1}`}
            className="max-w-full max-h-full object-contain rounded-2xl select-none shadow-2xl"
            style={{
              opacity: animating ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
            }}
            draggable={false}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = images[0]; }}
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              aria-label="Next photo"
            >
              <ChevronRight size={22} className="text-white" />
            </button>
          )}
        </div>

        {/* Info panel */}
        {infoPanel && (
          <div
            className="flex-none w-full md:w-80 overflow-y-auto"
            style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
          >
            {infoPanel}
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ──────────────────────────────────── */}
      {images.length > 1 && (
        <div
          className="flex-none py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)' }}
        >
          <div
            ref={thumbsRef}
            className="flex gap-2 overflow-x-auto px-4 pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {images.map((src, i) => (
              <button
                key={i}
                data-idx={i}
                onClick={() => go(i)}
                className="flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  width: 72,
                  height: 52,
                  border: `2px solid ${active === i ? '#ffffff' : 'transparent'}`,
                  opacity: active === i ? 1 : 0.5,
                  transform: active === i ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (active !== i) e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { if (active !== i) e.currentTarget.style.opacity = '0.5'; }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = images[0]; }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ESC hint */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs pointer-events-none hidden md:block"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        Press ESC to close · ← → to navigate
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

// ── Hero wall ─────────────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80';

export const PhotoGallery: React.FC<PhotoGalleryProps & {
  lightboxInfo?: React.ReactNode;
  heroHeight?: string;
  fillHeight?: boolean;
}> = ({
  images,
  alt = 'Photo',
  lightboxInfo,
  heroHeight = '420px',
  fillHeight = false,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  const openLightbox = useCallback((idx: number) => {
    setLightboxStart(idx);
    setLightboxOpen(true);
  }, []);

  const heroPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const heroNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex(i => (i + 1) % images.length);
  }, [images.length]);

  const src = (i: number) => images[i] ?? FALLBACK;
  const count = images.length;

  return (
    <>
      <div
        className={`relative rounded-2xl overflow-hidden shadow-xl ${fillHeight ? 'h-full' : ''}`}
        style={fillHeight ? undefined : { height: heroHeight }}
      >
        {count === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-500">
            <Grid3X3 size={64} className="text-white/30" />
          </div>
        ) : count === 1 ? (
          <div
            className="w-full h-full group cursor-pointer relative overflow-hidden"
            onClick={() => openLightbox(0)}
          >
            <img src={src(0)} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
                <Maximize2 size={15} />
                View Photo
              </div>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full h-full cursor-pointer group"
            onClick={() => openLightbox(heroIndex)}
          >
            <img
              key={heroIndex}
              src={src(heroIndex)}
              alt={alt}
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
              style={{ transition: 'opacity 0.2s ease' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
            />
            {/* Prev / next arrows */}
            <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={heroPrev}
                className="p-2 rounded-full text-white hover:scale-110 transition-transform"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
                aria-label="Previous photo"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={heroNext}
                className="p-2 rounded-full text-white hover:scale-110 transition-transform"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
                aria-label="Next photo"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === heroIndex ? 16 : 6,
                    height: 6,
                    background: i === heroIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Show all photos button */}
        {count > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200"
          >
            <Grid3X3 size={15} />
            Show all {count} photos
          </button>
        )}
      </div>

      {lightboxOpen && (
        <PhotoLightbox
          images={images}
          alt={alt}
          initialIndex={lightboxStart}
          onClose={() => setLightboxOpen(false)}
          infoPanel={lightboxInfo}
        />
      )}
    </>
  );
};

export default PhotoGallery;
