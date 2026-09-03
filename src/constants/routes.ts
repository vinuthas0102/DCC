export const ROUTES = {
  HOME: '/',
  LANDING: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  DCC: '/dashboard',
  DCC_RULE_SETUP: '/dcc/rule-setup',
  DCC_GENERATE: '/dcc/generate',
  DCC_DEMAND_DETAIL: '/dcc/demand/:demandId',
  DCC_CLIENT_DUE_SUMMARY: '/dcc/client/:ownerId',
} as const;
