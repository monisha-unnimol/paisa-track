import { create } from 'zustand';
import {
  getStoredPinLength,
  isPinConfigured,
  PinLength,
  savePin,
  verifyPin,
} from '../services/security/pinService';

type PrivacyStore = {
  /** Session flag: true after correct PIN until app restart or user hides balances. */
  balanceVisibilityVerified: boolean;
  hasPinConfigured: boolean;
  pinLength: PinLength | null;
  hydrated: boolean;
  loadPrivacyState: () => Promise<void>;
  setupPin: (pin: string, length: PinLength) => Promise<void>;
  verifyAndReveal: (pin: string) => Promise<boolean>;
  revealBalances: () => void;
  hideBalances: () => void;
};

export const usePrivacyStore = create<PrivacyStore>((set) => ({
  balanceVisibilityVerified: false,
  hasPinConfigured: false,
  pinLength: null,
  hydrated: false,

  loadPrivacyState: async () => {
    const [configured, pinLength] = await Promise.all([
      isPinConfigured(),
      getStoredPinLength(),
    ]);

    set({
      hasPinConfigured: configured,
      pinLength,
      balanceVisibilityVerified: false,
      hydrated: true,
    });
  },

  setupPin: async (pin, length) => {
    await savePin(pin, length);
    set({
      hasPinConfigured: true,
      pinLength: length,
      balanceVisibilityVerified: false,
    });
  },

  verifyAndReveal: async (pin) => {
    const valid = await verifyPin(pin);
    if (valid) {
      set({ balanceVisibilityVerified: true });
    }
    return valid;
  },

  revealBalances: () => {
    set({ balanceVisibilityVerified: true });
  },

  hideBalances: () => {
    set({ balanceVisibilityVerified: false });
  },
}));
