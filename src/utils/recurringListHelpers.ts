import {
  INVESTMENT_TYPE_COLORS,
  INVESTMENT_TYPE_ICONS,
  INVESTMENT_TYPE_LABELS,
} from '../constants/investmentOptions';
import {
  InvestmentWithDetails,
  RecurringExpenseWithDetails,
} from '../database/types';
import { colors } from '../theme/colors';
import { getTotalMonthlyInvestments } from './investmentHelpers';
import { normalizeToMonthly } from './recurringHelpers';
import { RecurringExpenseCategoryType } from '../constants/recurringOptions';
import { findCategoryTypeByName } from '../services/recurring/recurringCategoryService';

export type RecurringSegment = 'all' | 'investments' | 'expenses';

export type UnifiedRecurringItem =
  | {
      kind: 'investment';
      id: string;
      name: string;
      amount: number;
      accountName: string;
      accountIcon: string;
      typeLabel: string;
      nextDueDate: string;
      status: 'upcoming' | 'processed';
      isActive: boolean;
      accentColor: string;
      icon: string;
      raw: InvestmentWithDetails;
    }
  | {
      kind: 'expense';
      id: string;
      name: string;
      amount: number;
      accountName: string;
      accountIcon: string;
      typeLabel: string;
      nextDueDate: string;
      status: 'upcoming' | 'processed';
      isActive: boolean;
      accentColor: string;
      icon: string;
      raw: RecurringExpenseWithDetails;
    };

const INVESTMENT_ACCENT = colors.income;
const EXPENSE_ACCENT = '#F97316';

export function toUnifiedInvestmentItem(
  investment: InvestmentWithDetails,
): UnifiedRecurringItem {
  return {
    kind: 'investment',
    id: investment.id,
    name: investment.name,
    amount: investment.amount,
    accountName: investment.accountName,
    accountIcon: investment.accountIcon,
    typeLabel: INVESTMENT_TYPE_LABELS[investment.type],
    nextDueDate: investment.nextDeductionDate,
    status: investment.status,
    isActive: investment.isActive,
    accentColor: INVESTMENT_ACCENT,
    icon: INVESTMENT_TYPE_ICONS[investment.type],
    raw: investment,
  };
}

export function toUnifiedExpenseItem(
  expense: RecurringExpenseWithDetails,
): UnifiedRecurringItem {
  return {
    kind: 'expense',
    id: expense.id,
    name: expense.name,
    amount: expense.amount,
    accountName: expense.accountName,
    accountIcon: expense.accountIcon,
    typeLabel: expense.categoryName,
    nextDueDate: expense.nextDueDate,
    status: expense.status,
    isActive: expense.isActive,
    accentColor: EXPENSE_ACCENT,
    icon: expense.categoryIcon,
    raw: expense,
  };
}

export function mergeRecurringItems(
  investments: InvestmentWithDetails[],
  expenses: RecurringExpenseWithDetails[],
  segment: RecurringSegment,
  searchQuery: string,
): UnifiedRecurringItem[] {
  const query = searchQuery.trim().toLowerCase();
  let items: UnifiedRecurringItem[] = [];

  if (segment === 'all' || segment === 'investments') {
    items = items.concat(investments.map(toUnifiedInvestmentItem));
  }

  if (segment === 'all' || segment === 'expenses') {
    items = items.concat(expenses.map(toUnifiedExpenseItem));
  }

  if (query) {
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.typeLabel.toLowerCase().includes(query) ||
        item.accountName.toLowerCase().includes(query),
    );
  }

  return items.sort(
    (a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
  );
}

export function getEarliestScheduledDate(
  investmentDate: string | null,
  expenseDate: string | null,
): string | null {
  const dates = [investmentDate, expenseDate].filter(Boolean) as string[];
  if (dates.length === 0) return null;

  return dates.reduce((earliest, date) =>
    new Date(date) < new Date(earliest) ? date : earliest,
  );
}

export type ExpenseOverviewGroup =
  | 'rent'
  | 'emi'
  | 'utilities'
  | 'insurance'
  | 'subscriptions'
  | 'other';

const OVERVIEW_GROUP_LABELS: Record<ExpenseOverviewGroup, string> = {
  rent: 'Rent',
  emi: 'EMI',
  utilities: 'Utilities',
  insurance: 'Insurance',
  subscriptions: 'Subscriptions',
  other: 'Other',
};

const OVERVIEW_GROUP_COLORS: Record<ExpenseOverviewGroup, string> = {
  rent: '#F97316',
  emi: '#6366F1',
  utilities: '#0EA5E9',
  insurance: '#8B5CF6',
  subscriptions: '#EC4899',
  other: '#94A3B8',
};

const CATEGORY_TO_OVERVIEW: Record<RecurringExpenseCategoryType, ExpenseOverviewGroup> = {
  rent: 'rent',
  emi: 'emi',
  insurance: 'insurance',
  electricity: 'utilities',
  internet: 'utilities',
  water_bill: 'utilities',
  maintenance: 'utilities',
  ott_subscriptions: 'subscriptions',
  gym_membership: 'subscriptions',
  school_fees: 'subscriptions',
  custom: 'other',
};

export function classifyExpenseOverviewGroup(
  categoryName: string,
  expenseName: string,
): ExpenseOverviewGroup {
  const matchedType = findCategoryTypeByName(categoryName);
  if (matchedType) {
    return CATEGORY_TO_OVERVIEW[matchedType];
  }

  const text = `${categoryName} ${expenseName}`.toLowerCase();

  if (text.includes('rent')) return 'rent';
  if (text.includes('emi') || text.includes('loan')) return 'emi';
  if (
    text.includes('electric') ||
    text.includes('water') ||
    text.includes('internet') ||
    text.includes('utilit') ||
    text.includes('maintenance')
  ) {
    return 'utilities';
  }
  if (text.includes('insur')) return 'insurance';
  if (
    text.includes('subscription') ||
    text.includes('ott') ||
    text.includes('gym') ||
    text.includes('school')
  ) {
    return 'subscriptions';
  }

  return 'other';
}

export function getRecurringOverviewBreakdown(
  investments: InvestmentWithDetails[],
  expenses: RecurringExpenseWithDetails[],
): Array<{ key: string; label: string; amount: number; color: string }> {
  const investmentTotal = getTotalMonthlyInvestments(investments);

  const groups = new Map<ExpenseOverviewGroup, number>();

  for (const expense of expenses.filter((item) => item.isActive)) {
    const group = classifyExpenseOverviewGroup(expense.categoryName, expense.name);
    const monthly = normalizeToMonthly(expense.amount, expense.frequency);
    groups.set(group, (groups.get(group) ?? 0) + monthly);
  }

  const result: Array<{ key: string; label: string; amount: number; color: string }> = [
    {
      key: 'investments',
      label: 'Investments',
      amount: investmentTotal,
      color: colors.income,
    },
  ];

  (['rent', 'emi', 'utilities', 'insurance', 'subscriptions'] as ExpenseOverviewGroup[]).forEach(
    (group) => {
      const amount = groups.get(group) ?? 0;
      if (amount > 0) {
        result.push({
          key: group,
          label: OVERVIEW_GROUP_LABELS[group],
          amount,
          color: OVERVIEW_GROUP_COLORS[group],
        });
      }
    },
  );

  return result;
}
