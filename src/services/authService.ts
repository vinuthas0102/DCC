import { supabase, validateSession, refreshSession } from '../lib/supabase';
import { UserDTO, LoginCredentials, CreateUserDTO, ProfileMetadata } from '../types';
import { DEMO_MODE } from '../mocks/demoData';

const DEMO_METADATA: ProfileMetadata = {
  fatherName: 'Suresh Kumar',
  socialCategory: 'General',
  physicalStatus: 'Not Applicable',
  dateOfBirth: '1975-03-14',
  dateOfJoining: '1998-07-01',
  dateOfRetirement: '2035-03-31',
  hrmsId: 'HRMS-29847',
  pfNumber: 'PF/BH/12345/678',
  currentAddress: 'Quarter No. C-12, Type-II, NMDC Colony, Bacheli, Chhattisgarh - 494553',
  permanentAddress: '42, Rajaji Nagar, Bengaluru, Karnataka - 560010',
  alternatePhone: '9845678901',
  alternateEmail: 'rajan.kumar.personal@gmail.com',
  aadhaarNumber: '9876 5432 1012',
  panNumber: 'ABCPR1234F',
  familyCount: 4,
  numDependents: 2,
  dependents: [
    { relation: 'Spouse', age: 42 },
    { relation: 'Son', age: 18 },
  ],
  familyEmployeeActive: false,
  familyEmployeeDetails: { relation: '', name: '', designation: '', location: '', empId: '', phone: '', email: '' },
  medicalGrounds: { required: false, reason: '', member: '', remarks: '' },
  serviceHistory: [
    { dateJoining: '1998-07-01', dateTransfer: '2004-06-30', designation: 'Junior Engineer', region: 'Kirandul', payScale: '₹15,600–39,100 / GP ₹5,400' },
    { dateJoining: '2004-07-01', dateTransfer: '2010-03-31', designation: 'Senior Engineer', region: 'Bacheli', payScale: '₹15,600–39,100 / GP ₹6,600' },
    { dateJoining: '2010-04-01', dateTransfer: '2016-12-31', designation: 'Deputy Manager', region: 'Bacheli', payScale: '₹29,100–54,500 / GP ₹7,600' },
    { dateJoining: '2017-01-01', dateTransfer: '', designation: 'Manager (Engg.)', region: 'Bacheli', payScale: '₹36,600–62,000 / GP ₹8,700' },
  ],
};

