import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SplitLayoutProps {
  left: React.ReactNode;
  /** Static right content — uses the standalone control bar above it. */
  right?: React.ReactNode | null;
  /** Render-prop alternative to `right`. Receives the pre-built controls node
   *  so the caller can embed < > X into its own header row, eliminating the
   *  standalone control bar and reclaiming that row's height. */
  renderRight?: (controls: React.ReactNode) => React.ReactNode;
  storageKey: string;
  defaultSplit?: number;
  minLeft?: number;
  maxLeft?: number;
  onClose: () => void;
  rightHeader?: React.ReactNode;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({
  left,
  right,
  renderRight,
  storageKey,
  defaultSplit = 65,
  minLeft = 40,
  maxLeft = 80,
  onClose,
  rightHeader,
}) => {
  const [splitPct, setSplitPct] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? Number(stored) : defaultSplit;
    } catch {
      return defaultSplit;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const persist = useCallback((val: number) => {
    try { localStorage.setItem(storageKey, String(Math.round(val))); } catch {}
  }, [storageKey]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.max(minLeft, Math.min(maxLeft, pct)));
    };
    const onUp = (e: MouseEvent) => {
      setIsDragging(false);
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(minLeft, Math.min(maxLeft, pct));
      setSplitPct(clamped);
      persist(clamped);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, minLeft, maxLeft, persist]);

  const nudge = (delta: number) => {
    setSplitPct(prev => {
      const next = Math.max(minLeft, Math.min(maxLeft, prev + delta));
      persist(next);
      return next;
    });
  };

  const controlsNode = (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        onClick={() => nudge(-5)}
        className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded transition-colors"
        title="Expand right panel"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        onClick={() => nudge(5)}
        className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded transition-colors"
        title="Expand left panel"
      >
        <ChevronRight size={14} />
      </button>
      <div className="w-px h-4 bg-white/30 mx-0.5" />
      <button
        onClick={onClose}
        className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded transition-colors"
        title="Close panel"
      >
        <X size={14} />
      </button>
    </div>
  );

  const hasRight = renderRight ? true : !!right;
  const rightWidth = 100 - splitPct - 0.3;

  return (
    <div
      ref={containerRef}
      className="flex gap-0 h-full"
      style={{ userSelect: isDragging ? 'none' : undefined }}
    >
      {/* Left panel */}
      <div
        style={{ width: hasRight ? `${splitPct}%` : '100%' }}
        className="flex-none h-full overflow-y-auto transition-[width] duration-200"
      >
        {left}
      </div>

      {/* Drag handle */}
      {hasRight && (
        <div
          onMouseDown={handleDragStart}
          className={`flex-none w-1 cursor-col-resize flex items-center justify-center group relative transition-colors ${isDragging ? 'bg-blue-400' : 'bg-gray-200 hover:bg-blue-400'}`}
        >
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          <div className="flex flex-col items-center gap-1 pointer-events-none">
            <div className={`w-0.5 h-6 rounded-full transition-colors ${isDragging ? 'bg-blue-500' : 'bg-gray-400 group-hover:bg-blue-500'}`} />
          </div>
        </div>
      )}

      {/* Right panel — render-prop mode (no standalone control bar) */}
      {hasRight && renderRight && (
        <div
          style={{ width: `${rightWidth}%` }}
          className="flex-none flex flex-col overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex-1 overflow-y-auto">
            {renderRight(controlsNode)}
          </div>
        </div>
      )}

      {/* Right panel — static mode (standalone control bar) */}
      {hasRight && !renderRight && right && (
        <div
          style={{ width: `${rightWidth}%` }}
          className="flex-none flex flex-col overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex-none flex items-center justify-between gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
            {rightHeader ? (
              <div className="flex-1 min-w-0">{rightHeader}</div>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => nudge(-5)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Expand right panel"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => nudge(5)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Expand left panel"
              >
                <ChevronRight size={14} />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Close panel"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {right}
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitLayout;
