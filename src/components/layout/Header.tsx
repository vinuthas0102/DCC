import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Landmark, Bell, LogOut, ChevronLeft, ChevronRight,
  CircleUser as UserCircle, Pencil,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../ui/Button';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  route: string;
  label: string;
  icon: React.ReactNode;
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openProfileDrawer } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems: NavItem[] = [
    { route: ROUTES.DASHBOARD, label: 'DCC Dashboard', icon: <Landmark size={17} /> },
  ];

  const initials = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <header className="header-bar sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[60px] gap-3">

          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors duration-150">
              <Landmark size={19} className="text-white" />
            </div>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">DCC</span>
          </Link>

          {isAuthenticated && user ? (
            <>
              {/* Divider */}
              <div className="w-px h-7 bg-gray-200 flex-shrink-0" />

              {/* Scrollable nav strip */}
              <div className="relative flex items-stretch flex-1 min-w-0 self-stretch">
                <div
                  className="flex items-stretch overflow-x-auto scrollbar-hide flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {navItems.map((item) => {
                    const isActive =
                      location.pathname === item.route ||
                      (item.route !== '/' && location.pathname.startsWith(item.route + '/'));

                    return (
                      <Link
                        key={item.route}
                        to={item.route}
                        className={`nav-tab ${isActive ? 'nav-tab-active' : 'nav-tab-idle'}`}
                      >
                        <span className="nav-tab-icon">{item.icon}</span>
                        <span className="nav-tab-label">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                {/* Bell */}
                <button className="header-icon-btn relative" aria-label="Notifications">
                  <Bell size={19} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                </button>

                {/* User identity chip — click to open profile */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={openProfileDrawer}
                    title="View / Edit Profile"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-l-xl bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all duration-150"
                  >
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold select-none">
                        {initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                        <UserCircle size={9} className="text-blue-600" />
                      </span>
                    </div>
                    <div className="text-left hidden sm:block leading-snug">
                      <div className="text-[13px] font-semibold text-gray-900 whitespace-nowrap leading-tight">
                        {user.fullName || user.email}
                      </div>
                      <div className="text-[11px] text-blue-500 whitespace-nowrap leading-tight font-medium">
                        {ROLE_LABELS[user.role]}
                      </div>
                    </div>
                  </button>

                  {/* Edit / profile icon button */}
                  <button
                    onClick={openProfileDrawer}
                    title="Edit My Profile"
                    className="h-full px-2.5 py-1.5 rounded-r-xl bg-white border border-l-0 border-gray-200 shadow-sm text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-150 flex items-center"
                    aria-label="Edit profile"
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                {/* Logout */}
                <button onClick={handleLogout} className="header-logout-btn" aria-label="Logout">
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="ml-auto">
              <Button onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
