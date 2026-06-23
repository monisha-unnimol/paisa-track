import * as SQLite from 'expo-sqlite';
import { openDatabase } from './initDatabase';
import {
  AccountRow,
  CategoryRow,
  InvestmentRow,
  InvestmentTypeRow,
  InvestmentWithDetailsRow,
  mapAccountRow,
  mapCategoryRow,
  mapInvestmentRow,
  mapInvestmentTypeRow,
  mapRecurringExpenseRow,
  mapReviewRequestRow,
  mapTransactionRow,
  mapTransactionWithDetailsRow,
  TransactionRow,
  TransactionWithDetailsRow,
  RecurringExpenseRow,
  ReviewRequestRow,
  UserProfileRow,
  mapUserProfileRow,
} from './mappers';
import {
  Account,
  Category,
  CreateAccountInput,
  CreateCategoryInput,
  CreateInvestmentInput,
  CreateInvestmentTypeInput,
  CreateRecurringExpenseInput,
  CreateReviewRequestInput,
  CreateTransactionInput,
  Investment,
  InvestmentTypeDefinition,
  RecurringExpense,
  ReviewRequest,
  ReviewRequestStatus,
  Transaction,
  TransactionType,
  TransactionWithDetails,
  UpdateAccountInput,
  UpdateCategoryInput,
  UpdateInvestmentInput,
  UpdateRecurringExpenseInput,
  UpdateTransactionInput,
  UpsertUserProfileInput,
  UserProfile,
} from './types';
import {
  CategoryDeleteBlockedError,
  CategoryDuplicateNameError,
  CategoryNotFoundError,
  CategorySaveError,
  InvestmentTypeDuplicateNameError,
  InvestmentTypeSaveError,
  InvestmentTypeDeleteBlockedError,
  InvestmentTypeNotFoundError,
} from './errors';
import { slugifyName } from '../utils/slugify';
import {
  INVESTMENT_TYPE_COLORS,
  INVESTMENT_TYPE_ICONS,
  INVESTMENT_TYPE_LABELS,
} from '../constants/investmentOptions';

export {
  CategoryDeleteBlockedError,
  CategoryDuplicateNameError,
  CategoryNotFoundError,
  CategorySaveError,
  InvestmentTypeDuplicateNameError,
  InvestmentTypeSaveError,
  InvestmentTypeDeleteBlockedError,
  InvestmentTypeNotFoundError,
} from './errors';

