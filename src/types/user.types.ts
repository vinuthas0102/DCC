import { UserRole } from './common.types';

export interface ServiceHistoryEntry {
  dateJoining: string;
  dateTransfer: string;
  designation: string;
  region: string;
  payScale: string;
}

export interface FamilyEmployeeDetails {
  relation: string;
  name: string;
  designation: string;
  location: string;
  empId: string;
  phone: string;
  email: string;
}

export interface MedicalGrounds {
  required: boolean;
  reason: string;
  member: string;
  remarks: string;
}

export interface ProfileMetadata {
  fatherName?: string;
  socialCategory?: string;
  physicalStatus?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  dateOfRetirement?: string;
  hrmsId?: string;
  pfNumber?: string;
  currentAddress?: string;
  permanentAddress?: string;
  alternatePhone?: string;
  alternateEmail?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  familyCount?: number;
  numDependents?: number;
  dependents?: Array<{ relation: string; age: number }>;
  familyEmployeeActive?: boolean;
  familyEmployeeDetails?: FamilyEmployeeDetails;
  medicalGrounds?: MedicalGrounds;
  medicalDocPath?: string;
  serviceHistory?: ServiceHistoryEntry[];
  [key: string]: unknown;
}

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  govtDepartment?: string;
  govtEmployeeId?: string;
  projectLocation?: string;
  sapId?: string;
  bhkEntitlement?: string;
  designationId?: string;
  assignedEstateId?: string;
  metadata?: ProfileMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  govtDepartment?: string;
  govtEmployeeId?: string;
}

export interface UpdateUserDTO {
  fullName?: string;
  phone?: string;
  govtDepartment?: string;
  govtEmployeeId?: string;
  metadata?: ProfileMetadata;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
