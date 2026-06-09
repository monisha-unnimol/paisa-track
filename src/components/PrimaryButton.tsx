import { ActivityIndicator, Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { formStyles } from '../theme/formStyles';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  compact = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        formStyles.primaryButton,
        compact && { marginTop: 0, minHeight: 48 },
        isDisabled && formStyles.primaryButtonDisabled,
        pressed && !isDisabled && { opacity: 0.92 },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={formStyles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}
