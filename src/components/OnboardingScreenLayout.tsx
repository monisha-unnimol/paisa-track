import { OnboardingScreen, OnboardingScreenProps } from './OnboardingScreen';

/** @deprecated Use OnboardingScreen directly. */
export type OnboardingScreenLayoutProps = OnboardingScreenProps;

/** @deprecated Use OnboardingScreen directly. */
export function OnboardingScreenLayout(props: OnboardingScreenProps) {
  return <OnboardingScreen {...props} />;
}
