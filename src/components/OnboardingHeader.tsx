import { ScreenHeader } from './ScreenHeader';

/** @deprecated Use ScreenHeader directly. */
export function OnboardingHeader(props: { title: string; subtitle: string }) {
  return <ScreenHeader {...props} align="left" />;
}
