// Hall property type codes — all types that use hall_details JSONB
export const HALL_PROPERTY_TYPE_CODES = [
  'COMMUNITY_HALL',
  'MARRIAGE_HALL',
  'PARTY_HALL',
  'CONVENTION_HALL',
];

export const isHallPropertyType = (propertyTypeCode?: string | null): boolean => {
  if (!propertyTypeCode) return false;
  return HALL_PROPERTY_TYPE_CODES.includes(propertyTypeCode.toUpperCase());
};

// Commercial shop property type codes — uses shop_details JSONB
export const SHOP_PROPERTY_TYPE_CODES = ['COMMERCIAL_SHOP'];

export const isShopPropertyType = (propertyTypeCode?: string | null): boolean => {
  if (!propertyTypeCode) return false;
  return SHOP_PROPERTY_TYPE_CODES.includes(propertyTypeCode.toUpperCase());
};

export const requiresLoginForBooking = (moduleCode?: string): boolean => {
  return moduleCode === 'GOVT_FAC';
};

export const isPublicBooking = (moduleCode?: string): boolean => {
  return moduleCode === 'OTHER_FAC';
};

export const getBookingButtonText = (
  moduleCode?: string,
  isAuthenticated?: boolean
): string => {
  if (requiresLoginForBooking(moduleCode)) {
    return isAuthenticated ? 'Book Now' : 'Login to Book';
  }
  return 'Book Now';
};

export const getModuleBadgeText = (moduleCode?: string): string | null => {
  if (isPublicBooking(moduleCode)) {
    return 'Open to Public';
  }
  if (requiresLoginForBooking(moduleCode)) {
    return 'Login Required';
  }
  return null;
};

export const getModuleBadgeStyles = (moduleCode?: string): string => {
  if (isPublicBooking(moduleCode)) {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (requiresLoginForBooking(moduleCode)) {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export const canUserBookProperty = (
  moduleCode?: string,
  isAuthenticated?: boolean
): boolean => {
  if (requiresLoginForBooking(moduleCode)) {
    return isAuthenticated === true;
  }
  return true;
};
