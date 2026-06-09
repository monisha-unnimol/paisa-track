import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  RECURRING_FREQUENCY_LABELS,
} from '../constants/recurringOptions';
import { RecurringExpenseWithDetails } from '../database/types';
import { formatCurrency } from '../utils/currency';
import { formatDeductionDayLabel } from '../utils/recurringHelpers';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { Card } from './Card';

type RecurringExpenseCardProps = {
  expense: RecurringExpenseWithDetails;
  onPress?: () => void;
  onDelete?: () => void;
};

function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RecurringExpenseCard({ expense, onPress, onDelete }: RecurringExpenseCardProps) {
  const isProcessed = expense.status === 'processed';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={[styles.accent, { backgroundColor: expense.categoryColor }]} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${expense.categoryColor}18` },
              ]}
            >
              <Text style={styles.icon}>{expense.categoryIcon}</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {expense.name}
              </Text>
              <Text style={styles.category}>{expense.categoryName}</Text>
            </View>

            {onDelete && (
              <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            )}
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={[styles.amount, { color: expense.categoryColor }]}>
              {formatCurrency(expense.amount)}
            </Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Linked Account</Text>
              <View style={styles.accountRow}>
                <Text style={styles.accountEmoji}>{expense.accountIcon}</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {expense.accountName}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Frequency</Text>
              <Text style={styles.metaValue}>
                {RECURRING_FREQUENCY_LABELS[expense.frequency]}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Deduction Date</Text>
              <Text style={styles.metaValue}>
                {formatDeductionDayLabel(expense.frequency, expense.deductionDay)}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Next Due Date</Text>
              <Text style={styles.metaValue}>{formatDisplayDate(expense.nextDueDate)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  isProcessed ? styles.statusProcessed : styles.statusUpcoming,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isProcessed ? styles.statusProcessedText : styles.statusUpcomingText,
                  ]}
                >
                  {isProcessed ? 'Processed' : 'Upcoming'}
                </Text>
              </View>
            </View>
          </View>

          {!expense.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Paused</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.96 },
  card: { overflow: 'hidden', padding: 0 },
  accent: { height: 4, width: '100%' },
  content: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  deleteButton: { padding: spacing.xs },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  amount: { fontSize: 20, fontWeight: '700' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaItem: { width: '48%', gap: 4 },
  metaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  accountEmoji: { fontSize: 14 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusUpcoming: { backgroundColor: `${colors.primary}15` },
  statusProcessed: { backgroundColor: `${colors.income}15` },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusUpcomingText: { color: colors.primaryDark },
  statusProcessedText: { color: colors.income },
  inactiveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.textMuted}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  inactiveText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
});
