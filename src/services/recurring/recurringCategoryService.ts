import { databaseService } from '../../database';
import { Category } from '../../database/types';
import {
  RECURRING_EXPENSE_CATEGORY_COLORS,
  RECURRING_EXPENSE_CATEGORY_ICONS,
  RECURRING_EXPENSE_CATEGORY_LABELS,
  RECURRING_EXPENSE_CATEGORY_TYPES,
  RecurringExpenseCategoryType,
} from '../../constants/recurringOptions';

export type RecurringCategoryOption = {
  type: RecurringExpenseCategoryType;
  categoryId: string;
  name: string;
  icon: string;
  color: string;
};

let cachedOptions: RecurringCategoryOption[] | null = null;

export async function ensureRecurringExpenseCategories(): Promise<RecurringCategoryOption[]> {
  if (cachedOptions) {
    return cachedOptions;
  }

  const options: RecurringCategoryOption[] = [];

  for (const type of RECURRING_EXPENSE_CATEGORY_TYPES) {
    const name = RECURRING_EXPENSE_CATEGORY_LABELS[type];
    let category: Category | null = await databaseService.getCategoryByName(name, 'recurring');

    if (!category) {
      category = await databaseService.createCategory({
        name,
        icon: RECURRING_EXPENSE_CATEGORY_ICONS[type],
        color: RECURRING_EXPENSE_CATEGORY_COLORS[type],
        budget: 0,
        scope: 'recurring',
      });
    }

    options.push({
      type,
      categoryId: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
  }

  cachedOptions = options;
  return options;
}

export function clearRecurringCategoryCache(): void {
  cachedOptions = null;
}

export function findCategoryTypeById(
  options: RecurringCategoryOption[],
  categoryId: string,
): RecurringExpenseCategoryType | null {
  return options.find((option) => option.categoryId === categoryId)?.type ?? null;
}

export function findCategoryTypeByName(
  categoryName: string,
): RecurringExpenseCategoryType | null {
  const normalized = categoryName.trim().toLowerCase();
  const match = RECURRING_EXPENSE_CATEGORY_TYPES.find(
    (type) => RECURRING_EXPENSE_CATEGORY_LABELS[type].toLowerCase() === normalized,
  );
  return match ?? null;
}

export function getDefaultRecurringCategoryType(): RecurringExpenseCategoryType {
  return 'rent';
}
