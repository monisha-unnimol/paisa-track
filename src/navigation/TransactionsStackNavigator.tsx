import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { TransactionFormScreen } from '../screens/transactions/TransactionFormScreen';
import { TransactionsScreen } from '../screens/transactions/TransactionsScreen';
import { CategoryFormScreen } from '../screens/categories/CategoryFormScreen';
import { OperationSuccessScreen } from '../screens/shared/OperationSuccessScreen';
import { TransactionType } from '../database/types';
import { CategoryFormParams } from './categoryFormParams';
import { useTabStackResetOnBlur } from '../hooks/useTabStackResetOnBlur';
import { OperationSuccessParams } from '../navigation/operationSuccess';
import { formScreenOptions, stackScreenOptions, successScreenOptions } from './stackScreenOptions';

export type TransactionsStackParamList = {
  TransactionsList: undefined;
  TransactionForm: {
    transactionId?: string;
    type?: TransactionType;
    smsDraftId?: string;
    reviewId?: string;
  };
  CategoryForm: CategoryFormParams;
  OperationSuccess: OperationSuccessParams;
};

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

function TransactionsStackNavigatorInner() {
  const navigation = useNavigation();
  useTabStackResetOnBlur(
    navigation as NavigationProp<ParamListBase>,
    'TransactionsList',
    'Statements',
  );

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="TransactionsList"
        component={TransactionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransactionForm"
        component={TransactionFormScreen}
        options={({ route }) => ({
          ...formScreenOptions,
          ...(function () {
            if (route.params?.transactionId) {
              return { title: 'Edit Transaction', headerShown: true, headerBackVisible: false };
            }
            if (route.params?.smsDraftId) {
              return { title: 'Confirm SMS Transaction', headerShown: true, headerBackVisible: false };
            }
            if (route.params?.type === 'income') {
              return { title: 'Add Income', headerShown: true, headerBackVisible: false };
            }
            return { title: 'Add Expense', headerShown: true, headerBackVisible: false };
          })(),
        })}
      />
      <Stack.Screen
        name="CategoryForm"
        component={CategoryFormScreen}
        options={({ route }) => ({
          ...formScreenOptions,
          title: route.params.categoryId ? 'Edit Spending Limit' : 'Add Spending Limit',
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

export function TransactionsStackNavigator() {
  return <TransactionsStackNavigatorInner />;
}
