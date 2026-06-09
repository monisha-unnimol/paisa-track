import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { PinEntry } from '../../components/PinEntry';
import { FormScreenContainer } from '../../components/FormScreenContainer';
import { SECURITY_COPY, SUCCESS_COPY } from '../../constants/dialogCopy';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { changePin, isValidPin, PinLength } from '../../services/security/pinService';
import { usePrivacyStore } from '../../store/usePrivacyStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<HomeStackParamList, 'ChangePin'>;

export function ChangePinScreen({ navigation }: Props) {
  const pinLength = usePrivacyStore((state) => state.pinLength) ?? 4;
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);
  const [showForgotPin, setShowForgotPin] = useState(false);

  const resetFields = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleSave = async () => {
    if (!isValidPin(currentPin, pinLength)) {
      setDialog(SECURITY_COPY.currentPinRequired);
      return;
    }

    if (!isValidPin(newPin, pinLength)) {
      setDialog(SECURITY_COPY.pinRequired);
      return;
    }

    if (newPin !== confirmPin) {
      setDialog(SECURITY_COPY.pinMismatch);
      resetFields();
      return;
    }

    setSaving(true);
    try {
      const result = await changePin(currentPin, newPin, pinLength as PinLength);
      if (result === 'incorrect') {
        setDialog(SECURITY_COPY.incorrectPin);
        setCurrentPin('');
        return;
      }

      resetFields();
      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.pinUpdated.title,
        message: SUCCESS_COPY.pinUpdated.message,
        listRoute: 'Settings',
      });
    } catch {
      setDialog(SECURITY_COPY.pinSaveFailed);
    } finally {
      setSaving(false);
    }
  };

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

      <ConfirmationModal
        visible={showForgotPin}
        title={SECURITY_COPY.pinResetUnavailable.title}
        message={SECURITY_COPY.pinResetUnavailable.message}
        singleAction
        confirmLabel="OK"
        onConfirm={() => setShowForgotPin(false)}
      />

      <FormScreenContainer>
        <Text style={styles.title}>Change PIN</Text>
        <Text style={styles.subtitle}>
          Enter your current PIN, then choose a new {pinLength}-digit PIN.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current PIN</Text>
          <PinEntry length={pinLength} value={currentPin} onChange={setCurrentPin} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>New PIN</Text>
          <PinEntry length={pinLength} value={newPin} onChange={setNewPin} autoFocus={false} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Confirm New PIN</Text>
          <PinEntry
            length={pinLength}
            value={confirmPin}
            onChange={setConfirmPin}
            autoFocus={false}
          />
        </View>

        <Pressable onPress={() => setShowForgotPin(true)} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </Pressable>

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Updating...' : 'Update PIN'}</Text>
        </Pressable>
      </FormScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  section: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    alignSelf: 'flex-start',
  },
  forgotLink: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
