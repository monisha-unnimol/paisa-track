import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';

/** Navigate to account details from any tab (deep links, home, search, etc.). */
export function navigateToAccountDetails(
  navigation: NavigationProp<ParamListBase>,
  accountId: string,
) {
  navigation.dispatch(
    CommonActions.navigate({
      name: 'Accounts',
      params: {
        screen: 'AccountForm',
        params: { accountId },
      },
    }),
  );
}
