import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIStore {
  toasts: Toast[];
  modals: Record<string, boolean>;
  viewMode: 'cards' | 'table' | 'list';
  sidebarOpen: boolean;
  profileDrawerOpen: boolean;
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  setViewMode: (mode: 'cards' | 'table' | 'list') => void;
  toggleSidebar: () => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  modals: {},
  viewMode: 'cards',
  sidebarOpen: true,
  profileDrawerOpen: false,

  addToast: (message, type, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  openModal: (id) => {
    set((state) => ({ modals: { ...state.modals, [id]: true } }));
  },

  closeModal: (id) => {
    set((state) => ({ modals: { ...state.modals, [id]: false } }));
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  openProfileDrawer: () => set({ profileDrawerOpen: true }),
  closeProfileDrawer: () => set({ profileDrawerOpen: false }),
}));
