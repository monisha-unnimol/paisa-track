export type AccountType = 'cash' | 'bank' | 'credit' | 'wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
  currency: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  icon?: string;
  color?: string;
  currency?: string;
  isDefault?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  balance?: number;
  icon?: string;
  color?: string;
  currency?: string;
  isDefault?: boolean;
}

export type CategoryScope = 'spending' | 'recurring';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number;
  accountId: string | null;
  scope: CategoryScope;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithStats extends Category {
  spent: number;
  accountName: string | null;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  budget?: number;
  accountId?: string | null;
  scope?: CategoryScope;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  budget?: number;
  accountId?: string | null;
}

export type ReviewRequestType =
  | 'sms_transaction'
  | 'investment'
  | 'recurring_expense'
  | 'auto_expense'
  | 'income';

export type ReviewRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewRequest {
  id: string;
  title: string;
  description: string;
  type: ReviewRequestType;
  status: ReviewRequestStatus;
  reviewData: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequestInput {
  title: string;
  description: string;
  type: ReviewRequestType;
  reviewData: Record<string, unknown>;
  source?: string | null;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  categoryId: string | null;
  accountId: string;
  date: string;
  type: TransactionType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  title: string;
  amount: number;
  categoryId?: string | null;
  accountId: string;
  date: string;
  type: TransactionType;
  notes?: string | null;
}

export interface UpdateTransactionInput {
  title?: string;
  amount?: number;
  categoryId?: string | null;
  accountId?: string;
  date?: string;
  type?: TransactionType;
  notes?: string | null;
}

export interface TransactionWithDetails extends Transaction {
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  accountName: string;
}

export type InvestmentType =
  | 'sip'
  | 'mutual_fund'
  | 'stocks'
  | 'ppf'
  | 'epf'
  | 'nps'
  | 'fixed_deposit'
  | 'recurring_deposit'
  | 'gold'
  | 'crypto'
  | 'custom';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  amount: number;
  accountId: string;
  deductionDay: number;
  startDate: string;
  notes: string | null;
  isActive: boolean;
  lastProcessedMonth: string | null;
  lastProcessedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentWithDetails extends Investment {
  accountName: string;
  accountIcon: string;
  status: 'upcoming' | 'processed';
  nextDeductionDate: string;
}

export interface CreateInvestmentInput {
  name: string;
  type: InvestmentType;
  amount: number;
  accountId: string;
  deductionDay: number;
  startDate: string;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateInvestmentInput {
  name?: string;
  type?: InvestmentType;
  amount?: number;
  accountId?: string;
  deductionDay?: number;
  startDate?: string;
  notes?: string | null;
  isActive?: boolean;
}

export type RecurringFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'yearly';

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  accountId: string;
  categoryId: string;
  frequency: RecurringFrequency;
  deductionDay: number;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  isActive: boolean;
  lastProcessedCycle: string | null;
  lastProcessedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpenseWithDetails extends RecurringExpense {
  accountName: string;
  accountIcon: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  status: 'upcoming' | 'processed';
  nextDueDate: string;
}

export interface CreateRecurringExpenseInput {
  name: string;
  amount: number;
  accountId: string;
  categoryId: string;
  frequency: RecurringFrequency;
  deductionDay: number;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateRecurringExpenseInput {
  name?: string;
  amount?: number;
  accountId?: string;
  categoryId?: string;
  frequency?: RecurringFrequency;
  deductionDay?: number;
  startDate?: string;
  endDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertUserProfileInput {
  name: string;
  avatar?: string | null;
}
