import { FormScreenContainer, FormScreenContainerProps } from './FormScreenContainer';

export type OnboardingScreenProps = FormScreenContainerProps;

/** Onboarding screens use the same layout shell as the rest of the app. */
export function OnboardingScreen(props: OnboardingScreenProps) {
  return <FormScreenContainer {...props} />;
}
