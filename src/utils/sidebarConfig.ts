import { UserRole } from '../types';
import { ROUTES } from '../constants/routes';

export interface ModuleTab {
  title: string;
  iconName: string;
  route: string;
  /** Prefix used for active-state detection */
  activePrefix: string;
}

const RENT_TAB: ModuleTab = {
  title: 'Demand and Collection Center',
  iconName: 'IndianRupee',
  route: ROUTES.DCC,
  activePrefix: '/dcc',
};

const RENT_TRACKER_TAB: ModuleTab = {
  title: 'Rent Tracker',
  iconName: 'Wallet',
  route: ROUTES.QUARTERS_RENT,
  activePrefix: '/quarters/rent',
};

export function getModuleTabs(role: UserRole): ModuleTab[] {
  switch (role) {
    case 'admin':
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.PROPERTIES,
          activePrefix: '/properties',
        },
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_MANAGER,
          activePrefix: '/quarters',
        },
        RENT_TAB,
        RENT_TRACKER_TAB,
      ];

    case 'manager':
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.BOOKINGS,
          activePrefix: '/bookings',
        },
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_REQUESTS,
          activePrefix: '/quarters',
        },
        RENT_TAB,
        RENT_TRACKER_TAB,
      ];

    case 'govt_official':
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.BOOKINGS,
          activePrefix: '/bookings',
        },
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_REQUESTS,
          activePrefix: '/quarters',
        },
        RENT_TAB,
        RENT_TRACKER_TAB,
      ];

    case 'dept_user':
    case 'public':
    default:
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.DASHBOARD,
          activePrefix: '/dashboard',
        },
      ];
  }
}
