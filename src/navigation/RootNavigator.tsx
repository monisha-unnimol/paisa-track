import { usePrivacyStore } from '../store/usePrivacyStore';
import { useAccountStore } from '../store/useAccountStore';
import { useUserProfileStore } from '../store/useUserProfileStore';
import { FirstAccountSetupScreen } from '../screens/onboarding/FirstAccountSetupScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { PinSetupScreen } from '../screens/onboarding/PinSetupScreen';
import { TabNavigator } from './TabNavigator';

export function RootNavigator() {
  const hydrated = useUserProfileStore((state) => state.hydrated);
  const hasCompletedOnboarding = useUserProfileStore((state) => state.hasCompletedOnboarding);
  const privacyHydrated = usePrivacyStore((state) => state.hydrated);
  const hasPinConfigured = usePrivacyStore((state) => state.hasPinConfigured);
  const accounts = useAccountStore((state) => state.accounts);

  if (!hydrated || !privacyHydrated) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingNavigator />;
  }

  if (!hasPinConfigured) {
    return <PinSetupScreen mode="migration" />;
  }

  if (accounts.length === 0) {
    return <FirstAccountSetupScreen mode="migration" />;
  }

  return <TabNavigator />;
}
