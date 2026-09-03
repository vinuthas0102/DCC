import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SliderItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface HorizontalSliderProps {
  items: SliderItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  items,
  selectedId,
  onSelect,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 border-blue-300 text-blue-700',
    green: 'bg-green-100 border-green-300 text-green-700',
    coral: 'bg-orange-100 border-orange-300 text-orange-700',
    lavender: 'bg-purple-100 border-purple-300 text-purple-700',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    pink: 'bg-pink-100 border-pink-300 text-pink-700',
    cyan: 'bg-cyan-100 border-cyan-300 text-cyan-700',
    teal: 'bg-teal-100 border-teal-300 text-teal-700',
  };

  return (
    <div className={`relative ${className}`}>
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => {
          const isSelected = item.id === selectedId;
          const colorClass = item.color ? colorClasses[item.color] : '';

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium text-sm
                whitespace-nowrap transition-all duration-300 flex-shrink-0
                ${
                  isSelected
                    ? `${colorClass || 'bg-blue-100 border-blue-300 text-blue-700'} shadow-md scale-105`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                }
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {item.icon && (
                <span className={`transition-transform duration-300 ${isSelected ? 'rotate-12 scale-110' : ''}`}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      )}
    </div>
  );
};
