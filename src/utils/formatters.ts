export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatBookingNumber = (bookingNumber: string): string => {
  return bookingNumber.replace(/^BK/, 'BK-');
};

export const formatPriceRange = (minPrice: number | null | undefined, maxPrice: number | null | undefined): string => {
  if (minPrice === null || minPrice === undefined || maxPrice === null || maxPrice === undefined) {
    return 'Price on request';
  }

  const formattedMin = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minPrice);

  const formattedMax = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(maxPrice);

  if (minPrice === maxPrice) {
    return `${formattedMin}/night`;
  }

  return `${formattedMin} - ${formattedMax}/night`;
};
