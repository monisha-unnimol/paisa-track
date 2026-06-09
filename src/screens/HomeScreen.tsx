import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { AddTransactionFab } from '../components/AddTransactionFab';
import { BalanceText } from '../components/BalanceText';
import { HomeHeader } from '../components/HomeHeader';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionCard } from '../components/TransactionCard';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { useAccountStore } from '../store/useAccountStore';
import { useInvestmentStore } from '../store/useInvestmentStore';
import { useRecurringExpenseStore } from '../store/useRecurringExpenseStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useReviewStore } from '../store/useReviewStore';
import { getReviewTypeLabel } from '../services/reviews/reviewService';
import { formatCurrency } from '../utils/currency';
import { getEarliestScheduledDate } from '../utils/recurringListHelpers';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type HomeNavigationProp = CompositeNavigationProp<
  NativeStackScreenProps<HomeStackParamList, 'HomeMain'>['navigation'],
  BottomTabNavigationProp<TabParamList>
>;

function isCurrentMonth(dateStr: string): boolean {
  const date = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function parseReviewAmount(reviewData: string): number | null {
  try {
    const parsed = JSON.parse(reviewData) as { amount?: number };
    return typeof parsed.amount === 'number' && parsed.amount > 0 ? parsed.amount : null;
  } catch {
    return null;
  }
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { accounts, loading: accountsLoading, loadAccounts, getTotalBalance } =
    useAccountStore();
  const { transactions, loading: txLoading, loadTransactions } =
    useTransactionStore();
  const {
    loadInvestments,
    getTotalMonthlyInvestments,
    getUpcomingCount,
    getNextDeductionDate,
  } = useInvestmentStore();
  const {
    loadRecurringExpenses,
    getTotalMonthlyRecurring,
    getUpcomingCount: getRecurringUpcomingCount,
    getNextDueDate,
  } = useRecurringExpenseStore();
  const { pendingCount, loadReviews, reviews } = useReviewStore();
  const pendingReviews = reviews.filter((item) => item.status === 'pending');
  const latestReview = pendingReviews[0];
  const latestReviewAmount = latestReview ? parseReviewAmount(latestReview.reviewData) : null;

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
      loadTransactions();
      loadInvestments();
      loadRecurringExpenses();
      loadReviews();
    }, [loadAccounts, loadInvestments, loadRecurringExpenses, loadReviews, loadTransactions]),
  );

  const totalBalance = getTotalBalance();

  const monthlyTransactions = useMemo(
    () => transactions.filter((tx) => isCurrentMonth(tx.date)),
    [transactions],
  );

  const monthlyIncome = useMemo(
    () =>
      monthlyTransactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthlyTransactions],
  );

  const monthlyExpenses = useMemo(
    () =>
      monthlyTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthlyTransactions],
  );

  const recentTransactions = transactions.slice(0, 5);
  const loading = accountsLoading && accounts.length === 0 && txLoading;
  const totalMonthlyInvestments = getTotalMonthlyInvestments();
  const upcomingInvestments = getUpcomingCount();
  const nextInvestmentDeduction = getNextDeductionDate();
  const totalMonthlyRecurring = getTotalMonthlyRecurring();
  const upcomingRecurring = getRecurringUpcomingCount();
  const nextRecurringDue = getNextDueDate();

  const nextScheduled = getEarliestScheduledDate(
    nextInvestmentDeduction,
    nextRecurringDue,
  );
  const isEmpty =
    accounts.length === 0 &&
    transactions.length === 0 &&
    !loading;

  return (
    <View style={styles.wrapper}>
      <ScreenContainer>
      <HomeHeader
        onEditProfile={() => navigation.navigate('EditProfile')}
        onOpenSettings={() => navigation.navigate('Settings')}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <Card variant="primary" style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <PrivacyToggle variant="light" />
            </View>
            <BalanceText amount={totalBalance} style={styles.balanceAmount} />
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatLabel}>Income</Text>
                <Text style={styles.balanceStatValue}>
                  +{formatCurrency(monthlyIncome)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatLabel}>Expenses</Text>
                <Text style={styles.balanceStatValue}>
                  -{formatCurrency(monthlyExpenses)}
                </Text>
              </View>
            </View>
          </Card>

          {pendingCount > 0 && (
            <Pressable
              onPress={() => navigation.navigate('ReviewCenter')}
              style={({ pressed }) => pressed && styles.reviewBannerPressed}
            >
              <Card style={styles.reviewBanner}>
                <View style={styles.reviewBannerTop}>
                  <View style={styles.reviewBannerIconWrap}>
                    <Ionicons name="clipboard-outline" size={22} color={colors.warning} />
                    <View style={styles.reviewBannerPulse} />
                  </View>
                  <View style={styles.reviewBannerInfo}>
                    <View style={styles.reviewBannerTitleRow}>
                      <Text style={styles.reviewBannerTitle}>Pending Reviews</Text>
                      <View style={styles.reviewBannerCountPill}>
                        <Text style={styles.reviewBannerCountText}>{pendingCount}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewBannerSubtitle}>
                      {pendingCount === 1
                        ? '1 item awaiting your action'
                        : `${pendingCount} items awaiting your action`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>

                {latestReview && (
                  <View style={styles.reviewBannerPreview}>
                    <View style={styles.reviewBannerPreviewHeader}>
                      <Text style={styles.reviewBannerPreviewType}>
                        {getReviewTypeLabel(latestReview.type)}
                      </Text>
                      {latestReviewAmount !== null && (
                        <Text style={styles.reviewBannerPreviewAmount}>
                          {formatCurrency(latestReviewAmount)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.reviewBannerPreviewTitle} numberOfLines={1}>
                      {latestReview.title}
                    </Text>
                    {latestReview.description ? (
                      <Text style={styles.reviewBannerPreviewDescription} numberOfLines={1}>
                        {latestReview.description}
                      </Text>
                    ) : null}
                  </View>
                )}

                <View style={styles.reviewBannerFooter}>
                  <Text style={styles.reviewBannerAction}>View all reviews</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.warning} />
                </View>
              </Card>
            </Pressable>
          )}

          <Pressable onPress={() => navigation.navigate('Recurring')}>
            <Card style={styles.recurringSummaryCard}>
              <View style={styles.recurringSummaryHeader}>
                <View style={styles.recurringSummaryIconWrap}>
                  <Ionicons name="repeat" size={22} color={colors.primary} />
                </View>
                <View style={styles.recurringSummaryInfo}>
                  <Text style={styles.recurringSummaryTitle}>Recurring Summary</Text>
                  <Text style={styles.recurringSummarySubtitle}>
                    Investments and scheduled expenses
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>

              <View style={styles.recurringSummaryGrid}>
                <View style={styles.recurringSummaryStat}>
                  <Text style={styles.recurringSummaryStatLabel}>Monthly Investments</Text>
                  <Text style={styles.recurringSummaryStatValue}>
                    {formatCurrency(totalMonthlyInvestments)}
                  </Text>
                </View>
                <View style={styles.recurringSummaryStat}>
                  <Text style={styles.recurringSummaryStatLabel}>Monthly Expenses</Text>
                  <Text style={styles.recurringSummaryStatValue}>
                    {formatCurrency(totalMonthlyRecurring)}
                  </Text>
                </View>
                <View style={styles.recurringSummaryStat}>
                  <Text style={styles.recurringSummaryStatLabel}>Upcoming Deductions</Text>
                  <Text style={styles.recurringSummaryStatValue}>{upcomingInvestments}</Text>
                </View>
                <View style={styles.recurringSummaryStat}>
                  <Text style={styles.recurringSummaryStatLabel}>Upcoming Bills</Text>
                  <Text style={styles.recurringSummaryStatValue}>{upcomingRecurring}</Text>
                </View>
                <View style={[styles.recurringSummaryStat, styles.recurringSummaryStatWide]}>
                  <Text style={styles.recurringSummaryStatLabel}>Next Scheduled</Text>
                  <Text style={styles.recurringSummaryStatValueSmall}>
                    {nextScheduled
                      ? new Date(`${nextScheduled}T00:00:00`).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length > 0 && (
              <Pressable
                onPress={() =>
                  navigation.navigate('Statements', { screen: 'TransactionsList' })
                }
              >
                <Text style={styles.sectionAction}>See all</Text>
              </Pressable>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>
                {isEmpty ? 'Welcome to PaisaTrack' : 'No transactions yet'}
              </Text>
              <Text style={styles.emptyText}>
                {isEmpty
                  ? 'Add an account and spending limit, then record your first transaction.'
                  : 'Your recent transactions will appear here.'}
              </Text>
              {isEmpty && (
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('Accounts')}
                >
                  <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Add Account</Text>
                </Pressable>
              )}
            </Card>
          ) : (
            <View style={styles.list}>
              {recentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() =>
                    navigation.navigate('Statements', {
                      screen: 'TransactionForm',
                      params: { transactionId: transaction.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </>
      )}
      </ScreenContainer>

      <AddTransactionFab
        onSelectType={(type) =>
          navigation.navigate('Statements', {
            screen: 'TransactionForm',
            params: { type },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  balanceCard: {
    padding: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  recurringSummaryCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  recurringSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recurringSummaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringSummaryInfo: {
    flex: 1,
  },
  recurringSummaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  recurringSummarySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recurringSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recurringSummaryStat: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
  },
  recurringSummaryStatWide: {
    width: '100%',
  },
  recurringSummaryStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  recurringSummaryStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  recurringSummaryStatValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  balanceStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 999,
    marginTop: spacing.sm,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    gap: spacing.sm,
  },
  reviewBannerPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  reviewBanner: {
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.warning}35`,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  reviewBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reviewBannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: `${colors.warning}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBannerPulse: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  reviewBannerInfo: {
    flex: 1,
    gap: 2,
  },
  reviewBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewBannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  reviewBannerCountPill: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBannerCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewBannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  reviewBannerPreview: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewBannerPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  reviewBannerPreviewType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reviewBannerPreviewAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  reviewBannerPreviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  reviewBannerPreviewDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reviewBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  reviewBannerAction: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
  },
});
