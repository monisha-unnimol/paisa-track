import { create } from 'zustand';
import { databaseService } from '../database';
import {
  CreateInvestmentInput,
  Investment,
  InvestmentWithDetails,
  UpdateInvestmentInput,
} from '../database/types';
import { useAccountStore } from './useAccountStore';
import {
  enrichInvestment,
  getEarliestNextDeduction,
  getTotalMonthlyInvestments,
  getUpcomingInvestmentCount,
  sortInvestmentsByAmount,
  sortInvestmentsByNextDate,
} from '../utils/investmentHelpers';

export type InvestmentSort = 'amount' | 'next_date';

type InvestmentStore = {
  investments: InvestmentWithDetails[];
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  filters: {
    searchQuery: string;
    accountId: string | null;
    sortBy: InvestmentSort;
  };
  loadInvestments: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setAccountFilter: (accountId: string | null) => void;
  setSortBy: (sortBy: InvestmentSort) => void;
  addInvestment: (input: CreateInvestmentInput) => Promise<Investment>;
  editInvestment: (id: string, input: UpdateInvestmentInput) => Promise<Investment | null>;
  removeInvestment: (id: string) => Promise<boolean>;
  getTotalMonthlyInvestments: () => number;
  getUpcomingCount: () => number;
  getNextDeductionDate: () => string | null;
};

function enrichAll(investments: Investment[]): InvestmentWithDetails[] {
  const accounts = useAccountStore.getState().accounts;
  return investments.map((investment) => {
    const account = accounts.find((item) => item.id === investment.accountId);
    return enrichInvestment(investment, account);
  });
}

function applyFilters(items: InvestmentWithDetails[], filters: InvestmentStore['filters']) {
  let result = items;

  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.trim().toLowerCase();
    result = result.filter((item) => item.name.toLowerCase().includes(query));
  }

  if (filters.accountId) {
    result = result.filter((item) => item.accountId === filters.accountId);
  }

  if (filters.sortBy === 'amount') {
    result = sortInvestmentsByAmount(result, 'desc');
  } else {
    result = sortInvestmentsByNextDate(result);
  }

  return result;
}

export const useInvestmentStore = create<InvestmentStore>((set, get) => ({
  investments: [],
  loading: false,
  hasLoaded: false,
  error: null,
  filters: {
    searchQuery: '',
    accountId: null,
    sortBy: 'next_date',
  },

  loadInvestments: async () => {
    const showLoading = !get().hasLoaded;
    if (showLoading) {
      set({ loading: true, error: null });
    }

    try {
      const raw = await databaseService.searchInvestments(
        get().filters.searchQuery,
        get().filters.accountId,
      );
      const enriched = enrichAll(raw);
      set({
        investments: applyFilters(enriched, get().filters),
        loading: false,
        hasLoaded: true,
      });
    } catch (error) {
      set({
        loading: false,
        hasLoaded: true,
        error: error instanceof Error ? error.message : 'Failed to load investments',
      });
    }
  },

  setSearchQuery: (query) => {
    set((state) => ({ filters: { ...state.filters, searchQuery: query } }));
  },

  setAccountFilter: (accountId) => {
    set((state) => ({ filters: { ...state.filters, accountId } }));
  },

  setSortBy: (sortBy) => {
    set((state) => ({ filters: { ...state.filters, sortBy } }));
  },

  addInvestment: async (input) => {
    const investment = await databaseService.createInvestment(input);
    await get().loadInvestments();
    return investment;
  },

  editInvestment: async (id, input) => {
    const updated = await databaseService.updateInvestment(id, input);
    await get().loadInvestments();
    return updated;
  },

  removeInvestment: async (id) => {
    const deleted = await databaseService.deleteInvestment(id);
    if (deleted) {
      await get().loadInvestments();
    }
    return deleted;
  },

  getTotalMonthlyInvestments: () => getTotalMonthlyInvestments(get().investments),

  getUpcomingCount: () => getUpcomingInvestmentCount(get().investments),

  getNextDeductionDate: () => getEarliestNextDeduction(get().investments),
}));
