import { RecurringFrequency } from '../database/types';

export type RecurringExpenseCategoryType =
  | 'rent'
  | 'emi'
  | 'insurance'
  | 'electricity'
  | 'internet'
  | 'water_bill'
  | 'maintenance'
  | 'ott_subscriptions'
  | 'gym_membership'
  | 'school_fees'
  | 'custom';

export const RECURRING_EXPENSE_CATEGORY_TYPES: RecurringExpenseCategoryType[] = [
  'rent',
  'emi',
  'insurance',
  'electricity',
  'internet',
  'water_bill',
  'maintenance',
  'ott_subscriptions',
  'gym_membership',
  'school_fees',
  'custom',
];

export const RECURRING_EXPENSE_CATEGORY_LABELS: Record<
  RecurringExpenseCategoryType,
  string
> = {
  rent: 'Rent',
  emi: 'EMI',
  insurance: 'Insurance',
  electricity: 'Electricity',
  internet: 'Internet',
  water_bill: 'Water Bill',
  maintenance: 'Maintenance',
  ott_subscriptions: 'OTT Subscriptions',
  gym_membership: 'Gym Membership',
  school_fees: 'School Fees',
  custom: 'Custom Expenses',
};

export const RECURRING_EXPENSE_CATEGORY_ICONS: Record<
  RecurringExpenseCategoryType,
  string
> = {
  rent: '🏠',
  emi: '🏦',
  insurance: '🛡️',
  electricity: '⚡',
  internet: '🌐',
  water_bill: '💧',
  maintenance: '🔧',
  ott_subscriptions: '📺',
  gym_membership: '💪',
  school_fees: '🎓',
  custom: '📋',
};

export const RECURRING_EXPENSE_CATEGORY_COLORS: Record<
  RecurringExpenseCategoryType,
  string
> = {
  rent: '#F97316',
  emi: '#6366F1',
  insurance: '#8B5CF6',
  electricity: '#EAB308',
  internet: '#0EA5E9',
  water_bill: '#06B6D4',
  maintenance: '#64748B',
  ott_subscriptions: '#EC4899',
  gym_membership: '#14B8A6',
  school_fees: '#3B82F6',
  custom: '#94A3B8',
};

export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'half_yearly',
  'yearly',
];

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half-Yearly',
  yearly: 'Yearly',
};

export const RECURRING_FREQUENCY_ICONS: Record<RecurringFrequency, string> = {
  weekly: '📅',
  monthly: '🗓️',
  quarterly: '📆',
  half_yearly: '📋',
  yearly: '🎯',
};

export const WEEKDAYS = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

export const DEDUCTION_DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

export const RENT_CATEGORY_NAME = RECURRING_EXPENSE_CATEGORY_LABELS.rent;
