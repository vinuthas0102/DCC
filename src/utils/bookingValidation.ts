export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateBookingForm = (data: {
  checkIn: string;
  checkOut: string;
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adultCount: number;
}): { valid: boolean; error?: string } => {
  if (!data.checkIn || !data.checkOut || !data.roomTypeId || !data.guestName || !data.guestEmail || !data.guestPhone) {
    return { valid: false, error: 'Please fill all required fields' };
  }

  if (data.adultCount < 1) {
    return { valid: false, error: 'At least one adult is required' };
  }

  if (!validateEmail(data.guestEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
};
