import { UserRole } from '../types';

export const ROLES: Record<string, UserRole> = {
  PUBLIC: 'public',
  GOVT_OFFICIAL: 'govt_official',
  MANAGER: 'manager',
  DEPT_USER: 'dept_user',
  ADMIN: 'admin',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  public: 'Public User',
  govt_official: 'Government Official',
  manager: 'Estate Manager',
  dept_user: 'Department User',
  admin: 'Administrator',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  public: 'Access to Community Halls and Category B Guest Houses',
  govt_official: 'Access to Category A & B facilities + Quarters allotment',
  manager: 'Manage bookings and allocations for assigned estates',
  dept_user: 'View-only access with booking privileges',
  admin: 'Full system access and configuration',
};
