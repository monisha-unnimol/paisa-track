import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SECURITY_COPY } from '../constants/dialogCopy';
import { usePrivacyStore } from '../store/usePrivacyStore';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { PinEntry } from './PinEntry';

const DIALOG_WIDTH = Dimensions.get('window').width * 0.88;

type PinVerificationModalProps = {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
};

export function PinVerificationModal({
  visible,
  onCancel,
  onSuccess,
  title = SECURITY_COPY.revealBalancesPin.title,
  message = SECURITY_COPY.revealBalancesPin.message,
}: PinVerificationModalProps) {
  const pinLength = usePrivacyStore((state) => state.pinLength) ?? 4;
  const verifyAndReveal = usePrivacyStore((state) => state.verifyAndReveal);
  const insets = useSafeAreaInsets();
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [inlineError, setInlineError] = useState(false);
  const [focusKey, setFocusKey] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPin('');
      setVerifying(false);
      setInlineError(false);
      return;
    }

    setPin('');
    setInlineError(false);
    setFocusKey((current) => current + 1);

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheet, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, backdrop, sheet]);

  const handlePinChange = useCallback((value: string) => {
    setPin(value);
    setInlineError(false);
  }, []);

  const handleVerify = useCallback(async () => {
    if (pin.length !== pinLength || verifying) {
      return;
    }

    setVerifying(true);
    try {
      const valid = await verifyAndReveal(pin);
      if (valid) {
        setPin('');
        onSuccess();
        return;
      }

      setPin('');
      setInlineError(true);
      setFocusKey((current) => current + 1);
    } finally {
      setVerifying(false);
    }
  }, [onSuccess, pin, pinLength, verifyAndReveal, verifying]);

  const isComplete = pin.length === pinLength;
  const canVerify = isComplete && !verifying;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onCancel}
            accessibilityLabel="Cancel PIN verification"
            accessibilityRole="button"
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.backdrop,
              {
                opacity: backdrop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.28],
                }),
              },
            ]}
          />

          <Animated.View
            style={[
              styles.dialog,
              { width: DIALOG_WIDTH },
              {
                opacity: sheet,
                transform: [
                  {
                    scale: sheet.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
            accessibilityLabel="Enter PIN"
          >
            <View style={styles.iconWrap}>
              <Ionicons name="lock-closed" size={22} color={colors.primary} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <PinEntry
              length={pinLength}
              value={pin}
              onChange={handlePinChange}
              autoFocus={visible}
              focusKey={focusKey}
              compact
              testID="pin-verify"
            />

            {inlineError ? (
              <View style={styles.errorRow} accessibilityLiveRegion="polite">
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>
                  Incorrect PIN. Please try again.
                </Text>
              </View>
            ) : (
              <View style={styles.errorPlaceholder} />
            )}

            {verifying ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.loader}
                accessibilityLabel="Verifying PIN"
              />
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={verifying}
                accessibilityLabel="Cancel PIN verification"
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.verifyButton,
                  !canVerify && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerify}
                disabled={!canVerify}
                accessibilityLabel="Verify PIN"
                accessibilityRole="button"
                accessibilityState={{ disabled: !canVerify }}
              >
                <Text style={styles.verifyText}>Verify</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    minHeight: 20,
  },
  errorPlaceholder: {
    minHeight: 20,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyButton: {
    backgroundColor: colors.primary,
  },
  verifyButtonDisabled: {
    opacity: 0.45,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  verifyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
