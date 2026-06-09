import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryWithStats } from '../database/types';
import { formatCurrency } from '../utils/currency';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { Card } from './Card';

type CategoryCardProps = {
  category: CategoryWithStats;
  onPress?: () => void;
  onDelete?: () => void;
};

export function CategoryCard({ category, onPress, onDelete }: CategoryCardProps) {
  const progress =
    category.budget > 0 ? Math.min(category.spent / category.budget, 1) : 0;
  const remaining = category.budget - category.spent;
  const overBudget = remaining < 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.card}>
        <View style={[styles.accent, { backgroundColor: category.color }]} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${category.color}18` },
              ]}
            >
              <Text style={styles.icon}>{category.icon}</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {category.name}
              </Text>
              <Text style={styles.spent}>
                {formatCurrency(category.spent)} spent this month
              </Text>
              {category.accountName && (
                <View style={styles.accountRow}>
                  <Ionicons name="wallet-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.accountName}>{category.accountName}</Text>
                </View>
              )}
            </View>

            {onDelete && (
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deletePressed,
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            )}
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: overBudget ? colors.danger : category.color,
                },
              ]}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.limitLabel}>
              Limit: {formatCurrency(category.budget)}
            </Text>
            <Text
              style={[
                styles.remaining,
                { color: overBudget ? colors.danger : colors.success },
              ]}
            >
              {overBudget ? 'Over by ' : 'Left '}
              {formatCurrency(Math.abs(remaining))}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  card: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  spent: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  accountName: {
    fontSize: 12,
    color: colors.textMuted,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger}10`,
  },
  deletePressed: {
    opacity: 0.7,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  remaining: {
    fontSize: 13,
    fontWeight: '600',
  },
});
