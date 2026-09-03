import { create } from 'zustand';
import { PropertyDTO, SearchFilters } from '../types';
import { searchService } from '../services/searchService';

interface SearchStore {
  filters: SearchFilters;
  results: PropertyDTO[];
  loading: boolean;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  search: () => Promise<void>;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  filters: {},
  results: [],
  loading: false,

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  search: async () => {
    set({ loading: true });
    try {
      const results = await searchService.searchProperties(get().filters);
      set({ results, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
