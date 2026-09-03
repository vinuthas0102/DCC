import React from 'react';
import {
  Baby, PawPrint, Accessibility, MapPin, Waves, Building, Building2,
  Trees, Mountain, Droplets, CircleDot, Eye,
} from 'lucide-react';
import type { RoomFeatures } from '../types';

export const VIEW_OPTIONS = [
  { value: '',          label: 'No Specific View', icon: Eye },
  { value: 'garden',    label: 'Garden View',       icon: Trees },
  { value: 'mountain',  label: 'Mountain View',     icon: Mountain },
  { value: 'sea',       label: 'Sea View',          icon: Waves },
  { value: 'city',      label: 'City View',         icon: Building2 },
  { value: 'pool',      label: 'Pool View',         icon: Droplets },
  { value: 'courtyard', label: 'Courtyard View',    icon: CircleDot },
];

export const BED_TYPE_OPTIONS = [
  { value: '',       label: 'Not specified' },
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'twin',   label: 'Twin' },
  { value: 'queen',  label: 'Queen' },
  { value: 'king',   label: 'King' },
];

export const POLICY_TOGGLES: Array<{
  key: keyof RoomFeatures;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  activeColor: string;
}> = [
  { key: 'isKidsFriendly',         label: 'Kids Friendly',         icon: Baby,          activeColor: 'bg-sky-500' },
  { key: 'isPetFriendly',          label: 'Pets Friendly',         icon: PawPrint,      activeColor: 'bg-amber-500' },
  { key: 'isWheelchairAccessible', label: 'Wheelchair Accessible', icon: Accessibility, activeColor: 'bg-green-500' },
];

export const FEATURE_TOGGLES: Array<{
  key: keyof RoomFeatures;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  activeColor: string;
}> = [
  { key: 'hasBalcony',    label: 'Balcony',     icon: MapPin,    activeColor: 'bg-blue-500' },
  { key: 'hasAC',         label: 'AC',          icon: Waves,     activeColor: 'bg-cyan-500' },
  { key: 'hasKitchen',    label: 'Kitchen',     icon: Building,  activeColor: 'bg-orange-500' },
  { key: 'hasLivingRoom', label: 'Living Room', icon: Building2, activeColor: 'bg-teal-500' },
  { key: 'hasFridge',     label: 'Fridge',      icon: Building,  activeColor: 'bg-teal-500' },
];
