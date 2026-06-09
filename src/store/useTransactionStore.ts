import { create } from 'zustand';
import { databaseService } from '../database';
import {
  CreateTransactionInput,
  TransactionType,
  TransactionWithDetails,
  UpdateTransactionInput,
} from '../database/types';
import { useAccountStore } from './useAccountStore';
import { useCategoryStore } from './useCategoryStore';
import { evaluateCategoryLimits } from '../services/notifications/categoryLimitNotifier';

type TransactionStore = {
  transactions: TransactionWithDetails[];
  loading: boolean;
  error: string | null;
  loadTransactions: () => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<TransactionWithDetails>;
  editTransaction: (
    id: string,
    input: UpdateTransactionInput,
  ) => Promise<TransactionWithDetails | null>;
  removeTransaction: (id: string) => Promise<boolean>;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
};

async function refreshRelatedStores(categoryIds: string[] = []): Promise<void> {
  await Promise.all([
    useAccountStore.getState().loadAccounts(),
    useCategoryStore.getState().loadCategories(),
  ]);

  if (categoryIds.length > 0) {
    await evaluateCategoryLimits(categoryIds);
  }
}

async function enrichTransaction(id: string): Promise<TransactionWithDetails> {
  const details = await databaseService.getTransactionWithDetailsById(id);
  if (!details) {
    throw new Error('Transaction not found after save');
  }
  return details;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  loadTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const transactions = await databaseService.getAllTransactionsWithDetails();
      set({ transactions, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load transactions',
      });
    }
  },

  addTransaction: async (input) => {
    const created = await databaseService.createTransaction(input);
    const categoryIds =
      input.type === 'expense' && input.categoryId ? [input.categoryId] : [];
    await refreshRelatedStores(categoryIds);
    const details = await enrichTransaction(created.id);
    set({ transactions: [details, ...get().transactions] });
    return details;
  },

  editTransaction: async (id, input) => {
    const existing = await databaseService.getTransactionById(id);
    const updated = await databaseService.updateTransaction(id, input);
    if (!updated) return null;

    const categoryIds = new Set<string>();
    if (existing?.type === 'expense' && existing.categoryId) {
      categoryIds.add(existing.categoryId);
    }
    if (updated.type === 'expense' && updated.categoryId) {
      categoryIds.add(updated.categoryId);
    }

    await refreshRelatedStores([...categoryIds]);
    const details = await enrichTransaction(id);
    set({
      transactions: get().transactions.map((tx) => (tx.id === id ? details : tx)),
    });
    return details;
  },

  removeTransaction: async (id) => {
    const existing = await databaseService.getTransactionById(id);
    const deleted = await databaseService.deleteTransaction(id);
    if (deleted) {
      const categoryIds =
        existing?.type === 'expense' && existing.categoryId
          ? [existing.categoryId]
          : [];
      await refreshRelatedStores(categoryIds);
      set({ transactions: get().transactions.filter((tx) => tx.id !== id) });
    }
    return deleted;
  },

  getTotalIncome: () =>
    get()
      .transactions.filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0),

  getTotalExpenses: () =>
    get()
      .transactions.filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0),
}));

export function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTransactionDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export type { TransactionType };
