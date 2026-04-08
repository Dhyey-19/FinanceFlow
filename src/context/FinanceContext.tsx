import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import { CUSTOM_CATEGORY_COLORS, DEFAULT_CATEGORIES } from '../constants/categories';
import {
  deleteBudgetById,
  deleteSavingsGoalById,
  deleteTransactionById,
  deleteUserAndData,
  initDatabase,
  loadStateForContext,
  saveAuthSession,
  saveBudget,
  saveCategory,
  saveReminder,
  saveSavingsGoal,
  saveThemeMode,
  saveMasterCurrency,
  saveTransaction,
  saveUser,
  updateUserNameByEmail,
} from '../db/sqliteStorage';
import { getTheme } from '../theme/theme';
import {
  AppUser,
  CategoryBudget,
  Category,
  FinanceState,
  MonthlySummary,
  PaymentReminder,
  ReminderFrequency,
  SavingsGoal,
  ThemeMode,
  CurrencyCode,
  Transaction,
  TransactionType,
} from '../types';

type FinanceContextValue = {
  state: FinanceState;
  isReady: boolean;
  signIn: (input: { email: string; password: string; rememberMe: boolean }) => { ok: boolean; message?: string };
  signUp: (input: { name: string; email: string; password: string; rememberMe: boolean; upiId?: string }) => { ok: boolean; message?: string };
  signOut: () => void;
  updateProfile: (input: { name: string; upiId?: string }) => { ok: boolean; message?: string };
  addTransaction: (input: {
    amount: number;
    categoryId: string;
    type: TransactionType;
    date: string;
    note: string;
  }) => { budgetExceeded: boolean; budgetAmount?: number; spentAmount?: number; categoryName?: string };
  updateTransaction: (input: {
    id: string;
    amount: number;
    categoryId: string;
    type: TransactionType;
    date: string;
    note: string;
  }) => { budgetExceeded: boolean; budgetAmount?: number; spentAmount?: number; categoryName?: string };
  deleteTransaction: (id: string) => void;
  deleteAccount: () => Promise<void>;
  restoreTransaction: (transaction: Transaction) => void;
  setCategoryBudget: (input: { categoryId: string; amount: number; month: number; year: number }) => void;
  getCategoryBudget: (input: { categoryId: string; month: number; year: number }) => CategoryBudget | undefined;
  getCategorySpent: (input: { categoryId: string; month: number; year: number }) => number;
  addSavingsGoal: (input: { title: string; targetAmount: number }) => void;
  removeSavingsGoal: (id: string) => void;
  addCustomCategory: (input: { name: string; type: TransactionType | 'both' }) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addReminder: (input: {
    payeeEmail: string;
    payeeName: string;
    paymentName: string;
    amount: number;
    frequency: ReminderFrequency;
    reminderDate: string;
  }) => void;
  setMasterCurrency: (currency: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
  getMonthlySummary: (month: number, year: number) => MonthlySummary;
  toggleTheme: () => void;
};

type FinanceAction =
  | { type: 'LOAD_STATE'; payload: FinanceState }
  | {
      type: 'ADD_TRANSACTION';
      payload: Transaction;
    }
  | {
      type: 'UPDATE_TRANSACTION';
      payload: Transaction;
    }
  | {
      type: 'DELETE_TRANSACTION';
      payload: { id: string };
    }
  | {
      type: 'RESTORE_TRANSACTION';
      payload: Transaction;
    }
  | {
      type: 'UPSERT_BUDGET';
      payload: CategoryBudget;
    }
  | {
      type: 'REMOVE_BUDGET';
      payload: { id: string };
    }
  | {
      type: 'ADD_CATEGORY';
      payload: Category;
    }
  | {
      type: 'UPDATE_CATEGORY';
      payload: Category;
    }
  | {
      type: 'DELETE_CATEGORY';
      payload: { id: string };
    }
  | {
      type: 'ADD_USER';
      payload: AppUser;
    }
  | {
      type: 'UPDATE_PROFILE';
      payload: {
        email: string;
        name: string;
        upiId?: string;
      };
    }
  | {
      type: 'ADD_REMINDER';
      payload: PaymentReminder;
    }
  | {
      type: 'ADD_SAVINGS_GOAL';
      payload: SavingsGoal;
    }
  | {
      type: 'REMOVE_SAVINGS_GOAL';
      payload: { id: string };
    }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_MASTER_CURRENCY'; payload: CurrencyCode }
  | {
      type: 'AUTH_SUCCESS';
      payload: {
        userName: string;
        userEmail: string;
        rememberMe: boolean;
      };
    }
  | { type: 'SIGN_OUT' }
  | { type: 'DELETE_ACCOUNT'; payload: { email: string } };

const initialState: FinanceState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  users: [],
  reminders: [],
  budgets: [],
  goals: [],
  themeMode: 'light',
  masterCurrency: 'INR',
  auth: {
    isAuthenticated: false,
    rememberMe: false,
    userName: '',
    userEmail: '',
  },
};

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions
          .map((item) => (item.id === action.payload.id ? action.payload : item))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((item) => item.id !== action.payload.id),
      };
    case 'RESTORE_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      };
    case 'UPSERT_BUDGET': {
      const next = state.budgets.filter((item) => item.id !== action.payload.id);
      return {
        ...state,
        budgets: [action.payload, ...next],
      };
    }
    case 'REMOVE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter((item) => item.id !== action.payload.id),
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload.id),
      };
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        users: state.users.map((item) =>
          item.email.toLowerCase().trim() === action.payload.email.toLowerCase().trim()
            ? { ...item, name: action.payload.name, upiId: action.payload.upiId }
            : item,
        ),
        auth: {
          ...state.auth,
          userName:
            state.auth.userEmail.toLowerCase().trim() === action.payload.email.toLowerCase().trim()
              ? action.payload.name
              : state.auth.userName,
        },
      };
    case 'ADD_REMINDER':
      return {
        ...state,
        reminders: [action.payload, ...state.reminders],
      };
    case 'ADD_SAVINGS_GOAL':
      return {
        ...state,
        goals: [action.payload, ...state.goals],
      };
    case 'REMOVE_SAVINGS_GOAL':
      return {
        ...state,
        goals: state.goals.filter((item) => item.id !== action.payload.id),
      };
    case 'TOGGLE_THEME':
      return {
        ...state,
        themeMode: state.themeMode === 'light' ? 'dark' : 'light',
      };
    case 'SET_MASTER_CURRENCY':
      return {
        ...state,
        masterCurrency: action.payload,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          rememberMe: action.payload.rememberMe,
          userName: action.payload.userName,
          userEmail: action.payload.userEmail,
        },
      };
    case 'SIGN_OUT':
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          rememberMe: false,
          userName: '',
          userEmail: '',
        },
      };
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        users: state.users.filter((u) => u.email !== action.payload.email),
        transactions: state.transactions.filter((t) => t.userEmail !== action.payload.email),
        reminders: state.reminders.filter((r) => r.ownerEmail !== action.payload.email),
        budgets: state.budgets.filter((b) => b.userEmail !== action.payload.email),
        goals: state.goals.filter((g) => g.userEmail !== action.payload.email),
        auth: {
          isAuthenticated: false,
          rememberMe: false,
          userName: '',
          userEmail: '',
        },
      };
    default:
      return state;
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const loadedState = await loadStateForContext();
        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const getCategorySpent: FinanceContextValue['getCategorySpent'] = ({ categoryId, month, year }) =>
    state.transactions
      .filter((item) => {
        const date = new Date(item.date);
        return (
          item.userEmail === state.auth.userEmail &&
          item.type === 'expense' &&
          item.categoryId === categoryId &&
          date.getMonth() === month &&
          date.getFullYear() === year
        );
      })
      .reduce((sum, item) => sum + item.amount, 0);

  const getCategoryBudget: FinanceContextValue['getCategoryBudget'] = ({ categoryId, month, year }) =>
    state.budgets.find(
      (item) =>
        item.userEmail === state.auth.userEmail &&
        item.categoryId === categoryId &&
        item.month === month &&
        item.year === year,
    );

  const getBudgetStatusForExpense = ({
    categoryId,
    date,
    amount,
    excludeTransactionId,
  }: {
    categoryId: string;
    date: string;
    amount: number;
    excludeTransactionId?: string;
  }) => {
    const txDate = new Date(date);
    const month = txDate.getMonth();
    const year = txDate.getFullYear();

    const budget = getCategoryBudget({ categoryId, month, year });
    if (!budget) {
      return { budgetExceeded: false };
    }

    const spent = state.transactions
      .filter((item) => {
        const itemDate = new Date(item.date);
        return (
          item.userEmail === state.auth.userEmail &&
          item.type === 'expense' &&
          item.categoryId === categoryId &&
          itemDate.getMonth() === month &&
          itemDate.getFullYear() === year &&
          item.id !== excludeTransactionId
        );
      })
      .reduce((sum, item) => sum + item.amount, 0);

    const nextSpent = spent + amount;
    const category = state.categories.find((item) => item.id === categoryId);

    return {
      budgetExceeded: nextSpent > budget.amount,
      budgetAmount: budget.amount,
      spentAmount: nextSpent,
      categoryName: category?.name,
    };
  };

  const addTransaction: FinanceContextValue['addTransaction'] = ({ amount, categoryId, type, date, note }) => {
    if (!state.auth.userEmail) {
      return { budgetExceeded: false };
    }

    const category = state.categories.find((item) => item.id === categoryId);
    if (!category) {
      return { budgetExceeded: false };
    }

    const payload: Transaction = {
      id: `${Date.now()}`,
      amount,
      userEmail: state.auth.userEmail,
      categoryId,
      categoryName: category.name,
      categoryColor: category.color,
      categoryIcon: category.icon,
      type,
      date,
      note,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_TRANSACTION', payload });
    void saveTransaction(payload);

    if (type === 'expense') {
      return getBudgetStatusForExpense({ categoryId, date, amount });
    }

    return { budgetExceeded: false };
  };

  const updateCategory: FinanceContextValue['updateCategory'] = (category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category });
    
    // Also update any matching transactions
    const updatedTransactions = state.transactions.map(t => {
      if (t.categoryId === category.id) {
        return {
          ...t,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryColor: category.color
        };
      }
      return t;
    });

    updatedTransactions.forEach(t => {
       dispatch({ type: 'UPDATE_TRANSACTION', payload: t });
    });
  };

  const deleteCategory: FinanceContextValue['deleteCategory'] = (id) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: { id } });
  };

  const addCustomCategory: FinanceContextValue['addCustomCategory'] = ({ name, type }) => {
    const color = CUSTOM_CATEGORY_COLORS[state.categories.length % CUSTOM_CATEGORY_COLORS.length];
    const payload: Category = {
      id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name,
      color,
      icon: 'pricetag-outline',
      type,
      custom: true,
    };

    dispatch({ type: 'ADD_CATEGORY', payload });
    void saveCategory(payload);
  };

  const updateTransaction: FinanceContextValue['updateTransaction'] = ({ id, amount, categoryId, type, date, note }) => {
    if (!state.auth.userEmail) {
      return { budgetExceeded: false };
    }

    const existing = state.transactions.find((item) => item.id === id);
    const category = state.categories.find((item) => item.id === categoryId);
    if (!existing || !category) {
      return { budgetExceeded: false };
    }

    const payload: Transaction = {
      ...existing,
      amount,
      categoryId,
      categoryName: category.name,
      categoryColor: category.color,
      categoryIcon: category.icon,
      type,
      date,
      note,
    };

    dispatch({ type: 'UPDATE_TRANSACTION', payload });
    void saveTransaction(payload);

    if (type === 'expense') {
      return getBudgetStatusForExpense({ categoryId, date, amount, excludeTransactionId: id });
    }

    return { budgetExceeded: false };
  };

  const deleteTransaction: FinanceContextValue['deleteTransaction'] = (id) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: { id } });
    void deleteTransactionById(id);
  };

  const deleteAccount: FinanceContextValue['deleteAccount'] = async () => {
    if (!state.auth.userEmail) return;
    const email = state.auth.userEmail;
    dispatch({ type: 'DELETE_ACCOUNT', payload: { email } });
    await deleteUserAndData(email);
  };

  const restoreTransaction: FinanceContextValue['restoreTransaction'] = (transaction) => {
    dispatch({ type: 'RESTORE_TRANSACTION', payload: transaction });
    void saveTransaction(transaction);
  };

  const setCategoryBudget: FinanceContextValue['setCategoryBudget'] = ({ categoryId, amount, month, year }) => {
    if (!state.auth.userEmail) {
      return;
    }

    const existing = state.budgets.find(
      (item) =>
        item.userEmail === state.auth.userEmail &&
        item.categoryId === categoryId &&
        item.month === month &&
        item.year === year,
    );

    if (amount <= 0) {
      if (existing) {
        dispatch({ type: 'REMOVE_BUDGET', payload: { id: existing.id } });
        void deleteBudgetById(existing.id);
      }
      return;
    }

    const payload: CategoryBudget = {
      id: existing?.id || `${state.auth.userEmail}-${categoryId}-${year}-${month}`,
      userEmail: state.auth.userEmail,
      categoryId,
      amount,
      month,
      year,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    dispatch({ type: 'UPSERT_BUDGET', payload });
    void saveBudget(payload);
  };

  const addSavingsGoal: FinanceContextValue['addSavingsGoal'] = ({ title, targetAmount }) => {
    if (!state.auth.userEmail) {
      return;
    }

    const payload: SavingsGoal = {
      id: `${Date.now()}`,
      userEmail: state.auth.userEmail,
      title,
      targetAmount,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_SAVINGS_GOAL', payload });
    void saveSavingsGoal(payload);
  };

  const removeSavingsGoal: FinanceContextValue['removeSavingsGoal'] = (id) => {
    dispatch({ type: 'REMOVE_SAVINGS_GOAL', payload: { id } });
    void deleteSavingsGoalById(id);
  };

  const addReminder: FinanceContextValue['addReminder'] = ({
    payeeEmail,
    payeeName,
    paymentName,
    amount,
    frequency,
    reminderDate,
  }) => {
    if (!state.auth.userEmail) {
      return;
    }

    const payload: PaymentReminder = {
      id: `${Date.now()}`,
      ownerEmail: state.auth.userEmail,
      payeeEmail,
      payeeName,
      paymentName,
      amount,
      frequency,
      reminderDate,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_REMINDER', payload });
    void saveReminder(payload);
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = state.themeMode === 'light' ? 'dark' : 'light';
    dispatch({ type: 'TOGGLE_THEME' });
    void saveThemeMode(nextMode);
  };

  const setMasterCurrency = (currency: CurrencyCode) => {
    dispatch({ type: 'SET_MASTER_CURRENCY', payload: currency });
    void saveMasterCurrency(currency);
  };

  const formatCurrency = (amount: number) => {
    const locales: Record<CurrencyCode, string> = {
      USD: 'en-US',
      INR: 'en-IN',
      EUR: 'en-IE',
      GBP: 'en-GB',
    };
    return new Intl.NumberFormat(locales[state.masterCurrency] || 'en-US', {
      style: 'currency',
      currency: state.masterCurrency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const signIn: FinanceContextValue['signIn'] = ({ email, password, rememberMe }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const user = state.users.find(
      (item) => item.email.toLowerCase().trim() === normalizedEmail && item.password === password,
    );

    if (!user) {
      return { ok: false, message: 'Invalid email or password.' };
    }

    dispatch({
      type: 'AUTH_SUCCESS',
      payload: {
        userName: user.name,
        userEmail: user.email,
        rememberMe,
      },
    });
    void saveAuthSession({
      isAuthenticated: true,
      rememberMe,
      userName: user.name,
      userEmail: user.email,
    });

    return { ok: true };
  };

  const signUp: FinanceContextValue['signUp'] = ({ name, email, password, rememberMe, upiId }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const exists = state.users.some((item) => item.email.toLowerCase().trim() === normalizedEmail);

    if (exists) {
      return { ok: false, message: 'An account with this email already exists.' };
    }

    const user: AppUser = {
      name,
      email: normalizedEmail,
      password,
      upiId: upiId?.trim(),
    };

    dispatch({ type: 'ADD_USER', payload: user });
    void saveUser(user);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: {
        userName: name,
        userEmail: normalizedEmail,
        rememberMe,
      },
    });
    void saveAuthSession({
      isAuthenticated: true,
      rememberMe,
      userName: name,
      userEmail: normalizedEmail,
    });

    return { ok: true };
  };

  const signOut = () => {
    dispatch({ type: 'SIGN_OUT' });
    void saveAuthSession({
      isAuthenticated: false,
      rememberMe: false,
      userName: '',
      userEmail: '',
    });
  };

  const updateProfile: FinanceContextValue['updateProfile'] = ({ name, upiId }) => {
    const trimmedName = name.trim();
    const activeEmail = state.auth.userEmail.toLowerCase().trim();

    if (!activeEmail) {
      return { ok: false, message: 'No active account found.' };
    }

    if (!trimmedName) {
      return { ok: false, message: 'Name cannot be empty.' };
    }

    dispatch({
      type: 'UPDATE_PROFILE',
      payload: {
        email: activeEmail,
        name: trimmedName,
        upiId: upiId?.trim(),
      },
    });

    void updateUserNameByEmail(activeEmail, trimmedName, upiId?.trim());
    void saveAuthSession({
      isAuthenticated: state.auth.isAuthenticated,
      rememberMe: state.auth.rememberMe,
      userName: trimmedName,
      userEmail: state.auth.userEmail,
    });

    return { ok: true };
  };

  const getMonthlySummary = (month: number, year: number): MonthlySummary => {
    const activeUser = state.auth.userEmail;
    const transactions = state.transactions.filter((item) => {
      const date = new Date(item.date);
      return (
        item.userEmail === activeUser &&
        date.getMonth() === month &&
        date.getFullYear() === year
      );
    });

    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  };

  const value = useMemo(
    () => ({
      state,
      isReady,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      deleteAccount,
      restoreTransaction,
      setCategoryBudget,
      getCategoryBudget,
      getCategorySpent,
      addSavingsGoal,
      removeSavingsGoal,
      addCustomCategory,
      updateCategory,
      deleteCategory,
      addReminder,
      toggleTheme,
      setMasterCurrency,
      formatCurrency,
      signIn,
      signUp,
      signOut,
      updateProfile,
      getMonthlySummary,
    }),
    [state, isReady],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used inside FinanceProvider');
  }
  return ctx;
}

export function useAppTheme() {
  const { state } = useFinance();
  return getTheme(state.themeMode as ThemeMode);
}
