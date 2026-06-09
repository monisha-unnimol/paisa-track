import { Ionicons } from '@expo/vector-icons';
import { RecurringSegment } from '../utils/recurringListHelpers';
import { colors } from '../theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type RecurringEmptyState = {
  icon: IoniconName;
  title: string;
  message: string;
  buttonLabel: string;
  action: 'add_recurring' | 'add_investment' | 'add_expense' | 'clear_search';
  accentColor: string;
  showQuickActions?: boolean;
};

export function getRecurringEmptyState(
  segment: RecurringSegment,
  hasSearch: boolean,
): RecurringEmptyState {
  if (hasSearch) {
    return {
      icon: 'search-outline',
      title: 'No Results Found',
      message: "We couldn't find anything matching your search.",
      buttonLabel: 'Clear Search',
      action: 'clear_search',
      accentColor: colors.textMuted,
    };
  }

  if (segment === 'investments') {
    return {
      icon: 'trending-up-outline',
      title: 'No Investments Found',
      message: 'Track SIPs, mutual funds, stocks, and other recurring investments.',
      buttonLabel: 'Add Investment',
      action: 'add_investment',
      accentColor: colors.income,
    };
  }

  if (segment === 'expenses') {
    return {
      icon: 'receipt-outline',
      title: 'No Recurring Expenses Found',
      message: 'Manage rent, bills, subscriptions, and other recurring payments.',
      buttonLabel: 'Add Recurring Expense',
      action: 'add_expense',
      accentColor: colors.expense,
    };
  }

  return {
    icon: 'repeat-outline',
    title: 'No Recurring Items Yet',
    message: 'Create recurring investments or expenses to automate your finances.',
    buttonLabel: 'Add Recurring Item',
    action: 'add_recurring',
    accentColor: colors.primary,
    showQuickActions: true,
  };
}
