import { create } from 'zustand';

export type FeedbackKind =
  | 'income_added'
  | 'expense_added'
  | 'transaction_updated'
  | 'transaction_deleted';

export type FeedbackPayload = {
  kind: FeedbackKind;
  title: string;
  subtitle?: string;
};

type FeedbackStore = {
  feedback: FeedbackPayload | null;
  showFeedback: (payload: FeedbackPayload) => void;
  clearFeedback: () => void;
};

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  feedback: null,
  showFeedback: (payload) => set({ feedback: payload }),
  clearFeedback: () => set({ feedback: null }),
}));

export function feedbackForSave(
  type: 'income' | 'expense',
  isEditing: boolean,
): FeedbackPayload {
  if (isEditing) {
    return {
      kind: 'transaction_updated',
      title: 'Transaction updated',
      subtitle: 'Your changes have been saved.',
    };
  }

  if (type === 'income') {
    return {
      kind: 'income_added',
      title: 'Income added',
      subtitle: 'Your balance has been updated.',
    };
  }

  return {
    kind: 'expense_added',
    title: 'Expense added',
    subtitle: 'Your balance has been updated.',
  };
}
