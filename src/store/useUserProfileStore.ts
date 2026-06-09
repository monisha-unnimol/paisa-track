import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { databaseService } from '../database';
import { UpsertUserProfileInput, UserProfile } from '../database/types';

const ONBOARDING_KEY = '@paisatrack/hasCompletedOnboarding';

type UserProfileStore = {
  profile: UserProfile | null;
  hasCompletedOnboarding: boolean;
  hydrated: boolean;
  loadProfileState: () => Promise<void>;
  saveProfile: (input: UpsertUserProfileInput) => Promise<UserProfile>;
  completeOnboarding: () => Promise<void>;
  getDisplayName: () => string;
};

async function readFlag(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch {
    return false;
  }
}

async function writeFlag(key: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(key, value ? 'true' : 'false');
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  hasCompletedOnboarding: false,
  hydrated: false,

  loadProfileState: async () => {
    const [profile, hasCompletedOnboarding] = await Promise.all([
      databaseService.getUserProfile(),
      readFlag(ONBOARDING_KEY),
    ]);

    set({
      profile,
      hasCompletedOnboarding: hasCompletedOnboarding && Boolean(profile?.name),
      hydrated: true,
    });
  },

  saveProfile: async (input) => {
    const profile = await databaseService.upsertUserProfile(input);
    set({ profile });
    return profile;
  },

  completeOnboarding: async () => {
    await writeFlag(ONBOARDING_KEY, true);
    set({ hasCompletedOnboarding: true });
  },

  getDisplayName: () => {
    const name = get().profile?.name?.trim();
    return name || 'there';
  },
}));
