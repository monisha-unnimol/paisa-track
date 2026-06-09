import * as SQLite from 'expo-sqlite';

const BASE_SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'credit', 'wallet')),
    balance REAL NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT '💰',
    color TEXT NOT NULL DEFAULT '#0D9488',
    currency TEXT NOT NULL DEFAULT 'INR',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    budget REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id TEXT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );
`;

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
  'CREATE INDEX IF NOT EXISTS idx_categories_account_id ON categories(account_id)',
  'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)',
];

async function getColumnNames(
  db: SQLite.SQLiteDatabase,
  table: string,
): Promise<string[]> {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  return columns.map((column) => column.name);
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const columns = await getColumnNames(db, table);
  if (columns.length === 0 || columns.includes(column)) {
    return;
  }

  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function isCategoryIdRequired(db: SQLite.SQLiteDatabase): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string; notnull: number }>(
    'PRAGMA table_info(transactions)',
  );
  const categoryColumn = columns.find((column) => column.name === 'category_id');
  return categoryColumn?.notnull === 1;
}

async function migrateNullableCategoryId(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await getColumnNames(db, 'transactions');
  if (columns.length === 0 || !(await isCategoryIdRequired(db))) {
    return;
  }

  await db.execAsync(`
    CREATE TABLE transactions_new (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id TEXT,
      account_id TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
      updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
    );

    INSERT INTO transactions_new (
      id, title, amount, category_id, account_id, date, type, notes, created_at, updated_at
    )
    SELECT
      id, title, amount, category_id, account_id, date, type, notes, created_at, updated_at
    FROM transactions;

    DROP TABLE transactions;
    ALTER TABLE transactions_new RENAME TO transactions;
  `);
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureColumn(db, 'categories', 'account_id', 'TEXT');
  await ensureColumn(
    db,
    'categories',
    'created_at',
    "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'",
  );
  await ensureColumn(
    db,
    'categories',
    'updated_at',
    "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'",
  );

  await ensureColumn(db, 'transactions', 'account_id', 'TEXT');
  await ensureColumn(db, 'transactions', 'notes', 'TEXT');
  await ensureColumn(
    db,
    'transactions',
    'created_at',
    "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'",
  );
  await ensureColumn(
    db,
    'transactions',
    'updated_at',
    "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'",
  );

  await migrateNullableCategoryId(db);
  await createInvestmentsTable(db);
  await createRecurringExpensesTable(db);
  await createUserProfileTable(db);
  await createReviewRequestsTable(db);
  await migrateCategoryScope(db);
}

async function createReviewRequestsTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS review_requests (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      review_data TEXT NOT NULL,
      source TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_review_requests_status ON review_requests(status)',
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_review_requests_created_at ON review_requests(created_at DESC)',
  );
}

async function migrateCategoryScope(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureColumn(db, 'categories', 'scope', "TEXT NOT NULL DEFAULT 'spending'");

  const recurringNames = [
    'Rent',
    'EMI',
    'Insurance',
    'Electricity',
    'Internet',
    'Water Bill',
    'Maintenance',
    'OTT Subscriptions',
    'Gym Membership',
    'School Fees',
    'Custom Expenses',
    'Investment',
  ];

  for (const name of recurringNames) {
    await db.runAsync(
      "UPDATE categories SET scope = 'recurring' WHERE name = ? COLLATE NOCASE",
      name,
    );
  }
}

async function createUserProfileTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

async function createInvestmentsTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN (
        'sip', 'mutual_fund', 'stocks', 'ppf', 'epf', 'nps',
        'fixed_deposit', 'recurring_deposit', 'gold', 'crypto', 'custom'
      )),
      amount REAL NOT NULL,
      account_id TEXT NOT NULL,
      deduction_day INTEGER NOT NULL CHECK(deduction_day >= 1 AND deduction_day <= 31),
      start_date TEXT NOT NULL,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_processed_month TEXT,
      last_processed_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
    );
  `);

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_investments_account_id ON investments(account_id)',
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_investments_is_active ON investments(is_active)',
  );
}

async function createRecurringExpensesTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN (
        'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'
      )),
      deduction_day INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_processed_cycle TEXT,
      last_processed_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_recurring_expenses_account_id ON recurring_expenses(account_id)',
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_recurring_expenses_category_id ON recurring_expenses(category_id)',
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON recurring_expenses(is_active)',
  );
}

async function createIndexes(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const statement of INDEXES) {
    await db.execAsync(statement);
  }
}

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('expense-tracker.db');
  await db.execAsync(BASE_SCHEMA);
  await runMigrations(db);
  await createIndexes(db);
  return db;
}
