import { EventSubscription } from 'expo-modules-core';
import { AppState, Platform } from 'react-native';
import {
  addSmsReceivedListener,
  clearPendingMessages,
  getPendingMessages,
  isSmsListenerAvailable,
  startSmsListening,
  stopSmsListening,
} from 'sms-listener';
import { databaseService } from '../../database';
import { notifySmsTransactionDetected } from '../notifications/notificationService';
import { createSmsTransactionReview } from '../reviews/reviewService';
import { useSmsDraftStore } from '../../store/useSmsDraftStore';
import {
  computeSmsDedupeKey,
  formatParsedSmsSummary,
  parseBankSms,
} from './smsParser';
import { hasSmsPermissions } from './smsPermissions';

let smsSubscription: EventSubscription | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let listenerActive = false;
let processingPending = false;
const processedSmsKeys = new Set<string>();

function rememberSmsKey(smsKey: string): boolean {
  if (processedSmsKeys.has(smsKey)) {
    return false;
  }

  processedSmsKeys.add(smsKey);
  if (processedSmsKeys.size > 100) {
    const first = processedSmsKeys.values().next().value;
    if (first) processedSmsKeys.delete(first);
  }

  return true;
}

type HandleIncomingSmsOptions = {
  notify?: boolean;
  timestamp?: number;
};

async function handleIncomingSms(
  sender: string,
  body: string,
  options: HandleIncomingSmsOptions = {},
): Promise<void> {
  const smsKey = computeSmsDedupeKey(sender, body);

  console.log('[SMS] Received', {
    sender,
    smsKey,
    timestamp: options.timestamp ?? null,
  });

  if (!rememberSmsKey(smsKey)) {
    console.log('[SMS] Skipped duplicate in session', smsKey);
    return;
  }

  const parsed = parseBankSms(sender, body);
  if (!parsed) {
    processedSmsKeys.delete(smsKey);
    return;
  }

  const existingReview = await databaseService.findPendingReviewBySmsKey(smsKey);
  if (existingReview) {
    console.log('[SMS] Skipped duplicate review', existingReview.id);
    return;
  }

  const draft = useSmsDraftStore.getState().saveDraft(parsed);
  const review = await createSmsTransactionReview(
    draft,
    formatParsedSmsSummary(parsed),
    smsKey,
  );
  console.log('[SMS] Review Request Created', review.id);

  if (options.notify === false) {
    return;
  }

  await notifySmsTransactionDetected(parsed, draft.id);
}

async function processPendingMessages(notify: boolean): Promise<void> {
  if (!isSmsListenerAvailable() || !listenerActive || processingPending) return;

  processingPending = true;
  try {
    const pending = await getPendingMessages();
    if (pending.length === 0) return;

    for (const message of pending) {
      await handleIncomingSms(message.sender, message.body, {
        notify,
        timestamp: message.timestamp,
      });
    }

    await clearPendingMessages();
  } finally {
    processingPending = false;
  }
}

export function isSmsListenerRunning(): boolean {
  return listenerActive;
}

export async function startSmsListener(): Promise<boolean> {
  if (listenerActive || Platform.OS !== 'android') return false;

  if (!isSmsListenerAvailable()) {
    console.warn(
      'SMS listener native module unavailable. Build with `npx expo run:android`.',
    );
    return false;
  }

  if (!(await hasSmsPermissions())) {
    return false;
  }

  smsSubscription?.remove();
  const subscription = addSmsReceivedListener(({ sender, body, timestamp }) => {
    handleIncomingSms(sender, body, { notify: true, timestamp }).catch(console.error);
  });

  if (!subscription) {
    return false;
  }

  smsSubscription = subscription;

  await startSmsListening();
  await processPendingMessages(true);

  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        processPendingMessages(true).catch(console.error);
      }
    });
  }

  listenerActive = true;
  return true;
}

export async function shutdownSmsListener(): Promise<void> {
  smsSubscription?.remove();
  smsSubscription = null;

  appStateSubscription?.remove();
  appStateSubscription = null;

  if (isSmsListenerAvailable()) {
    await stopSmsListening().catch(console.error);
  }

  listenerActive = false;
}

export { isSmsListenerAvailable };
