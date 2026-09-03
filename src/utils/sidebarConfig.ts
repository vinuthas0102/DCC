import { UserRole } from '../types';
import { ROUTES } from '../constants/routes';

export interface ModuleTab {
  title: string;
  iconName: string;
  route: string;
  activePrefix: string;
}

const DCC_TAB: ModuleTab = {
  title: 'DCC',
  iconName: 'Landmark',
  route: ROUTES.DASHBOARD,
  activePrefix: '/dashboard',
};

export function getModuleTabs(_role: UserRole): ModuleTab[] {
  return [DCC_TAB];
}
