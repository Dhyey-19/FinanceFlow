import * as SQLite from 'expo-sqlite';

import { DEFAULT_CATEGORIES } from '../constants/categories';
import {
  AppUser,
  CategoryBudget,
  Category,
  FinanceState,
  PaymentReminder,
  SavingsGoal,
  ThemeMode,
  Transaction,
  CurrencyCode,
} from '../types';

const DB_NAME = 'financeflow.db';

/** Fixed seed so fresh installs (including APK builds) get the same demo transactions every time. */
function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

type AuthSession = {
  isAuthenticated: boolean;
  rememberMe: boolean;
  userName: string;
  userEmail: string;
};

type FinanceSnapshot = {
  users: AppUser[];
  categories: Category[];
  transactions: Transaction[];
  reminders: PaymentReminder[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  themeMode: ThemeMode;
  masterCurrency: CurrencyCode;
  auth: AuthSession;
};

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: Category['type'];
  custom: number;
};

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }
  return false;
}

function boolToInt(value: unknown) {
  return toBoolean(value) ? 1 : 0;
}

function intToBool(value: unknown) {
  return toBoolean(value);
}

export async function initDatabase() {
  const db = await getDb();

  // Create settings table first to check seed version
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  let shouldSeed = true;
  try {
    const seedCheck = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'seed_v4';");
    if (seedCheck && seedCheck.value === 'true') {
      shouldSeed = false;
    }
  } catch (e) {
    shouldSeed = true;
  }

  if (shouldSeed) {
    // Clear everything out to reset the database and apply new users
    await db.execAsync(`
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS reminders;
      DROP TABLE IF EXISTS budgets;
      DROP TABLE IF EXISTS savings_goals;
      DROP TABLE IF EXISTS auth_session;
    `);
  }

  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN upiId TEXT;`);
  } catch (e) {
    // Column might already exist
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      upiId TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL,
      custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      userEmail TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      categoryName TEXT NOT NULL,
      categoryColor TEXT NOT NULL,
      categoryIcon TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      ownerEmail TEXT NOT NULL,
      payeeEmail TEXT NOT NULL,
      payeeName TEXT NOT NULL,
      paymentName TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      reminderDate TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      userEmail TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      amount REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY NOT NULL,
      userEmail TEXT NOT NULL,
      title TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      isAuthenticated INTEGER NOT NULL,
      rememberMe INTEGER NOT NULL,
      userName TEXT NOT NULL,
      userEmail TEXT NOT NULL
    );
  `);

  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT OR IGNORE INTO categories (id, name, icon, color, type, custom) VALUES (?, ?, ?, ?, ?, ?);',
      category.id,
      category.name,
      category.icon,
      category.color,
      category.type,
      boolToInt(Boolean(category.custom)),
    );
  }

  const authRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM auth_session;');
  if (!authRow || authRow.count === 0) {
    await saveAuthSession({
      isAuthenticated: false,
      rememberMe: false,
      userName: '',
      userEmail: '',
    });
  }

  const themeRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM settings WHERE key = 'themeMode';",
  );
  if (!themeRow || themeRow.count === 0) {
    await saveThemeMode('light');
  }

  const currencyRowInit = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM settings WHERE key = 'masterCurrency';",
  );
  if (!currencyRowInit || currencyRowInit.count === 0) {
    await saveMasterCurrency('INR');
  }

  // --- Seed Dummy Data ---
  const seedFlag = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'seed_v4';"
  );

  if (!seedFlag || seedFlag.value !== 'true') {
    // Clear out any old dummy users just in case they exist from an older seed
    await db.execAsync("DELETE FROM users WHERE email IN ('dhyeyshah009@gmail.com', 'softechit@gmail.com');");
    
    // Add Dhyey
    await db.runAsync(
      'INSERT INTO users (email, name, password, upiId) VALUES (?, ?, ?, ?);',
      'dhyeyshah009@gmail.com',
      'Dhyey',
      '0000',
      'dhyeyshah009@okhdfcbank'
    );

    // Add Paras
    await db.runAsync(
      'INSERT INTO users (email, name, password, upiId) VALUES (?, ?, ?, ?);',
      'softechit@gmail.com',
      'Paras',
      '0000',
      '9328110252@kotak'
    );

    // Generate transactions for 2025 and 2026 (deterministic per user so APK demos match)
    const start2025 = new Date('2025-01-01T00:00:00Z').getTime();
    const endRange = new Date('2026-12-31T23:59:59Z').getTime();
    const dummyCount = 40; // 40 records per user

    const seedUsers = ['dhyeyshah009@gmail.com', 'softechit@gmail.com'];

    for (let uIdx = 0; uIdx < seedUsers.length; uIdx++) {
      const u = seedUsers[uIdx];
      const rand = mulberry32(0xdecaf000 + uIdx * 9973);
      for (let i = 0; i < dummyCount; i++) {
        const id = `seed_${uIdx}_${i}`;
        const randomTime = start2025 + rand() * (endRange - start2025);
        const isoDate = new Date(randomTime).toISOString();

        const category = DEFAULT_CATEGORIES[Math.floor(rand() * DEFAULT_CATEGORIES.length)];

        let amount = 0;
        if (category.type === 'income') {
          amount = Math.floor(rand() * 50000) + 15000;
        } else {
          amount = Math.floor(rand() * 4900) + 100;
        }

        await db.runAsync(
          'INSERT INTO transactions (id, amount, userEmail, categoryId, categoryName, categoryColor, categoryIcon, type, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
          id,
          amount,
          u,
          category.id,
          category.name,
          category.color,
          category.icon,
          category.type,
          isoDate,
          'Dummy ' + category.name + ' record',
          isoDate,
        );
      }
    }
    
    await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('seed_v4', 'true');");
  }
}

