import { RecurringFrequency } from '../database/types';

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
