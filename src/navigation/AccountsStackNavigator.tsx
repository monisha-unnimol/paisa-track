import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { AccountFormScreen } from '../screens/accounts/AccountFormScreen';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { OperationSuccessScreen } from '../screens/shared/OperationSuccessScreen';
import { useTabStackResetOnBlur } from '../hooks/useTabStackResetOnBlur';
import { OperationSuccessParams } from '../navigation/operationSuccess';
import { formScreenOptions, stackScreenOptions, successScreenOptions } from './stackScreenOptions';

export type AccountsStackParamList = {
  AccountsList: undefined;
  AccountForm: { accountId?: string };
  OperationSuccess: OperationSuccessParams;
};

const Stack = createNativeStackNavigator<AccountsStackParamList>();

function AccountsStackNavigatorInner() {
  const navigation = useNavigation();
  useTabStackResetOnBlur(
    navigation as NavigationProp<ParamListBase>,
    'AccountsList',
    'Accounts',
  );

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="AccountsList"
        component={AccountsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccountForm"
        component={AccountFormScreen}
        options={({ route }) => ({
          ...formScreenOptions,
          title: route.params.accountId ? 'Account Details' : 'Add Account',
          headerBackVisible: false,
        })}
      />
      <Stack.Screen
        name="OperationSuccess"
        component={OperationSuccessScreen}
        options={successScreenOptions}
      />
    </Stack.Navigator>
  );
}

export function AccountsStackNavigator() {
  return <AccountsStackNavigatorInner />;
}
