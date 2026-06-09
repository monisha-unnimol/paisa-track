import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { AddTransactionFab } from '../../components/AddTransactionFab';
import { Card } from '../../components/Card';
import { DELETE_DIALOG_COPY, SUCCESS_COPY } from '../../constants/dialogCopy';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TransactionCard } from '../../components/TransactionCard';
import { TransactionsStackParamList } from '../../navigation/TransactionsStackNavigator';
import { formatCurrency } from '../../utils/currency';
import { useTransactionStore } from '../../store/useTransactionStore';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'TransactionsList'>;

type DeleteTarget = { id: string; title: string };

export function TransactionsScreen({ navigation }: Props) {
  const {
    transactions,
    loading,
    loadTransactions,
    removeTransaction,
    getTotalIncome,
    getTotalExpenses,
  } = useTransactionStore();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const groupedByDate = transactions.reduce<Record<string, typeof transactions>>(
    (groups, tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
      return groups;
    },
    {},
  );

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    await removeTransaction(deleteTarget.id);
    setDeleteTarget(null);
    navigateToOperationSuccess(navigation, {
      title: SUCCESS_COPY.transactionDeleted.title,
      message: SUCCESS_COPY.transactionDeleted.message,
      listRoute: 'TransactionsList',
    });
  };

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();

  return (
    <>
      <ConfirmationModal
        visible={deleteTarget !== null}
        title={DELETE_DIALOG_COPY.transaction.title}
        message={
          deleteTarget ? DELETE_DIALOG_COPY.transaction.message(deleteTarget.title) : ''
        }
        confirmLabel={DELETE_DIALOG_COPY.transaction.confirmLabel}
        cancelLabel={DELETE_DIALOG_COPY.transaction.cancelLabel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    <View style={styles.wrapper}>
      <ScreenContainer scrollable={transactions.length > 0}>
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>Income, expenses & statements</Text>
        </View>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              +{formatCurrency(totalIncome)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              -{formatCurrency(totalExpenses)}
            </Text>
          </Card>
        </View>

        {loading && transactions.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : transactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>
              Record income or expenses to update balances and category spending.
            </Text>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dayTransactions = groupedByDate[date];
            const dayExpenses = dayTransactions
              .filter((tx) => tx.type === 'expense')
              .reduce((sum, tx) => sum + tx.amount, 0);

            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>
                    {new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  {dayExpenses > 0 && (
                    <Text style={styles.dateTotal}>
                      -{formatCurrency(dayExpenses)}
                    </Text>
                  )}
                </View>
                <View style={styles.list}>
                  {dayTransactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onPress={() =>
                        navigation.navigate('TransactionForm', {
                          transactionId: transaction.id,
                        })
                      }
                      onDelete={() =>
                        handleDelete(transaction.id, transaction.title)
                      }
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScreenContainer>

      <AddTransactionFab
        onSelectType={(type) => navigation.navigate('TransactionForm', { type })}
      />
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dateGroup: {
    marginTop: spacing.sm,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.expense,
  },
  list: {
    gap: spacing.sm,
  },
});
