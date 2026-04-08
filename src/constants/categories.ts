import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'salary',
    name: 'Salary',
    icon: 'cash-outline',
    color: '#16A34A',
    type: 'income',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: 'laptop-outline',
    color: '#0EA5E9',
    type: 'income',
  },
  {
    id: 'food',
    name: 'Food',
    icon: 'restaurant-outline',
    color: '#F97316',
    type: 'expense',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'bag-handle-outline',
    color: '#EC4899',
    type: 'expense',
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'car-outline',
    color: '#8B5CF6',
    type: 'expense',
  },
  {
    id: 'bills',
    name: 'Bills',
    icon: 'receipt-outline',
    color: '#EF4444',
    type: 'expense',
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: 'card-outline',
    color: '#3B82F6',
    type: 'expense',
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'fitness-outline',
    color: '#06B6D4',
    type: 'expense',
  },
  {
    id: 'entertainment',
    name: 'Fun',
    icon: 'game-controller-outline',
    color: '#F59E0B',
    type: 'expense',
  },
];

export const CUSTOM_CATEGORY_COLORS = [
  '#06B6D4',
  '#10B981',
  '#F97316',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#EAB308',
  '#EF4444',
];
