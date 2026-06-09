export type CategoryFormSource = 'spending_limits' | 'create_expense' | 'edit_expense';

export type CategoryFormParams = {
  categoryId?: string;
  defaultAccountId?: string | null;
  source?: CategoryFormSource;
  /** @deprecated Use `source: 'create_expense' | 'edit_expense'` instead. */
  returnToTransactionForm?: boolean;
};

export function resolveCategoryFormSource(
  params: CategoryFormParams | undefined,
): CategoryFormSource {
  if (params?.source) {
    return params.source;
  }

  if (params?.returnToTransactionForm) {
    return params?.categoryId ? 'edit_expense' : 'create_expense';
  }

  return 'spending_limits';
}

export function isTransactionCategoryFormSource(source: CategoryFormSource): boolean {
  return source === 'create_expense' || source === 'edit_expense';
}
