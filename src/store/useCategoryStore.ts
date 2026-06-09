import { create } from 'zustand';
import {
  CategoryDeleteBlockedError,
  CategoryDuplicateNameError,
  CategoryNotFoundError,
  CategorySaveError,
  databaseService,
} from '../database';
import {
  CategoryWithStats,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../database/types';

type CategoryFilters = {
  searchQuery: string;
  accountId: string | null;
};

type CategoryStore = {
  categories: CategoryWithStats[];
  loading: boolean;
  error: string | null;
  lastCreatedCategoryId: string | null;
  filters: CategoryFilters;
  setSearchQuery: (query: string) => void;
  setAccountFilter: (accountId: string | null) => void;
  loadCategories: () => Promise<void>;
  addCategory: (input: CreateCategoryInput) => Promise<CategoryWithStats>;
  editCategory: (id: string, input: UpdateCategoryInput) => Promise<CategoryWithStats>;
  removeCategory: (id: string) => Promise<boolean>;
  clearLastCreatedCategory: () => void;
  getTotalBudget: () => number;
  getTotalSpent: () => number;
};

function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

async function enrichCategories(
  categories: Awaited<ReturnType<typeof databaseService.searchCategories>>,
): Promise<CategoryWithStats[]> {
  const { year, month } = getCurrentYearMonth();

  return Promise.all(
    categories.map(async (category) => {
      const [spent, account] = await Promise.all([
        databaseService.getMonthlySpentForCategory(category.id, year, month),
        category.accountId
          ? databaseService.getAccountById(category.accountId)
          : Promise.resolve(null),
      ]);

      return {
        ...category,
        spent,
        accountName: account?.name ?? null,
      };
    }),
  );
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  lastCreatedCategoryId: null,
  filters: {
    searchQuery: '',
    accountId: null,
  },

  setSearchQuery: (query) => {
    set({ filters: { ...get().filters, searchQuery: query } });
  },

  setAccountFilter: (accountId) => {
    set({ filters: { ...get().filters, accountId } });
  },

  loadCategories: async () => {
    const { searchQuery, accountId } = get().filters;
    set({ loading: true, error: null });

    try {
      const results = await databaseService.searchCategories(
        searchQuery,
        accountId,
        'spending',
      );
      const categories = await enrichCategories(results);
      set({ categories, loading: false });
    } catch (error) {
      console.error('[CategoryStore] loadCategories failed', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load categories',
      });
    }
  },

  addCategory: async (input) => {
    try {
      const category = await databaseService.createCategory({
        ...input,
        scope: 'spending',
      });
      const { year, month } = getCurrentYearMonth();
      const spent = await databaseService.getMonthlySpentForCategory(
        category.id,
        year,
        month,
      );
      const account = category.accountId
        ? await databaseService.getAccountById(category.accountId)
        : null;

      const enriched: CategoryWithStats = {
        ...category,
        spent,
        accountName: account?.name ?? null,
      };

      set({
        categories: [...get().categories, enriched].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        lastCreatedCategoryId: enriched.id,
      });
      return enriched;
    } catch (error) {
      console.error('[CategoryStore] addCategory failed', error);
      if (
        error instanceof CategoryDuplicateNameError ||
        error instanceof CategorySaveError
      ) {
        throw error;
      }
      throw new CategorySaveError(error);
    }
  },

  editCategory: async (id, input) => {
    try {
      const updated = await databaseService.updateCategory(id, input);
      const { year, month } = getCurrentYearMonth();
      const spent = await databaseService.getMonthlySpentForCategory(id, year, month);
      const account = updated.accountId
        ? await databaseService.getAccountById(updated.accountId)
        : null;

      const enriched: CategoryWithStats = {
        ...updated,
        spent,
        accountName: account?.name ?? null,
      };

      set({
        categories: get()
          .categories.map((c) => (c.id === id ? enriched : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });

      return enriched;
    } catch (error) {
      console.error('[CategoryStore] editCategory failed', error);
      if (
        error instanceof CategoryDuplicateNameError ||
        error instanceof CategoryNotFoundError ||
        error instanceof CategorySaveError
      ) {
        throw error;
      }
      throw new CategorySaveError(error);
    }
  },

  removeCategory: async (id) => {
    try {
      const deleted = await databaseService.deleteCategory(id);
      if (deleted) {
        set({ categories: get().categories.filter((c) => c.id !== id) });
      }
      return deleted;
    } catch (error) {
      console.error('[CategoryStore] removeCategory failed', error);
      if (error instanceof CategoryDeleteBlockedError) {
        throw error;
      }
      throw new Error('Category could not be deleted');
    }
  },

  clearLastCreatedCategory: () => set({ lastCreatedCategoryId: null }),

  getTotalBudget: () => get().categories.reduce((sum, c) => sum + c.budget, 0),

  getTotalSpent: () => get().categories.reduce((sum, c) => sum + c.spent, 0),
}));

export {
  CategoryDeleteBlockedError,
  CategoryDuplicateNameError,
  CategoryNotFoundError,
  CategorySaveError,
} from '../database';
