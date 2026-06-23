import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const ONBOARDING_ACCOUNT_ID_KEY = '@paisatrack/onboardingAccountId';
const ONBOARDING_ACCOUNT_CREATED_KEY = '@paisatrack/onboardingAccountCreated';

type OnboardingStore = {
  onboardingAccountId: string | null;
  onboardingAccountCreated: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setOnboardingAccount: (accountId: string) => Promise<void>;
  clearOnboardingAccount: () => Promise<void>;
};

async function readOnboardingAccountId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ONBOARDING_ACCOUNT_ID_KEY);
  } catch {
    return null;
  }
}

async function readOnboardingAccountCreated(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_ACCOUNT_CREATED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  onboardingAccountId: null,
  onboardingAccountCreated: false,
  hydrated: false,

  hydrate: async () => {
    const [onboardingAccountId, onboardingAccountCreated] = await Promise.all([
      readOnboardingAccountId(),
      readOnboardingAccountCreated(),
    ]);

    set({
      onboardingAccountId,
      onboardingAccountCreated: onboardingAccountCreated && Boolean(onboardingAccountId),
      hydrated: true,
    });
  },

  setOnboardingAccount: async (accountId) => {
    await AsyncStorage.multiSet([
      [ONBOARDING_ACCOUNT_ID_KEY, accountId],
      [ONBOARDING_ACCOUNT_CREATED_KEY, 'true'],
    ]);
    set({
      onboardingAccountId: accountId,
      onboardingAccountCreated: true,
    });
  },

  clearOnboardingAccount: async () => {
    await AsyncStorage.multiRemove([
      ONBOARDING_ACCOUNT_ID_KEY,
      ONBOARDING_ACCOUNT_CREATED_KEY,
    ]);
    set({
      onboardingAccountId: null,
      onboardingAccountCreated: false,
    });
  },
}));
