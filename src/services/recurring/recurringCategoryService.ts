import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../constants/categoryOptions';
import { databaseService } from '../../database';
import { Category } from '../../database/types';

let cachedRecurringCategories: Category[] | null = null;

export async function loadRecurringCategories(): Promise<Category[]> {
  if (cachedRecurringCategories) {
    return cachedRecurringCategories;
  }

  const categories = await databaseService.getCategoriesByScope('recurring');
  cachedRecurringCategories = categories;
  return categories;
}

export async function createRecurringExpenseCategory(input: {
  name: string;
}): Promise<Category> {
  const iconIndex = Math.abs(input.name.trim().length) % CATEGORY_ICONS.length;
  const colorIndex = Math.abs(input.name.trim().length) % CATEGORY_COLORS.length;

  const category = await databaseService.createCategory({
    name: input.name.trim(),
    icon: CATEGORY_ICONS[iconIndex],
    color: CATEGORY_COLORS[colorIndex],
    budget: 0,
    scope: 'recurring',
  });

  clearRecurringCategoryCache();
  return category;
}

export async function deleteRecurringExpenseCategory(id: string): Promise<boolean> {
  const deleted = await databaseService.deleteCategory(id);
  clearRecurringCategoryCache();
  return deleted;
}

export function clearRecurringCategoryCache(): void {
  cachedRecurringCategories = null;
}
