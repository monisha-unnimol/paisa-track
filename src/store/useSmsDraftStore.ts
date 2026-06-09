import { create } from 'zustand';
import { ParsedBankSms } from '../services/sms/smsParser';

export type SmsTransactionDraft = {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  accountHint: string | null;
  notes: string;
  rawBody: string;
  sender: string;
  createdAt: number;
};

type SmsDraftStore = {
  drafts: Record<string, SmsTransactionDraft>;
  activeDraftId: string | null;
  saveDraft: (parsed: ParsedBankSms) => SmsTransactionDraft;
  setActiveDraft: (draftId: string | null) => void;
  getDraft: (draftId: string) => SmsTransactionDraft | null;
  removeDraft: (draftId: string) => void;
};

function createDraftId(): string {
  return `sms-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDraft(parsed: ParsedBankSms): SmsTransactionDraft {
  const id = createDraftId();
  const title = parsed.merchant ?? (parsed.type === 'credit' ? 'Bank credit' : 'Bank expense');

  return {
    id,
    type: parsed.type === 'credit' ? 'income' : 'expense',
    title,
    amount: parsed.amount,
    accountHint: parsed.accountNumber,
    notes: `Detected from SMS (${parsed.sender}). Not saved automatically.`,
    rawBody: parsed.rawBody,
    sender: parsed.sender,
    createdAt: Date.now(),
  };
}

export const useSmsDraftStore = create<SmsDraftStore>((set, get) => ({
  drafts: {},
  activeDraftId: null,

  saveDraft: (parsed) => {
    const draft = buildDraft(parsed);
    set((state) => ({
      drafts: { ...state.drafts, [draft.id]: draft },
      activeDraftId: draft.id,
    }));
    return draft;
  },

  setActiveDraft: (draftId) => set({ activeDraftId: draftId }),

  getDraft: (draftId) => get().drafts[draftId] ?? null,

  removeDraft: (draftId) =>
    set((state) => {
      const nextDrafts = { ...state.drafts };
      delete nextDrafts[draftId];
      return {
        drafts: nextDrafts,
        activeDraftId: state.activeDraftId === draftId ? null : state.activeDraftId,
      };
    }),
}));
