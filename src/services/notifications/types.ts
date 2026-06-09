export const NOTIFICATION_SOURCES = {
  SMS_TRANSACTION: 'sms-transaction',
  CATEGORY_LIMIT_REACHED: 'category-limit-reached',
  CATEGORY_LIMIT_EXCEEDED: 'category-limit-exceeded',
  INVESTMENT_UPCOMING: 'investment-upcoming',
  INVESTMENT_PROCESSED: 'investment-processed',
  RECURRING_UPCOMING: 'recurring-upcoming',
  RECURRING_PROCESSED: 'recurring-processed',
} as const;

export type NotificationSource =
  (typeof NOTIFICATION_SOURCES)[keyof typeof NOTIFICATION_SOURCES];

export const ANDROID_CHANNELS = {
  SMS: 'sms-transactions',
  CATEGORY: 'category-limits',
  INVESTMENT: 'investment-alerts',
  RECURRING: 'recurring-alerts',
} as const;

export type NotificationPayload = {
  source: NotificationSource;
  draftId?: string;
  categoryId?: string;
  investmentId?: string;
  recurringExpenseId?: string;
};
