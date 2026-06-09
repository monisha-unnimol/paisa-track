import { AccountType } from '../database/types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Cash',
  bank: 'Bank',
  credit: 'Credit Card',
  wallet: 'Digital Wallet',
};

export const ACCOUNT_TYPES: AccountType[] = ['cash', 'bank', 'credit', 'wallet'];

export const ACCOUNT_ICONS = ['💰', '🏦', '💳', '👛', '🪙', '💵', '📱', '🏧'];

export const ACCOUNT_COLORS = [
  '#0D9488',
  '#6366F1',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#3B82F6',
  '#DC2626',
];
