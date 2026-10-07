import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ProfileDrawer } from '../profile/ProfileDrawer';
import { TransactionTypesDrawer } from './TransactionTypesDrawer';
import { Sidebar } from './Sidebar';
import { ROUTES } from '../../constants/routes';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const isDccWorkspace = pathname === ROUTES.DASHBOARD || pathname.startsWith('/dcc/');
  const showHeader = !isDccWorkspace;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar />
      {showHeader && <Header />}
      <main className="flex-1 overflow-auto md:ml-20 pb-16 md:pb-0">
        {children}
      </main>
      <ProfileDrawer />
      <TransactionTypesDrawer />
    </div>
  );
};
