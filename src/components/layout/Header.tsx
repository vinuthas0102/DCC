import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Bell, LogOut, UserCheck, Calendar, Settings,
  Wrench, Link as LinkIcon, Shield, ChevronLeft, ChevronRight,
  LayoutDashboard, Download, CircleUser as UserCircle, Pencil,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../ui/Button';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { downloadPageAsHtml } from '../../utils/downloadHtml';

interface NavItem {
  route: string;
  label: string;
  icon: React.ReactNode;
}

const ChipField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="text-left leading-none">
    <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{label}</div>
    <div className="text-[12px] font-semibold text-gray-800 whitespace-nowrap mt-0.5">{value || '—'}</div>
  </div>
);

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openProfileDrawer } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isRegularUser = user && !isManager;

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 8);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [isManager, isAdmin]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.scrollLeft + (direction === 'left' ? -240 : 240),
      behavior: 'smooth',
    });
  };

  const regularUserNavItems: NavItem[] = [
    { route: ROUTES.DASHBOARD, label: 'My Dashboard', icon: <LayoutDashboard size={17} /> },
    { route: ROUTES.BOOKINGS, label: 'My Bookings', icon: <Calendar size={17} /> },
  ];

  const managerNavItems: NavItem[] = [
    { route: ROUTES.BOOKINGS, label: 'Bookings', icon: <Calendar size={17} /> },
    { route: ROUTES.PROPERTIES, label: 'Properties', icon: <Building2 size={17} /> },
    { route: ROUTES.CHECK_IN, label: 'Check-In', icon: <UserCheck size={17} /> },
    { route: ROUTES.MANAGER, label: 'Manager', icon: <Settings size={17} /> },
    { route: ROUTES.MAINTENANCE, label: 'Maintenance', icon: <Wrench size={17} /> },
    { route: '/ad-hoc-links', label: 'Links', icon: <LinkIcon size={17} /> },
  ];

  const adminNavItems: NavItem[] = [
    { route: ROUTES.ADMIN, label: 'Admin', icon: <Shield size={17} /> },
  ];

  const navItems = isRegularUser
    ? regularUserNavItems
    : [
        ...managerNavItems,
        ...(isAdmin ? adminNavItems : []),
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
              <Building2 size={19} className="text-white" />
            </div>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">FMS</span>
          </Link>

          {isAuthenticated && user ? (
            <>
              {/* Divider */}
              <div className="w-px h-7 bg-gray-200 flex-shrink-0" />

              {/* Scrollable nav strip */}
              <div className="relative flex items-stretch flex-1 min-w-0 self-stretch">
                {showLeftArrow && (
                  <button
                    onClick={() => scroll('left')}
                    className="nav-arrow-btn"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={15} />
                  </button>
                )}

                <div
                  ref={scrollContainerRef}
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

                {showRightArrow && (
                  <button
                    onClick={() => scroll('right')}
                    className="nav-arrow-btn"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                {/* Bell */}
                <button className="header-icon-btn relative" aria-label="Notifications">
                  <Bell size={19} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                </button>

                {/* Download offline copy */}
                <button
                  className="header-icon-btn"
                  aria-label="Download offline copy"
                  title="Download Offline Copy"
                  onClick={() => downloadPageAsHtml(location.pathname)}
                >
                  <Download size={17} />
                </button>

                {/* User identity chip */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-l-xl bg-white border border-gray-200 shadow-sm">
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
                    {/* Identity fields */}
                    <div className="hidden sm:flex items-center gap-px ml-1 border-l border-gray-200 pl-3">
                      <ChipField label="EMP ID" value={user.govtEmployeeId} />
                      <div className="w-px h-6 bg-gray-200 mx-2" />
                      <ChipField label="Location" value={user.projectLocation} />
                      <div className="w-px h-6 bg-gray-200 mx-2" />
                      <ChipField label="SAP ID" value={user.sapId} />
                    </div>
                  </div>

                  {/* Edit / profile icon button — opens profile drawer */}
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
