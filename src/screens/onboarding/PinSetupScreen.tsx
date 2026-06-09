import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { PinEntry, PinLengthSelector, PinMatchIndicator } from '../../components/PinEntry';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SECURITY_COPY } from '../../constants/dialogCopy';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { PinLength, isValidPin } from '../../services/security/pinService';
import { usePrivacyStore } from '../../store/usePrivacyStore';
import { colors } from '../../theme/colors';
import { formStyles } from '../../theme/formStyles';
import { radius, spacing } from '../../theme/spacing';

type Props = {
  mode?: 'onboarding' | 'migration';
} & Partial<NativeStackScreenProps<OnboardingStackParamList, 'PinSetup'>>;

const ONBOARDING_COPY = {
  title: 'Secure Your App',
  subtitle: 'Create a PIN to protect balances and account details.',
} as const;

const MIGRATION_COPY = {
  title: 'Protect Your Finances',
  subtitle: 'Create a PIN to securely reveal your account balances.',
} as const;

export function PinSetupScreen(props: Props) {
  const mode = props.mode ?? props.route?.params?.mode ?? 'onboarding';
  const navigation = props.navigation;
  const setupPin = usePrivacyStore((state) => state.setupPin);
  const copy = mode === 'migration' ? MIGRATION_COPY : ONBOARDING_COPY;

  const [pinLength, setPinLength] = useState<PinLength>(4);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);
  const [lengthKey, setLengthKey] = useState(0);

  const pinsMatch = useMemo(
    () => pin.length === pinLength && confirmPin.length === pinLength && pin === confirmPin,
    [confirmPin, pin, pinLength],
  );

  const resetPins = () => {
    setPin('');
    setConfirmPin('');
    setLengthKey((current) => current + 1);
  };

  const handleContinue = async () => {
    if (!isValidPin(pin, pinLength)) {
      setDialog(SECURITY_COPY.pinRequired);
      return;
    }

    if (pin !== confirmPin) {
      setDialog(SECURITY_COPY.pinMismatch);
      resetPins();
      return;
    }

    setSaving(true);
    try {
      await setupPin(pin, pinLength);
      resetPins();

      if (mode === 'onboarding') {
        navigation?.navigate('FirstAccountSetup', { mode: 'onboarding' });
      }
    } catch {
      setDialog(SECURITY_COPY.pinSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleLengthChange = (length: PinLength) => {
    setPinLength(length);
    resetPins();
  };

  const canSubmit = pinsMatch && !saving;

  return (
    <>
      <ConfirmationModal
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        singleAction
        confirmLabel="OK"
        onConfirm={() => setDialog(null)}
      />

      <OnboardingScreen
        centerContent
        useStackHeaderOffset={false}
        footer={
          <PrimaryButton
            label={saving ? 'Saving...' : 'Continue'}
            onPress={handleContinue}
            disabled={!canSubmit}
            loading={saving}
            compact
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.securityIconWrap}>
            <Ionicons name="shield-checkmark" size={30} color={colors.primary} />
          </View>

          <ScreenHeader align="center" title={copy.title} subtitle={copy.subtitle} />

          <View style={styles.fieldBlock}>
            <PinLengthSelector value={pinLength} onChange={handleLengthChange} />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={formStyles.label}>Enter PIN</Text>
            <PinEntry
              length={pinLength}
              value={pin}
              onChange={setPin}
              focusKey={`enter-${lengthKey}`}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={formStyles.label}>Confirm PIN</Text>
            <PinEntry
              length={pinLength}
              value={confirmPin}
              onChange={setConfirmPin}
              autoFocus={false}
              focusKey={`confirm-${lengthKey}`}
            />
            <PinMatchIndicator pin={pin} confirmPin={confirmPin} length={pinLength} />
          </View>
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
  securityIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBlock: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
});
