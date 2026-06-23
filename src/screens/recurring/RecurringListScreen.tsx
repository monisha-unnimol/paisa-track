import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { AddRecurringFab, RecurringItemType } from '../../components/AddRecurringFab';
import { Card } from '../../components/Card';
import { RecurringItemCard } from '../../components/RecurringItemCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SegmentedControl } from '../../components/SegmentedControl';
import {
  DELETE_DIALOG_COPY,
  ERROR_COPY,
  SUCCESS_COPY,
} from '../../constants/dialogCopy';
import { getRecurringEmptyState } from '../../constants/recurringEmptyStates';
import { RecurringStackParamList } from '../../navigation/RecurringStackNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { runInvestmentScheduler } from '../../services/investments/investmentScheduler';
import { runRecurringScheduler } from '../../services/recurring/recurringScheduler';
import { useAccountStore } from '../../store/useAccountStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { useRecurringExpenseStore } from '../../store/useRecurringExpenseStore';
import { useModalStore } from '../../store/useModalStore';
import { formatCurrency } from '../../utils/currency';
import {
  RecurringSegment,
  mergeRecurringItems,
} from '../../utils/recurringListHelpers';
import { getTotalMonthlyInvestments } from '../../utils/investmentHelpers';
import { getTotalMonthlyRecurring } from '../../utils/recurringHelpers';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<RecurringStackParamList, 'RecurringList'>;

type DeleteTarget = {
  kind: 'investment' | 'expense';
  id: string;
  name: string;
};

const SEGMENT_OPTIONS: Array<{ value: RecurringSegment; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'investments', label: 'Investments' },
  { value: 'expenses', label: 'Expenses' },
];

