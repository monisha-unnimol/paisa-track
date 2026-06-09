import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TransactionWithDetails } from '../database/types';
import { formatTransactionDate } from '../store/useTransactionStore';
import { formatCurrency } from '../utils/currency';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { Card } from './Card';

type TransactionCardProps = {
  transaction: TransactionWithDetails;
  onPress?: () => void;
  onDelete?: () => void;
};

export function TransactionCard({ transaction, onPress, onDelete }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? colors.income : colors.expense;
  const displayIcon = transaction.categoryIcon ?? (isIncome ? '💵' : '📋');
  const displayName = transaction.categoryName ?? (isIncome ? 'Income' : 'Uncategorized');
  const displayColor = transaction.categoryColor ?? colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.card}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${displayColor}18` },
          ]}
        >
          <Text style={styles.icon}>{displayIcon}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {transaction.title}
            </Text>
            <Text style={[styles.amount, { color: amountColor }]}>
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          <View style={styles.meta}>
            <Text style={styles.metaText}>{displayName}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{transaction.accountName}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={styles.date}>{formatTransactionDate(transaction.date)}</Text>
            </View>
            <View
              style={[
                styles.typeBadge,
                isIncome ? styles.incomeBadge : styles.expenseBadge,
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  isIncome ? styles.incomeText : styles.expenseText,
                ]}
              >
                {isIncome ? 'Income' : 'Expense'}
              </Text>
            </View>
          </View>
        </View>

        {onDelete && (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deletePressed,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        )}
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
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaDot: {
    marginHorizontal: 4,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  incomeBadge: {
    backgroundColor: `${colors.income}15`,
  },
  expenseBadge: {
    backgroundColor: `${colors.expense}12`,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  incomeText: {
    color: colors.income,
  },
  expenseText: {
    color: colors.expense,
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
});