export async function loadSnapshot(): Promise<FinanceSnapshot> {
  const db = await getDb();

  const usersRows = await db.getAllAsync<AppUser>('SELECT name, email, password, upiId FROM users ORDER BY name ASC;');
  const categoriesRows = await db.getAllAsync<CategoryRow>(
    'SELECT id, name, icon, color, type, custom FROM categories ORDER BY name ASC;',
  );
  const transactionRows = await db.getAllAsync<Transaction>(
    'SELECT id, amount, userEmail, categoryId, categoryName, categoryColor, categoryIcon, type, date, note, createdAt FROM transactions ORDER BY datetime(createdAt) DESC;',
  );
  const reminderRows = await db.getAllAsync<PaymentReminder>(
    'SELECT id, ownerEmail, payeeEmail, payeeName, paymentName, amount, frequency, reminderDate, createdAt FROM reminders ORDER BY datetime(reminderDate) ASC;',
  );
  const budgetRows = await db.getAllAsync<CategoryBudget>(
    'SELECT id, userEmail, categoryId, amount, month, year, createdAt FROM budgets ORDER BY datetime(createdAt) DESC;',
  );
  const goalRows = await db.getAllAsync<SavingsGoal>(
    'SELECT id, userEmail, title, targetAmount, createdAt FROM savings_goals ORDER BY datetime(createdAt) DESC;',
  );

  const themeRow = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'themeMode' LIMIT 1;");
  const currencyRow = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'masterCurrency' LIMIT 1;");
  const authRow = await db.getFirstAsync<{
    isAuthenticated: number | string;
    rememberMe: number | string;
    userName: string;
    userEmail: string;
  }>('SELECT isAuthenticated, rememberMe, userName, userEmail FROM auth_session WHERE id = 1 LIMIT 1;');

  return {
    users: usersRows,
    categories: categoriesRows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      custom: intToBool(row.custom),
    })),
    transactions: transactionRows,
    reminders: reminderRows,
    budgets: budgetRows,
    goals: goalRows,
    themeMode: (themeRow?.value as ThemeMode) || 'light',
    masterCurrency: (currencyRow?.value as CurrencyCode) || 'INR',
    auth: {
      isAuthenticated: intToBool(authRow?.isAuthenticated),
      rememberMe: intToBool(authRow?.rememberMe),
      userName: authRow?.userName || '',
      userEmail: authRow?.userEmail || '',
    },
  };
}

export async function saveUser(user: AppUser) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO users (email, name, password, upiId) VALUES (?, ?, ?, ?);',
    user.email,
    user.name,
    user.password,
    user.upiId || null,
  );
}

export async function updateUserNameByEmail(email: string, name: string, upiId?: string) {
  const db = await getDb();
  await db.runAsync('UPDATE users SET name = ?, upiId = ? WHERE email = ?;', name, upiId || null, email);
}

