import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachmarksScreen } from '../screens/onboarding/CoachmarksScreen';
import { FirstAccountSetupScreen } from '../screens/onboarding/FirstAccountSetupScreen';
import { OnboardingPostRestoreScreen } from '../screens/onboarding/OnboardingPostRestoreScreen';
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen';
import { PinSetupScreen } from '../screens/onboarding/PinSetupScreen';
import { SetupMethodScreen } from '../screens/onboarding/SetupMethodScreen';
import { SmsTrackingSetupScreen } from '../screens/onboarding/SmsTrackingSetupScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import {
  OperationSuccessScreen,
  OperationSuccessStackParams,
} from '../screens/shared/OperationSuccessScreen';
import { stackScreenOptions, successScreenOptions } from './stackScreenOptions';

export type OnboardingStackParamList = {
  Welcome: undefined;
  SetupMethod: undefined;
  ProfileSetup: undefined;
  PinSetup: { mode?: 'onboarding' | 'migration' } | undefined;
  FirstAccountSetup: { mode?: 'onboarding' | 'migration' } | undefined;
  SmsTrackingSetup: undefined;
  OperationSuccess: OperationSuccessStackParams['OperationSuccess'];
  OnboardingPostRestore: undefined;
  Coachmarks: { smsTrackingStatus?: 'enabled' | 'skipped' } | undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SetupMethod"
        component={SetupMethodScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PinSetup"
        component={PinSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FirstAccountSetup"
        component={FirstAccountSetupScreen}
        options={{ title: 'First Account', headerBackVisible: false }}
      />
      <Stack.Screen
        name="SmsTrackingSetup"
        component={SmsTrackingSetupScreen}
        options={{ title: 'SMS Tracking', headerBackVisible: false }}
      />
      <Stack.Screen
        name="OperationSuccess"
        component={OperationSuccessScreen}
        options={successScreenOptions}
      />
      <Stack.Screen
        name="OnboardingPostRestore"
        component={OnboardingPostRestoreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Coachmarks"
        component={CoachmarksScreen}
        options={{ title: "You're All Set", headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
