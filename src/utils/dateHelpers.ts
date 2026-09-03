export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const isDateInPast = (date: string): boolean => {
  return new Date(date) < new Date();
};

export const addDays = (date: string | Date, days: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getMinCheckInDate = (): string => {
  return getTodayDate();
};

export const isValidDateRange = (checkIn: string, checkOut: string): boolean => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  return checkInDate < checkOutDate && !isDateInPast(checkIn);
};
