export type TransactionType = 'income' | 'expense';

export type ThemeMode = 'light' | 'dark';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP';

export type AppUser = {
  name: string;
  email: string;
  password: string;
  upiId?: string;
};

export type ReminderFrequency = 'weekly' | 'monthly' | 'yearly';

export type PaymentReminder = {
  id: string;
  ownerEmail: string;
  payeeEmail: string;
  payeeName: string;
  paymentName: string;
  amount: number;
  frequency: ReminderFrequency;
  reminderDate: string;
  createdAt: string;
};

export type CategoryBudget = {
  id: string;
  userEmail: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
};

export type SavingsGoal = {
  id: string;
  userEmail: string;
  title: string;
  targetAmount: number;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
  custom?: boolean;
};

export type Transaction = {
  id: string;
  amount: number;
  userEmail: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  type: TransactionType;
  date: string;
  note: string;
  createdAt: string;
};

export type FinanceState = {
  transactions: Transaction[];
  categories: Category[];
  users: AppUser[];
  reminders: PaymentReminder[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  themeMode: ThemeMode;
  masterCurrency: CurrencyCode;
  auth: {
    isAuthenticated: boolean;
    rememberMe: boolean;
    userName: string;
    userEmail: string;
  };
};

export type MonthlySummary = {
  income: number;
  expenses: number;
  balance: number;
};
