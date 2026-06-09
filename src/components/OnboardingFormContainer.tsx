import { OnboardingScreen, OnboardingScreenProps } from './OnboardingScreen';

/** @deprecated Use OnboardingScreen directly. */
export type OnboardingFormContainerProps = OnboardingScreenProps;

/** @deprecated Use OnboardingScreen directly. */
export function OnboardingFormContainer(props: OnboardingFormContainerProps) {
  return <OnboardingScreen {...props} />;
}
