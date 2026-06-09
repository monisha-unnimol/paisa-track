#!/usr/bin/env bash
set -euo pipefail

DB="$(mktemp /tmp/paisatrack-categories-XXXXXX.db)"
trap 'rm -f "$DB"' EXIT

now="$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
cat_id="cat-test-1"
tx_id="tx-test-1"

pass=0
fail=0

assert_eq() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    echo "PASS: $label"
    pass=$((pass + 1))
  else
    echo "FAIL: $label (expected '$expected', got '$actual')"
    fail=$((fail + 1))
  fi
}

run_sql() {
  sqlite3 "$DB" "PRAGMA foreign_keys = ON; $1"
}

run_sql "
CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  budget REAL NOT NULL DEFAULT 0,
  account_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id TEXT,
  account_id TEXT,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE recurring_expenses (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  account_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  frequency TEXT NOT NULL,
  deduction_day INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
"

count_refs() {
  local id="$1"
  local tx
  local recurring
  tx="$(run_sql "SELECT COUNT(*) FROM transactions WHERE category_id='$id';")"
  recurring="$(run_sql "SELECT COUNT(*) FROM recurring_expenses WHERE category_id='$id';")"
  echo "$((tx + recurring))"
}

can_delete_category() {
  local id="$1"
  if [[ "$(count_refs "$id")" != "0" ]]; then
    return 1
  fi
  run_sql "DELETE FROM categories WHERE id='$id';" >/dev/null
}

echo "== Category create =="
run_sql "INSERT INTO categories (id, name, icon, color, budget, account_id, created_at, updated_at)
VALUES ('$cat_id', 'Groceries', '🛒', '#0D9488', 5000, NULL, '$now', '$now');"
assert_eq "category row inserted" "1" "$(run_sql "SELECT COUNT(*) FROM categories WHERE id='$cat_id';")"

echo "== Category update =="
run_sql "UPDATE categories SET name='Food', budget=6000, updated_at='$now' WHERE id='$cat_id';"
assert_eq "category name updated" "Food" "$(run_sql "SELECT name FROM categories WHERE id='$cat_id';")"
assert_eq "category budget updated" "6000" "$(run_sql "SELECT CAST(budget AS INTEGER) FROM categories WHERE id='$cat_id';")"
assert_eq "update did not duplicate row" "1" "$(run_sql "SELECT COUNT(*) FROM categories WHERE id='$cat_id';")"

echo "== Category delete blocked by transaction =="
run_sql "INSERT INTO transactions (id, title, amount, category_id, account_id, date, type, notes, created_at, updated_at)
VALUES ('$tx_id', 'Milk', 120, '$cat_id', NULL, '2026-06-05', 'expense', NULL, '$now', '$now');"
set +e
can_delete_category "$cat_id"
blocked=$?
set -e
assert_eq "delete blocked with linked transaction" "1" "$blocked"
assert_eq "category still exists after blocked delete" "1" "$(run_sql "SELECT COUNT(*) FROM categories WHERE id='$cat_id';")"

echo "== Category delete after unlink =="
run_sql "DELETE FROM transactions WHERE id='$tx_id';"
can_delete_category "$cat_id"
assert_eq "category deleted after unlink" "0" "$(run_sql "SELECT COUNT(*) FROM categories WHERE id='$cat_id';")"

echo "== Category delete blocked by recurring expense =="
run_sql "INSERT INTO categories (id, name, icon, color, budget, account_id, created_at, updated_at)
VALUES ('cat-test-2', 'Rent', '🏠', '#EF4444', 15000, NULL, '$now', '$now');"
run_sql "INSERT INTO recurring_expenses (id, name, amount, account_id, category_id, frequency, deduction_day, start_date, end_date, is_active, status, created_at, updated_at)
VALUES ('rec-1', 'Rent', 15000, 'acct-1', 'cat-test-2', 'monthly', 1, '2026-06-01', NULL, 1, 'upcoming', '$now', '$now');"
set +e
can_delete_category "cat-test-2"
blocked_recurring=$?
set -e
assert_eq "delete blocked with linked recurring expense" "1" "$blocked_recurring"

echo
echo "Results: $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
