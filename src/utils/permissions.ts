import { UserRole, AssetCategory } from '../types';

export const canAccessProperty = (userRole: UserRole, assetCategory: AssetCategory): boolean => {
  switch (userRole) {
    case 'admin':
    case 'manager':
      return true;
    case 'govt_official':
    case 'dept_user':
    case 'public':
      return assetCategory === 'B';
    default:
      return false;
  }
};

export const canManageProperties = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};

export const canApproveBookings = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};

export const canAccessAdminPanel = (userRole: UserRole): boolean => {
  return userRole === 'admin';
};

export const canViewAllBookings = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};

export const canCheckIn = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};

export const canPerformMaintenance = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};
