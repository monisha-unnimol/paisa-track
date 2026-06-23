import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from '../../database';
import { Investment } from '../../database/types';
import { useAccountStore } from '../../store/useAccountStore';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import {
  clampDeductionDay,
  formatDateISO,
  getCurrentYearMonth,
} from '../../utils/investmentHelpers';
import { formatCurrency } from '../../utils/currency';
import {
  notifyInvestmentProcessed,
  notifyInvestmentUpcoming,
} from '../notifications/notificationService';
import { createInvestmentReview } from '../reviews/reviewService';

const STORAGE_KEY = '@expense_tracker/investment_notify_state';
type NotifyState = Record<string, string>;

async function readStates(): Promise<NotifyState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotifyState) : {};
  } catch {
    return {};
  }
}

async function writeStates(states: NotifyState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

async function getAccountName(accountId: string): Promise<string> {
  const account = await databaseService.getAccountById(accountId);
  return account?.name ?? 'your account';
}

function shouldProcessToday(investment: Investment, today: Date): boolean {
  if (!investment.isActive) return false;

  const todayStr = formatDateISO(today);
  if (investment.startDate > todayStr) return false;

  const currentMonth = getCurrentYearMonth(today);
  if (investment.lastProcessedMonth === currentMonth) return false;

  const effectiveDay = clampDeductionDay(
    investment.deductionDay,
    today.getFullYear(),
    today.getMonth(),
  );

  return today.getDate() >= effectiveDay;
}

function isDeductionTomorrow(investment: Investment, today: Date): boolean {
  if (!investment.isActive) return false;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const effectiveDay = clampDeductionDay(
    investment.deductionDay,
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
  );

  return tomorrow.getDate() === effectiveDay;
}

export async function processInvestmentDeductions(): Promise<void> {
  const today = new Date();
  const investments = await databaseService.getActiveInvestments();

  for (const investment of investments) {
    if (!shouldProcessToday(investment, today)) continue;

    const accountName = await getAccountName(investment.accountId);
    const todayStr = formatDateISO(today);
    const currentMonth = getCurrentYearMonth(today);

    await databaseService.createTransaction({
      title: investment.name,
      amount: investment.amount,
      categoryId: null,
      accountId: investment.accountId,
      date: todayStr,
      type: 'expense',
      notes: `Automatic investment deduction (${currentMonth})`,
    });

    await databaseService.updateInvestmentLastProcessed(
      investment.id,
      currentMonth,
      todayStr,
    );

    await notifyInvestmentProcessed(
      investment.name,
      investment.amount,
      accountName,
      investment.id,
    );
  }

  await Promise.all([
    useAccountStore.getState().loadAccounts(),
    useTransactionStore.getState().loadTransactions(),
    useInvestmentStore.getState().loadInvestments(),
  ]);
}

export async function evaluateInvestmentNotifications(): Promise<void> {
  const today = new Date();
  const states = await readStates();
  const investments = await databaseService.getActiveInvestments();
  let changed = false;

  for (const investment of investments) {
    if (!isDeductionTomorrow(investment, today)) continue;

    const stateKey = `upcoming:${investment.id}:${getCurrentYearMonth(today)}`;
    if (states[stateKey]) continue;

    const accountName = await getAccountName(investment.accountId);
    await notifyInvestmentUpcoming(
      investment.name,
      investment.amount,
      accountName,
      investment.id,
    );
    await createInvestmentReview({
      investmentId: investment.id,
      name: investment.name,
      amount: investment.amount,
      accountName,
    }).catch(console.error);

    states[stateKey] = formatDateISO(today);
    changed = true;
  }

  if (changed) {
    await writeStates(states);
  }
}

export async function runInvestmentScheduler(): Promise<void> {
  await evaluateInvestmentNotifications();
  await processInvestmentDeductions();
}

export function formatInvestmentAmount(amount: number): string {
  return formatCurrency(amount);
}
