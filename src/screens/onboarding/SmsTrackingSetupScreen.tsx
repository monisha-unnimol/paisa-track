import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ERROR_COPY, SMS_COPY } from '../../constants/dialogCopy';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { isSmsListenerAvailable } from '../../services/sms/smsListenerService';
import { useModalStore } from '../../store/useModalStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { colors } from '../../theme/colors';
import { formStyles } from '../../theme/formStyles';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SmsTrackingSetup'>;

export function SmsTrackingSetupScreen({ navigation }: Props) {
  const showError = useModalStore((state) => state.showError);
  const setSmsAutoTrackingEnabled = useSettingsStore((state) => state.setSmsAutoTrackingEnabled);
  const [explainVisible, setExplainVisible] = useState(false);
  const [deniedVisible, setDeniedVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const smsAvailable = Platform.OS === 'android' && isSmsListenerAvailable();

  const continueToCompletion = (smsTrackingStatus: 'enabled' | 'skipped') => {
    navigation.navigate('Coachmarks', { smsTrackingStatus });
  };

  const handleEnablePress = () => {
    if (!smsAvailable) {
      showError(
        ERROR_COPY.smsTrackingUnavailable.title,
        ERROR_COPY.smsTrackingUnavailable.message,
      );
      return;
    }
    setExplainVisible(true);
  };

  const handleConfirmEnable = async () => {
    setExplainVisible(false);
    setEnabling(true);
    try {
      const result = await setSmsAutoTrackingEnabled(true);
      if (result === 'enabled') {
        setSuccessVisible(true);
        return;
      }

      if (result === 'blocked') {
        showError(
          ERROR_COPY.smsPermissionBlocked.title,
          ERROR_COPY.smsPermissionBlocked.message,
        );
        Linking.openSettings();
        return;
      }

      setDeniedVisible(true);
    } finally {
      setEnabling(false);
    }
  };

  const handleRetryPermission = async () => {
    setDeniedVisible(false);
    setEnabling(true);
    try {
      const result = await setSmsAutoTrackingEnabled(true);
      if (result === 'enabled') {
        setSuccessVisible(true);
        return;
      }

      if (result === 'blocked') {
        showError(
          ERROR_COPY.smsPermissionBlocked.title,
          ERROR_COPY.smsPermissionBlocked.message,
        );
        Linking.openSettings();
        return;
      }

      setDeniedVisible(true);
    } finally {
      setEnabling(false);
    }
  };

  return (
    <>
      <ConfirmationModal
        visible={explainVisible}
        title={SMS_COPY.onboardingEnableExplanation.title}
        message={SMS_COPY.onboardingEnableExplanation.message}
        confirmLabel={SMS_COPY.onboardingEnableExplanation.confirmLabel}
        cancelLabel={SMS_COPY.onboardingEnableExplanation.cancelLabel}
        icon="chatbubble-ellipses-outline"
        onConfirm={handleConfirmEnable}
        onCancel={() => setExplainVisible(false)}
      />

      <ConfirmationModal
        visible={deniedVisible}
        title={SMS_COPY.onboardingPermissionDenied.title}
        message={SMS_COPY.onboardingPermissionDenied.message}
        confirmLabel={SMS_COPY.onboardingPermissionDenied.retryLabel}
        cancelLabel={SMS_COPY.onboardingPermissionDenied.continueLabel}
        icon="alert-circle-outline"
        onConfirm={handleRetryPermission}
        onCancel={() => {
          setDeniedVisible(false);
          continueToCompletion('skipped');
        }}
      />

      <ConfirmationModal
        visible={successVisible}
        title={SMS_COPY.onboardingEnabled.title}
        message={SMS_COPY.onboardingEnabled.message}
        confirmLabel={SMS_COPY.onboardingEnabled.confirmLabel}
        singleAction
        icon="checkmark-circle-outline"
        onConfirm={() => {
          setSuccessVisible(false);
          continueToCompletion('enabled');
        }}
      />

      <OnboardingScreen
        centerContent
        useStackHeaderOffset
        footer={
          <View style={styles.footer}>
            <PrimaryButton
              label="Enable SMS Tracking"
              onPress={handleEnablePress}
              disabled={!smsAvailable || enabling}
              loading={enabling}
              compact
            />
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
              onPress={() => continueToCompletion('skipped')}
              disabled={enabling}
              accessibilityRole="button"
              accessibilityLabel="Skip SMS tracking for now"
            >
              <Text style={styles.secondaryButtonText}>Skip For Now</Text>
            </Pressable>
          </View>
        }
      >
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={34} color={colors.primary} />
          </View>

          <ScreenHeader
            align="center"
            title="Automatic Transaction Detection"
            subtitle="Automatically detect bank transaction messages and create review requests so you can quickly add expenses and income."
          />

          <Text style={[formStyles.hint, styles.privacyNote]}>
            Your messages are processed only on your device.
          </Text>

          {!smsAvailable && (
            <Text style={[formStyles.hint, styles.unavailableNote]}>
              SMS tracking is available on Android release builds only. You can enable it later
              from Settings.
            </Text>
          )}
        </View>
      </OnboardingScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    alignSelf: 'stretch',
    width: '100%',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyNote: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
  },
  unavailableNote: {
    textAlign: 'center',
    color: colors.warning,
    fontWeight: '600',
    maxWidth: 320,
  },
  footer: {
    gap: spacing.sm,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
  },
  secondaryPressed: {
    opacity: 0.9,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