export function RecurringListScreen({ navigation }: Props) {
  const {
    investments,
    loading: investmentsLoading,
    hasLoaded: investmentsLoaded,
    loadInvestments,
    removeInvestment,
  } = useInvestmentStore();
  const {
    recurringExpenses,
    loading: expensesLoading,
    hasLoaded: expensesLoaded,
    loadRecurringExpenses,
    removeRecurringExpense,
  } = useRecurringExpenseStore();
  const { loadAccounts, accounts } = useAccountStore();
  const { loadCategories } = useCategoryStore();
  const showError = useModalStore((state) => state.showError);

  const [segment, setSegment] = useState<RecurringSegment>('all');
  const [searchText, setSearchText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [accountRequiredVisible, setAccountRequiredVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function refresh() {
        loadAccounts();
        loadCategories();
        await Promise.all([loadInvestments(), loadRecurringExpenses()]);
        if (!active) return;
        await runInvestmentScheduler().catch(console.error);
        if (!active) return;
        await runRecurringScheduler().catch(console.error);
      }

      refresh().catch(console.error);

      return () => {
        active = false;
      };
    }, [loadAccounts, loadCategories, loadInvestments, loadRecurringExpenses]),
  );

  const items = useMemo(
    () => mergeRecurringItems(investments, recurringExpenses, segment, searchText),
    [investments, recurringExpenses, segment, searchText],
  );

  const totalMonthlyInvestments = getTotalMonthlyInvestments(investments);
  const totalMonthlyExpenses = getTotalMonthlyRecurring(recurringExpenses);
  const upcomingInvestments = investments.filter(
    (item) => item.isActive && item.status === 'upcoming',
  ).length;
  const upcomingExpenses = recurringExpenses.filter(
    (item) => item.isActive && item.status === 'upcoming',
  ).length;

  const awaitingInitialLoad = !investmentsLoaded || !expensesLoaded;
  const showInitialLoading =
    awaitingInitialLoad &&
    (investmentsLoading || expensesLoading) &&
    items.length === 0;

  const emptyState = getRecurringEmptyState(segment, searchText.trim().length > 0);
  const isSearchEmpty =
    searchText.trim().length > 0 && items.length === 0 && !showInitialLoading;
  const showSummary = items.length > 0;

  const navigateToRecurringForm = (type: RecurringItemType) => {
    if (type === 'investment') {
      navigation.navigate('InvestmentForm', {});
      return;
    }
    navigation.navigate('RecurringExpenseForm', {});
  };

  const openAddSelector = () => {
    if (accounts.length === 0) {
      setAccountRequiredVisible(true);
      return;
    }
    setSelectorVisible(true);
  };

  const handleSelectRecurringType = (type: RecurringItemType) => {
    if (accounts.length === 0) {
      setAccountRequiredVisible(true);
      return;
    }
    navigateToRecurringForm(type);
  };

  const handleEmptyAction = () => {
    switch (emptyState.action) {
      case 'clear_search':
        setSearchText('');
        break;
      case 'add_investment':
        handleSelectRecurringType('investment');
        break;
      case 'add_expense':
        handleSelectRecurringType('expense');
        break;
      default:
        openAddSelector();
        break;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const deleted =
        deleteTarget.kind === 'investment'
          ? await removeInvestment(deleteTarget.id)
          : await removeRecurringExpense(deleteTarget.id);

      if (!deleted) {
        showError(
          deleteTarget.kind === 'investment'
            ? ERROR_COPY.investmentDeleteFailed.title
            : ERROR_COPY.recurringDeleteFailed.title,
          deleteTarget.kind === 'investment'
            ? ERROR_COPY.investmentDeleteFailed.message
            : ERROR_COPY.recurringDeleteFailed.message,
        );
        return;
      }

      setDeleteTarget(null);
      navigateToOperationSuccess(navigation, {
        title:
          deleteTarget.kind === 'investment'
            ? SUCCESS_COPY.investmentDeleted.title
            : SUCCESS_COPY.recurringDeleted.title,
        message:
          deleteTarget.kind === 'investment'
            ? SUCCESS_COPY.investmentDeleted.message
            : SUCCESS_COPY.recurringDeleted.message,
        listRoute: 'RecurringList',
      });
    } catch {
      setDeleteTarget(null);
      showError(
        deleteTarget.kind === 'investment'
          ? ERROR_COPY.investmentDeleteFailed.title
          : ERROR_COPY.recurringDeleteFailed.title,
        deleteTarget.kind === 'investment'
          ? ERROR_COPY.investmentDeleteFailed.message
          : ERROR_COPY.recurringDeleteFailed.message,
      );
    }
  };

  return (
    <>
      <ConfirmationModal
        visible={accountRequiredVisible}
        title={ERROR_COPY.accountRequired.title}
        message={ERROR_COPY.accountRequired.message}
        confirmLabel="Create Account"
        cancelLabel="Cancel"
        icon="wallet-outline"
        onConfirm={() => {
          setAccountRequiredVisible(false);
          navigation.getParent()?.navigate('Accounts', {
            screen: 'AccountForm',
            params: {},
          });
        }}
        onCancel={() => setAccountRequiredVisible(false)}
      />

      <ConfirmationModal
        visible={deleteTarget !== null}
        title={
          deleteTarget?.kind === 'investment'
            ? DELETE_DIALOG_COPY.investment.title
            : DELETE_DIALOG_COPY.recurring.title
        }
        message={
          deleteTarget?.kind === 'investment'
            ? DELETE_DIALOG_COPY.investment.message()
            : DELETE_DIALOG_COPY.recurring.message()
        }
        confirmLabel={
          deleteTarget?.kind === 'investment'
            ? DELETE_DIALOG_COPY.investment.confirmLabel
            : DELETE_DIALOG_COPY.recurring.confirmLabel
        }
        cancelLabel={
          deleteTarget?.kind === 'investment'
            ? DELETE_DIALOG_COPY.investment.cancelLabel
            : DELETE_DIALOG_COPY.recurring.cancelLabel
        }
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <View style={styles.wrapper}>
        <ScreenContainer>
          <View style={styles.header}>
            <Text style={styles.title}>Recurring</Text>
            <Text style={styles.subtitle}>
              Investments, bills, rent, EMI, and scheduled payments
            </Text>
          </View>

          <SegmentedControl
            options={SEGMENT_OPTIONS}
            value={segment}
            onChange={setSegment}
          />

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search recurring items..."
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {showSummary && (
            <Card variant="primary" style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Recurring Overview</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Investments</Text>
                  <Text style={styles.summaryItemValue}>
                    {formatCurrency(totalMonthlyInvestments)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Expenses</Text>
                  <Text style={styles.summaryItemValue}>
                    {formatCurrency(totalMonthlyExpenses)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Upcoming</Text>
                  <Text style={styles.summaryItemValue}>
                    {upcomingInvestments + upcomingExpenses}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {showInitialLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : isSearchEmpty ? (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: `${colors.textMuted}15` }]}>
                <Ionicons name="search-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptyMessage}>
                Nothing matches{' '}
                <Text style={styles.emptyQuery}>"{searchText.trim()}"</Text>. Try a different
                name or keyword.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.emptyOutlineButton,
                  pressed && styles.emptyButtonPressed,
                ]}
                onPress={() => setSearchText('')}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.emptyOutlineButtonText}>Clear search</Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: `${emptyState.accentColor}18` },
                ]}
              >
                <Ionicons name={emptyState.icon} size={32} color={emptyState.accentColor} />
              </View>
              <Text style={styles.emptyTitle}>{emptyState.title}</Text>
              <Text style={styles.emptyMessage}>{emptyState.message}</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.emptyPrimaryButton,
                  { backgroundColor: emptyState.accentColor },
                  pressed && styles.emptyButtonPressed,
                ]}
                onPress={handleEmptyAction}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyPrimaryButtonText}>{emptyState.buttonLabel}</Text>
              </Pressable>

              {emptyState.showQuickActions && (
                <View style={styles.emptyQuickActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.emptyQuickAction,
                      pressed && styles.emptyButtonPressed,
                    ]}
                    onPress={() => handleSelectRecurringType('investment')}
                  >
                    <Ionicons name="trending-up-outline" size={18} color={colors.income} />
                    <Text style={styles.emptyQuickActionText}>Investment</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.emptyQuickAction,
                      pressed && styles.emptyButtonPressed,
                    ]}
                    onPress={() => handleSelectRecurringType('expense')}
                  >
                    <Ionicons name="receipt-outline" size={18} color={colors.expense} />
                    <Text style={styles.emptyQuickActionText}>Expense</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <RecurringItemCard
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  onPress={() => {
                    if (item.kind === 'investment') {
                      navigation.navigate('InvestmentForm', { investmentId: item.id });
                    } else {
                      navigation.navigate('RecurringExpenseForm', {
                        recurringExpenseId: item.id,
                      });
                    }
                  }}
                  onDelete={() =>
                    setDeleteTarget({
                      kind: item.kind,
                      id: item.id,
                      name: item.name,
                    })
                  }
                />
              ))}
            </View>
          )}
        </ScreenContainer>

        <AddRecurringFab
          selectorVisible={selectorVisible}
          onSelectorVisibleChange={setSelectorVisible}
          onFabPress={openAddSelector}
          onSelectType={handleSelectRecurringType}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: { marginBottom: spacing.sm },
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  summaryCard: { padding: spacing.lg },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.sm,
  },
  summaryGrid: { flexDirection: 'row', gap: spacing.sm },
  summaryItem: { flex: 1 },
  summaryItemLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loader: { marginTop: spacing.xl },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.sm,
  },
  emptyQuery: {
    fontWeight: '600',
    color: colors.text,
  },
  emptyPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
    marginTop: spacing.xs,
  },
  emptyOutlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  emptyQuickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyQuickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  list: { gap: spacing.md },
});
