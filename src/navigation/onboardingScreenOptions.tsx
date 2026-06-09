import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { OnboardingStackHeader } from '../components/OnboardingStackHeader';

export function onboardingHeaderOptions(
  title: string,
  subtitle: string,
  extra?: NativeStackNavigationOptions,
): NativeStackNavigationOptions {
  return {
    headerBackVisible: false,
    headerTitleAlign: 'left',
    headerTitle: () => <OnboardingStackHeader title={title} subtitle={subtitle} />,
    ...extra,
  };
}
