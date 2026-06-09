import { Investment, InvestmentWithDetails } from '../database/types';
import { Account } from '../database/types';

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function clampDeductionDay(day: number, year: number, month: number): number {
  return Math.min(day, daysInMonth(year, month));
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentYearMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getDeductionDateForMonth(
  deductionDay: number,
  year: number,
  month: number,
): Date {
  const day = clampDeductionDay(deductionDay, year, month);
  return new Date(year, month, day);
}

export function getNextDeductionDate(deductionDay: number, from = new Date()): string {
  const year = from.getFullYear();
  const month = from.getMonth();
  const today = from.getDate();

  const thisMonthDay = clampDeductionDay(deductionDay, year, month);
  if (today <= thisMonthDay) {
    return formatDateISO(new Date(year, month, thisMonthDay));
  }

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const normalizedMonth = nextMonth % 12;
  const nextDay = clampDeductionDay(deductionDay, nextYear, normalizedMonth);
  return formatDateISO(new Date(nextYear, normalizedMonth, nextDay));
}

export function getInvestmentStatus(
  investment: Investment,
  reference = new Date(),
): 'upcoming' | 'processed' {
  const currentMonth = getCurrentYearMonth(reference);
  if (investment.lastProcessedMonth === currentMonth) {
    return 'processed';
  }
  return 'upcoming';
}

export function enrichInvestment(
  investment: Investment,
  account: Account | undefined,
  reference = new Date(),
): InvestmentWithDetails {
  return {
    ...investment,
    accountName: account?.name ?? 'Unknown Account',
    accountIcon: account?.icon ?? '💰',
    status: getInvestmentStatus(investment, reference),
    nextDeductionDate: getNextDeductionDate(investment.deductionDay, reference),
  };
}

export function sortInvestmentsByAmount(
  items: InvestmentWithDetails[],
  direction: 'asc' | 'desc' = 'desc',
): InvestmentWithDetails[] {
  return [...items].sort((a, b) =>
    direction === 'asc' ? a.amount - b.amount : b.amount - a.amount,
  );
}

export function sortInvestmentsByNextDate(
  items: InvestmentWithDetails[],
): InvestmentWithDetails[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.nextDeductionDate).getTime() - new Date(b.nextDeductionDate).getTime(),
  );
}

export function getTotalMonthlyInvestments(investments: Investment[]): number {
  return investments
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getUpcomingInvestmentCount(investments: InvestmentWithDetails[]): number {
  return investments.filter((item) => item.isActive && item.status === 'upcoming').length;
}

export function getEarliestNextDeduction(
  investments: InvestmentWithDetails[],
): string | null {
  const active = investments.filter((item) => item.isActive);
  if (active.length === 0) return null;

  return active.reduce((earliest, item) =>
    new Date(item.nextDeductionDate) < new Date(earliest.nextDeductionDate)
      ? item
      : earliest,
  ).nextDeductionDate;
}

export function getInvestmentsByType(
  investments: Investment[],
): Array<{ type: Investment['type']; amount: number; count: number }> {
  const map = new Map<Investment['type'], { amount: number; count: number }>();

  for (const investment of investments.filter((item) => item.isActive)) {
    const existing = map.get(investment.type) ?? { amount: 0, count: 0 };
    map.set(investment.type, {
      amount: existing.amount + investment.amount,
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries()).map(([type, stats]) => ({
    type,
    ...stats,
  }));
}
