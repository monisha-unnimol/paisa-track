import { create } from 'zustand';
import { databaseService } from '../database';
import {
  Category,
  CreateRecurringExpenseInput,
  RecurringExpense,
  RecurringExpenseWithDetails,
  UpdateRecurringExpenseInput,
} from '../database/types';
import { useAccountStore } from './useAccountStore';
import {
  enrichRecurringExpense,
  getEarliestNextDue,
  getTotalMonthlyRecurring,
  getUpcomingRecurringCount,
  sortRecurringByDueDate,
} from '../utils/recurringHelpers';

type RecurringExpenseStore = {
  recurringExpenses: RecurringExpenseWithDetails[];
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  filters: {
    searchQuery: string;
    accountId: string | null;
    categoryId: string | null;
  };
  loadRecurringExpenses: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setAccountFilter: (accountId: string | null) => void;
  setCategoryFilter: (categoryId: string | null) => void;
  addRecurringExpense: (input: CreateRecurringExpenseInput) => Promise<RecurringExpense>;
  editRecurringExpense: (
    id: string,
    input: UpdateRecurringExpenseInput,
  ) => Promise<RecurringExpense | null>;
  removeRecurringExpense: (id: string) => Promise<boolean>;
  getTotalMonthlyRecurring: () => number;
  getUpcomingCount: () => number;
  getNextDueDate: () => string | null;
};

async function buildRecurringCategoryMap(
  expenses: RecurringExpense[],
): Promise<Map<string, Category>> {
  const recurringCategories = await databaseService.searchCategories('', null, 'recurring');
  const map = new Map(recurringCategories.map((category) => [category.id, category]));

  const missingIds = [
    ...new Set(
      expenses
        .map((expense) => expense.categoryId)
        .filter((id) => id && !map.has(id)),
    ),
  ];

  if (missingIds.length > 0) {
    const resolved = await Promise.all(
      missingIds.map((id) => databaseService.getCategoryById(id)),
    );
    for (const category of resolved) {
      if (category) {
        map.set(category.id, category);
      }
    }
  }

  return map;
}

function enrichAll(
  expenses: RecurringExpense[],
  categoryMap: Map<string, Category>,
): RecurringExpenseWithDetails[] {
  const accounts = useAccountStore.getState().accounts;

  return expenses.map((expense) => {
    const account = accounts.find((item) => item.id === expense.accountId);
    const category = categoryMap.get(expense.categoryId);
    return enrichRecurringExpense(expense, account, category);
  });
}

function applyFilters(
  items: RecurringExpenseWithDetails[],
  filters: RecurringExpenseStore['filters'],
) {
  return sortRecurringByDueDate(items);
}

export const useRecurringExpenseStore = create<RecurringExpenseStore>((set, get) => ({
  recurringExpenses: [],
  loading: false,
  hasLoaded: false,
  error: null,
  filters: {
    searchQuery: '',
    accountId: null,
    categoryId: null,
  },

  loadRecurringExpenses: async () => {
    const showLoading = !get().hasLoaded;
    if (showLoading) {
      set({ loading: true, error: null });
    }

    try {
      const raw = await databaseService.searchRecurringExpenses(
        get().filters.searchQuery,
        get().filters.accountId,
        get().filters.categoryId,
      );
      const categoryMap = await buildRecurringCategoryMap(raw);
      const enriched = enrichAll(raw, categoryMap);
      set({
        recurringExpenses: applyFilters(enriched, get().filters),
        loading: false,
        hasLoaded: true,
      });
    } catch (error) {
      set({
        loading: false,
        hasLoaded: true,
        error: error instanceof Error ? error.message : 'Failed to load recurring expenses',
      });
    }
  },

  setSearchQuery: (query) => {
    set((state) => ({ filters: { ...state.filters, searchQuery: query } }));
  },

  setAccountFilter: (accountId) => {
    set((state) => ({ filters: { ...state.filters, accountId } }));
  },

  setCategoryFilter: (categoryId) => {
    set((state) => ({ filters: { ...state.filters, categoryId } }));
  },

  addRecurringExpense: async (input) => {
    const expense = await databaseService.createRecurringExpense(input);
    await get().loadRecurringExpenses();
    return expense;
  },

  editRecurringExpense: async (id, input) => {
    const updated = await databaseService.updateRecurringExpense(id, input);
    await get().loadRecurringExpenses();
    return updated;
  },

  removeRecurringExpense: async (id) => {
    const deleted = await databaseService.deleteRecurringExpense(id);
    if (deleted) {
      await get().loadRecurringExpenses();
    }
    return deleted;
  },

  getTotalMonthlyRecurring: () => getTotalMonthlyRecurring(get().recurringExpenses),

  getUpcomingCount: () => getUpcomingRecurringCount(get().recurringExpenses),

  getNextDueDate: () => getEarliestNextDue(get().recurringExpenses),
}));
