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
  public: 'View demand summaries and payment history',
  govt_official: 'View demands, raise disputes, and track collections',
  manager: 'Record payments, generate demands, and manage rules',
  dept_user: 'View demand summaries and track outstanding dues',
  admin: 'Full system access including rule setup and reconciliation',
};
