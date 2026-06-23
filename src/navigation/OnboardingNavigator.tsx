import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachmarksScreen } from '../screens/onboarding/CoachmarksScreen';
import { FirstAccountSetupScreen } from '../screens/onboarding/FirstAccountSetupScreen';
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen';
import { PinSetupScreen } from '../screens/onboarding/PinSetupScreen';
import { SmsTrackingSetupScreen } from '../screens/onboarding/SmsTrackingSetupScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import {
  OperationSuccessScreen,
  OperationSuccessStackParams,
} from '../screens/shared/OperationSuccessScreen';
import { stackScreenOptions, successScreenOptions } from './stackScreenOptions';

export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileSetup: undefined;
  PinSetup: { mode?: 'onboarding' | 'migration' } | undefined;
  FirstAccountSetup: { mode?: 'onboarding' | 'migration' } | undefined;
  SmsTrackingSetup: undefined;
  OperationSuccess: OperationSuccessStackParams['OperationSuccess'];
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
        name="Coachmarks"
        component={CoachmarksScreen}
        options={{ title: "You're All Set", headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
