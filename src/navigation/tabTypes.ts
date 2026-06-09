import { NavigatorScreenParams } from '@react-navigation/native';
import { AccountsStackParamList } from './AccountsStackNavigator';
import { TransactionsStackParamList } from './TransactionsStackNavigator';

export type TabParamList = {
  Home: undefined;
  Accounts: NavigatorScreenParams<AccountsStackParamList> | undefined;
  Categories: undefined;
  Statements: NavigatorScreenParams<TransactionsStackParamList>;
  Recurring: undefined;
};

export type StackTabName = 'Accounts' | 'Categories' | 'Statements' | 'Recurring' | 'Home';
