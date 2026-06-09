import { create } from 'zustand';

export type ModalMessage = {
  title: string;
  message: string;
};

type ModalStore = {
  error: ModalMessage | null;
  onRetry: (() => void) | null;
  showError: (title: string, message: string, onRetry?: () => void) => void;
  clearError: () => void;
};

export const useModalStore = create<ModalStore>((set) => ({
  error: null,
  onRetry: null,
  showError: (title, message, onRetry) =>
    set({ error: { title, message }, onRetry: onRetry ?? null }),
  clearError: () => set({ error: null, onRetry: null }),
}));
