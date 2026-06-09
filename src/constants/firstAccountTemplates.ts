import { AccountType } from '../database/types';

export type FirstAccountTemplate = {
  id: string;
  label: string;
  emoji: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
};

export const FIRST_ACCOUNT_TEMPLATES: FirstAccountTemplate[] = [
  {
    id: 'hdfc-salary',
    label: 'HDFC Salary Account',
    emoji: '🏦',
    name: 'HDFC Salary Account',
    type: 'bank',
    icon: '🏦',
    color: '#0D9488',
  },
  {
    id: 'icici-savings',
    label: 'ICICI Savings Account',
    emoji: '🏦',
    name: 'ICICI Savings Account',
    type: 'bank',
    icon: '🏦',
    color: '#6366F1',
  },
  {
    id: 'sbi-savings',
    label: 'SBI Savings Account',
    emoji: '🏦',
    name: 'SBI Savings Account',
    type: 'bank',
    icon: '🏦',
    color: '#3B82F6',
  },
  {
    id: 'cash-wallet',
    label: 'Cash Wallet',
    emoji: '💵',
    name: 'Cash Wallet',
    type: 'cash',
    icon: '💵',
    color: '#F59E0B',
  },
];

export const FIRST_ACCOUNT_TYPE_OPTIONS: {
  type: AccountType;
  label: string;
}[] = [
  { type: 'bank', label: 'Bank Account' },
  { type: 'cash', label: 'Cash' },
  { type: 'wallet', label: 'Wallet' },
  { type: 'credit', label: 'Credit Card' },
];
