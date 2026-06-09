import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SECURITY_COPY } from '../constants/dialogCopy';
import { usePrivacyStore } from '../store/usePrivacyStore';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { PinVerificationModal } from './PinVerificationModal';

type PrivacyToggleProps = {
  style?: StyleProp<ViewStyle>;
  size?: number;
  variant?: 'default' | 'light';
};

export function PrivacyToggle({ style, size = 20, variant = 'default' }: PrivacyToggleProps) {
  const balanceVisibilityVerified = usePrivacyStore(
    (state) => state.balanceVisibilityVerified,
  );
  const hideBalances = usePrivacyStore((state) => state.hideBalances);
  const [verifyVisible, setVerifyVisible] = useState(false);
  const isLight = variant === 'light';

  const handlePress = () => {
    if (balanceVisibilityVerified) {
      hideBalances();
      return;
    }
    setVerifyVisible(true);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isLight ? styles.buttonLight : styles.buttonDefault,
          pressed && styles.pressed,
          style,
        ]}
        onPress={handlePress}
        accessibilityLabel={
          balanceVisibilityVerified ? 'Hide balances' : 'Show balances'
        }
        accessibilityRole="button"
        hitSlop={8}
      >
        <Ionicons
          name={balanceVisibilityVerified ? 'eye-off-outline' : 'eye-outline'}
          size={size}
          color={isLight ? '#FFFFFF' : colors.primaryDark}
        />
      </Pressable>

      <PinVerificationModal
        visible={verifyVisible}
        onCancel={() => setVerifyVisible(false)}
        onSuccess={() => setVerifyVisible(false)}
        title={SECURITY_COPY.revealBalancesPin.title}
        message={SECURITY_COPY.revealBalancesPin.message}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDefault: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
