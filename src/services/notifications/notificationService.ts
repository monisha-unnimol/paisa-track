import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSmsDraftStore } from '../../store/useSmsDraftStore';
import { navigateToSmsDraft, navigationRef } from '../../navigation/navigationRef';
import { ParsedBankSms, formatReviewTransactionNotificationBody } from '../sms/smsParser';
import {
  ANDROID_CHANNELS,
  NOTIFICATION_SOURCES,
  NotificationPayload,
} from './types';

let responseSubscription: Notifications.Subscription | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initializeNotifications(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    granted = requested.granted;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.SMS, {
      name: 'SMS transaction alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.CATEGORY, {
      name: 'Category budget alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 100, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.INVESTMENT, {
      name: 'Investment alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 100, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.RECURRING, {
      name: 'Recurring expense alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 100, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return granted;
}

async function presentLocalNotification(
  title: string,
  body: string,
  data: NotificationPayload,
  channelId?: string,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      ...(Platform.OS === 'android' && channelId ? { channelId } : {}),
    },
    trigger: null,
  });
}

export async function notifySmsTransactionDetected(
  parsed: ParsedBankSms,
  draftId: string,
): Promise<string> {
  const title = 'Review Transaction';
  const body = formatReviewTransactionNotificationBody(parsed);

  const notificationId = await presentLocalNotification(
    title,
    body,
    {
      source: NOTIFICATION_SOURCES.SMS_TRANSACTION,
      draftId,
    },
    ANDROID_CHANNELS.SMS,
  );

  console.log('[SMS] Notification Created', notificationId);
  return notificationId;
}

export async function notifyCategoryLimitReached(
  categoryName: string,
  spent: number,
  budget: number,
  categoryId: string,
): Promise<string> {
  const spentText = formatInr(spent);
  const budgetText = formatInr(budget);

  return presentLocalNotification(
    'Category limit reached',
    `${categoryName} has reached its monthly limit (${spentText} of ${budgetText}).`,
    {
      source: NOTIFICATION_SOURCES.CATEGORY_LIMIT_REACHED,
      categoryId,
    },
    ANDROID_CHANNELS.CATEGORY,
  );
}

export async function notifyCategoryLimitExceeded(
  categoryName: string,
  spent: number,
  budget: number,
  categoryId: string,
): Promise<string> {
  const overBy = spent - budget;

  return presentLocalNotification(
    'Category limit exceeded',
    `${categoryName} is over budget by ${formatInr(overBy)} (${formatInr(spent)} spent, limit ${formatInr(budget)}).`,
    {
      source: NOTIFICATION_SOURCES.CATEGORY_LIMIT_EXCEEDED,
      categoryId,
    },
    ANDROID_CHANNELS.CATEGORY,
  );
}

export async function notifyInvestmentUpcoming(
  investmentName: string,
  amount: number,
  accountName: string,
  investmentId: string,
): Promise<string> {
  return presentLocalNotification(
    'Upcoming Investment',
    `${formatInr(amount)} will be deducted tomorrow for ${investmentName} from ${accountName}.`,
    {
      source: NOTIFICATION_SOURCES.INVESTMENT_UPCOMING,
      investmentId,
    },
    ANDROID_CHANNELS.INVESTMENT,
  );
}

export async function notifyInvestmentProcessed(
  investmentName: string,
  amount: number,
  accountName: string,
  investmentId: string,
): Promise<string> {
  return presentLocalNotification(
    'Investment Processed',
    `${formatInr(amount)} has been deducted from ${accountName} for ${investmentName}.`,
    {
      source: NOTIFICATION_SOURCES.INVESTMENT_PROCESSED,
      investmentId,
    },
    ANDROID_CHANNELS.INVESTMENT,
  );
}

export async function notifyRecurringExpenseUpcoming(
  expenseName: string,
  amount: number,
  recurringExpenseId: string,
): Promise<string> {
  return presentLocalNotification(
    'Upcoming Expense',
    `${expenseName} of ${formatInr(amount)} is due tomorrow.`,
    {
      source: NOTIFICATION_SOURCES.RECURRING_UPCOMING,
      recurringExpenseId,
    },
    ANDROID_CHANNELS.RECURRING,
  );
}

export async function notifyRecurringExpenseProcessed(
  expenseName: string,
  amount: number,
  recurringExpenseId: string,
): Promise<string> {
  return presentLocalNotification(
    'Expense Recorded',
    `${expenseName} of ${formatInr(amount)} has been added successfully.`,
    {
      source: NOTIFICATION_SOURCES.RECURRING_PROCESSED,
      recurringExpenseId,
    },
    ANDROID_CHANNELS.RECURRING,
  );
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as Partial<NotificationPayload>;

  if (data.source === NOTIFICATION_SOURCES.SMS_TRANSACTION && data.draftId) {
    useSmsDraftStore.getState().setActiveDraft(data.draftId);
    navigateToSmsDraft(data.draftId);
    return;
  }

  if (
    (data.source === NOTIFICATION_SOURCES.CATEGORY_LIMIT_REACHED ||
      data.source === NOTIFICATION_SOURCES.CATEGORY_LIMIT_EXCEEDED) &&
    data.categoryId
  ) {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Categories');
    }
    return;
  }

  if (
    (data.source === NOTIFICATION_SOURCES.INVESTMENT_UPCOMING ||
      data.source === NOTIFICATION_SOURCES.INVESTMENT_PROCESSED) &&
    navigationRef.isReady()
  ) {
    navigationRef.navigate('Recurring');
    return;
  }

  if (
    (data.source === NOTIFICATION_SOURCES.RECURRING_UPCOMING ||
      data.source === NOTIFICATION_SOURCES.RECURRING_PROCESSED) &&
    navigationRef.isReady()
  ) {
    navigationRef.navigate('Recurring');
  }
}

export function setupNotificationResponseHandlers(): void {
  if (responseSubscription) return;

  responseSubscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      handleNotificationResponse(response);
    }
  });
}

export function teardownNotificationResponseHandlers(): void {
  responseSubscription?.remove();
  responseSubscription = null;
}
