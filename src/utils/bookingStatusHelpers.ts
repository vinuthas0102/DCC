import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const getStatusBadgeVariant = (status: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'CONFIRMED':
    case 'ALLOCATED':
    case 'CHECKED_IN':
    case 'PROVISIONED':
      return 'success';
    case 'CANCELLED':
    case 'REJECTED':
      return 'error';
    case 'CHECKED_OUT':
      return 'default';
    default:
      return 'warning';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
    case 'ALLOCATED':
    case 'CHECKED_IN':
    case 'PROVISIONED':
      return CheckCircle;
    case 'CANCELLED':
    case 'REJECTED':
      return XCircle;
    default:
      return Clock;
  }
};
