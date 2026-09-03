import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { ROLE_LABELS } from '../constants/roles';
import { ProfileFormContent, ProfileHeaderCard } from '../components/profile/ProfileFormContent';

export function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky page header */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-[14px] font-bold text-gray-900">My Profile</span>
            </div>
            <div className="text-[12px] text-gray-400 hidden sm:block">
              {ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Identity card at top */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <ProfileHeaderCard />
        </div>

        <ProfileFormContent />
      </div>
    </div>
  );
}
