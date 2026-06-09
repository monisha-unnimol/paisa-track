import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { InvestmentFormScreen } from '../screens/investments/InvestmentFormScreen';
import { RecurringExpenseFormScreen } from '../screens/recurring/RecurringExpenseFormScreen';
import { RecurringListScreen } from '../screens/recurring/RecurringListScreen';
import { RecurringTypeSelectScreen } from '../screens/recurring/RecurringTypeSelectScreen';
import { OperationSuccessScreen } from '../screens/shared/OperationSuccessScreen';
import { useTabStackResetOnBlur } from '../hooks/useTabStackResetOnBlur';
import { OperationSuccessParams } from '../navigation/operationSuccess';
import { formScreenOptions, stackScreenOptions, successScreenOptions } from './stackScreenOptions';

export type RecurringStackParamList = {
  RecurringList: undefined;
  RecurringTypeSelect: undefined;
  InvestmentForm: { investmentId?: string };
  RecurringExpenseForm: { recurringExpenseId?: string };
  OperationSuccess: OperationSuccessParams;
};

const Stack = createNativeStackNavigator<RecurringStackParamList>();

function RecurringStackNavigatorInner() {
  const navigation = useNavigation();
  useTabStackResetOnBlur(
    navigation as NavigationProp<ParamListBase>,
    'RecurringList',
    'Recurring',
  );

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="RecurringList"
        component={RecurringListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecurringTypeSelect"
        component={RecurringTypeSelectScreen}
        options={{
          ...formScreenOptions,
          title: 'Add Recurring Item',
        }}
      />
      <Stack.Screen
        name="InvestmentForm"
        component={InvestmentFormScreen}
        options={({ route }) => ({
          ...formScreenOptions,
          title: route.params.investmentId ? 'Edit Investment' : 'Add Investment',
          headerBackVisible: false,
        })}
      />
      <Stack.Screen
        name="RecurringExpenseForm"
        component={RecurringExpenseFormScreen}
        options={({ route }) => ({
          ...formScreenOptions,
          title: route.params.recurringExpenseId
            ? 'Edit Recurring Expense'
            : 'Add Recurring Expense',
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

export function RecurringStackNavigator() {
  return <RecurringStackNavigatorInner />;
}
