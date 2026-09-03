import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { ProfileFormContent, ProfileHeaderCard } from './ProfileFormContent';

export const ProfileDrawer: React.FC = () => {
  const { profileDrawerOpen, closeProfileDrawer } = useUIStore();

  useEffect(() => {
    if (!profileDrawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeProfileDrawer(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [profileDrawerOpen, closeProfileDrawer]);

  useEffect(() => {
    document.body.style.overflow = profileDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [profileDrawerOpen]);

  if (!profileDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={closeProfileDrawer}
      />

      {/* Modal panel */}
      <div
        className="relative z-10 flex flex-col bg-gray-50 rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: 'min(860px, 100%)', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[14px] font-bold text-gray-900">My Profile</span>
          </div>
          <button
            onClick={closeProfileDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close profile"
          >
            <X size={17} />
          </button>
        </div>

        {/* User identity card */}
        <ProfileHeaderCard />

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <ProfileFormContent compact />
          </div>
        </div>
      </div>
    </div>
  );
};
