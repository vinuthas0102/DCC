import React from 'react';
import {
  Wifi, Wind, Tv, Car, Waves, Dumbbell, Bell, ChefHat, Utensils,
  Volume2, Monitor, Drama, LayoutPanelTop, Thermometer, Bath, Archive,
  BookOpen, Lock, Flame, Trees, Mountain, Building2, Droplets,
  CircleDot, Baby, PawPrint, Accessibility, Cigarette, Sun, Moon,
  MonitorPlay, Bluetooth, Coffee, Wine, WashingMachine, ArrowUpDown,
  Users, Briefcase, TreePine, Building, Star, Sofa, GlassWater,
  ThermometerSun, BedDouble, Eye, Heart,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  'wifi':               Wifi,
  'air-vent':           Wind,
  'tv':                 Tv,
  'car':                Car,
  'waves':              Waves,
  'dumbbell':           Dumbbell,
  'bell':               Bell,
  'chef-hat':           ChefHat,
  'utensils':           Utensils,
  'volume-2':           Volume2,
  'monitor':            Monitor,
  'drama':              Drama,
  'layout-panel-top':   LayoutPanelTop,
  'thermometer':        Thermometer,
  'bath':               Bath,
  'archive':            Archive,
  'book-open':          BookOpen,
  'lock':               Lock,
  'flame':              Flame,
  'trees':              Trees,
  'mountain':           Mountain,
  'building-2':         Building2,
  'droplets':           Droplets,
  'circle-dot':         CircleDot,
  'baby':               Baby,
  'paw-print':          PawPrint,
  'accessibility':      Accessibility,
  'cigarette':          Cigarette,
  'sun':                Sun,
  'moon':               Moon,
  'monitor-play':       MonitorPlay,
  'bluetooth':          Bluetooth,
  'coffee':             Coffee,
  'wine':               Wine,
  'washing-machine':    WashingMachine,
  'arrow-up-down':      ArrowUpDown,
  'users':              Users,
  'briefcase':          Briefcase,
  'tree-pine':          TreePine,
  'building':           Building,
  'sofa':               Sofa,
  'glass-water':        GlassWater,
  'thermometer-sun':    ThermometerSun,
  'projector':          Monitor,
  'presentation':       Monitor,
  'refrigerator':       Thermometer,
  'bed-double':         BedDouble,
  'eye':                Eye,
  'heart':              Heart,
};

export function getAmenityIcon(iconName: string): React.FC<{ size?: number; className?: string }> {
  return ICON_MAP[iconName] ?? Star;
}

export function renderAmenityIcon(iconName: string, size = 14, className = '') {
  const Icon = getAmenityIcon(iconName);
  return <Icon size={size} className={className} />;
}

// Category color themes
export const CATEGORY_THEME: Record<string, { bg: string; text: string; border: string; selectedBg: string; selectedBorder: string; selectedText: string }> = {
  'Basic':          { bg: 'bg-gray-50',      text: 'text-gray-600',    border: 'border-gray-200',    selectedBg: 'bg-blue-50',     selectedBorder: 'border-blue-400',   selectedText: 'text-blue-700'   },
  'Comfort':        { bg: 'bg-sky-50',        text: 'text-sky-600',     border: 'border-sky-100',     selectedBg: 'bg-sky-100',     selectedBorder: 'border-sky-400',    selectedText: 'text-sky-700'    },
  'Room Features':  { bg: 'bg-amber-50',      text: 'text-amber-700',   border: 'border-amber-100',   selectedBg: 'bg-amber-100',   selectedBorder: 'border-amber-400',  selectedText: 'text-amber-800'  },
  'Views':          { bg: 'bg-emerald-50',    text: 'text-emerald-700', border: 'border-emerald-100', selectedBg: 'bg-emerald-100', selectedBorder: 'border-emerald-400',selectedText: 'text-emerald-800'},
  'Policies':       { bg: 'bg-violet-50',     text: 'text-violet-700',  border: 'border-violet-100',  selectedBg: 'bg-violet-100',  selectedBorder: 'border-violet-400', selectedText: 'text-violet-800' },
  'Entertainment':  { bg: 'bg-purple-50',     text: 'text-purple-700',  border: 'border-purple-100',  selectedBg: 'bg-purple-100',  selectedBorder: 'border-purple-400', selectedText: 'text-purple-800' },
  'Dining':         { bg: 'bg-orange-50',     text: 'text-orange-700',  border: 'border-orange-100',  selectedBg: 'bg-orange-100',  selectedBorder: 'border-orange-400', selectedText: 'text-orange-800' },
  'Facilities':     { bg: 'bg-teal-50',       text: 'text-teal-700',    border: 'border-teal-100',    selectedBg: 'bg-teal-100',    selectedBorder: 'border-teal-400',   selectedText: 'text-teal-800'   },
  'Business':       { bg: 'bg-indigo-50',     text: 'text-indigo-700',  border: 'border-indigo-100',  selectedBg: 'bg-indigo-100',  selectedBorder: 'border-indigo-400', selectedText: 'text-indigo-800' },
  'Outdoor':        { bg: 'bg-green-50',      text: 'text-green-700',   border: 'border-green-100',   selectedBg: 'bg-green-100',   selectedBorder: 'border-green-400',  selectedText: 'text-green-800'  },
  'Premium':        { bg: 'bg-yellow-50',     text: 'text-yellow-700',  border: 'border-yellow-100',  selectedBg: 'bg-yellow-100',  selectedBorder: 'border-yellow-400', selectedText: 'text-yellow-800' },
  'Auditorium':     { bg: 'bg-rose-50',       text: 'text-rose-700',    border: 'border-rose-100',    selectedBg: 'bg-rose-100',    selectedBorder: 'border-rose-400',   selectedText: 'text-rose-800'   },
  'Hall':           { bg: 'bg-fuchsia-50',    text: 'text-fuchsia-700', border: 'border-fuchsia-100', selectedBg: 'bg-fuchsia-100', selectedBorder: 'border-fuchsia-400',selectedText: 'text-fuchsia-800'},
};

export function getCategoryTheme(category: string) {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME['Basic'];
}

// View type config
export const VIEW_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  garden:     { label: 'Garden View',    icon: 'trees',      color: 'text-green-600'   },
  mountain:   { label: 'Mountain View',  icon: 'mountain',   color: 'text-gray-700'    },
  sea:        { label: 'Sea View',       icon: 'waves',      color: 'text-blue-600'    },
  city:       { label: 'City View',      icon: 'building-2', color: 'text-slate-600'   },
  pool:       { label: 'Pool View',      icon: 'droplets',   color: 'text-cyan-600'    },
  courtyard:  { label: 'Courtyard View', icon: 'circle-dot', color: 'text-amber-600'   },
};