const DEMO_GOVT_OFFICIAL: UserDTO = {
  id: '5f865f74-aeab-4885-a898-80ba3da33ae0',
  email: 'demo@fms.gov',
  fullName: 'Rajan Kumar',
  phone: '9876543210',
  role: 'govt_official',
  govtDepartment: 'NMDC Limited',
  govtEmployeeId: 'EMP-384621',
  projectLocation: 'Bacheli',
  sapId: 'SAP-284719',
  bhkEntitlement: 'Type-II',
  assignedEstateId: 'estate-1',
  metadata: DEMO_METADATA,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_EO_USER: UserDTO = {
  id: 'e0000001-e000-0000-0000-000000000001',
  email: 'eo@fms.gov',
  fullName: 'Shankar',
  phone: '9876541230',
  role: 'manager',
  govtDepartment: 'NMDC Limited',
  govtEmployeeId: 'EMP-572034',
  projectLocation: 'Bacheli',
  sapId: 'SAP-193047',
  assignedEstateId: 'estate-1',
  metadata: {
    fatherName: 'Ramdas Iyer',
    socialCategory: 'General',
    physicalStatus: 'Not Applicable',
    dateOfBirth: '1970-08-22',
    dateOfJoining: '1994-03-01',
    dateOfRetirement: '2030-08-31',
    hrmsId: 'HRMS-10294',
    pfNumber: 'PF/BH/09876/543',
    currentAddress: 'Officers Colony, Block A-3, Bacheli, Chhattisgarh - 494553',
    permanentAddress: '15, Anand Nagar, Chennai, Tamil Nadu - 600040',
    alternatePhone: '',
    alternateEmail: '',
    aadhaarNumber: '',
    panNumber: '',
    familyCount: 3,
    numDependents: 1,
    dependents: [{ relation: 'Daughter', age: 22 }],
    familyEmployeeActive: false,
    familyEmployeeDetails: { relation: '', name: '', designation: '', location: '', empId: '', phone: '', email: '' },
    medicalGrounds: { required: false, reason: '', member: '', remarks: '' },
    serviceHistory: [
      { dateJoining: '1994-03-01', dateTransfer: '2001-06-30', designation: 'Assistant Manager', region: 'Donimalai', payScale: '₹10,000–15,200' },
      { dateJoining: '2001-07-01', dateTransfer: '2009-12-31', designation: 'Deputy Manager', region: 'Bacheli', payScale: '₹15,600–39,100 / GP ₹6,600' },
      { dateJoining: '2010-01-01', dateTransfer: '', designation: 'Estate Officer', region: 'Bacheli', payScale: '₹29,100–54,500 / GP ₹7,600' },
    ],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function getDemoUser(role?: string): UserDTO {
  if (role === 'manager' || role === 'admin') return { ...DEMO_EO_USER, role: role as UserDTO['role'] };
  if (role === 'govt_official') return DEMO_GOVT_OFFICIAL;
  if (role === 'public' || role === 'dept_user') return { ...DEMO_GOVT_OFFICIAL, role: role as UserDTO['role'] };
  return DEMO_GOVT_OFFICIAL;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: UserDTO; token: string }> => {
    if (DEMO_MODE) return Promise.resolve({ user: getDemoUser(credentials.role), token: 'demo-token' });
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) throw authError;
    if (!authData.user || !authData.session) throw new Error('Login failed');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError) throw userError;
    if (!userData) throw new Error('User data not found');

    if (credentials.role && userData) {
      await supabase
        .from('users')
        .update({ role: credentials.role })
        .eq('id', userData.id);
      userData.role = credentials.role;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const refreshedSession = await refreshSession();
    if (!refreshedSession) {
      throw new Error('Failed to establish session with role claims');
    }

    const validation = await validateSession();
    if (!validation.valid) {
      console.warn('Session validation failed after refresh. This may cause RLS policy errors.');
    }

    const token = refreshedSession.access_token;

    return {
      user: mapUserFromDb(userData),
      token,
    };
  },

  register: async (userData: CreateUserDTO): Promise<{ user: UserDTO; token: string }> => {
    if (DEMO_MODE) return Promise.resolve({ user: getDemoUser(), token: 'demo-token' });
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role,
          govt_department: userData.govtDepartment || '',
          govt_employee_id: userData.govtEmployeeId || '',
        },
      ])
      .select()
      .single();

    if (userError) throw userError;

    await new Promise(resolve => setTimeout(resolve, 500));

    const refreshedSession = await refreshSession();
    if (!refreshedSession) {
      console.warn('Failed to refresh session after registration');
    }

    const token = refreshedSession?.access_token || authData.session?.access_token || '';
    localStorage.setItem('auth_token', token);

    return {
      user: mapUserFromDb(newUser),
      token,
    };
  },

  logout: async (): Promise<void> => {
    if (DEMO_MODE) return Promise.resolve();
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<UserDTO | null> => {
    if (DEMO_MODE) return Promise.resolve(getDemoUser());
    try {
      const validation = await validateSession();

      if (!validation.valid && validation.needsRefresh) {
        console.log('Session needs refresh, attempting to refresh...');
        try {
          await refreshSession();
        } catch (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          await supabase.auth.signOut();
          return null;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        console.log('No authenticated user found');
        return null;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (error || !userData) {
        console.error('Failed to fetch user data:', error);
        return null;
      }

      return mapUserFromDb(userData);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  updateProfile: async (userId: string, updates: Partial<UserDTO>): Promise<UserDTO> => {
    if (DEMO_MODE) {
      const base = getDemoUser();
      const mergedMetadata = updates.metadata
        ? { ...(base.metadata ?? {}), ...updates.metadata }
        : base.metadata;
      return Promise.resolve({ ...base, ...updates, metadata: mergedMetadata, updatedAt: new Date().toISOString() });
    }

    const { data: currentRow } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle();

    const mergedMetadata = updates.metadata
      ? { ...(currentRow?.metadata ?? {}), ...updates.metadata }
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.fullName !== undefined) patch.full_name = updates.fullName;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.govtDepartment !== undefined) patch.govt_department = updates.govtDepartment;
    if (updates.govtEmployeeId !== undefined) patch.govt_employee_id = updates.govtEmployeeId;
    if (mergedMetadata !== undefined) patch.metadata = mergedMetadata;

    const { data, error } = await supabase
      .from('users')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return mapUserFromDb(data);
  },

  uploadProfileMedicalDoc: async (userId: string, file: File): Promise<string> => {
    if (DEMO_MODE) return Promise.resolve('demo-medical-doc-path');
    const ext = file.name.split('.').pop() ?? 'bin';
    const safeName = file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
    const path = `user-docs/${userId}/medical/${Date.now()}-${safeName}.${ext}`;
    const { error } = await supabase.storage.from('user-docs').upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  },

  getProfileMedicalDoc: async (userId: string): Promise<{ name: string; url: string } | null> => {
    if (DEMO_MODE) return Promise.resolve(null);
    const { data, error } = await supabase.storage
      .from('user-docs')
      .list(`user-docs/${userId}/medical`, { limit: 10 });
    if (error || !data || data.length === 0) return null;
    const latest = data[data.length - 1];
    return {
      name: latest.name.replace(/^\d+-/, '').replace(/_/g, ' '),
      url: supabase.storage.from('user-docs').getPublicUrl(`user-docs/${userId}/medical/${latest.name}`).data.publicUrl,
    };
  },

  switchRole: async (userId: string, newRole: string): Promise<void> => {
    if (DEMO_MODE) return Promise.resolve();
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    await new Promise(resolve => setTimeout(resolve, 500));

    const refreshedSession = await refreshSession();
    if (!refreshedSession) {
      throw new Error('Failed to refresh session after role change');
    }
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUserFromDb(dbUser: any): UserDTO {
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name || '',
    phone: dbUser.phone || '',
    role: dbUser.role || 'public',
    govtDepartment: dbUser.govt_department,
    govtEmployeeId: dbUser.govt_employee_id,
    projectLocation: dbUser.project_location ?? undefined,
    sapId: dbUser.sap_id ?? undefined,
    bhkEntitlement: dbUser.bhk_entitlement ?? undefined,
    designationId: dbUser.designation_id ?? undefined,
    assignedEstateId: dbUser.assigned_estate_id,
    metadata: dbUser.metadata || {},
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}
