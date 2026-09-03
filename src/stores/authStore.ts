import { create } from 'zustand';
import { UserDTO, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthStore {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserDTO | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => set({ token }),

  login: async (email, password, role) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authService.login({ email, password, role });
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      const token = localStorage.getItem('auth_token');
      set({ user, token, isAuthenticated: !!user, isLoading: false });
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  switchRole: async (newRole) => {
    const { user } = get();
    if (!user) return;

    await authService.switchRole(user.id, newRole);
    set({ user: { ...user, role: newRole as UserRole } });
  },
}));
