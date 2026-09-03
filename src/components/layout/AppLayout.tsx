import React from 'react';
import { Header } from './Header';
import { ProfileDrawer } from '../profile/ProfileDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ProfileDrawer />
    </div>
  );
};
