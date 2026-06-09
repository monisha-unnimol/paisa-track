import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { getReviewTypeLabel } from '../../services/reviews/reviewService';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useReviewStore } from '../../store/useReviewStore';
import { useSmsDraftStore } from '../../store/useSmsDraftStore';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReviewCenter'>;

type ParsedReviewData = {
  draftId?: string;
  amount?: number;
  transactionType?: string;
  title?: string;
  accountHint?: string | null;
  accountName?: string;
  investmentId?: string;
  recurringExpenseId?: string;
};

function parseReviewData(raw: string): ParsedReviewData {
  try {
    return JSON.parse(raw) as ParsedReviewData;
  } catch {
    return {};
  }
}

export function ReviewCenterScreen({ navigation }: Props) {
  const { reviews, loading, loadReviews, approveReview, rejectReview, getPendingReviews } =
    useReviewStore();
  const setActiveDraft = useSmsDraftStore((state) => state.setActiveDraft);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews]),
  );

  const pendingReviews = getPendingReviews();

  const handleApprove = (reviewId: string, data: ParsedReviewData, type: string) => {
    if ((type === 'sms_transaction' || type === 'income') && data.draftId) {
      setActiveDraft(data.draftId);
      navigation.getParent()?.navigate('Statements', {
        screen: 'TransactionForm',
        params: { smsDraftId: data.draftId, reviewId },
      });
      return;
    }

    void (async () => {
      await approveReview(reviewId);

      if (type === 'investment') {
        navigation.getParent()?.navigate('Recurring');
        return;
      }

      if (type === 'recurring_expense') {
        navigation.getParent()?.navigate('Recurring');
      }
    })();
  };

  const handleReject = async (reviewId: string, data: ParsedReviewData) => {
    await rejectReview(reviewId);
    if (data.draftId) {
      useSmsDraftStore.getState().removeDraft(data.draftId);
    }
  };

  return (
    <ScreenContainer omitTopInset>
      <Text style={styles.intro}>
        Pending items stay here even if you dismiss notifications.
      </Text>

      {loading && pendingReviews.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : pendingReviews.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyText}>
            New review requests from SMS, investments, and recurring payments will appear here.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {pendingReviews.map((review) => {
            const data = parseReviewData(review.reviewData);
            const amount = data.amount ?? 0;

            return (
              <Card key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{getReviewTypeLabel(review.type)}</Text>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>

                <Text style={styles.reviewTitle}>{review.title}</Text>
                <Text style={styles.reviewDescription}>{review.description}</Text>

                <View style={styles.metaGrid}>
                  {amount > 0 && (
                    <Text style={styles.metaItem}>Amount: {formatCurrency(amount)}</Text>
                  )}
                  {data.accountHint && (
                    <Text style={styles.metaItem}>Account: {data.accountHint}</Text>
                  )}
                  {data.accountName && (
                    <Text style={styles.metaItem}>Account: {data.accountName}</Text>
                  )}
                  {review.source && (
                    <Text style={styles.metaItem}>Source: {review.source}</Text>
                  )}
                  <Text style={styles.metaItem}>Status: Pending</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(review.id, data)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.detailsButton]}
                    onPress={() => {
                      if ((review.type === 'sms_transaction' || review.type === 'income') && data.draftId) {
                        setActiveDraft(data.draftId);
                        navigation.getParent()?.navigate('Statements', {
                          screen: 'TransactionForm',
                          params: { smsDraftId: data.draftId, reviewId: review.id },
                        });
                        return;
                      }
                      if (review.type === 'investment' && data.investmentId) {
                        navigation.getParent()?.navigate('Recurring', {
                          screen: 'InvestmentForm',
                          params: { investmentId: data.investmentId },
                        });
                        return;
                      }
                      if (review.type === 'recurring_expense' && data.recurringExpenseId) {
                        navigation.getParent()?.navigate('Recurring', {
                          screen: 'RecurringExpenseForm',
                          params: { recurringExpenseId: data.recurringExpenseId },
                        });
                      }
                    }}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(review.id, data, review.type)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {reviews.some((item) => item.status !== 'pending') && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent History</Text>
          {reviews
            .filter((item) => item.status !== 'pending')
            .slice(0, 5)
            .map((review) => (
              <Card key={review.id} style={styles.historyCard}>
                <Text style={styles.historyItemTitle}>{review.title}</Text>
                <Text style={styles.historyItemStatus}>
                  {review.status === 'approved' ? 'Approved' : 'Rejected'}
                </Text>
              </Card>
            ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  reviewCard: {
    gap: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  reviewDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  metaGrid: {
    gap: 4,
  },
  metaItem: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  approveButton: {
    backgroundColor: colors.primary,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  historySection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: spacing.sm,
  },
  historyItemStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
