import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { HomeScreen } from '../screens/HomeScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ReviewCenterScreen } from '../screens/reviews/ReviewCenterScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ChangePinScreen } from '../screens/settings/ChangePinScreen';
import { OperationSuccessScreen } from '../screens/shared/OperationSuccessScreen';
import { useTabStackResetOnBlur } from '../hooks/useTabStackResetOnBlur';
import { OperationSuccessParams } from '../navigation/operationSuccess';
import { formScreenOptions, stackScreenOptions, successScreenOptions } from './stackScreenOptions';

export type HomeStackParamList = {
  HomeMain: undefined;
  EditProfile: { returnRoute?: 'HomeMain' | 'Settings' } | undefined;
  Settings: undefined;
  ChangePin: undefined;
  ReviewCenter: undefined;
  OperationSuccess: OperationSuccessParams;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigatorInner() {
  const navigation = useNavigation();
  useTabStackResetOnBlur(
    navigation as NavigationProp<ParamListBase>,
    'HomeMain',
    'Home',
  );

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          ...stackScreenOptions,
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="ChangePin"
        component={ChangePinScreen}
        options={{
          ...formScreenOptions,
          title: 'Change PIN',
        }}
      />
      <Stack.Screen
        name="ReviewCenter"
        component={ReviewCenterScreen}
        options={{
          ...stackScreenOptions,
          title: 'Review Center',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          ...formScreenOptions,
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="OperationSuccess"
        component={OperationSuccessScreen}
        options={successScreenOptions}
      />
    </Stack.Navigator>
  );
}

export function HomeStackNavigator() {
  return <HomeStackNavigatorInner />;
}
