import React from 'react';
import { Bell, Mail, MessageSquare, Phone } from 'lucide-react';
import type { ChatDeliveryMode } from '../../types/quarters';

interface Props {
  value: ChatDeliveryMode[];
  onChange: (modes: ChatDeliveryMode[]) => void;
  className?: string;
}

const MODES: { mode: ChatDeliveryMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'IN_APP', label: 'In-App', icon: <Bell size={11} /> },
  { mode: 'EMAIL', label: 'Email', icon: <Mail size={11} /> },
  { mode: 'SMS', label: 'SMS', icon: <MessageSquare size={11} /> },
  { mode: 'WA', label: 'WhatsApp', icon: <Phone size={11} /> },
];

export const ChatDeliveryModePicker: React.FC<Props> = ({ value, onChange, className = '' }) => {
  const toggle = (mode: ChatDeliveryMode) => {
    if (value.includes(mode)) {
      if (value.length === 1) return; // keep at least one selected
      onChange(value.filter(m => m !== mode));
    } else {
      onChange([...value, mode]);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] font-semibold text-gray-400 mr-0.5 shrink-0 uppercase tracking-wide">Send via</span>
      {MODES.map(({ mode, label, icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => toggle(mode)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
            value.includes(mode)
              ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
              : 'bg-white border-gray-200 text-gray-500 hover:border-teal-400 hover:text-teal-600'
          }`}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};
