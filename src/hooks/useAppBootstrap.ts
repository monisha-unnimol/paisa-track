import { useEffect, useState } from 'react';
import { databaseService } from '../database';
import { runInvestmentScheduler } from '../services/investments/investmentScheduler';
import { runRecurringScheduler } from '../services/recurring/recurringScheduler';
import { syncSmsTracking } from '../services/sms/smsTrackingService';
import { useAccountStore } from '../store/useAccountStore';
import { useUserProfileStore } from '../store/useUserProfileStore';
import { useReviewStore } from '../store/useReviewStore';
import { usePrivacyStore } from '../store/usePrivacyStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  initializeNotifications,
  setupNotificationResponseHandlers,
} from '../services/notifications/notificationService';

const MIN_SPLASH_MS = 1400;

export function useAppBootstrap(reloadKey = 0) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);

    async function bootstrap() {
      const startedAt = Date.now();

      try {
        await databaseService.initialize();

        await useUserProfileStore.getState().loadProfileState();
        await usePrivacyStore.getState().loadPrivacyState();
        await useAccountStore.getState().loadAccounts();
        await useSettingsStore.getState().loadSettings();
        const invalidSmsState = useSettingsStore.getState().smsInvalidStateDetected;
        if (invalidSmsState) {
          console.log('[SMS] Invalid tracking state corrected on launch');
        }
        await useReviewStore.getState().loadReviews().catch(console.error);
        await runInvestmentScheduler().catch(console.error);
        await runRecurringScheduler().catch(console.error);

        await initializeNotifications()
          .then(setupNotificationResponseHandlers)
          .catch(console.error);

        await syncSmsTracking().catch(console.error);
      } catch (error) {
        console.error(error);
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPLASH_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS - elapsed));
      }

      if (!cancelled) {
        setIsReady(true);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return isReady;
}
