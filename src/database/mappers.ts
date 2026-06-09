import {
  Account,
  AccountType,
  Category,
  CategoryScope,
  Investment,
  InvestmentType,
  RecurringExpense,
  RecurringFrequency,
  ReviewRequest,
  ReviewRequestStatus,
  ReviewRequestType,
  Transaction,
  TransactionType,
  TransactionWithDetails,
  UserProfile,
} from './types';

export type AccountRow = {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
  color: string;
  currency: string;
  is_default: number;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number;
  account_id: string | null;
  scope: string;
  created_at: string;
  updated_at: string;
};

export type ReviewRequestRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  review_data: string;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionRow = {
  id: string;
  title: string;
  amount: number;
  category_id: string | null;
  account_id: string;
  date: string;
  type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function mapAccountRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AccountType,
    balance: row.balance,
    icon: row.icon,
    color: row.color,
    currency: row.currency,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    budget: row.budget,
    accountId: row.account_id,
    scope: (row.scope === 'recurring' ? 'recurring' : 'spending') as CategoryScope,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReviewRequestRow(row: ReviewRequestRow): ReviewRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as ReviewRequestType,
    status: row.status as ReviewRequestStatus,
    reviewData: row.review_data,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    categoryId: row.category_id,
    accountId: row.account_id,
    date: row.date,
    type: row.type as TransactionType,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type TransactionWithDetailsRow = TransactionRow & {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  account_name: string;
};

export function mapTransactionWithDetailsRow(
  row: TransactionWithDetailsRow,
): TransactionWithDetails {
  return {
    ...mapTransactionRow(row),
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    accountName: row.account_name,
  };
}

export type InvestmentRow = {
  id: string;
  name: string;
  type: string;
  amount: number;
  account_id: string;
  deduction_day: number;
  start_date: string;
  notes: string | null;
  is_active: number;
  last_processed_month: string | null;
  last_processed_date: string | null;
  created_at: string;
  updated_at: string;
};

export type InvestmentWithDetailsRow = InvestmentRow & {
  account_name: string;
  account_icon: string;
};

export function mapInvestmentRow(row: InvestmentRow): Investment {
  return {
    id: row.id,
    name: row.name,
    type: row.type as InvestmentType,
    amount: row.amount,
    accountId: row.account_id,
    deductionDay: row.deduction_day,
    startDate: row.start_date,
    notes: row.notes,
    isActive: row.is_active === 1,
    lastProcessedMonth: row.last_processed_month,
    lastProcessedDate: row.last_processed_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type RecurringExpenseRow = {
  id: string;
  name: string;
  amount: number;
  account_id: string;
  category_id: string;
  frequency: string;
  deduction_day: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: number;
  last_processed_cycle: string | null;
  last_processed_date: string | null;
  created_at: string;
  updated_at: string;
};

export function mapRecurringExpenseRow(row: RecurringExpenseRow): RecurringExpense {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    accountId: row.account_id,
    categoryId: row.category_id,
    frequency: row.frequency as RecurringFrequency,
    deductionDay: row.deduction_day,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    isActive: row.is_active === 1,
    lastProcessedCycle: row.last_processed_cycle,
    lastProcessedDate: row.last_processed_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type UserProfileRow = {
  id: string;
  name: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

export function mapUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
