const MOCK_OTP = '123456';
const OTP_EXPIRY_HOURS = 24;

export interface OTPGenerationResult {
  otp: string;
  otpHash: string;
  otpExpiresAt: string;
  isMockMode: boolean;
}

const isMockOTPEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_MOCK_OTP === 'true';
};

const generateRandomOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp: string): string => {
  return btoa(otp);
};

export const generateOTP = (): OTPGenerationResult => {
  const isMock = isMockOTPEnabled();
  const otp = isMock ? MOCK_OTP : generateRandomOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + OTP_EXPIRY_HOURS);

  if (isMock) {
    console.log('🔧 Mock OTP Mode Active: Using OTP 123456');
  }

  return {
    otp,
    otpHash,
    otpExpiresAt: expiresAt.toISOString(),
    isMockMode: isMock,
  };
};

export const verifyOTP = (inputOTP: string, storedHash: string, expiresAt: string): boolean => {
  const isMock = isMockOTPEnabled();

  if (isMock && inputOTP === MOCK_OTP) {
    return true;
  }

  if (!isMock) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    if (now > expiry) {
      return false;
    }
  }

  const inputHash = hashOTP(inputOTP);
  return inputHash === storedHash;
};

export const getMockOTP = (): string | null => {
  return isMockOTPEnabled() ? MOCK_OTP : null;
};
