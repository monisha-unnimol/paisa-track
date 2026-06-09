import {
  RecurringExpense,
  RecurringExpenseWithDetails,
  RecurringFrequency,
} from '../database/types';
import { Account, Category } from '../database/types';
import {
  clampDeductionDay,
  formatDateISO,
} from './investmentHelpers';

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

function monthsSinceStart(startDate: string, ref: Date): number {
  const start = parseDate(startDate);
  return (ref.getFullYear() - start.getFullYear()) * 12 + (ref.getMonth() - start.getMonth());
}

function isPastEndDate(endDate: string | null, ref: Date): boolean {
  if (!endDate) return false;
  return formatDateISO(ref) > endDate;
}

export function getIsoWeekKey(date: Date): string {
  const target = new Date(date.getTime());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const weekYear = target.getFullYear();
  const weekNumber = Math.ceil(
    ((target.getTime() - new Date(weekYear, 0, 4).getTime()) / 86400000 + 1) / 7,
  );
  return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
}

export function isDueMonth(
  frequency: RecurringFrequency,
  startDate: string,
  ref: Date,
): boolean {
  const months = monthsSinceStart(startDate, ref);
  if (months < 0) return false;

  switch (frequency) {
    case 'monthly':
      return true;
    case 'quarterly':
      return months % 3 === 0;
    case 'half_yearly':
      return months % 6 === 0;
    case 'yearly':
      return months % 12 === 0;
    default:
      return false;
  }
}

