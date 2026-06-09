import { StyleProp, ViewStyle } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

type OnboardingButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** @deprecated Use PrimaryButton directly. */
export function OnboardingButton(props: OnboardingButtonProps) {
  return <PrimaryButton {...props} compact />;
}
