import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from '../../database';
import { RecurringExpense } from '../../database/types';
import { useAccountStore } from '../../store/useAccountStore';
import { useRecurringExpenseStore } from '../../store/useRecurringExpenseStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { formatCurrency } from '../../utils/currency';
import { formatDateISO } from '../../utils/investmentHelpers';
import {
  getCycleKey,
  isDueTomorrow,
  shouldProcessToday,
} from '../../utils/recurringHelpers';
import {
  notifyRecurringExpenseProcessed,
  notifyRecurringExpenseUpcoming,
} from '../notifications/notificationService';
import { createRecurringExpenseReview } from '../reviews/reviewService';

const STORAGE_KEY = '@expense_tracker/recurring_notify_state';

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

export async function processRecurringExpenses(): Promise<void> {
  const today = new Date();
  const expenses = await databaseService.getActiveRecurringExpenses();

  for (const expense of expenses) {
    if (!shouldProcessToday(expense, today)) continue;

    const todayStr = formatDateISO(today);
    const cycleKey = getCycleKey(expense, today);

    await databaseService.createTransaction({
      title: expense.name,
      amount: expense.amount,
      categoryId: expense.categoryId,
      accountId: expense.accountId,
      date: todayStr,
      type: 'expense',
      notes: expense.notes
        ? `Automatic recurring expense (${cycleKey}). ${expense.notes}`
        : `Automatic recurring expense (${cycleKey})`,
    });

    await databaseService.updateRecurringExpenseLastProcessed(
      expense.id,
      cycleKey,
      todayStr,
    );

    await notifyRecurringExpenseProcessed(expense.name, expense.amount, expense.id);
  }

  await Promise.all([
    useAccountStore.getState().loadAccounts(),
    useTransactionStore.getState().loadTransactions(),
    useRecurringExpenseStore.getState().loadRecurringExpenses(),
  ]);
}

export async function evaluateRecurringNotifications(): Promise<void> {
  const today = new Date();
  const states = await readStates();
  const expenses = await databaseService.getActiveRecurringExpenses();
  let changed = false;

  for (const expense of expenses) {
    if (!isDueTomorrow(expense, today)) continue;

    const cycleKey = getCycleKey(expense, today);
    const stateKey = `upcoming:${expense.id}:${cycleKey}`;
    if (states[stateKey]) continue;

    await notifyRecurringExpenseUpcoming(expense.name, expense.amount, expense.id);
    await createRecurringExpenseReview({
      recurringExpenseId: expense.id,
      name: expense.name,
      amount: expense.amount,
    }).catch(console.error);

    states[stateKey] = formatDateISO(today);
    changed = true;
  }

  if (changed) {
    await writeStates(states);
  }
}

export async function runRecurringScheduler(): Promise<void> {
  await evaluateRecurringNotifications();
  await processRecurringExpenses();
}

export function formatRecurringAmount(amount: number): string {
  return formatCurrency(amount);
}

export function isRecurringExpenseActive(expense: RecurringExpense): boolean {
  return expense.isActive;
}
