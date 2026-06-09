import { Account } from '../database/types';

export type AccountDeleteBlockReason = 'only_account' | 'default_account';

export function getAccountDeleteBlockReason(
  accounts: Account[],
  accountId: string,
): AccountDeleteBlockReason | null {
  if (accounts.length <= 1) {
    return 'only_account';
  }

  const account = accounts.find((item) => item.id === accountId);
  if (account?.isDefault) {
    return 'default_account';
  }

  return null;
}

export function getDefaultAccount(accounts: Account[]): Account | undefined {
  return accounts.find((account) => account.isDefault) ?? accounts[0];
}
