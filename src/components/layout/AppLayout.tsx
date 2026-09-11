import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ProfileDrawer } from '../profile/ProfileDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const hideHeaderRoutes = ['/dashboard', '/dcc/rule-setup', '/dcc/generate'];
  const showHeader = !hideHeaderRoutes.includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ProfileDrawer />
    </div>
  );
};
