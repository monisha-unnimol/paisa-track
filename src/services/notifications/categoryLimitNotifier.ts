import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from '../../database';
import {
  notifyCategoryLimitExceeded,
  notifyCategoryLimitReached,
} from './notificationService';

const STORAGE_KEY = '@expense_tracker/category_limit_notify_state';

type LimitNotifyState = 'none' | 'reached' | 'exceeded';

type StoredStates = Record<string, LimitNotifyState>;

function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function stateKey(categoryId: string, year: number, month: number): string {
  return `${categoryId}:${year}-${String(month).padStart(2, '0')}`;
}

async function readStates(): Promise<StoredStates> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredStates;
  } catch {
    return {};
  }
}

async function writeStates(states: StoredStates): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

async function getCategoryState(
  categoryId: string,
  year: number,
  month: number,
): Promise<LimitNotifyState> {
  const states = await readStates();
  return states[stateKey(categoryId, year, month)] ?? 'none';
}

async function setCategoryState(
  categoryId: string,
  year: number,
  month: number,
  state: LimitNotifyState,
): Promise<void> {
  const states = await readStates();
  states[stateKey(categoryId, year, month)] = state;
  await writeStates(states);
}

async function evaluateCategoryLimit(categoryId: string): Promise<void> {
  const { year, month } = getCurrentYearMonth();
  const category = await databaseService.getCategoryById(categoryId);

  if (!category || category.budget <= 0) {
    return;
  }

  const spent = await databaseService.getMonthlySpentForCategory(
    categoryId,
    year,
    month,
  );
  let state = await getCategoryState(categoryId, year, month);

  if (spent < category.budget) {
    if (state !== 'none') {
      await setCategoryState(categoryId, year, month, 'none');
    }
    return;
  }

  if (state === 'none' && spent >= category.budget) {
    await notifyCategoryLimitReached(
      category.name,
      spent,
      category.budget,
      category.id,
    );
    state = spent > category.budget ? 'exceeded' : 'reached';
    await setCategoryState(categoryId, year, month, state);
  }

  if (spent > category.budget && state !== 'exceeded') {
    await notifyCategoryLimitExceeded(
      category.name,
      spent,
      category.budget,
      category.id,
    );
    await setCategoryState(categoryId, year, month, 'exceeded');
  }
}

export async function evaluateCategoryLimits(
  categoryIds: Iterable<string>,
): Promise<void> {
  const uniqueIds = [...new Set(categoryIds)];
  await Promise.all(uniqueIds.map((categoryId) => evaluateCategoryLimit(categoryId)));
}
