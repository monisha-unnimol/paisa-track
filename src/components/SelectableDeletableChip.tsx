import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type SelectableDeletableChipProps = {
  label: string;
  icon: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  deleteAccessibilityLabel?: string;
};

export function SelectableDeletableChip({
  label,
  icon,
  color,
  selected,
  onSelect,
  onDelete,
  deleteAccessibilityLabel = 'Delete',
}: SelectableDeletableChipProps) {
  return (
    <View
      style={[
        styles.chip,
        selected && {
          borderColor: color,
          backgroundColor: `${color}15`,
        },
      ]}
    >
      <Pressable
        style={styles.selectArea}
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.emoji}>{icon}</Text>
        <Text style={[styles.label, selected && { color }]} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
      {onDelete ? (
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={deleteAccessibilityLabel}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
    minWidth: '47%',
  },
  selectArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger}10`,
  },
  deletePressed: {
    opacity: 0.85,
  },
});