const DEFAULT_PROFILE_ID = 'default';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    if (!this.initPromise) {
      this.initPromise = openDatabase().then((db) => {
        this.db = db;
      });
    }

    await this.initPromise;
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  // ─── Accounts ───────────────────────────────────────────────────────────────

  async createAccount(input: CreateAccountInput): Promise<Account> {
    const db = await this.getDb();
    const timestamp = nowIso();
    const account: Account = {
      id: createId(),
      name: input.name,
      type: input.type,
      balance: input.balance ?? 0,
      icon: input.icon ?? '💰',
      color: input.color ?? '#0D9488',
      currency: input.currency ?? 'INR',
      isDefault: input.isDefault ?? false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (account.isDefault) {
      await db.runAsync('UPDATE accounts SET is_default = 0, updated_at = ?', timestamp);
    }

    await db.runAsync(
      `INSERT INTO accounts (id, name, type, balance, icon, color, currency, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      account.id,
      account.name,
      account.type,
      account.balance,
      account.icon,
      account.color,
      account.currency,
      account.isDefault ? 1 : 0,
      account.createdAt,
      account.updatedAt,
    );

    return account;
  }

  async getAccountById(id: string): Promise<Account | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<AccountRow>(
      'SELECT * FROM accounts WHERE id = ?',
      id,
    );
    return row ? mapAccountRow(row) : null;
  }

  async getAllAccounts(): Promise<Account[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<AccountRow>(
      'SELECT * FROM accounts ORDER BY is_default DESC, name ASC',
    );
    return rows.map(mapAccountRow);
  }

  async updateAccount(id: string, input: UpdateAccountInput): Promise<Account | null> {
    const existing = await this.getAccountById(id);
    if (!existing) return null;

    const db = await this.getDb();
    const updatedAt = nowIso();
    const updated: Account = {
      ...existing,
      ...input,
      updatedAt,
    };

    if (updated.isDefault) {
      await db.runAsync('UPDATE accounts SET is_default = 0, updated_at = ?', updatedAt);
    }

    await db.runAsync(
      `UPDATE accounts
       SET name = ?, type = ?, balance = ?, icon = ?, color = ?, currency = ?,
           is_default = ?, updated_at = ?
       WHERE id = ?`,
      updated.name,
      updated.type,
      updated.balance,
      updated.icon,
      updated.color,
      updated.currency,
      updated.isDefault ? 1 : 0,
      updated.updatedAt,
      id,
    );

    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.runAsync('DELETE FROM accounts WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  async ensureDefaultAccount(): Promise<void> {
    const accounts = await this.getAllAccounts();
    if (accounts.length === 0 || accounts.some((account) => account.isDefault)) {
      return;
    }

    const oldest = [...accounts].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    )[0];

    await this.updateAccount(oldest.id, { isDefault: true });
  }

  // ─── Categories ─────────────────────────────────────────────────────────────

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const scope = input.scope ?? 'spending';
    const existing = await this.getCategoryByName(input.name, scope);
    if (existing) {
      throw new CategoryDuplicateNameError();
    }

    const db = await this.getDb();
    const timestamp = nowIso();
    const category: Category = {
      id: createId(),
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      budget: input.budget ?? 0,
      accountId: input.accountId ?? null,
      scope,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, budget, account_id, scope, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        category.id,
        category.name,
        category.icon,
        category.color,
        category.budget,
        category.accountId,
        category.scope,
        category.createdAt,
        category.updatedAt,
      );
    } catch (error) {
      throw new CategorySaveError(error);
    }

    return category;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM categories WHERE id = ?',
      id,
    );
    return row ? mapCategoryRow(row) : null;
  }

  async getAllCategories(): Promise<Category[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories ORDER BY name ASC',
    );
    return rows.map(mapCategoryRow);
  }

  async searchCategories(
    query: string,
    accountId?: string | null,
    scope: 'spending' | 'recurring' = 'spending',
  ): Promise<Category[]> {
    const db = await this.getDb();
    const trimmed = query.trim();

    let sql = 'SELECT * FROM categories WHERE scope = ?';
    const params: (string | null)[] = [scope];

    if (trimmed) {
      sql += ' AND name LIKE ?';
      params.push(`%${trimmed}%`);
    }

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY name ASC';

    const rows = await db.getAllAsync<CategoryRow>(sql, ...params);
    return rows.map(mapCategoryRow);
  }

  async getMonthlySpentForCategory(
    categoryId: string,
    year: number,
    month: number,
  ): Promise<number> {
    const db = await this.getDb();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const row = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE category_id = ? AND type = 'expense' AND date LIKE ?`,
      categoryId,
      `${monthPrefix}%`,
    );
    return row?.total ?? 0;
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new CategoryNotFoundError();
    }

    if (input.name) {
      const duplicate = await this.getCategoryByName(input.name, existing.scope);
      if (duplicate && duplicate.id !== id) {
        throw new CategoryDuplicateNameError();
      }
    }

    const db = await this.getDb();
    const updated: Category = {
      ...existing,
      ...input,
      name: input.name?.trim() ?? existing.name,
      updatedAt: nowIso(),
    };

    try {
      await db.runAsync(
        `UPDATE categories
         SET name = ?, icon = ?, color = ?, budget = ?, account_id = ?, updated_at = ?
         WHERE id = ?`,
        updated.name,
        updated.icon,
        updated.color,
        updated.budget,
        updated.accountId,
        updated.updatedAt,
        id,
      );
    } catch (error) {
      throw new CategorySaveError(error);
    }

    return updated;
  }

  async getCategoryReferenceCounts(
    categoryId: string,
  ): Promise<{ transactions: number; recurringExpenses: number; reviewReferences: number }> {
    const db = await this.getDb();
    const transactionRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?',
      categoryId,
    );

    let recurringExpenses = 0;
    try {
      const recurringRow = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM recurring_expenses WHERE category_id = ?',
        categoryId,
      );
      recurringExpenses = recurringRow?.count ?? 0;
    } catch {
      recurringExpenses = 0;
    }

    const pendingReviews = await db.getAllAsync<{ review_data: string }>(
      "SELECT review_data FROM review_requests WHERE status = 'pending'",
    );
    let reviewReferences = 0;
    for (const review of pendingReviews) {
      try {
        const data = JSON.parse(review.review_data) as { categoryId?: string };
        if (data.categoryId === categoryId) {
          reviewReferences += 1;
        }
      } catch {
        // Ignore malformed review payloads.
      }
    }

    return {
      transactions: transactionRow?.count ?? 0,
      recurringExpenses,
      reviewReferences,
    };
  }

  async deleteCategory(id: string): Promise<boolean> {
    const refs = await this.getCategoryReferenceCounts(id);
    if (refs.transactions > 0 || refs.recurringExpenses > 0 || refs.reviewReferences > 0) {
      throw new CategoryDeleteBlockedError();
    }

    const db = await this.getDb();
    const result = await db.runAsync('DELETE FROM categories WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  // ─── Transactions ───────────────────────────────────────────────────────────

  private getBalanceDelta(type: TransactionType, amount: number): number {
    if (type === 'income') return amount;
    return -amount;
  }

  private async adjustAccountBalance(
    db: SQLite.SQLiteDatabase,
    accountId: string,
    delta: number,
  ): Promise<void> {
    const timestamp = nowIso();
    await db.runAsync(
      'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
      delta,
      timestamp,
      accountId,
    );
  }

  private transactionDetailsQuery = `
    SELECT
      t.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      a.name AS account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
  `;

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const db = await this.getDb();
    const timestamp = nowIso();
    const transaction: Transaction = {
      id: createId(),
      title: input.title,
      amount: input.amount,
      categoryId: input.categoryId ?? null,
      accountId: input.accountId,
      date: input.date,
      type: input.type,
      notes: input.notes ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO transactions
           (id, title, amount, category_id, account_id, date, type, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction.id,
        transaction.title,
        transaction.amount,
        transaction.categoryId,
        transaction.accountId,
        transaction.date,
        transaction.type,
        transaction.notes,
        transaction.createdAt,
        transaction.updatedAt,
      );

      const delta = this.getBalanceDelta(transaction.type, transaction.amount);
      await this.adjustAccountBalance(db, transaction.accountId, delta);
    });

    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<TransactionRow>(
      'SELECT * FROM transactions WHERE id = ?',
      id,
    );
    return row ? mapTransactionRow(row) : null;
  }

  async getTransactionWithDetailsById(
    id: string,
  ): Promise<TransactionWithDetails | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<TransactionWithDetailsRow>(
      `${this.transactionDetailsQuery} WHERE t.id = ?`,
      id,
    );
    return row ? mapTransactionWithDetailsRow(row) : null;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<TransactionRow>(
      'SELECT * FROM transactions ORDER BY date DESC, created_at DESC',
    );
    return rows.map(mapTransactionRow);
  }

  async getAllTransactionsWithDetails(): Promise<TransactionWithDetails[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<TransactionWithDetailsRow>(
      `${this.transactionDetailsQuery} ORDER BY t.date DESC, t.created_at DESC`,
    );
    return rows.map(mapTransactionWithDetailsRow);
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<TransactionRow>(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC, created_at DESC',
      accountId,
    );
    return rows.map(mapTransactionRow);
  }

  async getTransactionsByCategoryId(categoryId: string): Promise<Transaction[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<TransactionRow>(
      'SELECT * FROM transactions WHERE category_id = ? ORDER BY date DESC, created_at DESC',
      categoryId,
    );
    return rows.map(mapTransactionRow);
  }

  async updateTransaction(
    id: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction | null> {
    const existing = await this.getTransactionById(id);
    if (!existing) return null;

    const updated: Transaction = {
      ...existing,
      ...input,
      updatedAt: nowIso(),
    };

    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      const oldDelta = this.getBalanceDelta(existing.type, existing.amount);
      await this.adjustAccountBalance(db, existing.accountId, -oldDelta);

      await db.runAsync(
        `UPDATE transactions
         SET title = ?, amount = ?, category_id = ?, account_id = ?, date = ?,
             type = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
        updated.title,
        updated.amount,
        updated.categoryId,
        updated.accountId,
        updated.date,
        updated.type,
        updated.notes,
        updated.updatedAt,
        id,
      );

      const newDelta = this.getBalanceDelta(updated.type, updated.amount);
      await this.adjustAccountBalance(db, updated.accountId, newDelta);
    });

    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const existing = await this.getTransactionById(id);
    if (!existing) return false;

    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      const reverseDelta = this.getBalanceDelta(existing.type, existing.amount);
      await this.adjustAccountBalance(db, existing.accountId, -reverseDelta);

      await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
    });

    return true;
  }

  // ─── Investment Types ─────────────────────────────────────────────────────

  async getInvestmentTypes(): Promise<InvestmentTypeDefinition[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<InvestmentTypeRow>(
      'SELECT * FROM investment_types ORDER BY is_builtin DESC, name ASC',
    );
    return rows.map(mapInvestmentTypeRow);
  }

  async getInvestmentTypeByName(name: string): Promise<InvestmentTypeDefinition | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<InvestmentTypeRow>(
      'SELECT * FROM investment_types WHERE name = ? COLLATE NOCASE',
      name.trim(),
    );
    return row ? mapInvestmentTypeRow(row) : null;
  }

  async createInvestmentType(input: CreateInvestmentTypeInput): Promise<InvestmentTypeDefinition> {
    const trimmedName = input.name.trim();
    const existing = await this.getInvestmentTypeByName(trimmedName);
    if (existing) {
      throw new InvestmentTypeDuplicateNameError();
    }

    const normalized = trimmedName.toLowerCase();
    const builtinDuplicate = Object.values(INVESTMENT_TYPE_LABELS).some(
      (label) => label.toLowerCase() === normalized,
    );
    if (builtinDuplicate) {
      throw new InvestmentTypeDuplicateNameError();
    }

    let slug = slugifyName(trimmedName);
    const db = await this.getDb();
    let suffix = 1;
    while (await db.getFirstAsync('SELECT id FROM investment_types WHERE slug = ?', slug)) {
      slug = `${slugifyName(trimmedName)}_${suffix}`;
      suffix += 1;
    }

    const timestamp = nowIso();
    const definition: InvestmentTypeDefinition = {
      id: createId(),
      slug,
      name: trimmedName,
      icon: input.icon ?? INVESTMENT_TYPE_ICONS.custom,
      color: input.color ?? INVESTMENT_TYPE_COLORS.custom,
      isBuiltin: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      await db.runAsync(
        `INSERT INTO investment_types (id, slug, name, icon, color, is_builtin, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        definition.id,
        definition.slug,
        definition.name,
        definition.icon,
        definition.color,
        definition.createdAt,
        definition.updatedAt,
      );
    } catch (error) {
      throw new InvestmentTypeSaveError(error);
    }

    return definition;
  }

  async getInvestmentTypeById(id: string): Promise<InvestmentTypeDefinition | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<InvestmentTypeRow>(
      'SELECT * FROM investment_types WHERE id = ?',
      id,
    );
    return row ? mapInvestmentTypeRow(row) : null;
  }

  async getInvestmentTypeUsageCount(slug: string): Promise<number> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM investments WHERE type = ?',
      slug,
    );
    return row?.count ?? 0;
  }

  async deleteInvestmentType(id: string): Promise<boolean> {
    const definition = await this.getInvestmentTypeById(id);
    if (!definition) {
      throw new InvestmentTypeNotFoundError();
    }

    const usageCount = await this.getInvestmentTypeUsageCount(definition.slug);
    if (usageCount > 0) {
      throw new InvestmentTypeDeleteBlockedError();
    }

    const db = await this.getDb();
    const result = await db.runAsync('DELETE FROM investment_types WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  // ─── Investments ──────────────────────────────────────────────────────────

  async createInvestment(input: CreateInvestmentInput): Promise<Investment> {
    const db = await this.getDb();
    const timestamp = nowIso();
    const investment: Investment = {
      id: createId(),
      name: input.name,
      type: input.type,
      amount: input.amount,
      accountId: input.accountId,
      deductionDay: input.deductionDay,
      startDate: input.startDate,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
      lastProcessedMonth: null,
      lastProcessedDate: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.runAsync(
      `INSERT INTO investments (
        id, name, type, amount, account_id, deduction_day, start_date,
        notes, is_active, last_processed_month, last_processed_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      investment.id,
      investment.name,
      investment.type,
      investment.amount,
      investment.accountId,
      investment.deductionDay,
      investment.startDate,
      investment.notes,
      investment.isActive ? 1 : 0,
      investment.lastProcessedMonth,
      investment.lastProcessedDate,
      investment.createdAt,
      investment.updatedAt,
    );

    return investment;
  }

  async getInvestmentById(id: string): Promise<Investment | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<InvestmentRow>(
      'SELECT * FROM investments WHERE id = ?',
      id,
    );
    return row ? mapInvestmentRow(row) : null;
  }

  async getAllInvestments(): Promise<Investment[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<InvestmentRow>(
      'SELECT * FROM investments ORDER BY name ASC',
    );
    return rows.map(mapInvestmentRow);
  }

  async getActiveInvestments(): Promise<Investment[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<InvestmentRow>(
      'SELECT * FROM investments WHERE is_active = 1 ORDER BY deduction_day ASC',
    );
    return rows.map(mapInvestmentRow);
  }

  async searchInvestments(
    query: string,
    accountId?: string | null,
  ): Promise<Investment[]> {
    const db = await this.getDb();
    const trimmed = query.trim();
    let sql = 'SELECT * FROM investments WHERE 1=1';
    const params: (string | number)[] = [];

    if (trimmed) {
      sql += ' AND name LIKE ?';
      params.push(`%${trimmed}%`);
    }

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY name ASC';
    const rows = await db.getAllAsync<InvestmentRow>(sql, ...params);
    return rows.map(mapInvestmentRow);
  }

  async updateInvestment(
    id: string,
    input: UpdateInvestmentInput,
  ): Promise<Investment | null> {
    const existing = await this.getInvestmentById(id);
    if (!existing) return null;

    const db = await this.getDb();
    const updated: Investment = {
      ...existing,
      ...input,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: nowIso(),
    };

    await db.runAsync(
      `UPDATE investments SET
        name = ?, type = ?, amount = ?, account_id = ?, deduction_day = ?,
        start_date = ?, notes = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
      updated.name,
      updated.type,
      updated.amount,
      updated.accountId,
      updated.deductionDay,
      updated.startDate,
      updated.notes,
      updated.isActive ? 1 : 0,
      updated.updatedAt,
      id,
    );

    return updated;
  }

  async updateInvestmentLastProcessed(
    id: string,
    month: string,
    date: string,
  ): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE investments SET
        last_processed_month = ?, last_processed_date = ?, updated_at = ?
       WHERE id = ?`,
      month,
      date,
      nowIso(),
      id,
    );
  }

  async deleteInvestment(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.runAsync('DELETE FROM investments WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  async createRecurringExpense(input: CreateRecurringExpenseInput): Promise<RecurringExpense> {
    const db = await this.getDb();
    const now = nowIso();
    const expense: RecurringExpense = {
      id: createId(),
      name: input.name,
      amount: input.amount,
      accountId: input.accountId,
      categoryId: input.categoryId,
      frequency: input.frequency,
      deductionDay: input.deductionDay,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
      lastProcessedCycle: null,
      lastProcessedDate: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO recurring_expenses (
        id, name, amount, account_id, category_id, frequency, deduction_day,
        start_date, end_date, notes, is_active, last_processed_cycle,
        last_processed_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      expense.id,
      expense.name,
      expense.amount,
      expense.accountId,
      expense.categoryId,
      expense.frequency,
      expense.deductionDay,
      expense.startDate,
      expense.endDate,
      expense.notes,
      expense.isActive ? 1 : 0,
      expense.lastProcessedCycle,
      expense.lastProcessedDate,
      expense.createdAt,
      expense.updatedAt,
    );

    return expense;
  }

  async getRecurringExpenseById(id: string): Promise<RecurringExpense | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<RecurringExpenseRow>(
      'SELECT * FROM recurring_expenses WHERE id = ?',
      id,
    );
    return row ? mapRecurringExpenseRow(row) : null;
  }

  async getAllRecurringExpenses(): Promise<RecurringExpense[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<RecurringExpenseRow>(
      'SELECT * FROM recurring_expenses ORDER BY name ASC',
    );
    return rows.map(mapRecurringExpenseRow);
  }

  async getActiveRecurringExpenses(): Promise<RecurringExpense[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<RecurringExpenseRow>(
      'SELECT * FROM recurring_expenses WHERE is_active = 1 ORDER BY deduction_day ASC',
    );
    return rows.map(mapRecurringExpenseRow);
  }

  async searchRecurringExpenses(
    query: string,
    accountId?: string | null,
    categoryId?: string | null,
  ): Promise<RecurringExpense[]> {
    const db = await this.getDb();
    const trimmed = query.trim();
    let sql = 'SELECT * FROM recurring_expenses WHERE 1=1';
    const params: (string | number)[] = [];

    if (trimmed) {
      sql += ' AND name LIKE ?';
      params.push(`%${trimmed}%`);
    }

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY name ASC';
    const rows = await db.getAllAsync<RecurringExpenseRow>(sql, ...params);
    return rows.map(mapRecurringExpenseRow);
  }

  async updateRecurringExpense(
    id: string,
    input: UpdateRecurringExpenseInput,
  ): Promise<RecurringExpense | null> {
    const existing = await this.getRecurringExpenseById(id);
    if (!existing) return null;

    const db = await this.getDb();
    const updated: RecurringExpense = {
      ...existing,
      ...input,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: nowIso(),
    };

    await db.runAsync(
      `UPDATE recurring_expenses SET
        name = ?, amount = ?, account_id = ?, category_id = ?, frequency = ?,
        deduction_day = ?, start_date = ?, end_date = ?, notes = ?, is_active = ?,
        updated_at = ?
       WHERE id = ?`,
      updated.name,
      updated.amount,
      updated.accountId,
      updated.categoryId,
      updated.frequency,
      updated.deductionDay,
      updated.startDate,
      updated.endDate,
      updated.notes,
      updated.isActive ? 1 : 0,
      updated.updatedAt,
      id,
    );

    return updated;
  }

  async updateRecurringExpenseLastProcessed(
    id: string,
    cycle: string,
    date: string,
  ): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE recurring_expenses SET
        last_processed_cycle = ?, last_processed_date = ?, updated_at = ?
       WHERE id = ?`,
      cycle,
      date,
      nowIso(),
      id,
    );
  }

  async deleteRecurringExpense(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.runAsync('DELETE FROM recurring_expenses WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  async getCategoryByName(
    name: string,
    scope?: 'spending' | 'recurring',
  ): Promise<Category | null> {
    const db = await this.getDb();
    let sql = 'SELECT * FROM categories WHERE name = ? COLLATE NOCASE';
    const params: string[] = [name.trim()];

    if (scope) {
      sql += ' AND scope = ?';
      params.push(scope);
    }

    const row = await db.getFirstAsync<CategoryRow>(sql, ...params);
    return row ? mapCategoryRow(row) : null;
  }

  async getCategoriesByScope(scope: 'spending' | 'recurring'): Promise<Category[]> {
    return this.searchCategories('', null, scope);
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<UserProfileRow>(
      'SELECT * FROM user_profile ORDER BY updated_at DESC LIMIT 1',
    );
    return row ? mapUserProfileRow(row) : null;
  }

  async upsertUserProfile(input: UpsertUserProfileInput): Promise<UserProfile> {
    const db = await this.getDb();
    const existing = await this.getUserProfile();
    const now = nowIso();

    if (existing) {
      const updated: UserProfile = {
        ...existing,
        name: input.name,
        avatar: input.avatar !== undefined ? input.avatar : existing.avatar,
        updatedAt: now,
      };

      await db.runAsync(
        `UPDATE user_profile SET name = ?, avatar = ?, updated_at = ? WHERE id = ?`,
        updated.name,
        updated.avatar,
        updated.updatedAt,
        existing.id,
      );

      return updated;
    }

    const profile: UserProfile = {
      id: DEFAULT_PROFILE_ID,
      name: input.name,
      avatar: input.avatar ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO user_profile (id, name, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      profile.id,
      profile.name,
      profile.avatar,
      profile.createdAt,
      profile.updatedAt,
    );

    return profile;
  }

  async createReviewRequest(input: CreateReviewRequestInput): Promise<ReviewRequest> {
    const db = await this.getDb();
    const timestamp = nowIso();
    const review: ReviewRequest = {
      id: createId(),
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'pending',
      reviewData: JSON.stringify(input.reviewData),
      source: input.source ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.runAsync(
      `INSERT INTO review_requests
       (id, title, description, type, status, review_data, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      review.id,
      review.title,
      review.description,
      review.type,
      review.status,
      review.reviewData,
      review.source,
      review.createdAt,
      review.updatedAt,
    );

    return review;
  }

  async getReviewRequests(status?: ReviewRequestStatus): Promise<ReviewRequest[]> {
    const db = await this.getDb();
    const rows = status
      ? await db.getAllAsync<ReviewRequestRow>(
          'SELECT * FROM review_requests WHERE status = ? ORDER BY created_at DESC',
          status,
        )
      : await db.getAllAsync<ReviewRequestRow>(
          'SELECT * FROM review_requests ORDER BY created_at DESC',
        );
    return rows.map(mapReviewRequestRow);
  }

  async getPendingReviewCount(): Promise<number> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM review_requests WHERE status = 'pending'",
    );
    return row?.count ?? 0;
  }

  async getReviewRequestById(id: string): Promise<ReviewRequest | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<ReviewRequestRow>(
      'SELECT * FROM review_requests WHERE id = ?',
      id,
    );
    return row ? mapReviewRequestRow(row) : null;
  }

  async updateReviewRequestStatus(
    id: string,
    status: ReviewRequestStatus,
  ): Promise<ReviewRequest | null> {
    const db = await this.getDb();
    const timestamp = nowIso();
    await db.runAsync(
      'UPDATE review_requests SET status = ?, updated_at = ? WHERE id = ?',
      status,
      timestamp,
      id,
    );
    return this.getReviewRequestById(id);
  }

  async findPendingReviewByDraftId(draftId: string): Promise<ReviewRequest | null> {
    const pending = await this.getReviewRequests('pending');
    return (
      pending.find((item) => {
        try {
          const data = JSON.parse(item.reviewData) as { draftId?: string };
          return data.draftId === draftId;
        } catch {
          return false;
        }
      }) ?? null
    );
  }

  async findPendingReviewBySmsKey(smsKey: string): Promise<ReviewRequest | null> {
    const pending = await this.getReviewRequests('pending');
    return (
      pending.find((item) => {
        try {
          const data = JSON.parse(item.reviewData) as { smsKey?: string };
          return data.smsKey === smsKey;
        } catch {
          return false;
        }
      }) ?? null
    );
  }
}

export const databaseService = new DatabaseService();