export function getCycleKey(
  expense: RecurringExpense,
  reference = new Date(),
): string {
  if (expense.frequency === 'weekly') {
    return getIsoWeekKey(reference);
  }

  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthlyDeductionDate(
  deductionDay: number,
  year: number,
  month: number,
): number {
  return clampDeductionDay(deductionDay, year, month);
}

export function getNextDueDate(expense: RecurringExpense, from = new Date()): string {
  const todayStr = formatDateISO(from);

  if (expense.endDate && todayStr > expense.endDate) {
    return expense.endDate;
  }

  if (expense.frequency === 'weekly') {
    const currentDay = from.getDay();
    const daysUntil = (expense.deductionDay - currentDay + 7) % 7;
    const next = new Date(from);
    next.setDate(from.getDate() + (daysUntil === 0 && expense.lastProcessedCycle === getIsoWeekKey(from) ? 7 : daysUntil));
    if (expense.startDate > formatDateISO(next)) {
      const start = parseDate(expense.startDate);
      const startDay = start.getDay();
      const offset = (expense.deductionDay - startDay + 7) % 7;
      start.setDate(start.getDate() + offset);
      return formatDateISO(start);
    }
    return formatDateISO(next);
  }

  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = 0; i < 36; i += 1) {
    if (isDueMonth(expense.frequency, expense.startDate, cursor)) {
      const dueDay = getMonthlyDeductionDate(
        expense.deductionDay,
        cursor.getFullYear(),
        cursor.getMonth(),
      );
      const dueDate = new Date(cursor.getFullYear(), cursor.getMonth(), dueDay);
      const dueStr = formatDateISO(dueDate);

      if (dueStr >= expense.startDate && dueStr >= todayStr) {
        if (expense.endDate && dueStr > expense.endDate) {
          return expense.endDate;
        }
        return dueStr;
      }
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return todayStr;
}

export function getRecurringStatus(
  expense: RecurringExpense,
  reference = new Date(),
): 'upcoming' | 'processed' {
  const cycleKey = getCycleKey(expense, reference);
  if (expense.lastProcessedCycle === cycleKey) {
    return 'processed';
  }
  return 'upcoming';
}

export function shouldProcessToday(expense: RecurringExpense, today: Date): boolean {
  if (!expense.isActive) return false;

  const todayStr = formatDateISO(today);
  if (expense.startDate > todayStr) return false;
  if (isPastEndDate(expense.endDate, today)) return false;

  const cycleKey = getCycleKey(expense, today);
  if (expense.lastProcessedCycle === cycleKey) return false;

  if (expense.frequency === 'weekly') {
    return today.getDay() >= expense.deductionDay;
  }

  if (!isDueMonth(expense.frequency, expense.startDate, today)) {
    return false;
  }

  const effectiveDay = getMonthlyDeductionDate(
    expense.deductionDay,
    today.getFullYear(),
    today.getMonth(),
  );

  return today.getDate() >= effectiveDay;
}

export function isDueTomorrow(expense: RecurringExpense, today: Date): boolean {
  if (!expense.isActive) return false;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateISO(tomorrow);

  if (expense.startDate > tomorrowStr) return false;
  if (isPastEndDate(expense.endDate, tomorrow)) return false;

  const nextDue = getNextDueDate(expense, today);
  return nextDue === tomorrowStr;
}

export function enrichRecurringExpense(
  expense: RecurringExpense,
  account: Account | undefined,
  category: Category | undefined,
  reference = new Date(),
): RecurringExpenseWithDetails {
  return {
    ...expense,
    accountName: account?.name ?? 'Unknown Account',
    accountIcon: account?.icon ?? '💰',
    categoryName: category?.name ?? 'Category Not Found',
    categoryIcon: category?.icon ?? '📁',
    categoryColor: category?.color ?? colorsFallback,
    status: getRecurringStatus(expense, reference),
    nextDueDate: getNextDueDate(expense, reference),
  };
}

const colorsFallback = '#94A3B8';

export function normalizeToMonthly(
  amount: number,
  frequency: RecurringFrequency,
): number {
  switch (frequency) {
    case 'weekly':
      return amount * (52 / 12);
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'half_yearly':
      return amount / 6;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export function sortRecurringByDueDate(
  items: RecurringExpenseWithDetails[],
): RecurringExpenseWithDetails[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
  );
}

export function getTotalMonthlyRecurring(expenses: RecurringExpense[]): number {
  return expenses
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + normalizeToMonthly(item.amount, item.frequency), 0);
}

export function getUpcomingRecurringCount(
  expenses: RecurringExpenseWithDetails[],
): number {
  return expenses.filter((item) => item.isActive && item.status === 'upcoming').length;
}

export function getEarliestNextDue(
  expenses: RecurringExpenseWithDetails[],
): string | null {
  const active = expenses.filter((item) => item.isActive);
  if (active.length === 0) return null;

  return active.reduce((earliest, item) =>
    new Date(item.nextDueDate) < new Date(earliest.nextDueDate) ? item : earliest,
  ).nextDueDate;
}

export function getRecurringBreakdownByCategory(
  expenses: RecurringExpenseWithDetails[],
): Array<{ categoryId: string; name: string; color: string; amount: number; count: number }> {
  const map = new Map<
    string,
    { name: string; color: string; amount: number; count: number }
  >();

  for (const expense of expenses.filter((item) => item.isActive)) {
    const monthly = normalizeToMonthly(expense.amount, expense.frequency);
    const existing = map.get(expense.categoryId) ?? {
      name: expense.categoryName,
      color: expense.categoryColor,
      amount: 0,
      count: 0,
    };
    map.set(expense.categoryId, {
      ...existing,
      amount: existing.amount + monthly,
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries()).map(([categoryId, stats]) => ({
    categoryId,
    ...stats,
  }));
}

export function getRentVsOtherRecurring(
  expenses: RecurringExpenseWithDetails[],
): { rent: number; other: number } {
  let rent = 0;
  let other = 0;

  for (const expense of expenses.filter((item) => item.isActive)) {
    const monthly = normalizeToMonthly(expense.amount, expense.frequency);
    if (expense.categoryName.toLowerCase() === 'rent') {
      rent += monthly;
    } else {
      other += monthly;
    }
  }

  return { rent, other };
}

export function formatDeductionDayLabel(
  frequency: RecurringFrequency,
  deductionDay: number,
): string {
  if (frequency === 'weekly') {
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekday[deductionDay] ?? 'Unknown';
  }
  return `${deductionDay}${getDaySuffix(deductionDay)} of month`;
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
