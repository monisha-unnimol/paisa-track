import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { ERROR_COPY, SMS_COPY } from '../../constants/dialogCopy';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { isSmsListenerAvailable } from '../../services/sms/smsListenerService';
import { getSmsTrackingStatus } from '../../services/sms/smsTrackingService';
import { useModalStore } from '../../store/useModalStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingPostRestore'>;

export function OnboardingPostRestoreScreen(_props: Props) {
  const showError = useModalStore((state) => state.showError);
  const completeOnboarding = useUserProfileStore((state) => state.completeOnboarding);
  const clearOnboardingAccount = useOnboardingStore((state) => state.clearOnboardingAccount);
  const setSmsAutoTrackingEnabled = useSettingsStore((state) => state.setSmsAutoTrackingEnabled);
  const [smsPromptVisible, setSmsPromptVisible] = useState(false);
  const finishedRef = useRef(false);

  const finishOnboarding = useCallback(async () => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    await clearOnboardingAccount();
    await completeOnboarding();
  }, [clearOnboardingAccount, completeOnboarding]);

  useEffect(() => {
    let active = true;

    async function runPostRestoreChecks() {
      const smsAutoTrackingEnabled = useSettingsStore.getState().smsAutoTrackingEnabled;
      if (!smsAutoTrackingEnabled) {
        if (active) {
          await finishOnboarding();
        }
        return;
      }

      const status = await getSmsTrackingStatus();
      if (!active) {
        return;
      }

      if (status.permissionGranted) {
        await finishOnboarding();
        return;
      }

      if (Platform.OS === 'android' && isSmsListenerAvailable()) {
        setSmsPromptVisible(true);
        return;
      }

      await finishOnboarding();
    }

    runPostRestoreChecks().catch(console.error);

    return () => {
      active = false;
    };
  }, [finishOnboarding]);

  const handleEnableSms = async () => {
    setSmsPromptVisible(false);
    try {
      const result = await setSmsAutoTrackingEnabled(true);
      if (result === 'blocked') {
        showError(
          ERROR_COPY.smsPermissionBlocked.title,
          ERROR_COPY.smsPermissionBlocked.message,
        );
        Linking.openSettings();
      }
    } finally {
      await finishOnboarding();
    }
  };

  const handleSkipSms = async () => {
    setSmsPromptVisible(false);
    await finishOnboarding();
  };

  return (
    <>
      <ConfirmationModal
        visible={smsPromptVisible}
        title={SMS_COPY.restoreEnableSms.title}
        message={SMS_COPY.restoreEnableSms.message}
        confirmLabel={SMS_COPY.restoreEnableSms.confirmLabel}
        cancelLabel={SMS_COPY.restoreEnableSms.cancelLabel}
        icon="chatbubble-ellipses-outline"
        onConfirm={handleEnableSms}
        onCancel={handleSkipSms}
      />

      <OnboardingScreen centerContent useStackHeaderOffset={false}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </OnboardingScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
});