export async function deleteUserAndData(email: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM users WHERE email = ?;', email);
  await db.runAsync('DELETE FROM transactions WHERE userEmail = ?;', email);
  await db.runAsync('DELETE FROM reminders WHERE ownerEmail = ?;', email);
  await db.runAsync('DELETE FROM budgets WHERE userEmail = ?;', email);
  await db.runAsync('DELETE FROM savings_goals WHERE userEmail = ?;', email);
  
  // Check if session belongs to this user and clean it up
  const sessionRow = await db.getFirstAsync<{ userEmail: string }>('SELECT userEmail FROM auth_session WHERE id = 1;');
  if (sessionRow && sessionRow.userEmail === email) {
    await db.runAsync(
      'UPDATE auth_session SET isAuthenticated = 0, rememberMe = 0, userName = "", userEmail = "" WHERE id = 1;'
    );
  }
}

export async function saveCategory(category: Category) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO categories (id, name, icon, color, type, custom) VALUES (?, ?, ?, ?, ?, ?);',
    category.id,
    category.name,
    category.icon,
    category.color,
    category.type,
    boolToInt(Boolean(category.custom)),
  );
}

export async function saveTransaction(transaction: Transaction) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO transactions (id, amount, userEmail, categoryId, categoryName, categoryColor, categoryIcon, type, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    transaction.id,
    transaction.amount,
    transaction.userEmail,
    transaction.categoryId,
    transaction.categoryName,
    transaction.categoryColor,
    transaction.categoryIcon,
    transaction.type,
    transaction.date,
    transaction.note,
    transaction.createdAt,
  );
}

export async function deleteTransactionById(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?;', id);
}

export async function saveReminder(reminder: PaymentReminder) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO reminders (id, ownerEmail, payeeEmail, payeeName, paymentName, amount, frequency, reminderDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    reminder.id,
    reminder.ownerEmail,
    reminder.payeeEmail,
    reminder.payeeName,
    reminder.paymentName,
    reminder.amount,
    reminder.frequency,
    reminder.reminderDate,
    reminder.createdAt,
  );
}

export async function saveBudget(budget: CategoryBudget) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO budgets (id, userEmail, categoryId, amount, month, year, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
    budget.id,
    budget.userEmail,
    budget.categoryId,
    budget.amount,
    budget.month,
    budget.year,
    budget.createdAt,
  );
}

export async function deleteBudgetById(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM budgets WHERE id = ?;', id);
}

export async function saveSavingsGoal(goal: SavingsGoal) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO savings_goals (id, userEmail, title, targetAmount, createdAt) VALUES (?, ?, ?, ?, ?);',
    goal.id,
    goal.userEmail,
    goal.title,
    goal.targetAmount,
    goal.createdAt,
  );
}

export async function deleteSavingsGoalById(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM savings_goals WHERE id = ?;', id);
}

export async function saveThemeMode(mode: ThemeMode) {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('themeMode', ?);", mode);
}
export async function saveMasterCurrency(currency: string) {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', 'masterCurrency', currency);
}
export async function saveAuthSession(auth: AuthSession) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO auth_session (id, isAuthenticated, rememberMe, userName, userEmail) VALUES (1, ?, ?, ?, ?);',
    boolToInt(auth.isAuthenticated),
    boolToInt(auth.rememberMe),
    auth.userName,
    auth.userEmail,
  );
}

export async function loadStateForContext(): Promise<FinanceState> {
  const snapshot = await loadSnapshot();
  const rememberedAuth = snapshot.auth.rememberMe && snapshot.auth.isAuthenticated;

  return {
    transactions: snapshot.transactions,
    categories: snapshot.categories.length > 0 ? snapshot.categories : DEFAULT_CATEGORIES,
    users: snapshot.users,
    reminders: snapshot.reminders,
    budgets: snapshot.budgets,
    goals: snapshot.goals,
    themeMode: snapshot.themeMode || 'light',
    masterCurrency: snapshot.masterCurrency || 'INR',
    auth: {
      isAuthenticated: rememberedAuth,
      rememberMe: snapshot.auth.rememberMe,
      userName: snapshot.auth.userName,
      userEmail: snapshot.auth.userEmail,
    },
  };
}
