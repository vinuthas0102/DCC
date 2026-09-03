import React from 'react';
import { Sidebar } from './Sidebar';
import { ProfileDrawer } from '../profile/ProfileDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      {/* Main content — always offset by 64px rail on desktop, full width on mobile */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-20 pb-16 md:pb-0">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Profile drawer — rendered above all layout content */}
      <ProfileDrawer />
    </div>
  );
};
