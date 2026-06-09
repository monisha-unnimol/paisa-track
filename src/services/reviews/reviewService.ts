import { databaseService } from '../../database';
import { CreateReviewRequestInput, ReviewRequest } from '../../database/types';
import { useReviewStore } from '../../store/useReviewStore';
import { SmsTransactionDraft } from '../../store/useSmsDraftStore';
import { formatCurrency } from '../../utils/currency';

export async function createReviewRequest(
  input: CreateReviewRequestInput,
): Promise<ReviewRequest> {
  return useReviewStore.getState().createReview(input);
}

export async function createSmsTransactionReview(
  draft: SmsTransactionDraft,
  summary: string,
  smsKey: string,
): Promise<ReviewRequest> {
  const existingBySms = await databaseService.findPendingReviewBySmsKey(smsKey);
  if (existingBySms) {
    return existingBySms;
  }

  const existing = await databaseService.findPendingReviewByDraftId(draft.id);
  if (existing) {
    return existing;
  }

  return createReviewRequest({
    title: draft.type === 'income' ? 'Income Review' : 'SMS Transaction Review',
    description: summary,
    type: draft.type === 'income' ? 'income' : 'sms_transaction',
    source: draft.sender,
    reviewData: {
      draftId: draft.id,
      smsKey,
      amount: draft.amount,
      transactionType: draft.type,
      title: draft.title,
      accountHint: draft.accountHint,
    },
  });
}

export async function createInvestmentReview(input: {
  investmentId: string;
  name: string;
  amount: number;
  accountName: string;
}): Promise<ReviewRequest> {
  return createReviewRequest({
    title: 'Investment Review',
    description: `${input.name} — ${formatCurrency(input.amount)} scheduled from ${input.accountName}.`,
    type: 'investment',
    source: 'investment_scheduler',
    reviewData: input,
  });
}

export async function createRecurringExpenseReview(input: {
  recurringExpenseId: string;
  name: string;
  amount: number;
}): Promise<ReviewRequest> {
  return createReviewRequest({
    title: 'Recurring Payment Review',
    description: `${input.name} — ${formatCurrency(input.amount)} is due soon.`,
    type: 'recurring_expense',
    source: 'recurring_scheduler',
    reviewData: input,
  });
}

/** Marks a review approved after the linked transaction is saved. */
export async function completePendingReview(options: {
  reviewId?: string;
  draftId?: string;
}): Promise<void> {
  const { reviewId, draftId } = options;

  if (reviewId) {
    const review = await databaseService.getReviewRequestById(reviewId);
    if (review?.status === 'pending') {
      await useReviewStore.getState().approveReview(reviewId);
    }
    return;
  }

  if (draftId) {
    const review = await databaseService.findPendingReviewByDraftId(draftId);
    if (review) {
      await useReviewStore.getState().approveReview(review.id);
    }
  }
}

export function getReviewTypeLabel(type: string): string {
  switch (type) {
    case 'sms_transaction':
      return 'SMS Transaction';
    case 'investment':
      return 'Investment';
    case 'recurring_expense':
      return 'Recurring Payment';
    case 'auto_expense':
      return 'Auto-detected Expense';
    case 'income':
      return 'Income';
    default:
      return 'Review';
  }
}
