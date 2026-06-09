import { TransactionWithDetails } from '../database/types';

export type DateRangePreset =
  | 'this_month'
  | 'last_30_days'
  | 'last_3_months'
  | 'this_year'
  | 'custom';

export type DateRange = {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
};

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  this_month: 'This Month',
  last_30_days: 'Last 30 Days',
  last_3_months: 'Last 3 Months',
  this_year: 'This Year',
  custom: 'Custom',
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultDateRange(): DateRange {
  const bounds = getDateRangeBounds('this_month');
  return {
    preset: 'this_month',
    startDate: bounds.startDate,
    endDate: bounds.endDate,
  };
}

export function getDateRangeBounds(preset: Exclude<DateRangePreset, 'custom'>): {
  startDate: string;
  endDate: string;
} {
  const today = new Date();
  const endDate = formatDate(today);

  switch (preset) {
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(start), endDate };
    }
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: formatDate(start), endDate };
    }
    case 'last_3_months': {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      return { startDate: formatDate(start), endDate };
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: formatDate(start), endDate };
    }
  }
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

export function filterTransactions(
  transactions: TransactionWithDetails[],
  accountId: string | null,
  startDate: string,
  endDate: string,
): TransactionWithDetails[] {
  return transactions.filter((tx) => {
    if (accountId && tx.accountId !== accountId) return false;
    return isDateInRange(tx.date, startDate, endDate);
  });
}

export type CategoryExpense = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
};

const UNCATEGORIZED_KEY = '__uncategorized__';

export function getExpensesByCategory(
  transactions: TransactionWithDetails[],
): CategoryExpense[] {
  const totals = new Map<string, CategoryExpense>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;

    const key = tx.categoryId ?? UNCATEGORIZED_KEY;
    const existing = totals.get(key);
    if (existing) {
      existing.amount += tx.amount;
    } else {
      totals.set(key, {
        categoryId: key,
        name: tx.categoryName ?? 'Uncategorized',
        color: tx.categoryColor ?? '#94A3B8',
        amount: tx.amount,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

export function sumByType(
  transactions: TransactionWithDetails[],
  type: 'income' | 'expense',
): number {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function formatRangeLabel(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const startLabel = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}
