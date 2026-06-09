import { create } from 'zustand';
import { databaseService } from '../database';
import {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../database/types';
import { getAccountDeleteBlockReason } from '../utils/accountDeleteRules';

export class AccountDeleteBlockedError extends Error {
  constructor(public readonly reason: 'only_account' | 'default_account') {
    super(reason);
    this.name = 'AccountDeleteBlockedError';
  }
}

type AccountStore = {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  addAccount: (input: CreateAccountInput) => Promise<Account>;
  editAccount: (id: string, input: UpdateAccountInput) => Promise<Account | null>;
  setDefaultAccount: (id: string) => Promise<Account | null>;
  removeAccount: (id: string) => Promise<boolean>;
  updateBalance: (id: string, balance: number) => Promise<Account | null>;
  getTotalBalance: () => number;
};

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  loadAccounts: async () => {
    set({ loading: true, error: null });
    try {
      await databaseService.ensureDefaultAccount();
      const accounts = await databaseService.getAllAccounts();
      set({ accounts, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load accounts',
      });
    }
  },

  addAccount: async (input) => {
    const account = await databaseService.createAccount(input);
    await get().loadAccounts();
    return account;
  },

  editAccount: async (id, input) => {
    const updated = await databaseService.updateAccount(id, input);
    if (updated) {
      await get().loadAccounts();
    }
    return updated;
  },

  setDefaultAccount: async (id) => {
    const updated = await databaseService.updateAccount(id, { isDefault: true });
    if (updated) {
      await get().loadAccounts();
    }
    return updated;
  },

  removeAccount: async (id) => {
    const blockReason = getAccountDeleteBlockReason(get().accounts, id);
    if (blockReason) {
      throw new AccountDeleteBlockedError(blockReason);
    }

    try {
      const deleted = await databaseService.deleteAccount(id);
      if (deleted) {
        set({ accounts: get().accounts.filter((a) => a.id !== id) });
        await databaseService.ensureDefaultAccount();
        await get().loadAccounts();
      }
      return deleted;
    } catch (error) {
      if (error instanceof AccountDeleteBlockedError) {
        throw error;
      }
      throw new Error('Account has linked transactions');
    }
  },

  updateBalance: async (id, balance) => {
    return get().editAccount(id, { balance });
  },

  getTotalBalance: () => {
    return get().accounts.reduce((sum, account) => sum + account.balance, 0);
  },
}));
