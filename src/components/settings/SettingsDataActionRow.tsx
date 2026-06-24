import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type SettingsDataActionRowProps = {
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  showDivider?: boolean;
};

export function SettingsDataActionRow({
  label,
  subtitle,
  icon,
  onPress,
  disabled = false,
  loading = false,
  showDivider = false,
}: SettingsDataActionRowProps) {
  return (
    <>
      {showDivider ? <View style={styles.divider} /> : null}
      <Pressable
        style={({ pressed }) => [
          styles.row,
          (pressed || disabled) && styles.rowPressed,
          disabled && styles.rowDisabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.info}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name={icon} size={22} color={colors.primary} />
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  rowPressed: {
    opacity: 0.9,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
